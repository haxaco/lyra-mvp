import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";
import { insertJobEvent } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "No org in session" }, { status: 401 });
    }

    const { id: jobId } = await params;

    const { data: job, error: fetchErr } = await supa
      .from("generation_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("organization_id", orgId)
      .single();

    if (fetchErr) {
      throw fetchErr;
    }

    if (!job) {
      return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    }

    if (["succeeded", "failed"].includes(job.status)) {
      return NextResponse.json(
        { ok: false, error: `Job is already ${job.status}` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supa
      .from("generation_jobs")
      .update({
        status: "failed",
        finished_at: nowIso,
        error: "Manually failed from SDK test UI",
      })
      .eq("id", jobId)
      .eq("organization_id", orgId);

    if (updateErr) {
      throw updateErr;
    }

    await insertJobEvent({
      jobId,
      organizationId: orgId,
      type: "log",
      payload: {
        message: "Job manually marked as failed via SDK test page",
        at: nowIso,
      },
    });

    return NextResponse.json({
      ok: true,
      jobId,
      status: "failed",
      finished_at: nowIso,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

