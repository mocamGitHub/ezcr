-- ========================================
-- CRM TABLES - Multi-Tenant Support
-- ========================================
-- Date: 2025-10-13
-- Purpose: Native CRM functionality with full multi-tenant support

-- ========================================
-- CUSTOMER TAGS
-- ========================================
CREATE TABLE customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ========================================
-- CUSTOMER TAG ASSIGNMENTS
-- ========================================
CREATE TABLE customer_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, customer_email, tag_id)
);

-- ========================================
-- CUSTOMER NOTES
-- ========================================
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CUSTOMER TASKS
-- ========================================
CREATE TABLE customer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CUSTOMER HEALTH SCORES (Auto-calculated)
-- ========================================
CREATE TABLE customer_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, customer_email)
);

-- ========================================
-- CRM ACTIVITY LOG (For timeline)
-- ========================================
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB NOT NULL DEFAULT '{}',
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_customer_tags_tenant ON customer_tags(tenant_id);
CREATE INDEX idx_customer_tag_assignments_tenant_email 
  ON customer_tag_assignments(tenant_id, customer_email);
CREATE INDEX idx_customer_tag_assignments_tag 
  ON customer_tag_assignments(tag_id);

CREATE INDEX idx_customer_notes_tenant_email 
  ON customer_notes(tenant_id, customer_email, created_at DESC);
CREATE INDEX idx_customer_notes_pinned 
  ON customer_notes(tenant_id, customer_email) WHERE is_pinned = true;

CREATE INDEX idx_customer_tasks_tenant_assigned 
  ON customer_tasks(tenant_id, assigned_to, status);
CREATE INDEX idx_customer_tasks_tenant_customer 
  ON customer_tasks(tenant_id, customer_email, status);
CREATE INDEX idx_customer_tasks_due 
  ON customer_tasks(tenant_id, due_date) WHERE status != 'completed';

CREATE INDEX idx_customer_health_tenant_email 
  ON customer_health_scores(tenant_id, customer_email);

CREATE INDEX idx_crm_activities_tenant_email 
  ON crm_activities(tenant_id, customer_email, created_at DESC);
CREATE INDEX idx_crm_activities_type 
  ON crm_activities(tenant_id, activity_type, created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to customer_tags"
  ON customer_tags FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to customer_tag_assignments"
  ON customer_tag_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to customer_notes"
  ON customer_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to customer_tasks"
  ON customer_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to customer_health_scores"
  ON customer_health_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to crm_activities"
  ON crm_activities FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users (admin/staff) can view their tenant's CRM data
CREATE POLICY "Authenticated users can view their tenant's tags"
  ON customer_tags FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = customer_tags.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Authenticated users can view their tenant's tag assignments"
  ON customer_tag_assignments FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = customer_tag_assignments.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Authenticated users can view their tenant's notes"
  ON customer_notes FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = customer_notes.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Authenticated users can view their tenant's tasks"
  ON customer_tasks FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = customer_tasks.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Authenticated users can view their tenant's health scores"
  ON customer_health_scores FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = customer_health_scores.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Authenticated users can view their tenant's activities"
  ON crm_activities FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tenant_id = crm_activities.tenant_id
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

-- ========================================
-- TRIGGERS
-- ========================================
CREATE TRIGGER update_customer_tags_updated_at 
  BEFORE UPDATE ON customer_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_notes_updated_at 
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_tasks_updated_at 
  BEFORE UPDATE ON customer_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEW: UNIFIED CUSTOMER PROFILES
-- ========================================
CREATE OR REPLACE VIEW customer_profiles_unified AS
SELECT
  o.tenant_id,
  o.customer_email,
  MAX(o.customer_name) as name,
  MAX(o.customer_phone) as phone,
  COUNT(DISTINCT o.id) as order_count,
  COALESCE(SUM(o.total_amount), 0) as lifetime_value,
  MAX(o.created_at) as last_order_date,
  MIN(o.created_at) as first_order_date,
  MAX(o.appointment_date) as last_appointment_date,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
  (
    SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
    FROM customer_tag_assignments cta
    JOIN customer_tags t ON cta.tag_id = t.id
    WHERE cta.customer_email = o.customer_email 
      AND cta.tenant_id = o.tenant_id
  ) as tags,
  (
    SELECT score
    FROM customer_health_scores chs
    WHERE chs.customer_email = o.customer_email 
      AND chs.tenant_id = o.tenant_id
  ) as health_score,
  (
    SELECT COUNT(*)
    FROM customer_notes cn
    WHERE cn.customer_email = o.customer_email 
      AND cn.tenant_id = o.tenant_id
  ) as note_count,
  (
    SELECT COUNT(*)
    FROM customer_tasks ct
    WHERE ct.customer_email = o.customer_email 
      AND ct.tenant_id = o.tenant_id
      AND ct.status != 'completed'
  ) as open_task_count
FROM orders o
GROUP BY o.tenant_id, o.customer_email;

-- Grant access to view
GRANT SELECT ON customer_profiles_unified TO authenticated, service_role;

-- ========================================
-- FUNCTION: CALCULATE CUSTOMER HEALTH SCORE
-- ========================================
CREATE OR REPLACE FUNCTION calculate_customer_health_score(
  p_tenant_id UUID,
  p_customer_email VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_last_order_days INTEGER;
  v_order_count INTEGER;
  v_ltv DECIMAL;
  v_chat_count INTEGER;
  v_factors JSONB := '{}'::jsonb;
BEGIN
  -- Get customer metrics
  SELECT 
    EXTRACT(DAY FROM (NOW() - MAX(created_at)))::INTEGER,
    COUNT(*),
    COALESCE(SUM(total_amount), 0)
  INTO v_last_order_days, v_order_count, v_ltv
  FROM orders
  WHERE tenant_id = p_tenant_id 
    AND customer_email = p_customer_email;

  -- Get chat engagement
  SELECT COUNT(*)
  INTO v_chat_count
  FROM chat_sessions
  WHERE tenant_id = p_tenant_id
    AND metadata->>'customer_email' = p_customer_email;

  -- Calculate score components (0-100 scale)
  
  -- Recency score (40 points max)
  IF v_last_order_days IS NULL THEN
    v_score := v_score + 0;
    v_factors := jsonb_set(v_factors, '{recency}', '0');
  ELSIF v_last_order_days <= 30 THEN
    v_score := v_score + 40;
    v_factors := jsonb_set(v_factors, '{recency}', '40');
  ELSIF v_last_order_days <= 60 THEN
    v_score := v_score + 30;
    v_factors := jsonb_set(v_factors, '{recency}', '30');
  ELSIF v_last_order_days <= 90 THEN
    v_score := v_score + 20;
    v_factors := jsonb_set(v_factors, '{recency}', '20');
  ELSIF v_last_order_days <= 180 THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{recency}', '10');
  ELSE
    v_score := v_score + 5;
    v_factors := jsonb_set(v_factors, '{recency}', '5');
  END IF;

  -- Frequency score (30 points max)
  IF v_order_count >= 5 THEN
    v_score := v_score + 30;
    v_factors := jsonb_set(v_factors, '{frequency}', '30');
  ELSIF v_order_count >= 3 THEN
    v_score := v_score + 20;
    v_factors := jsonb_set(v_factors, '{frequency}', '20');
  ELSIF v_order_count >= 2 THEN
    v_score := v_score + 15;
    v_factors := jsonb_set(v_factors, '{frequency}', '15');
  ELSIF v_order_count >= 1 THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{frequency}', '10');
  END IF;

  -- Monetary score (20 points max)
  IF v_ltv >= 5000 THEN
    v_score := v_score + 20;
    v_factors := jsonb_set(v_factors, '{monetary}', '20');
  ELSIF v_ltv >= 3000 THEN
    v_score := v_score + 15;
    v_factors := jsonb_set(v_factors, '{monetary}', '15');
  ELSIF v_ltv >= 2000 THEN
    v_score := v_score + 12;
    v_factors := jsonb_set(v_factors, '{monetary}', '12');
  ELSIF v_ltv >= 1000 THEN
    v_score := v_score + 8;
    v_factors := jsonb_set(v_factors, '{monetary}', '8');
  ELSIF v_ltv > 0 THEN
    v_score := v_score + 5;
    v_factors := jsonb_set(v_factors, '{monetary}', '5');
  END IF;

  -- Engagement score (10 points max)
  IF v_chat_count >= 5 THEN
    v_score := v_score + 10;
    v_factors := jsonb_set(v_factors, '{engagement}', '10');
  ELSIF v_chat_count >= 3 THEN
    v_score := v_score + 7;
    v_factors := jsonb_set(v_factors, '{engagement}', '7');
  ELSIF v_chat_count >= 1 THEN
    v_score := v_score + 5;
    v_factors := jsonb_set(v_factors, '{engagement}', '5');
  END IF;

  -- Store score with factors
  INSERT INTO customer_health_scores (tenant_id, customer_email, score, factors, calculated_at)
  VALUES (p_tenant_id, p_customer_email, v_score, v_factors, NOW())
  ON CONFLICT (tenant_id, customer_email)
  DO UPDATE SET 
    score = EXCLUDED.score,
    factors = EXCLUDED.factors,
    calculated_at = EXCLUDED.calculated_at;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTION: LOG CRM ACTIVITY
-- ========================================
CREATE OR REPLACE FUNCTION log_crm_activity(
  p_tenant_id UUID,
  p_customer_email VARCHAR,
  p_activity_type VARCHAR,
  p_activity_data JSONB DEFAULT '{}',
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO crm_activities (
    tenant_id,
    customer_email,
    activity_type,
    activity_data,
    related_entity_type,
    related_entity_id,
    performed_by
  ) VALUES (
    p_tenant_id,
    p_customer_email,
    p_activity_type,
    p_activity_data,
    p_related_entity_type,
    p_related_entity_id,
    p_performed_by
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SEED DEFAULT TAGS (EZCR Tenant)
-- ========================================
INSERT INTO customer_tags (tenant_id, name, color, description)
SELECT 
  id,
  tag_name,
  tag_color,
  tag_description
FROM tenants,
LATERAL (VALUES
  ('VIP', '#7C3AED', 'High-value customers (LTV > $2,000)'),
  ('At Risk', '#EF4444', 'Customers with no activity in 90+ days'),
  ('New Customer', '#10B981', 'First-time buyers (last 30 days)'),
  ('Repeat Customer', '#3B82F6', 'Customers with 2+ orders'),
  ('High Intent', '#F59E0B', 'Multiple chats but no purchase yet'),
  ('Cart Abandoner', '#F97316', 'Abandoned cart recently'),
  ('Installation Pending', '#8B5CF6', 'Appointment scheduled'),
  ('Support Issue', '#DC2626', 'Recent support inquiry'),
  ('Satisfied', '#059669', 'Positive survey response'),
  ('Referral Source', '#EC4899', 'Referred other customers')
) AS tags(tag_name, tag_color, tag_description)
WHERE tenants.slug = 'ezcr-01'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE customer_tags IS 'Customer tags for segmentation (multi-tenant)';
COMMENT ON TABLE customer_tag_assignments IS 'Many-to-many relationship between customers and tags';
COMMENT ON TABLE customer_notes IS 'Internal notes about customers (multi-tenant)';
COMMENT ON TABLE customer_tasks IS 'Follow-up tasks for customers (multi-tenant)';
COMMENT ON TABLE customer_health_scores IS 'Auto-calculated customer health scores (0-100)';
COMMENT ON TABLE crm_activities IS 'Activity timeline for customers (multi-tenant)';

COMMENT ON FUNCTION calculate_customer_health_score IS 'Calculate health score based on RFM + engagement';
COMMENT ON FUNCTION log_crm_activity IS 'Helper function to log customer activities';
