import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

export async function GET() {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    const { data: org, error: oErr } = await supa
      .from("organizations")
      .select("id, name, created_at")
      .eq("id", orgId)
      .single();
    if (oErr) throw oErr;

    const { data: locations, error: lErr } = await supa
      .from("locations")
      .select("id, name, timezone, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (lErr) throw lErr;

    return NextResponse.json({ ok:true, org, locations });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

