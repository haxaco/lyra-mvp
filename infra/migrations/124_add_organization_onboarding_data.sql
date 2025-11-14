-- infra/migrations/124_add_organization_onboarding_data.sql
-- Add columns to store onboarding data in organizations table

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

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';

