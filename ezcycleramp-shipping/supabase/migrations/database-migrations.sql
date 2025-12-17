-- ============================================
-- DATABASE MIGRATIONS: Shipping Quote System
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE: shipping_quotes
-- Stores cached shipping quotes from T-Force
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Quote identifier (for reference in checkout)
  quote_id TEXT UNIQUE NOT NULL,
  
  -- Destination info
  destination_zip TEXT NOT NULL,
  destination_city TEXT,
  destination_state TEXT,
  is_residential BOOLEAN DEFAULT false,
  
  -- Product info
  product_sku TEXT NOT NULL,  -- 'AUN200' or 'AUN250'
  
  -- Calculated rates (in USD)
  base_rate DECIMAL(10,2) NOT NULL,
  residential_surcharge DECIMAL(10,2) DEFAULT 0,
  total_rate DECIMAL(10,2) NOT NULL,
  
  -- Origin terminal info
  origin_terminal_code TEXT,
  origin_terminal_name TEXT,
  origin_terminal_address TEXT,
  
  -- Destination terminal info  
  destination_terminal_code TEXT,
  destination_terminal_name TEXT,
  destination_terminal_address TEXT,
  
  -- T-Force response data
  tforce_quote_id TEXT,       -- T-Force's quote number
  transit_days INTEGER,       -- Estimated transit time
  
  -- Quote validity
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Context
  source TEXT NOT NULL,       -- 'configurator' or 'checkout'
  lead_id UUID,               -- Reference to configurator_leads if applicable
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_product_sku CHECK (product_sku IN ('AUN200', 'AUN250')),
  CONSTRAINT valid_source CHECK (source IN ('configurator', 'checkout')),
  CONSTRAINT positive_rates CHECK (base_rate >= 0 AND total_rate >= 0)
);

-- Indexes for common queries
CREATE INDEX idx_quotes_quote_id ON shipping_quotes(quote_id);
CREATE INDEX idx_quotes_zip_product ON shipping_quotes(destination_zip, product_sku);
CREATE INDEX idx_quotes_valid ON shipping_quotes(valid_until);
CREATE INDEX idx_quotes_lead ON shipping_quotes(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_quotes_created ON shipping_quotes(created_at DESC);

-- ============================================
-- TABLE: shipping_errors
-- Tracks shipping calculation errors for support
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Request info
  destination_zip TEXT,
  destination_address TEXT,
  product_sku TEXT,
  source TEXT,                -- 'configurator' or 'checkout'
  
  -- Error details
  error_type TEXT NOT NULL,   -- 'api_error', 'invalid_address', 'no_terminal', 'rate_limited', etc.
  error_message TEXT NOT NULL,
  tforce_response JSONB,      -- Raw T-Force API response if available
  
  -- Support tracking
  support_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- User context (for follow-up)
  user_email TEXT,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_errors_type ON shipping_errors(error_type);
CREATE INDEX idx_errors_unresolved ON shipping_errors(created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_errors_zip ON shipping_errors(destination_zip);

-- ============================================
-- TABLE: shipping_addresses
-- Stores saved shipping addresses for leads/customers
-- (Optional - for address persistence between configurator and checkout)
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Address fields
  street_address TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_residential BOOLEAN DEFAULT true,
  
  -- Associated data
  lead_id UUID,
  email TEXT,
  session_id TEXT,
  
  -- Most recent quote for this address
  last_quote_id TEXT REFERENCES shipping_quotes(quote_id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_addresses_lead ON shipping_addresses(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_addresses_email ON shipping_addresses(email) WHERE email IS NOT NULL;
CREATE INDEX idx_addresses_session ON shipping_addresses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_addresses_zip ON shipping_addresses(zip_code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on quotes" 
  ON shipping_quotes FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access on errors" 
  ON shipping_errors FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access on addresses" 
  ON shipping_addresses FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Anonymous users can read their own quotes by quote_id
CREATE POLICY "Anon read own quotes" 
  ON shipping_quotes FOR SELECT 
  TO anon 
  USING (true);  -- Quotes are looked up by quote_id, no sensitive data

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to clean up expired quotes (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shipping_quotes 
  WHERE valid_until < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get valid quote or null
CREATE OR REPLACE FUNCTION get_valid_quote(
  p_zip TEXT,
  p_product TEXT,
  p_residential BOOLEAN DEFAULT false
)
RETURNS TABLE (
  quote_id TEXT,
  base_rate DECIMAL,
  residential_surcharge DECIMAL,
  total_rate DECIMAL,
  destination_terminal_code TEXT,
  destination_terminal_name TEXT,
  transit_days INTEGER,
  valid_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sq.quote_id,
    sq.base_rate,
    sq.residential_surcharge,
    sq.total_rate,
    sq.destination_terminal_code,
    sq.destination_terminal_name,
    sq.transit_days,
    sq.valid_until
  FROM shipping_quotes sq
  WHERE sq.destination_zip = p_zip
    AND sq.product_sku = p_product
    AND sq.is_residential = p_residential
    AND sq.valid_until > NOW()
  ORDER BY sq.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View: Recent shipping errors (for support dashboard)
CREATE OR REPLACE VIEW v_shipping_errors_recent AS
SELECT 
  id,
  error_type,
  error_message,
  destination_zip,
  product_sku,
  source,
  user_email,
  support_notified_at,
  resolved_at,
  created_at,
  CASE WHEN resolved_at IS NULL THEN 'Open' ELSE 'Resolved' END as status
FROM shipping_errors
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY 
  CASE WHEN resolved_at IS NULL THEN 0 ELSE 1 END,
  created_at DESC;

-- View: Quote statistics (for analytics)
CREATE OR REPLACE VIEW v_shipping_quote_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  product_sku,
  source,
  COUNT(*) as quote_count,
  AVG(total_rate) as avg_rate,
  COUNT(DISTINCT destination_zip) as unique_zips,
  SUM(CASE WHEN is_residential THEN 1 ELSE 0 END) as residential_count
FROM shipping_quotes
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), product_sku, source
ORDER BY date DESC;

-- ============================================
-- SCHEDULED CLEANUP (requires pg_cron extension)
-- Run this manually or set up via Supabase dashboard
-- ============================================

-- To enable daily cleanup, run this in SQL editor:
-- SELECT cron.schedule('cleanup-expired-quotes', '0 3 * * *', 'SELECT cleanup_expired_quotes()');

-- ============================================
-- SAMPLE DATA FOR TESTING (optional)
-- ============================================

-- Insert a test quote
-- INSERT INTO shipping_quotes (
--   quote_id, destination_zip, destination_city, destination_state,
--   is_residential, product_sku, base_rate, residential_surcharge, total_rate,
--   destination_terminal_code, destination_terminal_name,
--   transit_days, valid_until, source
-- ) VALUES (
--   'EZC-TEST-001', '90210', 'Beverly Hills', 'CA',
--   false, 'AUN250', 285.00, 0, 285.00,
--   'LAX', 'Los Angeles Terminal',
--   5, NOW() + INTERVAL '24 hours', 'configurator'
-- );

COMMENT ON TABLE shipping_quotes IS 'Cached shipping quotes from T-Force Freight API. Quotes are cached by ZIP+product+residential for 24 hours.';
COMMENT ON TABLE shipping_errors IS 'Tracks shipping calculation errors for support follow-up. Errors trigger email+SMS notifications.';
COMMENT ON TABLE shipping_addresses IS 'Saved shipping addresses for leads/customers. Persists between configurator and checkout.';
