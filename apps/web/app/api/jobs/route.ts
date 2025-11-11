import { NextResponse, type NextRequest } from "next/server";
import type { ProviderId } from "@lyra/core";
import { getOrgClientAndId } from "@/lib/org";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getProvider } from "@/lib/providers";
import { runTrackJob } from "@/lib/jobs/runner";
import { createPresignedGetUrl } from "@/lib/r2";
import { env } from "@/lib/env";
import { getJobById } from "@/lib/db";

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

const PROVIDER_METADATA: Record<ProviderId, {
  displayName: string;
  compliance: {
    allowed_for_b2b: boolean;
    allowed_public_performance: boolean;
    requires_attribution: boolean;
    watermarking_available: boolean;
    notes?: string;
  };
  defaultModel: {
    name: string;
    version: string;
  };
}> = {
  mureka: {
    displayName: "Mureka AI",
    compliance: {
      allowed_for_b2b: true,
      allowed_public_performance: true,
      requires_attribution: false,
      watermarking_available: true,
      notes: "AI music generation provider",
    },
    defaultModel: {
      name: "auto",
      version: "latest",
    },
  },
  musicgpt: {
    displayName: "MusicGPT",
    compliance: {
      allowed_for_b2b: false,
      allowed_public_performance: false,
      requires_attribution: false,
      watermarking_available: false,
      notes: "Requires manual compliance approval before use in production",
    },
    defaultModel: {
      name: "musicgpt-standard",
      version: "v1",
    },
  },
  suno: {
    displayName: "Suno",
    compliance: {
      allowed_for_b2b: false,
      allowed_public_performance: false,
      requires_attribution: false,
      watermarking_available: false,
      notes: "Not yet integrated",
    },
    defaultModel: {
      name: "default",
      version: "v1",
    },
  },
  musicgen: {
    displayName: "MusicGen",
    compliance: {
      allowed_for_b2b: false,
      allowed_public_performance: false,
      requires_attribution: false,
      watermarking_available: false,
      notes: "Not yet integrated",
    },
    defaultModel: {
      name: "default",
      version: "v1",
    },
  },
};

async function ensureProviderCompliance(admin: ReturnType<typeof supabaseAdmin>, providerId: ProviderId) {
  const metadata = PROVIDER_METADATA[providerId];
  if (!metadata) return;

  await admin
    .from("provider_compliance")
    .upsert([{
      id: providerId,
      display_name: metadata.displayName,
      allowed_for_b2b: metadata.compliance.allowed_for_b2b,
      allowed_public_performance: metadata.compliance.allowed_public_performance,
      requires_attribution: metadata.compliance.requires_attribution,
      watermarking_available: metadata.compliance.watermarking_available,
      notes: metadata.compliance.notes ?? null,
    }], { onConflict: "id" });
}

async function ensureProviderModel(admin: ReturnType<typeof supabaseAdmin>, providerId: ProviderId, modelName?: string) {
  const metadata = PROVIDER_METADATA[providerId];
  const targetName = modelName || metadata?.defaultModel.name || "default";
  const targetVersion = metadata?.defaultModel.version || "v1";

  const { data: existingModel, error: findError } = await admin
    .from("models")
    .select("id")
    .eq("name", targetName)
    .eq("provider_id", providerId)
    .single();

  if (!findError && existingModel?.id) {
    return { id: existingModel.id as string, name: targetName };
  }

  if (findError && findError.code !== "PGRST116") {
    throw findError;
  }

  const { data: insertedModel, error: insertError } = await admin
    .from("models")
    .insert([{
      provider_id: providerId,
      name: targetName,
      version: targetVersion,
      enabled: true,
      default_params: {},
    }])
    .select("id")
    .single();

  if (insertError || !insertedModel?.id) {
    throw insertError || new Error("Failed to create provider model");
  }

  return { id: insertedModel.id as string, name: targetName };
}

export async function POST(req: NextRequest) {
  let jobId: string | null = null;
  const admin = supabaseAdmin();
  try {
    const { supa, orgId, userId } = await getOrgClientAndId();
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "No org in session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const providerId = (body?.provider ?? "mureka") as ProviderId;

    let provider;
    try {
      provider = getProvider(providerId);
    } catch {
      return NextResponse.json({ ok: false, error: `Unknown provider: ${providerId}` }, { status: 400 });
    }

    if (providerId === "musicgpt" && !env.ENABLE_PROVIDER_MUSICGPT) {
      return NextResponse.json({ ok: false, error: "MusicGPT provider disabled via environment flag" }, { status: 403 });
    }

    const providerEnabled = await provider.enabled();
    if (!providerEnabled) {
      return NextResponse.json({ ok: false, error: `Provider ${providerId} is not enabled` }, { status: 503 });
    }

    await ensureProviderCompliance(admin, providerId);

    const allowUnverified = (process.env.ALLOW_UNVERIFIED_PROVIDER || "").toLowerCase() === "true";
    if (providerId === "musicgpt" && !allowUnverified) {
      const { data: compliance, error: complianceError } = await admin
        .from("provider_compliance")
        .select("allowed_for_b2b")
        .eq("id", providerId)
        .single();
      if (complianceError || !compliance?.allowed_for_b2b) {
        return NextResponse.json(
          { ok: false, error: "MusicGPT provider is not approved for B2B use" },
          { status: 403 }
        );
      }
    }

    const itemCount = Math.min(Math.max(1, Number(body?.n ?? 2)), 3);
    const requestedModel = body?.model as string | undefined;
    const { id: modelId, name: modelName } = await ensureProviderModel(admin, providerId, requestedModel);

    const params = {
      ...body,
      provider: providerId,
      n: itemCount,
      model: modelName,
    };

    const { data, error: insertError } = await admin
      .from("generation_jobs")
      .insert([{
        organization_id: orgId,
        user_id: userId,
        kind: 'track.generate',
        provider: providerId,
        model: modelName,
        model_id: modelId,
        prompt: body?.prompt ?? null,
        params,
        status: "queued",
        item_count: itemCount,
        completed_count: 0,
      }])
      .select("id")
      .single();

    if (insertError || !data?.id) {
      throw insertError || new Error("Failed to create job");
    }

    jobId = data.id as string;

    await runTrackJob(jobId);

    const job = await getJobById(jobId);

    const { data: tracks, error: trackError } = await admin
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, flac_r2_key, meta")
      .eq("job_id", jobId);

    if (trackError) {
      throw trackError;
    }

    const signedTracks = tracks
      ? await Promise.all(
          tracks.map(async (track) => ({
            id: track.id,
            title: track.title,
            duration: track.duration_seconds,
            mp3Url: track.r2_key ? await createPresignedGetUrl(track.r2_key, 3600) : null,
            losslessUrl: track.flac_r2_key ? await createPresignedGetUrl(track.flac_r2_key, 3600) : null,
            meta: track.meta,
          }))
        )
      : [];

    const responseBody: Record<string, any> = {
      ok: true,
      jobId,
      job,
      tracks: signedTracks,
    };

    // Include current auth user email for convenience (used by UI default artist)
    if (supa) {
      const { data: userData } = await supa.auth.getUser();
      responseBody.user = userData?.user ? { id: userData.user.id, email: userData.user.email } : null;
    }

    return NextResponse.json(responseBody);
  } catch (e: any) {
    console.error("[jobs/POST] Error:", e);
    if (jobId) {
      try {
        await admin
          .from("generation_jobs")
          .update({
            status: "failed",
            error: e?.message || String(e),
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      } catch (updateError) {
        console.error("[jobs/POST] Failed to update job after error:", updateError);
      }
    }
    return NextResponse.json({ ok: false, error: e?.message || String(e), jobId }, { status: 500 });
  }
}

