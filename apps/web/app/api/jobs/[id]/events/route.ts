/**
 * GET /api/jobs/[id]/events
 * Server-Sent Events endpoint for real-time job progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserAndOrg } from '@/lib/auth';
import { getJobById, getRecentJobEvents } from '@/lib/db';
import { UnauthorizedError } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user and organization
    const { organizationId } = await getUserAndOrg();
    
    const jobId = params.id;
    
    // Verify job exists and user has access
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if (job.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Create SSE response
    const encoder = new TextEncoder();
    let isActive = true; // Move to outer scope so cancel() can access it
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial job snapshot
        const initialEvent = {
          type: 'progress',
          data: {
            job_id: jobId,
            status: job.status,
            progress_pct: job.progress_pct,
            completed_count: job.completed_count,
            item_count: job.item_count,
            message: 'Connected to job events stream'
          }
        };
        
        controller.enqueue(
          encoder.encode(`event: ${initialEvent.type}\ndata: ${JSON.stringify(initialEvent.data)}\n\n`)
        );
        
        // Set up polling for new events
        let lastEventTime = new Date().toISOString();
        const pollInterval = 1000; // 1 second
        
        const pollForEvents = async () => {
          try {
            if (!isActive) return;
            
            const events = await getRecentJobEvents(jobId, lastEventTime);
            
            for (const event of events) {
              if (!isActive) break;
              
              const sseEvent = {
                type: event.type,
                data: {
                  job_id: jobId,
                  event_id: event.id,
                  payload: event.payload,
                  created_at: event.created_at,
                  ...event.payload // Spread payload data for easier access
                }
              };
              
              try {
                controller.enqueue(
                  encoder.encode(`event: ${sseEvent.type}\ndata: ${JSON.stringify(sseEvent.data)}\n\n`)
                );
              } catch (enqueueError) {
                console.log(`[SSE ${jobId}] Controller closed, stopping polling`);
                isActive = false;
                return;
              }
              
              lastEventTime = event.created_at;
            }
            
            // Check if job is terminal
            const currentJob = await getJobById(jobId);
            if (currentJob && ['succeeded', 'failed', 'canceled'].includes(currentJob.status)) {
              // Send final event and close stream
              const finalEvent = {
                type: 'complete',
                data: {
                  job_id: jobId,
                  status: currentJob.status,
                  progress_pct: currentJob.progress_pct,
                  completed_count: currentJob.completed_count,
                  item_count: currentJob.item_count,
                  message: `Job ${currentJob.status}`
                }
              };
              
              try {
                controller.enqueue(
                  encoder.encode(`event: ${finalEvent.type}\ndata: ${JSON.stringify(finalEvent.data)}\n\n`)
                );
                controller.close();
              } catch (closeError) {
                console.log(`[SSE ${jobId}] Controller already closed`);
              }
              
              isActive = false;
              return;
            }
            
            // Continue polling
            if (isActive) {
              setTimeout(pollForEvents, pollInterval);
            }
            
          } catch (error) {
            console.error(`[SSE ${jobId}] Polling error:`, error);
            
            // Only send error event if controller is still active
            if (isActive) {
              try {
                const errorEvent = {
                  type: 'error',
                  data: {
                    job_id: jobId,
                    error: 'Failed to poll for events',
                    message: 'Connection may be unstable'
                  }
                };
                
                controller.enqueue(
                  encoder.encode(`event: ${errorEvent.type}\ndata: ${JSON.stringify(errorEvent.data)}\n\n`)
                );
                
                // Continue polling despite error
                setTimeout(pollForEvents, pollInterval);
              } catch (enqueueError) {
                console.log(`[SSE ${jobId}] Controller closed during error handling`);
                isActive = false;
              }
            }
          }
        };
        
        // Start polling
        setTimeout(pollForEvents, pollInterval);
        
        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          console.log(`[SSE ${jobId}] Client disconnected`);
          isActive = false;
          try {
            controller.close();
          } catch (closeError) {
            console.log(`[SSE ${jobId}] Controller already closed during abort`);
          }
        });
      },
      
      cancel() {
        console.log(`[SSE ${jobId}] Stream cancelled`);
        isActive = false;
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
    
  } catch (error) {
    console.error('SSE API error:', error);
    
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
