-- Fix the stuck parent job that should be marked as succeeded
-- This script manually updates the parent job to succeeded status

BEGIN;

-- Update the parent job to succeeded status
UPDATE public.generation_jobs 
SET 
  status = 'succeeded',
  progress_pct = 100,
  finished_at = NOW()
WHERE 
  id = 'e6e68c43-9597-4640-9166-a8bd582d1119'
  AND status = 'queued'
  AND parent_job_id IS NULL;

-- Verify the update
SELECT 
  id,
  status,
  progress_pct,
  completed_count,
  item_count,
  finished_at
FROM public.generation_jobs 
WHERE id = 'e6e68c43-9597-4640-9166-a8bd582d1119';

COMMIT;
