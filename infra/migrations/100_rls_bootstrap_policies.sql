-- Drop and recreate policies to fix infinite recursion issue
DROP POLICY IF EXISTS "Users can read memberships in their organizations" ON user_memberships;
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON user_memberships;
DROP POLICY IF EXISTS "Users can create their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can read their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create their own memberships" ON user_memberships;
DROP POLICY IF EXISTS "Users can read their own memberships" ON user_memberships;

-- Enable RLS on tables if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create organizations where they are the creator
CREATE POLICY "Users can create their own organizations"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can read organizations they are members of
CREATE POLICY "Users can read their organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_memberships
    WHERE user_memberships.organization_id = organizations.id
    AND user_memberships.user_id = auth.uid()
  )
);

-- Policy: Users can create memberships for themselves in any organization
CREATE POLICY "Users can create their own memberships"
ON user_memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own memberships (simple, no recursion)
CREATE POLICY "Users can read their own memberships"
ON user_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Note: More complex policies for managing other users' memberships
-- can be added later. For now, users can only manage their own memberships.

