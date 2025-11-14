import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";
import { insertJobEvent, getJobById } from "@/lib/db";
import { onChildFinishedUpdateParent, checkAndDispatchNextChild } from "@/lib/jobs/runner";

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

    // If this is a child job, trigger scheduler to pick up next job
    if (job.parent_job_id) {
      try {
        await onChildFinishedUpdateParent(job.parent_job_id);
        await checkAndDispatchNextChild(job.parent_job_id);
        console.log(`[Cancel ${jobId}] Triggered scheduler for parent ${job.parent_job_id}`);
      } catch (error) {
        console.error(`[Cancel ${jobId}] Failed to trigger scheduler:`, error);
        // Don't fail the request if scheduler trigger fails
      }
    }
    // Note: For standalone jobs, the worker will pick up the next job automatically

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

