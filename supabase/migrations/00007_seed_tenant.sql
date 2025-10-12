-- Seed default tenant for EZCR
-- This migration adds the default tenant that the app expects

INSERT INTO tenants (slug, name, subdomain, is_active)
VALUES ('ezcr-01', 'EZ Cycle Ramp', 'ezcr', true)
ON CONFLICT (slug) DO NOTHING;
