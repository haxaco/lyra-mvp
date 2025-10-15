/**
 * Mureka API wrapper for server-side operations
 * Handles job creation and polling with proper error handling
 */

import { env } from './env';
import type { MurekaCreateParams, MurekaJobResult } from './types';

const MUREKA_API_BASE = 'https://api.mureka.ai';
const POLL_INTERVAL_MS = 2000; // 2 seconds
const MAX_POLL_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes

/**
 * Create a Mureka job with the provided parameters
 * @param params - Job creation parameters
 * @returns Provider job ID for tracking
 */
export async function createMurekaJob(params: MurekaCreateParams): Promise<{ providerJobId: string }> {
  const payload = {
    model: params.model || 'auto',
    n: Math.min(Math.max(1, params.n || 1), 3), // Clamp between 1-3
    lyrics: params.lyrics,
    ...(params.prompt && { prompt: params.prompt }),
    ...(params.reference_id && { reference_id: params.reference_id }),
    ...(params.vocal_id && { vocal_id: params.vocal_id }),
    ...(params.melody_id && { melody_id: params.melody_id }),
    ...(params.stream !== undefined && { stream: params.stream }),
  };

  try {
    const response = await fetch(`${MUREKA_API_BASE}/v1/song/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mureka API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from Mureka API: expected object');
    }

    // Extract job ID from response
    const providerJobId = result.job_id || result.id || result.task_id;
    if (!providerJobId) {
      throw new Error('Mureka API response missing job ID');
    }

    return { providerJobId: String(providerJobId) };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create Mureka job: ${error.message}`);
    }
    throw new Error('Failed to create Mureka job: Unknown error');
  }
}

/**
 * Poll a Mureka job until completion
 * @param providerJobId - The provider job ID to poll
 * @returns Job result with status and choices
 */
export async function pollMurekaJob(providerJobId: string): Promise<MurekaJobResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_POLL_TIMEOUT_MS) {
    try {
      const response = await fetch(`${MUREKA_API_BASE}/v1/song/query/${providerJobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.MUREKA_API_KEY}`,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        const errorText = await response.text();
        throw new Error(`Mureka API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from Mureka API: expected object');
      }

      const status = result.status || result.state;
      
      // Handle terminal states
      if (status === 'succeeded') {
        return {
          status: 'succeeded',
          choices: result.choices || result.results || [],
          trace_id: result.trace_id,
        };
      }
      
      if (status === 'failed' || status === 'timeouted' || status === 'cancelled') {
        return {
          status: 'failed',
          error: result.error || result.message || `Job ${status}`,
          trace_id: result.trace_id,
        };
      }
      
      // Continue polling for running/queued states
      if (status === 'preparing' || status === 'queued' || status === 'running' || status === 'streaming') {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        continue;
      }
      
      // Unknown status, treat as failed
      return {
        status: 'failed',
        error: `Unknown job status: ${status}`,
        trace_id: result.trace_id,
      };
      
    } catch (error) {
      // For network errors, retry with exponential backoff
      if (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('ECONNRESET')
      )) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS * 2));
        continue;
      }
      
      // For other errors, fail immediately
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error during polling',
      };
    }
  }
  
  // Timeout reached
  return {
    status: 'failed',
    error: `Job polling timeout after ${MAX_POLL_TIMEOUT_MS / 1000} seconds`,
  };
}

/**
 * Get job status without polling (single check)
 * @param providerJobId - The provider job ID to check
 * @returns Current job status
 */
export async function getMurekaJobStatus(providerJobId: string): Promise<MurekaJobResult> {
  try {
    const response = await fetch(`${MUREKA_API_BASE}/v1/song/query/${providerJobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.MUREKA_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mureka API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from Mureka API: expected object');
    }

    const status = result.status || result.state;
    
    return {
      status: status === 'succeeded' ? 'succeeded' :
              status === 'failed' || status === 'timeouted' || status === 'cancelled' ? 'failed' :
              status === 'preparing' || status === 'queued' || status === 'running' || status === 'streaming' ? 'running' : 'queued',
      choices: result.choices || result.results || [],
      trace_id: result.trace_id,
      error: result.error || result.message,
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
