-- Migration: Add async job system support
-- Adds parent/child job relationships and event tracking

-- Add new columns to generation_jobs table for async job support
ALTER TABLE public.generation_jobs 
ADD COLUMN IF NOT EXISTS parent_job_id uuid NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS provider_job_id text,
ADD COLUMN IF NOT EXISTS progress_pct int2 DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
ADD COLUMN IF NOT EXISTS item_count int4 DEFAULT 1 CHECK (item_count > 0),
ADD COLUMN IF NOT EXISTS completed_count int4 DEFAULT 0 CHECK (completed_count >= 0),
ADD COLUMN IF NOT EXISTS trace_id text;

-- Create job_events table for tracking job progress and events
CREATE TABLE IF NOT EXISTS public.job_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('queued', 'started', 'progress', 'item_succeeded', 'succeeded', 'failed', 'log')),
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_parent_job_id ON public.generation_jobs(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_provider_job_id ON public.generation_jobs(provider_job_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_org ON public.generation_jobs(status, organization_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_running ON public.generation_jobs(organization_id) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON public.job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_org_id ON public.job_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_events_created_at ON public.job_events(created_at);
CREATE INDEX IF NOT EXISTS idx_job_events_job_created ON public.job_events(job_id, created_at);

-- Ensure user_memberships is properly indexed for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_org ON public.user_memberships(user_id, organization_id);

-- Enable RLS on job_events table
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_events (mirror generation_jobs access)
-- Policy for SELECT: users can only see events for jobs in their organization
CREATE POLICY "Users can view job events for their organization" ON public.job_events
    FOR SELECT USING (
        organization_id IN (
            SELECT um.organization_id 
            FROM public.user_memberships um 
            WHERE um.user_id = auth.uid()
        )
    );

-- Policy for INSERT: users can only insert events for jobs in their organization
CREATE POLICY "Users can insert job events for their organization" ON public.job_events
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT um.organization_id 
            FROM public.user_memberships um 
            WHERE um.user_id = auth.uid()
        )
    );

-- Policy for UPDATE: users can only update events for jobs in their organization
CREATE POLICY "Users can update job events for their organization" ON public.job_events
    FOR UPDATE USING (
        organization_id IN (
            SELECT um.organization_id 
            FROM public.user_memberships um 
            WHERE um.user_id = auth.uid()
        )
    );

-- Policy for DELETE: users can only delete events for jobs in their organization
CREATE POLICY "Users can delete job events for their organization" ON public.job_events
    FOR DELETE USING (
        organization_id IN (
            SELECT um.organization_id 
            FROM public.user_memberships um 
            WHERE um.user_id = auth.uid()
        )
    );

-- Add constraint to ensure completed_count doesn't exceed item_count
ALTER TABLE public.generation_jobs 
ADD CONSTRAINT check_completed_count CHECK (completed_count <= item_count);

-- Add constraint to ensure parent jobs have item_count > 1
-- Note: Relaxed to allow parentless jobs with item_count > 1 for flexibility
ALTER TABLE public.generation_jobs 
ADD CONSTRAINT check_parent_item_count CHECK (
    (parent_job_id IS NULL) OR 
    (parent_job_id IS NOT NULL AND item_count > 1)
);

-- Create function to update parent job progress when child jobs complete
CREATE OR REPLACE FUNCTION update_parent_job_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_completed_count int;
    v_failed_count int;
    v_item_count int;
    v_parent_id uuid;
BEGIN
    -- Only update if this is a child job and status changed to terminal
    IF NEW.parent_job_id IS NOT NULL AND 
       OLD.status IS DISTINCT FROM NEW.status AND 
       NEW.status IN ('succeeded', 'failed', 'canceled') THEN
        
        v_parent_id := NEW.parent_job_id;
        
        -- Get counts atomically to avoid race conditions
        SELECT 
            COUNT(*) FILTER (WHERE status IN ('succeeded', 'failed', 'canceled')),
            COUNT(*) FILTER (WHERE status = 'failed'),
            item_count
        INTO v_completed_count, v_failed_count, v_item_count
        FROM public.generation_jobs 
        WHERE id = v_parent_id;
        
        -- Update parent job atomically with computed values
        UPDATE public.generation_jobs 
        SET 
            completed_count = v_completed_count,
            progress_pct = CASE 
                WHEN v_item_count > 0 THEN 
                    LEAST(100, ROUND((v_completed_count::numeric * 100) / v_item_count)::int)
                ELSE 0 
            END,
            status = CASE 
                WHEN v_completed_count = v_item_count AND status = 'running' THEN
                    CASE WHEN v_failed_count > 0 THEN 'failed' ELSE 'succeeded' END
                ELSE status
            END,
            finished_at = CASE 
                WHEN v_completed_count = v_item_count AND status = 'running' THEN now()
                ELSE finished_at
            END
        WHERE id = v_parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update parent job progress
-- Only trigger when status changes to terminal states
CREATE TRIGGER trigger_update_parent_job_progress
    AFTER UPDATE ON public.generation_jobs
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('succeeded', 'failed', 'canceled'))
    EXECUTE FUNCTION update_parent_job_progress();

-- Add comments for documentation
COMMENT ON TABLE public.job_events IS 'Tracks events and progress for async job processing';
COMMENT ON COLUMN public.generation_jobs.parent_job_id IS 'Reference to parent job for playlist generation';
COMMENT ON COLUMN public.generation_jobs.provider_job_id IS 'External provider job ID (e.g., Mureka task ID)';
COMMENT ON COLUMN public.generation_jobs.progress_pct IS 'Job progress percentage (0-100)';
COMMENT ON COLUMN public.generation_jobs.item_count IS 'Total number of items to process (1 for single track, >1 for playlists)';
COMMENT ON COLUMN public.generation_jobs.completed_count IS 'Number of completed items';
COMMENT ON COLUMN public.generation_jobs.trace_id IS 'External provider trace ID for debugging';
