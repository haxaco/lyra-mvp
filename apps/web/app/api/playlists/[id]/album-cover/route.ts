import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";
import { generateAlbumCoverFromConfig } from "@/lib/ai/albumCoverGenerator";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok: false, error: "No org in session" }, { status: 401 });

    const resolvedParams = await params;
    
    // Get playlist with config
    const { data: playlist, error: pErr } = await supa
      .from("playlists")
      .select("id, name, config")
      .eq("id", resolvedParams.id)
      .eq("organization_id", orgId)
      .single();
    
    if (pErr || !playlist) {
      return NextResponse.json({ ok: false, error: "Playlist not found" }, { status: 404 });
    }

    if (!playlist.config) {
      return NextResponse.json({ ok: false, error: "Playlist config not found" }, { status: 400 });
    }

    // Generate album cover
    const result = await generateAlbumCoverFromConfig(
      playlist.config,
      orgId,
      playlist.id
    );

    // Update playlist with album cover
    const { error: updateErr } = await supa
      .from("playlists")
      .update({
        album_cover_r2_key: result.r2Key
      })
      .eq("id", playlist.id);

    if (updateErr) {
      throw new Error(`Failed to update playlist: ${updateErr.message}`);
    }

    return NextResponse.json({ 
      ok: true, 
      albumCover: {
        r2Key: result.r2Key,
        prompt: result.prompt
      }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
