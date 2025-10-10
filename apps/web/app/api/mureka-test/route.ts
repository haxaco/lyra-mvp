import { NextRequest, NextResponse } from "next/server";
import { r2Put, r2PublicUrl, r2SignGet } from "@/lib/r2";

const API_BASE = "https://api.mureka.ai";

type MurekaTask =
  | { id: string; status: string; [k: string]: any }
  | { error?: { message: string }, [k: string]: any };

async function pollTask(taskId: string, token: string, maxSec = 180) {
  const started = Date.now();
  while (Date.now() - started < maxSec * 1000) {
    const res = await fetch(`${API_BASE}/v1/song/query/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data: any = await res.json();
    const status = (data.status || "").toLowerCase();

    if (status === "finished" || status === "succeeded" || status === "success" || status === "completed") {
      return data;
    }
    if (status === "failed" || data.error) {
      throw new Error(data?.error?.message ?? `Generation failed: ${status}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Timeout waiting for Mureka to finish");
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.MUREKA_API_KEY;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing MUREKA_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      prompt = "ambient, calm, coffee shop background, instrumental, no vocals",
      lyrics = "[Instrumental only]",
      model = "auto",
    } = body || {};

    // Kick off generation
    const genRes = await fetch(`${API_BASE}/v1/song/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, lyrics, model }),
    });

    if (!genRes.ok) {
      const text = await genRes.text();
      return NextResponse.json({ ok: false, error: `Generate failed: ${text}` }, { status: 502 });
    }

    const gen = await genRes.json() as MurekaTask;
    // @ts-ignore
    const taskId = (gen as any).id;
    if (!taskId) return NextResponse.json({ ok: false, error: "No task id from Mureka" }, { status: 502 });

    const result = await pollTask(taskId, token);

    // Common field candidates for audio URL (adjust if API differs)
    const audioUrl: string | undefined =
      result.audio_url || result.stream_url || result.url || result.download_url;

    if (!audioUrl) {
      return NextResponse.json({ ok: false, error: "No audio URL in Mureka result", result }, { status: 500 });
    }

    // Fetch audio bytes from Mureka
    const audioResp = await fetch(audioUrl);
    if (!audioResp.ok) {
      const t = await audioResp.text();
      return NextResponse.json({ ok: false, error: `Audio fetch failed: ${t}` }, { status: 502 });
    }
    const arrayBuf = await audioResp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const contentType = audioResp.headers.get("content-type") || "audio/mpeg";

    // Upload to R2
    const key = `test/mureka_${Date.now()}.mp3`;
    await r2Put(key, buf, contentType);

    // Prefer stable public URL if configured; otherwise sign a GET
    const publicUrl = r2PublicUrl(key) ?? await r2SignGet(key, 3600);

    return NextResponse.json({
      ok: true,
      taskId,
      mureka: { status: result.status, audioUrl },
      r2: { key, url: publicUrl },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

