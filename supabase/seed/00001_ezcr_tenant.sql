-- EZCR Tenant and Product Seed Data
-- Date: 2025-01-06
-- ========================================
-- SEED EZCR TENANT
-- ========================================
INSERT INTO tenants (id, slug, name, subdomain, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ezcr',
  'EZ Cycle Ramp',
  'ezcr',
  '{
    "company_name": "EZ Cycle Ramp",
    "tagline": "Premium Motorcycle Loading Solutions",
    "contact_email": "info@ezcycleramp.com",
    "contact_phone": "1-800-XXX-XXXX",
    "address": {
      "street": "123 Industrial Way",
      "city": "Atlanta",
      "state": "GA",
      "zip": "30303"
    },
    "branding": {
      "primary_color": "#1a1a1a",
      "secondary_color": "#ff6b00",
      "logo_url": "/images/ezcr-logo.png"
    }
  }'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
-- ========================================
-- SEED PRODUCT CATEGORIES
-- ========================================
INSERT INTO product_categories (id, tenant_id, slug, name, description, display_order)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ramps',
    'Motorcycle Ramps',
    'Automated loading ramps for pickups and trailers',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'accessories',
    'Accessories',
    'Tie-down straps, wheel chocks, and installation kits',
    2
  )
ON CONFLICT (tenant_id, slug) DO NOTHING;
-- ========================================
-- SEED PRODUCTS
-- ========================================
-- AUN250 Folding Ramp (Featured Product)
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price, compare_at_price,
  specifications, inventory_count, low_stock_threshold,
  is_active, is_featured, coming_soon, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'AUN250',
  'AUN250 Folding Ramp',
  'aun-250-folding-ramp',
  'The AUN250 is our premium folding motorcycle loading ramp, specifically designed for short bed trucks. Features our patented folding mechanism for easy storage and quick deployment. Built with aerospace-grade aluminum for maximum strength and minimum weight.',
  'Premium folding ramp for short bed trucks with patented quick-deploy mechanism',
  2000.00,
  2499.00,
  '{
    "model": "AUN250",
    "material": "Aerospace Grade T6 6061 Aluminum",
    "weight_capacity_lbs": 1500,
    "weight_kg": 42.0,
    "standard_length_inches": 66,
    "length_range_inches": "54-72",
    "width_inches": 12,
    "folded_dimensions": "33x12x8 inches",
    "features": [
      "Folding design for compact storage",
      "Automatic tilt adjustment",
      "Non-slip surface",
      "Integrated tie-down points",
      "Weather-resistant coating"
    ],
    "compatibility": {
      "truck_bed_min_length": 60,
      "truck_bed_max_height": 24,
      "best_for": "Short bed trucks (< 6.5 ft)"
    }
  }'::jsonb,
  10,
  3,
  true,
  true,
  false,
  1
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- AUN210 Standard Ramp
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price,
  specifications, inventory_count, low_stock_threshold,
  is_active, is_featured, coming_soon, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'AUN210',
  'AUN210 Standard Ramp',
  'aun-210-standard-ramp',
  'Our most popular model, the AUN210 offers the perfect balance of features and value. Designed for standard bed trucks with proven reliability and durability. The go-to choice for touring motorcycle owners.',
  'Best-selling standard ramp for touring motorcycles',
  1800.00,
  '{
    "model": "AUN210",
    "material": "Aerospace Grade T6 6061 Aluminum",
    "weight_capacity_lbs": 1500,
    "weight_kg": 38.5,
    "standard_length_inches": 60,
    "length_range_inches": "54-82",
    "width_inches": 12,
    "features": [
      "Maximum stability design",
      "Automatic tilt adjustment",
      "Non-slip surface",
      "Integrated tie-down points",
      "Weather-resistant coating"
    ],
    "compatibility": {
      "truck_bed_min_length": 72,
      "truck_bed_max_height": 24,
      "best_for": "Standard bed trucks (6.5-8 ft)"
    }
  }'::jsonb,
  15,
  5,
  true,
  true,
  false,
  2
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- AUN200 Basic Ramp
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price,
  specifications, inventory_count, low_stock_threshold,
  is_active, is_featured, coming_soon, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'AUN200',
  'AUN200 Basic Ramp',
  'aun-200-basic-ramp',
  'Affordable and reliable, the AUN200 provides essential loading functionality without breaking the bank. Perfect for occasional use or lighter motorcycles. All the quality you need at a price you''ll love.',
  'Budget-friendly ramp for lighter motorcycles',
  1500.00,
  '{
    "model": "AUN200",
    "material": "T6 6061 Aluminum",
    "weight_capacity_lbs": 1200,
    "weight_kg": 32.0,
    "standard_length_inches": 60,
    "length_range_inches": "54-78",
    "width_inches": 11,
    "features": [
      "Lightweight construction",
      "Manual tilt adjustment",
      "Non-slip surface",
      "Basic tie-down points",
      "Weather-resistant coating"
    ],
    "compatibility": {
      "truck_bed_min_length": 60,
      "truck_bed_max_height": 22,
      "best_for": "Budget-conscious buyers, lighter bikes"
    }
  }'::jsonb,
  20,
  5,
  true,
  false,
  false,
  3
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- AUN150 Hybrid Ramp (Coming Soon)
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price,
  specifications, inventory_count, low_stock_threshold,
  is_active, is_featured, coming_soon, coming_soon_date, coming_soon_price_visible, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'AUN150',
  'AUN150 Hybrid Ramp',
  'aun-150-hybrid-ramp',
  'Revolutionary new design combining the compact storage of a folding ramp with the stability of our standard models. Features our new quick-lock mechanism and enhanced weight capacity. The future of motorcycle loading is here.',
  'Next-generation hybrid design with enhanced features',
  2200.00,
  '{
    "model": "AUN150",
    "material": "Aerospace Grade T6 6061 Aluminum",
    "weight_capacity_lbs": 1600,
    "weight_kg": 39.0,
    "standard_length_inches": 68,
    "length_range_inches": "56-76",
    "width_inches": 12.5,
    "features": [
      "Hybrid folding design",
      "Quick-lock mechanism",
      "Enhanced weight capacity",
      "Automatic tilt adjustment",
      "Premium non-slip surface",
      "Integrated LED lighting",
      "Weather-resistant coating"
    ],
    "compatibility": {
      "truck_bed_min_length": 60,
      "truck_bed_max_height": 26,
      "best_for": "All truck bed sizes, heavy touring bikes"
    }
  }'::jsonb,
  0,
  0,
  true,
  true,
  true,
  '2025-03-01',
  true,
  4
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- ========================================
-- SEED ACCESSORIES
-- ========================================
-- Tie-Down Straps
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price,
  specifications, inventory_count, is_active, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'STRAPS-001',
  'Heavy Duty Tie-Down Straps (Set of 4)',
  'tie-down-straps',
  'Professional-grade tie-down straps designed specifically for motorcycle transport. 1,500 lb working load, soft-loop protection, and easy-adjust ratchet mechanism.',
  '1,500 lb capacity straps with soft-loop protection',
  45.00,
  '{
    "material": "Reinforced polyester webbing",
    "working_load_lbs": 1500,
    "length_feet": 6,
    "width_inches": 1,
    "features": [
      "Soft-loop end protection",
      "Easy-adjust ratchet",
      "Weather resistant",
      "High-visibility orange"
    ]
  }'::jsonb,
  100,
  true,
  10
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- Wheel Chock
INSERT INTO products (
  id, tenant_id, category_id, sku, name, slug,
  description, short_description, base_price,
  specifications, inventory_count, is_active, display_order
)
VALUES (
  '20000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'CHOCK-001',
  'Adjustable Wheel Chock',
  'wheel-chock',
  'Heavy-duty adjustable wheel chock compatible with tire sizes from 17" to 21". Integrated tie-down loops and non-slip base ensure your bike stays secure.',
  'Universal fit wheel chock for secure transport',
  100.00,
  '{
    "material": "Aircraft-grade aluminum",
    "tire_size_range": "17-21 inches",
    "weight_capacity_lbs": 2000,
    "features": [
      "Adjustable width",
      "Integrated tie-down loops",
      "Non-slip rubber base",
      "Powder-coated finish"
    ]
  }'::jsonb,
  50,
  true,
  11
)
ON CONFLICT (tenant_id, sku) DO NOTHING;
-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
  'Tenants' as table_name, 
  COUNT(*)::text as count 
FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Categories', COUNT(*)::text FROM product_categories
UNION ALL
SELECT 'Products', COUNT(*)::text FROM products
UNION ALL
SELECT 'Active Products', COUNT(*)::text FROM products WHERE is_active = true
UNION ALL
SELECT 'Coming Soon Products', COUNT(*)::text FROM products WHERE coming_soon = true;
