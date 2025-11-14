-- Combined migration script for organization onboarding
-- Run this script to add onboarding support to your database
-- 
-- Usage:
--   psql $DATABASE_URL -f infra/migrations/run_onboarding_migrations.sql
--   OR via Supabase Dashboard SQL Editor

-- ============================================================================
-- Migration 123: Add onboarding_completed_at to organizations table
-- ============================================================================

-- Add onboarding_completed_at column to track when organization completed onboarding
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON public.organizations (onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.onboarding_completed_at IS 'Timestamp when the organization completed the onboarding flow. If set, new users joining this organization skip onboarding.';

-- ============================================================================
-- Migration 124: Add onboarding data columns to organizations table
-- ============================================================================

-- Add industry and size columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS size text;

-- Add index for industry queries
CREATE INDEX IF NOT EXISTS idx_organizations_industry 
ON public.organizations (industry) 
WHERE industry IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.industry IS 'Industry type collected during onboarding (e.g., Café, Gym, Retail Store)';
COMMENT ON COLUMN public.organizations.size IS 'Business size collected during onboarding (e.g., 1-10 employees, 11-50 employees)';

-- ============================================================================
-- Notify PostgREST to reload schema (if using Supabase)
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding migrations completed successfully!';
  RAISE NOTICE '   - Added onboarding_completed_at column';
  RAISE NOTICE '   - Added industry column';
  RAISE NOTICE '   - Added size column';
END $$;

