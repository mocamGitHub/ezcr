# Foreign Key Constraints Note

## Issue
The `user_profiles` table is missing foreign key constraints to `auth.users` and `tenants` tables.

## Why They Were Removed
During initial setup, we had to drop the FK constraints to manually insert user profiles via the Supabase SQL Editor. The SQL Editor cannot properly validate foreign keys to the `auth.users` table because it's in a different schema (`auth` schema vs `public` schema).

## Impact
**Development**: Minimal impact. The application code uses the Supabase Admin API which properly enforces referential integrity.

**Production**: The constraints should be re-added in production for data integrity.

## How to Restore (Production Only)
Run this SQL when deploying to production:

```sql
-- Restore foreign key constraints for user_profiles table

-- 1. Foreign key to auth.users
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Foreign key to tenants
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
ON DELETE CASCADE;
```

## Alternative: Add via Migration
These constraints should be added via a proper migration file that runs in the context of the application (not the SQL Editor), where the auth schema is accessible.

## Current Workaround
For development, we're relying on:
1. Application-level validation in `inviteTeamMember()` function
2. Supabase Auth Admin API which properly validates users
3. RLS policies that enforce tenant isolation

This is safe for development but should be addressed before production deployment.
