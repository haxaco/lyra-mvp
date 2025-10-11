import { NextResponse } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

export async function GET() {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, flac_r2_key, created_at, meta")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    return NextResponse.json({ ok:true, items: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

