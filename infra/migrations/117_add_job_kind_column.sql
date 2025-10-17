-- 117_add_job_kind_column.sql
-- Add 'kind' column to generation_jobs table and update existing jobs

BEGIN;

-- Add the kind column
ALTER TABLE public.generation_jobs
  ADD COLUMN IF NOT EXISTS kind text;

-- Add a check constraint for valid job kinds
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_job_kind' AND conrelid = 'public.generation_jobs'::regclass) THEN
    ALTER TABLE public.generation_jobs
      ADD CONSTRAINT check_job_kind CHECK (kind IN ('track.generate', 'playlist.generate'));
  END IF;
END
$$;

-- Update existing jobs based on their structure
-- Jobs with blueprints in params are playlist jobs
UPDATE public.generation_jobs
SET kind = 'playlist.generate'
WHERE params IS NOT NULL 
  AND jsonb_typeof(params) = 'object'
  AND params ? 'blueprints'
  AND jsonb_typeof(params->'blueprints') = 'array'
  AND jsonb_array_length(params->'blueprints') > 0;

-- Jobs with parent_job_id are child track jobs
UPDATE public.generation_jobs
SET kind = 'track.generate'
WHERE parent_job_id IS NOT NULL
  AND kind IS NULL;

-- Jobs without parent_job_id and without blueprints are standalone track jobs
UPDATE public.generation_jobs
SET kind = 'track.generate'
WHERE parent_job_id IS NULL
  AND (params IS NULL 
       OR jsonb_typeof(params) != 'object' 
       OR NOT (params ? 'blueprints' AND jsonb_typeof(params->'blueprints') = 'array'))
  AND kind IS NULL;

-- Set a default for any remaining NULL values (shouldn't happen, but safety)
UPDATE public.generation_jobs
SET kind = 'track.generate'
WHERE kind IS NULL;

-- Make the column NOT NULL after updating all existing rows
ALTER TABLE public.generation_jobs
  ALTER COLUMN kind SET NOT NULL;

-- Add an index for efficient querying by job kind
CREATE INDEX IF NOT EXISTS idx_generation_jobs_kind
ON public.generation_jobs (kind);

-- Add an index for querying by kind and status together
CREATE INDEX IF NOT EXISTS idx_generation_jobs_kind_status
ON public.generation_jobs (kind, status);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
