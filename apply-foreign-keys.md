# Apply Foreign Key Constraints

## Method 1: Via Supabase SQL Editor (Recommended)

1. Go to https://supabase.nexcyte.com
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste this SQL:

```sql
-- Add foreign key constraint to auth.users table
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add foreign key constraint to tenants table
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
ON DELETE CASCADE;

-- Add index to improve foreign key lookup performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id
ON user_profiles(tenant_id);

-- Verify the constraints were added
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
AND contype = 'f';  -- 'f' means foreign key
```

4. Click **Run** to execute
5. You should see 2 foreign key constraints listed in the results

## Method 2: Via Command Line (Alternative)

If SSH is working, you can run:

```bash
cat supabase/migrations/00016_add_foreign_keys.sql | \
ssh root@nexcyte.com "docker exec -i supabase-db psql -U postgres -d postgres"
```

## Verification

After applying, verify the constraints exist:

```sql
-- Check all constraints on user_profiles table
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles'
  AND tc.constraint_type = 'FOREIGN KEY';
```

Expected results:
- `user_profiles_id_fkey` → auth.users(id)
- `user_profiles_tenant_id_fkey` → tenants(id)

## What This Does

**Foreign Key to auth.users:**
- Ensures every user_profile has a valid auth.users entry
- If an auth user is deleted, their profile is automatically deleted (CASCADE)
- Prevents orphaned profiles

**Foreign Key to tenants:**
- Ensures every user_profile belongs to a valid tenant
- If a tenant is deleted, all profiles are automatically deleted (CASCADE)
- Prevents orphaned profiles

**Performance Index:**
- Speeds up queries that join user_profiles with tenants
- Improves team member lookup performance

## Rollback (if needed)

If you need to remove the constraints:

```sql
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_tenant_id_fkey;
DROP INDEX IF EXISTS idx_user_profiles_tenant_id;
```
