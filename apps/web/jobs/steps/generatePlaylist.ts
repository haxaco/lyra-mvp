// apps/web/jobs/steps/generatePlaylist.ts
import { createClient } from "@supabase/supabase-js";
import { TrackBlueprint, ComposeConfig } from "@lyra/sdk";
import { uploadFromUrl, createPresignedGetUrl } from "@/lib/r2";
import { generateMurekaTrackFromBlueprint } from "@/lib/mureka";
import { safeBlueprint } from "@/lib/ai/safe";
import { JobContext, JobProgressEmitter } from "../types";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type GeneratePlaylistPayload = {
  organizationId: string;
  userId: string;
  locationId?: string | null;
  config: ComposeConfig;
  blueprints: TrackBlueprint[];
};

export type GeneratePlaylistResult = {
  playlistId: string;
  tracks: Array<{
    id: string;
    title?: string;
    duration_seconds: number;
    r2_key: string;
    mp3_url?: string;  // for test harness only
    flac_url?: string; // for test harness only
  }>;
};

export async function generatePlaylistStep(
  ctx: JobContext,
  payload: GeneratePlaylistPayload,
  emit: JobProgressEmitter
): Promise<GeneratePlaylistResult> {
  const supabase = sb();

  emit("log", { msg: "Creating playlist shell…" });
  const { data: playlistRow, error: plErr } = await supabase
    .from("playlists")
    .insert({
      organization_id: payload.organizationId,
      location_id: payload.locationId ?? null,
      name:
        payload.config.playlistTitle ||
        `AI Playlist – ${new Date().toLocaleString()}`,
      schedule: null,
      config: payload.config, // Store full ComposeConfig
      job_id: ctx.jobId, // Track which job created this playlist
    })
    .select("id")
    .single();
  if (plErr || !playlistRow?.id) throw new Error(plErr?.message || "playlist insert failed");

  const playlistId = playlistRow.id as string;
  const tracks: GeneratePlaylistResult["tracks"] = [];

  for (let i = 0; i < payload.blueprints.length; i++) {
    const bp = safeBlueprint(payload.blueprints[i], {
      bannedTerms: [], // upstream safety already applied
      familyFriendly: payload.config.familyFriendly,
      allowExplicit: !!payload.config.allowExplicit,
    });

    emit("log", { msg: `Generating track ${i + 1}/${payload.blueprints.length}…` });

    // Respect provider concurrency—caller (runner) serializes; we still await per-track
    const gen = await generateMurekaTrackFromBlueprint({
      model: bp.model || payload.config.model || "auto",
      prompt: bp.prompt,
      lyrics: bp.lyrics,
      durationSec: bp.durationSec,
    });

    if (!gen?.choices?.length || !gen.choices[0].url) {
      throw new Error(`Mureka: no mp3 url for track index ${i}`);
    }

    const choice = gen.choices[0];
    const baseKey = `org_${payload.organizationId}/playlist_${playlistId}/track_${i}`;
    const mp3Key = `${baseKey}.mp3`;
    const flacKey = choice.flac_url ? `${baseKey}.flac` : undefined;

    await uploadFromUrl(choice.url!, mp3Key, { contentType: "audio/mpeg" });
    if (choice.flac_url && flacKey) {
      await uploadFromUrl(choice.flac_url, flacKey, { contentType: "audio/flac" });
    }

    const { data: trackRow, error: trErr } = await supabase
      .from("tracks")
      .insert({
        organization_id: payload.organizationId,
        job_id: ctx.jobId ?? null,
        title: bp.title || `Track ${i + 1}`,
        duration_seconds: Math.round((choice.duration ?? bp.durationSec ?? 180) / 1000),
        genre: bp.genre,
        energy: bp.energy,
        r2_key: mp3Key,
        sample_rate: 44,
        bitrate_kbps: 256,
        watermark: false,
        blueprint: bp, // Store complete blueprint
      })
      .select("id, r2_key")
      .single();
    if (trErr || !trackRow?.id) throw new Error(trErr?.message || "track insert failed");

    const trackId = trackRow.id as string;
    const { error: itemErr } = await supabase.from("playlist_items").insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: i,
    });
    if (itemErr) throw new Error(itemErr.message);
    
    // Update playlist stats after adding each track
    const { error: statsErr } = await supabase.rpc('update_playlist_stats', {
      playlist_uuid: playlistId
    });
    if (statsErr) {
      console.warn(`Failed to update playlist stats for track ${i + 1}:`, statsErr);
      // Don't fail the job, just log the warning
    }

    // Test convenience: presign for quick audition
    const mp3 = await createPresignedGetUrl(mp3Key, 3600);
    const flac = flacKey ? await createPresignedGetUrl(flacKey, 3600) : undefined;

    tracks.push({
      id: trackId,
      title: bp.title,
      duration_seconds: Math.round((choice.duration ?? bp.durationSec ?? 180) / 1000),
      r2_key: mp3Key,
      mp3_url: mp3,
      flac_url: flac,
    });

    emit("progress", { index: i, trackId, mp3Key });
  }

  // Final playlist stats update to ensure everything is calculated correctly
  const { error: finalStatsErr } = await supabase.rpc('update_playlist_stats', {
    playlist_uuid: playlistId
  });
  if (finalStatsErr) {
    console.warn('Failed to update final playlist stats:', finalStatsErr);
  } else {
    console.log(`Final playlist stats updated for ${playlistId}`);
  }

  emit("log", { msg: "Playlist generation completed." });
  return { playlistId, tracks };
}
