-- ========================================
-- COMPLETE CONFIGURATOR FIX
-- ========================================
-- This script combines migrations 00008 and 00017
-- Run this in Supabase SQL Editor to fix the configurator

-- ========================================
-- STEP 1: Create Configurator Tables (Migration 00008)
-- ========================================

-- CONFIGURATOR MEASUREMENT RANGES
CREATE TABLE IF NOT EXISTS configurator_measurement_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  value_inches DECIMAL(10,3) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

-- CONFIGURATOR PRODUCT PRICING
CREATE TABLE IF NOT EXISTS configurator_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  item_key VARCHAR(50) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, category, item_key)
);

-- CONFIGURATOR BUSINESS RULES
CREATE TABLE IF NOT EXISTS configurator_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,
  rule_key VARCHAR(100) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  message TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, rule_type, rule_key)
);

-- CONFIGURATOR SETTINGS (General)
CREATE TABLE IF NOT EXISTS configurator_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_measurement_ranges_tenant ON configurator_measurement_ranges(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_tenant_category ON configurator_pricing(tenant_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_rules_tenant_type ON configurator_rules(tenant_id, rule_type, is_active, priority);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON configurator_settings(tenant_id, setting_key, is_active);

-- ROW LEVEL SECURITY
ALTER TABLE configurator_measurement_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (configurator is public-facing)
DROP POLICY IF EXISTS "Public can view measurement ranges" ON configurator_measurement_ranges;
CREATE POLICY "Public can view measurement ranges" ON configurator_measurement_ranges
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view pricing" ON configurator_pricing;
CREATE POLICY "Public can view pricing" ON configurator_pricing
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view rules" ON configurator_rules;
CREATE POLICY "Public can view rules" ON configurator_rules
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view settings" ON configurator_settings;
CREATE POLICY "Public can view settings" ON configurator_settings
  FOR SELECT USING (is_active = true);

-- TRIGGERS
DROP TRIGGER IF EXISTS update_measurement_ranges_updated_at ON configurator_measurement_ranges;
CREATE TRIGGER update_measurement_ranges_updated_at BEFORE UPDATE ON configurator_measurement_ranges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_updated_at ON configurator_pricing;
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON configurator_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rules_updated_at ON configurator_rules;
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON configurator_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON configurator_settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON configurator_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 2: Seed Configurator Data (Migration 00017)
-- ========================================

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

  RAISE NOTICE 'Successfully created configurator tables and seeded data for ezcr-dev tenant!';

END $$;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT
  (SELECT COUNT(*) FROM configurator_measurement_ranges WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as measurement_ranges,
  (SELECT COUNT(*) FROM configurator_pricing WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as pricing_items,
  (SELECT COUNT(*) FROM configurator_rules WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as business_rules,
  (SELECT COUNT(*) FROM configurator_settings WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')) as settings;
