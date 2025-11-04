import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const resolvedParams = await params;
    
    // Filter by both id and organization_id to ensure RLS compliance and prevent "Cannot coerce" errors
    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .select("id, name, location_id, schedule, created_at, config, job_id, track_count, total_duration_seconds, album_cover_r2_key")
      .eq("id", resolvedParams.id)
      .eq("organization_id", orgId)
      .single();
    
    // Handle case where playlist doesn't exist or doesn't belong to user's org
    if (pErr) {
      // Check if it's a "not found" error (PGRST116 = no rows returned)
      if (pErr.code === 'PGRST116' || pErr.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        return NextResponse.json({ ok:false, error:"Playlist not found" }, { status: 404 });
      }
      throw pErr;
    }

    if (!playlist) {
      return NextResponse.json({ ok:false, error:"Playlist not found" }, { status: 404 });
    }

    const { data: items, error: itErr } = await supa
      .from("playlist_items")
      .select("position, track_id, tracks ( id, title, duration_seconds, r2_key, created_at, meta, blueprint )")
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

