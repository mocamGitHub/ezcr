-- ========================================
-- SHIPPING SETTINGS & CONFIGURATION
-- ========================================
-- This migration creates a table for managing shipping costs and settings
-- including packaging fees, handling fees, and other shipping-related costs

-- Create shipping_settings table
CREATE TABLE IF NOT EXISTS shipping_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value DECIMAL(10,2) NOT NULL,
  setting_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

-- Create index for fast lookups
CREATE INDEX idx_shipping_settings_tenant_key ON shipping_settings(tenant_id, setting_key, is_active);

-- Add RLS policies
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY shipping_settings_service_all ON shipping_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view active settings
CREATE POLICY shipping_settings_select ON shipping_settings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default packaging cost for ezcr-dev tenant
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'ezcr-dev' LIMIT 1;

  IF tenant_uuid IS NOT NULL THEN
    -- Insert packaging cost
    INSERT INTO shipping_settings (tenant_id, setting_key, setting_value, setting_description)
    VALUES (
      tenant_uuid,
      'packaging_fee',
      63.00,
      'Packaging and handling fee applied to all freight shipments. Covers materials, labor, and crating.'
    )
    ON CONFLICT (tenant_id, setting_key) DO UPDATE
    SET setting_value = 63.00,
        setting_description = 'Packaging and handling fee applied to all freight shipments. Covers materials, labor, and crating.',
        updated_at = NOW();

    -- Insert other potential shipping settings
    INSERT INTO shipping_settings (tenant_id, setting_key, setting_value, setting_description)
    VALUES
    (
      tenant_uuid,
      'free_shipping_threshold',
      500.00,
      'Order subtotal required for free shipping (before packaging/handling)'
    ),
    (
      tenant_uuid,
      'residential_surcharge',
      0.00,
      'Additional fee for residential delivery (usually included in T-Force quote)'
    ),
    (
      tenant_uuid,
      'insurance_rate',
      0.02,
      'Insurance rate as percentage of order value (2% = 0.02)'
    )
    ON CONFLICT (tenant_id, setting_key) DO NOTHING;

  ELSE
    RAISE NOTICE 'Tenant ezcr-dev not found. Skipping shipping settings seed.';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE shipping_settings IS 'Database-managed shipping costs and settings. Avoids hardcoding fees in application code.';
COMMENT ON COLUMN shipping_settings.setting_key IS 'Unique key for the setting (e.g., packaging_fee, free_shipping_threshold)';
COMMENT ON COLUMN shipping_settings.setting_value IS 'Numeric value for the setting (cost in USD or percentage)';
