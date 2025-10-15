/**
 * Lyra Jobs Client
 * Centralized client for job management with SSE and polling support
 */

export interface JobSnapshot {
  id: string;
  organization_id: string;
  user_id: string;
  parent_job_id?: string;
  provider_job_id?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
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
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
    running: number;
    queued: number;
  };
}

export interface JobEvent {
  type: string;
  data: any;
}

export interface CreateTrackJobParams {
  lyrics: string;
  model?: 'auto' | 'mureka-6' | 'mureka-7.5' | 'mureka-o1';
  prompt?: string;
  reference_id?: string;
  vocal_id?: string;
  melody_id?: string;
  stream?: boolean;
}

export interface CreatePlaylistJobParams {
  lyrics: string;
  model?: 'auto' | 'mureka-6' | 'mureka-7.5' | 'mureka-o1';
  n?: number; // 1-10 tracks
  prompt?: string;
  reference_id?: string;
  vocal_id?: string;
  melody_id?: string;
  stream?: boolean;
}

export interface EventStream {
  close: () => void;
}

/**
 * Lyra Jobs Client for managing async job operations
 */
export class LyraJobs {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a single track generation job
   */
  async createTrackJob(params: CreateTrackJobParams): Promise<{ job_id: string }> {
    const response = await fetch(`${this.baseUrl}/api/jobs/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to create track job: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a playlist generation job (multiple tracks)
   */
  async createPlaylistJob(params: CreatePlaylistJobParams): Promise<{ 
    job_id: string; 
    child_ids: string[] 
  }> {
    const response = await fetch(`${this.baseUrl}/api/jobs/playlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to create playlist job: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get job snapshot with current status and progress
   */
  async getJob(jobId: string): Promise<JobSnapshot> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get job: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Open Server-Sent Events stream for real-time job updates
   */
  openEventStream(
    jobId: string, 
    onEvent: (event: JobEvent) => void
  ): EventStream {
    const eventSource = new EventSource(`${this.baseUrl}/api/jobs/${jobId}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ type: 'message', data });
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.addEventListener('queued', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'queued', data });
      } catch (error) {
        console.error('Failed to parse queued event:', error);
      }
    });

    eventSource.addEventListener('started', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'started', data });
      } catch (error) {
        console.error('Failed to parse started event:', error);
      }
    });

    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'progress', data });
      } catch (error) {
        console.error('Failed to parse progress event:', error);
      }
    });

    eventSource.addEventListener('item_succeeded', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'item_succeeded', data });
      } catch (error) {
        console.error('Failed to parse item_succeeded event:', error);
      }
    });

    eventSource.addEventListener('succeeded', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'succeeded', data });
      } catch (error) {
        console.error('Failed to parse succeeded event:', error);
      }
    });

    eventSource.addEventListener('failed', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'failed', data });
      } catch (error) {
        console.error('Failed to parse failed event:', error);
      }
    });

    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'complete', data });
      } catch (error) {
        console.error('Failed to parse complete event:', error);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ type: 'error', data });
      } catch (error) {
        console.error('Failed to parse error event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onEvent({ 
        type: 'error', 
        data: { error: 'Connection error', message: 'SSE connection failed' } 
      });
    };

    return {
      close: () => {
        eventSource.close();
      }
    };
  }

  /**
   * Check if a job status is terminal (succeeded, failed, or canceled)
   */
  isTerminalStatus(status: string): boolean {
    return ['succeeded', 'failed', 'canceled'].includes(status);
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(status: string): string {
    switch (status) {
      case 'queued':
        return 'Job queued for processing';
      case 'running':
        return 'Job is running';
      case 'succeeded':
        return 'Job completed successfully';
      case 'failed':
        return 'Job failed';
      case 'canceled':
        return 'Job was canceled';
      default:
        return 'Unknown status';
    }
  }
}
