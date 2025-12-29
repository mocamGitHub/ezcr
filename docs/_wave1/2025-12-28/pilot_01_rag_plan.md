# Pilot 1: RAG Wave 1 Plan

**Date**: 2025-12-28
**Status**: Complete - System Already Exists

## Executive Summary

The EZCR project **already has a production-ready RAG system** implemented in migration `00010_knowledge_base_rag.sql`. This report documents the existing implementation and proposes Wave 1 enhancements.

---

## Existing pgvector Schema

### Tables (Already Implemented)

```sql
-- Knowledge Base with embeddings
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category VARCHAR(100) NOT NULL,  -- 'product', 'installation', 'shipping', 'warranty'
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI ada-002 embeddings
  metadata JSONB DEFAULT '{}',
  source VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  context JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  led_to_purchase BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER  -- 1-5 stars
);

-- Chat Messages with embeddings
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'
);

-- Chat Analytics
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}'
);
```

### Vector Search Function (Already Implemented)

```sql
CREATE FUNCTION search_knowledge_base(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 5,
  search_tenant_id UUID DEFAULT NULL,
  category_filter VARCHAR DEFAULT NULL
) RETURNS TABLE (id, category, title, content, similarity, metadata);
```

### Indexes (IVFFlat for ANN search)

```sql
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chat_messages_embedding ON chat_messages
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Hybrid Search Strategy (Wave 1 Enhancement)

### Current: Vector-Only Search
- Cosine similarity on OpenAI ada-002 embeddings
- Threshold: 0.7 for knowledge base

### Proposed: Hybrid Search

```sql
-- Add full-text search column
ALTER TABLE knowledge_base ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX idx_knowledge_base_fts ON knowledge_base USING gin(search_vector);

-- Hybrid search function (RRF - Reciprocal Rank Fusion)
CREATE FUNCTION hybrid_search_knowledge_base(
  query_text TEXT,
  query_embedding VECTOR(1536),
  search_tenant_id UUID,
  max_results INTEGER DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.6,
  fts_weight FLOAT DEFAULT 0.4
) RETURNS TABLE (...);
```

---

## Ingestion Sources & Chunking

### Current Sources
1. **Products** - Product descriptions, specs, compatibility
2. **Installation guides** - Step-by-step instructions
3. **Shipping info** - Delivery times, freight details
4. **Warranty/Returns** - Policies, RMA process
5. **FAQ** - Common questions

### Chunking Strategy

| Content Type | Chunk Size | Overlap | Notes |
|--------------|------------|---------|-------|
| Product specs | 500 tokens | 50 | Preserve spec blocks |
| Guides | 800 tokens | 100 | Section-aware splitting |
| FAQ | Full Q&A | 0 | One embedding per Q&A |
| Policies | 600 tokens | 75 | Paragraph-aware |

### Embeddings Pipeline

```typescript
// src/lib/rag/embeddings.ts
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}
```

---

## 4-Layer Access Control

### Layer 1: General (Public)
- **Access**: Anonymous users
- **Content**: Product info, shipping rates, general FAQ
- **RLS**: `is_active = true AND category IN ('product', 'general')`

### Layer 2: Logged-In Private
- **Access**: Authenticated users
- **Content**: Order history, saved configurations, personalized recommendations
- **RLS**: `auth.uid() IS NOT NULL`

### Layer 3: Tenant Admin
- **Access**: admin/owner roles
- **Content**: All tenant knowledge, CRM data, analytics
- **RLS**: `has_role(auth.uid(), 'admin') AND tenant_id = user_tenant_id`

### Layer 4: NexCyte Super Admin
- **Access**: NexCyte platform admins
- **Content**: Cross-tenant analytics, system health, all data
- **RLS**: `role = 'nexcyte_admin'` (via service key)

### Implementation (Already Partial)

```sql
-- Existing RLS on knowledge_base
CREATE POLICY "Public can view active knowledge base" ON knowledge_base
  FOR SELECT USING (is_active = true);
```

### Proposed Enhancement

```sql
-- Add access_level column
ALTER TABLE knowledge_base ADD COLUMN access_level VARCHAR(20)
  DEFAULT 'public' CHECK (access_level IN ('public', 'authenticated', 'admin', 'superadmin'));

-- Update RLS
CREATE POLICY "Tiered access control" ON knowledge_base
  FOR SELECT USING (
    CASE
      WHEN access_level = 'public' THEN is_active = true
      WHEN access_level = 'authenticated' THEN auth.uid() IS NOT NULL
      WHEN access_level = 'admin' THEN has_role(auth.uid(), 'admin')
      WHEN access_level = 'superadmin' THEN false  -- service key only
    END
  );
```

---

## API Route Design

### Existing Routes
- `POST /api/ai/chat` - Chat with RAG context
- `POST /api/ai/chat-rag` - Dedicated RAG endpoint
- `POST /api/embeddings/generate` - Generate embeddings

### Wave 1 Enhancements

```
POST /api/rag/search          # Hybrid search
POST /api/rag/ingest          # Bulk ingestion
GET  /api/rag/sources         # List knowledge sources
POST /api/rag/feedback        # Relevance feedback
GET  /api/rag/analytics       # Search analytics
```

---

## UI Wiring Notes

### Current Components
- Chat widget (product pages)
- AI assistant modal

### Wave 1 UI
- Add source citations to responses
- Show confidence scores
- "Was this helpful?" feedback
- Admin: Knowledge base management UI

---

## Evaluation Plan

### Metrics
1. **Retrieval Quality**
   - MRR (Mean Reciprocal Rank)
   - Recall@K (K=3,5,10)
   - Precision@K

2. **Response Quality**
   - User satisfaction (1-5 stars)
   - Response time (< 2s target)
   - Fallback rate (when no relevant docs found)

3. **Business Impact**
   - Chat-to-purchase conversion
   - Support ticket deflection

### Test Harness

```typescript
// tests/rag/evaluation.test.ts
describe('RAG Evaluation', () => {
  const testQueries = [
    { query: "ramp weight capacity", expected_category: "product" },
    { query: "how to install", expected_category: "installation" },
    { query: "return policy", expected_category: "warranty" },
  ];

  test.each(testQueries)('retrieves relevant docs for $query', async ({ query, expected_category }) => {
    const results = await searchKnowledgeBase(query);
    expect(results[0].category).toBe(expected_category);
    expect(results[0].similarity).toBeGreaterThan(0.7);
  });
});
```

---

## Punch List

### P0 - Critical (Implement Now)
- [x] pgvector enabled (Done)
- [x] Knowledge base schema (Done)
- [x] Vector search function (Done)
- [ ] Add hybrid search (FTS + vector)
- [ ] Add access_level column for tiered access

### P1 - Important (Wave 1)
- [ ] Ingestion pipeline for products
- [ ] Admin UI for knowledge management
- [ ] Source citations in chat responses
- [ ] Evaluation test harness

### P2 - Nice to Have (Wave 2)
- [ ] Re-ranking with cross-encoder
- [ ] Query rewriting
- [ ] Multi-modal embeddings (images)
- [ ] Conversation memory (long-term)

---

## Implementation Ready

The existing RAG infrastructure is **production-ready**. Wave 1 focus should be on:
1. Hybrid search for better recall
2. Tiered access control
3. Admin UI for knowledge management
4. Evaluation metrics
