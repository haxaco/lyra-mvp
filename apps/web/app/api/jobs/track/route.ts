/**
 * POST /api/jobs/track
 * Create a single track generation job
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
    const { lyrics, model = 'auto', n = 1, prompt, reference_id, vocal_id, melody_id, stream = false } = body;
    
    if (!lyrics) {
      return NextResponse.json(
        { error: 'Missing required field: lyrics' },
        { status: 400 }
      );
    }
    
    // Validate n parameter (should be 1 for single track)
    const trackCount = Math.min(Math.max(1, Number(n)), 1);
    
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
    
    // Create job in database
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert([{
        organization_id: organizationId,
        user_id: userId,
        model_id: modelId, // Use actual model ID or null
        status: 'queued',
        item_count: 1,
        completed_count: 0,
        progress_pct: 0,
        prompt: prompt || null,
        params: jobParams,
        started_at: new Date().toISOString(),
      }])
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Failed to create job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }
    
    const jobId = job.id;
    
    // Emit queued event
    await emitEvent(jobId, organizationId, 'queued', {
      message: 'Track generation job queued',
      params: jobParams
    });
    
    // Start job processing asynchronously
    setTimeout(() => {
      startJob(jobId).catch(error => {
        console.error(`[Job ${jobId}] Failed to start:`, error);
      });
    }, 0);
    
    return NextResponse.json({
      job_id: jobId,
      message: 'Track generation job created successfully'
    });
    
  } catch (error) {
    console.error('Track generation API error:', error);
    
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
