# EZCR Agent Instructions

## Project Setup

This is a Next.js application with Supabase backend.

### Package Manager

```bash
npm install  # Install dependencies
npm run dev  # Start development server (port 3000)
npm run build  # Production build
npm run lint  # Run ESLint
```

### Supabase

```bash
# Start local Supabase (if configured)
npx supabase start

# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### Environment Variables

Required (set in `.env.local`):
- `EZCR_TENANT_ID` - Current tenant UUID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `INTERNAL_WEBHOOK_SECRET` - For webhook authentication

### Key Directories

- `src/app/` - Next.js App Router pages
- `src/app/(admin)/admin/` - Admin panel routes
- `src/components/` - React components
- `supabase/migrations/` - Database migrations
- `docs/combined/` - Implementation documentation

### Smoke Tests

#### Tasks Webhook
```bash
curl -X POST http://localhost:3000/api/tasks/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "order.created", "data": {"order_id": "test-123"}}'
```

#### Finance RPC (via Supabase)
```bash
# Using supabase client or direct RPC call
SELECT nx_finance_kpis(
  'YOUR_TENANT_ID'::uuid,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  '{}'::jsonb
);
```

### Development Workflow

1. Start dev server: `npm run dev`
2. Make changes
3. Check for errors: `npm run lint && npm run build`
4. Test routes in browser
5. Commit changes
