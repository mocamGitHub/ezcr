-- ============================================
-- DATABASE MIGRATIONS: Scheduled Emails
-- Migration 003: Email queue for post-purchase automation
-- Run AFTER database-orders-migration.sql
-- ============================================

-- ============================================
-- TABLE: scheduled_emails
-- Queue for scheduled post-purchase emails
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Order reference
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Email details
  email_type TEXT NOT NULL,
  -- review_request: Sent 7 days after delivery
  -- installation_tips: Sent 1 day after delivery
  -- follow_up: General follow-up emails

  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'pending',
  -- pending: Waiting to be sent
  -- sent: Successfully sent
  -- failed: Send attempt failed
  -- cancelled: Cancelled (e.g., order cancelled)
  -- skipped: Skipped (e.g., customer unsubscribed)

  -- Execution details
  sent_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error TEXT,

  -- SendGrid tracking
  sendgrid_message_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- Can store: template_id, dynamic_data, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_email_type CHECK (email_type IN ('review_request', 'installation_tips', 'follow_up')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'skipped')),
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary lookup: pending emails ready to send
CREATE INDEX idx_scheduled_emails_pending ON scheduled_emails(scheduled_for)
  WHERE status = 'pending';

-- Order lookup
CREATE INDEX idx_scheduled_emails_order ON scheduled_emails(order_id);

-- Status tracking
CREATE INDEX idx_scheduled_emails_status ON scheduled_emails(status, scheduled_for);

-- Failed emails for retry
CREATE INDEX idx_scheduled_emails_failed ON scheduled_emails(last_attempt_at)
  WHERE status = 'failed' AND attempts < 5;

-- Email type analytics
CREATE INDEX idx_scheduled_emails_type ON scheduled_emails(email_type, status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on scheduled_emails"
  ON scheduled_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_scheduled_email_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_email_timestamp
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_email_timestamp();

-- Function to get emails ready to send
CREATE OR REPLACE FUNCTION get_pending_emails(batch_size INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  email_type TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  scheduled_for TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.order_id,
    se.email_type,
    se.recipient_email,
    se.recipient_name,
    se.scheduled_for,
    se.metadata
  FROM scheduled_emails se
  WHERE se.status = 'pending'
    AND se.scheduled_for <= NOW()
  ORDER BY se.scheduled_for ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_email_id UUID,
  p_sendgrid_message_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE scheduled_emails
  SET
    status = 'sent',
    sent_at = NOW(),
    sendgrid_message_id = p_sendgrid_message_id,
    attempts = attempts + 1,
    last_attempt_at = NOW()
  WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_email_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE scheduled_emails
  SET
    status = CASE WHEN attempts >= 4 THEN 'failed' ELSE 'pending' END,
    error = p_error,
    attempts = attempts + 1,
    last_attempt_at = NOW(),
    -- Exponential backoff: retry in 5min, 15min, 45min, 2h
    scheduled_for = CASE
      WHEN attempts < 4 THEN NOW() + (INTERVAL '5 minutes' * POWER(3, attempts))
      ELSE scheduled_for
    END
  WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel emails for an order
CREATE OR REPLACE FUNCTION cancel_order_emails(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  UPDATE scheduled_emails
  SET status = 'cancelled'
  WHERE order_id = p_order_id
    AND status = 'pending';

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule post-delivery emails
CREATE OR REPLACE FUNCTION schedule_post_delivery_emails(
  p_order_id UUID,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_delivered_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  -- Installation tips: 1 day after delivery
  INSERT INTO scheduled_emails (
    order_id, email_type, recipient_email, recipient_name, scheduled_for
  ) VALUES (
    p_order_id, 'installation_tips', p_recipient_email, p_recipient_name,
    p_delivered_at + INTERVAL '1 day'
  );

  -- Review request: 7 days after delivery
  INSERT INTO scheduled_emails (
    order_id, email_type, recipient_email, recipient_name, scheduled_for
  ) VALUES (
    p_order_id, 'review_request', p_recipient_email, p_recipient_name,
    p_delivered_at + INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Cancel emails when order cancelled
-- ============================================

CREATE OR REPLACE FUNCTION cancel_emails_on_order_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    PERFORM cancel_order_emails(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cancel_emails_on_order_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION cancel_emails_on_order_cancel();

-- ============================================
-- TRIGGER: Schedule emails on delivery
-- ============================================

CREATE OR REPLACE FUNCTION schedule_emails_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When order is marked as delivered
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL THEN
    PERFORM schedule_post_delivery_emails(
      NEW.id,
      NEW.customer_email,
      NEW.customer_name,
      NEW.delivered_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_emails_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.delivered_at IS DISTINCT FROM OLD.delivered_at)
  EXECUTE FUNCTION schedule_emails_on_delivery();

-- ============================================
-- VIEW: Scheduled emails status
-- ============================================

CREATE OR REPLACE VIEW v_scheduled_emails_status AS
SELECT
  se.id,
  se.email_type,
  se.recipient_email,
  se.status,
  se.scheduled_for,
  se.sent_at,
  se.attempts,
  se.error,
  o.order_number,
  o.customer_name,
  CASE
    WHEN se.status = 'pending' AND se.scheduled_for <= NOW() THEN 'ready'
    WHEN se.status = 'pending' THEN 'scheduled'
    ELSE se.status
  END as display_status
FROM scheduled_emails se
JOIN orders o ON se.order_id = o.id
ORDER BY
  CASE se.status
    WHEN 'pending' THEN 1
    WHEN 'failed' THEN 2
    ELSE 3
  END,
  se.scheduled_for ASC;

-- ============================================
-- VIEW: Email queue summary
-- ============================================

CREATE OR REPLACE VIEW v_scheduled_emails_summary AS
SELECT
  email_type,
  status,
  COUNT(*) as count,
  MIN(scheduled_for) as earliest_scheduled,
  MAX(scheduled_for) as latest_scheduled
FROM scheduled_emails
GROUP BY email_type, status
ORDER BY email_type, status;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE scheduled_emails IS 'Queue for scheduled post-purchase emails. Processed by cron job or Edge Function.';
COMMENT ON COLUMN scheduled_emails.email_type IS 'Type of email: review_request (7 days post-delivery), installation_tips (1 day post-delivery)';
COMMENT ON COLUMN scheduled_emails.status IS 'pending=waiting, sent=delivered, failed=max retries exceeded, cancelled=order cancelled';
COMMENT ON COLUMN scheduled_emails.attempts IS 'Number of send attempts. Max 5 with exponential backoff.';
COMMENT ON FUNCTION get_pending_emails IS 'Get batch of emails ready to send. Call from cron job.';
COMMENT ON FUNCTION schedule_post_delivery_emails IS 'Schedule installation tips (1 day) and review request (7 days) after delivery.';
