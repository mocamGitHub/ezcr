# EZCR Architecture (C4 Model)

**Date**: 2025-12-28
**Version**: 1.0

---

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - EZCR E-Commerce Platform

    Person(customer, "Customer", "Purchases motorcycle ramps")
    Person(admin, "Tenant Admin", "Manages products, orders, CRM")
    Person(nexcyte, "NexCyte Admin", "Platform operations")

    System(ezcr, "EZCR Platform", "E-commerce for motorcycle ramps with multi-tenant support")

    System_Ext(supabase, "Supabase", "Database, Auth, Storage")
    System_Ext(stripe, "Stripe", "Payment processing")
    System_Ext(openai, "OpenAI", "AI embeddings, chat")
    System_Ext(twilio, "Twilio", "SMS notifications")
    System_Ext(mailgun, "Mailgun", "Email delivery")
    System_Ext(tforce, "TForce Freight", "Shipping & tracking")
    System_Ext(n8n, "n8n", "Workflow automation")
    System_Ext(calcom, "Cal.com", "Scheduling")

    Rel(customer, ezcr, "Browses, configures, purchases")
    Rel(admin, ezcr, "Manages tenant data")
    Rel(nexcyte, ezcr, "Platform administration")

    Rel(ezcr, supabase, "Data storage, auth")
    Rel(ezcr, stripe, "Payments")
    Rel(ezcr, openai, "AI/RAG")
    Rel(ezcr, twilio, "SMS")
    Rel(ezcr, mailgun, "Email")
    Rel(ezcr, tforce, "Shipping")
    Rel(ezcr, n8n, "Workflows")
    Rel(ezcr, calcom, "Bookings")
```

---

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram - EZCR Platform

    Person(customer, "Customer")
    Person(admin, "Tenant Admin")

    Container_Boundary(c1, "EZCR Platform") {
        Container(web, "Web Application", "Next.js 15", "Server-rendered React application")
        Container(api, "API Routes", "Next.js API", "RESTful API endpoints")
        ContainerDb(cache, "React Query Cache", "In-memory", "Client-side data cache")
    }

    Container_Boundary(c2, "Supabase") {
        ContainerDb(db, "PostgreSQL", "Supabase Postgres", "Primary data store with pgvector")
        Container(auth, "Auth", "Supabase Auth", "JWT-based authentication")
        ContainerDb(storage, "Storage", "Supabase Storage", "File/image storage")
        Container(realtime, "Realtime", "Supabase Realtime", "WebSocket subscriptions")
    }

    Container_Ext(stripe, "Stripe", "Payment Gateway")
    Container_Ext(openai, "OpenAI API", "Embeddings & Chat")

    Rel(customer, web, "HTTPS")
    Rel(admin, web, "HTTPS")
    Rel(web, api, "Internal calls")
    Rel(web, cache, "Stores/reads")
    Rel(api, db, "SQL via Supabase client")
    Rel(api, auth, "JWT validation")
    Rel(api, storage, "File operations")
    Rel(api, stripe, "Payment operations")
    Rel(api, openai, "AI operations")
```

---

## Level 3: Component Diagram

```mermaid
C4Component
    title Component Diagram - API Layer

    Container_Boundary(api, "API Routes") {
        Component(auth_api, "Auth Routes", "/api/auth/*", "Authentication flows")
        Component(products_api, "Products API", "/api/products/*", "Product CRUD")
        Component(orders_api, "Orders API", "/api/orders/*", "Order management")
        Component(admin_api, "Admin API", "/api/admin/*", "Admin operations")
        Component(ai_api, "AI API", "/api/ai/*", "Chat & RAG")
        Component(schedule_api, "Schedule API", "/api/schedule/*", "Booking management")
        Component(webhook_api, "Webhooks", "/api/webhooks/*", "External integrations")
        Component(stripe_api, "Stripe API", "/api/stripe/*", "Payment processing")
    }

    Container_Boundary(lib, "Libraries") {
        Component(supabase_lib, "Supabase Client", "lib/supabase", "Database access")
        Component(auth_lib, "Auth Utils", "lib/auth", "Auth helpers")
        Component(rag_lib, "RAG Utils", "lib/rag", "Vector search")
        Component(stripe_lib, "Stripe Utils", "lib/stripe", "Payment helpers")
    }

    ContainerDb(db, "PostgreSQL")
    Container_Ext(stripe, "Stripe")
    Container_Ext(openai, "OpenAI")

    Rel(auth_api, auth_lib, "Uses")
    Rel(products_api, supabase_lib, "Uses")
    Rel(orders_api, supabase_lib, "Uses")
    Rel(admin_api, auth_lib, "Validates")
    Rel(ai_api, rag_lib, "Uses")
    Rel(stripe_api, stripe_lib, "Uses")

    Rel(supabase_lib, db, "Queries")
    Rel(stripe_lib, stripe, "API calls")
    Rel(rag_lib, openai, "Embeddings")
```

---

## Level 4: Code Patterns

### Authentication Flow

```typescript
// src/lib/auth/api-auth.ts
export async function requireAuth(request: Request): Promise<User> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AuthError('Unauthorized');
  return user;
}

export async function requireRole(request: Request, role: string): Promise<User> {
  const user = await requireAuth(request);
  const profile = await getUserProfile(user.id);
  if (!has_role(profile, role)) throw new AuthError('Forbidden');
  return user;
}
```

### RAG Search Pattern

```typescript
// src/lib/rag/search.ts
export async function searchKnowledge(query: string, tenantId: string) {
  // 1. Generate embedding
  const embedding = await generateEmbedding(query);

  // 2. Vector similarity search
  const { data } = await supabase.rpc('search_knowledge_base', {
    query_embedding: embedding,
    search_tenant_id: tenantId,
    similarity_threshold: 0.7,
    max_results: 5
  });

  return data;
}
```

### Multi-Tenant Data Access

```typescript
// Pattern: Always filter by tenant_id
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)  // RLS also enforces this
  .eq('is_active', true);
```

---

## Data Flow Diagrams

### Customer Purchase Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant W as Web App
    participant A as API
    participant S as Supabase
    participant St as Stripe

    C->>W: Browse products
    W->>A: GET /api/products
    A->>S: Query products
    S-->>A: Product data
    A-->>W: JSON response
    W-->>C: Render products

    C->>W: Add to cart
    W->>W: Update local state

    C->>W: Checkout
    W->>A: POST /api/stripe/checkout
    A->>St: Create checkout session
    St-->>A: Session URL
    A-->>W: Redirect URL
    W-->>C: Redirect to Stripe

    C->>St: Complete payment
    St->>A: POST /api/stripe/webhook
    A->>S: Create order
    A->>S: Update inventory
    A-->>St: 200 OK
```

### Admin CRM Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant W as Web App
    participant API as API
    participant S as Supabase

    A->>W: Login
    W->>S: Authenticate
    S-->>W: JWT token

    A->>W: View CRM
    W->>API: GET /api/admin/contacts
    API->>S: Query contacts (RLS: tenant_id)
    S-->>API: Contact list
    API-->>W: JSON response
    W-->>A: Render dashboard

    A->>W: Send message
    W->>API: POST /api/comms/send
    API->>S: Log outbound message
    API->>Twilio: Send SMS
    API-->>W: Success
```

---

## Database Schema Overview

```mermaid
erDiagram
    tenants ||--o{ products : has
    tenants ||--o{ orders : has
    tenants ||--o{ user_profiles : has
    tenants ||--o{ knowledge_base : has

    products ||--o{ product_images : has
    products ||--o{ order_items : included_in
    products }o--|| product_categories : belongs_to

    orders ||--o{ order_items : contains
    orders }o--|| user_profiles : placed_by

    user_profiles }o--|| auth_users : extends
    user_profiles ||--o{ chat_sessions : has

    chat_sessions ||--o{ chat_messages : contains
    knowledge_base ||--o{ embeddings : has

    tenants {
        uuid id PK
        string slug
        string name
        jsonb settings
    }

    products {
        uuid id PK
        uuid tenant_id FK
        string name
        decimal price
        integer quantity
        boolean is_active
    }

    orders {
        uuid id PK
        uuid tenant_id FK
        string status
        decimal total
        string stripe_session_id
    }
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Coolify (VPS)"
        nginx[Nginx Reverse Proxy]
        nextjs[Next.js Container]
        n8n_c[n8n Container]
    end

    subgraph "Supabase Cloud"
        pg[(PostgreSQL)]
        auth[Auth Service]
        storage[Storage]
    end

    subgraph "External Services"
        stripe[Stripe]
        openai[OpenAI]
        twilio[Twilio]
        mailgun[Mailgun]
        calcom[Cal.com]
    end

    users[Users] --> nginx
    nginx --> nextjs
    nextjs --> pg
    nextjs --> auth
    nextjs --> storage
    nextjs --> stripe
    nextjs --> openai
    n8n_c --> twilio
    n8n_c --> mailgun
    nextjs --> calcom
```

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 App Router | SSR, API routes, React 19 |
| Database | Supabase (PostgreSQL) | Managed, RLS, pgvector |
| Auth | Supabase Auth | Integrated, JWT, RLS |
| Styling | Tailwind + shadcn/ui | Utility-first, accessible |
| State | React Query + Zustand | Server state + client state |
| Payments | Stripe | Industry standard |
| AI/RAG | OpenAI + pgvector | Proven, cost-effective |
| Hosting | Coolify (VPS) | Self-hosted, Docker |
