-- infra/migrations/101_add_provider_to_generation_jobs.sql
-- Add missing provider column to generation_jobs table

ALTER TABLE public.generation_jobs 
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add index for the new provider column
CREATE INDEX IF NOT EXISTS idx_generation_jobs_provider ON public.generation_jobs (provider);

-- Update existing records to have provider = 'mureka' (since that's what the code expects)
UPDATE public.generation_jobs 
SET provider = 'mureka' 
WHERE provider IS NULL;

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
