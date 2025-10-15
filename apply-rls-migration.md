# Apply RLS Migration

## Migration: 00015_enable_rls.sql

This migration enables Row Level Security (RLS) on the `user_profiles` table.

## How to Apply

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Access SQL Editor:**
   - Go to: https://supabase.nexcyte.com
   - Navigate to: SQL Editor

2. **Copy the SQL:**
   ```sql
   -- ========================================
   -- ENABLE ROW LEVEL SECURITY
   -- ========================================
   -- Migration: Enable RLS on user_profiles table
   -- Date: 2025-01-15

   -- Enable RLS on user_profiles table
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

   -- Verify RLS is enabled
   DO $$
   BEGIN
     IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') THEN
       RAISE NOTICE 'RLS successfully enabled on user_profiles table';
     ELSE
       RAISE WARNING 'RLS not enabled on user_profiles table';
     END IF;
   END
   $$;
   ```

3. **Execute the SQL**

4. **Verify:**
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'user_profiles';
   ```
   - Should show `rowsecurity = true`

### Option 2: Via SSH + psql

```bash
ssh root@nexcyte.com "docker exec supabase-db psql -U postgres -d postgres -c \"ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;\""
```

## What This Does

RLS (Row Level Security) provides database-level tenant isolation:

1. **Enforces policies at the database level** - Even if application code has bugs
2. **Tenant isolation** - Users can only access data for their tenant
3. **Role-based access** - Enforces owner/admin/viewer permissions
4. **Defense in depth** - Multiple layers of security

## Existing RLS Policies

The following policies are already created (from migration 00014):

1. **Users can view own profile** - All users can see their own profile
2. **Users can update own profile** - All users can update their basic info
3. **Owners and admins can view team members** - View all team members in tenant
4. **Only owners can manage team members** - Update roles and status
5. **Only owners can invite team members** - Create new team members

## Testing After Enabling

After enabling RLS, test the following:

1. **Login** - Should work normally (http://localhost:3002/login)
2. **View team page** - Should show all team members (http://localhost:3002/admin/team)
3. **Invite new member** - Should work for owners
4. **Update member** - Should work for owners

## Important Notes

- ⚠️ **Do NOT disable RLS in production** - Critical security feature
- ✅ **Service client bypasses RLS** - Our server actions use service client for database operations
- ✅ **User client respects RLS** - Used for authentication checks only
- 🔒 **Tenant isolation guaranteed** - Database enforces tenant boundaries

## Rollback (if needed)

If you need to disable RLS for debugging:

```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

**But DO NOT do this in production!**
