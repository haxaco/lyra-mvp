import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();

    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .select("id, name, location_id, schedule, created_at")
      .eq("id", params.id)
      .single();
    if (pErr) throw pErr;

    const { data: items, error: itErr } = await supa
      .from("playlist_items")
      .select("position, track_id, tracks ( id, title, duration_seconds, r2_key, created_at, meta )")
      .eq("playlist_id", params.id)
      .order("position", { ascending: true });
    if (itErr) throw itErr;

    return NextResponse.json({ ok:true, playlist, items });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

