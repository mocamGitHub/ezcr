# Multi-Tenant Architecture

> **Tier:** Platform (Tier 1)
> **Applies To:** All NexCyte repos
> **Override Policy:** LOCKED
> **Version:** 1.0.0

## Skill Relationships

**Complements:** supabase-patterns, security-standards
**Extended By:** None
**See Also:** api-design

## Purpose

Defines the mandatory patterns for multi-tenant data isolation, tenant context management, and environment-aware configuration across all NexCyte projects.

## Scope Boundaries

**This skill covers:**
- Tenant table schema
- Environment-based tenant selection
- Tenant context in API routes
- Data isolation patterns

**This skill does NOT cover (see other skills):**
- RLS policies -> see supabase-patterns
- Authentication -> see security-standards
- API structure -> see api-design

## Patterns

### 1. Tenants Table Schema

**Implementation:**

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public read access to active tenants (for subdomain lookup)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active tenants" ON tenants
  FOR SELECT USING (is_active = true);
```

### 2. Environment-Aware Tenant Configuration

**When to use:** Determining current tenant based on environment

**Implementation:**

```typescript
// src/lib/tenant.ts

export const TENANT_CONFIG = {
  development: {
    slug: 'ezcr-dev',
    name: 'EZ Cycle Ramp (Development)',
    isProduction: false,
  },
  staging: {
    slug: 'ezcr-staging',
    name: 'EZ Cycle Ramp (Staging)',
    isProduction: false,
  },
  production: {
    slug: 'ezcr-01',
    name: 'EZ Cycle Ramp',
    isProduction: true,
  },
} as const

export function getEnvironment(): 'development' | 'staging' | 'production' {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development'
  if (env === 'production') return 'production'
  if (env === 'staging') return 'staging'
  return 'development'
}

export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

export function getCurrentTenant(): string {
  // Allow override via environment variable
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override

  const env = getEnvironment()
  return TENANT_CONFIG[env].slug
}

export function getTenantName(): string {
  const env = getEnvironment()
  return TENANT_CONFIG[env].name
}

export function getTenantConfig() {
  const env = getEnvironment()
  return {
    ...TENANT_CONFIG[env],
    slug: getCurrentTenant(),
  }
}

export type Environment = 'development' | 'staging' | 'production'
export type TenantConfig = typeof TENANT_CONFIG[Environment]
```

### 3. Getting Tenant ID from Database

**When to use:** Any database operation that requires tenant_id

**Implementation:**

```typescript
// src/lib/tenant.ts (continued)
import { createServiceClient } from '@/lib/supabase/server'

export async function getTenantId(slug?: string): Promise<string> {
  const tenantSlug = slug || getCurrentTenant()
  const supabase = createServiceClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (error || !tenant) {
    throw new Error(`Tenant '${tenantSlug}' not found. Error: ${error?.message || 'Unknown'}`)
  }

  return tenant.id
}
```

### 4. Using Tenant Context in API Routes

**When to use:** Every API route that accesses tenant data

**Implementation:**

```typescript
// Pattern for API routes
export async function POST(request: NextRequest) {
  // Get tenant context
  const tenantSlug = getCurrentTenant()
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (tenantError || !tenant) {
    console.error('Error fetching tenant:', tenantError)
    return NextResponse.json(
      { error: 'Tenant configuration error' },
      { status: 500 }
    )
  }

  const TENANT_ID = tenant.id

  // Use TENANT_ID in all queries
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)

  // Include tenant_id in all inserts
  await supabaseAdmin
    .from('orders')
    .insert({
      tenant_id: TENANT_ID,
      // ... other fields
    })
}
```

### 5. Tenant-Scoped Foreign Keys

**When to use:** Every table that belongs to a tenant

**Implementation:**

```sql
-- All tenant-owned tables MUST have tenant_id
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- ... other fields
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- ... other fields
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- ... other fields
);
```

**Anti-patterns to avoid:**

```sql
-- DON'T omit tenant_id thinking you'll add it later
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255)
  -- Missing tenant_id - WRONG!
);

-- DON'T use soft tenant references
CREATE TABLE products (
  tenant_slug VARCHAR(50)  -- Should be UUID FK, not slug
);
```

## Checklist

Before committing multi-tenant code:

- [ ] All new tables have `tenant_id` FK to tenants
- [ ] `ON DELETE CASCADE` set for tenant_id FK
- [ ] API routes use `getCurrentTenant()` -> lookup tenant_id
- [ ] All queries filter by tenant_id
- [ ] All inserts include tenant_id
- [ ] RLS policies include tenant isolation
- [ ] Test data uses correct tenant slug for environment

## Environment Variables

```env
# Override tenant (optional)
NEXT_PUBLIC_TENANT_SLUG=ezcr-dev

# Set environment
NEXT_PUBLIC_ENVIRONMENT=development  # or staging, production
```
