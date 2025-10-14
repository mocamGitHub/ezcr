-- Migration: Add Development Tenant
-- Created: 2025-10-14
-- Purpose: Create separate tenant for development/testing to isolate from production data

-- Add development tenant
INSERT INTO tenants (slug, name, subdomain, is_active, settings)
VALUES (
  'ezcr-dev',
  'EZ Cycle Ramp (Development)',
  'localhost',
  true,
  jsonb_build_object(
    'environment', 'development',
    'test_mode', true,
    'created_for', 'Development and testing purposes'
  )
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  settings = EXCLUDED.settings;

-- Get the dev tenant ID for seeding test data
DO $$
DECLARE
  dev_tenant_id UUID;
  prod_tenant_id UUID;
BEGIN
  -- Get tenant IDs
  SELECT id INTO dev_tenant_id FROM tenants WHERE slug = 'ezcr-dev';
  SELECT id INTO prod_tenant_id FROM tenants WHERE slug = 'ezcr-01';

  -- Seed initial CRM tags for development tenant (copy from prod)
  IF dev_tenant_id IS NOT NULL AND prod_tenant_id IS NOT NULL THEN
    INSERT INTO customer_tags (tenant_id, name, color, description)
    SELECT
      dev_tenant_id,
      name,
      color,
      CONCAT(description, ' (Dev)')
    FROM customer_tags
    WHERE tenant_id = prod_tenant_id
    ON CONFLICT (tenant_id, name) DO NOTHING;

    RAISE NOTICE 'Development tenant created successfully: %', dev_tenant_id;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE tenants IS 'Multi-tenant support. Each tenant represents a separate business instance (production, development, staging, etc.)';
