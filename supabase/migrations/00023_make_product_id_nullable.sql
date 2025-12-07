-- Migration: Make product_id nullable in product_configurations
-- Reason: The v2 configurator creates custom bundles without a specific product reference
-- Date: 2025-12-07

-- Drop the existing NOT NULL constraint on product_id
ALTER TABLE product_configurations
  ALTER COLUMN product_id DROP NOT NULL;

-- Add a comment explaining why this is nullable
COMMENT ON COLUMN product_configurations.product_id IS
  'Optional reference to a product. NULL when configuration is a custom bundle from v2 configurator.';
