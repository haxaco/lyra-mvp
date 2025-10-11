import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

export async function GET() {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    // RLS will scope results by org
    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, created_at, meta")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ ok:true, items: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

