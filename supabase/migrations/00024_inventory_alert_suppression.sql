-- ============================================
-- MIGRATION: Inventory Alert Suppression
-- Version: 00024
-- Description: Add per-product alert suppression for low stock and out of stock alerts
-- ============================================

-- Add alert suppression columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS suppress_low_stock_alert BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suppress_out_of_stock_alert BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS low_stock_alert_suppressed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS out_of_stock_alert_suppressed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS low_stock_alert_suppressed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS out_of_stock_alert_suppressed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add same columns to product_variants for variant-level inventory tracking
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS suppress_low_stock_alert BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suppress_out_of_stock_alert BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS low_stock_alert_suppressed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS out_of_stock_alert_suppressed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN products.suppress_low_stock_alert IS 'When true, low stock alerts are hidden for this product';
COMMENT ON COLUMN products.suppress_out_of_stock_alert IS 'When true, out of stock alerts are hidden for this product';
COMMENT ON COLUMN products.low_stock_alert_suppressed_at IS 'Timestamp when low stock alert was suppressed';
COMMENT ON COLUMN products.out_of_stock_alert_suppressed_at IS 'Timestamp when out of stock alert was suppressed';

-- Create index for efficient filtering of suppressed alerts
CREATE INDEX IF NOT EXISTS idx_products_alert_suppression
ON products(tenant_id, suppress_low_stock_alert, suppress_out_of_stock_alert)
WHERE is_active = true;

-- Function to toggle alert suppression
CREATE OR REPLACE FUNCTION toggle_inventory_alert_suppression(
  p_product_id UUID,
  p_alert_type TEXT, -- 'low_stock' or 'out_of_stock'
  p_suppress BOOLEAN,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_alert_type = 'low_stock' THEN
    UPDATE products
    SET
      suppress_low_stock_alert = p_suppress,
      low_stock_alert_suppressed_at = CASE WHEN p_suppress THEN NOW() ELSE NULL END,
      low_stock_alert_suppressed_by = CASE WHEN p_suppress THEN p_user_id ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_product_id;
  ELSIF p_alert_type = 'out_of_stock' THEN
    UPDATE products
    SET
      suppress_out_of_stock_alert = p_suppress,
      out_of_stock_alert_suppressed_at = CASE WHEN p_suppress THEN NOW() ELSE NULL END,
      out_of_stock_alert_suppressed_by = CASE WHEN p_suppress THEN p_user_id ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_product_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid alert type. Use low_stock or out_of_stock');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'product_id', id,
    'alert_type', p_alert_type,
    'suppressed', CASE
      WHEN p_alert_type = 'low_stock' THEN suppress_low_stock_alert
      ELSE suppress_out_of_stock_alert
    END
  )
  INTO v_result
  FROM products
  WHERE id = p_product_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_inventory_alert_suppression TO authenticated;
