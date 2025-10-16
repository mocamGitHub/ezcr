-- Migration: Add Foreign Key Constraints
-- Description: Adds referential integrity constraints to user_profiles table
-- Date: 2025-01-15

-- Add foreign key constraint to auth.users table
-- This ensures that every user_profile has a corresponding auth.users entry
-- CASCADE means if the auth user is deleted, the profile is also deleted
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add foreign key constraint to tenants table
-- This ensures that every user_profile belongs to a valid tenant
-- CASCADE means if the tenant is deleted, all associated profiles are also deleted
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
ON DELETE CASCADE;

-- Add index to improve foreign key lookup performance
-- This speeds up queries that join user_profiles with tenants
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id
ON user_profiles(tenant_id);

-- Verify the constraints were added
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints added successfully';
  RAISE NOTICE 'user_profiles.id -> auth.users.id (CASCADE)';
  RAISE NOTICE 'user_profiles.tenant_id -> tenants.id (CASCADE)';
END $$;
