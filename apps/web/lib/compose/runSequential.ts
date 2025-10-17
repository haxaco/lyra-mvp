// apps/web/lib/compose/runSequential.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { TrackBlueprint, ComposeConfig } from "@lyra/sdk";
import { createPresignedGetUrl, uploadFromUrl } from "@/lib/r2";
import { generateMurekaTrackFromBlueprint } from "@/lib/mureka"; // you already use something similar
import { safeBlueprint } from "@/lib/ai/safe";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type GeneratePlaylistInput = {
  organizationId: string;
  userId: string;
  locationId?: string | null; // optional
  config: ComposeConfig;       // normalized compose config you got back
  blueprints: TrackBlueprint[]; // from composer (already safe ideally)
  r2Bucket?: string;            // optional override; else from env
};

export type GeneratePlaylistResult = {
  ok: boolean;
  playlistId?: string;
  tracks?: Array<{
    id: string;
    title?: string;
    duration_seconds: number;
    r2_key: string;
    mp3_url?: string;  // presigned for quick test
    flac_url?: string; // presigned for quick test
  }>;
  error?: string;
};

export async function runSequentialPlaylistGeneration(
  input: GeneratePlaylistInput
): Promise<GeneratePlaylistResult> {
  const supabase = sb();

  // 1) Create empty playlist
  const playlistName =
    input.config.playlistTitle || `AI Playlist – ${new Date().toLocaleString()}`;

  const { data: playlistRow, error: plErr } = await supabase
    .from("playlists")
    .insert({
      organization_id: input.organizationId,
      location_id: input.locationId ?? null,
      name: playlistName,
      schedule: null,
    })
    .select("id")
    .single();

  if (plErr || !playlistRow?.id) {
    return { ok: false, error: `Failed to create playlist: ${plErr?.message || "unknown"}` };
  }

  const playlistId = playlistRow.id as string;
  const trackResults: GeneratePlaylistResult["tracks"] = [];

  // 2) Generate one song at a time, serialize
  for (let i = 0; i < input.blueprints.length; i++) {
    const bp = safeBlueprint(input.blueprints[i], {
      bannedTerms: [], // already handled upstream; keep empty here
      familyFriendly: input.config.familyFriendly,
      allowExplicit: !!input.config.allowExplicit,
    });

    // 2a) Call Mureka and get urls (mp3 + flac)
    // Your helper should implement an internal poll until 'succeeded' OR directly use the provided URL (as you tested).
    const gen = await generateMurekaTrackFromBlueprint({
      model: bp.model || input.config.model || "auto",
      prompt: bp.prompt,
      lyrics: bp.lyrics,
      durationSec: bp.durationSec,
    });

    if (!gen?.choices?.length) {
      return { ok: false, error: `Mureka returned no choices for track ${i}` };
    }

    // Prefer index 0; you can randomize or accept multiple if you want
    const choice = gen.choices[0];
    const mp3Url = choice.url;
    const flacUrl = choice.flac_url;

    if (!mp3Url) {
      return { ok: false, error: `No mp3 url for track ${i}` };
    }

    // 2b) Upload both to R2
    const baseKey = `org_${input.organizationId}/playlist_${playlistId}/track_${i}`;
    const mp3Key = `${baseKey}.mp3`;
    const flacKey = flacUrl ? `${baseKey}.flac` : undefined;

    // using your previously working fetch→R2 upload helper
    await uploadFromUrl(mp3Url, mp3Key, { contentType: "audio/mpeg" });
    if (flacUrl && flacKey) {
      await uploadFromUrl(flacUrl, flacKey, { contentType: "audio/flac" });
    }

    // 2c) Insert track row in DB
    const { data: trackRow, error: trErr } = await supabase
      .from("tracks")
      .insert({
        organization_id: input.organizationId,
        job_id: null,
        title: bp.title || `Track ${i + 1}`,
        duration_seconds: Math.round((choice.duration ?? bp.durationSec ?? 180) / 1000),
        genre: bp.genre,
        energy: bp.energy,
        r2_key: mp3Key,
        sample_rate: 44,
        bitrate_kbps: 256,
        watermark: false,
      })
      .select("id, r2_key")
      .single();

    if (trErr || !trackRow?.id) {
      return { ok: false, error: `DB error inserting track ${i}: ${trErr?.message || "unknown"}` };
    }

    const trackId = trackRow.id as string;

    // 2d) Append to playlist_items (position = i)
    const { error: itemErr } = await supabase.from("playlist_items").insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: i,
    });

    if (itemErr) {
      return { ok: false, error: `DB error inserting playlist_item ${i}: ${itemErr.message}` };
    }

    // 2e) For testing: presign URLs so UI can play immediately
    const presignedMp3 = await createPresignedGetUrl(mp3Key, 3600);
    const presignedFlac = flacKey ? await createPresignedGetUrl(flacKey, 3600) : undefined;

    trackResults.push({
      id: trackId,
      title: bp.title,
      duration_seconds:
        Math.round((choice.duration ?? bp.durationSec ?? 180) / 1000),
      r2_key: mp3Key,
      mp3_url: presignedMp3,
      flac_url: presignedFlac,
    });
  }

  return { ok: true, playlistId, tracks: trackResults };
}
