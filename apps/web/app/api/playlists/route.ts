import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSessionOrgId } from "@/lib/org";

type CreatePlaylistBody = {
  name: string;
  trackIds: string[];       // ordered; we will store with positions
  locationId?: string | null;
  schedule?: any | null;
};

export async function GET() {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const supa = supabaseServer();
    const { data, error } = await supa
      .from("playlists")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Optionally add track_count via separate query (simple MVP: skip or compute client-side)
    return NextResponse.json({ ok:true, items: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getSessionOrgId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const body = await req.json() as CreatePlaylistBody;
    if (!body?.name || !Array.isArray(body.trackIds)) {
      return NextResponse.json({ ok:false, error:"Missing name or trackIds" }, { status: 400 });
    }

    const supa = supabaseServer();

    // Create playlist
    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .insert([{ organization_id: orgId, name: body.name, location_id: body.locationId ?? null, schedule: body.schedule ?? null }])
      .select("id, name, created_at")
      .single();

    if (pErr) throw pErr;

    // Insert items with position
    const items = body.trackIds.map((trackId, idx) => ({
      playlist_id: playlist.id,
      track_id: trackId,
      position: idx,
    }));

    if (items.length > 0) {
      const { error: iErr } = await supa.from("playlist_items").insert(items);
      if (iErr) throw iErr;
    }

    return NextResponse.json({ ok:true, playlistId: playlist.id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

