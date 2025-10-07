# Database Schema Reference

**Last Updated**: October 7, 2025  
**Database**: PostgreSQL (Supabase)  
**Extensions**: uuid-ossp, pgvector

---

## Multi-Tenant Architecture

All tables include `tenant_id UUID` with Row Level Security (RLS) policies.

### Tenant Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### EZCR Tenant
```sql
INSERT INTO tenants (id, name, domain, slug) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'EZ Cycle Ramp',
  'ezcycleramp.com',
  'ezcr'
);
```

---

## Core Tables

### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category_id UUID REFERENCES product_categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  inventory_count INTEGER DEFAULT 0,
  weight_lbs DECIMAL(8,2),
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  UNIQUE(tenant_id, sku)
);
```

### Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order number format: EZCR-2025-00001
CREATE FUNCTION generate_order_number(tenant_slug TEXT) RETURNS TEXT;
```

### Shopping Cart
```sql
CREATE TABLE shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  configuration JSONB,
  reserved_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Waitlist
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  prepayment_percentage INTEGER DEFAULT 0,
  prepayment_amount DECIMAL(10,2) DEFAULT 0,
  priority_score DECIMAL(8,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Priority: (prepayment_percentage/100 * 50) + (days_waiting * 0.1)
```

### Knowledge Base (RAG)
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  source_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_base_embedding 
  ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Semantic search function
CREATE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  tenant_filter uuid
) RETURNS TABLE (...);
```

---

## RLS Policies

### Standard Policy Pattern
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON table_name
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### User-Owned Data
```sql
CREATE POLICY users_own_data ON user_profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## TypeScript Types

```typescript
// Generate from Supabase
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type CartItem = Database['public']['Tables']['shopping_cart']['Row']
```

---

## Query Examples

```typescript
// Get products
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')

// Create order with RLS
const { data } = await supabase
  .from('orders')
  .insert({
    tenant_id: tenantId,
    order_number: generateOrderNumber(),
    ...orderData
  })

// Semantic search
const { data } = await supabase.rpc('search_knowledge_base', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5,
  tenant_filter: tenantId
})
```

---

**Reference the Master Knowledge Base for complete schema details.**