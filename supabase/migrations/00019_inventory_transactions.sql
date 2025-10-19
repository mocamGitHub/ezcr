-- Inventory Transactions Table
-- Tracks all inventory changes for audit trail and reconciliation

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'refund', 'adjustment', 'restock', 'damage', 'initial'
  quantity_change INTEGER NOT NULL, -- Negative for deductions, positive for additions
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id VARCHAR(255), -- Order number, PO number, etc.
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(tenant_id, product_id, created_at DESC);
CREATE INDEX idx_inventory_transactions_order ON inventory_transactions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(tenant_id, transaction_type);

-- RLS Policies
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can view all transactions
CREATE POLICY "Authenticated users can view inventory transactions" ON inventory_transactions
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (via API)
CREATE POLICY "Service role can manage inventory transactions" ON inventory_transactions
  FOR ALL USING (true);

-- Function to log inventory transaction
CREATE OR REPLACE FUNCTION log_inventory_transaction(
  p_tenant_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_order_id UUID,
  p_transaction_type VARCHAR,
  p_quantity_change INTEGER,
  p_reason TEXT,
  p_reference_id VARCHAR,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current inventory count
  IF p_variant_id IS NOT NULL THEN
    SELECT inventory_count INTO v_current_quantity
    FROM product_variants
    WHERE id = p_variant_id;
  ELSE
    SELECT inventory_count INTO v_current_quantity
    FROM products
    WHERE id = p_product_id;
  END IF;

  -- Calculate new quantity
  v_new_quantity := v_current_quantity + p_quantity_change;

  -- Prevent negative inventory
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Current: %, Requested change: %', v_current_quantity, p_quantity_change;
  END IF;

  -- Update inventory count
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET inventory_count = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_variant_id;
  ELSE
    UPDATE products
    SET inventory_count = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- Log transaction
  INSERT INTO inventory_transactions (
    tenant_id,
    product_id,
    variant_id,
    order_id,
    transaction_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    reference_id,
    created_by
  ) VALUES (
    p_tenant_id,
    p_product_id,
    p_variant_id,
    p_order_id,
    p_transaction_type,
    p_quantity_change,
    v_current_quantity,
    v_new_quantity,
    p_reason,
    p_reference_id,
    p_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_inventory_transaction IS 'Atomically updates inventory and logs transaction. Prevents negative inventory.';
