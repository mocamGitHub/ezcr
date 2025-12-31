-- Add has_configurator_rules flag to products table
-- This indicates which products should have configurator business rules defined

ALTER TABLE products ADD COLUMN IF NOT EXISTS has_configurator_rules BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN products.has_configurator_rules IS 'Indicates this product should have configurator business rules defined';

-- Mark existing products that should have rules based on known SKUs
-- Models
UPDATE products SET has_configurator_rules = true WHERE sku IN ('AUN250', 'AUN210');

-- Accessories (height extensions, cargo extension, 4-beam)
UPDATE products SET has_configurator_rules = true WHERE sku IN ('AC001-1', 'AC001-2', 'AC001-3', 'AC003', 'AC004');

-- Tiedowns
UPDATE products SET has_configurator_rules = true WHERE sku ILIKE '%turnbuckle%' OR sku ILIKE '%strap%' OR sku ILIKE '%boltless%';

-- Services (if they exist in products table)
UPDATE products SET has_configurator_rules = true WHERE sku IN ('assembly', 'demo');
