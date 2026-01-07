# API Design Patterns

> **Tier:** Platform (Tier 1)
> **Applies To:** All NexCyte repos
> **Override Policy:** EXTEND
> **Version:** 1.0.0

## Skill Relationships

**Complements:** supabase-patterns, security-standards
**Extended By:** Local tenant skills
**See Also:** multi-tenant

## Purpose

Defines the standard patterns for Next.js API routes, error handling, response formats, and tenant context management across all NexCyte projects.

## Scope Boundaries

**This skill covers:**
- API route file structure
- Request/response patterns
- Error handling
- Tenant context
- Webhook handling

**This skill does NOT cover (see other skills):**
- Database queries -> see supabase-patterns
- Authentication -> see security-standards
- Business logic -> tenant-specific skills

## Patterns

### 1. API Route Structure

**When to use:** Creating any new API endpoint

**Implementation:**

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import { resourceSchema, validateRequest } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()

    // 2. Validate with Zod
    const validation = validateRequest(resourceSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    // 3. Get tenant context
    const tenantSlug = getCurrentTenant()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenantError || !tenant) {
      console.error('Error fetching tenant:', tenantError)
      return NextResponse.json(
        { error: 'Tenant configuration error' },
        { status: 500 }
      )
    }

    // 4. Business logic
    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert({
        tenant_id: tenant.id,
        ...validation.data,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create resource' },
        { status: 500 }
      )
    }

    // 5. Return success response
    return NextResponse.json({ data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Force dynamic for routes that need runtime data
export const dynamic = 'force-dynamic'
```

### 2. Error Response Format

**When to use:** All API error responses

**Implementation:**

```typescript
// Standard error response structure
interface ApiError {
  error: string           // User-friendly message
  details?: unknown       // Optional validation/debug details
  code?: string           // Optional error code for client handling
}

// Validation error (400)
return NextResponse.json(
  {
    error: 'Validation failed',
    details: zodError.issues,
    code: 'VALIDATION_ERROR'
  },
  { status: 400 }
)

// Authentication error (401)
return NextResponse.json(
  { error: 'Authentication required', code: 'UNAUTHENTICATED' },
  { status: 401 }
)

// Authorization error (403)
return NextResponse.json(
  { error: 'Permission denied', code: 'FORBIDDEN' },
  { status: 403 }
)

// Not found (404)
return NextResponse.json(
  { error: 'Resource not found', code: 'NOT_FOUND' },
  { status: 404 }
)

// Server error (500) - Never expose internal details
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
)
```

### 3. Dynamic Route Parameters

**When to use:** Routes with path parameters like `/api/resource/[id]`

**Implementation:**

```typescript
// src/app/api/resource/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Next.js 15+ pattern with Promise params
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: 'Invalid ID format', code: 'INVALID_ID' },
      { status: 400 }
    )
  }

  // Fetch resource
  const { data, error } = await supabaseAdmin
    .from('resources')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Resource not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Delete logic...
}
```

### 4. Webhook Handling

**When to use:** External service webhooks (Stripe, Twilio, etc.)

**Implementation:**

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle specific event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  // Acknowledge receipt
  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'
```

### 5. Health Check Endpoint

**When to use:** Every application needs a health endpoint

**Implementation:**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    hostname: process.env.HOSTNAME,
  })
}

export const dynamic = 'force-dynamic'
```

## File Organization

```
src/app/api/
├── health/
│   └── route.ts                    # Health check
├── [resource]/
│   ├── route.ts                    # GET list, POST create
│   └── [id]/
│       └── route.ts                # GET one, PUT update, DELETE
├── admin/
│   └── [resource]/
│       └── route.ts                # Admin-only endpoints
├── webhooks/
│   ├── stripe/
│   │   └── route.ts
│   └── twilio/
│       ├── inbound/
│       │   └── route.ts
│       └── status/
│           └── route.ts
└── cron/
    └── [task]/
        └── route.ts                # Scheduled tasks
```

## Checklist

Before committing API routes:

- [ ] Request body validated with Zod schema
- [ ] Tenant context retrieved and used
- [ ] Error responses follow standard format
- [ ] No internal details in error messages
- [ ] `force-dynamic` set for runtime data routes
- [ ] Webhook signatures verified
- [ ] UUID parameters validated
- [ ] Console errors logged for debugging
