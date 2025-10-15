-- Add is_active column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add last_login column for activity tracking
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add comment to document role hierarchy
COMMENT ON COLUMN user_profiles.role IS 'User role: owner (full access), admin (CRM access, no user mgmt), customer_service (view/edit customers), viewer (read-only), customer (public user)';

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON user_profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own basic profile info
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Owners and admins can view all team members in their tenant
CREATE POLICY "Owners and admins can view team members" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.tenant_id = user_profiles.tenant_id
      AND up.role IN ('owner', 'admin')
      AND up.is_active = true
    )
  );

-- Only owners can update team member roles and status
CREATE POLICY "Only owners can manage team members" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.tenant_id = user_profiles.tenant_id
      AND up.role = 'owner'
      AND up.is_active = true
    )
  );

-- Only owners can create new team members (via invite)
CREATE POLICY "Only owners can invite team members" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.tenant_id = user_profiles.tenant_id
      AND up.role = 'owner'
      AND up.is_active = true
    )
  );

-- Function: Check if user has role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['customer', 'viewer', 'customer_service', 'admin', 'owner'];
  user_level INTEGER;
  required_level INTEGER;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = user_id AND is_active = true;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT array_position(role_hierarchy, user_role) INTO user_level;
  SELECT array_position(role_hierarchy, required_role) INTO required_level;

  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_role ON user_profiles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_active ON user_profiles(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
