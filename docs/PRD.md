# Product Requirements Document - EZCR

> **Last Updated:** 2026-01-07
> **Status:** Living Document
> **Version:** 1.0.0

## 1. Executive Summary

### 1.1 Product Vision

EZCR (EZCycleramp) is a premium e-commerce platform specializing in motorcycle loading ramps for pickup trucks. The platform serves motorcycle enthusiasts who need reliable, compatible ramp systems for transporting their bikes in truck beds.

### 1.2 Key Differentiator

The **Unified Fitment Engine (UFE)** - a sophisticated configurator that ensures vehicle and ramp compatibility before purchase, eliminating the #1 source of returns and customer frustration in the industry.

### 1.3 Target Market

- Motorcycle enthusiasts with pickup trucks
- Price point: $2,500 - $4,000+ per ramp system
- High-consideration purchase requiring trust and expert guidance

### 1.4 Business Goals

1. Reduce returns through accurate fitment recommendations
2. Increase conversion through premium UX patterns
3. Build trust for high-value purchases
4. Streamline the configuration-to-checkout flow

---

## 2. Product Catalog

### 2.1 Ramp Models

| Model | SKU | Price | Key Feature | Best For |
|-------|-----|-------|-------------|----------|
| AUN210 | AUN210 | $2,495 | Tailgate closure with motorcycle loaded | Long beds |
| AUN250 | AUN250 | $2,795 | Folding design | Short/standard beds |

### 2.2 Accessories

| ID | Name | Price | Type | Required When |
|----|------|-------|------|---------------|
| AC004 | Tailgate Extension | TBD | tailgate-extension | AUN210 with tailgate close requirement |
| 4-BEAM | 4-Beam Extension | TBD | bed-extension | AUN250 with long beds |
| AC001-1 | Height Extension 1 | TBD | height-extension | Based on tailgate height |
| AC001-2 | Height Extension 2 | TBD | height-extension | Based on tailgate height |
| AC001-3 | Height Extension 3 | TBD | height-extension | Based on tailgate height |
| AC012 | Accessory | TBD | accessory | Optional |

### 2.3 Bed Length Categories

| Category | Range (inches) | Primary Ramp | Alternative |
|----------|----------------|--------------|-------------|
| Short | < 66" | AUN250 | AUN210 |
| Standard | 66" - 76" | AUN250 | AUN210 |
| Long | > 76" | AUN210 | AUN250 (with 4-BEAM) |

---

## 3. Unified Fitment Engine (UFE)

### 3.1 Architecture Overview

```
src/lib/ufe/
├── types.ts              # All TypeScript types
├── config/               # Ramp configs, settings
├── engines/
│   ├── bed-length.engine.ts    # Bed categorization
│   ├── tailgate.engine.ts      # Tailgate compatibility
│   ├── ramp-selector.engine.ts # Main recommendation logic
│   ├── accessory.engine.ts     # Required accessories
│   └── angle.engine.ts         # Loading angle calculation
├── wizards/
│   ├── quick-wizard.controller.ts
│   └── advanced-wizard.controller.ts
└── hooks/
    ├── useQuickWizard.ts
    └── useAdvancedWizard.ts
```

### 3.2 Two-Tier Configurator Design

| Feature | Quick Ramp Finder | Full Configurator |
|---------|-------------------|-------------------|
| Time | < 1 minute | 3-5 minutes |
| Input | Categorical choices | Precise measurements |
| Output | Ramp recommendation | Full quote + accessories |
| Use case | Initial research | Pre-purchase validation |
| Accessories | Not determined | Calculated |

### 3.3 Quick Wizard Flow

**Question Sequence:**
1. `bedLength` - "What's your truck bed length?" (short/standard/long/unsure)
2. `hasTonneau` - "Does your truck have a tonneau cover?" (yes/no)
3. `tonneauType` - [Conditional] Type of cover
4. `rollDirection` - [Conditional] Roll direction for roll-up covers
5. `tailgateMustClose` - "Does your tailgate need to close?"
6. `motorcycleLoadedWhenClosed` - [Conditional] With motorcycle loaded?

**Decision Logic:**
```typescript
// If 'unsure' about bed length → AUN250 (safe default)
// If tailgateMustClose + motorcycleLoadedWhenClosed → AUN210 only
// If tailgateMustClose + !motorcycleLoadedWhenClosed → AUN250 (folds)
// Short bed → AUN250
// Long bed → AUN210
// Standard bed → AUN250 (with AUN210 alternative)
```

### 3.4 Advanced Wizard Inputs

**Truck Measurements:**
- `bedLengthClosed` - Bed length with tailgate closed (inches)
- `bedLengthWithTailgate` - Total length including open tailgate (inches)
- `tailgateHeight` - Top of open tailgate height from ground (inches)
- `hasTonneau` / `tonneauType` / `rollDirection`

**Motorcycle Measurements:**
- `weight` - Motorcycle weight (lbs)
- `wheelbase` - Motorcycle wheelbase (inches)
- `totalLength` - Total motorcycle length (inches)

### 3.5 Decision Priority Order

1. **Safety considerations** - Hard failures for incompatible configurations
2. **Tailgate closure requirements** - Highest priority user requirement
3. **Usable bed length calculation** - After tonneau penalty
4. **Tonneau penalty application** - X inches reduction
5. **Ramp geometry compatibility** - Physical fit verification
6. **Required accessories** - Auto-calculated based on configuration
7. **Angle warnings** - Soft warnings for steep angles
8. **User preferences** - Tie-breaker

### 3.6 Business Rules

| Rule | Logic | Threshold |
|------|-------|-----------|
| Bed Categorization | short < 66", standard 66-76", long > 76" | Configurable |
| Tonneau Penalty | Reduces usable bed length | X inches |
| 4-Beam Threshold | Required when bedLengthWithTailgate exceeds | Configurable |
| Tailgate Close Buffer | Motorcycle + buffer must fit in usable bed | X inches |
| Hard Failure | motorcycle + buffer > usableBedLength when tailgate must close loaded | N/A |

### 3.7 UFE Result Structure

```typescript
interface UFEResult {
  success: boolean;
  failure?: UFEFailure;              // Hard/soft failure details
  primaryRecommendation?: RampRecommendation;
  alternativeRecommendation?: RampRecommendation;
  calculatedValues: CalculatedValues;
  tonneauNotes?: string[];
  angleWarning?: string;
  timestamp: string;
  inputHash: string;
}
```

---

## 4. Checkout & Order Management

### 4.1 Cart Flow

1. Add to cart (product + configuration)
2. Inventory validation
3. Price calculation (subtotal + tax + shipping)
4. Stripe checkout session creation
5. Payment processing
6. Order confirmation

### 4.2 Pricing Structure

| Component | Value |
|-----------|-------|
| Tax Rate | 8% |
| Shipping | $50.00 (fixed) |
| Free Shipping Threshold | None |
| Currency | USD |

### 4.3 Order Number Format

```
EZCR-YYYYMMDD-XXXXX
```

Generated via `generate_order_number` RPC function with tenant prefix.

### 4.4 Order Status Lifecycle

```
pending → confirmed → processing → shipped → delivered
                   ↘ cancelled
```

### 4.5 Stripe Integration

- **Checkout Sessions** - Payment collection
- **Webhooks** - Order confirmation, payment events
- **Metadata** - order_id, order_number, tenant_id

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy (Lowest to Highest)

| Level | Role | Description |
|-------|------|-------------|
| 0 | customer | Public customer with order access |
| 1 | viewer | Read-only access to CRM |
| 2 | customer_service | View and edit customers and orders |
| 3 | admin | Full CRM access, cannot manage users |
| 4 | owner | Full access including user management |

### 5.2 Permission Matrix

| Action | customer | viewer | cs | admin | owner |
|--------|----------|--------|-------|-------|-------|
| View own orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all orders | ✗ | ✓ | ✓ | ✓ | ✓ |
| Edit CRM data | ✗ | ✗ | ✓ | ✓ | ✓ |
| Delete CRM data | ✗ | ✗ | ✗ | ✓ | ✓ |
| View team | ✗ | ✗ | ✗ | ✓ | ✓ |
| Invite team | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |

### 5.3 Permission Functions

```typescript
hasPermission(userRole, requiredRole)  // Role hierarchy check
canManageUser(managerRole, targetRole) // User management
canAccessCRM(userRole)                 // CRM feature gate
canEditCRM(userRole)                   // Edit permission
canDeleteCRM(userRole)                 // Delete permission
```

---

## 6. Premium UX Patterns

### 6.1 Trust Indicators

Display prominently above fold and near CTAs:
- Lifetime Warranty
- Free Shipping
- Expert Support
- 4.9/5 Rating

### 6.2 Expert Consultation CTAs

Multiple touchpoints for human assistance:
- "Schedule a Call" button
- Phone number prominently displayed (800-687-4410)
- Available at every step of configurator

### 6.3 Progressive Disclosure

```
Quick Finder (30 sec) → Full Configurator (3 min) → Expert Consultation
     ↓                         ↓                          ↓
 Recommendation            Full Quote               Custom Solution
```

### 6.4 Brand Colors

```css
/* Primary - Action/CTA */
--ezcr-orange: #F78309;
--ezcr-orange-hover: #e07308;

/* Secondary - Info/Links */
--ezcr-blue: #0B5394;

/* Status */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
```

### 6.5 Help-Before-Commitment Pattern

Show help options BEFORE checkout, not after frustration:
- Measurement validation tips
- "Need help deciding?" prompts
- "Before You Purchase" notes with requirements

---

## 7. Database Schema

### 7.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| tenants | Multi-tenant isolation | id, slug, name, settings |
| products | Product catalog | sku, name, base_price, specifications |
| product_categories | Product organization | slug, name, display_order |
| product_images | Product media | url, alt_text, is_primary |
| product_variants | Product variations | sku, price_modifier |
| orders | Transactions | order_number, status, total_amount |
| order_items | Line items | product_id, quantity, unit_price |
| shopping_cart | Cart state | session_id, product_id, configuration |
| user_profiles | Customer data | email, role, metadata |
| product_configurations | Saved configs | configuration (JSONB), calculated_price |
| product_waitlist | Coming soon signups | email, prepayment_amount, status |

### 7.2 Key Patterns

- **UUID primary keys** everywhere
- **tenant_id foreign key** on all tenant-specific tables
- **RLS policies** for tenant isolation
- **JSONB columns** for extensible data (specifications, configuration, metadata)
- **Timestamps** (created_at, updated_at) on all tables

---

## 8. API Endpoints

### 8.1 Configurator

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/configurations | Save configuration |
| GET | /api/configurations/[id] | Get saved configuration |

### 8.2 Cart & Checkout

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/stripe/checkout | Create checkout session |
| POST | /api/webhooks/stripe | Handle Stripe webhooks |

### 8.3 Products

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/products | List products |
| GET | /api/products/[slug] | Get product details |

### 8.4 Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/admin/orders | List orders |
| GET | /api/admin/customers | List customers |
| GET | /api/admin/inventory | Inventory management |

---

## 9. Third-Party Integrations

### 9.1 Stripe

- **Purpose:** Payment processing
- **Features:** Checkout sessions, webhooks, payment intents
- **Configuration:** `src/lib/stripe/config.ts`

### 9.2 Supabase

- **Purpose:** Database, authentication, RLS
- **Clients:** Server (authenticated), Service (admin), Browser
- **Configuration:** `src/lib/supabase/`

### 9.3 TForce

- **Purpose:** Shipping quotes and tracking
- **Features:** Terminal delivery, transit time estimation

### 9.4 Twilio

- **Purpose:** SMS communications
- **Features:** Order notifications, shipping updates

### 9.5 Mailgun

- **Purpose:** Email communications
- **Features:** Order confirmations, marketing

---

## 10. Environment Configuration

### 10.1 Tenant Slugs

| Environment | Tenant Slug |
|-------------|-------------|
| Development | ezcr-dev |
| Staging | ezcr-staging |
| Production | ezcr-01 |

### 10.2 Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Tenant
NEXT_PUBLIC_TENANT_SLUG=

# Shipping
TFORCE_API_KEY=

# Communications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
MAILGUN_API_KEY=
```

---

## 11. Technical Specifications

### 11.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth | Supabase Auth |
| Payments | Stripe |
| Deployment | Coolify on Hetzner |

### 11.2 Key Files Reference

| Purpose | Path |
|---------|------|
| UFE Types | `src/lib/ufe/types.ts` |
| Ramp Selection Logic | `src/lib/ufe/engines/ramp-selector.engine.ts` |
| Permissions | `src/lib/permissions.ts` |
| Stripe Checkout | `src/app/api/stripe/checkout/route.ts` |
| Database Schema | `supabase/migrations/00001_initial_schema.sql` |
| Skills | `.skills/` |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| UFE | Unified Fitment Engine - the configurator system |
| AUN210 | Non-folding ramp model for long beds |
| AUN250 | Folding ramp model for short/standard beds |
| 4-BEAM | Bed extension accessory for AUN250 with long beds |
| AC004 | Tailgate extension for AUN210 |
| Tonneau | Truck bed cover that reduces usable bed length |
| Hard Failure | Configuration that cannot work (e.g., motorcycle too long) |
| Soft Warning | Configuration that may have issues but could work |

---

## Appendix B: Related Documentation

- **Skills:** `.skills/SKILL-REGISTRY.md`
- **Local Skills:** `.skills/local/ezcr/configurator/SKILL.md`, `.skills/local/ezcr/premium-ux/SKILL.md`
- **Platform Skills:** `.skills/platform/`
- **Project Guide:** `CLAUDE.md`
