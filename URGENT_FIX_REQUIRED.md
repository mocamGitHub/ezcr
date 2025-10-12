# 🚨 Urgent Fix Required: Missing Tenant Data

## Problem Discovered

While testing the Stripe checkout, I discovered that **the tenant data is missing from your database**. This is causing the checkout to fail with a tenant configuration error.

## Root Cause

The initial schema (`00001_initial_schema.sql`) creates the `tenants` table but **doesn't insert any default tenant**. The application code expects a tenant with slug `'ezcr-01'` to exist.

## The Fix

I've created a new migration file:

**`supabase/migrations/00007_seed_tenant.sql`**

```sql
-- Seed default tenant for EZCR
INSERT INTO tenants (slug, name, subdomain, is_active)
VALUES ('ezcr-01', 'EZ Cycle Ramp', 'ezcr', true)
ON CONFLICT (slug) DO NOTHING;
```

## How to Apply This Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase instance: **https://supabase.nexcyte.com**
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
INSERT INTO tenants (slug, name, subdomain, is_active)
VALUES ('ezcr-01', 'EZ Cycle Ramp', 'ezcr', true)
ON CONFLICT (slug) DO NOTHING;
```

4. Verify it worked:

```sql
SELECT id, slug, name, subdomain FROM tenants;
```

You should see one row with slug `ezcr-01`.

### Option 2: Using Supabase CLI (if available)

```bash
supabase migration up
```

## After Applying the Fix

1. The dev server should automatically pick up the change (it's still running on port 3003)
2. Refresh the checkout page
3. Try submitting the form again
4. It should now successfully create a Stripe checkout session

## Verification

To verify the tenant exists, you can:

1. **Check the database** using the SQL above
2. **Try the checkout** - it should now work
3. **Check server logs** - should no longer see "tenant configuration error"

## What This Enables

Once the tenant is added:
- ✅ Checkout will work
- ✅ Orders will be created with proper tenant_id
- ✅ Multi-tenant architecture will function correctly
- ✅ All features will work as expected

## Current Server Status

- Dev server running on **http://localhost:3003**
- Stripe keys configured ✅
- Database migration for Stripe session applied ✅
- **Tenant data missing** ❌ ← **YOU ARE HERE**

## Next Steps

1. **Apply the tenant migration** (see above)
2. **Test checkout manually** at http://localhost:3003/checkout
3. **Run automated tests** with `npm run test:e2e:ui`
4. **Commit all changes** when tests pass

## Files Created

All the work is done, just needs the database fix:

- ✅ `playwright.config.ts` - Test configuration
- ✅ `tests/checkout.spec.ts` - E2E tests
- ✅ `tests/README.md` - Testing docs
- ✅ `supabase/migrations/00007_seed_tenant.sql` - **THIS FIX**
- ✅ `src/app/api/stripe/checkout/route.ts` - Updated with error handling
- ✅ `TESTING_SETUP.md` - Complete documentation

---

**Status**: 🔴 Blocked - Database migration required
**ETA to fix**: 2 minutes (just run the SQL)
**Impact**: Checkout completely non-functional until tenant is added
