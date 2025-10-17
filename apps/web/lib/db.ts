/**
 * Database helpers for server-side operations
 * Centralized Supabase admin client and typed query helpers
 */

import { supabaseAdmin } from './supabaseAdmin';
import type { JobStatus, JobEventType, JobSnapshot, TrackInsert, JobEvent } from './types';

/**
 * Get Supabase admin client for server operations
 */
export function getSupabaseAdmin() {
  return supabaseAdmin();
}

/**
 * Get a job by ID with full details
 * @param jobId - The job ID to retrieve
 * @returns Full job snapshot or null if not found
 */
export async function getJobById(jobId: string): Promise<JobSnapshot | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get job: ${error.message}`);
  }
  
  return data as JobSnapshot;
}

/**
 * Update a job with the provided patch
 * @param jobId - The job ID to update
 * @param patch - Partial job data to update
 */
export async function updateJob(jobId: string, patch: Partial<JobSnapshot>): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('generation_jobs')
    .update(patch)
    .eq('id', jobId);
    
  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }
}

/**
 * Insert a job event
 * @param event - Event data to insert
 */
export async function insertJobEvent(event: {
  jobId: string;
  organizationId: string;
  type: JobEventType;
  payload?: any;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('job_events')
    .insert({
      job_id: event.jobId,
      organization_id: event.organizationId,
      type: event.type,
      payload: event.payload,
    });
    
  if (error) {
    throw new Error(`Failed to insert job event: ${error.message}`);
  }
}

/**
 * Get child jobs for a parent job
 * @param parentId - The parent job ID
 * @returns Array of child job snapshots
 */
export async function getChildJobs(parentId: string): Promise<JobSnapshot[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('parent_job_id', parentId)
    .order('created_at', { ascending: true });
    
  if (error) {
    throw new Error(`Failed to get child jobs: ${error.message}`);
  }
  
  return data as JobSnapshot[];
}

/**
 * Count running jobs for an organization (concurrency guard)
 * @param orgId - The organization ID
 * @returns Number of currently running jobs
 */
export async function countRunningJobsForOrg(orgId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  
  const { count, error } = await supabase
    .from('generation_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'running'); // Only count actually running jobs, not queued ones
    
  if (error) {
    throw new Error(`Failed to count running jobs: ${error.message}`);
  }
  
  return count || 0;
}

/**
 * Insert a track into the database
 * @param track - Track data to insert
 * @returns The inserted track ID
 */
export async function insertTrack(track: TrackInsert): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      organization_id: track.organization_id,
      r2_key: track.r2_key_mp3,
      flac_r2_key: track.r2_key_flac,
      duration_seconds: track.duration_seconds,
      job_id: track.job_id,
      title: track.title,
      artist: track.artist,
      meta: track.meta,
      provider_id: track.provider_id,
    })
    .select('id')
    .single();
    
  if (error) {
    throw new Error(`Failed to insert track: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Get job events for a specific job
 * @param jobId - The job ID
 * @returns Array of job events
 */
export async function getJobEvents(jobId: string): Promise<JobEvent[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('job_events')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
    
  if (error) {
    throw new Error(`Failed to get job events: ${error.message}`);
  }
  
  return data as JobEvent[];
}

/**
 * Get recent job events for a job (for SSE)
 * @param jobId - The job ID
 * @param since - Optional timestamp to get events since
 * @returns Array of recent job events
 */
export async function getRecentJobEvents(jobId: string, since?: string): Promise<JobEvent[]> {
  const supabase = getSupabaseAdmin();
  
  let query = supabase
    .from('job_events')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
    
  if (since) {
    query = query.gt('created_at', since);
  }
  
  const { data, error } = await query;
    
  if (error) {
    throw new Error(`Failed to get recent job events: ${error.message}`);
  }
  
  return data as JobEvent[];
}
