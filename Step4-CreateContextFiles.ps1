# EZCR Step 4: Create Context Files
# Phase 3: SOLUTIONS - Final step
# Encoding: UTF-8

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }

function New-UTF8File {
    param([string]$Path, [string]$Content)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Log "Step 4: Creating Context Files"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# Database Schema Context
$dbSchema = @'
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
'@

New-UTF8File ".claude\context\database-schema.md" $dbSchema
Success "Created: database-schema.md"

# API Routes Context
$apiRoutes = @'
# API Routes Reference

**Last Updated**: October 7, 2025  
**Framework**: Next.js 15 App Router  
**Location**: `/src/app/api/`

---

## Route Structure

```
/src/app/api/
├── products/
│   ├── route.ts          # GET /api/products
│   └── [slug]/
│       └── route.ts      # GET /api/products/[slug]
├── cart/
│   ├── route.ts          # GET, POST /api/cart
│   └── [id]/
│       └── route.ts      # PUT, DELETE /api/cart/[id]
├── orders/
│   ├── route.ts          # POST /api/orders
│   └── [id]/
│       └── route.ts      # GET /api/orders/[id]
├── checkout/
│   └── route.ts          # POST /api/checkout
├── webhooks/
│   ├── stripe/
│   │   └── route.ts      # POST /api/webhooks/stripe
│   └── n8n/
│       └── route.ts      # POST /api/webhooks/n8n
├── chat/
│   └── route.ts          # POST /api/chat
├── configurator/
│   ├── validate/
│   │   └── route.ts      # POST /api/configurator/validate
│   └── quote/
│       └── route.ts      # POST /api/configurator/quote
└── waitlist/
    └── route.ts          # POST /api/waitlist
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
'@

New-UTF8File ".claude\context\api-routes.md" $apiRoutes
Success "Created: api-routes.md"

# Business Rules Context
$businessRules = @'
# Business Rules Reference

**Last Updated**: October 7, 2025  
**Company**: NEO-DYNE, USA  
**Brand**: EZ Cycle Ramp (EZCR)

---

## Product Catalog

### Main Products
- **AUN250 Folding Ramp**: $1,299.00 (Premium)
- **AUN210 Standard Ramp**: $999.00
- **AUN200 Basic Ramp**: $799.00
- **AUN150 Hybrid Ramp**: $899.00 (Coming March 1, 2025)

### Extensions & Accessories
- **AC001-1** (35-42"): $149.00
- **AC001-2** (43-51"): $179.00
- **AC001-3** (52-60"): $209.00
- **AC004** (Cargo >80"): $199.00
- **4-Beam Extension**: $249.00
- **Tie-Down Straps**: $39.99
- **Wheel Chock**: $49.99

---

## Pricing Rules

### Bulk Discounts
Apply to order total (before tax/shipping):

```typescript
function calculateBulkDiscount(quantity: number, subtotal: number): number {
  if (quantity >= 10) return subtotal * 0.15  // 15% off
  if (quantity >= 5) return subtotal * 0.10   // 10% off
  if (quantity >= 3) return subtotal * 0.05   // 5% off
  return 0
}
```

### Tax & Fees
```typescript
const TAX_RATE = 0.089              // 8.9%
const PROCESSING_FEE_RATE = 0.03    // 3%
const FREE_SHIPPING_THRESHOLD = 500.00
```

### Total Calculation
```typescript
const discount = calculateBulkDiscount(quantity, subtotal)
const subtotalAfterDiscount = subtotal - discount
const tax = subtotalAfterDiscount * TAX_RATE
const processing = subtotalAfterDiscount * PROCESSING_FEE_RATE
const total = subtotalAfterDiscount + tax + processing + shippingCost
```

---

## Shipping Rules

### Methods
- **T-Force Freight**: For shipments >100 lbs (palletized)
- **UPS Ground**: For shipments <100 lbs

### Free Shipping
Orders >$500 qualify for free shipping.

### Calculation
```typescript
function selectShippingMethod(weight: number): string {
  return weight > 100 ? 'T-Force Freight' : 'UPS Ground'
}

async function calculateShipping(
  weight: number,
  destination: Address
): Promise<number> {
  if (orderTotal > FREE_SHIPPING_THRESHOLD) return 0
  
  const method = selectShippingMethod(weight)
  // Call shipping API for real-time quote
  return shippingCost
}
```

---

## Inventory Rules

### Stock Levels
```typescript
const LOW_STOCK_THRESHOLD = 5
const CART_RESERVATION_MINUTES = 15

// Status determination
function getStockStatus(count: number): Status {
  if (count === 0) return 'out_of_stock'
  if (count <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}
```

### Cart Reservation
When item added to cart:
1. Check available inventory (inventory_count - reserved)
2. Reserve for 15 minutes
3. Update `reserved_until` timestamp
4. Cleanup expired reservations periodically

---

## Order Processing

### Order Number Format
```typescript
// Pattern: EZCR-2025-00001
function generateOrderNumber(tenantSlug: string): string {
  const year = new Date().getFullYear()
  const sequence = getNextSequence(tenantSlug, year)
  return `${tenantSlug.toUpperCase()}-${year}-${String(sequence).padStart(5, '0')}`
}
```

### Order Statuses
- **pending**: Payment processing
- **processing**: Preparing shipment
- **shipped**: In transit
- **delivered**: Confirmed delivery
- **cancelled**: Cancelled by customer/admin

### Order Lifecycle
```typescript
const ORDER_LIFECYCLE = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],    // Terminal
  cancelled: []     // Terminal
}
```

### Cancellation Window
Orders can only be cancelled within 30 minutes of creation if status is 'pending'.

---

## Waitlist Rules

### Prepayment Options
- 0% (no prepayment)
- 10% prepayment
- 25% prepayment
- 50% prepayment
- 100% prepayment

### Priority Score Calculation
```typescript
function calculatePriorityScore(
  prepaymentPercentage: number,
  daysWaiting: number
): number {
  const prepaymentScore = (prepaymentPercentage / 100) * 50
  const waitingScore = daysWaiting * 0.1
  return prepaymentScore + waitingScore
}

// Example:
// User A: 50% prepaid, 10 days = (0.5 * 50) + (10 * 0.1) = 26
// User B: 10% prepaid, 30 days = (0.1 * 50) + (30 * 0.1) = 8
// User A has priority
```

### Stock Notification
When product back in stock:
1. Query waitlist: ORDER BY priority_score DESC LIMIT 50
2. Send stock notification emails
3. Include 24-hour purchase window
4. Update status = 'notified'

---

## Configurator Rules

### Step 2: Measurement Validation
```typescript
const VALIDATION_RANGES = {
  cargoArea: { min: 53.15, max: 98.43 },    // inches
  totalLength: { min: 68, max: 98.43 },     // inches
  height: { min: 0, max: 60 }               // inches
}
```

### Extension Auto-Selection
```typescript
function selectExtension(height: number): string | null {
  if (height >= 35 && height <= 42) return 'AC001-1'
  if (height >= 43 && height <= 51) return 'AC001-2'
  if (height >= 52 && height <= 60) return 'AC001-3'
  return null
}

// Cargo extension
function selectCargoExtension(cargoArea: number, model: string): string | null {
  if (cargoArea > 80) {
    if (model === 'AUN210') return 'AC004'
    if (model === 'AUN250') return '4-Beam Extension'
  }
  return null
}
```

---

## Customer Service

### Contact Information
- **Phone**: 800-687-4410
- **Email**: support@ezcycleramp.com
- **Hours**: Mon-Fri 9am-5pm EST

### Return Policy
- **Window**: 30 days from delivery
- **Condition**: Unused, original packaging
- **Refund**: Full refund minus shipping

### Warranty
- **Duration**: 1 year from purchase
- **Coverage**: Manufacturing defects
- **Exclusions**: Normal wear, misuse, accidents

---

## Trust Indicators

### Brand Attributes
- ✅ Veteran-owned business
- ✅ BBB A+ rating
- ✅ Free shipping over $500
- ✅ 30-day money-back guarantee
- ✅ Made in USA

---

**These rules must be consistently applied across all application features.**
'@

New-UTF8File ".claude\context\business-rules.md" $businessRules
Success "Created: business-rules.md"

# Component Library Context
$componentLibrary = @'
# Component Library Reference

**Last Updated**: October 7, 2025  
**UI Library**: ShadCN UI  
**Styling**: Tailwind CSS  
**Animation**: Framer Motion

---

## Design System

### Color Tokens
```typescript
// tailwind.config.ts
colors: {
  'brand-black': '#1a1a1a',
  'brand-orange': '#ff6b35',
  'brand-silver': '#c0c0c0',
  'background': '#ffffff',
  'muted': '#f5f5f5',
}
```

### Typography Scale
```css
--text-base: 1rem;      /* 16px minimum */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### Spacing Scale
```css
--spacing-4: 1rem;      /* 16px base */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
```

---

## Core Components

### Button
```tsx
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <ShoppingCart className="mr-2 h-4 w-4" />
  Add to Cart
</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Short description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Elements
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

<div>
  <Label htmlFor="email">Email *</Label>
  <Input id="email" type="email" required />
</div>

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Layout Components

### Header
```tsx
// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center">
        {/* Logo, Navigation, Actions */}
      </div>
    </header>
  )
}
```

### Footer
```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        {/* Links, Contact Info, Newsletter */}
      </div>
    </footer>
  )
}
```

---

## Product Components

### ProductCard
```tsx
// src/components/products/ProductCard.tsx
interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <Image src={product.images[0]} alt={product.name} fill />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-2xl font-bold">${product.price}</p>
        <Button className="w-full">Add to Cart</Button>
      </CardContent>
    </Card>
  )
}
```

### ProductGrid
```tsx
// src/components/products/ProductGrid.tsx
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

## Form Components with Validation

### Using React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## Interactive Components

### Loading Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-square" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}
```

### Animation with Framer Motion
```tsx
import { motion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Accessibility Patterns

### Focus Management
```tsx
// Always show focus indicators
className="focus:ring-2 focus:ring-brand-orange focus:outline-none"
```

### ARIA Labels
```tsx
<Button aria-label="Add AUN250 to cart">
  <ShoppingCart />
</Button>
```

### Screen Reader Text
```tsx
<span className="sr-only">Loading...</span>
```

---

## Responsive Patterns

### Mobile-First Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

### Responsive Typography
```tsx
className="text-2xl md:text-3xl lg:text-4xl"
```

### Show/Hide Elements
```tsx
className="hidden md:block"  // Hide on mobile, show on tablet+
className="md:hidden"         // Show on mobile, hide on tablet+
```

---

**All components must follow these patterns for consistency and accessibility.**
'@

New-UTF8File ".claude\context\component-library.md" $componentLibrary
Success "Created: component-library.md"

Write-Host ""
Write-Host "=============================================="
Success "🎉 Phase 3 Complete! All files created successfully!"
Write-Host "=============================================="
Write-Host ""

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ 4 directories created"
Write-Host "  ✅ 11 agent files created"
Write-Host "  ✅ 3 coordination files created"
Write-Host "  ✅ 4 context files created"
Write-Host ""
Write-Host "📝 Remaining tasks:" -ForegroundColor Yellow
Write-Host "  1. Save the 3 Knowledge Base documents from your uploads:"
Write-Host "     - EZCR Complete Knowledge Base - Master Document.md"
Write-Host "     - EZCR - Complete Step-by-Step Project Instructions.md"
Write-Host "     - EZCR - Complete Agent Specification Files.md"
Write-Host ""
Write-Host "  2. These should be saved to: $PROJECT_ROOT"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "  1. Review all created files"
Write-Host "  2. Verify content accuracy"
Write-Host "  3. Begin Week 0 implementation tasks"
Write-Host "  4. Update .claude/coordinator.md daily"
Write-Host ""
Write-Host "=============================================="
