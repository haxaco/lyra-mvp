/**
 * React hook for job status tracking with SSE and polling fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LyraJobs, JobSnapshot, JobEvent } from '../jobs';

export interface UseJobOptions {
  pollMs?: number;
  enableSSE?: boolean;
}

export interface UseJobReturn {
  job: JobSnapshot | null;
  status: string;
  progress: number;
  children?: JobSnapshot[];
  events: JobEvent[];
  isTerminal: boolean;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * React hook for tracking job status with real-time updates
 * Uses SSE with polling fallback for maximum reliability
 */
export function useJob(jobId: string, options: UseJobOptions = {}): UseJobReturn {
  const { pollMs = 2500, enableSSE = true } = options;
  
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const jobsClient = useRef(new LyraJobs());
  const eventStream = useRef<{ close: () => void } | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const isSSEActive = useRef(false);
  const lastEventTime = useRef<string | null>(null);

  // Fetch job data
  const fetchJob = useCallback(async () => {
    try {
      const jobData = await jobsClient.current.getJob(jobId);
      setJob(jobData);
      setError(null);
      return jobData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job';
      setError(errorMessage);
      console.error('Failed to fetch job:', err);
      return null;
    }
  }, [jobId]);

  // Initial fetch
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchJob();
    setIsLoading(false);
  }, [fetchJob]);

  // Handle SSE events
  const handleSSEEvent = useCallback((event: JobEvent) => {
    console.log(`[Job ${jobId}] SSE Event:`, event.type, event.data);
    
    // Add event to events list
    setEvents(prev => [...prev, event]);
    
    // Update job data if available
    if (event.data && event.data.job_id === jobId) {
      setJob(prev => prev ? {
        ...prev,
        status: event.data.status || prev.status,
        progress_pct: event.data.progress_pct !== undefined ? event.data.progress_pct : prev.progress_pct,
        completed_count: event.data.completed_count !== undefined ? event.data.completed_count : prev.completed_count,
        item_count: event.data.item_count !== undefined ? event.data.item_count : prev.item_count,
      } : null);
    }
    
    // Stop polling if SSE is working
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    
    // Close SSE if job is complete
    if (event.type === 'complete' || event.type === 'failed' || event.type === 'succeeded') {
      if (eventStream.current) {
        eventStream.current.close();
        eventStream.current = null;
        isSSEActive.current = false;
      }
    }
  }, [jobId]);

  // Start SSE connection
  const startSSE = useCallback(() => {
    if (!enableSSE || isSSEActive.current) return;
    
    try {
      isSSEActive.current = true;
      eventStream.current = jobsClient.current.openEventStream(jobId, handleSSEEvent);
      
      // Set up SSE error handling
      setTimeout(() => {
        if (isSSEActive.current && !job?.status) {
          // SSE didn't work, fall back to polling
          console.log(`[Job ${jobId}] SSE failed, falling back to polling`);
          isSSEActive.current = false;
          if (eventStream.current) {
            eventStream.current.close();
            eventStream.current = null;
          }
          startPolling();
        }
      }, 5000); // Wait 5 seconds for SSE to establish
      
    } catch (err) {
      console.error(`[Job ${jobId}] SSE connection failed:`, err);
      isSSEActive.current = false;
      startPolling();
    }
  }, [jobId, enableSSE, handleSSEEvent, job?.status]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollInterval.current) return;
    
    console.log(`[Job ${jobId}] Starting polling fallback`);
    pollInterval.current = setInterval(async () => {
      try {
        const jobData = await fetchJob();
        console.log(`[Job ${jobId}] Polling result:`, jobData?.status);
        
        if (jobData && jobsClient.current.isTerminalStatus(jobData.status)) {
          // Job is complete (succeeded, failed, or canceled), stop polling
          console.log(`[Job ${jobId}] Job reached terminal status: ${jobData.status}, stopping polling`);
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      } catch (error) {
        console.error(`[Job ${jobId}] Polling error:`, error);
        // Stop polling on error to prevent infinite loops
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
    }, pollMs);
  }, [jobId, fetchJob, pollMs]);

  // Initialize
  useEffect(() => {
    if (!jobId) return;
    
    // Initial fetch
    refetch();
    
    // Start SSE
    startSSE();
    
    // Cleanup
    return () => {
      if (eventStream.current) {
        eventStream.current.close();
        eventStream.current = null;
      }
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      isSSEActive.current = false;
    };
  }, [jobId, refetch, startSSE]);

  // Cleanup on unmount or jobId change
  useEffect(() => {
    return () => {
      // Clean up polling interval
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      
      // Clean up SSE connection
      if (eventStream.current) {
        eventStream.current.close();
        eventStream.current = null;
        isSSEActive.current = false;
      }
    };
  }, [jobId]);

  // Computed values
  const status = job?.status || 'unknown';
  const progress = job?.progress_pct || 0;
  const children = job?.children;
  const isTerminal = jobsClient.current.isTerminalStatus(status);

  return {
    job,
    status,
    progress,
    children,
    events,
    isTerminal,
    error,
    isLoading,
    refetch,
  };
}
