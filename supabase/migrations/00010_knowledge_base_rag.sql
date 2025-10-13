-- ========================================
-- KNOWLEDGE BASE & RAG CHATBOT SYSTEM
-- ========================================
-- This migration creates the infrastructure for a site-wide RAG chatbot
-- that can answer any business-related questions using vector similarity search

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- KNOWLEDGE BASE TABLE
-- ========================================
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'product', 'installation', 'shipping', 'warranty', 'general', etc.
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}', -- Additional context (product_id, tags, source_url, etc.)
  source VARCHAR(255), -- Where this knowledge came from (manual, scraped, generated)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CHAT SESSIONS & MESSAGES
-- ========================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}', -- Current page, product viewed, cart status, etc.
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  led_to_completion BOOLEAN DEFAULT false,
  led_to_purchase BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER, -- 1-5 stars
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For similarity search of past conversations
  metadata JSONB DEFAULT '{}', -- function_call info, tokens used, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CHAT ANALYTICS
-- ========================================
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'question_asked', 'product_recommended', 'order_completed', etc.
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
-- Vector similarity search index (HNSW algorithm for fast approximate nearest neighbor)
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_chat_messages_embedding ON chat_messages
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Regular indexes
CREATE INDEX idx_knowledge_base_tenant_category ON knowledge_base(tenant_id, category, is_active);
CREATE INDEX idx_knowledge_base_active ON knowledge_base(is_active) WHERE is_active = true;

CREATE INDEX idx_chat_sessions_tenant ON chat_sessions(tenant_id, started_at DESC);
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_tenant ON chat_messages(tenant_id, created_at DESC);

CREATE INDEX idx_chat_analytics_tenant ON chat_analytics(tenant_id, event_type, created_at DESC);

-- ========================================
-- FUNCTIONS FOR VECTOR SEARCH
-- ========================================

-- Function to search knowledge base with vector similarity
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 5,
  search_tenant_id UUID DEFAULT NULL,
  category_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category VARCHAR,
  title VARCHAR,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity,
    kb.metadata
  FROM knowledge_base kb
  WHERE
    kb.is_active = true
    AND (search_tenant_id IS NULL OR kb.tenant_id = search_tenant_id)
    AND (category_filter IS NULL OR kb.category = category_filter)
    AND (1 - (kb.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to search similar past conversations
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.8,
  max_results INTEGER DEFAULT 3,
  search_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  message_content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.session_id,
    cm.content AS message_content,
    1 - (cm.embedding <=> query_embedding) AS similarity,
    cm.created_at
  FROM chat_messages cm
  WHERE
    cm.role = 'assistant'
    AND (search_tenant_id IS NULL OR cm.tenant_id = search_tenant_id)
    AND (1 - (cm.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

-- Public can read active knowledge base
CREATE POLICY "Public can view active knowledge base" ON knowledge_base
  FOR SELECT USING (is_active = true);

-- Users can view their own chat sessions
CREATE POLICY "Users can view their chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own messages
CREATE POLICY "Users can view their messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

-- ========================================
-- TRIGGERS
-- ========================================
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_last_message BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update session message count and last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET
    message_count = message_count + 1,
    last_message_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_session_message_count AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_session_on_message();

-- ========================================
-- SAMPLE KNOWLEDGE BASE SEED DATA
-- ========================================
-- Note: Actual embeddings will be generated via API
-- This is just placeholder structure
