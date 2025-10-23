-- ========================================
-- CUSTOMER SATISFACTION SURVEYS
-- ========================================
-- This migration creates tables for collecting customer satisfaction feedback
-- including post-chat surveys and post-purchase surveys

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Survey metadata
  survey_type VARCHAR(50) NOT NULL, -- 'chat', 'post_purchase', 'nps'
  session_id VARCHAR(255), -- For chat surveys, links to chat session
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- For purchase surveys
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email VARCHAR(255),

  -- Survey responses
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10), -- 0-10 NPS score
  feedback_text TEXT,

  -- Additional structured feedback
  response_data JSONB, -- Flexible field for additional question responses

  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_survey_responses_tenant ON survey_responses(tenant_id, survey_type);
CREATE INDEX idx_survey_responses_customer ON survey_responses(customer_id, survey_type);
CREATE INDEX idx_survey_responses_session ON survey_responses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_survey_responses_order ON survey_responses(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_survey_responses_submitted ON survey_responses(submitted_at DESC);
CREATE INDEX idx_survey_responses_rating ON survey_responses(rating) WHERE rating IS NOT NULL;

-- Create survey_questions table (for configurable survey questions)
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Question metadata
  survey_type VARCHAR(50) NOT NULL, -- 'chat', 'post_purchase', 'nps'
  question_key VARCHAR(100) NOT NULL, -- Unique key for this question (e.g., 'resolution_quality')
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'rating', 'text', 'multiple_choice', 'yes_no'

  -- Configuration
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  options JSONB, -- For multiple choice questions

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, survey_type, question_key)
);

-- Create index for active questions
CREATE INDEX idx_survey_questions_active ON survey_questions(tenant_id, survey_type, is_active, display_order);

-- Add RLS policies
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY survey_responses_service_all ON survey_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY survey_questions_service_all ON survey_questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert survey responses (for their own surveys)
CREATE POLICY survey_responses_insert ON survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anonymous users can also submit surveys (for post-purchase surveys sent via email)
CREATE POLICY survey_responses_anon_insert ON survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can view active survey questions
CREATE POLICY survey_questions_select ON survey_questions
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Insert default post-chat survey questions for ezcr-dev tenant
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'ezcr-dev' LIMIT 1;

  IF tenant_uuid IS NOT NULL THEN
    -- Post-chat survey questions
    INSERT INTO survey_questions (tenant_id, survey_type, question_key, question_text, question_type, is_required, display_order) VALUES
    (tenant_uuid, 'chat', 'overall_rating', 'How satisfied were you with your chat experience?', 'rating', true, 1),
    (tenant_uuid, 'chat', 'resolution', 'Did we answer your question or resolve your issue?', 'yes_no', true, 2),
    (tenant_uuid, 'chat', 'feedback', 'What could we do better? (optional)', 'text', false, 3)
    ON CONFLICT (tenant_id, survey_type, question_key) DO NOTHING;

    -- Post-purchase survey questions
    INSERT INTO survey_questions (tenant_id, survey_type, question_key, question_text, question_type, is_required, display_order) VALUES
    (tenant_uuid, 'post_purchase', 'product_rating', 'How satisfied are you with your purchase?', 'rating', true, 1),
    (tenant_uuid, 'post_purchase', 'delivery_rating', 'How was the delivery experience?', 'rating', true, 2),
    (tenant_uuid, 'post_purchase', 'installation_rating', 'How easy was the installation?', 'rating', false, 3),
    (tenant_uuid, 'post_purchase', 'recommend', 'Would you recommend EZ Cycle Ramp to others?', 'yes_no', true, 4),
    (tenant_uuid, 'post_purchase', 'feedback', 'Any additional feedback? (optional)', 'text', false, 5)
    ON CONFLICT (tenant_id, survey_type, question_key) DO NOTHING;

    -- NPS survey question
    INSERT INTO survey_questions (tenant_id, survey_type, question_key, question_text, question_type, is_required, display_order) VALUES
    (tenant_uuid, 'nps', 'nps_score', 'How likely are you to recommend EZ Cycle Ramp to a friend or colleague? (0-10)', 'rating', true, 1),
    (tenant_uuid, 'nps', 'nps_reason', 'What is the primary reason for your score?', 'text', false, 2)
    ON CONFLICT (tenant_id, survey_type, question_key) DO NOTHING;

  ELSE
    RAISE NOTICE 'Tenant ezcr-dev not found. Skipping survey questions seed.';
  END IF;
END $$;

-- Create view for survey analytics
CREATE OR REPLACE VIEW survey_analytics AS
SELECT
  sr.tenant_id,
  sr.survey_type,
  COUNT(*) as total_responses,
  AVG(sr.rating) as avg_rating,
  AVG(sr.nps_score) as avg_nps_score,
  COUNT(*) FILTER (WHERE sr.rating >= 4) as positive_responses,
  COUNT(*) FILTER (WHERE sr.rating <= 2) as negative_responses,
  COUNT(*) FILTER (WHERE sr.nps_score >= 9) as promoters,
  COUNT(*) FILTER (WHERE sr.nps_score <= 6) as detractors,
  DATE_TRUNC('day', sr.submitted_at) as response_date
FROM survey_responses sr
GROUP BY sr.tenant_id, sr.survey_type, DATE_TRUNC('day', sr.submitted_at);

-- Add comments
COMMENT ON TABLE survey_responses IS 'Customer satisfaction survey responses for chat and post-purchase surveys';
COMMENT ON TABLE survey_questions IS 'Configurable survey questions for different survey types';
COMMENT ON COLUMN survey_responses.survey_type IS 'Type of survey: chat, post_purchase, nps';
COMMENT ON COLUMN survey_responses.rating IS '1-5 star rating for satisfaction surveys';
COMMENT ON COLUMN survey_responses.nps_score IS '0-10 score for Net Promoter Score surveys';
COMMENT ON COLUMN survey_responses.response_data IS 'Additional structured responses stored as JSON';
