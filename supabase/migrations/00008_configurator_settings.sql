-- ========================================
-- CONFIGURATOR DYNAMIC SETTINGS
-- ========================================
-- This migration moves hardcoded configurator values to database tables
-- for easy updates without redeployment

-- ========================================
-- CONFIGURATOR MEASUREMENT RANGES
-- ========================================
CREATE TABLE configurator_measurement_ranges (
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

-- ========================================
-- CONFIGURATOR PRODUCT PRICING
-- ========================================
CREATE TABLE configurator_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'models', 'extensions', 'delivery', 'services', 'boltless_kit', 'tiedown'
  item_key VARCHAR(50) NOT NULL, -- 'AUN250', 'ext1', 'pickup', etc.
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, category, item_key)
);

-- ========================================
-- CONFIGURATOR BUSINESS RULES
-- ========================================
CREATE TABLE configurator_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'ac001_extension', 'cargo_extension', 'incompatibility', 'recommendation'
  rule_key VARCHAR(100) NOT NULL,
  condition JSONB NOT NULL, -- Conditions that trigger the rule
  action JSONB NOT NULL, -- Action to take when rule is triggered
  message TEXT, -- User-facing message if applicable
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, rule_type, rule_key)
);

-- ========================================
-- CONFIGURATOR SETTINGS (General)
-- ========================================
CREATE TABLE configurator_settings (
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

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_measurement_ranges_tenant ON configurator_measurement_ranges(tenant_id, is_active);
CREATE INDEX idx_pricing_tenant_category ON configurator_pricing(tenant_id, category, is_active);
CREATE INDEX idx_rules_tenant_type ON configurator_rules(tenant_id, rule_type, is_active, priority);
CREATE INDEX idx_settings_tenant ON configurator_settings(tenant_id, setting_key, is_active);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE configurator_measurement_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurator_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (configurator is public-facing)
CREATE POLICY "Public can view measurement ranges" ON configurator_measurement_ranges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view pricing" ON configurator_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view rules" ON configurator_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view settings" ON configurator_settings
  FOR SELECT USING (is_active = true);

-- ========================================
-- TRIGGERS
-- ========================================
CREATE TRIGGER update_measurement_ranges_updated_at BEFORE UPDATE ON configurator_measurement_ranges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON configurator_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON configurator_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON configurator_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SEED DATA
-- ========================================
-- Note: Tenant ID will be inserted from seed file (00009_seed_configurator_data.sql)
