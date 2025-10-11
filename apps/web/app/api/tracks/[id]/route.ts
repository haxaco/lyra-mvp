import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, flac_r2_key, created_at, meta")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ ok:true, item: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    // RLS will allow only org-admin/owner deletes if policy is set that way
    const { error } = await supa
      .from("tracks")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

