-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
-- Migration: Enable RLS on user_profiles table
-- Date: 2025-01-15
-- Note: RLS was disabled during development for testing
--       Now that authentication is complete, we can enable it

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (this will be logged in migration output)
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') THEN
    RAISE NOTICE 'RLS successfully enabled on user_profiles table';
  ELSE
    RAISE WARNING 'RLS not enabled on user_profiles table';
  END IF;
END
$$;
