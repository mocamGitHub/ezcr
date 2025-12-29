# Row Level Security (RLS) Policies

**Last Updated**: 2025-12-29
**Database**: Supabase PostgreSQL

---

## Overview

This document describes all Row Level Security (RLS) policies configured for the EZCR application. RLS provides database-level security by controlling which rows users can access based on their identity and role.

### Key Concepts

- **RLS Enabled Tables**: Tables with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- **Service Role Bypass**: Service role (`SUPABASE_SERVICE_KEY`) bypasses all RLS policies
- **Authenticated Users**: Users with valid Supabase Auth sessions
- **Tenant Isolation**: Multi-tenant data isolation via `tenant_id`

---

## Tables with RLS Enabled

| Table | RLS Enabled | Policy Strategy |
|-------|-------------|-----------------|
| `user_profiles` | Yes | User owns their row |
| `products` | Yes | Public read, auth update |
| `product_categories` | Yes | Public read |
| `product_images` | Yes | Public read |
| `product_variants` | Yes | Public read |
| `orders` | Yes | Auth user full access |
| `order_items` | Yes | Auth user read |
| `product_configurations` | Yes | User owns their rows |
| `testimonials` | Yes | Complex (see below) |
| `inventory_transactions` | Yes | Auth read, service write |
| `knowledge_base` | Yes | Public read active |
| `chat_sessions` | Yes | User owns their rows |
| `chat_messages` | Yes | User owns their rows |
| `fomo_banners` | Yes | Public read enabled |
| `blog_posts` | Yes | Public read published |
| `carts` / `cart_items` | Yes | Public full access |
| `configurator_*` | Yes | Public read |
| `crm_*` | Yes | Tenant-scoped |
| `qbo_*` | Yes | Tenant-scoped |
| `nx_scheduler_*` | Yes | User/tenant-scoped |

---

## Policy Details by Table

### user_profiles

```sql
-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Notes**: Simplified to avoid recursion. Admin operations use service role.

---

### products

```sql
-- Public can view active products
CREATE POLICY "Public can view active products"
  FOR SELECT USING (is_active = true);

-- Authenticated users can view all products (admin)
CREATE POLICY "Authenticated users can view all products"
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can update products (inventory)
CREATE POLICY "Authenticated users can update products"
  FOR UPDATE TO authenticated USING (true)
  WITH CHECK (true);
```

---

### orders & order_items

```sql
-- Authenticated users can view all orders (admin dashboard)
CREATE POLICY "Authenticated users can view all orders"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update orders"
  FOR UPDATE TO authenticated USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all order items"
  FOR SELECT TO authenticated USING (true);
```

**Security Note**: API layer (`requireRole`) enforces admin-only access. Database allows any authenticated user.

---

### testimonials

```sql
-- Public can view approved testimonials
CREATE POLICY testimonials_public_view
  FOR SELECT USING (status = 'approved');

-- Users can view their own submissions
CREATE POLICY testimonials_own_view
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can submit testimonials
CREATE POLICY testimonials_insert
  FOR INSERT WITH CHECK (true);

-- Users can update their pending submissions
CREATE POLICY testimonials_own_update
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all testimonials (via role check)
CREATE POLICY testimonials_admin_view
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Admins can update any testimonial
CREATE POLICY testimonials_admin_update
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );
```

---

### inventory_transactions

```sql
-- Authenticated users can view (for audit trail)
CREATE POLICY "Authenticated users can view inventory transactions"
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert (from API)
CREATE POLICY "Service role can manage inventory transactions"
  FOR ALL TO service_role USING (true);
```

---

### knowledge_base / chat_*

```sql
-- Public can view active knowledge base articles
CREATE POLICY "Public can view active knowledge base"
  FOR SELECT USING (is_active = true);

-- Users own their chat sessions
CREATE POLICY "Users can view their chat sessions"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages tied to user's sessions
CREATE POLICY "Users can view their messages"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE id = session_id AND user_id = auth.uid())
  );
```

---

### CRM Tables (customer_*, crm_*)

```sql
-- Service role full access
CREATE POLICY "Service role has full access to customer_tags"
  FOR ALL TO service_role USING (true);

-- Tenant-scoped read for authenticated users
CREATE POLICY "Authenticated users can view their tenant's tags"
  FOR SELECT TO authenticated USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );
```

**Pattern**: Service role for writes, tenant-scoped reads for authenticated users.

---

### QBO Sync Tables (qbo_*, web_transactions)

```sql
-- Service role for sync operations
CREATE POLICY "Service role full access on qbo_sync_state"
  FOR ALL TO service_role USING (true);

-- Tenant users can view their data
CREATE POLICY "Tenant users can view qbo_sync_state"
  FOR SELECT TO authenticated USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );
```

---

### Scheduler Tables (nx_*)

```sql
-- Calendar subscriptions: User owns their rows
CREATE POLICY "sub_select_own"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sub_insert_own"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Shortcuts tokens: User owns their tokens
CREATE POLICY "token_select_own"
  FOR SELECT USING (user_id = auth.uid());

-- Audit log: Admin read only
CREATE POLICY "audit_select_admin"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Audit log: No client inserts (service role only)
CREATE POLICY "audit_no_client_insert"
  FOR INSERT WITH CHECK (false);
```

---

## Security Patterns

### 1. User Ownership Pattern
Used for personal data (profiles, chat sessions, calendar prefs):
```sql
FOR SELECT USING (auth.uid() = user_id)
FOR UPDATE USING (auth.uid() = user_id)
```

### 2. Tenant Isolation Pattern
Used for multi-tenant data (CRM, QBO, orders):
```sql
FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
)
```

### 3. Public Read Pattern
Used for catalog data (products, categories):
```sql
FOR SELECT USING (is_active = true)  -- or: USING (true)
```

### 4. Service Role Write Pattern
Used for system operations (sync, audit):
```sql
FOR ALL TO service_role USING (true)
FOR INSERT WITH CHECK (false)  -- Blocks client writes
```

### 5. Admin Check Pattern
Used for admin-only data:
```sql
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
)
```

---

## Security Recommendations

### Current Gaps

1. **Admin Policies Rely on Middleware**: Orders and products allow all authenticated users at DB level. Security enforced by API middleware. Consider adding role checks to DB policies.

2. **Cart Tables Too Permissive**: `carts` and `cart_items` allow public full access. Consider:
   - Anonymous session tokens
   - User ownership after authentication

3. **Audit Log Cleanup**: Add policies to prevent deletion (currently only insert blocked).

### Best Practices Implemented

- Service role for write operations on sensitive tables
- User ownership for personal data
- Tenant isolation for multi-tenant data
- Public read for catalog/marketing data
- Admin checks for administrative operations

---

## Testing RLS

```sql
-- Test as authenticated user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM user_profiles;  -- Should only see own profile

-- Test as service role (bypasses RLS)
-- Use SUPABASE_SERVICE_KEY in API calls
```

---

## Related Files

- `supabase/migrations/00001_initial_schema.sql` - Core RLS setup
- `supabase/migrations/00015_enable_rls.sql` - RLS enablement
- `supabase/migrations/00018_fix_rls_recursion.sql` - Recursion fix
- `supabase/migrations/00031_admin_rls_policies.sql` - Admin policies
- `src/lib/supabase/admin.ts` - Service client (bypasses RLS)
- `src/lib/supabase/server.ts` - Authenticated client (respects RLS)
