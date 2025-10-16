import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Get the organization ID from the request body
    const { organizationId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Set all running/queued jobs to failed status for the specific organization
    const { data, error } = await supabaseAdmin()
      .from('generation_jobs')
      .update({
        status: 'failed',
        error: 'Cleaned up stuck job - org concurrency limit reached',
        finished_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .in('status', ['running', 'queued']);

    if (error) {
      console.error('Error cleaning up jobs:', error);
      return NextResponse.json({ error: 'Failed to clean up jobs' }, { status: 500 });
    }

    // Get current job statuses for the organization
    const { data: jobStatuses, error: statusError } = await supabaseAdmin()
      .from('generation_jobs')
      .select('status')
      .eq('organization_id', organizationId);

    if (statusError) {
      console.error('Error getting job statuses:', statusError);
      return NextResponse.json({ error: 'Failed to get job statuses' }, { status: 500 });
    }

    // Count jobs by status
    const statusCounts = jobStatuses.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      message: 'Jobs cleaned up successfully',
      statusCounts,
      organizationId
    });

  } catch (error) {
    console.error('Error in cleanup-jobs endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
