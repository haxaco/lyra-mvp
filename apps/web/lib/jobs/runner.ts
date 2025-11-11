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
  getSupabaseAdmin,
} from '../db';
import type { JobSnapshot, JobEventType, JobStatus } from '../types';
import type { ProviderNormalizedResult } from '@lyra/core';
import { learnFromComposedPlaylist } from '../ai/brandLearning';
import { transformBlueprintToMurekaParams } from '../ai/blueprintToMureka';
import { ComposeConfig } from '@lyra/sdk';
import { generatePlaylistStep } from '../../jobs/steps/generatePlaylist';
import { getProvider, fetchMusicGptConversions } from '../providers';
import type { ProviderId } from '@lyra/core';
import { upsertTrackFromProviderResult } from '../providers/upsertTrackFromProviderResult';
import { putObject } from '../r2';

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
 * Get parent job and its children with concurrency limit
 */
async function getParentAndChildren(parentId: string): Promise<{
  parent: JobSnapshot;
  children: JobSnapshot[];
  concurrencyLimit: number;
} | null> {
  const supabase = getSupabaseAdmin();
  
  // Get parent job
  const { data: parent, error: parentError } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', parentId)
    .single();
    
  if (parentError || !parent) {
    console.error(`[Scheduler] Failed to get parent job ${parentId}:`, parentError);
    return null;
  }
  
  // Get children
  const { data: children, error: childrenError } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('parent_job_id', parentId)
    .order('created_at', { ascending: true });
    
  if (childrenError) {
    console.error(`[Scheduler] Failed to get children for parent ${parentId}:`, childrenError);
    return null;
  }
  
  return {
    parent,
    children: children || [],
    concurrencyLimit: parent.concurrency_limit || 1
  };
}

/**
 * Count running children for a parent job
 */
async function countRunningChildren(parentId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  
  const { count, error } = await supabase
    .from('generation_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('parent_job_id', parentId)
    .eq('status', 'running');
    
  if (error) {
    console.error(`[Scheduler] Failed to count running children for parent ${parentId}:`, error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get the next queued child job for a parent
 */
async function nextQueuedChild(parentId: string): Promise<JobSnapshot | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('parent_job_id', parentId)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found - this is expected when no queued children
      return null;
    }
    console.error(`[Scheduler] Failed to get next queued child for parent ${parentId}:`, error);
    return null;
  }
  
  return data;
}

/**
 * Check if we should dispatch the next child (without failing the batch)
 */
async function checkAndDispatchNextChild(parentId: string): Promise<void> {
  try {
    const parentData = await getParentAndChildren(parentId);
    if (!parentData) return;
    
    const { parent, children, concurrencyLimit } = parentData;
    
    // Count currently running children
    const runningCount = await countRunningChildren(parentId);
    if (runningCount >= concurrencyLimit) {
      console.log(`[Scheduler] Parent ${parentId} already at concurrency limit (${runningCount}/${concurrencyLimit})`);
      return;
    }
    
    // Check org-level concurrency limit
    const orgRunningCount = await countRunningJobsForOrg(parent.organization_id);
    if (orgRunningCount >= MAX_CONCURRENT_JOBS_PER_ORG) {
      console.log(`[Scheduler] Org concurrency limit reached (${orgRunningCount}/${MAX_CONCURRENT_JOBS_PER_ORG})`);
      return;
    }
    
    // Get next queued child
    const nextChild = await nextQueuedChild(parentId);
    if (!nextChild) {
      console.log(`[Scheduler] No more queued children for parent ${parentId}`);
      return;
    }
    
    console.log(`[Scheduler] Starting next child ${nextChild.id} for parent ${parentId} (${runningCount + 1}/${concurrencyLimit})`);
    
    // Start the child job asynchronously
    runTrackJob(nextChild.id)
      .then(async () => {
        console.log(`[Scheduler] Child ${nextChild.id} completed successfully`);
        await onChildFinishedUpdateParent(parentId);
        await checkAndDispatchNextChild(parentId);
      })
      .catch(async (error) => {
        console.error(`[Scheduler] Child ${nextChild.id} failed:`, error);
        await onChildFinishedUpdateParent(parentId);
        await checkAndDispatchNextChild(parentId);
      });
      
  } catch (error) {
    console.error(`[Scheduler] Error in checkAndDispatchNextChild:`, error);
  }
}

/**
 * Dispatch children up to the parent's concurrency limit
 */
export async function dispatchChildrenUpToLimit(parentId: string): Promise<void> {
  try {
    console.log(`[Scheduler] Dispatching children for parent ${parentId}`);
    
    const parentData = await getParentAndChildren(parentId);
    if (!parentData) {
      console.error(`[Scheduler] Failed to get parent data for ${parentId}`);
      return;
    }
    
    const { parent, children, concurrencyLimit } = parentData;
    
    console.log(`[Scheduler] Parent ${parentId} has concurrency_limit=${concurrencyLimit}, ${children.length} total children`);
    
    // Count currently running children
    let runningCount = await countRunningChildren(parentId);
    console.log(`[Scheduler] Parent ${parentId} has ${runningCount} running children (limit: ${concurrencyLimit})`);
    
    // Start children up to the concurrency limit
    while (runningCount < concurrencyLimit) {
      // Check org-level concurrency limit
      const orgRunningCount = await countRunningJobsForOrg(parent.organization_id);
      if (orgRunningCount >= MAX_CONCURRENT_JOBS_PER_ORG) {
        console.log(`[Scheduler] Org concurrency limit reached (${orgRunningCount}/${MAX_CONCURRENT_JOBS_PER_ORG}), stopping dispatch`);
        break;
      }
      
      // Get next queued child
      const nextChild = await nextQueuedChild(parentId);
      if (!nextChild) {
        console.log(`[Scheduler] No more queued children for parent ${parentId}`);
        break;
      }
      
      console.log(`[Scheduler] Starting child ${nextChild.id} for parent ${parentId} (${runningCount + 1}/${concurrencyLimit})`);
      
      // Start the child job asynchronously
      runTrackJob(nextChild.id)
        .then(async () => {
          console.log(`[Scheduler] Child ${nextChild.id} completed successfully`);
          // Update parent progress
          await onChildFinishedUpdateParent(parentId);
          // Check if we should dispatch the next child
          await checkAndDispatchNextChild(parentId);
        })
        .catch(async (error) => {
          console.error(`[Scheduler] Child ${nextChild.id} failed:`, error);
          // Update parent progress (this will handle the failure logic)
          await onChildFinishedUpdateParent(parentId);
          // Check if we should dispatch the next child
          await checkAndDispatchNextChild(parentId);
        });
      
      // Increment our local running count since we just started a job
      runningCount++;
      
      // Check if we've reached the concurrency limit
      if (runningCount >= concurrencyLimit) {
        console.log(`[Scheduler] Reached concurrency limit for parent ${parentId}`);
        break;
      }
    }
    
  } catch (error) {
    console.error(`[Scheduler] Failed to dispatch children for parent ${parentId}:`, error);
  }
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
    
    const providerId: ProviderId = (job.provider as ProviderId) || 'mureka';
    const isPlaylistTrack = Boolean(job.params?.blueprint && job.params?.playlistId);
    const provider = getProvider(providerId);
    console.log(`[Job ${jobId}] Provider resolved`, {
      providerId,
      isPlaylistTrack,
      parentJobId: job.parent_job_id ?? null,
      itemCount: job.item_count,
      expectedVariants: job.expected_variants ?? null,
    });
    const playlistContext = isPlaylistTrack
      ? {
          id: job.params?.playlistId as string,
          basePosition: typeof job.params?.trackIndex === 'number' ? job.params.trackIndex : undefined,
          blueprint: job.params?.blueprint,
        }
      : undefined;

    let providerParams: Record<string, any> = {};
    let expectedVariants = job.item_count || 1;
    let prompt = job.params?.prompt ?? job.prompt ?? '';
    let lyrics = job.params?.lyrics ?? '[Instrumental only]';
    let fallbackPrompt = prompt;

    switch (providerId) {
      case 'mureka': {
        if (isPlaylistTrack && playlistContext?.blueprint) {
          const transformed = transformBlueprintToMurekaParams(playlistContext.blueprint);
          providerParams = {
            ...transformed,
            n: 1,
            reference_id: job.params?.reference_id,
            vocal_id: job.params?.vocal_id,
            melody_id: job.params?.melody_id,
          };
          prompt = playlistContext.blueprint.prompt ?? prompt;
          lyrics = transformed.lyrics ?? lyrics;
          fallbackPrompt = playlistContext.blueprint.prompt ?? prompt;
        } else {
          providerParams = {
            lyrics,
            model: job.params?.model || 'auto',
            n: job.params?.n || job.item_count || 1,
            prompt,
            reference_id: job.params?.reference_id,
            vocal_id: job.params?.vocal_id,
            melody_id: job.params?.melody_id,
            stream: job.params?.stream || false,
          };
        }
        expectedVariants = providerParams.n ?? expectedVariants;
        break;
      }
      case 'musicgpt': {
        expectedVariants = job.params?.n || expectedVariants || 2;
        const blueprintPrompt = playlistContext?.blueprint?.prompt;
        prompt = prompt || blueprintPrompt || 'Generate an original track';
        fallbackPrompt = blueprintPrompt || prompt;
        lyrics = job.params?.lyrics ?? playlistContext?.blueprint?.lyrics ?? null;
        providerParams = {
          jobId,
          organizationId: job.organization_id,
          playlistId: playlistContext?.id,
          make_instrumental: job.params?.make_instrumental ?? (!lyrics || lyrics === '[Instrumental only]'),
          vocal_only: job.params?.vocal_only ?? false,
          music_style: job.params?.music_style,
          voice_id: job.params?.voice_id,
          overrides: job.params?.musicgpt_overrides,
        };
        break;
      }
      default:
        throw new Error(`Provider ${providerId} is not supported for track jobs`);
    }

    const generateParams = {
      prompt,
      lyrics: lyrics ?? undefined,
      metadata: {
        providerParams,
        [`${providerId}Params`]: providerParams,
        expectedVariants,
        jobId,
        organizationId: job.organization_id,
        playlistId: playlistContext?.id,
        blueprint: playlistContext?.blueprint,
      },
    };

    await emitEvent(jobId, job.organization_id, 'progress', {
      message: `Preparing provider job (${providerId})`,
    });

    const prepareResult = await provider.prepare(generateParams);
    console.log(`[Job ${jobId}] Provider prepare completed`, {
      delivery: prepareResult.delivery,
      providerTaskId: prepareResult.providerTaskId ?? null,
      expectedVariants: prepareResult.expectedVariants ?? null,
      providerConversionIds: prepareResult.providerConversionIds ?? null,
    });
    const providerTaskId = prepareResult.providerTaskId;
    const variants = prepareResult.expectedVariants ?? expectedVariants ?? 1;
    const providerConversionIds = prepareResult.providerConversionIds;

    await updateJob(jobId, {
      provider: providerId,
      provider_job_id: providerTaskId,
      provider_task_id: providerTaskId,
      expected_variants: variants,
    });

    await emitEvent(jobId, job.organization_id, 'progress', {
      message: `Provider task created`,
      provider: providerId,
      provider_task_id: providerTaskId,
      delivery: prepareResult.delivery,
      provider_conversion_ids: providerConversionIds,
    });

    if (prepareResult.delivery === 'webhook') {
      await emitEvent(jobId, job.organization_id, 'progress', {
        message: 'Waiting for webhook callbacks',
        expected_variants: variants,
      });

      startMusicGptFallbackPolling({
        jobId,
        providerTaskId,
        providerId,
        playlistContext,
        fallbackPrompt,
        providerConversionIds,
      });
      console.log(`[Job ${jobId}] MusicGPT webhook flow – fallback polling armed`, {
        providerTaskId: providerTaskId ?? null,
        pollIntervalMs: 60_000,
        providerConversionIds,
      });
      return;
    }

    if (!providerTaskId) {
      throw new Error(`Provider ${providerId} did not return a task id for polling`);
    }

    if (!provider.poll) {
      throw new Error(`Provider ${providerId} does not implement polling`);
    }

    const pollResults = await provider.poll(providerTaskId);
    if (!pollResults || pollResults.length === 0) {
      if (providerId === 'musicgpt') {
        console.log(
          `[Job ${jobId}] Initial poll returned no results; switching to fallback polling`,
          { providerTaskId, providerConversionIds }
        );
        startMusicGptFallbackPolling({
          jobId,
          providerTaskId,
          providerId,
          playlistContext,
          fallbackPrompt,
          providerConversionIds,
        });
        return;
      }
      throw new Error(`Provider ${providerId} returned no results`);
    }

    const normalizedResults = pollResults.map((result) => provider.normalize(result));
    await processNormalizedProviderResults({
      job,
      providerId,
      normalizedResults,
      playlistContext,
      fallbackPrompt,
      providerTaskId,
    });

    console.log(
      `[Job ${jobId}] Track generation completed successfully - ${normalizedResults.length} tracks created`
    );
    
    // Update parent job if this is a child job
    if (job.parent_job_id) {
      await onChildFinishedUpdateParent(job.parent_job_id);
      // Note: dispatchChildrenUpToLimit is called from the scheduler, not here
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
 * Run a playlist generation job by creating child jobs for each track
 */
export async function runPlaylistJob(jobId: string): Promise<void> {
  let job: JobSnapshot | null = null;
  
  try {
    // Get job details
    job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    console.log(`[Job ${jobId}] Starting playlist generation with child jobs`);
    
    // Check if this is a playlist generation job
    if (!job.params?.blueprints || !Array.isArray(job.params.blueprints)) {
      throw new Error('Invalid playlist job: missing blueprints');
    }
    
    const blueprints = job.params.blueprints;
    const concurrencyLimit = job.concurrency_limit || 1;
    
    // Update job status to running
    await updateJob(jobId, { 
      status: 'running', 
      progress_pct: 0,
      started_at: new Date().toISOString(),
      item_count: blueprints.length,
      completed_count: 0
    });
    await emitEvent(jobId, job.organization_id, 'started');
    
    // Create playlist shell first
    await emitEvent(jobId, job.organization_id, 'log', { message: 'Creating playlist shell…' });
    
    const supabase = getSupabaseAdmin();
    const { data: playlistRow, error: plErr } = await supabase
      .from("playlists")
      .insert({
        organization_id: job.organization_id,
        location_id: job.params.locationId ?? null,
        name: job.params.config?.playlistTitle || `AI Playlist – ${new Date().toLocaleString()}`,
        schedule: null,
        config: job.params.config, // Store full ComposeConfig
        job_id: jobId, // Track which job created this playlist
      })
      .select("id")
      .single();
      
    if (plErr || !playlistRow?.id) {
      throw new Error(plErr?.message || "playlist insert failed");
    }
    
    const playlistId = playlistRow.id as string;
    await emitEvent(jobId, job.organization_id, 'log', { message: `Playlist created: ${playlistId}` });
    
    // Create child jobs for each track
    const childJobIds: string[] = [];
    
    for (let i = 0; i < blueprints.length; i++) {
      const blueprint = blueprints[i];
      
      const { data: childJob, error: childError } = await supabase
        .from("generation_jobs")
        .insert({
          organization_id: job.organization_id,
          user_id: job.user_id,
          parent_job_id: jobId,
          status: 'queued',
          kind: 'track.generate',
          prompt: blueprint.prompt, // Set prompt from blueprint for the required column
          params: {
            organizationId: job.organization_id,
            userId: job.user_id,
            locationId: job.params.locationId,
            playlistId: playlistId,
            trackIndex: i,
            blueprint: blueprint, // Keep prompt here too for consistency
            config: job.params.config
          },
          progress_pct: 0,
          item_count: 1,
          completed_count: 0,
          concurrency_limit: 1
        })
        .select("id")
        .single();
        
      if (childError || !childJob?.id) {
        throw new Error(`Failed to create child job ${i}: ${childError?.message || 'unknown'}`);
      }
      
      childJobIds.push(childJob.id);
      await emitEvent(childJob.id, job.organization_id, 'queued', { 
        message: `Track ${i + 1} queued`,
        parentJobId: jobId,
        trackIndex: i
      });
    }
    
    await emitEvent(jobId, job.organization_id, 'log', { 
      message: `Created ${childJobIds.length} child jobs for playlist generation` 
    });
    
    // Start processing child jobs with concurrency control
    await dispatchChildrenUpToLimit(jobId);
    
    console.log(`[Job ${jobId}] Playlist generation setup completed with ${childJobIds.length} child jobs`);
    
  } catch (error) {
    console.error(`[Job ${jobId}] Playlist generation failed:`, error);
    
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
      
      // Learn from successful playlist composition
      if (finalStatus === 'succeeded' && succeededChildren.length > 0) {
        try {
          // Try to extract compose config from parent job params
          // For now, we'll create a basic config from the job parameters
          // In a full implementation, this would come from an AI compose session
          const composeConfig: ComposeConfig = {
            genres: ['electronic', 'ambient', 'instrumental'], // Default genres
            bpmRange: [120, 140] as [number, number], // Default BPM range
            energy: 6, // Default energy
            moods: ['uplifting', 'focused'], // Default moods
            durationSec: 180, // Default duration
            tracks: succeededChildren.length,
            familyFriendly: true,
            model: 'auto',
            allowExplicit: false // Default to safe content
          };
          
          // Fire and forget - don't block the user
          learnFromComposedPlaylist(parentJob.organization_id, composeConfig)
            .then(() => {
              console.log(`[Parent ${parentId}] Brand learning completed successfully`);
            })
            .catch((e) => {
              console.warn(`[Parent ${parentId}] Brand learning failed:`, e);
            });
        } catch (error) {
          console.warn(`[Parent ${parentId}] Brand learning setup failed:`, error);
        }
      }
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
    
    // Get job details to determine job type
    job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Determine job type based on params
    if (job.params?.blueprints && Array.isArray(job.params.blueprints)) {
      // This is a playlist generation job
      await runPlaylistJob(jobId);
    } else {
      // This is a track generation job
      await runTrackJob(jobId);
    }
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

interface ProcessProviderResultsParams {
  job: JobSnapshot;
  providerId: ProviderId;
  normalizedResults: ProviderNormalizedResult[];
  playlistContext?:
    | {
        id: string;
        basePosition?: number;
        blueprint?: any;
      }
    | undefined;
  fallbackPrompt?: string | null;
  providerTaskId?: string;
}

async function processNormalizedProviderResults({
  job,
  providerId,
  normalizedResults,
  playlistContext,
  fallbackPrompt,
  providerTaskId,
}: ProcessProviderResultsParams): Promise<{ processed: number; completedCount: number }> {
  console.log(`[Job ${job.id}] processNormalizedProviderResults`, {
    providerId,
    normalizedResults: normalizedResults.length,
    completedSoFar: job.completed_count ?? 0,
  });
  if (!normalizedResults.length) {
    return { processed: 0, completedCount: job.completed_count ?? 0 };
  }

  const supabase = getSupabaseAdmin();
  const { data: existingTracks } = await supabase
    .from('tracks')
    .select('source_conversion_id')
    .eq('job_id', job.id);
  const existingIds = new Set<string>(
    (existingTracks || [])
      .map((t: any) => t.source_conversion_id)
      .filter((id: string | null | undefined): id is string => Boolean(id))
  );

  let processed = 0;
  let trackIds: string[] = [];
  let nextIndex = job.completed_count ?? 0;
  const basePosition = playlistContext?.basePosition ?? nextIndex;

  for (let i = 0; i < normalizedResults.length; i++) {
    const normalized = normalizedResults[i];
    const sourceConversionId = (normalized.metadata as any)?.sourceConversionId;
    if (sourceConversionId && existingIds.has(sourceConversionId)) {
      console.log(`[Job ${job.id}] Skipping duplicate conversion ${sourceConversionId}`);
      continue;
    }

    const variantIndex = nextIndex;
    const playlistPosition =
      playlistContext && typeof basePosition === 'number' ? basePosition + processed : undefined;

    const upserted = await upsertTrackFromProviderResult({
      job,
      normalized,
      providerId,
      variantIndex,
      playlist: playlistContext
        ? {
            id: playlistContext.id,
            position: playlistPosition,
            blueprint: playlistContext.blueprint,
          }
        : undefined,
      fallbackPrompt,
      title: (normalized.metadata as any)?.title,
      artist: job.params?.artist ?? 'Lyra AI',
      externalIds: {
        providerTaskId,
        providerChoiceId: (normalized.metadata as any)?.providerChoiceId,
        sourceConversionId,
      },
    });

    trackIds.push(upserted.trackId);
    processed++;
    nextIndex++;

    if (sourceConversionId) {
      existingIds.add(sourceConversionId);
    }

    await emitEvent(job.id, job.organization_id, 'item_succeeded', {
      track_id: upserted.trackId,
      r2_key_mp3: upserted.r2KeyMp3,
      r2_key_flac: upserted.r2KeyFlac,
      duration: upserted.durationSeconds,
      track_index: variantIndex,
    });
  }

  if (processed === 0) {
    console.log(`[Job ${job.id}] Provider results contained no new tracks`);
    return { processed: 0, completedCount: job.completed_count ?? 0 };
  }

  const completedCount = (job.completed_count ?? 0) + processed;
  const expectedVariants = job.expected_variants ?? job.item_count ?? completedCount;
  const progressPct = Math.min(100, Math.round((completedCount * 100) / expectedVariants));

  const updatePayload: Partial<JobSnapshot> & Record<string, any> = {
    completed_count: completedCount,
    progress_pct: progressPct,
  };

  let finalStatus: JobStatus | null = null;
  if (completedCount >= expectedVariants) {
    finalStatus = 'succeeded';
    updatePayload.status = 'succeeded';
    updatePayload.finished_at = new Date().toISOString();
  }

  await updateJob(job.id, updatePayload);
  await emitEvent(job.id, job.organization_id, 'progress', {
    message: `Processed ${processed} tracks from provider`,
    completed_count: completedCount,
    progress_pct: progressPct,
  });

  if (playlistContext?.id && processed > 0) {
    const supabaseAdminClient = getSupabaseAdmin();
    const { error: statsErr } = await supabaseAdminClient.rpc('update_playlist_stats', {
      playlist_uuid: playlistContext.id,
    });
    if (statsErr) {
      console.warn(`[Job ${job.id}] Failed to update playlist stats:`, statsErr);
    } else {
      console.log(`[Job ${job.id}] Playlist stats updated`, { playlistId: playlistContext.id });
    }
  }

  if (finalStatus) {
    console.log(`[Job ${job.id}] Final status update`, {
      finalStatus,
      completedCount,
      expectedVariants,
    });
    await emitEvent(job.id, job.organization_id, finalStatus, {
      track_ids: trackIds,
      track_count: completedCount,
      message: `Track generation completed successfully - ${completedCount} tracks created`,
    });
  }

  return { processed, completedCount };
}

function startMusicGptFallbackPolling({
  jobId,
  providerTaskId,
  providerId,
  playlistContext,
  fallbackPrompt,
  providerConversionIds,
}: {
  jobId: string;
  providerTaskId?: string;
  providerId: ProviderId;
  playlistContext?:
    | {
        id: string;
        basePosition?: number;
        blueprint?: any;
      }
    | undefined;
  fallbackPrompt?: string | null;
  providerConversionIds?: string[] | undefined;
}): void {
  if (!providerTaskId) return;

  const pollIntervalMs = 20_000;
  const maxAttempts = 40;
  let attempts = 0;

  const handler = async () => {
    attempts++;
    try {
      console.log(`[Job ${jobId}] MusicGPT fallback poll attempt`, {
        attempt: attempts,
        maxAttempts,
        providerTaskId,
        providerConversionIds,
      });

      const job = await getJobById(jobId);
      if (!job || job.status !== 'running') {
        clearInterval(timer);
        return;
      }

      const pollResults = await fetchMusicGptConversions(providerTaskId, providerConversionIds);
      if (!pollResults.length) {
        console.log(`[Job ${jobId}] MusicGPT fallback poll returned no results`, {
          attempt: attempts,
        });
        if (attempts >= maxAttempts) {
          await updateJob(jobId, {
            status: 'failed',
            error: 'MusicGPT webhook timeout',
            finished_at: new Date().toISOString(),
          });
          await emitEvent(jobId, job.organization_id, 'failed', {
            error: 'MusicGPT webhook timeout',
          });
          if (job.parent_job_id) {
            await onChildFinishedUpdateParent(job.parent_job_id);
          }
          clearInterval(timer);
        }
        return;
      }

      const provider = getProvider(providerId);
      const normalizedResults = pollResults.map((result) => provider.normalize(result));
      const { processed, completedCount } = await processNormalizedProviderResults({
        job,
        providerId,
        normalizedResults,
        playlistContext,
        fallbackPrompt,
        providerTaskId,
      });

      if (processed > 0) {
        console.log(
          `[Job ${jobId}] Fallback polling processed ${processed} MusicGPT tracks (${completedCount} total)`
        );
      }

      const latest = await getJobById(jobId);
      if (!latest || latest.status !== 'running') {
        clearInterval(timer);
      }
    } catch (error) {
      console.error(`[Job ${jobId}] MusicGPT fallback polling error:`, error);
    }

    if (attempts >= maxAttempts) {
      clearInterval(timer);
    }
  };

  const timer = setInterval(handler, pollIntervalMs);
  console.log(`[Job ${jobId}] MusicGPT fallback polling started`, {
    providerTaskId,
    pollIntervalMs,
    maxAttempts,
    providerConversionIds,
  });
  handler().catch((error) => {
    console.error(`[Job ${jobId}] MusicGPT fallback polling immediate error:`, error);
  });

  if (typeof (timer as any)?.unref === 'function') {
    (timer as any).unref();
  }
}
