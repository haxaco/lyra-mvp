import { NextRequest, NextResponse } from "next/server";
import { r2Put, r2SignGet } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const API_BASE = "https://api.mureka.ai";

type MurekaChoice = {
  id?: string;
  index?: number;
  url?: string;          // MP3
  flac_url?: string;
  duration?: number;     // ms
};

type MurekaQueryResult = {
  id: string;
  created_at?: number;
  finished_at?: number;
  model?: string;
  status: string;
  stream_url?: string;
  choices?: MurekaChoice[];
  trace_id?: string;
  [k: string]: any;
};

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function validateAndBuildBody(payload: any) {
  const model = (payload?.model ?? "auto") as string;
  const nRaw = Number.isFinite(payload?.n) ? Number(payload?.n) : 2;
  const n = Math.min(Math.max(1, nRaw), 3);

  let lyrics = (payload?.lyrics ?? "[Instrumental only]") as string;
  if (typeof lyrics !== "string" || lyrics.trim().length === 0) {
    throw new Error("Field 'lyrics' is required.");
  }
  if (lyrics.length > 3000) throw new Error("Field 'lyrics' exceeds 3000 characters.");

  const prompt = payload?.prompt as string | undefined;
  const reference_id = payload?.reference_id as string | undefined;
  const vocal_id = payload?.vocal_id as string | undefined;
  const melody_id = payload?.melody_id as string | undefined;

  const chosenControls = [prompt && "prompt", reference_id && "reference_id", vocal_id && "vocal_id", melody_id && "melody_id"].filter(Boolean) as string[];
  if (prompt && prompt.length > 1024) {
    throw new Error("Field 'prompt' exceeds 1024 characters.");
  }
  if (chosenControls.length > 1) {
    throw new Error(`Only one of {prompt, reference_id, vocal_id, melody_id} can be provided. You sent: ${chosenControls.join(", ")}`);
  }

  const stream = Boolean(payload?.stream);
  if (stream && model === "mureka-o1") {
    throw new Error("Streaming mode is not supported with model 'mureka-o1'.");
  }

  const body: Record<string, any> = { model, n, lyrics, stream };
  if (prompt) body.prompt = prompt;
  if (reference_id) body.reference_id = reference_id;
  if (vocal_id) body.vocal_id = vocal_id;
  if (melody_id) body.melody_id = melody_id;

  return body;
}

async function pollTask(taskId: string, token: string, maxSec = 240) {
  const started = Date.now();
  let tries = 0;
  while (Date.now() - started < maxSec * 1000) {
    tries++;
    console.log(`[mureka] poll #${tries} for task ${taskId}`);
    const res = await fetch(`${API_BASE}/v1/song/query/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data: MurekaQueryResult = await res.json();
    const status = (data.status || "").toLowerCase();
    console.log(`[mureka] status=${status} stream_url=${data.stream_url ? "yes" : "no"}`);

    if (status === "finished" || status === "succeeded" || status === "success" || status === "completed") {
      console.log(`[mureka] task ${taskId} done`);
      return data;
    }
    if (status === "failed" || (data as any).error) {
      console.error(`[mureka] task ${taskId} failed`, (data as any)?.error);
      throw new Error((data as any)?.error?.message ?? `Generation failed: ${status}`);
    }
    await sleep(3000);
  }
  throw new Error("Timeout waiting for Mureka to finish");
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const token = process.env.MUREKA_API_KEY;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing MUREKA_API_KEY" }, { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const orgId = (payload?.organizationId as string) || process.env.TEST_ORG_ID;
    if (!orgId) return NextResponse.json({ ok: false, error: "Missing organizationId or TEST_ORG_ID" }, { status: 400 });

    const genBody = validateAndBuildBody(payload);
    console.log(`[mureka] generate start`, { model: genBody.model, n: genBody.n, orgId });

    const genRes = await fetch(`${API_BASE}/v1/song/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(genBody),
    });

    if (!genRes.ok) {
      const text = await genRes.text();
      console.error(`[mureka] generate failed`, text);
      return NextResponse.json({ ok: false, error: `Generate failed: ${text}` }, { status: 502 });
    }

    const gen = await genRes.json() as any;
    const taskId = gen?.id;
    if (!taskId) {
      console.error(`[mureka] no task id returned`);
      return NextResponse.json({ ok: false, error: "No task id from Mureka" }, { status: 502 });
    }
    console.log(`[mureka] task id = ${taskId}`);

    const result = await pollTask(taskId, token);
    const choices = Array.isArray(result.choices) ? result.choices : [];
    if (choices.length === 0) {
      console.error(`[mureka] no choices in result`);
      return NextResponse.json({ ok: false, error: "No choices in Mureka result", result }, { status: 500 });
    }

    const toStore = choices.slice(0, genBody.n);

    const uploads = await Promise.all(
      toStore.map(async (choice, i) => {
        const safeIndex = typeof choice.index === "number" ? choice.index : i;

        async function fetchAndUpload(srcUrl: string | undefined, ext: "mp3" | "flac") {
          if (!srcUrl) return null;
          const resp = await fetch(srcUrl);
          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(`Audio fetch failed for ${ext} choice ${safeIndex}: ${t}`);
          }
          const arrayBuf = await resp.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          const contentType = resp.headers.get("content-type") || (ext === "flac" ? "audio/flac" : "audio/mpeg");
          const key = `test/mureka_${taskId}_${safeIndex}.${ext}`;
          await r2Put(key, buf, contentType);
          const url = await r2SignGet(key, 3600);
          return { key, url };
        }

        const [mp3, flac] = await Promise.all([
          fetchAndUpload(choice.url, "mp3"),
          fetchAndUpload(choice.flac_url, "flac"),
        ]);

        // Persist to DB (service role)
        const durationSec = choice.duration ? Math.round(choice.duration / 1000) : null;
        const meta = {
          provider: "mureka",
          task_id: taskId,
          choice_id: choice.id ?? null,
          choice_index: safeIndex,
          mureka_model: result.model ?? genBody.model,
          request: genBody,
          source_urls: {
            mp3: choice.url ?? null,
            flac: choice.flac_url ?? null,
          },
          trace_id: (result as any)?.trace_id ?? null,
        };

        const supabase = supabaseAdmin();
        const insertRes = await supabase
          .from("tracks")
          .insert([{
            organization_id: orgId,
            r2_key: mp3?.key ?? null,
            flac_r2_key: flac?.key ?? null,
            duration_seconds: durationSec,
            title: null,
            genre: null,
            energy: null,
            sample_rate: null,
            bitrate_kbps: null,
            watermark: false,
            meta,
          }])
          .select("id, r2_key, flac_r2_key, duration_seconds, created_at")
          .single();

        if (insertRes.error) {
          console.error("[mureka] DB insert error", insertRes.error);
          throw new Error(insertRes.error.message);
        }

        return {
          db: insertRes.data,
          r2Mp3: mp3,
          r2Flac: flac,
          durationMs: choice.duration ?? null,
          id: choice.id ?? null,
          index: safeIndex,
        };
      })
    );

    const elapsedMs = Date.now() - t0;
    console.log(`[mureka] complete task ${taskId} in ${Math.round(elapsedMs/1000)}s`);

    return NextResponse.json({
      ok: true,
      taskId,
      count: uploads.length,
      items: uploads,
      elapsedMs,
    });
  } catch (err: any) {
    console.error(`[mureka] error`, err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
