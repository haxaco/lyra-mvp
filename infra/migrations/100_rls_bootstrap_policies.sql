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

-- Policy: Users can read memberships in organizations they belong to
CREATE POLICY "Users can read memberships in their organizations"
ON user_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_memberships um
    WHERE um.organization_id = user_memberships.organization_id
    AND um.user_id = auth.uid()
  )
);

-- Policy: Organization owners can add/update members
CREATE POLICY "Organization owners can manage memberships"
ON user_memberships
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_memberships
    WHERE user_id = auth.uid()
    AND organization_id = user_memberships.organization_id
    AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_memberships
    WHERE user_id = auth.uid()
    AND organization_id = user_memberships.organization_id
    AND role = 'owner'
  )
);

