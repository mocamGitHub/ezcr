# EZ Cycle Ramp — Platform Checkout Integration Specification

## Overview

This document specifies how the multi-tenant platform should integrate T-Force Freight shipping quotes into the checkout flow for the EZ Cycle Ramp tenant. The goal is seamless shipping cost calculation from product selection through order completion.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PRODUCT    │    │ CONFIGURATOR │    │   CHECKOUT   │    │    ORDER     │
│    PAGE      │───▶│   (Step 4)   │───▶│              │───▶│ CONFIRMATION │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────────────────────────────┐
                    │     Supabase Edge Function          │
                    │     /get-shipping-quote             │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │        T-Force Freight API          │
                    └─────────────────────────────────────┘

Data Flow:
─────────────────────────────────────────────────────────────────────────────────
Session Start → Generate session_id (UUID)
Configurator  → Save shipping_quote + session_id to Supabase
Checkout      → Retrieve quote by session_id OR re-quote if needed
Payment       → Validate quote, include in order total
Order         → Store quote_id + shipping_cost with order record
```

---

## 1. Session Management

### 1.1 Session ID Generation

When a user lands on the EZ Cycle Ramp site, generate a persistent session ID:

```typescript
// Platform should implement this at session start
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('ezc_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('ezc_session_id', sessionId);
  }
  return sessionId;
}
```

### 1.2 Session Data Structure

Store in `sessionStorage` or platform session:

```typescript
interface EZCSessionData {
  sessionId: string;
  
  // Product selection
  selectedProduct?: 'AUN200' | 'AUN250';
  productPrice?: number;
  
  // Shipping
  deliveryMethod?: 'shipping' | 'pickup';
  shippingQuote?: {
    quoteId: string;
    baseRate: number;
    residentialSurcharge: number;
    totalRate: number;
    destinationTerminal?: {
      code: string;
      name: string;
    };
    transitDays?: number;
    validUntil: string;
  };
  shippingAddress?: {
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    isResidential: boolean;
  };
  
  // Lead capture
  leadId?: string;
  email?: string;
}
```

---

## 2. Configurator Integration

### 2.1 Step 4: Delivery Selection

The configurator's Step 4 should:

1. **Show delivery options**: Ship to Me vs. Pick Up
2. **Capture shipping address** (if shipping selected)
3. **Call shipping quote API**
4. **Store quote in session AND Supabase**

```typescript
// After receiving quote from API
async function handleQuoteReceived(quote: ShippingQuote, address: ShippingAddress) {
  const sessionId = getOrCreateSessionId();
  
  // Store in session
  const sessionData = getSessionData();
  sessionData.shippingQuote = quote;
  sessionData.shippingAddress = address;
  saveSessionData(sessionData);
  
  // Also save to Supabase for cross-device/persistence
  await supabase.from('shipping_addresses').upsert({
    session_id: sessionId,
    ...address,
    last_quote_id: quote.quoteId,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'session_id'
  });
}
```

### 2.2 Add to Cart

When user completes configurator and adds to cart:

```typescript
interface CartItem {
  productSku: 'AUN200' | 'AUN250';
  productName: string;
  productPrice: number;
  quantity: 1; // Always 1 for ramps
  
  // EZ Cycle Ramp specific
  deliveryMethod: 'shipping' | 'pickup';
  shippingQuoteId?: string;
  shippingCost?: number;
  shippingAddress?: ShippingAddress;
}

function addToCart(product: Product, sessionData: EZCSessionData): CartItem {
  return {
    productSku: product.sku,
    productName: product.name,
    productPrice: product.price,
    quantity: 1,
    deliveryMethod: sessionData.deliveryMethod || 'shipping',
    shippingQuoteId: sessionData.shippingQuote?.quoteId,
    shippingCost: sessionData.deliveryMethod === 'pickup' 
      ? 0 
      : sessionData.shippingQuote?.totalRate,
    shippingAddress: sessionData.shippingAddress,
  };
}
```

---

## 3. Checkout Flow

### 3.1 Checkout Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         CHECKOUT                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. CONTACT INFORMATION                                   │   │
│  │    Email: [_______________________]                      │   │
│  │    Phone: [_______________________]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. DELIVERY METHOD                          [Pre-filled] │   │
│  │                                                          │   │
│  │    ◉ Ship to Me ($285.00)                               │   │
│  │      └─ Terminal pickup at: Los Angeles Terminal         │   │
│  │      └─ ☐ Add residential delivery (+$150)              │   │
│  │                                                          │   │
│  │    ○ Pick Up (FREE)                                      │   │
│  │      └─ Woodstock, GA                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. SHIPPING ADDRESS              [Pre-filled from config]│   │
│  │    Street: [123 Main Street_______]                      │   │
│  │    Apt:    [_______________________]                     │   │
│  │    City:   [Los Angeles___] State: [CA] ZIP: [90210]    │   │
│  │                                                          │   │
│  │    ☐ This is a residential address                       │   │
│  │                                                          │   │
│  │    [Recalculate Shipping] ← If address changed           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. BILLING ADDRESS                                       │   │
│  │    ☐ Same as shipping address                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. PAYMENT                                               │   │
│  │    [Stripe Elements / Payment Form]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ORDER SUMMARY                                            │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ EZ Cycle Ramp AUN 250                         $2,795.00 │   │
│  │ Shipping (Terminal-to-Terminal)                 $285.00 │   │
│  │ Residential Delivery                            $150.00 │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ TOTAL                                         $3,230.00 │   │
│  │                                                          │   │
│  │              [ Complete Purchase ]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Checkout Initialization

When checkout page loads:

```typescript
async function initializeCheckout() {
  const sessionId = getOrCreateSessionId();
  const cart = getCart();
  
  // Check if we have a shipping quote
  if (cart.shippingQuoteId) {
    // Validate quote is still valid
    const { data: quote } = await supabase
      .from('shipping_quotes')
      .select('*')
      .eq('quote_id', cart.shippingQuoteId)
      .single();
    
    if (quote && new Date(quote.valid_until) > new Date()) {
      // Quote is valid, use it
      return {
        shippingQuote: quote,
        needsRequote: false,
      };
    }
  }
  
  // No quote or expired - check for saved address
  const { data: savedAddress } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (savedAddress) {
    // Re-fetch quote with saved address
    return {
      savedAddress,
      needsRequote: true,
    };
  }
  
  // No saved data - user needs to enter shipping info
  return {
    needsRequote: true,
    noSavedAddress: true,
  };
}
```

### 3.3 Address Change Handling

When user modifies shipping address at checkout:

```typescript
async function handleAddressChange(newAddress: ShippingAddress) {
  const sessionId = getOrCreateSessionId();
  const cart = getCart();
  
  // Show loading state
  setShippingLoading(true);
  
  try {
    // Call shipping quote API
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-shipping-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationZip: newAddress.zipCode,
        destinationCity: newAddress.city,
        destinationState: newAddress.state,
        productSku: cart.productSku,
        isResidential: newAddress.isResidential,
        source: 'checkout',
        sessionId,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update cart with new shipping
      updateCart({
        ...cart,
        shippingQuoteId: data.quoteId,
        shippingCost: data.totalRate,
        shippingAddress: newAddress,
      });
      
      // Update UI
      setShippingQuote(data);
      recalculateTotal();
    } else {
      // Show error, offer phone fallback
      setShippingError(data.error.userMessage);
    }
  } finally {
    setShippingLoading(false);
  }
}
```

### 3.4 Residential Toggle

```typescript
async function handleResidentialToggle(isResidential: boolean) {
  const cart = getCart();
  
  // Quick update - residential surcharge is fixed at $150
  if (isResidential && !cart.shippingAddress?.isResidential) {
    // Adding residential
    updateCart({
      ...cart,
      shippingCost: (cart.shippingCost || 0) + 150,
      shippingAddress: {
        ...cart.shippingAddress,
        isResidential: true,
      },
    });
  } else if (!isResidential && cart.shippingAddress?.isResidential) {
    // Removing residential
    updateCart({
      ...cart,
      shippingCost: (cart.shippingCost || 0) - 150,
      shippingAddress: {
        ...cart.shippingAddress,
        isResidential: false,
      },
    });
  }
  
  // Re-fetch quote in background to confirm
  // (in case surcharge amount differs)
  refetchQuoteInBackground();
}
```

---

## 4. Payment Processing

### 4.1 Pre-Payment Validation

Before processing payment, validate:

```typescript
async function validateBeforePayment(): Promise<ValidationResult> {
  const cart = getCart();
  const errors: string[] = [];
  
  // 1. Validate shipping quote is still valid
  if (cart.deliveryMethod === 'shipping') {
    const { data: quote } = await supabase
      .from('shipping_quotes')
      .select('*')
      .eq('quote_id', cart.shippingQuoteId)
      .single();
    
    if (!quote) {
      errors.push('Shipping quote not found. Please recalculate shipping.');
    } else if (new Date(quote.valid_until) < new Date()) {
      // Quote expired - try to refresh
      const newQuote = await refreshQuote(cart.shippingAddress, cart.productSku);
      if (newQuote) {
        // Check if price changed significantly (>$20)
        if (Math.abs(newQuote.totalRate - cart.shippingCost) > 20) {
          errors.push(`Shipping cost updated to $${newQuote.totalRate}. Please review and confirm.`);
          updateCart({ ...cart, shippingCost: newQuote.totalRate, shippingQuoteId: newQuote.quoteId });
        } else {
          // Minor change, update silently
          updateCart({ ...cart, shippingQuoteId: newQuote.quoteId });
        }
      } else {
        errors.push('Unable to verify shipping. Please try again or call (937) 725-6790.');
      }
    }
  }
  
  // 2. Validate address completeness
  if (cart.deliveryMethod === 'shipping') {
    const addr = cart.shippingAddress;
    if (!addr?.streetAddress || !addr?.city || !addr?.state || !addr?.zipCode) {
      errors.push('Please complete your shipping address.');
    }
  }
  
  // 3. Validate product availability (optional)
  // ...
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 4.2 Stripe Payment Intent

Include shipping in the payment:

```typescript
async function createPaymentIntent(cart: Cart): Promise<PaymentIntent> {
  const totalAmount = calculateTotal(cart);
  
  // Create payment intent via your backend
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        product_sku: cart.productSku,
        product_price: cart.productPrice,
        shipping_quote_id: cart.shippingQuoteId,
        shipping_cost: cart.shippingCost,
        delivery_method: cart.deliveryMethod,
        session_id: getOrCreateSessionId(),
      },
    }),
  });
  
  return response.json();
}

function calculateTotal(cart: Cart): number {
  let total = cart.productPrice;
  
  if (cart.deliveryMethod === 'shipping' && cart.shippingCost) {
    total += cart.shippingCost;
  }
  
  // Add tax if applicable
  // total += calculateTax(cart);
  
  return total;
}
```

---

## 5. Order Creation

### 5.1 Order Data Structure

After successful payment:

```typescript
interface Order {
  // Standard fields
  id: string;
  order_number: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Product
  product_sku: string;
  product_name: string;
  product_price: number;
  quantity: number;
  
  // Shipping
  delivery_method: 'shipping' | 'pickup';
  shipping_quote_id?: string;
  shipping_cost: number;
  shipping_address?: {
    street_address: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    is_residential: boolean;
  };
  destination_terminal?: {
    code: string;
    name: string;
    address?: string;
  };
  estimated_transit_days?: number;
  
  // Billing
  billing_address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  // Payment
  payment_intent_id: string;
  payment_method: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  
  // Tracking
  lead_id?: string;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### 5.2 Order Creation Flow

```typescript
async function createOrder(
  cart: Cart,
  paymentResult: PaymentResult,
  customerInfo: CustomerInfo
): Promise<Order> {
  const sessionId = getOrCreateSessionId();
  
  // Get lead ID if exists
  const { data: lead } = await supabase
    .from('configurator_leads')
    .select('id')
    .eq('email', customerInfo.email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Create order
  const order: Partial<Order> = {
    order_number: generateOrderNumber(),
    customer_email: customerInfo.email,
    customer_phone: customerInfo.phone,
    status: 'pending',
    
    product_sku: cart.productSku,
    product_name: cart.productName,
    product_price: cart.productPrice,
    quantity: 1,
    
    delivery_method: cart.deliveryMethod,
    shipping_quote_id: cart.shippingQuoteId,
    shipping_cost: cart.shippingCost || 0,
    shipping_address: cart.deliveryMethod === 'shipping' ? {
      street_address: cart.shippingAddress.streetAddress,
      apartment: cart.shippingAddress.apartment,
      city: cart.shippingAddress.city,
      state: cart.shippingAddress.state,
      zip_code: cart.shippingAddress.zipCode,
      country: 'US',
      is_residential: cart.shippingAddress.isResidential,
    } : undefined,
    
    billing_address: customerInfo.billingAddress,
    
    payment_intent_id: paymentResult.paymentIntentId,
    payment_method: paymentResult.paymentMethod,
    subtotal: cart.productPrice,
    shipping_total: cart.shippingCost || 0,
    tax_total: 0, // Add tax calculation if needed
    grand_total: cart.productPrice + (cart.shippingCost || 0),
    
    lead_id: lead?.id,
    session_id: sessionId,
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Insert into database
  const { data: createdOrder, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  
  if (error) throw error;
  
  // Trigger post-purchase automation
  await triggerPostPurchaseWorkflow(createdOrder);
  
  return createdOrder;
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EZC-${dateStr}-${random}`;
}
```

---

## 6. Database Schema Updates

### 6.1 Orders Table

Add to your Supabase migrations:

```sql
-- Orders table for EZ Cycle Ramp
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending',
  
  -- Product
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  -- Shipping
  delivery_method TEXT NOT NULL, -- 'shipping' or 'pickup'
  shipping_quote_id TEXT REFERENCES shipping_quotes(quote_id),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  shipping_address JSONB,
  destination_terminal JSONB,
  estimated_transit_days INTEGER,
  
  -- Billing
  billing_address JSONB NOT NULL,
  
  -- Payment
  payment_intent_id TEXT,
  payment_method TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_total DECIMAL(10,2) DEFAULT 0,
  tax_total DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  
  -- Tracking
  lead_id UUID REFERENCES configurator_leads(id),
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Fulfillment
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  carrier TEXT,
  delivered_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_delivery_method CHECK (delivery_method IN ('shipping', 'pickup')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
);

-- Indexes
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_lead ON orders(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_orders_session ON orders(session_id) WHERE session_id IS NOT NULL;

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on orders" 
  ON orders FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
```

---

## 7. API Endpoints Summary

### Platform Should Implement

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cart` | GET/POST/PUT | Cart management |
| `/api/checkout/init` | POST | Initialize checkout, validate quote |
| `/api/checkout/shipping` | POST | Recalculate shipping |
| `/api/checkout/validate` | POST | Pre-payment validation |
| `/api/create-payment-intent` | POST | Stripe payment intent |
| `/api/orders` | POST | Create order after payment |
| `/api/orders/[id]` | GET | Get order details |

### Already Provided (Supabase Edge Functions)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/get-shipping-quote` | POST | T-Force freight quote |
| `/functions/v1/handle-new-lead` | POST | Lead capture webhook |
| `/functions/v1/handle-purchase` | POST | Post-purchase automation |

---

## 8. Error Handling

### Shipping Errors at Checkout

```typescript
const SHIPPING_ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please check your shipping address and try again.',
  INVALID_ZIP: 'We couldn\'t find that ZIP code. Please verify and try again.',
  NO_SERVICE: 'Unfortunately, we can\'t ship to this location via freight. Please call (937) 725-6790 for options.',
  RATE_LIMITED: 'We\'re experiencing high traffic. Please wait a moment and try again.',
  API_ERROR: 'We couldn\'t calculate shipping right now. You can continue and we\'ll contact you, or call (937) 725-6790.',
};

function handleShippingError(error: ShippingError) {
  const message = SHIPPING_ERROR_MESSAGES[error.type] || error.userMessage;
  
  // Show error to user
  showNotification({
    type: 'error',
    title: 'Shipping Calculation Issue',
    message,
    actions: [
      { label: 'Try Again', onClick: () => refetchQuote() },
      { label: 'Call Us', href: 'tel:+19377256790' },
    ],
  });
  
  // If it's a soft error, allow proceeding
  if (error.type === 'API_ERROR' || error.type === 'RATE_LIMITED') {
    showOption({
      label: 'Continue without confirmed shipping',
      description: 'We\'ll calculate shipping and contact you before charging.',
      onClick: () => proceedWithPendingShipping(),
    });
  }
}
```

---

## 9. Testing Checklist

### Platform Team Testing

- [ ] Session ID persists across pages
- [ ] Shipping quote from configurator appears in checkout
- [ ] Changing address triggers new quote
- [ ] Residential toggle updates total correctly
- [ ] Quote validation before payment works
- [ ] Expired quote triggers refresh
- [ ] Order stores shipping quote ID
- [ ] Pickup orders have $0 shipping
- [ ] Error states display correctly
- [ ] Phone number fallback is prominent

### Integration Testing

- [ ] Full flow: Product → Configurator → Checkout → Payment
- [ ] Quote expires between configurator and checkout
- [ ] User changes delivery method at checkout
- [ ] User changes address at checkout
- [ ] Payment fails, quote is retained
- [ ] Order confirmation shows correct shipping info

---

## 10. Analytics Events

Track these events for optimization:

```typescript
const CHECKOUT_EVENTS = {
  // Shipping
  'shipping_quote_requested': { zip, product, source },
  'shipping_quote_received': { quoteId, rate, transitDays },
  'shipping_quote_error': { errorType, zip },
  'residential_upgrade_selected': { quoteId, additionalCost },
  'delivery_method_changed': { from, to },
  
  // Checkout
  'checkout_started': { cartValue, hasShippingQuote },
  'checkout_shipping_step': { hasPrefilledAddress },
  'checkout_payment_step': { totalValue },
  'checkout_completed': { orderId, totalValue, shippingCost },
  'checkout_abandoned': { step, cartValue },
};
```

---

## Summary

This specification provides:

1. **Seamless data flow** from configurator to checkout
2. **Quote persistence** via session + database
3. **Real-time quote validation** before payment
4. **Graceful error handling** with phone fallback
5. **Complete order tracking** with shipping quote reference

The platform team can implement this as a tenant-specific checkout flow for EZ Cycle Ramp while maintaining the multi-tenant architecture.
