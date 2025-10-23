-- ========================================
-- EMAIL TICKETING SYSTEM
-- ========================================
-- This migration creates a comprehensive ticketing system for customer support
-- including tickets, messages, tags, and automation

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Ticket identification
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ticket number (e.g., "TICKET-2024-001")

  -- Customer information
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),

  -- Ticket details
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_progress, waiting, resolved, closed
  priority VARCHAR(50) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  category VARCHAR(100), -- product, shipping, warranty, installation, billing, other

  -- Assignment
  assigned_to UUID, -- Reference to user/agent (would need users table)
  assigned_at TIMESTAMPTZ,

  -- Source tracking
  source VARCHAR(50) NOT NULL DEFAULT 'email', -- email, chat, phone, web_form
  channel_metadata JSONB, -- Store email headers, chat session ID, etc.

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID, -- Reference to user/agent
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- SLA tracking
  first_response_at TIMESTAMPTZ,
  first_response_sla_breach BOOLEAN DEFAULT false,
  resolution_sla_breach BOOLEAN DEFAULT false
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Message details
  message_type VARCHAR(50) NOT NULL, -- email, internal_note, status_change, system
  sender_type VARCHAR(50) NOT NULL, -- customer, agent, system
  sender_id UUID, -- Reference to user/agent if applicable
  sender_email VARCHAR(255),
  sender_name VARCHAR(255),

  -- Content
  subject VARCHAR(500),
  body TEXT NOT NULL,
  body_html TEXT,
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to customer

  -- Email specific
  email_message_id VARCHAR(500), -- Email Message-ID header for threading
  in_reply_to VARCHAR(500), -- Email In-Reply-To header

  -- Attachments
  attachments JSONB, -- Array of {name, url, size, type}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_tags table
CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ticket_id, tag)
);

-- Create ticket_automation_rules table
CREATE TABLE IF NOT EXISTS ticket_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Rule details
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Trigger conditions
  trigger_event VARCHAR(100) NOT NULL, -- new_ticket, new_message, status_change, priority_change
  conditions JSONB NOT NULL, -- Array of {field, operator, value}

  -- Actions to perform
  actions JSONB NOT NULL, -- Array of {action, parameters}
  -- Examples:
  -- {action: 'set_priority', parameters: {priority: 'high'}}
  -- {action: 'assign_to', parameters: {user_id: '...'}}
  -- {action: 'add_tag', parameters: {tag: 'urgent'}}
  -- {action: 'send_notification', parameters: {to: 'team@example.com'}}

  -- Execution tracking
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tickets_tenant ON tickets(tenant_id, status, priority);
CREATE INDEX idx_tickets_customer ON tickets(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_tickets_email ON tickets(customer_email);
CREATE INDEX idx_tickets_status ON tickets(status, created_at DESC);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tickets_number ON tickets(ticket_number);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at ASC);
CREATE INDEX idx_ticket_messages_email_id ON ticket_messages(email_message_id) WHERE email_message_id IS NOT NULL;

CREATE INDEX idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX idx_ticket_tags_tag ON ticket_tags(tag);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number(tenant_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  year_part VARCHAR(4);
  count_part INTEGER;
  ticket_num VARCHAR(50);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Get count of tickets for this tenant this year
  SELECT COUNT(*) INTO count_part
  FROM tickets
  WHERE tenant_id = tenant_uuid
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  count_part := count_part + 1;

  -- Format: TICKET-YYYY-NNNN
  ticket_num := 'TICKET-' || year_part || '-' || LPAD(count_part::TEXT, 4, '0');

  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

CREATE TRIGGER ticket_messages_updated_at
  BEFORE UPDATE ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Create trigger to update last_message_at on tickets
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets
  SET last_message_at = NEW.created_at
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_messages_update_last
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- Add RLS policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_automation_rules ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY tickets_service_all ON tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY ticket_messages_service_all ON ticket_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY ticket_tags_service_all ON ticket_tags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY ticket_automation_rules_service_all ON ticket_automation_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view tickets (would need more granular policies in production)
CREATE POLICY tickets_select ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY ticket_messages_select ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (NOT is_internal); -- Can't see internal notes

-- Insert default automation rules for ezcr-dev tenant
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'ezcr-dev' LIMIT 1;

  IF tenant_uuid IS NOT NULL THEN
    -- Auto-prioritize shipping issues
    INSERT INTO ticket_automation_rules (tenant_id, rule_name, rule_description, trigger_event, conditions, actions) VALUES
    (
      tenant_uuid,
      'High Priority for Urgent Keywords',
      'Automatically set priority to high when subject contains urgent keywords',
      'new_ticket',
      '[{"field": "subject", "operator": "contains_any", "value": ["urgent", "asap", "emergency", "broken", "damaged"]}]',
      '[{"action": "set_priority", "parameters": {"priority": "high"}}, {"action": "add_tag", "parameters": {"tag": "needs_attention"}}]'
    ),
    (
      tenant_uuid,
      'Auto-categorize Shipping Tickets',
      'Automatically categorize tickets mentioning shipping or delivery',
      'new_ticket',
      '[{"field": "subject", "operator": "contains_any", "value": ["shipping", "delivery", "tracking", "freight"]}]',
      '[{"action": "set_category", "parameters": {"category": "shipping"}}, {"action": "add_tag", "parameters": {"tag": "shipping"}}]'
    ),
    (
      tenant_uuid,
      'Auto-categorize Warranty Tickets',
      'Automatically categorize warranty-related tickets',
      'new_ticket',
      '[{"field": "subject", "operator": "contains_any", "value": ["warranty", "defect", "broken", "replacement"]}]',
      '[{"action": "set_category", "parameters": {"category": "warranty"}}, {"action": "add_tag", "parameters": {"tag": "warranty"}}]'
    )
    ON CONFLICT DO NOTHING;
  ELSE
    RAISE NOTICE 'Tenant ezcr-dev not found. Skipping automation rules seed.';
  END IF;
END $$;

-- Create view for ticket statistics
CREATE OR REPLACE VIEW ticket_statistics AS
SELECT
  t.tenant_id,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE t.status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_tickets,
  COUNT(*) FILTER (WHERE t.status = 'resolved') as resolved_tickets,
  COUNT(*) FILTER (WHERE t.status = 'closed') as closed_tickets,
  COUNT(*) FILTER (WHERE t.priority = 'urgent') as urgent_tickets,
  COUNT(*) FILTER (WHERE t.first_response_sla_breach) as sla_breaches,
  AVG(EXTRACT(EPOCH FROM (t.first_response_at - t.created_at))/3600) as avg_first_response_hours,
  AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600) as avg_resolution_hours,
  DATE_TRUNC('day', t.created_at) as date
FROM tickets t
GROUP BY t.tenant_id, DATE_TRUNC('day', t.created_at);

-- Add comments
COMMENT ON TABLE tickets IS 'Customer support tickets from email, chat, and other channels';
COMMENT ON TABLE ticket_messages IS 'Messages and conversation history for tickets';
COMMENT ON TABLE ticket_tags IS 'Tags for categorizing and organizing tickets';
COMMENT ON TABLE ticket_automation_rules IS 'Automation rules for auto-processing tickets';
COMMENT ON COLUMN tickets.ticket_number IS 'Human-readable ticket number (e.g., TICKET-2024-0001)';
COMMENT ON COLUMN tickets.status IS 'Current status: open, in_progress, waiting, resolved, closed';
COMMENT ON COLUMN tickets.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN ticket_messages.is_internal IS 'Internal notes not visible to customers';
