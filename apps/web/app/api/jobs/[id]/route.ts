/**
 * GET /api/jobs/[id]
 * Get job snapshot with children summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserAndOrg } from '@/lib/auth';
import { getJobById, getChildJobs } from '@/lib/db';
import { UnauthorizedError } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user and organization
    const { organizationId } = await getUserAndOrg();
    
    const jobId = params.id;
    
    // Get job details
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Verify organization access
    if (job.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Get children if this is a parent job
    let children = null;
    if (!job.parent_job_id) {
      children = await getChildJobs(jobId);
      
      // Add summary information
      const summary = {
        total: children.length,
        succeeded: children.filter(child => child.status === 'succeeded').length,
        failed: children.filter(child => child.status === 'failed').length,
        running: children.filter(child => child.status === 'running').length,
        queued: children.filter(child => child.status === 'queued').length,
      };
      
      return NextResponse.json({
        ...job,
        children,
        summary,
      });
    }
    
    return NextResponse.json(job);
    
  } catch (error) {
    console.error('Get job API error:', error);
    
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