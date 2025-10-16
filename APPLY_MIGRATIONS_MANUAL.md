# Manual Migration Application Guide

Since SSH is timing out, apply these migrations manually via the Supabase SQL Editor.

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.nexcyte.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Apply Migration 00016 - Foreign Keys

Copy and paste this SQL into the editor and click **Run**:

```sql
-- Migration 00016: Add Foreign Key Constraints
-- Description: Adds referential integrity constraints to user_profiles table

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
AND contype = 'f';
```

**Expected Result:** You should see 2 rows showing the foreign key constraints.

---

## Step 3: Apply Migration 00017 - Configurator Data

Click **New Query** again, paste this SQL, and click **Run**:

```sql
-- Migration 00017: Seed Configurator Data for ezcr-dev tenant
-- This populates all configurator tables with initial data

DO $$
DECLARE
  ezcr_tenant_id UUID;
BEGIN
  -- Get dev tenant ID
  SELECT id INTO ezcr_tenant_id FROM tenants WHERE slug = 'ezcr-dev';

  IF ezcr_tenant_id IS NULL THEN
    RAISE EXCEPTION 'ezcr-dev tenant not found';
  END IF;

  -- MEASUREMENT RANGES
  INSERT INTO configurator_measurement_ranges (tenant_id, setting_key, value_inches, description) VALUES
  (ezcr_tenant_id, 'cargo_min', 53.149, 'Minimum cargo area length in inches'),
  (ezcr_tenant_id, 'cargo_max', 98.426, 'Maximum cargo area length in inches'),
  (ezcr_tenant_id, 'total_length_min', 68, 'Minimum total length (bed closed + open) in inches'),
  (ezcr_tenant_id, 'total_length_max', 98.426, 'Maximum total length in inches'),
  (ezcr_tenant_id, 'height_max', 60, 'Maximum load height in inches'),
  (ezcr_tenant_id, 'cargo_extension_threshold', 80, 'Cargo length threshold for requiring cargo extension'),
  (ezcr_tenant_id, 'ac001_1_min', 35, 'AC001-1 extension minimum height in inches'),
  (ezcr_tenant_id, 'ac001_1_max', 42, 'AC001-1 extension maximum height in inches'),
  (ezcr_tenant_id, 'ac001_2_min', 43, 'AC001-2 extension minimum height in inches'),
  (ezcr_tenant_id, 'ac001_2_max', 51, 'AC001-2 extension maximum height in inches'),
  (ezcr_tenant_id, 'ac001_3_min', 52, 'AC001-3 extension minimum height in inches'),
  (ezcr_tenant_id, 'ac001_3_max', 60, 'AC001-3 extension maximum height in inches')
  ON CONFLICT (tenant_id, setting_key) DO NOTHING;

  -- PRODUCT PRICING - MODELS
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'models', 'AUN250', 'AUN250', 1299.00, 'AUN250 Ramp Model', 1),
  (ezcr_tenant_id, 'models', 'AUN210', 'AUN210', 999.00, 'AUN210 Ramp Model', 2)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- PRODUCT PRICING - EXTENSIONS
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'extensions', 'no-ext', 'No Extension', 0.00, 'No extension selected', 1),
  (ezcr_tenant_id, 'extensions', 'ext1', 'Extension 1 (12")', 149.00, '12 inch extension', 2),
  (ezcr_tenant_id, 'extensions', 'ext2', 'Extension 2 (24")', 249.00, '24 inch extension', 3),
  (ezcr_tenant_id, 'extensions', 'ext3', 'Extension 3 (36")', 349.00, '36 inch extension', 4)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- PRODUCT PRICING - DELIVERY
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'delivery', 'pickup', 'Pickup', 0.00, 'Customer pickup', 1),
  (ezcr_tenant_id, 'delivery', 'ship', 'Ship', 185.00, 'Shipping via carrier', 2)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- PRODUCT PRICING - SERVICES
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'services', 'not-assembled', 'Not Assembled', 0.00, 'Product ships unassembled', 1),
  (ezcr_tenant_id, 'services', 'assembly', 'Assembly Service', 99.00, 'Professional assembly service', 2),
  (ezcr_tenant_id, 'services', 'demo', 'Demo (includes assembly)', 149.00, 'Demonstration with assembly included', 3)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- PRODUCT PRICING - BOLTLESS KIT
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'boltless_kit', 'no-kit', 'No Boltless Tiedown Kit', 0.00, 'No boltless kit', 1),
  (ezcr_tenant_id, 'boltless_kit', 'kit', 'Boltless Tiedown Kit', 89.00, 'Boltless tiedown kit included', 2)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- PRODUCT PRICING - TIEDOWN
  INSERT INTO configurator_pricing (tenant_id, category, item_key, item_name, price, description, display_order) VALUES
  (ezcr_tenant_id, 'tiedown', 'no-tiedown', 'No Tiedown Accessory', 0.00, 'No tiedown accessory', 1),
  (ezcr_tenant_id, 'tiedown', 'turnbuckle-1', 'Turnbuckles (1 pair)', 89.00, 'One pair of turnbuckles', 2),
  (ezcr_tenant_id, 'tiedown', 'turnbuckle-2', 'Turnbuckles (2 pairs)', 159.00, 'Two pairs of turnbuckles', 3),
  (ezcr_tenant_id, 'tiedown', 'straps', 'Tiedown Straps', 29.00, 'Tiedown straps', 4)
  ON CONFLICT (tenant_id, category, item_key) DO NOTHING;

  -- BUSINESS RULES - AC001 EXTENSIONS
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'ac001_extension', 'height_35_42',
   '{"height_min": 35, "height_max": 42}'::JSONB,
   '{"extension": "AC001-1"}'::JSONB,
   'Based on your load height, AC001-1 extension is recommended.', 1),
  (ezcr_tenant_id, 'ac001_extension', 'height_43_51',
   '{"height_min": 43, "height_max": 51}'::JSONB,
   '{"extension": "AC001-2"}'::JSONB,
   'Based on your load height, AC001-2 extension is recommended.', 2),
  (ezcr_tenant_id, 'ac001_extension', 'height_52_60',
   '{"height_min": 52, "height_max": 60}'::JSONB,
   '{"extension": "AC001-3"}'::JSONB,
   'Based on your load height, AC001-3 extension is recommended.', 3)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- BUSINESS RULES - CARGO EXTENSION
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'cargo_extension', 'cargo_over_80',
   '{"cargo_length_min": 80}'::JSONB,
   '{"requires_extension": true}'::JSONB,
   'Your cargo length exceeds 80 inches. A cargo extension is recommended.', 1)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- BUSINESS RULES - INCOMPATIBILITIES
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'incompatibility', 'demo_ship',
   '{"service": "demo", "delivery": "ship"}'::JSONB,
   '{"block": true}'::JSONB,
   'Demo service is not available with shipping. Please select pickup or choose a different service.', 1)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- BUSINESS RULES - RECOMMENDATIONS
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'recommendation', 'boltless_turnbuckle',
   '{"boltless_kit": "kit"}'::JSONB,
   '{"recommend": "turnbuckles"}'::JSONB,
   'With the Boltless Kit, we recommend adding turnbuckles for secure tiedown.', 1)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- GENERAL SETTINGS
  INSERT INTO configurator_settings (tenant_id, setting_key, setting_value, description) VALUES
  (ezcr_tenant_id, 'fees',
   '{"sales_tax_rate": 0.089, "processing_fee_rate": 0.03}'::JSONB,
   'Tax and processing fees'),
  (ezcr_tenant_id, 'contact',
   '{"phone": "800-687-4410", "support_url": "/support", "exit_url": "/"}'::JSONB,
   'Contact information'),
  (ezcr_tenant_id, 'conversion_factors',
   '{"inches_to_cm": 2.54, "lbs_to_kg": 0.453592}'::JSONB,
   'Unit conversion factors'),
  (ezcr_tenant_id, 'colors',
   '{"primary": "#4a9eda", "primaryDark": "#3a7eb8", "primaryLight": "#6bb3e8", "secondary": "#f97316", "secondaryDark": "#ea580c", "success": "#10b981", "successDark": "#059669", "error": "#ef4444", "dark": "#0a0a0a", "darkSecondary": "#1a1a1a", "light": "#f8fafc", "textLight": "#94a3b8", "gold": "#d4af37", "border": "#2a2a2a", "logoBlue": "#005696", "logoOrange": "#ff8c00"}'::JSONB,
   'Color scheme for configurator')
  ON CONFLICT (tenant_id, setting_key) DO NOTHING;

  RAISE NOTICE 'Successfully seeded configurator data for ezcr-dev tenant!';

END $$;
```

**Expected Result:** You should see "Successfully seeded configurator data for ezcr-dev tenant!" in the messages.

---

## Step 4: Verify Data Was Inserted

Run this verification query:

```sql
-- Verify configurator data
SELECT
  (SELECT COUNT(*) FROM configurator_measurement_ranges WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as measurement_ranges,
  (SELECT COUNT(*) FROM configurator_pricing WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as pricing_items,
  (SELECT COUNT(*) FROM configurator_rules WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as business_rules,
  (SELECT COUNT(*) FROM configurator_settings WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as settings;
```

**Expected Result:**
- measurement_ranges: 12
- pricing_items: 17
- business_rules: 8
- settings: 4

---

## Step 5: Test the Configurator

1. Open http://localhost:3002/configurator
2. The page should now load without errors
3. You should see the configurator interface with all options

---

## Troubleshooting

**If you get "tenant not found" error:**
```sql
-- Check if ezcr-dev tenant exists
SELECT id, slug, name FROM tenants WHERE slug = 'ezcr-dev';
```

**If foreign keys fail due to existing data:**
```sql
-- Check for orphaned profiles
SELECT up.id, up.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- If you find orphans, you may need to delete them first
```

**If configurator data fails:**
```sql
-- Check if tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'configurator%';
```
