# API Routes Reference

**Last Updated**: October 7, 2025  
**Framework**: Next.js 15 App Router  
**Location**: `/src/app/api/`

---

## Route Structure

```
/src/app/api/
â”œâ”€â”€ products/
â”‚   â”œâ”€â”€ route.ts          # GET /api/products
â”‚   â””â”€â”€ [slug]/
â”‚       â””â”€â”€ route.ts      # GET /api/products/[slug]
â”œâ”€â”€ cart/
â”‚   â”œâ”€â”€ route.ts          # GET, POST /api/cart
â”‚   â””â”€â”€ [id]/
â”‚       â””â”€â”€ route.ts      # PUT, DELETE /api/cart/[id]
â”œâ”€â”€ orders/
â”‚   â”œâ”€â”€ route.ts          # POST /api/orders
â”‚   â””â”€â”€ [id]/
â”‚       â””â”€â”€ route.ts      # GET /api/orders/[id]
â”œâ”€â”€ checkout/
â”‚   â””â”€â”€ route.ts          # POST /api/checkout
â”œâ”€â”€ webhooks/
â”‚   â”œâ”€â”€ stripe/
â”‚   â”‚   â””â”€â”€ route.ts      # POST /api/webhooks/stripe
â”‚   â””â”€â”€ n8n/
â”‚       â””â”€â”€ route.ts      # POST /api/webhooks/n8n
â”œâ”€â”€ chat/
â”‚   â””â”€â”€ route.ts          # POST /api/chat
â”œâ”€â”€ configurator/
â”‚   â”œâ”€â”€ validate/
â”‚   â”‚   â””â”€â”€ route.ts      # POST /api/configurator/validate
â”‚   â””â”€â”€ quote/
â”‚       â””â”€â”€ route.ts      # POST /api/configurator/quote
â””â”€â”€ waitlist/
    â””â”€â”€ route.ts          # POST /api/waitlist
```

---

## Product Routes

### GET /api/products
```typescript
// Get all active products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  
  // Query with filters
  // Return products array
}
```

### GET /api/products/[slug]
```typescript
// Get single product by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  // Return product details
}
```

---

## Cart Routes

### GET /api/cart
```typescript
// Get cart for session/user
export async function GET(request: Request) {
  const sessionId = request.headers.get('x-session-id')
  // Return cart items
}
```

### POST /api/cart
```typescript
// Add item to cart
export async function POST(request: Request) {
  const body = await request.json()
  // Validate inventory
  // Reserve for 15 minutes
  // Return updated cart
}
```

### PUT /api/cart/[id]
```typescript
// Update cart item quantity
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Update quantity
  // Validate inventory
}
```

### DELETE /api/cart/[id]
```typescript
// Remove item from cart
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Release inventory reservation
}
```

---

## Order Routes

### POST /api/orders
```typescript
// Create new order
export async function POST(request: Request) {
  const body = await request.json()
  
  // Validate cart
  // Check inventory
  // Generate order number
  // Create order in DB
  // Trigger N8N webhook
  // Clear cart
  // Return order details
}
```

### GET /api/orders/[id]
```typescript
// Get order details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify ownership
  // Return order with items
}
```

---

## Checkout Route

### POST /api/checkout
```typescript
// Create Stripe checkout session
export async function POST(request: Request) {
  const { cartId, customerId } = await request.json()
  
  // Get cart items
  // Calculate totals
  // Create Stripe session
  // Return session URL
}
```

---

## Webhook Routes

### POST /api/webhooks/stripe
```typescript
// Handle Stripe webhook events
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()
  
  // Verify signature
  // Handle event types:
  //   - payment_intent.succeeded
  //   - payment_intent.failed
  //   - checkout.session.completed
}
```

### POST /api/webhooks/n8n
```typescript
// Receive webhooks from N8N
export async function POST(request: Request) {
  // Process automation callbacks
}
```

---

## Chat Route

### POST /api/chat
```typescript
// RAG chatbot endpoint
export async function POST(request: Request) {
  const { message, conversationId } = await request.json()
  
  // Generate embedding
  // Search knowledge base
  // Get context
  // Call OpenAI with context
  // Return response
}
```

---

## Configurator Routes

### POST /api/configurator/validate
```typescript
// Validate configuration
export async function POST(request: Request) {
  const { step, data } = await request.json()
  
  // Validate measurements
  // Select required extensions
  // Return validation result
}
```

### POST /api/configurator/quote
```typescript
// Generate quote from configuration
export async function POST(request: Request) {
  const { configuration } = await request.json()
  
  // Calculate pricing
  // Save configuration to DB
  // Generate quote token
  // Return quote details
}
```

---

## Waitlist Route

### POST /api/waitlist
```typescript
// Add to product waitlist
export async function POST(request: Request) {
  const { productId, email, prepaymentPercentage } = await request.json()
  
  // Validate product exists
  // Process prepayment (if applicable)
  // Calculate priority score
  // Add to waitlist
  // Send confirmation email
}
```

---

## Middleware & Security

### Rate Limiting
```typescript
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

await limiter.check(request, 10, 'API_ROUTE')
```

### Input Validation
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  // ...
})

const validated = schema.parse(body)
```

### Authentication
```typescript
import { getServerSession } from 'next-auth'

const session = await getServerSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

**All routes must implement proper error handling and security measures.**