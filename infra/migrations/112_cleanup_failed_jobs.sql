-- Cleanup failed jobs and reset system for testing
-- This script cleans up failed jobs and resets the system to a clean state

BEGIN;

-- Set all running jobs to failed (in case any are stuck)
UPDATE public.generation_jobs 
SET 
  status = 'failed',
  error = 'Job manually failed due to system cleanup',
  finished_at = NOW()
WHERE 
  status = 'running' 
  AND organization_id = 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79';

-- Set all queued jobs to failed (in case any are stuck)
UPDATE public.generation_jobs 
SET 
  status = 'failed',
  error = 'Job manually failed due to system cleanup',
  finished_at = NOW()
WHERE 
  status = 'queued' 
  AND organization_id = 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79';

-- Show current job status
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job
FROM public.generation_jobs 
WHERE organization_id = 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79'
GROUP BY status
ORDER BY status;

-- Show recent jobs
SELECT 
  id,
  status,
  error,
  created_at,
  finished_at,
  parent_job_id IS NOT NULL as is_child_job
FROM public.generation_jobs 
WHERE organization_id = 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79'
ORDER BY created_at DESC
LIMIT 10;

COMMIT;
