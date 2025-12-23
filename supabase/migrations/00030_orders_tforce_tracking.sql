-- Migration: Add TForce tracking fields to orders
-- Date: 2025-12-23
-- Purpose: Enable TForce shipment tracking integration

-- Add PRO number (TForce's primary shipment identifier)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pro_number VARCHAR(20);

-- Add delivery signature field
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_signature VARCHAR(255);

-- Add tracking events JSON for caching TForce event history
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_events JSONB;

-- Add last tracking sync timestamp
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_synced_at TIMESTAMPTZ;

-- Index for PRO number lookups
CREATE INDEX IF NOT EXISTS idx_orders_pro_number ON orders(pro_number)
WHERE pro_number IS NOT NULL;

-- Comments
COMMENT ON COLUMN orders.pro_number IS 'TForce Freight PRO number (9-digit shipment identifier)';
COMMENT ON COLUMN orders.delivery_signature IS 'Name of person who signed for delivery';
COMMENT ON COLUMN orders.tracking_events IS 'Cached TForce tracking events JSON array';
COMMENT ON COLUMN orders.tracking_synced_at IS 'Last time tracking was synced from TForce API';
