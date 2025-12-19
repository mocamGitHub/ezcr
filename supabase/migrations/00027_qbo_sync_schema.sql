-- QBO Sync Schema
-- Stores raw QBO entity data and normalized web transactions
-- Part of the NexCyte/EZ Cycle Ramp stack

-- =====================================================
-- QBO Sync State Tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS qbo_sync_state (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  last_cdc_time TIMESTAMPTZ,
  last_full_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, realm_id)
);

COMMENT ON TABLE qbo_sync_state IS 'Tracks sync progress per tenant/QBO realm';

-- =====================================================
-- QBO Raw Entity Storage
-- =====================================================
CREATE TABLE IF NOT EXISTS qbo_entity_raw (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  sync_token TEXT,
  last_updated_time TIMESTAMPTZ,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, realm_id, entity_type, entity_id)
);

COMMENT ON TABLE qbo_entity_raw IS 'Raw JSON payloads from QBO API';

CREATE INDEX IF NOT EXISTS idx_qbo_entity_raw_updated
  ON qbo_entity_raw (tenant_id, realm_id, entity_type, last_updated_time DESC);

CREATE INDEX IF NOT EXISTS idx_qbo_entity_raw_fetched
  ON qbo_entity_raw (tenant_id, fetched_at DESC);

-- =====================================================
-- Normalized Web Transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS web_transactions (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'qbo',
  qbo_entity_type TEXT NOT NULL,
  qbo_entity_id TEXT NOT NULL,
  txn_date DATE,
  doc_number TEXT,
  customer_ref TEXT,
  customer_name TEXT,
  total_amount NUMERIC(14,2),
  currency TEXT DEFAULT 'USD',
  status TEXT,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, source, qbo_entity_type, qbo_entity_id)
);

COMMENT ON TABLE web_transactions IS 'Normalized transaction summary for website display';

CREATE INDEX IF NOT EXISTS idx_web_transactions_date
  ON web_transactions (tenant_id, txn_date DESC);

CREATE INDEX IF NOT EXISTS idx_web_transactions_customer
  ON web_transactions (tenant_id, customer_ref);

CREATE INDEX IF NOT EXISTS idx_web_transactions_status
  ON web_transactions (tenant_id, status);

-- =====================================================
-- Web Transaction Line Items
-- =====================================================
CREATE TABLE IF NOT EXISTS web_transaction_lines (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'qbo',
  qbo_entity_type TEXT NOT NULL,
  qbo_entity_id TEXT NOT NULL,
  line_num INT NOT NULL,
  item_ref TEXT,
  item_name TEXT,
  description TEXT,
  quantity NUMERIC(14,4),
  unit_price NUMERIC(14,4),
  line_amount NUMERIC(14,2),
  payload JSONB NOT NULL,
  PRIMARY KEY (tenant_id, source, qbo_entity_type, qbo_entity_id, line_num)
);

COMMENT ON TABLE web_transaction_lines IS 'Line item details for web transactions';

CREATE INDEX IF NOT EXISTS idx_web_transaction_lines_item
  ON web_transaction_lines (tenant_id, item_ref);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all QBO tables
ALTER TABLE qbo_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbo_entity_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for sync tool running with service key)
CREATE POLICY "Service role full access on qbo_sync_state"
  ON qbo_sync_state FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on qbo_entity_raw"
  ON qbo_entity_raw FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on web_transactions"
  ON web_transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on web_transaction_lines"
  ON web_transaction_lines FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can read their tenant's data
CREATE POLICY "Tenant users can view qbo_sync_state"
  ON qbo_sync_state FOR SELECT
  USING (
    tenant_id = (current_setting('request.jwt.claim.tenant_id', true))::uuid
  );

CREATE POLICY "Tenant users can view qbo_entity_raw"
  ON qbo_entity_raw FOR SELECT
  USING (
    tenant_id = (current_setting('request.jwt.claim.tenant_id', true))::uuid
  );

CREATE POLICY "Tenant users can view web_transactions"
  ON web_transactions FOR SELECT
  USING (
    tenant_id = (current_setting('request.jwt.claim.tenant_id', true))::uuid
  );

CREATE POLICY "Tenant users can view web_transaction_lines"
  ON web_transaction_lines FOR SELECT
  USING (
    tenant_id = (current_setting('request.jwt.claim.tenant_id', true))::uuid
  );

-- =====================================================
-- Updated_at Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_qbo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qbo_sync_state_updated_at
  BEFORE UPDATE ON qbo_sync_state
  FOR EACH ROW EXECUTE FUNCTION update_qbo_updated_at();

CREATE TRIGGER trigger_web_transactions_updated_at
  BEFORE UPDATE ON web_transactions
  FOR EACH ROW EXECUTE FUNCTION update_qbo_updated_at();
