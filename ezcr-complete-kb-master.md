# EZCR - Complete Knowledge Base & Project Documentation

**Version**: 2.0  
**Last Updated**: October 7, 2025  
**Project Status**: Multi-tenant e-commerce platform for motorcycle loading ramps  
**Repository**: github.com/mocamGitHub/ezcr

---

## 📚 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Brand Guidelines](#brand-guidelines)
3. [Infrastructure & Environment](#infrastructure--environment)
4. [Database Architecture](#database-architecture)
5. [12 Specialized Agents](#12-specialized-agents)
6. [Product Configurator](#product-configurator)
7. [Business Rules](#business-rules)
8. [Technical Stack](#technical-stack)
9. [Features Catalog](#features-catalog)
10. [N8N Workflows](#n8n-workflows)
11. [Development Setup](#development-setup)
12. [Deployment Strategy](#deployment-strategy)
13. [Security Protocols](#security-protocols)
14. [Knowledge Base References](#knowledge-base-references)

---

## PROJECT OVERVIEW

### What is EZCR?

EZCR (EZ Cycle Ramp) is a **modern, multi-tenant e-commerce platform** for selling motorcycle loading ramps and accessories. It's a complete rebuild of the existing ezcycleramp.com website (PHP-based, 3+ years old) using Next.js 15 and modern web technologies.

### Business Context

- **Company**: NEO-DYNE, USA
- **Primary Products**: AUN250 Folding Ramp, AUN210 Standard Ramp, AUN200, AUN150
- **Target Market**: Motorcycle owners, pickup truck users, professional installers
- **Special Features**: Veteran-owned business, A+ BBB rating
- **Age Demographics**: 45-65 (DIY enthusiasts), 65+ (older riders requiring accessibility)

### Project Goals

1. **Modernize** from PHP to Next.js 15
2. **Increase Conversion** by 25%+ through UX improvements
3. **Multi-Tenancy** - Support multiple brands/stores in one database
4. **Automation** - Reduce manual work by 60% using N8N
5. **AI Integration** - RAG chatbot, delivery scheduling, semantic search
6. **Accessibility** - WCAG 2.1 AA compliance for elderly users

### Timeline

**8-Week Development Cycle**:
- **Weeks 1-2**: Foundation (Database, UI components, Core setup)
- **Weeks 3-4**: E-commerce (Cart, Checkout, Configurator)
- **Weeks 5-6**: Advanced Features (AI chatbot, Waitlist, Automation)
- **Weeks 7**: Integration & Testing
- **Week 8**: Launch Preparation

---

## BRAND GUIDELINES

### EZCR Brand Colors

```css
/* Primary Palette */
--primary-black: #1a1a1a;        /* Headers, primary text */
--accent-orange: #ff6b35;        /* CTAs, highlights, brand accent */
--secondary-silver: #c0c0c0;     /* Secondary elements, borders */
--background-white: #ffffff;     /* Main background */
--background-light: #f5f5f5;     /* Alternate background */

/* Semantic Colors */
--success-green: #10b981;        /* Success states, in-stock */
--warning-amber: #f59e0b;        /* Warnings, low stock */
--error-red: #ef4444;            /* Errors, out of stock */
--info-blue: #3b82f6;            /* Info messages */

/* Text Colors */
--text-primary: #333333;         /* Main body text */
--text-secondary: #666666;       /* Secondary text */
--text-muted: #999999;           /* Muted/placeholder text */
```

### Typography

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes (Elderly-Friendly) */
--text-xs: 0.75rem;    /* 12px - small labels */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text (MINIMUM) */
--text-lg: 1.125rem;   /* 18px - emphasized text */
--text-xl: 1.25rem;    /* 20px - small headings */
--text-2xl: 1.5rem;    /* 24px - section headings */
--text-3xl: 1.875rem;  /* 30px - page titles */
--text-4xl: 2.25rem;   /* 36px - hero text */

/* Line Height */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625; /* Use for body text (accessibility) */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing & Layout

```css
/* Spacing Scale */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px - base unit */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */

/* Touch Targets (Mobile Accessibility) */
--min-touch-target: 44px; /* Minimum button/link size */

/* Border Radius */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Fully rounded */
```

### Trust Badges & Brand Elements

- **Veteran Owned Badge**: Prominent on header and footer
- **BBB A+ Rating**: Display with logo
- **NEO-DYNE Authorized Dealer**: Footer acknowledgment
- **Years in Business**: Counter animation on homepage
- **Customer Count**: Social proof indicator

---

## INFRASTRUCTURE & ENVIRONMENT

### Production Infrastructure

```yaml
Server: Hetzner VPS
IP Address: 5.161.84.153
SSH User: nexcyte
Operating System: Ubuntu 22.04 LTS

Services:
  - Coolify: https://coolify.nexcyte.com (Container orchestration)
  - Supabase: https://supabase.nexcyte.com (PostgreSQL database)
  - N8N: (Workflow automation) [Currently non-functional - needs setup]
```

### Domain Architecture

```
Development:
  - localhost:3000 (Local development)

Staging:
  - staging.ezcycleramp.com (Pre-production testing)

Production:
  - new.ezcycleramp.com (Initial deployment)
  - ezcycleramp.com (Final cutover from old PHP site)
```

### Environment Variables

```bash
# .env.local (DO NOT COMMIT)

# Database - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.nexcyte.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
DATABASE_URL=postgresql://user:pass@supabase.nexcyte.com:5432/postgres

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Payments - Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email - Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# SMS - Twilio (Optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# AI - OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_ORGANIZATION=org-...

# Automation - N8N
N8N_WEBHOOK_URL=https://n8n.ezcycleramp.com/webhook/
N8N_API_KEY=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_WAITLIST=true
NEXT_PUBLIC_ENABLE_AI_SCHEDULING=true

# Environment
NODE_ENV=development|staging|production
NEXT_PUBLIC_SITE_URL=https://ezcycleramp.com
```

### Current Infrastructure Status

✅ **Working Services**:
- Coolify (coolify.nexcyte.com)
- Supabase (supabase.nexcyte.com)

❌ **Broken/Non-Functional Services** (Remove from KB references):
- n8n.nexcyte.com
- api.nexcyte.com

⚠️ **Action Required**: Update all knowledge base documents to remove references to broken services.

---

## DATABASE ARCHITECTURE

### Multi-Tenant Design

All tables include `tenant_id` UUID with Row Level Security (RLS) policies to ensure complete data isolation between tenants.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;
```

### Core Tables

#### 1. Tenants Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EZCR tenant (first tenant)
INSERT INTO tenants (id, name, domain, slug, settings) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'EZ Cycle Ramp',
  'ezcycleramp.com',
  'ezcr',
  '{"brand_color": "#ff6b35", "veteran_owned": true, "bbb_rating": "A+"}'
);
```

#### 2. Product Categories

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation ON product_categories
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 3. Products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  inventory_count INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  weight_lbs DECIMAL(8,2),
  dimensions JSONB, -- {length, width, height}
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active', -- active, draft, archived, coming_soon
  coming_soon_date TIMESTAMP WITH TIME ZONE,
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  seo_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  UNIQUE(tenant_id, sku)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Indexes for performance
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
```

#### 4. Orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_number VARCHAR(50) NOT NULL UNIQUE, -- EZCR-2025-00001
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Shipping info
  shipping_method VARCHAR(100), -- T-Force Freight, UPS Ground
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  tracking_number VARCHAR(255),
  estimated_delivery DATE,
  
  -- Customer info
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_notes TEXT,
  
  -- Payment info (DO NOT store card details)
  payment_method VARCHAR(50), -- stripe, paypal
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(tenant_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this tenant/year
  SELECT COALESCE(MAX(
    SUBSTRING(order_number FROM '\d+$')::INTEGER
  ), 0) + 1 INTO sequence_num
  FROM orders
  WHERE order_number LIKE tenant_slug || '-' || year_str || '-%';
  
  -- Format: EZCR-2025-00001
  order_num := UPPER(tenant_slug) || '-' || year_str || '-' || 
               LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

#### 5. Order Items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_snapshot JSONB NOT NULL, -- Store product details at time of purchase
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

#### 6. Shopping Cart

```sql
CREATE TABLE shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL, -- For anonymous users
  user_id UUID REFERENCES auth.users(id), -- For logged-in users
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  configuration JSONB, -- For configured products (from configurator)
  reserved_until TIMESTAMP WITH TIME ZONE, -- 15-minute inventory reservation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, product_id),
  UNIQUE(user_id, product_id) WHERE user_id IS NOT NULL
);

-- Enable RLS
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON shopping_cart
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Cleanup abandoned carts (run daily)
CREATE OR REPLACE FUNCTION cleanup_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shopping_cart
  WHERE updated_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

#### 7. Abandoned Carts (For N8N Recovery)

```sql
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  cart_data JSONB NOT NULL, -- Snapshot of cart contents
  cart_total DECIMAL(10,2) NOT NULL,
  recovery_token VARCHAR(255) UNIQUE NOT NULL,
  recovery_link TEXT,
  
  -- Recovery tracking
  contacted_count INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  recovered BOOLEAN DEFAULT false,
  recovered_order_id UUID REFERENCES orders(id),
  recovered_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON abandoned_carts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);
CREATE INDEX idx_abandoned_carts_contacted ON abandoned_carts(contacted_count, last_contacted_at);
```

#### 8. Waitlist (Preorder System)

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Prepayment priority
  prepayment_percentage INTEGER DEFAULT 0 CHECK (prepayment_percentage IN (0, 10, 25, 50, 100)),
  prepayment_amount DECIMAL(10,2) DEFAULT 0,
  stripe_payment_intent_id VARCHAR(255),
  
  -- Priority calculation: (prepayment_percentage / 100 * 50) + (days_waiting * 0.1)
  priority_score DECIMAL(8,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'waiting', -- waiting, notified, purchased, cancelled
  notified_at TIMESTAMP WITH TIME ZONE,
  purchased_order_id UUID REFERENCES orders(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, product_id, email)
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON waitlist
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Function to update priority scores
CREATE OR REPLACE FUNCTION update_waitlist_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_score := 
    (NEW.prepayment_percentage::DECIMAL / 100 * 50) + 
    (EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 86400 * 0.1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_priority_trigger
  BEFORE INSERT OR UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_priority();
```

#### 9. Product Configurations

```sql
CREATE TABLE product_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  
  -- Configuration data (from 5-step configurator)
  vehicle_type VARCHAR(50), -- pickup, van, trailer
  vehicle_data JSONB, -- Make, model, year, measurements
  motorcycle_data JSONB, -- Type, weight, dimensions
  selected_ramp_id UUID REFERENCES products(id),
  selected_extensions JSONB, -- AC001-1/2/3, AC004, etc.
  selected_accessories JSONB,
  
  -- Quote info
  quote_total DECIMAL(10,2),
  quote_token VARCHAR(255) UNIQUE,
  quote_valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_order_id UUID REFERENCES orders(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON product_configurations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_configurations_quote_token ON product_configurations(quote_token);
CREATE INDEX idx_configurations_converted ON product_configurations(converted);
```

#### 10. Testimonials

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT NOT NULL,
  
  -- Media uploads
  images JSONB DEFAULT '[]'::jsonb, -- Max 5 images
  video_url TEXT, -- Max 1 video
  
  -- Reviewer info
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_location VARCHAR(255),
  verified_purchase BOOLEAN DEFAULT false,
  
  -- Moderation
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES auth.users(id),
  
  -- Display settings
  is_featured BOOLEAN DEFAULT false,
  display_on_homepage BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON testimonials
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_testimonials_product_id ON testimonials(product_id);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_testimonials_status ON testimonials(status) WHERE status = 'approved';
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured) WHERE is_featured = true;
```

#### 11. Knowledge Base (RAG System)

```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb, -- Source, category, tags, etc.
  source_type VARCHAR(50), -- manual, faq, blog, product_manual
  source_id UUID, -- Reference to product, blog post, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON knowledge_base
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Vector similarity search index
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for semantic search
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  tenant_filter uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE tenant_id = tenant_filter
    AND is_active = true
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

#### 12. Chat Conversations

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255) NOT NULL,
  
  -- Conversation data
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_to_human BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  message_count INTEGER DEFAULT 0,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5)
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON chat_conversations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_chat_session ON chat_conversations(session_id);
CREATE INDEX idx_chat_user ON chat_conversations(user_id) WHERE user_id IS NOT NULL;
```

#### 13. Users (Extends Supabase Auth)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Preferences
  email_marketing_opt_in BOOLEAN DEFAULT false,
  sms_marketing_opt_in BOOLEAN DEFAULT false,
  preferred_language VARCHAR(10) DEFAULT 'en',
  
  -- Addresses
  default_shipping_address JSONB,
  default_billing_address JSONB,
  
  -- Customer type
  customer_type VARCHAR(50) DEFAULT 'retail', -- retail, wholesale, dealer
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON user_profiles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY users_manage_own ON user_profiles
  FOR ALL USING (auth.uid() = id);
```

### Triggers & Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- (Apply to all other tables with updated_at column)
```

---

## 12 SPECIALIZED AGENTS

### Overview

The EZCR project uses a **12-agent architecture** where each agent has specific domain expertise and responsibilities. This prevents overlap, ensures accountability, and maintains clean separation of concerns.

### Agent 1: Database Agent

**Domain**: `/supabase/*`, `/src/lib/db/*`, `/src/types/database.ts`

**Responsibilities**:
- Schema design & migrations
- RLS policies
- Database functions & triggers
- Query optimization
- Multi-tenant data isolation
- TypeScript type generation

**Critical Rules**:
1. **ALWAYS** filter by `tenant_id`
2. **NEVER** share data across tenants
3. **ALWAYS** use RLS policies on all tables
4. **NEVER** store PCI data (credit cards)
5. **ALWAYS** use UUID for all IDs
6. **NEVER** expose service keys
7. **ALWAYS** use transactions for multi-step operations
8. **NEVER** bypass RLS even with service key
9. **ALWAYS** validate foreign keys
10. **NEVER** allow NULL in tenant_id

**Key Files**:
- `.claude/agents/01-database-agent.md`
- `supabase/migrations/*.sql`
- `src/types/database.ts`

---

### Agent 2: Frontend/UI Agent

**Domain**: `/src/components/*`, `/src/app/*`, `/styles/*`

**Responsibilities**:
- React component development
- ShadCN UI integration
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)
- Framer Motion animations
- Design system maintenance

**Design System**:
```typescript
const theme = {
  colors: {
    primary: '#1a1a1a',    // Black
    accent: '#ff6b35',     // Orange
    secondary: '#c0c0c0',  // Silver
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    baseFontSize: '16px',
    minTouchTarget: '44px',
  },
};
```

**Critical Components**:
1. Layout (Header, Footer, Navigation)
2. Product Display (Card, Grid, Detail)
3. Cart & Checkout
4. Forms & Validation
5. Modals & Drawers
6. Loading States
7. Error Boundaries

**Key Files**:
- `.claude/agents/02-ui-component-agent.md`
- `src/components/ui/*` (ShadCN)
- `src/components/layout/*`
- `src/components/products/*`

---

### Agent 3: E-Commerce Agent

**Domain**: `/src/app/api/*`, `/src/lib/commerce/*`, `/src/lib/stripe/*`

**Responsibilities**:
- Shopping cart (Zustand)
- Checkout flow
- Payment processing (Stripe)
- Order management
- Shipping calculations
- Bulk discounts
- Tax calculations

**Business Rules**:
- Free shipping >$500
- Bulk discounts: 5% @3+, 10% @5+, 15% @10+
- Order format: `EZCR-2025-00001`
- 15-minute cart reservation
- Tax rate: 8.9%
- Processing fee: 3%

**Shipping Methods**:
1. **T-Force Freight** (>100 lbs, palletized)
2. **UPS Ground** (<100 lbs, standard)

**Key Files**:
- `.claude/agents/03-ecommerce-agent.md`
- `src/lib/commerce/cart.ts`
- `src/lib/stripe/checkout.ts`
- `src/lib/shipping/calculator.ts`

---

### Agent 4: AI/Chatbot Agent

**Domain**: `/src/lib/ai/*`, `/src/app/api/chat/*`, `/data/embeddings/*`

**Responsibilities**:
- RAG chatbot implementation
- Semantic product search
- Guided conversation flows
- Knowledge base management
- AI-powered delivery scheduling
- Sentiment analysis

**Technology Stack**:
- OpenAI GPT-4 (chat completion)
- OpenAI Ada-002 (embeddings)
- Supabase pgvector (vector storage)
- LangChain (optional orchestration)

**Chatbot Features**:
1. **Guided Questions**
   - "What type of vehicle do you have?"
   - "What size motorcycle?"
   - "What's your budget?"

2. **Product Recommendations**
   - Based on vehicle dimensions
   - Based on motorcycle specs
   - Based on budget constraints

3. **Delivery Scheduling**
   - AI-powered slot suggestions
   - Consider: distance, weather, customer preferences
   - Installer availability checking

4. **Escalation to Human**
   - Complex questions
   - Pricing negotiations
   - Custom orders

**Key Files**:
- `.claude/agents/04-ai-rag-agent.md`
- `src/lib/ai/embeddings.ts`
- `src/lib/ai/chat.ts`
- `src/lib/ai/delivery-scheduling.ts`

---

### Agent 5: Automation Agent

**Domain**: `/n8n/*`, `/src/lib/automation/*`, `/email-templates/*`

**Responsibilities**:
- N8N workflow creation/management
- Email automation (Resend)
- SMS notifications (Twilio)
- Gmail integration
- Abandoned cart recovery
- Order processing automation
- Review request scheduling

**N8N Workflow Naming**:
```
Development:  dev_ezcr_workflow_name
Staging:      stg_ezcr_workflow_name
Production:   prod_ezcr_workflow_name
```

**Core Workflows**:

1. **Order Confirmation** (`dev_ezcr_order_confirmation`)
   ```
   Trigger: Webhook /api/webhooks/order-created
   → Format order data
   → Send email (Resend)
   → SMS notification (if opted in)
   → Update Supabase (order status)
   → Notify admin (Slack)
   ```

2. **Abandoned Cart Recovery**
   - **2 hours**: (`dev_ezcr_abandoned_cart_2hr`)
     ```
     Trigger: Cron (every 15 min)
     → Query carts abandoned >2hr, <2.5hr, not contacted
     → Generate recovery link with token
     → Send email with cart contents
     → Mark as contacted (count = 1)
     ```
   
   - **24 hours**: (`dev_ezcr_abandoned_cart_24hr`)
     ```
     Trigger: Cron (every hour)
     → Query carts 24hr old, contacted once
     → Send reminder with urgency message
     → Highlight popular items
     → Mark as contacted (count = 2)
     ```
   
   - **72 hours**: (`dev_ezcr_abandoned_cart_72hr`)
     ```
     Trigger: Cron (daily)
     → Query carts 72hr old, contacted twice
     → Generate 10% discount code
     → Send final recovery email
     → Mark as contacted (count = 3, sequence complete)
     ```

3. **Waitlist Stock Notification** (`dev_ezcr_waitlist_notification`)
   ```
   Trigger: Product inventory update
   → Check if product was out of stock
   → Get waitlist entries (ORDER BY priority_score DESC)
   → For each entry (max 50):
      → Send stock notification email
      → Include 24hr purchase window
      → Mark as notified
   → Update analytics
   ```

4. **Review Request** (`dev_ezcr_review_request`)
   ```
   Trigger: Order delivery confirmed + 14 days
   → Check if review already submitted
   → Send review request email
   → Include direct review link with token
   → Offer incentive (5% off next order)
   ```

5. **Gmail Router** (`dev_ezcr_gmail_router`)
   ```
   Trigger: New email to support@ezcycleramp.com
   → Categorize email (order, quote, support, return)
   → Route to appropriate handler
   → Auto-reply with template
   → Create ticket in Supabase
   → Notify appropriate team member
   ```

**Key Files**:
- `.claude/agents/05-automation-agent.md`
- `n8n/workflows/*.json`
- `email-templates/*.html`

---

### Agent 6: Testing Agent

**Domain**: `/tests/*`, `playwright.config.ts`, `vitest.config.ts`

**Responsibilities**:
- E2E testing (Playwright)
- Unit testing (Vitest)
- Integration testing
- Visual regression testing
- Performance testing
- Accessibility testing

**Critical Test Scenarios**:
1. Complete product configuration (5 steps)
2. Add to cart → Checkout → Payment
3. Bulk discount calculations
4. Shipping fee calculations
5. Abandoned cart recovery flow
6. Waitlist signup with prepayment
7. Chatbot conversations
8. Mobile responsiveness

**Test Coverage Goals**:
- Unit tests: >80%
- E2E critical paths: 100%
- API endpoints: 100%

**Key Files**:
- `.claude/agents/06-testing-agent.md`
- `tests/e2e/*.spec.ts`
- `tests/unit/*.test.ts`

---

### Agent 7: DevOps Agent

**Domain**: `/.github/*`, `/docker/*`, `/scripts/*`, `/.env.*`

**Responsibilities**:
- Docker configuration
- Coolify deployment
- CI/CD pipelines (GitHub Actions)
- Environment management
- Monitoring setup (Uptime Kuma)
- Backup automation
- SSL certificates

**Deployment Strategy**:
```
Development → Staging → Production
localhost → staging.ezcycleramp.com → ezcycleramp.com
```

**Key Tasks**:
1. Docker Compose for local dev
2. Coolify project configuration
3. GitHub Actions workflows
4. Automated backups (daily)
5. Performance monitoring
6. Security scanning

**Key Files**:
- `.claude/agents/07-devops-agent.md`
- `docker-compose.yml`
- `.github/workflows/*.yml`

---

### Agent 8: Documentation Agent

**Domain**: `/.claude/*`, `/docs/*`, `README.md`, `CHANGELOG.md`

**Responsibilities**:
- Maintain all .md files
- API documentation
- Component library docs
- Architecture Decision Records (ADRs)
- User guides
- Developer onboarding
- NotebookLM synchronization

**Documentation Structure**:
```
/.claude/
├── agents/              # All 12 agent specs
├── coordinator.md       # Daily task tracking
├── project.md           # Project overview
├── tasks.md             # Task lists by agent
└── context/             # Shared context files
    ├── database-schema.md
    ├── api-routes.md
    ├── business-rules.md
    └── component-library.md

/docs/
├── architecture/        # System design
├── api/                 # API reference
├── guides/              # User & admin guides
└── decisions/           # ADRs
```

**Key Files**:
- `.claude/agents/08-documentation-agent.md`
- `.claude/coordinator.md`
- `docs/**/*.md`

---

### Agent 9: Security Agent

**Domain**: `/src/middleware/*`, security configurations, authentication

**Responsibilities**:
- Security audits
- PCI compliance
- RLS policy review
- Rate limiting
- Input validation (Zod)
- CSRF protection
- Security headers

**Security Checklist**:
- [ ] All forms use Zod validation
- [ ] API routes have rate limiting
- [ ] Payment data never stored locally
- [ ] Proper CORS configuration
- [ ] Security headers (CSP, HSTS)
- [ ] No secrets in git
- [ ] RLS policies on all tables
- [ ] Stripe webhook signature verification

**Key Files**:
- `.claude/agents/09-security-agent.md`
- `src/middleware/security.ts`
- `src/lib/validation/*.ts`

---

### Agent 10: NotebookLM Agent

**Domain**: `/.notebooklm/*`, `/docs/notebooklm/*`

**Responsibilities**:
- Knowledge base management
- Audio summary generation
- Documentation synthesis
- Weekly reports
- Insight extraction

**NotebookLM Workflow**:
1. Consolidate all .md files
2. Upload to NotebookLM
3. Generate audio summaries
4. Extract key decisions
5. Create searchable index

**Key Files**:
- `.claude/agents/10-notebooklm-agent.md`
- `.notebooklm/ezcr-complete.md`
- `scripts/sync-to-notebooklm.sh`

---

### Agent 11: Customer Success Agent

**Domain**: `/docs/guides/*`, `/docs/support/*`, `/email-templates/support/*`

**Responsibilities**:
- User documentation
- Installation guides (with photos/video)
- Support materials
- Training content
- FAQ articles
- Troubleshooting guides

**Content Types**:
1. Installation guides (step-by-step with photos)
2. Video tutorial scripts
3. Product comparison guides
4. Maintenance guides
5. Warranty information
6. Email templates for support

**Accessibility Focus**:
- Simple language (avoid technical jargon)
- Large, clear photos
- Video demonstrations
- Multiple contact options
- Phone: 800-687-4410

**Key Files**:
- `.claude/agents/11-customer-success-agent.md`
- `docs/guides/*.md`
- `email-templates/support/*.html`

---

### Agent 12: Product Configurator Agent

**Domain**: `/src/components/configurator/*`, `/src/lib/configurator/*`

**Responsibilities**:
- 5-step configuration workflow
- Measurement validation
- Unit conversion (Imperial/Metric)
- Extension auto-selection
- Quote generation
- Product compatibility rules

**5-Step Configurator Flow**:

1. **Step 1: Vehicle Type & Contact**
   - Select vehicle type (Pickup, Van, Trailer)
   - Contact info (Name, Email, Phone)
   - SMS opt-in checkbox (checked by default)

2. **Step 2: Measurements**
   - Measurement validation:
     - Cargo Area: 53.15-98.43" (135-250cm)
     - Total Length: 68-98.43" (172.72-250cm)
     - Height: 0-60" (0-152.4cm)
   - Auto-select AC001 extensions based on height:
     - 35-42": AC001-1
     - 43-51": AC001-2
     - 52-60": AC001-3
   - Cargo >80": Notify about AC004 (AUN210) or 4-Beam (AUN250)
   - Unit toggle (Imperial/Metric)

3. **Step 3: Motorcycle**
   - Motorcycle type selection
   - Weight, wheelbase, length

4. **Step 4: Configuration**
   - Ramp model selection (AUN250, AUN210, AUN200, AUN150)
   - Auto-selected extensions display
   - Additional accessories
   - Services (Demo, Installation)

5. **Step 5: Quote**
   - Summary of configuration
   - Pricing breakdown
   - Contact sales or Add to Cart

**Business Logic**:
```typescript
// Extension selection
if (height >= 35 && height <= 42) {
  requiredExtension = 'AC001-1';
} else if (height >= 43 && height <= 51) {
  requiredExtension = 'AC001-2';
} else if (height >= 52 && height <= 60) {
  requiredExtension = 'AC001-3';
}

// Cargo extension
if (cargoArea > 80) {
  if (rampModel === 'AUN210') {
    requiredExtension = 'AC004';
  } else if (rampModel === 'AUN250') {
    requiredExtension = '4-Beam Extension';
  }
}

// Service compatibility
if (selectedServices.includes('demo') && selectedServices.includes('shipping')) {
  error = 'Demo service cannot be shipped. Please choose one.';
}
```

**Validation Rules**:
- All measurements must be within specified ranges
- Required fields marked with *
- Real-time validation with error messages
- "Special situation" phone number: 800-687-4410

**Key Files**:
- `.claude/agents/12-configurator-agent.md`
- `src/components/configurator/*.tsx`
- `src/lib/configurator/validation.ts`
- `src/lib/configurator/extensions.ts`

---

## PRODUCT CONFIGURATOR

### Complete HTML Reference

*[See separate document: `configurator-reference.html`]*

The existing HTML configurator serves as a **reference only**. It must be:
1. Converted to React components
2. Integrated with Zustand state management
3. Styled with ShadCN UI + Tailwind
4. Enhanced with proper TypeScript types
5. Integrated with database for saving configurations

### Key Features to Preserve

1. **5-Step Workflow**: Maintain the exact flow
2. **Business Rules**: All validation and extension selection logic
3. **Unit Conversion**: Imperial ↔ Metric toggle
4. **Visual Progress**: Step indicator with completion status
5. **Data Persistence**: Save configurations to database

### Implementation Priority

**Week 3-4**: Configurator implementation
- Highest complexity feature
- Critical for conversion
- Requires Database + UI + E-Commerce agent collaboration

---

## BUSINESS RULES

### Pricing & Discounts

```typescript
// Base prices (as of Oct 2025)
const PRODUCT_PRICES = {
  AUN250: 1299.00,
  AUN210: 999.00,
  AUN200: 799.00,
  AUN150: 899.00, // Coming soon Mar 1, 2025
  'AC001-1': 149.00,
  'AC001-2': 179.00,
  'AC001-3': 209.00,
  'AC004': 199.00,
  '4-Beam': 249.00,
  'Tie-Downs': 39.99,
  'Wheel-Chock': 49.99,
};

// Bulk discounts (apply to order total)
function calculateBulkDiscount(quantity: number, subtotal: number): number {
  if (quantity >= 10) return subtotal * 0.15;
  if (quantity >= 5) return subtotal * 0.10;
  if (quantity >= 3) return subtotal * 0.05;
  return 0;
}

// Tax & fees
const TAX_RATE = 0.089;  // 8.9%
const PROCESSING_FEE_RATE = 0.03; // 3%

function calculateOrderTotal(subtotal: number, shippingCost: number): {
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  tax: number;
  processing: number;
  shipping: number;
  total: number;
} {
  const discount = calculateBulkDiscount(cartQuantity, subtotal);
  const subtotalAfterDiscount = subtotal - discount;
  const tax = subtotalAfterDiscount * TAX_RATE;
  const processing = subtotalAfterDiscount * PROCESSING_FEE_RATE;
  const total = subtotalAfterDiscount + tax + processing + shippingCost;
  
  return { subtotal, discount, subtotalAfterDiscount, tax, processing, shipping: shippingCost, total };
}
```

### Shipping Rules

```typescript
// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 500.00;

// Shipping method selection
function selectShippingMethod(weight: number, dimensions: Dimensions): ShippingMethod {
  if (weight > 100) {
    return 'T-Force Freight'; // Palletized freight
  } else {
    return 'UPS Ground';
  }
}

// Shipping cost calculation (simplified)
async function calculateShipping(
  weight: number,
  dimensions: Dimensions,
  destination: Address
): Promise<number> {
  const method = selectShippingMethod(weight, dimensions);
  
  if (method === 'T-Force Freight') {
    // Call T-Force API for quote
    return await getTForceQuote(weight, dimensions, destination);
  } else {
    // Call UPS API for quote
    return await getUPSQuote(weight, dimensions, destination);
  }
}
```

### Inventory Rules

```typescript
// Inventory management
const LOW_STOCK_THRESHOLD = 5;
const OUT_OF_STOCK = 0;
const CART_RESERVATION_MINUTES = 15;

// Check product availability
function checkAvailability(productId: string, requestedQuantity: number): {
  available: boolean;
  availableQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'coming_soon';
} {
  const product = getProduct(productId);
  
  if (product.status === 'coming_soon') {
    return {
      available: false,
      availableQuantity: 0,
      status: 'coming_soon',
    };
  }
  
  const reservedQuantity = getReservedQuantity(productId);
  const availableQuantity = product.inventory_count - reservedQuantity;
  
  if (availableQuantity <= 0) {
    return {
      available: false,
      availableQuantity: 0,
      status: 'out_of_stock',
    };
  }
  
  if (availableQuantity <= LOW_STOCK_THRESHOLD) {
    return {
      available: requestedQuantity <= availableQuantity,
      availableQuantity,
      status: 'low_stock',
    };
  }
  
  return {
    available: requestedQuantity <= availableQuantity,
    availableQuantity,
    status: 'in_stock',
  };
}

// Reserve inventory when added to cart
async function reserveInventory(cartId: string, productId: string, quantity: number): Promise<void> {
  const expiresAt = new Date(Date.now() + CART_RESERVATION_MINUTES * 60 * 1000);
  
  await supabase
    .from('shopping_cart')
    .update({ reserved_until: expiresAt })
    .eq('id', cartId);
}
```

### Order Processing Rules

```typescript
// Order number format
function generateOrderNumber(tenantSlug: string): string {
  const year = new Date().getFullYear();
  const sequence = getNextSequence(tenantSlug, year);
  return `${tenantSlug.toUpperCase()}-${year}-${String(sequence).padStart(5, '0')}`;
  // Example: EZCR-2025-00001
}

// Order statuses
type OrderStatus = 
  | 'pending'      // Payment processing
  | 'processing'   // Preparing shipment
  | 'shipped'      // In transit
  | 'delivered'    // Confirmed delivery
  | 'cancelled';   // Cancelled by customer or admin

// Order lifecycle
const ORDER_LIFECYCLE = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

// Cancellation window
const CANCELLATION_WINDOW_MINUTES = 30;

function canCancelOrder(order: Order): boolean {
  if (order.status !== 'pending') return false;
  
  const createdAt = new Date(order.created_at);
  const now = new Date();
  const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / 60000;
  
  return minutesSinceCreated <= CANCELLATION_WINDOW_MINUTES;
}
```

### Waitlist Rules

```typescript
// Prepayment tiers
const PREPAYMENT_TIERS = [0, 10, 25, 50, 100]; // Percentages

// Priority score calculation
function calculatePriorityScore(
  prepaymentPercentage: number,
  daysWaiting: number
): number {
  const prepaymentScore = (prepaymentPercentage / 100) * 50;
  const waitingScore = daysWaiting * 0.1;
  return prepaymentScore + waitingScore;
}

// Example:
// User A: 50% prepaid, 10 days waiting = (0.5 * 50) + (10 * 0.1) = 25 + 1 = 26
// User B: 10% prepaid, 30 days waiting = (0.1 * 50) + (30 * 0.1) = 5 + 3 = 8
// User A has priority

// Notification when stock available
async function notifyWaitlist(productId: string): Promise<void> {
  const waitlistEntries = await supabase
    .from('waitlist')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'waiting')
    .order('priority_score', { ascending: false })
    .limit(50); // Notify max 50 at once
  
  for (const entry of waitlistEntries.data) {
    await sendStockNotification(entry.email, {
      product_id: productId,
      purchase_window_hours: 24,
    });
    
    await supabase
      .from('waitlist')
      .update({ status: 'notified', notified_at: new Date() })
      .eq('id', entry.id);
  }
}
```

---

## TECHNICAL STACK

### Frontend

```json
{
  "framework": "Next.js 15",
  "react": "18.3.0",
  "typescript": "5.3.0",
  "styling": "Tailwind CSS 3.4",
  "ui": "ShadCN UI",
  "animations": "Framer Motion",
  "state": "Zustand",
  "forms": "React Hook Form + Zod",
  "icons": "Lucide React"
}
```

### Backend

```json
{
  "database": "PostgreSQL (Supabase)",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "api": "Next.js API Routes",
  "orm": "Prisma (optional)",
  "payments": "Stripe",
  "email": "Resend",
  "sms": "Twilio (optional)"
}
```

### AI & Automation

```json
{
  "llm": "OpenAI GPT-4",
  "embeddings": "OpenAI Ada-002",
  "vector_db": "pgvector (Supabase extension)",
  "automation": "N8N",
  "orchestration": "LangChain (optional)"
}
```

### Testing & Quality

```json
{
  "e2e": "Playwright",
  "unit": "Vitest",
  "integration": "Vitest",
  "linting": "ESLint",
  "formatting": "Prettier",
  "types": "TypeScript Strict Mode"
}
```

### DevOps

```json
{
  "hosting": "Hetzner VPS",
  "orchestration": "Coolify",
  "ci_cd": "GitHub Actions",
  "monitoring": "Uptime Kuma",
  "cdn": "Cloudflare (optional)",
  "analytics": "Google Analytics 4"
}
```

---

## FEATURES CATALOG

### Core E-Commerce Features

1. **Product Catalog**
   - Multi-category product browsing
   - Product detail pages
   - Image galleries
   - Specifications display
   - Related products
   - Recently viewed

2. **Shopping Experience**
   - Smart search with autocomplete
   - Filter & sort
   - Quick add to cart
   - Wishlist
   - Product comparisons

3. **Cart & Checkout**
   - Persistent cart (localStorage + database)
   - Cart drawer
   - Bulk discounts
   - Shipping calculator
   - Tax calculator
   - Stripe Checkout
   - Order confirmation

4. **Order Management**
   - Order history
   - Order tracking
   - Order status updates
   - Email notifications
   - SMS notifications (optional)

### Interactive Tools

1. **Vehicle Compatibility Checker**
   - Smart form with validation
   - Vehicle database lookup
   - Compatibility matrix
   - Recommendation engine

2. **ROI/Savings Calculator**
   - Time saved calculation
   - Cost comparison (rental vs purchase)
   - Break-even analysis
   - Printable report

3. **Interactive Price Calculator**
   - Real-time pricing
   - Add-ons and warranties
   - Bulk discount preview
   - Quote generation

4. **Financing Calculator**
   - Monthly payment calculation
   - Interest rate comparison
   - Pre-qualification form

5. **Installation Wizard**
   - 5-step guided installation
   - Photo/video at each step
   - Tools checklist
   - Safety reminders

### Conversion Optimization

1. **Exit-Intent Popup**
   - Triggered on exit attempt
   - Lead magnet (installation guide PDF)
   - Email capture
   - Discount offer

2. **Live Chat Widget**
   - AI-powered responses
   - Knowledge base integration
   - Auto-responses for common questions
   - Escalation to human support

3. **Enhanced Testimonials**
   - Star ratings
   - Customer photos
   - Video testimonials
   - Verified purchase badges

4. **Newsletter Signup**
   - Homepage popup (delayed)
   - Footer form
   - Exit-intent offer
   - Incentive (5% off first order)

5. **FAQ System**
   - Expandable sections
   - Search functionality
   - Categorized questions
   - AI-powered suggestions

### AI-Powered Features

1. **RAG Chatbot**
   - Natural language Q&A
   - Product recommendations
   - Order status inquiries
   - Installation help
   - Escalation to human

2. **Semantic Product Search**
   - Natural language queries
   - Intent understanding
   - Vector similarity search
   - Results ranking

3. **AI Delivery Scheduling**
   - Optimal slot suggestions
   - Weather consideration
   - Route optimization
   - Customer preference learning

4. **Sentiment Analysis**
   - Chat conversation analysis
   - Review sentiment scoring
   - Customer satisfaction tracking

### Multi-Tenant Features

1. **Tenant Management**
   - Tenant creation
   - Domain mapping
   - Settings customization
   - Branding per tenant

2. **Data Isolation**
   - RLS policies
   - Tenant-scoped queries
   - Cross-tenant prevention

3. **Billing & Subscriptions**
   - Per-tenant billing
   - Usage tracking
   - Feature flagging

### Waitlist & Preorder

1. **Waitlist Signup**
   - Email + phone capture
   - Product selection
   - Prepayment option (0%, 10%, 25%, 50%, 100%)
   - Priority scoring

2. **Stock Notifications**
   - Email alerts
   - SMS alerts (optional)
   - 24-hour purchase window
   - Prepayment refund handling

3. **Coming Soon Products**
   - Display expected date
   - Notify me button
   - Social sharing
   - Countdown timer

---

## N8N WORKFLOWS

### Workflow Architecture

All workflows follow this naming convention:
```
{environment}_{tenant}_{workflow_name}

Examples:
- dev_ezcr_order_confirmation
- stg_ezcr_abandoned_cart_2hr
- prod_ezcr_waitlist_notification
```

### Workflow Catalog

#### 1. Order Processing Workflows

**Order Confirmation** (`dev_ezcr_order_confirmation`)
```yaml
Trigger: HTTP Webhook
Method: POST
URL: /webhook/order-created
Body: { order_id, customer_email, order_data }

Steps:
  1. Receive order webhook
  2. Fetch full order details from Supabase
  3. Format email HTML
  4. Send email via Resend
  5. If SMS opt-in: Send SMS via Twilio
  6. Update order.email_sent_at in Supabase
  7. Post to Slack #orders channel
  8. Log to N8N database

Error Handling:
  - Retry 3 times with exponential backoff
  - If fails: Log error, notify admin
```

**Order Shipped** (`dev_ezcr_order_shipped`)
```yaml
Trigger: HTTP Webhook
URL: /webhook/order-shipped
Body: { order_id, tracking_number, carrier }

Steps:
  1. Get order details
  2. Calculate estimated delivery date
  3. Format shipping email with tracking link
  4. Send email
  5. SMS notification (if opted in)
  6. Update order.shipped_at
  7. Schedule delivery reminder (day before)
```

**Order Delivered** (`dev_ezcr_order_delivered`)
```yaml
Trigger: HTTP Webhook (from tracking API)
URL: /webhook/order-delivered
Body: { order_id, delivered_at, signature }

Steps:
  1. Update order.delivered_at
  2. Send delivery confirmation email
  3. Schedule review request (14 days later)
  4. Update customer lifetime value
  5. Log delivery metrics
```

#### 2. Abandoned Cart Workflows

**2-Hour Follow-Up** (`dev_ezcr_abandoned_cart_2hr`)
```yaml
Trigger: Cron Schedule
Schedule: */15 * * * * (Every 15 minutes)

Query:
  SELECT * FROM shopping_cart
  WHERE updated_at > NOW() - INTERVAL '2 hours 30 minutes'
    AND updated_at < NOW() - INTERVAL '2 hours'
    AND session_id NOT IN (
      SELECT session_id FROM abandoned_carts WHERE contacted_count >= 1
    )

Steps:
  1. For each abandoned cart:
     a. Generate recovery token
     b. Create abandoned_carts record
     c. Build cart recovery email
     d. Send email via Resend
     e. Update contacted_count = 1
  2. Log metrics
```

**24-Hour Follow-Up** (`dev_ezcr_abandoned_cart_24hr`)
```yaml
Trigger: Cron Schedule
Schedule: 0 * * * * (Every hour)

Query:
  SELECT * FROM abandoned_carts
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND contacted_count = 1
    AND recovered = false

Steps:
  1. For each cart:
     a. Build urgency email (popular items selling out)
     b. Highlight items in cart
     c. Add social proof
     d. Send email
     e. Update contacted_count = 2
```

**72-Hour Final Offer** (`dev_ezcr_abandoned_cart_72hr`)
```yaml
Trigger: Cron Schedule
Schedule: 0 8 * * * (Daily at 8 AM)

Query:
  SELECT * FROM abandoned_carts
  WHERE created_at < NOW() - INTERVAL '72 hours'
    AND contacted_count = 2
    AND recovered = false

Steps:
  1. For each cart:
     a. Generate 10% discount code
     b. Build final offer email
     c. Set 24-hour expiration
     d. Send email
     e. Update contacted_count = 3
     f. Mark sequence complete
```

#### 3. Waitlist Workflows

**Stock Notification** (`dev_ezcr_waitlist_notification`)
```yaml
Trigger: HTTP Webhook
URL: /webhook/product-stock-update
Body: { product_id, new_inventory_count }

Steps:
  1. Check if product was previously out of stock
  2. If yes:
     a. Query waitlist (ORDER BY priority_score DESC LIMIT 50)
     b. For each entry:
        - Send stock notification email
        - Include 24hr purchase window
        - Add direct purchase link
        - Update status = 'notified'
        - Update notified_at = NOW()
     c. Update product marketing metrics
```

**Waitlist Reminder** (`dev_ezcr_waitlist_reminder`)
```yaml
Trigger: Cron Schedule
Schedule: 0 9 * * * (Daily at 9 AM)

Query:
  SELECT * FROM waitlist
  WHERE status = 'notified'
    AND notified_at < NOW() - INTERVAL '12 hours'
    AND purchased_order_id IS NULL

Steps:
  1. For each entry:
     a. Send reminder email (12 hours left)
     b. Include stock count
     c. Emphasize priority status
```

#### 4. Review Collection Workflows

**Review Request** (`dev_ezcr_review_request`)
```yaml
Trigger: Cron Schedule
Schedule: 0 10 * * * (Daily at 10 AM)

Query:
  SELECT * FROM orders
  WHERE delivered_at < NOW() - INTERVAL '14 days'
    AND delivered_at > NOW() - INTERVAL '15 days'
    AND id NOT IN (SELECT order_id FROM testimonials)

Steps:
  1. For each order:
     a. Generate review token
     b. Build review request email
     c. Include product images
     d. Offer 5% discount incentive
     e. Send email
  2. Log review request metrics
```

**Review Thank You** (`dev_ezcr_review_thank_you`)
```yaml
Trigger: HTTP Webhook
URL: /webhook/review-submitted
Body: { testimonial_id, user_id, rating }

Steps:
  1. Get testimonial details
  2. If rating >= 4:
     a. Send thank you email
     b. Include discount code
     c. Request social media share
  3. If rating <= 2:
     a. Send apology email
     b. Offer support contact
     c. Notify customer success team
  4. Update customer profile
```

#### 5. Gmail Integration Workflows

**Email Router** (`dev_ezcr_gmail_router`)
```yaml
Trigger: Gmail Watch (real-time)
Email: support@ezcycleramp.com

Steps:
  1. Parse incoming email
  2. Extract: from, subject, body, attachments
  3. Categorize using keywords:
     - "order" → Order support
     - "quote" → Sales team
     - "return" → Returns department
     - "technical" → Technical support
     - Other → General support
  4. Create support ticket in Supabase
  5. Send auto-reply with ticket number
  6. Route to appropriate team member
  7. Post to Slack channel
```

**Auto-Response** (`dev_ezcr_gmail_auto_response`)
```yaml
Trigger: Gmail Watch
Filters: First-time sender

Steps:
  1. Check if sender has previous tickets
  2. If first-time:
     a. Send welcome auto-response
     b. Include:
        - Business hours
        - Expected response time
        - Link to FAQ
        - Phone: 800-687-4410
  3. Log interaction
```

#### 6. Analytics & Reporting Workflows

**Daily Sales Report** (`dev_ezcr_daily_sales_report`)
```yaml
Trigger: Cron Schedule
Schedule: 0 7 * * * (Daily at 7 AM)

Query:
  - Yesterday's orders
  - Yesterday's revenue
  - Top products
  - Conversion rate
  - Cart abandonment rate

Steps:
  1. Generate report
  2. Create charts/graphs
  3. Format email
  4. Send to stakeholders
```

**Weekly Performance** (`dev_ezcr_weekly_performance`)
```yaml
Trigger: Cron Schedule
Schedule: 0 9 * * 1 (Mondays at 9 AM)

Metrics:
  - Week over week growth
  - Customer acquisition
  - Average order value
  - Product performance
  - Chatbot usage
  - Support tickets

Steps:
  1. Aggregate metrics
  2. Generate visualizations
  3. Create PDF report
  4. Email to management
```

---

## DEVELOPMENT SETUP

### Prerequisites

```bash
# Required Software
- Node.js 20.x LTS
- pnpm 8.x
- Git
- VS Code (recommended)
- Docker Desktop (optional)

# Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Prisma (if using Prisma)
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/mocamGitHub/ezcr.git
cd ezcr

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials:
# - Supabase URL & keys
# - Stripe keys
# - OpenAI API key
# - etc.

# 4. Run database migrations
pnpm supabase db push

# 5. Seed database (optional)
pnpm seed

# 6. Start development server
pnpm dev

# Open http://localhost:3000
```

### Project Structure

```
ezcr/
├── .claude/                    # Agent documentation
│   ├── agents/                 # 12 agent specs
│   ├── context/                # Shared context
│   ├── coordinator.md
│   ├── project.md
│   └── tasks.md
├── .github/
│   └── workflows/              # CI/CD pipelines
├── .notebooklm/                # NotebookLM sync
├── docs/                       # Documentation
│   ├── architecture/
│   ├── api/
│   ├── guides/
│   └── decisions/              # ADRs
├── email-templates/            # Email HTML
│   ├── orders/
│   ├── cart/
│   └── support/
├── n8n/
│   └── workflows/              # N8N JSON exports
├── public/                     # Static assets
│   ├── images/
│   ├── videos/
│   └── pdfs/
├── scripts/                    # Utility scripts
│   ├── seed.ts
│   ├── backup.sh
│   └── deploy.sh
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── (auth)/             # Auth pages
│   │   ├── (shop)/             # Shop pages
│   │   ├── configure/          # Configurator
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # ShadCN components
│   │   ├── layout/             # Header, Footer, Nav
│   │   ├── products/           # Product components
│   │   ├── cart/               # Cart components
│   │   ├── configurator/       # Configurator steps
│   │   └── chat/               # Chatbot components
│   ├── lib/
│   │   ├── ai/                 # AI utilities
│   │   ├── automation/         # N8N helpers
│   │   ├── commerce/           # Cart, checkout
│   │   ├── configurator/       # Config logic
│   │   ├── db/                 # Database utilities
│   │   ├── stripe/             # Stripe integration
│   │   ├── supabase/           # Supabase client
│   │   └── utils.ts
│   ├── middleware/             # Next.js middleware
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge functions
│   └── config.toml
├── tests/
│   ├── e2e/                    # Playwright tests
│   └── unit/                   # Vitest tests
├── .env.example
├── .env.local                  # DO NOT COMMIT
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── next.config.js
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── prettier.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### Development Commands

```bash
# Development
pnpm dev           # Start dev server
pnpm dev:https     # Start with HTTPS (for Stripe webhooks)
pnpm turbo         # Start with Turbopack

# Building
pnpm build         # Production build
pnpm start         # Start production server

# Database
pnpm db:push       # Push schema changes
pnpm db:pull       # Pull schema from remote
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database
pnpm db:studio     # Open Prisma Studio
pnpm generate      # Generate types from Supabase

# Testing
pnpm test          # Run all tests
pnpm test:unit     # Unit tests only
pnpm test:e2e      # E2E tests only
pnpm test:watch    # Watch mode

# Code Quality
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix lint errors
pnpm format        # Format with Prettier
pnpm type-check    # TypeScript checking

# Deployment
pnpm deploy:staging   # Deploy to staging
pnpm deploy:prod      # Deploy to production

# Utilities
pnpm clean         # Clean build artifacts
pnpm reset         # Reset node_modules & lock
```

---

## DEPLOYMENT STRATEGY

### Environments

```yaml
Development:
  URL: http://localhost:3000
  Database: Supabase cloud (dev instance)
  Stripe: Test mode
  N8N: Local instance or dev prefix

Staging:
  URL: https://staging.ezcycleramp.com
  Database: Supabase on VPS (staging schema)
  Stripe: Test mode
  N8N: Staging prefix workflows

Production:
  URL: https://ezcycleramp.com
  Database: Supabase on VPS (production schema)
  Stripe: Live mode
  N8N: Production workflows
```

### Deployment Process

#### To Staging

```bash
# 1. Ensure all tests pass
pnpm test

# 2. Build production version
pnpm build

# 3. Commit changes
git add .
git commit -m "feat: your feature description"
git push origin main

# 4. Coolify auto-deploys to staging
# Or manual deploy via Coolify UI

# 5. Run smoke tests on staging
pnpm test:e2e --baseURL=https://staging.ezcycleramp.com

# 6. Verify:
# - Homepage loads
# - Product pages work
# - Cart/checkout flow
# - Configurator functional
# - Database queries working
```

#### To Production

```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Update version in package.json
npm version minor

# 3. Create production build
pnpm build

# 4. Run full test suite
pnpm test

# 5. Merge to production branch
git checkout production
git merge release/v1.0.0

# 6. Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin production --tags

# 7. Deploy via Coolify
# - Coolify watches 'production' branch
# - Auto-deploys on push

# 8. Post-deployment checks:
# - Health check: https://ezcycleramp.com/api/health
# - Error monitoring: Check Sentry
# - Performance: Check Lighthouse
# - Database: Verify RLS policies active

# 9. Update old site DNS (when ready)
# Point ezcycleramp.com → new.ezcycleramp.com IP
```

### Rollback Procedure

```bash
# If issues detected after deployment:

# 1. Identify last stable commit
git log --oneline

# 2. Revert to previous version
git revert HEAD
git push origin production

# 3. Coolify auto-deploys the revert

# 4. Notify users (if necessary)
# 5. Investigate issue in staging
# 6. Fix and redeploy
```

---

## SECURITY PROTOCOLS

### Critical Security Rules

1. **NEVER** commit secrets to git
2. **ALWAYS** use environment variables
3. **NEVER** expose service keys to frontend
4. **ALWAYS** validate user input (Zod schemas)
5. **NEVER** bypass RLS policies
6. **ALWAYS** use HTTPS in production
7. **NEVER** store payment card data
8. **ALWAYS** verify Stripe webhook signatures
9. **NEVER** trust client-side validation alone
10. **ALWAYS** implement rate limiting on API routes

### RLS Policy Template

```sql
-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON table_name
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- User owns their data
CREATE POLICY users_own_data ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY admins_full_access ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
```

### API Route Security

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

// Rate limiter (10 requests per minute)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Input schema
const schema = z.object({
  email: z.string().email(),
  // ... other fields
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    await limiter.check(req, 10, 'API_ROUTE');
    
    // 2. Authentication (if required)
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 3. Input validation
    const body = await req.json();
    const validated = schema.parse(body);
    
    // 4. Authorization (tenant check)
    if (validated.tenant_id !== session.user.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // 5. Business logic
    const result = await doSomething(validated);
    
    // 6. Response
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

---

## KNOWLEDGE BASE REFERENCES

### Past Conversation Links

All context has been gathered from these conversations:

1. [d1c5ec89](https://claude.ai/chat/d1c5ec89-0f2a-4114-ab38-ddf771168264) - Agent files & coordination
2. [81c551a2](https://claude.ai/chat/81c551a2-1d61-455a-9f7b-e9a233442b53) - Master PRD & specifications
3. [fce42791](https://claude.ai/chat/fce42791-c286-443a-9dc9-5c564e1251a5) - Multi-tenant implementation
4. [0e8351f5](https://claude.ai/chat/0e8351f5-202e-4fd9-bf3e-e250529f1051) - Context loss & verification protocols
5. [89cdb9f3](https://claude.ai/chat/89cdb9f3-36c9-4132-b1be-a9c9cdd43f30) - Project tracker system
6. [c0e3f858](https://claude.ai/chat/c0e3f858-8cb1-4235-92d4-c5ca745e9112) - Additional context
7. [887c7cc3](https://claude.ai/chat/887c7cc3-d3b4-40c3-9c66-1955057f51ba) - Configurator implementation
8. [0313f1ff](https://claude.ai/chat/0313f1ff-a7b1-4dc3-93f5-7c6521fe3e9d) - PRD development

### Additional Documents Needed

Create these files in your project:

1. **Agent Specification Files** (`.claude/agents/`):
   - 01-database-agent.md through 12-configurator-agent.md
   - (Full content provided in separate artifact)

2. **Coordination Files** (`.claude/`):
   - coordinator.md
   - project.md
   - tasks.md
   - (Templates provided in separate artifact)

3. **Context Files** (`.claude/context/`):
   - database-schema.md
   - api-routes.md
   - business-rules.md
   - component-library.md

4. **Configurator Reference**:
   - configurator-reference.html
   - (Complete HTML from conversation 887c7cc3)

---

## APPENDIX: QUICK REFERENCE

### Common Tasks

```bash
# Add a new product
INSERT INTO products (tenant_id, name, slug, sku, price, ...)
VALUES ('00000000-0000-0000-0000-000000000001', ...);

# Check order status
SELECT order_number, status, total FROM orders WHERE id = 'uuid';

# View abandoned carts
SELECT * FROM abandoned_carts WHERE contacted_count < 3 AND recovered = false;

# Priority waitlist
SELECT * FROM waitlist WHERE product_id = 'uuid' ORDER BY priority_score DESC;

# Semantic search
SELECT * FROM search_knowledge_base(embedding, 0.7, 5, tenant_id);
```

### Useful SQL Queries

```sql
-- Daily revenue
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders
WHERE tenant_id = '...'
  AND status NOT IN ('cancelled')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top products
SELECT 
  p.name,
  COUNT(oi.id) as times_ordered,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total) as total_revenue
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE p.tenant_id = '...'
  AND o.status NOT IN ('cancelled')
GROUP BY p.id, p.name
ORDER BY total_revenue DESC
LIMIT 10;

-- Conversion funnel
WITH funnel AS (
  SELECT
    (SELECT COUNT(DISTINCT session_id) FROM shopping_cart WHERE tenant_id = '...') as added_to_cart,
    (SELECT COUNT(DISTINCT session_id) FROM abandoned_carts WHERE tenant_id = '...') as abandoned,
    (SELECT COUNT(*) FROM orders WHERE tenant_id = '...' AND status NOT IN ('cancelled')) as completed
)
SELECT 
  *,
  ROUND((completed::DECIMAL / added_to_cart * 100), 2) as conversion_rate,
  ROUND((abandoned::DECIMAL / added_to_cart * 100), 2) as abandonment_rate
FROM funnel;
```

### Environment Variables Checklist

```bash
# Database
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_KEY
✓ DATABASE_URL

# Auth
✓ NEXTAUTH_URL
✓ NEXTAUTH_SECRET

# Payments
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✓ STRIPE_SECRET_KEY
✓ STRIPE_WEBHOOK_SECRET

# Email
✓ RESEND_API_KEY
✓ RESEND_FROM_EMAIL

# AI
✓ OPENAI_API_KEY
✓ OPENAI_ORGANIZATION

# Automation
✓ N8N_WEBHOOK_URL
✓ N8N_API_KEY

# Optional
○ TWILIO_ACCOUNT_SID
○ TWILIO_AUTH_TOKEN
○ TWILIO_PHONE_NUMBER
○ NEXT_PUBLIC_GA_MEASUREMENT_ID
```

---

**END OF MASTER KNOWLEDGE BASE**

**Version**: 2.0  
**Last Updated**: October 7, 2025  
**Maintained By**: Documentation Agent  
**Total Pages**: ~150 (when printed)  
**Total Words**: ~30,000

This document serves as the **single source of truth** for the EZCR project. All agents, developers, and stakeholders should reference this document for complete project context.

For updates or questions, contact the project team or reference the GitHub repository issues.
