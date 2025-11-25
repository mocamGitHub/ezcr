-- Migration: Add Staging Tenant
-- Created: 2025-11-24
-- Purpose: Create separate tenant for staging environment to test before production

-- Add staging tenant
INSERT INTO tenants (slug, name, subdomain, is_active, settings)
VALUES (
  'ezcr-staging',
  'EZ Cycle Ramp (Staging)',
  'staging.ezcycleramp.com',
  true,
  jsonb_build_object(
    'environment', 'staging',
    'test_mode', true,
    'created_for', 'Staging environment for pre-production testing'
  )
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  settings = EXCLUDED.settings;

-- Get the staging tenant ID and copy initial data from production
DO $$
DECLARE
  staging_tenant_id UUID;
  prod_tenant_id UUID;
BEGIN
  -- Get tenant IDs
  SELECT id INTO staging_tenant_id FROM tenants WHERE slug = 'ezcr-staging';
  SELECT id INTO prod_tenant_id FROM tenants WHERE slug = 'ezcr-01';

  -- Seed initial CRM tags for staging tenant (copy from prod)
  IF staging_tenant_id IS NOT NULL AND prod_tenant_id IS NOT NULL THEN
    INSERT INTO customer_tags (tenant_id, name, color, description)
    SELECT
      staging_tenant_id,
      name,
      color,
      CONCAT(description, ' (Staging)')
    FROM customer_tags
    WHERE tenant_id = prod_tenant_id
    ON CONFLICT (tenant_id, name) DO NOTHING;

    RAISE NOTICE 'Staging tenant created successfully: %', staging_tenant_id;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE tenants IS 'Multi-tenant support. Each tenant represents a separate business instance (production, development, staging, etc.)';
