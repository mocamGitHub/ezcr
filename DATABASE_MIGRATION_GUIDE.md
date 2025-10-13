# Database Migration Guide - Dynamic Configurator Settings

**Date**: 2025-10-13
**Status**: Ready for Deployment
**Priority**: Required before configurator can function

---

## Overview

This migration moves all hardcoded configurator values (measurements, ranges, prices, business rules) from `src/types/configurator-v2.ts` into database tables for easy updates without redeployment.

---

## What Changed

### Before (Hardcoded)
```typescript
// src/types/configurator-v2.ts
export const PRICING = {
  models: {
    AUN250: 1299.00,  // ❌ Hardcoded
    AUN210: 999.00,
  },
  // ... all pricing hardcoded
}

export const MEASUREMENT_RANGES = {
  cargoMin: 53.149,  // ❌ Hardcoded
  cargoMax: 98.426,
  // ... all ranges hardcoded
}
```

### After (Database-Driven)
```typescript
// Values loaded from database at runtime
const { settings } = useConfiguratorSettings()
const pricing = settings.pricing.models.AUN250.price  // ✅ From database
```

---

## New Database Tables

### 1. `configurator_measurement_ranges`
Stores all measurement ranges (cargo, height, AC001 extensions)

**Columns**:
- `id` (UUID)
- `tenant_id` (UUID) - Multi-tenant support
- `setting_key` (VARCHAR) - e.g., 'cargo_min', 'ac001_1_min'
- `value_inches` (DECIMAL) - Measurement value in inches
- `description` (TEXT)
- `is_active` (BOOLEAN)

**Example Data**:
```sql
setting_key: 'cargo_min'
value_inches: 53.149
description: 'Minimum cargo area length in inches'
```

### 2. `configurator_pricing`
Stores all product pricing

**Columns**:
- `id` (UUID)
- `tenant_id` (UUID)
- `category` (VARCHAR) - 'models', 'extensions', 'delivery', 'services', 'boltless_kit', 'tiedown'
- `item_key` (VARCHAR) - 'AUN250', 'ext1', 'pickup', etc.
- `item_name` (VARCHAR) - Display name
- `price` (DECIMAL)
- `description` (TEXT)
- `display_order` (INTEGER)
- `is_active` (BOOLEAN)

**Example Data**:
```sql
category: 'models'
item_key: 'AUN250'
item_name: 'AUN250'
price: 1299.00
```

### 3. `configurator_rules`
Stores business logic rules (AC001 selection, incompatibilities, recommendations)

**Columns**:
- `id` (UUID)
- `tenant_id` (UUID)
- `rule_type` (VARCHAR) - 'ac001_extension', 'cargo_extension', 'incompatibility', 'recommendation'
- `rule_key` (VARCHAR)
- `condition` (JSONB) - Conditions that trigger the rule
- `action` (JSONB) - Action to take
- `message` (TEXT) - User-facing message
- `priority` (INTEGER)
- `is_active` (BOOLEAN)

**Example Data**:
```sql
rule_type: 'ac001_extension'
rule_key: 'height_35_42'
condition: {"height_min": 35, "height_max": 42}
action: {"extension": "AC001-1"}
message: 'Based on your load height, AC001-1 extension is recommended.'
```

### 4. `configurator_settings`
Stores general settings (fees, contact info, conversion factors, colors)

**Columns**:
- `id` (UUID)
- `tenant_id` (UUID)
- `setting_key` (VARCHAR)
- `setting_value` (JSONB)
- `description` (TEXT)
- `is_active` (BOOLEAN)

**Example Data**:
```sql
setting_key: 'fees'
setting_value: {"sales_tax_rate": 0.089, "processing_fee_rate": 0.03}
```

---

## Migration Files

### Created Files

1. **`supabase/migrations/00008_configurator_settings.sql`**
   - Creates all 4 new tables
   - Sets up indexes for performance
   - Enables Row Level Security
   - Creates public read policies
   - Adds update triggers

2. **`supabase/migrations/00009_seed_configurator_data.sql`**
   - Seeds all current hardcoded values
   - 12 measurement ranges
   - 17 pricing items across 6 categories
   - 6 business rules
   - 4 general settings

---

## How to Deploy

### Option 1: Remote Supabase (Production/Staging)

```bash
# 1. Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# 2. Push migrations to remote database
npx supabase db push

# 3. Verify migrations
npx supabase db remote-status
```

### Option 2: Local Supabase (Development)

```bash
# 1. Start local Supabase
npx supabase start

# 2. Reset database with new migrations
npx supabase db reset

# 3. Verify with psql
npx supabase db psql
```

### Option 3: Manual SQL Execution (Direct DB Access)

If you have direct database access via Supabase Dashboard or SQL editor:

```sql
-- 1. Run migration 00008_configurator_settings.sql
-- (Copy contents and execute)

-- 2. Run migration 00009_seed_configurator_data.sql
-- (Copy contents and execute)

-- 3. Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'configurator_%';

-- Should return:
-- configurator_measurement_ranges
-- configurator_pricing
-- configurator_rules
-- configurator_settings
```

---

## Verification Steps

After running migrations:

### 1. Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'configurator_%';
```

### 2. Check Data Seeded
```sql
-- Check measurement ranges (should have 12 rows)
SELECT COUNT(*) FROM configurator_measurement_ranges;

-- Check pricing (should have 17 rows)
SELECT COUNT(*) FROM configurator_pricing;

-- Check rules (should have 6 rows)
SELECT COUNT(*) FROM configurator_rules;

-- Check settings (should have 4 rows)
SELECT COUNT(*) FROM configurator_settings;
```

### 3. Test API Endpoint
```bash
# Start dev server
npm run dev

# Test configurator settings endpoint
curl http://localhost:3000/api/configurator/settings
```

Expected response:
```json
{
  "measurementRanges": {
    "cargo_min": 53.149,
    "cargo_max": 98.426,
    ...
  },
  "pricing": {
    "models": {
      "AUN250": { "name": "AUN250", "price": 1299 },
      ...
    },
    ...
  },
  "rules": { ... },
  "settings": { ... }
}
```

---

## Code Changes

### New Files Created

1. **`src/app/api/configurator/settings/route.ts`**
   - API endpoint to fetch all configurator settings
   - Returns structured JSON

2. **`src/hooks/useConfiguratorSettings.ts`**
   - React hook to fetch and cache settings
   - Provides helper functions for business rules

3. **`src/lib/configurator/db-settings.ts`**
   - Runtime settings cache
   - Fallback to defaults if database not loaded
   - Helper functions for accessing settings

4. **`src/components/configurator-v2/ConfiguratorSettingsProvider.tsx`**
   - Provider component that loads settings
   - Shows loading state
   - Handles errors gracefully

### Updated Files

1. **`src/components/configurator-v2/Configurator.tsx`**
   - Wrapped with `ConfiguratorSettingsProvider`
   - Settings loaded before configurator renders

---

## How to Update Settings (No Redeployment Needed!)

### Update Pricing

```sql
-- Update AUN250 price
UPDATE configurator_pricing
SET price = 1399.00
WHERE item_key = 'AUN250' AND category = 'models';

-- Update shipping cost
UPDATE configurator_pricing
SET price = 195.00
WHERE item_key = 'ship' AND category = 'delivery';
```

### Update Measurement Ranges

```sql
-- Update cargo max length
UPDATE configurator_measurement_ranges
SET value_inches = 100.0
WHERE setting_key = 'cargo_max';

-- Update AC001-1 range
UPDATE configurator_measurement_ranges
SET value_inches = 44
WHERE setting_key = 'ac001_1_max';
```

### Update Tax Rate

```sql
-- Update sales tax rate
UPDATE configurator_settings
SET setting_value = jsonb_set(setting_value, '{sales_tax_rate}', '0.095')
WHERE setting_key = 'fees';
```

### Add New Product

```sql
-- Add new ramp model
INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order)
SELECT
  tenant_id,
  'models',
  'AUN300',
  'AUN300 Heavy Duty',
  1599.00,
  'Heavy duty ramp model',
  3
FROM tenants WHERE slug = 'ezcr-01';
```

---

## Rollback Plan

If issues occur, you can rollback:

### Option 1: Drop New Tables
```sql
DROP TABLE IF EXISTS configurator_settings CASCADE;
DROP TABLE IF EXISTS configurator_rules CASCADE;
DROP TABLE IF EXISTS configurator_pricing CASCADE;
DROP TABLE IF EXISTS configurator_measurement_ranges CASCADE;
```

### Option 2: Revert Code Changes
```bash
# The old hardcoded values still exist in src/types/configurator-v2.ts
# Components fall back to hardcoded values if database isn't available

# Just remove the ConfiguratorSettingsProvider wrapper:
git diff HEAD~1 src/components/configurator-v2/Configurator.tsx
git checkout HEAD~1 -- src/components/configurator-v2/Configurator.tsx
```

---

## Benefits

### Before
- ❌ Change price → Edit code → Commit → Deploy → Wait 5-10 minutes
- ❌ Update range → Same process
- ❌ Risk of typos in code
- ❌ Requires developer for simple changes

### After
- ✅ Change price → SQL query → Instant update
- ✅ Non-technical admin can update via Supabase Dashboard
- ✅ No redeployment needed
- ✅ Audit trail in database
- ✅ Easy to A/B test pricing
- ✅ Can revert changes instantly

---

## Next Steps

1. ✅ Run migrations (follow "How to Deploy" above)
2. ✅ Verify tables and data (follow "Verification Steps")
3. ✅ Test configurator at http://localhost:3000/configure
4. ⏳ Build admin UI to manage settings (future enhancement)
5. ⏳ Add change history/audit log (future enhancement)

---

## Support

If you encounter issues:

1. Check migration files exist in `supabase/migrations/`
2. Verify Supabase connection in `.env.local`
3. Check API endpoint returns data: `/api/configurator/settings`
4. Look for console errors in browser DevTools
5. Check server logs for API errors

---

**Status**: ✅ Ready for deployment
**Breaking Changes**: None (falls back to hardcoded values)
**Reversible**: Yes (see Rollback Plan)
