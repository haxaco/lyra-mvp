import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    const { data, error } = await supa
      .from("generation_jobs")
      .select("id, status, error, provider, model, prompt, created_at, started_at, finished_at")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ ok:true, job: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

