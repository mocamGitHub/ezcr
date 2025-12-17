-- ============================================
-- DATABASE MIGRATIONS: Orders Table
-- Run in Supabase SQL Editor AFTER shipping migrations
-- ============================================

-- ============================================
-- TABLE: orders
-- Complete order records for EZ Cycle Ramp
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer Information
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  
  -- Order Status
  status TEXT DEFAULT 'pending',
  -- pending: Payment received, awaiting processing
  -- processing: Being prepared for shipment
  -- shipped: In transit
  -- delivered: Completed
  -- cancelled: Order cancelled
  -- refunded: Payment refunded
  
  -- Product Details
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  -- Custom Options (if any)
  truck_bed_length TEXT,        -- Customer's truck bed length
  tonneau_cover BOOLEAN,        -- Has tonneau cover?
  options JSONB,                -- Any other custom options
  
  -- Delivery Information
  delivery_method TEXT NOT NULL,  -- 'shipping' or 'pickup'
  
  -- Shipping Details (if delivery_method = 'shipping')
  shipping_quote_id TEXT REFERENCES shipping_quotes(quote_id),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  shipping_address JSONB,
  -- Structure: {
  --   street_address: string,
  --   apartment?: string,
  --   city: string,
  --   state: string,
  --   zip_code: string,
  --   country: string,
  --   is_residential: boolean
  -- }
  
  destination_terminal JSONB,
  -- Structure: {
  --   code: string,
  --   name: string,
  --   address?: string
  -- }
  
  estimated_transit_days INTEGER,
  
  -- Billing Information
  billing_address JSONB NOT NULL,
  -- Same structure as shipping_address
  
  -- Payment Details
  payment_intent_id TEXT,         -- Stripe payment intent ID
  payment_method TEXT,            -- 'card', 'affirm', etc.
  payment_status TEXT DEFAULT 'pending',
  -- pending, processing, succeeded, failed, refunded
  
  -- Order Totals
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_total DECIMAL(10,2) DEFAULT 0,
  tax_total DECIMAL(10,2) DEFAULT 0,
  discount_total DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  
  -- Discount/Promo
  promo_code TEXT,
  promo_discount DECIMAL(10,2) DEFAULT 0,
  
  -- Attribution & Tracking
  lead_id UUID,                   -- Link to configurator_leads
  session_id TEXT,                -- Browser session ID
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  
  -- Fulfillment
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  carrier TEXT,                   -- 'tforce', 'ups', etc.
  bol_number TEXT,                -- Bill of Lading number
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  delivery_signature TEXT,
  
  -- Pickup Details (if delivery_method = 'pickup')
  pickup_ready_at TIMESTAMPTZ,
  pickup_notified_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  
  -- Customer Communication
  order_confirmation_sent_at TIMESTAMPTZ,
  shipping_notification_sent_at TIMESTAMPTZ,
  delivery_notification_sent_at TIMESTAMPTZ,
  review_request_sent_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,            -- Notes from customer
  internal_notes TEXT,            -- Internal staff notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_delivery_method CHECK (delivery_method IN ('shipping', 'pickup')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  CONSTRAINT valid_product_sku CHECK (product_sku IN ('AUN200', 'AUN250')),
  CONSTRAINT positive_totals CHECK (subtotal >= 0 AND shipping_total >= 0 AND grand_total >= 0)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_lead ON orders(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_orders_session ON orders(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_orders_payment_intent ON orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX idx_orders_tracking ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_orders_pending_shipment ON orders(created_at) 
  WHERE status = 'processing' AND shipped_at IS NULL;
CREATE INDEX idx_orders_pending_pickup ON orders(pickup_ready_at) 
  WHERE delivery_method = 'pickup' AND picked_up_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on orders" 
  ON orders FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  new_order_number TEXT;
  exists_check BOOLEAN;
BEGIN
  -- Format: EZC-YYYYMMDD-XXXX
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    new_order_number := 'EZC-' || date_part || '-' || random_part;
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_order_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamp();

-- Mark lead as converted when order created
CREATE OR REPLACE FUNCTION convert_lead_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update configurator_leads if lead_id exists
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE configurator_leads
    SET 
      converted_at = NOW(),
      order_id = NEW.order_number
    WHERE id = NEW.lead_id;
    
    -- Stop active email sequences
    UPDATE lead_sequences
    SET 
      status = 'converted',
      completed_at = NOW()
    WHERE lead_id = NEW.lead_id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_convert_lead
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION convert_lead_on_order();

-- ============================================
-- VIEWS
-- ============================================

-- View: Orders awaiting shipment
CREATE OR REPLACE VIEW v_orders_pending_shipment AS
SELECT 
  id,
  order_number,
  customer_email,
  customer_name,
  product_sku,
  product_name,
  delivery_method,
  shipping_address,
  destination_terminal,
  grand_total,
  created_at,
  EXTRACT(DAY FROM NOW() - created_at) as days_since_order
FROM orders
WHERE status = 'processing'
  AND delivery_method = 'shipping'
  AND shipped_at IS NULL
ORDER BY created_at ASC;

-- View: Pickups ready for customer
CREATE OR REPLACE VIEW v_orders_ready_for_pickup AS
SELECT 
  id,
  order_number,
  customer_email,
  customer_name,
  customer_phone,
  product_sku,
  product_name,
  grand_total,
  pickup_ready_at,
  pickup_notified_at,
  EXTRACT(DAY FROM NOW() - pickup_ready_at) as days_waiting
FROM orders
WHERE delivery_method = 'pickup'
  AND pickup_ready_at IS NOT NULL
  AND picked_up_at IS NULL
ORDER BY pickup_ready_at ASC;

-- View: Daily order summary
CREATE OR REPLACE VIEW v_orders_daily_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN delivery_method = 'shipping' THEN 1 ELSE 0 END) as shipping_orders,
  SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END) as pickup_orders,
  SUM(subtotal) as total_product_revenue,
  SUM(shipping_total) as total_shipping_revenue,
  SUM(grand_total) as total_revenue,
  AVG(grand_total) as avg_order_value,
  SUM(CASE WHEN lead_id IS NOT NULL THEN 1 ELSE 0 END) as from_configurator
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View: Shipping performance
CREATE OR REPLACE VIEW v_shipping_performance AS
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as orders_shipped,
  AVG(EXTRACT(EPOCH FROM (shipped_at - created_at)) / 86400) as avg_days_to_ship,
  AVG(estimated_transit_days) as avg_estimated_transit,
  AVG(EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 86400) as avg_actual_transit,
  SUM(CASE WHEN delivered_at <= estimated_delivery_date THEN 1 ELSE 0 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END), 0) * 100 as on_time_percentage
FROM orders
WHERE delivery_method = 'shipping'
  AND shipped_at IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE orders IS 'Complete order records for EZ Cycle Ramp e-commerce. Tracks from purchase through delivery.';
COMMENT ON COLUMN orders.shipping_quote_id IS 'Reference to shipping_quotes table for freight cost tracking';
COMMENT ON COLUMN orders.lead_id IS 'Reference to configurator_leads if order originated from configurator';
COMMENT ON COLUMN orders.destination_terminal IS 'T-Force terminal info for terminal-to-terminal shipping';
COMMENT ON COLUMN orders.bol_number IS 'Bill of Lading number from T-Force freight';
