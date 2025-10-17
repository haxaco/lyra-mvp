// apps/web/lib/jobs/enqueue.ts
import { getSupabaseAdmin } from '../db';
import { emitEvent, startJob } from './runner';

export type JobType = 'track.generate' | 'playlist.generate';

export async function enqueueJob(
  type: JobType,
  payload: any,
  options: {
    organizationId: string;
    userId: string;
    parentJobId?: string;
  }
): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  // Insert job into database
  const { data: job, error } = await supabase
    .from('generation_jobs')
    .insert([{
      organization_id: options.organizationId,
      user_id: options.userId,
      parent_job_id: options.parentJobId || null,
      model_id: null, // Dynamic model names from API
      status: 'queued',
      kind: type, // Set the job kind
      item_count: type === 'playlist.generate' ? payload.blueprints?.length || 1 : 1,
      completed_count: 0,
      progress_pct: 0,
      concurrency_limit: 1, // Always 1 for playlist generation
      prompt: type === 'playlist.generate' ? payload.config?.playlistTitle : payload.prompt,
      params: payload,
      started_at: new Date().toISOString(),
    }])
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to enqueue job: ${error.message}`);
  }
  
  const jobId = job.id;
  
  // Emit queued event
  await emitEvent(jobId, options.organizationId, 'queued', {
    message: `${type} job queued`,
    params: payload
  });
  
  // Start the job asynchronously
  startJob(jobId).catch(error => {
    console.error(`[Job ${jobId}] Failed to start:`, error);
  });
  
  return jobId;
}
