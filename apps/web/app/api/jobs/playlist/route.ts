/**
 * POST /api/jobs/playlist
 * Create a playlist generation job (multiple tracks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserAndOrg } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';
import { emitEvent } from '@/lib/jobs/runner';
import { startJob } from '@/lib/jobs/runner';
import { UnauthorizedError } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user and organization
    const { userId, organizationId } = await getUserAndOrg();
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    // Validate required fields
    const { lyrics, model = 'auto', n = 2, prompt, reference_id, vocal_id, melody_id, stream = false } = body;
    
    if (!lyrics) {
      return NextResponse.json(
        { error: 'Missing required field: lyrics' },
        { status: 400 }
      );
    }
    
    // Validate n parameter (1-10 tracks for playlists)
    const trackCount = Math.min(Math.max(1, Number(n)), 10);
    
    // Prepare job parameters
    const jobParams = {
      lyrics,
      model,
      n: trackCount,
      prompt,
      reference_id,
      vocal_id,
      melody_id,
      stream: model !== 'mureka-o1' ? stream : false, // Disable stream for o1 model
    };
    
    // Note: We don't need to lookup model_id from database since:
    // 1. Model names are dynamic and come from the Mureka API
    // 2. The actual model name is stored in the params field
    // 3. model_id is a legacy field that we can set to null
    const supabase = getSupabaseAdmin();
    const modelId = null; // Always null since we use dynamic model names from API
    
    // Create parent job
    const { data: parentJob, error: parentError } = await supabase
      .from('generation_jobs')
      .insert([{
        organization_id: organizationId,
        user_id: userId,
        model_id: modelId, // Use actual model ID or null
        status: 'queued',
        item_count: trackCount,
        completed_count: 0,
        progress_pct: 0,
        prompt: prompt || null,
        params: jobParams,
        started_at: new Date().toISOString(),
      }])
      .select('id')
      .single();
    
    if (parentError) {
      console.error('Failed to create parent job:', parentError);
      return NextResponse.json(
        { error: 'Failed to create playlist job' },
        { status: 500 }
      );
    }
    
    const parentId = parentJob.id;
    
    // Emit queued event for parent
    await emitEvent(parentId, organizationId, 'queued', {
      message: 'Playlist generation job queued',
      params: jobParams,
      track_count: trackCount
    });
    
    // Create child jobs - group tracks efficiently
    const childJobs = [];
    const tracksPerJob = Math.min(trackCount, 3); // Mureka can generate up to 3 tracks per request
    
    // Calculate how many child jobs we need
    const numChildJobs = Math.ceil(trackCount / tracksPerJob);
    
    for (let i = 0; i < numChildJobs; i++) {
      const tracksInThisJob = Math.min(tracksPerJob, trackCount - (i * tracksPerJob));
      
      const { data: childJob, error: childError } = await supabase
        .from('generation_jobs')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          model_id: modelId, // Use actual model ID or null
          parent_job_id: parentId,
          status: 'queued',
          item_count: tracksInThisJob,
          completed_count: 0,
          progress_pct: 0,
          prompt: prompt || null,
          params: { ...jobParams, n: tracksInThisJob }, // Each child can generate multiple tracks
          started_at: new Date().toISOString(),
        }])
        .select('id')
        .single();
      
      if (childError) {
        console.error(`Failed to create child job ${i}:`, childError);
        return NextResponse.json(
          { error: 'Failed to create child job' },
          { status: 500 }
        );
      }
      
      childJobs.push(childJob.id);
      
      // Emit queued event for child
      await emitEvent(childJob.id, organizationId, 'queued', {
        message: `Track batch ${i + 1} queued (${tracksInThisJob} tracks)`,
        parent_job_id: parentId,
        track_batch: i + 1,
        tracks_in_batch: tracksInThisJob
      });
    }
    
    // Start child jobs processing asynchronously
    childJobs.forEach((childId, index) => {
      setTimeout(() => {
        startJob(childId).catch(error => {
          console.error(`[Child Job ${childId}] Failed to start:`, error);
        });
      }, index * 1000); // Stagger child jobs by 1 second each
    });
    
    return NextResponse.json({
      job_id: parentId,
      child_ids: childJobs,
      message: `Playlist generation job created with ${trackCount} tracks`
    });
    
  } catch (error) {
    console.error('Playlist generation API error:', error);
    
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
