-- infra/migrations/104_fix_generation_jobs_model_column.sql
-- Fix the model column issue in generation_jobs table

-- Drop the NOT NULL constraint on model_id first
ALTER TABLE public.generation_jobs 
ALTER COLUMN model_id DROP NOT NULL;

-- Make model_id nullable since we're using the model text column instead
-- The model column was added in migration 101, but model_id still has NOT NULL constraint

-- Update existing records to have a default model_id if they don't have one
-- (This is just to clean up any existing data)
UPDATE public.generation_jobs 
SET model_id = NULL 
WHERE model_id IS NOT NULL AND model IS NOT NULL;

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';

