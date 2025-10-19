import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabase = supabaseAdmin();
    
    // Get all tracks that don't have blueprint data yet but have a job_id
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, title, job_id, created_at")
      .is("blueprint", null)
      .not("job_id", "is", null);
    
    if (tracksError) {
      throw tracksError;
    }
    
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    
    console.log(`Found ${tracks?.length || 0} tracks without blueprint data`);
    
    // For each track, try to find the associated job and extract blueprint
    for (const track of tracks || []) {
      try {
        // Get the job details
        const { data: job, error: jobError } = await supabase
          .from("generation_jobs")
          .select("id, params, kind")
          .eq("id", track.job_id)
          .single();
        
        if (jobError || !job) {
          console.log(`No job found for track ${track.id}`);
          skipped++;
          continue;
        }
        
        // Check if this is a playlist track with blueprint data
        if (job.kind === 'track.generate' && job.params?.blueprint) {
          // Update the track with blueprint data
          const { error: updateError } = await supabase
            .from("tracks")
            .update({
              blueprint: job.params.blueprint
            })
            .eq("id", track.id);
          
          if (updateError) {
            console.error(`Failed to update track ${track.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated track ${track.id} (${track.title}) with blueprint from job ${job.id}`);
            updated++;
          }
        } else {
          console.log(`Job ${job.id} for track ${track.id} doesn't have blueprint data`);
          skipped++;
        }
        
      } catch (error) {
        console.error(`Error processing track ${track.id}:`, error);
        errors++;
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `Processed ${tracks?.length || 0} tracks: ${updated} updated, ${skipped} skipped, ${errors} errors`,
      updated,
      skipped,
      errors,
      total: tracks?.length || 0
    });
    
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
