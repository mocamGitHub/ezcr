# Tenant Site Template

> **Tier:** Template (Tier 2)
> **Applies To:** E-commerce tenant sites (ezcr, future tenants)
> **Inherits From:** All platform/* skills
> **Override Policy:** EXTEND
> **Version:** 1.0.0

## Purpose

Patterns for e-commerce tenant sites within the NexCyte platform. Provides customization points while maintaining platform consistency.

## Inheritance

**Inherits From:**
- platform/supabase-patterns (LOCKED)
- platform/security-standards (LOCKED)
- platform/api-design (EXTEND)
- platform/multi-tenant (LOCKED)

**Extended By:**
- local/ezcr/* skills

## Customization Points

| Section | Override Policy | Tenant Can |
|---------|-----------------|------------|
| Product schema extensions | EXTEND | Add JSONB fields |
| Checkout flow | EXTEND | Add steps, not remove |
| Pricing logic | OVERRIDE | Full control |
| Business rules | OVERRIDE | Full control |
| UI components | OVERRIDE | Full control |
| Email templates | OVERRIDE | Full control |

## E-Commerce Patterns

### 1. Product Schema Extensions

**Tenants can add custom fields via JSONB:**

```sql
-- Base product table (from platform)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  -- Extensible via JSONB
  specifications JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- EZCR uses specifications for:
-- { "weight_capacity": 1200, "folding": true, "compatible_beds": ["short", "standard"] }
```

### 2. Order Processing Flow

```
Cart -> Checkout -> Stripe -> Webhook -> Order Created -> Inventory Updated
                    |
              Payment Failed -> Notify Customer
```

**Standard hooks available:**
- `beforeCheckout` - Validate cart, check inventory
- `afterPayment` - Create order, send confirmation
- `onShipment` - Update tracking, notify customer

### 3. Inventory Management

```typescript
// Check inventory before checkout
for (const item of cartItems) {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name, inventory_count, sku')
    .eq('id', item.productId)
    .single()

  if (product.inventory_count < item.quantity) {
    errors.push(`Insufficient stock for ${product.name}`)
  }
}
```

### 4. Price Calculation

```typescript
// Standard calculation (can be overridden)
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
const taxAmount = Math.round(subtotal * TAX_RATE)
const shippingAmount = SHIPPING_COST
const total = subtotal + taxAmount + shippingAmount
```

## Required Tables for Tenants

```sql
-- Minimum tables every tenant needs
products           -- Product catalog
product_categories -- Organization
product_images     -- Media
orders             -- Transactions
order_items        -- Line items
shopping_cart      -- Cart state
user_profiles      -- Customer data
```

## Checklist for New Tenants

- [ ] Tenant record created in tenants table
- [ ] Environment variables configured
- [ ] Product categories seeded
- [ ] Payment integration configured
- [ ] Email templates customized
- [ ] Shipping calculator implemented
