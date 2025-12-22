-- Migration: Link orders to product_configurations
-- Date: 2025-12-22
-- Purpose: Add configuration_id to orders for linking measurements/contact data

-- Add configuration_id column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS configuration_id UUID REFERENCES product_configurations(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_configuration ON orders(configuration_id)
WHERE configuration_id IS NOT NULL;

-- Comment explaining the relationship
COMMENT ON COLUMN orders.configuration_id IS
'Links to product_configurations table containing customer measurements, vehicle specs, and contact info from the configurator';
