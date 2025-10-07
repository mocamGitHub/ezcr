-- Seed Product Categories for EZCR
-- Insert categories if they don't exist

INSERT INTO product_categories (id, tenant_id, slug, name, description, display_order)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ramps',
    'Ramps',
    'Premium motorcycle loading ramps for trucks, vans, and trailers',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'accessories',
    'Accessories',
    'Essential accessories for motorcycle transport and loading',
    2
  )
ON CONFLICT (tenant_id, slug) DO NOTHING;
