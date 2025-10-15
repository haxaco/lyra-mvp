/**
 * Job Runner for async processing
 * Handles Mureka → R2 → Supabase pipeline with proper error handling and concurrency control
 */

import { 
  getJobById, 
  updateJob, 
  insertJobEvent, 
  getChildJobs, 
  countRunningJobsForOrg, 
  insertTrack 
} from '../db';
import { createMurekaJob, pollMurekaJob } from '../mureka';
import { putObject, createPresignedGetUrl } from '../r2';
import type { JobSnapshot, JobEventType } from '../types';

const MAX_CONCURRENT_JOBS_PER_ORG = 5; // Increased to allow more concurrent jobs
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Emit a job event to the database
 */
export async function emitEvent(
  jobId: string, 
  organizationId: string, 
  type: JobEventType, 
  payload?: any
): Promise<void> {
  try {
    await insertJobEvent({ jobId, organizationId, type, payload });
    console.log(`[Job ${jobId}] Event: ${type}`, payload ? JSON.stringify(payload) : '');
  } catch (error) {
    console.error(`[Job ${jobId}] Failed to emit event ${type}:`, error);
    // Don't throw - event emission failure shouldn't stop job processing
  }
}

/**
 * Wait for concurrency slot to become available
 */
async function waitForConcurrencySlot(organizationId: string): Promise<void> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const runningCount = await countRunningJobsForOrg(organizationId);
    
    if (runningCount < MAX_CONCURRENT_JOBS_PER_ORG) {
      return; // Slot available
    }
    
    // Wait with exponential backoff
    const delay = RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)];
    console.log(`[Concurrency] Waiting for slot (${runningCount}/${MAX_CONCURRENT_JOBS_PER_ORG}), retry in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }
  
  throw new Error(`Concurrency limit reached for organization ${organizationId}`);
}

/**
 * Download file from URL and upload to R2
 */
async function downloadAndUploadToR2(
  url: string, 
  r2Key: string, 
  contentType: string
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    await putObject({
      key: r2Key,
      body: new Uint8Array(buffer),
      contentType,
    });
  } catch (error) {
    throw new Error(`Failed to download and upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Run a single track generation job
 */
export async function runTrackJob(jobId: string): Promise<void> {
  let job: JobSnapshot | null = null;
  
  try {
    // Get job details
    job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    console.log(`[Job ${jobId}] Starting track generation`);
    
    // Wait for concurrency slot
    await waitForConcurrencySlot(job.organization_id);
    
    // Update job status to running
    await updateJob(jobId, { 
      status: 'running', 
      progress_pct: 0,
      started_at: new Date().toISOString()
    });
    await emitEvent(jobId, job.organization_id, 'started');
    
    // Create Mureka job
    const murekaParams = {
      lyrics: job.params?.lyrics || '[Instrumental only]',
      model: job.params?.model || 'auto',
      n: job.params?.n || job.item_count || 1, // Use params.n first, then item_count as fallback
      prompt: job.params?.prompt,
      reference_id: job.params?.reference_id,
      vocal_id: job.params?.vocal_id,
      melody_id: job.params?.melody_id,
      stream: job.params?.stream || false,
    };
    
    console.log(`[Job ${jobId}] Creating Mureka job with params:`, murekaParams);
    const { providerJobId } = await createMurekaJob(murekaParams);
    
    // Update job with provider ID
    await updateJob(jobId, { provider_job_id: providerJobId });
    await emitEvent(jobId, job.organization_id, 'progress', { 
      message: 'Mureka job created', 
      provider_job_id: providerJobId 
    });
    
    // Poll Mureka job until completion
    console.log(`[Job ${jobId}] Polling Mureka job ${providerJobId}`);
    const result = await pollMurekaJob(providerJobId);
    
    if (result.status === 'failed') {
      throw new Error(`Mureka job failed: ${result.error}`);
    }
    
    if (!result.choices || result.choices.length === 0) {
      throw new Error('Mureka job succeeded but returned no choices');
    }
    
    console.log(`[Job ${jobId}] Mureka job completed, processing ${result.choices.length} choices:`, result.choices);
    console.log(`[Job ${jobId}] Full Mureka API response:`, JSON.stringify(result, null, 2));
    
    // Update progress
    await updateJob(jobId, { progress_pct: 50 });
    await emitEvent(jobId, job.organization_id, 'progress', { 
      message: `Mureka job completed, processing ${result.choices.length} tracks` 
    });
    
    // Generate a better title from prompt or use fallback
    const generateTitle = (prompt?: string, trackIndex?: number): string => {
      if (!prompt) return `Generated Track ${trackIndex ? trackIndex + 1 : ''}`;
      
      // If prompt is short enough, use it as title
      if (prompt.length <= 100) return trackIndex ? `${prompt} (${trackIndex + 1})` : prompt;
      
      // If prompt is long, extract first sentence or first 80 chars
      const firstSentence = prompt.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length <= 100) {
        const baseTitle = firstSentence.trim();
        return trackIndex ? `${baseTitle} (${trackIndex + 1})` : baseTitle;
      }
      
      // Fallback to first 80 characters
      const baseTitle = prompt.substring(0, 80).trim() + '...';
      return trackIndex ? `${baseTitle} (${trackIndex + 1})` : baseTitle;
    };

    // Process all choices (tracks)
    const trackIds = [];
    for (let i = 0; i < result.choices.length; i++) {
      const choice = result.choices[i];
      console.log(`[Job ${jobId}] Processing choice ${i + 1}/${result.choices.length}:`, choice);
      
      // Download and upload to R2
      const jobTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const mp3Key = `tracks/${jobId}/${jobTimestamp}-${i}.mp3`;
      const flacKey = `tracks/${jobId}/${jobTimestamp}-${i}.flac`;
      
      if (choice.url) {
        await downloadAndUploadToR2(choice.url, mp3Key, 'audio/mpeg');
      }
      
      if (choice.flac_url) {
        await downloadAndUploadToR2(choice.flac_url, flacKey, 'audio/flac');
      }

      // Insert track into database
      const trackData = {
        organization_id: job.organization_id,
        r2_key_mp3: mp3Key,
        r2_key_flac: flacKey,
        duration_seconds: choice.duration || null, // Store raw milliseconds from Mureka API
        job_id: jobId,
        title: generateTitle(job.prompt, i), // Generate unique titles for each track
        artist: 'User', // Default artist
        meta: {
          provider: 'mureka',
          model: murekaParams.model,
          prompt: job.prompt,
          lyrics: murekaParams.lyrics,
          trace_id: result.trace_id,
          mureka_choice_id: choice.id,
          track_index: i,
          mureka_full_response: result, // Store full response for debugging
        },
        provider_id: 'mureka',
      };
      
      const trackId = await insertTrack(trackData);
      trackIds.push(trackId);
      console.log(`[Job ${jobId}] Track ${i + 1} inserted with ID: ${trackId}`);
      
      await emitEvent(jobId, job.organization_id, 'item_succeeded', { 
        track_id: trackId,
        r2_key_mp3: mp3Key,
        r2_key_flac: flacKey,
        duration: choice.duration,
        track_index: i
      });
    }
    
    // Update job as completed
    await updateJob(jobId, { 
      status: 'succeeded', 
      progress_pct: 100,
      completed_count: result.choices.length,
      finished_at: new Date().toISOString()
    });
    
    await emitEvent(jobId, job.organization_id, 'succeeded', { 
      track_ids: trackIds,
      track_count: result.choices.length,
      message: `Track generation completed successfully - ${result.choices.length} tracks created`
    });
    
    console.log(`[Job ${jobId}] Track generation completed successfully - ${result.choices.length} tracks created`);
    
    // Update parent job if this is a child job
    if (job.parent_job_id) {
      await onChildFinishedUpdateParent(job.parent_job_id);
    }
    
  } catch (error) {
    console.error(`[Job ${jobId}] Track generation failed:`, error);
    
    // Update job as failed
    if (job) {
      await updateJob(jobId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        finished_at: new Date().toISOString()
      });
      
      await emitEvent(jobId, job.organization_id, 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    throw error;
  }
}

/**
 * Update parent job when a child job finishes
 */
export async function onChildFinishedUpdateParent(parentId: string): Promise<void> {
  try {
    const parentJob = await getJobById(parentId);
    if (!parentJob) {
      console.error(`[Parent ${parentId}] Parent job not found`);
      return;
    }
    
    const children = await getChildJobs(parentId);
    
    // Count child jobs by status, not individual tracks
    const succeededChildren = children.filter(child => child.status === 'succeeded');
    const failedChildren = children.filter(child => child.status === 'failed');
    const runningChildren = children.filter(child => child.status === 'running' || child.status === 'queued');
    
    const totalChildren = children.length;
    const completedChildren = succeededChildren.length + failedChildren.length;
    const allChildrenComplete = runningChildren.length === 0;
    
    // Calculate progress based on child job completion, not track counts
    const progressPct = totalChildren > 0 
      ? Math.min(100, Math.round((completedChildren * 100) / totalChildren))
      : 0;
    
    console.log(`[Parent ${parentId}] Progress update: ${completedChildren}/${totalChildren} child jobs completed (${succeededChildren.length} succeeded, ${failedChildren.length} failed), allChildrenComplete: ${allChildrenComplete}`);
    
    // Update parent progress
    await updateJob(parentId, { 
      completed_count: completedChildren,
      progress_pct: progressPct
    });
    
    await emitEvent(parentId, parentJob.organization_id, 'progress', {
      completed_children: completedChildren,
      total_children: totalChildren,
      succeeded_children: succeededChildren.length,
      failed_children: failedChildren.length,
      progress_pct: progressPct
    });
    
    // Check if all children are complete
    if (allChildrenComplete) {
      const finalStatus = failedChildren.length > 0 ? 'failed' : 'succeeded';
      
      await updateJob(parentId, { 
        status: finalStatus,
        finished_at: new Date().toISOString()
      });
      
      await emitEvent(parentId, parentJob.organization_id, finalStatus, {
        completed_children: completedChildren,
        succeeded_children: succeededChildren.length,
        failed_children: failedChildren.length,
        message: `Playlist generation ${finalStatus} - ${succeededChildren.length}/${totalChildren} child jobs succeeded`
      });
      
      console.log(`[Parent ${parentId}] Playlist generation ${finalStatus} (${succeededChildren.length}/${totalChildren} child jobs succeeded)`);
    }
    
  } catch (error) {
    console.error(`[Parent ${parentId}] Failed to update parent job:`, error);
  }
}

/**
 * Start a job with proper error handling and logging
 */
export async function startJob(jobId: string): Promise<void> {
  let job: JobSnapshot | null = null;
  
  try {
    console.log(`[Job ${jobId}] Starting job processing`);
    await runTrackJob(jobId);
  } catch (error) {
    console.error(`[Job ${jobId}] Job processing failed:`, error);
    
    // Get job details to update status
    try {
      job = await getJobById(jobId);
      if (job) {
        // Update job status to failed
        await updateJob(jobId, { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error',
          finished_at: new Date().toISOString()
        });
        
        // Emit failed event
        await emitEvent(jobId, job.organization_id, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // If this is a child job, update parent
        if (job.parent_job_id) {
          await onChildFinishedUpdateParent(job.parent_job_id);
        }
      }
    } catch (updateError) {
      console.error(`[Job ${jobId}] Failed to update job status after error:`, updateError);
    }
  }
}
