-- Fix infinite recursion in RLS policies for user_profiles
-- The issue: policies were querying user_profiles to check permissions,
-- which triggers the same policies again, creating infinite recursion

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Owners and admins can view team members" ON user_profiles;
DROP POLICY IF EXISTS "Only owners can manage team members" ON user_profiles;
DROP POLICY IF EXISTS "Only owners can invite team members" ON user_profiles;

-- Simple, non-recursive policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Simple, non-recursive policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role bypasses RLS, so server actions with service client will work
-- No need for additional SELECT/UPDATE/INSERT policies since:
-- 1. Users can view/update their own profile (above policies)
-- 2. Admins/owners will use service role in server actions (bypasses RLS)

-- Note: This simplified approach works because:
-- - Regular users only need to see their own profile (covered above)
-- - Admin operations use createServiceClient() which bypasses RLS entirely
-- - This eliminates recursion while maintaining security
