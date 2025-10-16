-- Add concurrency_limit column to generation_jobs table
-- This allows per-parent control over how many child jobs run simultaneously

BEGIN;

-- Add concurrency_limit column with default value of 1 (sequential execution)
ALTER TABLE public.generation_jobs 
ADD COLUMN IF NOT EXISTS concurrency_limit int2 NOT NULL DEFAULT 1;

-- Add check constraint to ensure concurrency_limit is between 1 and 5
ALTER TABLE public.generation_jobs 
ADD CONSTRAINT check_concurrency_limit 
CHECK (concurrency_limit >= 1 AND concurrency_limit <= 5);

-- Update existing parent jobs to have concurrency_limit = 1
-- (This ensures existing jobs use sequential execution)
UPDATE public.generation_jobs 
SET concurrency_limit = 1 
WHERE parent_job_id IS NULL 
AND concurrency_limit IS NULL;

-- Add index for efficient querying of parent jobs with their concurrency limits
CREATE INDEX IF NOT EXISTS idx_generation_jobs_parent_concurrency 
ON public.generation_jobs (parent_job_id, concurrency_limit) 
WHERE parent_job_id IS NOT NULL;

-- Add index for efficient counting of running children per parent
CREATE INDEX IF NOT EXISTS idx_generation_jobs_parent_status 
ON public.generation_jobs (parent_job_id, status) 
WHERE parent_job_id IS NOT NULL;

COMMIT;
