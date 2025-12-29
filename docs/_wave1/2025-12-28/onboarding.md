# Developer Onboarding Guide

**Date**: 2025-12-28
**Project**: EZCR (EZCycleramp) E-Commerce Platform

---

## Welcome

EZCR is a multi-tenant e-commerce platform for motorcycle ramps. This guide will help you get productive quickly.

---

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
git clone <repo-url>
cd ezcr
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `NEXT_PUBLIC_TENANT_SLUG` - Your tenant slug (e.g., `ezcr-dev`)

### 3. Start Development Server

```bash
npm run dev
# Visit http://localhost:3000
```

---

## Project Structure

```
ezcr/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Public pages (SSG)
│   │   ├── admin/              # Admin dashboard (protected)
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Header, Footer
│   │   └── [feature]/          # Feature components
│   ├── lib/
│   │   ├── supabase/           # Database client
│   │   ├── auth/               # Auth utilities
│   │   └── utils.ts            # Shared utilities
│   └── hooks/                  # Custom React hooks
├── supabase/
│   └── migrations/             # Database migrations
├── tests/                      # Test files
└── docs/                       # Documentation
```

---

## Key Concepts

### 1. Multi-Tenancy

Every data access is scoped by `tenant_id`:

```typescript
// Always include tenant_id in queries
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId);
```

**Current tenants:**
- `ezcr-dev` - Development
- `ezcr-01` - Production (EZCycleramp)
- `staging` - Staging environment

### 2. Authentication

Using Supabase Auth with custom RLS policies:

```typescript
// Server-side auth check
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: Request) {
  const user = await requireAuth(request);
  // user is authenticated...
}
```

**Roles:** `owner` > `admin` > `customer_service` > `viewer` > `customer`

### 3. Row Level Security (RLS)

Database tables have RLS policies. Key patterns:

```sql
-- Tenant isolation
CREATE POLICY "tenant_read" ON products
  FOR SELECT USING (tenant_id = current_tenant_id());

-- Role-based access
CREATE POLICY "admin_all" ON products
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### 4. Component Patterns

Using shadcn/ui with Tailwind:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function MyComponent({ className }) {
  return (
    <Button className={cn('custom-class', className)}>
      Click me
    </Button>
  );
}
```

---

## Common Tasks

### Add a New Page

```tsx
// src/app/(marketing)/my-page/page.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

### Add a New API Route

```typescript
// src/app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: Request) {
  const user = await requireAuth(request);
  return NextResponse.json({ message: 'Hello' });
}
```

### Add a Database Migration

```bash
# Create migration file
touch supabase/migrations/00XXX_my_migration.sql

# Apply migration
npm run db:push
```

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## Development Workflow

### Git Branches

- `main` - Production
- `staging` - Pre-production
- `feature/*` - Feature branches
- `fix/*` - Bug fixes

### Commit Messages

Use conventional commits:
```
feat(products): add image gallery
fix(cart): resolve quantity update bug
docs(readme): update setup instructions
```

### Pull Requests

1. Create feature branch
2. Make changes
3. Run tests locally
4. Create PR against `main`
5. Request review

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/lib/supabase/client.ts` | Client-side Supabase client |
| `src/lib/auth/api-auth.ts` | API authentication helpers |
| `src/components/ui/*` | shadcn/ui components |
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind configuration |
| `vitest.config.ts` | Test configuration |

---

## External Services

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| Supabase | Database, Auth | dashboard.supabase.com |
| Stripe | Payments | dashboard.stripe.com |
| Coolify | Hosting | your-coolify-url |
| n8n | Workflows | your-n8n-url |
| Cal.com | Scheduling | cal.com |

---

## Getting Help

1. **Documentation**: Check `/docs` folder
2. **Session Handoff**: Read `SESSION_HANDOFF.md` for current state
3. **Issue Tracker**: Use `bd` (Beads) for issues
4. **AI Assistant**: Claude Code is configured for this project

### Useful Commands

```bash
# Check current issues
bd list

# Start onboarding workflow
bd onboard

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

---

## First Tasks

As a new developer, start with:

1. **Read SESSION_HANDOFF.md** - Understand current state
2. **Explore the codebase** - Navigate `src/app` and `src/components`
3. **Run the dev server** - Click around the UI
4. **Make a small change** - Update a component, see it reload
5. **Pick an issue** - Run `bd list` and pick something small

Welcome to the team!
