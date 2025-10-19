import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabase = supabaseAdmin();
    
    // Get all playlists
    const { data: allPlaylists, error: playlistsError } = await supabase
      .from("playlists")
      .select("id, name");
    
    if (playlistsError) {
      throw playlistsError;
    }
    let updated = 0;
    let errors = 0;
    
    // Update stats for each playlist
    for (const playlist of allPlaylists || []) {
      const { error: statsErr } = await supabase.rpc('update_playlist_stats', {
        playlist_uuid: playlist.id
      });
      
      if (statsErr) {
        console.error(`Failed to update stats for playlist ${playlist.id}:`, statsErr);
        errors++;
      } else {
        console.log(`Updated stats for playlist ${playlist.id} (${playlist.name})`);
        updated++;
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `Updated ${updated} playlists, ${errors} errors`,
      updated,
      errors,
      total: allPlaylists.length
    });
    
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
