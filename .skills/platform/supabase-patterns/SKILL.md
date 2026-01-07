# Supabase Database Patterns

> **Tier:** Platform (Tier 1)
> **Applies To:** All NexCyte repos
> **Override Policy:** LOCKED (schema), EXTEND (queries)
> **Version:** 1.0.0

## Skill Relationships

**Complements:** security-standards, multi-tenant
**Extended By:** None
**See Also:** api-design

## Purpose

Defines the standard patterns for Supabase database schema design, RLS policies, queries, and migrations used across all NexCyte projects.

## Scope Boundaries

**This skill covers:**
- Table schema conventions
- UUID primary key patterns
- JSONB usage for flexible data
- Timestamp patterns (created_at, updated_at)
- Index strategies
- Migration file naming
- RLS policy patterns

**This skill does NOT cover (see other skills):**
- API route implementation -> see api-design
- Authentication flow -> see security-standards
- Multi-tenant isolation -> see multi-tenant

## Patterns

### 1. Table Schema Convention

**When to use:** Creating any new database table

**Implementation:**

```sql
-- Always use UUID primary keys with uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Required fields
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  -- Optional fields with defaults
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Composite unique constraints
  UNIQUE(tenant_id, slug)
);
```

**Anti-patterns to avoid:**

```sql
-- DON'T use auto-increment integers
CREATE TABLE bad_table (
  id SERIAL PRIMARY KEY  -- Wrong! Use UUID
);

-- DON'T omit tenant_id on shared tables
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255)
  -- Missing tenant_id!
);
```

### 2. JSONB for Flexible Data

**When to use:** Storing variable/extensible data like settings, metadata, configurations

**Implementation:**

```sql
-- Use JSONB for flexible schemas
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- Structured data
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  -- Flexible data in JSONB
  specifications JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}'
);

-- Query JSONB fields
SELECT * FROM products
WHERE specifications->>'weight' > '100';

-- Index JSONB paths if queried frequently
CREATE INDEX idx_products_specs ON products USING GIN (specifications);
```

**Anti-patterns to avoid:**

```sql
-- DON'T create many nullable columns for optional data
CREATE TABLE products (
  color VARCHAR(50),
  weight DECIMAL,
  height DECIMAL,
  width DECIMAL,
  material VARCHAR(100)
  -- ... dozens more optional columns
);
-- Instead, use specifications JSONB DEFAULT '{}'
```

### 3. RLS Policy Patterns

**When to use:** Every table that contains user or tenant data

**Implementation:**

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Authenticated user access
CREATE POLICY "Authenticated users can view all products" ON products
  FOR SELECT TO authenticated USING (true);

-- User-owned resources
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Insert with ownership check
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Full CRUD on owned resources
CREATE POLICY "Users can manage their cart" ON shopping_cart
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
```

### 4. Migration File Naming

**When to use:** Creating new migrations

**Implementation:**

```
supabase/migrations/
├── 00001_initial_schema.sql           # Sequential for ordering
├── 00002_seed_categories.sql
├── 00003_fix_categories_rls.sql
├── 20251224_000001_calcom_scheduler.sql  # Date-prefixed for features
└── 20260101_001_tasks_mvp.sql
```

**Naming conventions:**
- `00XXX_description.sql` - Sequential numbered migrations
- `YYYYMMDD_XXX_description.sql` - Date-prefixed for features
- Use snake_case for filenames
- Descriptive names indicating purpose

### 5. Updated_at Trigger Pattern

**When to use:** Any table with updated_at column

**Implementation:**

```sql
-- Create trigger function once
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Index Strategy

**When to use:** Optimizing query performance

**Implementation:**

```sql
-- Tenant-scoped queries (most common)
CREATE INDEX idx_products_tenant ON products(tenant_id, is_active);

-- Foreign key lookups
CREATE INDEX idx_products_category ON products(category_id);

-- Slug lookups (common for URL routing)
CREATE INDEX idx_products_slug ON products(tenant_id, slug);

-- Partial indexes for filtered queries
CREATE INDEX idx_products_coming_soon ON products(tenant_id, coming_soon)
  WHERE coming_soon = true;

-- Composite indexes for sorting
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
```

## Checklist

Before committing database changes:

- [ ] All tables have `tenant_id` FK to tenants (unless truly global)
- [ ] UUID primary keys using `uuid_generate_v4()`
- [ ] `created_at` and `updated_at` timestamps on mutable tables
- [ ] RLS enabled with appropriate policies
- [ ] Indexes on foreign keys and common query patterns
- [ ] Migration file follows naming convention
- [ ] Updated_at trigger applied where needed
- [ ] JSONB used for flexible/optional data instead of nullable columns

## Templates

### New Table Migration Template

```sql
-- Migration: Create [table_name]
-- Date: YYYY-MM-DD
-- Purpose: [Brief description]

CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Add fields here
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (/* conditions */);

-- Indexes
CREATE INDEX idx_table_name_tenant ON table_name(tenant_id);

-- Updated_at trigger
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
