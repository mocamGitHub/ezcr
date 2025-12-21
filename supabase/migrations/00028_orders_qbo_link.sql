-- Migration: Add QBO linking fields to orders table
-- This allows tracking which orders came from QBO imports vs app-created orders

-- Add QBO linking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qbo_invoice_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qbo_sync_status TEXT DEFAULT 'not_synced';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qbo_synced_at TIMESTAMPTZ;

-- Index for efficient QBO lookups
CREATE INDEX IF NOT EXISTS idx_orders_qbo_invoice
ON orders(tenant_id, qbo_invoice_id)
WHERE qbo_invoice_id IS NOT NULL;

-- Index for sync status queries
CREATE INDEX IF NOT EXISTS idx_orders_qbo_sync_status
ON orders(tenant_id, qbo_sync_status);

-- Add comments for documentation
COMMENT ON COLUMN orders.qbo_invoice_id IS 'QuickBooks Online invoice ID for linked/imported invoices';
COMMENT ON COLUMN orders.qbo_sync_status IS 'Sync status: not_synced (default), synced, imported, sync_error';
COMMENT ON COLUMN orders.qbo_synced_at IS 'Timestamp when order was last synced with QBO';

-- Create placeholder product for QBO imported line items
-- This product will be referenced by order_items imported from QBO
-- Note: Uses unique UUID that doesn't conflict with tenant IDs
INSERT INTO products (
  id,
  tenant_id,
  name,
  slug,
  description,
  sku,
  base_price,
  is_active,
  is_featured,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0001-000000000001'::uuid,
  t.id,
  'QBO Imported Item',
  'qbo-imported-item',
  'Placeholder product for items imported from QuickBooks Online invoices',
  'QBO-IMPORT',
  0,
  false,  -- Not active for sale
  false,
  NOW(),
  NOW()
FROM tenants t
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Also create a variant for the placeholder product (needed for order_items)
INSERT INTO product_variants (
  id,
  tenant_id,
  product_id,
  name,
  sku,
  price_modifier,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0001-000000000002'::uuid,
  t.id,
  '00000000-0000-0000-0001-000000000001'::uuid,
  'Default',
  'QBO-IMPORT-DEFAULT',
  0,
  NOW(),
  NOW()
FROM tenants t
LIMIT 1
ON CONFLICT (id) DO NOTHING;
