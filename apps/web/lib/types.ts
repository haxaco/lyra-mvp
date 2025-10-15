/**
 * Shared types for server-side helpers
 * Server-only types for jobs, auth, and database operations
 */

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type JobEventType = 'queued' | 'started' | 'progress' | 'item_succeeded' | 'succeeded' | 'failed' | 'log';

export interface JobEvent {
  id: string;
  job_id: string;
  organization_id: string;
  type: JobEventType;
  payload?: any;
  created_at: string;
}

export interface JobSnapshot {
  id: string;
  organization_id: string;
  user_id: string;
  parent_job_id?: string;
  provider_job_id?: string;
  status: JobStatus;
  progress_pct: number;
  item_count: number;
  completed_count: number;
  prompt?: string;
  params?: any;
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  trace_id?: string;
  children?: JobSnapshot[];
}

export interface TrackInsert {
  organization_id: string;
  r2_key_mp3?: string;
  r2_key_flac?: string;
  duration_seconds?: number | null;
  job_id: string;
  title?: string;
  artist?: string;
  meta?: any;
  provider_id?: string;
}

export interface MurekaCreateParams {
  lyrics: string;
  model?: 'auto' | 'mureka-6' | 'mureka-7.5' | 'mureka-o1';
  n?: number;
  prompt?: string;
  reference_id?: string;
  vocal_id?: string;
  melody_id?: string;
  stream?: boolean;
}

export interface MurekaJobResult {
  status: 'succeeded' | 'failed' | 'running' | 'queued';
  choices?: Array<{
    id: string;
    url?: string;
    flac_url?: string;
    duration?: number;
  }>;
  trace_id?: string;
  error?: string;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
