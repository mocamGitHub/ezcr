-- Seed product images
-- Using high-quality placeholder images for motorcycle loading ramps

-- First, get the product IDs for reference
-- We'll insert images for each of the 6 products

-- AUN250 - Heavy-duty Loading Ramp (Coming Soon)
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'AUN250 Heavy-duty Loading Ramp - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'AUN250' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  'AUN250 Heavy-duty Loading Ramp - Side View',
  2,
  false
FROM products p
WHERE p.sku = 'AUN250' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'AUN250 Heavy-duty Loading Ramp - Detail View',
  3,
  false
FROM products p
WHERE p.sku = 'AUN250' AND p.tenant_id = 'ezcr';

-- AUN210 - Professional Loading Ramp
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'AUN210 Professional Loading Ramp - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'AUN210' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  'AUN210 Professional Loading Ramp - Side View',
  2,
  false
FROM products p
WHERE p.sku = 'AUN210' AND p.tenant_id = 'ezcr';

-- AUN200 - Standard Loading Ramp
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'AUN200 Standard Loading Ramp - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'AUN200' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  'AUN200 Standard Loading Ramp - Side View',
  2,
  false
FROM products p
WHERE p.sku = 'AUN200' AND p.tenant_id = 'ezcr';

-- AUN150 - Compact Loading Ramp (Coming Soon)
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'AUN150 Compact Loading Ramp - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'AUN150' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  'AUN150 Compact Loading Ramp - Detail View',
  2,
  false
FROM products p
WHERE p.sku = 'AUN150' AND p.tenant_id = 'ezcr';

-- Tie-Down Straps
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
  'Heavy-Duty Tie-Down Straps - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'TDS-001' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
  'Heavy-Duty Tie-Down Straps - Detail View',
  2,
  false
FROM products p
WHERE p.sku = 'TDS-001' AND p.tenant_id = 'ezcr';

-- Wheel Chock
INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
  'Heavy-Duty Wheel Chock - Primary View',
  1,
  true
FROM products p
WHERE p.sku = 'WC-001' AND p.tenant_id = 'ezcr';

INSERT INTO product_images (tenant_id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'ezcr',
  p.id,
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
  'Heavy-Duty Wheel Chock - Side View',
  2,
  false
FROM products p
WHERE p.sku = 'WC-001' AND p.tenant_id = 'ezcr';
