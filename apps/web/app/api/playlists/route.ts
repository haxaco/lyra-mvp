import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

type CreatePlaylistBody = {
  name: string;
  trackIds: string[];
  locationId?: string | null;
  schedule?: any | null;
};

export async function GET() {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const { data, error } = await supa
      .from("playlists")
      .select("id, name, created_at, track_count, total_duration_seconds, config, job_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    return NextResponse.json({ ok:true, items: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const body = await req.json() as CreatePlaylistBody;
    if (!body?.name || !Array.isArray(body.trackIds)) {
      return NextResponse.json({ ok:false, error:"Missing name or trackIds" }, { status: 400 });
    }

    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .insert([{ organization_id: orgId, name: body.name, location_id: body.locationId ?? null, schedule: body.schedule ?? null }])
      .select("id")
      .single();
    if (pErr) throw pErr;

    const items = body.trackIds.map((trackId, idx) => ({
      playlist_id: playlist.id,
      track_id: trackId,
      position: idx,
    }));
    if (items.length) {
      const { error: iErr } = await supa.from("playlist_items").insert(items);
      if (iErr) throw iErr;
      
      // Update playlist stats with real calculated values
      const { error: statsErr } = await supa.rpc('update_playlist_stats', {
        playlist_uuid: playlist.id
      });
      if (statsErr) {
        console.warn('Failed to update playlist stats:', statsErr);
        // Don't fail the request, just log the warning
      }
    }

    return NextResponse.json({ ok:true, playlistId: playlist.id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

