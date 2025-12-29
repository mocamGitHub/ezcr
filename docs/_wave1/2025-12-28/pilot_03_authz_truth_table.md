# Pilot 3: Multi-Tenant Authorization Truth Table

**Date**: 2025-12-28
**Status**: Complete

---

## Role Hierarchy

```
nexcyte_admin (super admin - cross-tenant)
    └── owner (tenant owner - full tenant access)
        └── admin (tenant admin - CRM, no user mgmt)
            └── customer_service (view/edit customers)
                └── viewer (read-only)
                    └── customer (public user)
```

---

## Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| `nexcyte_admin` | Platform | Super admin, all tenants |
| `owner` | Tenant | Full tenant access, user management |
| `admin` | Tenant | CRM access, no user management |
| `customer_service` | Tenant | Customer view/edit only |
| `viewer` | Tenant | Read-only access |
| `customer` | Public | Basic user, own data only |

---

## API Route Authorization Matrix

### Admin Routes (`/api/admin/*`)

| Route | Method | owner | admin | customer_service | viewer | customer | Public |
|-------|--------|-------|-------|------------------|--------|----------|--------|
| `/api/admin/testimonials` | GET | Y | Y | Y | Y | - | - |
| `/api/admin/testimonials` | POST | Y | Y | - | - | - | - |
| `/api/admin/testimonials/[id]` | PATCH | Y | Y | - | - | - | - |
| `/api/admin/testimonials/[id]/approve` | POST | Y | Y | - | - | - | - |
| `/api/admin/testimonials/[id]/reject` | POST | Y | Y | - | - | - | - |
| `/api/admin/testimonials/[id]/respond` | POST | Y | Y | Y | - | - | - |
| `/api/admin/fomo-banners` | ALL | Y | Y | - | - | - | - |

### Schedule Routes (`/api/schedule/*`)

| Route | Method | owner | admin | customer_service | viewer | customer | Public |
|-------|--------|-------|-------|------------------|--------|----------|--------|
| `/api/schedule/slots` | GET | Y | Y | Y | Y | Y | Y |
| `/api/schedule/book` | POST | Y | Y | Y | - | Y | - |
| `/api/schedule/cancel` | POST | Y | Y | Y | - | Y (own) | - |
| `/api/schedule/reschedule` | POST | Y | Y | Y | - | Y (own) | - |
| `/api/schedule/my-bookings` | GET | Y | Y | Y | Y | Y (own) | - |

### Shortcuts/Tokens Routes (`/api/shortcuts/*`)

| Route | Method | owner | admin | customer_service | viewer | customer | Public |
|-------|--------|-------|-------|------------------|--------|----------|--------|
| `/api/shortcuts/tokens` | GET | Y | - | - | - | - | - |
| `/api/shortcuts/tokens` | POST | Y | - | - | - | - | - |
| `/api/shortcuts/today` | GET | Token | Token | Token | Token | - | - |
| `/api/shortcuts/block-time` | POST | Token | Token | - | - | - | - |

### AI Routes (`/api/ai/*`)

| Route | Method | owner | admin | customer_service | viewer | customer | Public |
|-------|--------|-------|-------|------------------|--------|----------|--------|
| `/api/ai/chat` | POST | Y | Y | Y | Y | Y | Y |
| `/api/ai/chat-rag` | POST | Y | Y | Y | Y | Y | Y |
| `/api/ai/validate-measurement` | POST | Y | Y | Y | Y | Y | Y |
| `/api/embeddings/generate` | POST | Y | Y | - | - | - | - |

### Public Routes (No Auth Required)

| Route | Method | Notes |
|-------|--------|-------|
| `/api/health` | GET | Health check |
| `/api/testimonials` | GET | Public testimonials |
| `/api/testimonials/submit` | POST | Submit testimonial |
| `/api/fomo-banner` | GET | Active banner |
| `/api/shipping-quote` | POST | Get shipping quote |
| `/api/configurations` | GET | Product configs |

### Webhook Routes (Signature Auth)

| Route | Method | Auth Type |
|-------|--------|-----------|
| `/api/stripe/webhook` | POST | Stripe signature |
| `/api/webhooks/twilio/inbound` | POST | Twilio signature |
| `/api/webhooks/twilio/status` | POST | Twilio signature |
| `/api/webhooks/mailgun/events` | POST | Mailgun signature |
| `/api/webhooks/mailgun/inbound/[secret]` | POST | URL secret |
| `/api/shipping-webhook` | POST | TForce signature |

---

## Database Table RLS Policies

### Products Table

| Policy Name | Action | Condition |
|-------------|--------|-----------|
| `public_read` | SELECT | `is_active = true` |
| `tenant_admin_all` | ALL | `has_role('admin') AND tenant_id = user_tenant_id` |

### Orders Table

| Policy Name | Action | Condition |
|-------------|--------|-----------|
| `user_own_orders` | SELECT | `user_id = auth.uid()` |
| `tenant_admin_view` | SELECT | `has_role('admin') AND tenant_id = user_tenant_id` |
| `tenant_admin_update` | UPDATE | `has_role('admin') AND tenant_id = user_tenant_id` |

### User Profiles Table

| Policy Name | Action | Condition |
|-------------|--------|-----------|
| `view_own_profile` | SELECT | `id = auth.uid()` |
| `update_own_profile` | UPDATE | `id = auth.uid()` |
| `owners_admins_view_team` | SELECT | `role IN ('owner', 'admin') AND same tenant` |
| `owners_manage_team` | UPDATE | `role = 'owner' AND same tenant` |
| `owners_invite_team` | INSERT | `role = 'owner' AND same tenant` |

### Knowledge Base Table

| Policy Name | Action | Condition |
|-------------|--------|-----------|
| `public_active` | SELECT | `is_active = true` |
| `admin_all` | ALL | `has_role('admin')` |

### Testimonials Table

| Policy Name | Action | Condition |
|-------------|--------|-----------|
| `public_approved` | SELECT | `status = 'approved'` |
| `user_own` | SELECT | `user_id = auth.uid()` |
| `admin_all` | ALL | `has_role('admin')` |

---

## Proposed RLS Policy Improvements

### SQL Diff 1: Add tenant_id check helper

```sql
-- Create helper function for consistent tenant isolation
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Usage in policies
CREATE POLICY "tenant_isolation" ON any_table
  FOR ALL USING (tenant_id = current_user_tenant_id());
```

### SQL Diff 2: Strengthen orders RLS

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Create more specific policies
CREATE POLICY "customer_own_orders" ON orders
  FOR SELECT USING (
    customer_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "staff_tenant_orders" ON orders
  FOR SELECT USING (
    has_role(auth.uid(), 'customer_service')
    AND tenant_id = current_user_tenant_id()
  );

CREATE POLICY "admin_all_orders" ON orders
  FOR ALL USING (
    has_role(auth.uid(), 'admin')
    AND tenant_id = current_user_tenant_id()
  );
```

### SQL Diff 3: Add nexcyte_admin bypass

```sql
-- Super admin policy for cross-tenant access
CREATE POLICY "nexcyte_admin_bypass" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'nexcyte_admin'
    )
  );
```

---

## Authorization Flow Diagram

```
Request → Middleware → Route Handler → Database
            │              │              │
            ↓              ↓              ↓
       Supabase Auth   requireAuth()   RLS Policies
       (JWT/Cookie)    requireRole()   (tenant_id)
```

---

## Punch List

### P0 - Critical
- [ ] Add `current_user_tenant_id()` helper function
- [ ] Audit all admin routes for role checks
- [ ] Add `nexcyte_admin` role for platform ops

### P1 - High
- [ ] Standardize RLS policy naming
- [ ] Add customer_service role to relevant policies
- [ ] Document all policies in centralized location

### P2 - Medium
- [ ] Add audit logging for role changes
- [ ] Create policy test suite
- [ ] Add RLS policy visualization tool
