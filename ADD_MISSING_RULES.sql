-- ========================================
-- CHECK EXISTING RULES
-- ========================================
-- First, let's see which rules you have
SELECT rule_type, rule_key, message
FROM configurator_rules
WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')
ORDER BY rule_type, priority;

-- ========================================
-- ADD MISSING BUSINESS RULES
-- ========================================
-- This will add any missing rules (8 total expected)

DO $$
DECLARE
  ezcr_tenant_id UUID;
BEGIN
  -- Get dev tenant ID
  SELECT id INTO ezcr_tenant_id FROM tenants WHERE slug = 'ezcr-dev';

  -- BUSINESS RULES - AC001 EXTENSIONS (3 rules)
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

  -- BUSINESS RULES - CARGO EXTENSION (1 rule)
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'cargo_extension', 'cargo_over_80',
   '{"cargo_length_min": 80}'::JSONB,
   '{"requires_extension": true}'::JSONB,
   'Your cargo length exceeds 80 inches. A cargo extension is recommended.', 1)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- BUSINESS RULES - INCOMPATIBILITIES (2 rules)
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'incompatibility', 'demo_ship',
   '{"service": "demo", "delivery": "ship"}'::JSONB,
   '{"block": true}'::JSONB,
   'Demo service is not available with shipping. Please select pickup or choose a different service.', 1),
  (ezcr_tenant_id, 'incompatibility', 'assembly_pickup_only',
   '{"service": "assembly", "delivery": "ship"}'::JSONB,
   '{"block": true}'::JSONB,
   'Assembly service is only available with pickup. Please select pickup or choose not-assembled.', 2)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  -- BUSINESS RULES - RECOMMENDATIONS (2 rules)
  INSERT INTO configurator_rules (tenant_id, rule_type, rule_key, condition, action, message, priority) VALUES
  (ezcr_tenant_id, 'recommendation', 'boltless_turnbuckle',
   '{"boltless_kit": "kit"}'::JSONB,
   '{"recommend": "turnbuckles"}'::JSONB,
   'With the Boltless Kit, we recommend adding turnbuckles for secure tiedown.', 1),
  (ezcr_tenant_id, 'recommendation', 'tall_load_extension',
   '{"height_min": 35}'::JSONB,
   '{"recommend": "ac001_extension"}'::JSONB,
   'For loads taller than 35 inches, we recommend an AC001 height extension for easier loading.', 2)
  ON CONFLICT (tenant_id, rule_type, rule_key) DO NOTHING;

  RAISE NOTICE 'Business rules updated! Total should be 8.';

END $$;

-- ========================================
-- VERIFY ALL 8 RULES
-- ========================================
SELECT
  rule_type,
  COUNT(*) as count
FROM configurator_rules
WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'ezcr-dev')
GROUP BY rule_type
ORDER BY rule_type;

-- Expected results:
-- ac001_extension: 3
-- cargo_extension: 1
-- incompatibility: 2
-- recommendation: 2
-- TOTAL: 8
