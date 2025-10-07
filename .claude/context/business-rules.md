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
- âœ… Veteran-owned business
- âœ… BBB A+ rating
- âœ… Free shipping over $500
- âœ… 30-day money-back guarantee
- âœ… Made in USA

---

**These rules must be consistently applied across all application features.**