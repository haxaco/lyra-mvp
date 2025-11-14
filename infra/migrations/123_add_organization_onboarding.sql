-- infra/migrations/123_add_organization_onboarding.sql
-- Add onboarding_completed_at to organizations table

-- Add onboarding_completed_at column to track when organization completed onboarding
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON public.organizations (onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.onboarding_completed_at IS 'Timestamp when the organization completed the onboarding flow. If set, new users joining this organization skip onboarding.';

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';

