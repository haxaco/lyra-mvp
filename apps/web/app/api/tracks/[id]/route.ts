import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, flac_r2_key, created_at, meta")
      .eq("id", resolvedParams.id)
      .single();
    if (error) throw error;

    return NextResponse.json({ ok:true, item: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const { error } = await supa.from("tracks").delete().eq("id", resolvedParams.id);
    if (error) throw error;

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

