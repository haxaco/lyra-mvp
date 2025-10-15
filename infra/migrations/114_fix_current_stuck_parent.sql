-- infra/migrations/114_fix_current_stuck_parent.sql
-- Manually fix the current stuck parent job that has a completed child job

BEGIN;

-- Define the parent job ID that needs to be fixed
-- This is the parent job that's stuck in 'queued' status
DO $$
DECLARE
    _parent_job_id UUID := '735bf5db-51f7-4011-b43e-9bb98fd35228'; -- The stuck parent job
    _organization_id UUID := 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79'; -- Organization ID
    _total_children INT;
    _succeeded_children INT;
    _failed_children INT;
    _running_children INT;
    _final_status TEXT;
BEGIN
    -- Get counts of children by status (not track counts)
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END),
        COUNT(CASE WHEN status = 'failed' THEN 1 END),
        COUNT(CASE WHEN status IN ('running', 'queued') THEN 1 END)
    INTO
        _total_children,
        _succeeded_children,
        _failed_children,
        _running_children
    FROM
        public.generation_jobs
    WHERE
        parent_job_id = _parent_job_id;

    -- Determine final status for the parent based on child job completion
    IF _running_children > 0 THEN
        -- Still have running children, don't update parent yet
        RAISE NOTICE 'Parent job % still has % running children. Succeeded: %, Failed: %', _parent_job_id, _running_children, _succeeded_children, _failed_children;
        RETURN; -- Exit without updating if children are still running
    ELSIF _failed_children > 0 THEN
        _final_status := 'failed';
    ELSIF _succeeded_children = _total_children AND _total_children > 0 THEN
        _final_status := 'succeeded';
    ELSE
        -- No children or unexpected state
        RAISE NOTICE 'Parent job % has unexpected child state. Total: %, Succeeded: %, Failed: %, Running: %', _parent_job_id, _total_children, _succeeded_children, _failed_children, _running_children;
        RETURN; -- Exit without updating if unexpected state
    END IF;

    -- Update the parent job
    UPDATE public.generation_jobs
    SET
        status = _final_status,
        completed_count = _succeeded_children + _failed_children, -- Count completed child jobs
        progress_pct = CASE WHEN _total_children > 0 THEN ROUND(((_succeeded_children + _failed_children)::NUMERIC / _total_children) * 100) ELSE 0 END,
        finished_at = NOW(),
        error = CASE WHEN _final_status = 'failed' THEN 'Parent job marked failed due to child job failures' ELSE NULL END
    WHERE
        id = _parent_job_id
        AND organization_id = _organization_id;

    RAISE NOTICE 'Parent job % updated to status: % (succeeded: %/% child jobs)', _parent_job_id, _final_status, _succeeded_children, _total_children;

    -- Emit a final event for the parent job
    INSERT INTO public.job_events (job_id, organization_id, type, payload)
    VALUES (
        _parent_job_id,
        _organization_id,
        _final_status,
        jsonb_build_object(
            'message', 'Parent job manually updated to ' || _final_status,
            'completed_children', _succeeded_children + _failed_children,
            'succeeded_children', _succeeded_children,
            'failed_children', _failed_children,
            'total_children', _total_children
        )
    );
END $$;

-- Verify the update
SELECT
    id,
    status,
    error,
    progress_pct,
    completed_count,
    item_count,
    finished_at,
    created_at
FROM public.generation_jobs
WHERE
    id = '735bf5db-51f7-4011-b43e-9bb98fd35228';

-- Show child jobs for reference
SELECT
    id,
    status,
    item_count,
    completed_count,
    progress_pct,
    created_at
FROM public.generation_jobs
WHERE
    parent_job_id = '735bf5db-51f7-4011-b43e-9bb98fd35228'
ORDER BY created_at;

NOTIFY pgrst, 'reload schema';

COMMIT;
