import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabase = supabaseAdmin();
    
    // Get all tracks with duration_seconds > 1000 (likely stored in milliseconds)
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, duration_seconds")
      .gt("duration_seconds", 1000);
    
    if (tracksError) {
      throw tracksError;
    }
    
    let updated = 0;
    let errors = 0;
    
    // Update duration for each track (convert milliseconds to seconds)
    for (const track of tracks || []) {
      const newDuration = Math.round(track.duration_seconds / 1000);
      
      const { error: updateErr } = await supabase
        .from("tracks")
        .update({ duration_seconds: newDuration })
        .eq("id", track.id);
      
      if (updateErr) {
        console.error(`Failed to update track ${track.id}:`, updateErr);
        errors++;
      } else {
        console.log(`Updated track ${track.id}: ${track.duration_seconds}ms -> ${newDuration}s`);
        updated++;
      }
    }
    
    // Update all playlist stats after fixing track durations
    const { data: allPlaylists, error: playlistsError } = await supabase
      .from("playlists")
      .select("id, name");
    
    if (playlistsError) {
      throw playlistsError;
    }
    
    let playlistStatsUpdated = 0;
    for (const playlist of allPlaylists || []) {
      const { error: statsErr } = await supabase.rpc('update_playlist_stats', {
        playlist_uuid: playlist.id
      });
      
      if (statsErr) {
        console.error(`Failed to update playlist stats for ${playlist.id}:`, statsErr);
      } else {
        playlistStatsUpdated++;
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `Updated ${updated} tracks, ${errors} errors. Updated ${playlistStatsUpdated} playlist stats.`,
      tracksUpdated: updated,
      trackErrors: errors,
      playlistStatsUpdated
    });
    
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
