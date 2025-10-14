import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { r2Put, r2SignGet } from "@/lib/r2";

const API_BASE = "https://api.mureka.ai";

export async function GET() {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const { data, error } = await supa
      .from("generation_jobs")
      .select("id, provider, model, prompt, status, error, created_at, started_at, finished_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (error) throw error;

    console.log(`[jobs/GET] Retrieved ${data.length} jobs for org ${orgId}`);
    return NextResponse.json({ ok:true, jobs: data });
  } catch (e:any) {
    console.error('[jobs/GET] Error:', e);
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

// Minimal copy of the generate/poll logic; for production you can refactor into a shared module.
type MurekaChoice = { id?: string; index?: number; url?: string; flac_url?: string; duration?: number; };
type MurekaQueryResult = { id: string; status: string; model?: string; choices?: MurekaChoice[]; trace_id?: string; [k: string]: any; };
async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
async function pollTask(taskId:string, token:string, maxSec=240) {
  const start = Date.now();
  while (Date.now()-start < maxSec*1000) {
    const r = await fetch(`${API_BASE}/v1/song/query/${taskId}`, { headers:{ Authorization:`Bearer ${token}` }, cache:"no-store" });
    const data = await r.json() as MurekaQueryResult;
    const s = (data.status || "").toLowerCase();
    if (["finished","succeeded","success","completed"].includes(s)) return data;
    if (["failed","canceled","cancelled"].includes(s) || (data as any).error) throw new Error((data as any)?.error?.message ?? s);
    await sleep(3000);
  }
  throw new Error("Timeout");
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  let jobId: string | null = null;
  try {
    const { supa, orgId, userId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const token = process.env.MUREKA_API_KEY;
    if (!token) return NextResponse.json({ ok:false, error:"Missing MUREKA_API_KEY" }, { status: 500 });

    const body = await req.json().catch(()=> ({}));
    const model = body?.model ?? "auto";
    const n = Math.min(Math.max(1, Number(body?.n ?? 2)), 3);
    const lyrics = body?.lyrics ?? "[Instrumental only]";
    const reqPayload:any = { model, n, lyrics };
    // Attach optional controls respecting exclusivity
    if (body?.prompt) reqPayload.prompt = body.prompt;
    if (body?.reference_id) reqPayload.reference_id = body.reference_id;
    if (body?.vocal_id) reqPayload.vocal_id = body.vocal_id;
    if (body?.melody_id) reqPayload.melody_id = body.melody_id;
    if (body?.stream && model !== "mureka-o1") reqPayload.stream = true;

    // 1) Create generation_job row (queued)
    const admin = supabaseAdmin();
    
    // Ensure mureka provider exists and get/create model_id
    let modelId: string;
    {
      // First ensure mureka provider exists
      await admin
        .from("provider_compliance")
        .upsert([{
          id: "mureka",
          display_name: "Mureka AI",
          allowed_for_b2b: true,
          allowed_public_performance: true,
          requires_attribution: false,
          watermarking_available: true,
          notes: "AI music generation provider"
        }], { onConflict: "id" });
      
      // Then try to find existing model
      const { data: existingModel, error: findError } = await admin
        .from("models")
        .select("id")
        .eq("name", model)
        .eq("provider_id", "mureka")
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }
      
      if (existingModel) {
        modelId = existingModel.id;
      } else {
        // Create new model if it doesn't exist
        const { data: newModel, error: createError } = await admin
          .from("models")
          .insert([{
            provider_id: "mureka",
            name: model,
            version: model === "auto" ? "latest" : model.split('-')[1] || "1.0",
            enabled: true,
            default_params: {}
          }])
          .select("id")
          .single();
        
        if (createError) throw createError;
        modelId = newModel.id;
      }
    }
    
    {
      const { data, error } = await admin
        .from("generation_jobs")
        .insert([{
          organization_id: orgId,
          user_id: userId,
          model_id: modelId,
          prompt: body?.prompt ?? null,
          params: reqPayload,
          status: "queued",
          started_at: new Date().toISOString(),
        }])
        .select("id")
        .single();
      if (error) throw error;
      jobId = data.id;
    }

    // 2) Call Mureka generate
    const genRes = await fetch(`${API_BASE}/v1/song/generate`, {
      method: "POST",
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify(reqPayload),
    });
    if (!genRes.ok) {
      const txt = await genRes.text();
      await admin.from("generation_jobs").update({ status:"failed", error: txt, finished_at: new Date().toISOString() }).eq("id", jobId!);
      return NextResponse.json({ ok:false, error:`Generate failed: ${txt}`, jobId }, { status: 502 });
    }
    const gen = await genRes.json();
    const taskId = gen?.id;
    if (!taskId) throw new Error("No task id from Mureka");

    // 3) Poll completion
    const result = await pollTask(taskId, token);
    const choices = Array.isArray(result.choices) ? result.choices : [];
    const toStore = choices.slice(0, n);

    // 4) Get user info for default artist
    const { data: userData } = await supa.auth.getUser();
    const userEmail = userData?.user?.email || 'Unknown User';
    const defaultArtist = body.artist || userEmail.split('@')[0];

    // 5) Upload to R2 + insert tracks
    const uploads = await Promise.all(toStore.map(async (c, i) => {
      const safeIndex = typeof c.index === "number" ? c.index : i;
      async function fetchUp(u:string|undefined, ext:"mp3"|"flac") {
        if (!u) return null;
        const r = await fetch(u); if (!r.ok) throw new Error(`Fetch ${ext} failed`);
        const buf = Buffer.from(await r.arrayBuffer());
        const type = r.headers.get("content-type") || (ext==="flac"?"audio/flac":"audio/mpeg");
        const key = `jobs/${jobId}/mureka_${taskId}_${safeIndex}.${ext}`;
        await r2Put(key, buf, type);
        const url = await r2SignGet(key, 3600);
        return { key, url };
      }
      const [mp3, flac] = await Promise.all([ fetchUp(c.url, "mp3"), fetchUp(c.flac_url, "flac") ]);
      const durationSec = c.duration ? Math.round(c.duration/1000) : null;

      const meta = {
        provider: "mureka",
        job_id: jobId,
        task_id: taskId,
        choice_id: c.id ?? null,
        choice_index: safeIndex,
        mureka_model: result.model ?? model,
        request: reqPayload,
        source_urls: { mp3: c.url ?? null, flac: c.flac_url ?? null },
        trace_id: (result as any)?.trace_id ?? null,
      };

      const ins = await admin
        .from("tracks")
        .insert([{ 
          organization_id: orgId, 
          r2_key: mp3?.key ?? null, 
          flac_r2_key: flac?.key ?? null, 
          duration_seconds: durationSec, 
          watermark: false, 
          meta,
          artist: defaultArtist,
          mood: 'Upbeat', // Default mood for Mureka tracks
          provider_id: 'mureka'
        }])
        .select("id")
        .single();
      if (ins.error) throw ins.error;

      return { dbId: ins.data.id, mp3, flac, durationSec };
    }));

    // 6) Mark job succeeded
    await admin
      .from("generation_jobs")
      .update({ status:"succeeded", finished_at: new Date().toISOString() })
      .eq("id", jobId!);

    const elapsedMs = Date.now()-t0;
    return NextResponse.json({ ok:true, jobId, items: uploads, elapsedMs });
  } catch (e:any) {
    if (jobId) {
      const admin = supabaseAdmin();
      await admin.from("generation_jobs").update({ status:"failed", error: e.message || String(e), finished_at: new Date().toISOString() }).eq("id", jobId);
    }
    return NextResponse.json({ ok:false, error: e.message || String(e), jobId }, { status: 500 });
  }
}

