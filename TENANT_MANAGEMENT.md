# Tenant Management Strategy

**Date**: 2025-10-14
**Status**: ✅ Implemented
**Purpose**: Manage development vs production environments using multi-tenant architecture

---

## Overview

This application uses a **multi-tenant architecture** to cleanly separate development and production data. Instead of using separate databases or complicated configuration, we use different tenant slugs within the same database.

### Key Benefits

✅ **Data Isolation**: Dev and prod customers/orders never mix
✅ **Same Codebase**: One application, automatic environment detection
✅ **Easy Switching**: Change environment variable to switch contexts
✅ **Testing Safety**: Test features without affecting real customers
✅ **Cost Effective**: Single database, no duplicate infrastructure

---

## Tenant Configuration

### Development Environment
```env
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_TENANT_SLUG=ezcr-dev
```

- **Tenant Slug**: `ezcr-dev`
- **Tenant Name**: EZ Cycle Ramp (Development)
- **Domain**: `localhost`
- **Purpose**: Testing, development, feature testing
- **Stripe Keys**: Test mode (`sk_test_*`, `pk_test_*`)
- **n8n Webhooks**: Development workflows
- **Visual Indicator**: Yellow banner in UI

### Production Environment
```env
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_TENANT_SLUG=ezcr-01
```

- **Tenant Slug**: `ezcr-01`
- **Tenant Name**: EZ Cycle Ramp
- **Domain**: `ezcycleramp.com`
- **Purpose**: Live customer orders and data
- **Stripe Keys**: Live mode (`sk_live_*`, `pk_live_*`)
- **n8n Webhooks**: Production workflows
- **Visual Indicator**: None (clean production UI)

---

## How It Works

### 1. Automatic Tenant Detection

The system automatically detects which tenant to use based on `NEXT_PUBLIC_ENVIRONMENT`:

```typescript
// src/lib/tenant.ts
export function getCurrentTenant(): string {
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override

  const env = getEnvironment()
  return TENANT_CONFIG[env].slug
}
```

### 2. Database Isolation

All tenant-specific tables include a `tenant_id` column:

```sql
SELECT * FROM orders WHERE tenant_id = 'ezcr-dev-uuid'  -- Dev orders
SELECT * FROM orders WHERE tenant_id = 'ezcr-01-uuid'   -- Prod orders
```

### 3. Application Code

All server actions and API routes use the tenant utility:

```typescript
import { getTenantId } from '@/lib/tenant'

async function getOrders() {
  const tenantId = await getTenantId()  // Automatically gets correct tenant

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)  // Only this tenant's data
}
```

---

## Files Modified

### Core Tenant System
1. **`src/lib/tenant.ts`** - Tenant configuration and utilities (NEW)
2. **`src/components/EnvironmentBanner.tsx`** - Dev mode banner component (NEW)
3. **`.env.local`** - Development configuration (UPDATED)
4. **`.env.production`** - Production configuration template (NEW)
5. **`.env.example`** - Updated with tenant config (UPDATED)

### Updated API Routes (7 files)
1. `src/actions/crm.ts` - CRM server actions
2. `src/app/api/ai/chat-rag/route.ts` - RAG chatbot
3. `src/app/api/configurations/route.ts` - Configurator saves
4. `src/app/api/configurator/settings/route.ts` - Configurator settings
5. `src/app/api/embeddings/generate/route.ts` - Embedding generation
6. `src/app/api/stripe/checkout/route.ts` - Stripe checkout
7. `src/app/api/test-tenant/route.ts` - Tenant testing

### Database Migration
- **`supabase/migrations/00013_add_dev_tenant.sql`** - Creates dev tenant

---

## Usage Guide

### For Development

1. **Ensure `.env.local` is configured:**
   ```env
   NEXT_PUBLIC_ENVIRONMENT=development
   NEXT_PUBLIC_TENANT_SLUG=ezcr-dev
   ```

2. **Deploy the dev tenant migration:**
   ```bash
   npx supabase db push
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Verify environment:**
   - Look for yellow banner at top: "DEVELOPMENT MODE"
   - All data will be saved under `ezcr-dev` tenant

### For Production

1. **Use `.env.production` on production server:**
   ```env
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_TENANT_SLUG=ezcr-01
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   npm start
   ```

3. **Verify environment:**
   - No yellow banner
   - All data saved under `ezcr-01` tenant

---

## Adding Environment Banner

To show the development indicator, add the banner to your root layout:

```tsx
// src/app/layout.tsx
import { EnvironmentBanner } from '@/components/EnvironmentBanner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnvironmentBanner />
        {children}
      </body>
    </html>
  )
}
```

Or use the badge in individual pages:

```tsx
import { EnvironmentBadge } from '@/components/EnvironmentBanner'

<div className="page-header">
  <h1>CRM Dashboard</h1>
  <EnvironmentBadge />
</div>
```

---

## Testing the Setup

### 1. Verify Tenant Exists
```sql
SELECT id, slug, name, domain
FROM tenants
WHERE slug IN ('ezcr-dev', 'ezcr-01');
```

Expected:
```
ezcr-dev | EZ Cycle Ramp (Development) | localhost
ezcr-01  | EZ Cycle Ramp               | ezcycleramp.com
```

### 2. Test Tenant Utility
Create a test API route:
```typescript
// src/app/api/test-environment/route.ts
import { NextResponse } from 'next/server'
import { getCurrentTenant, getEnvironment, getTenantId } from '@/lib/tenant'

export async function GET() {
  return NextResponse.json({
    environment: getEnvironment(),
    tenant_slug: getCurrentTenant(),
    tenant_id: await getTenantId(),
  })
}
```

Visit: http://localhost:3000/api/test-environment

Expected (dev):
```json
{
  "environment": "development",
  "tenant_slug": "ezcr-dev",
  "tenant_id": "uuid-of-dev-tenant"
}
```

### 3. Create Test Data
```sql
-- Create a test customer in dev tenant
INSERT INTO orders (tenant_id, order_number, customer_email, total_amount, status)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'ezcr-dev'),
  'TEST-001',
  'test@example.com',
  99.99,
  'pending'
);
```

### 4. Verify Data Isolation
```typescript
// Should only see dev orders when NEXT_PUBLIC_TENANT_SLUG=ezcr-dev
const orders = await getOrders()
console.log(orders)  // Only TEST-001, no production orders
```

---

## Best Practices

### 1. Never Hardcode Tenant Slugs
❌ **Bad:**
```typescript
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('tenant_id', 'ezcr-01')  // Hardcoded!
```

✅ **Good:**
```typescript
import { getTenantId } from '@/lib/tenant'

const tenantId = await getTenantId()
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('tenant_id', tenantId)
```

### 2. Always Use Environment Variable for Tenant
```env
# .env.local
NEXT_PUBLIC_TENANT_SLUG=ezcr-dev

# .env.production
NEXT_PUBLIC_TENANT_SLUG=ezcr-01
```

### 3. Test in Dev Before Production
1. Create test data in development (`ezcr-dev`)
2. Test all features thoroughly
3. Verify no errors or data leaks
4. Deploy to production (`ezcr-01`)
5. Monitor for issues

### 4. Use Different API Keys per Environment

**Development:**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
N8N_APPOINTMENT_WEBHOOK=https://n8n-dev.yourdomain.com/webhook/appointment
```

**Production:**
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
N8N_APPOINTMENT_WEBHOOK=https://n8n.yourdomain.com/webhook/appointment
```

---

## Troubleshooting

### Issue: "Tenant not found"

**Cause**: Dev tenant not created in database

**Solution:**
```bash
cd C:\Users\morri\Dropbox\Websites\ezcr
npx supabase db push
```

### Issue: Seeing production data in development

**Cause**: Environment variable not set correctly

**Solution:**
1. Check `.env.local`:
   ```env
   NEXT_PUBLIC_TENANT_SLUG=ezcr-dev
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```

### Issue: Yellow banner shows in production

**Cause**: Production environment variable not set

**Solution:**
Check `.env.production`:
```env
NEXT_PUBLIC_ENVIRONMENT=production
```

### Issue: Both dev and prod data appearing

**Cause**: Missing `tenant_id` filter in query

**Solution:**
Always use `getTenantId()`:
```typescript
const tenantId = await getTenantId()
query.eq('tenant_id', tenantId)
```

---

## Adding New Tenant-Aware Tables

When creating new tables that should be tenant-isolated:

```sql
CREATE TABLE your_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- your other columns
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for performance
CREATE INDEX idx_your_table_tenant ON your_new_table(tenant_id);

-- Add RLS policies
ALTER TABLE your_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant data"
  ON your_new_table FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
```

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `00013_add_dev_tenant.sql` | 2025-10-14 | Created `ezcr-dev` tenant for development |

---

## Environment Variables Reference

### Required for All Environments
```env
# Environment identifier
NEXT_PUBLIC_ENVIRONMENT=development|production

# Tenant identifier (overrides automatic detection)
NEXT_PUBLIC_TENANT_SLUG=ezcr-dev|ezcr-01

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000|https://ezcycleramp.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.nexcyte.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Environment-Specific
```env
# Stripe (use test keys in dev, live keys in prod)
STRIPE_SECRET_KEY=sk_test_*|sk_live_*
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_*|pk_live_*

# n8n (use dev webhooks in dev, prod webhooks in prod)
N8N_APPOINTMENT_WEBHOOK=https://n8n-dev.*|https://n8n.*
N8N_ORDER_INQUIRY_WEBHOOK=https://n8n-dev.*|https://n8n.*
```

---

## Future Enhancements

### Potential Additions:
1. **Staging Environment**: Add `ezcr-staging` tenant
2. **Tenant-Specific Settings**: Different logo, colors per tenant
3. **Usage Analytics**: Track usage per tenant
4. **Tenant Admin UI**: Manage tenants via admin panel
5. **Data Migration Tools**: Copy prod data to dev for testing
6. **Tenant Cloning**: Duplicate tenant configuration

---

## Summary

✅ **Implemented**: Environment-based tenant system
✅ **Dev Tenant**: `ezcr-dev` for development/testing
✅ **Prod Tenant**: `ezcr-01` for live customers
✅ **Auto-Detection**: Based on `NEXT_PUBLIC_ENVIRONMENT`
✅ **Visual Indicators**: Yellow banner in development
✅ **7 Files Updated**: All API routes use tenant utility
✅ **Database Migration**: Dev tenant created via SQL
✅ **Documentation**: This comprehensive guide

**Benefits Delivered**:
- 🛡️ Complete data isolation between dev and prod
- 🚀 Fast development without risking customer data
- 💰 Cost-effective (single database)
- 🔧 Easy environment switching
- ✨ Clean separation of concerns

**Next Steps**:
1. Deploy migration: `npx supabase db push`
2. Restart dev server: `npm run dev`
3. Verify yellow banner appears
4. Test creating orders/customers in dev
5. Confirm prod data remains untouched

---

**Documentation Complete**: 2025-10-14
**Implementation Status**: ✅ Ready to Deploy
