import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .select("id, name, location_id, schedule, created_at")
      .eq("id", resolvedParams.id)
      .single();
    if (pErr) throw pErr;

    const { data: items, error: itErr } = await supa
      .from("playlist_items")
      .select("position, track_id, tracks ( id, title, duration_seconds, r2_key, created_at, meta )")
      .eq("playlist_id", resolvedParams.id)
      .order("position", { ascending: true });
    if (itErr) throw itErr;

    return NextResponse.json({ ok:true, playlist, items });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json().catch(() => ({}));
    const updates: any = {};
    if (typeof body?.name === "string") updates.name = body.name;
    if (body?.schedule !== undefined) updates.schedule = body.schedule;

    if (Object.keys(updates).length) {
      const { error: uErr } = await supa.from("playlists").update(updates).eq("id", resolvedParams.id);
      if (uErr) throw uErr;
    }

    if (Array.isArray(body?.trackIds)) {
      // Reset items: delete then reinsert with new order
      const { error: dErr } = await supa.from("playlist_items").delete().eq("playlist_id", resolvedParams.id);
      if (dErr) throw dErr;

      const items = body.trackIds.map((trackId: string, idx: number) => ({
        playlist_id: resolvedParams.id,
        track_id: trackId,
        position: idx,
      }));
      if (items.length) {
        const { error: iErr } = await supa.from("playlist_items").insert(items);
        if (iErr) throw iErr;
      }
    }

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    const { error } = await supa.from("playlists").delete().eq("id", resolvedParams.id);
    if (error) throw error;

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

