import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabase = supabaseAdmin();
    
    // Get all playlists that don't have config data yet
    const { data: playlists, error: playlistsError } = await supabase
      .from("playlists")
      .select("id, name, created_at")
      .is("config", null);
    
    if (playlistsError) {
      throw playlistsError;
    }
    
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    
    console.log(`Found ${playlists?.length || 0} playlists without config data`);
    
    // For each playlist, try to find the associated job
    for (const playlist of playlists || []) {
      try {
        // Look for jobs that might be related to this playlist
        // We'll search by playlist name patterns and creation time proximity
        const playlistDate = new Date(playlist.created_at);
        const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
        
        // Search for playlist generation jobs around the playlist creation time
        const { data: jobs, error: jobsError } = await supabase
          .from("generation_jobs")
          .select("id, params, created_at")
          .eq("kind", "playlist.generate")
          .gte("created_at", new Date(playlistDate.getTime() - timeWindow).toISOString())
          .lte("created_at", new Date(playlistDate.getTime() + timeWindow).toISOString())
          .order("created_at", { ascending: false });
        
        if (jobsError) {
          console.error(`Error fetching jobs for playlist ${playlist.id}:`, jobsError);
          errors++;
          continue;
        }
        
        // Try to match by name similarity or find the closest job
        let matchedJob = null;
        
        if (jobs && jobs.length > 0) {
          // First try to match by name similarity
          const playlistNameLower = playlist.name.toLowerCase();
          matchedJob = jobs.find(job => {
            const jobTitle = job.params?.config?.playlistTitle?.toLowerCase();
            return jobTitle && playlistNameLower.includes(jobTitle);
          });
          
          // If no name match, use the closest job by time
          if (!matchedJob) {
            matchedJob = jobs[0]; // Already ordered by created_at desc
          }
        }
        
        if (matchedJob && matchedJob.params?.config) {
          // Update the playlist with config and job_id
          const { error: updateError } = await supabase
            .from("playlists")
            .update({
              config: matchedJob.params.config,
              job_id: matchedJob.id
            })
            .eq("id", playlist.id);
          
          if (updateError) {
            console.error(`Failed to update playlist ${playlist.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated playlist ${playlist.id} (${playlist.name}) with job ${matchedJob.id}`);
            updated++;
          }
        } else {
          console.log(`No matching job found for playlist ${playlist.id} (${playlist.name})`);
          skipped++;
        }
        
      } catch (error) {
        console.error(`Error processing playlist ${playlist.id}:`, error);
        errors++;
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `Processed ${playlists?.length || 0} playlists: ${updated} updated, ${skipped} skipped, ${errors} errors`,
      updated,
      skipped,
      errors,
      total: playlists?.length || 0
    });
    
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
