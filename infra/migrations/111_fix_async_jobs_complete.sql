-- Migration: Complete fix for async jobs system
-- This migration addresses all the issues with the async job system in one go

-- 1. Make model_id nullable (fix for dynamic model names from APIs)
ALTER TABLE public.generation_jobs 
ALTER COLUMN model_id DROP NOT NULL;

-- 2. Remove the problematic check_parent_item_count constraint entirely
-- This constraint was causing more problems than it solved
ALTER TABLE public.generation_jobs 
DROP CONSTRAINT IF EXISTS check_parent_item_count;

-- 3. Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'generation_jobs' 
AND column_name = 'model_id' 
AND table_schema = 'public';

-- 4. Verify the constraint was removed
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'check_parent_item_count';

-- Should return no rows if successfully removed

-- 5. Show current state of generation_jobs table
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN parent_job_id IS NULL THEN 1 END) as parent_jobs,
    COUNT(CASE WHEN parent_job_id IS NOT NULL THEN 1 END) as child_jobs,
    COUNT(CASE WHEN model_id IS NULL THEN 1 END) as jobs_with_null_model_id
FROM public.generation_jobs;
