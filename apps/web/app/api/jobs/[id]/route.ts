import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const { data: job, error: jobErr } = await supa
      .from("generation_jobs")
      .select("*")
      .eq("id", resolvedParams.id)
      .eq("organization_id", orgId)
      .single();
    
    if (jobErr) throw jobErr;

    return NextResponse.json({ ok: true, job });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}