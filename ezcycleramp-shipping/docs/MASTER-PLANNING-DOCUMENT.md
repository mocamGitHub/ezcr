# EZ Cycle Ramp — T-Force Freight Shipping Integration
## Master Planning Document for Claude Code

**Project:** E-commerce shipping integration for premium motorcycle ramps
**Tenant:** EZ Cycle Ramp on NexCyte platform
**Status:** Core infrastructure complete, pending admin tools and test data

---

## 1. PROJECT OVERVIEW

### What We're Building
A complete T-Force Freight LTL shipping integration that:
- Calculates real-time freight quotes via T-Force Rating API
- Caches quotes for 24 hours to reduce API calls
- Integrates with product configurator (Step 4: Delivery)
- Integrates with checkout flow
- Processes Stripe payments and creates orders
- Triggers post-purchase email automation
- Provides admin dashboard for order/shipping management

### Business Context
- **Products:** AUN 200 ($2,495) and AUN 250 ($2,795) motorcycle loading ramps
- **Shipping:** LTL freight via T-Force Freight (terminal-to-terminal default)
- **Residential Delivery:** +$150 surcharge for home delivery with liftgate
- **Pickup Option:** Free pickup at Woodstock, GA warehouse
- **Target Market:** Motorcycle owners with pickup trucks, predominantly male 35-65

### Technical Stack
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Frontend:** React/Next.js with TypeScript, Tailwind CSS
- **Payments:** Stripe (Checkout Sessions + Payment Intents)
- **Email:** SendGrid (transactional templates)
- **SMS:** Twilio (pickup notifications)
- **Automation:** n8n (optional workflow alternative)

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                                FRONTEND
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   CONFIGURATOR                    CHECKOUT                    ADMIN DASHBOARD   │
│   ┌─────────────────┐            ┌─────────────────┐         ┌───────────────┐  │
│   │ Step 1: Truck   │            │ Contact Info    │         │ Orders List   │  │
│   │ Step 2: Bike    │            │ Shipping Section│◄───────►│ Shipping Mgmt │  │
│   │ Step 3: Options │            │ Payment         │         │ Analytics     │  │
│   │ Step 4: Delivery│◄──────────►│ Order Summary   │         │ Error Logs    │  │
│   └────────┬────────┘            └────────┬────────┘         └───────────────┘  │
│            │                              │                                      │
└────────────┼──────────────────────────────┼──────────────────────────────────────┘
             │                              │
             │         SESSION STORAGE      │
             │         (quote persistence)  │
             │                              │
┌────────────┼──────────────────────────────┼──────────────────────────────────────┐
│            ▼                              ▼                     SUPABASE         │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         EDGE FUNCTIONS                                   │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │   │
│   │  │ get-shipping-    │  │ stripe-webhook   │  │ trigger-post-purchase- │ │   │
│   │  │ quote            │  │                  │  │ emails                 │ │   │
│   │  │                  │  │ • payment_intent │  │                        │ │   │
│   │  │ • OAuth2 auth    │  │   .succeeded     │  │ • order_confirmation   │ │   │
│   │  │ • T-Force API    │  │ • checkout       │  │ • shipping_notification│ │   │
│   │  │ • Quote caching  │  │   .session       │  │ • delivery_confirmation│ │   │
│   │  │ • Error notify   │  │   .completed     │  │ • pickup_ready         │ │   │
│   │  │                  │  │ • Create order   │  │ • review_request       │ │   │
│   │  │                  │  │ • Convert lead   │  │ • installation_tips    │ │   │
│   │  └────────┬─────────┘  └────────┬─────────┘  └───────────┬────────────┘ │   │
│   └───────────┼─────────────────────┼────────────────────────┼──────────────┘   │
│               │                     │                        │                   │
│   ┌───────────┼─────────────────────┼────────────────────────┼──────────────┐   │
│   │           ▼                     ▼                        ▼    DATABASE  │   │
│   │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐   │   │
│   │  │ shipping_quotes │   │ orders          │   │ configurator_leads  │   │   │
│   │  │ shipping_errors │   │ scheduled_emails│   │ lead_sequences      │   │   │
│   │  │ shipping_addrs  │   │ payment_failures│   │ email_log           │   │   │
│   │  └─────────────────┘   └─────────────────┘   └─────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                     │
│                                                                                  │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│   │ T-FORCE       │  │ STRIPE        │  │ SENDGRID      │  │ TWILIO        │   │
│   │ FREIGHT API   │  │               │  │               │  │               │   │
│   │               │  │ • Payments    │  │ • Email       │  │ • SMS         │   │
│   │ • Rating API  │  │ • Webhooks    │  │ • Templates   │  │ • Pickup      │   │
│   │ • OAuth2      │  │               │  │               │  │   alerts      │   │
│   └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FILE INVENTORY

### Completed Files (Ready for Deployment)

| # | File | Type | Purpose | Lines |
|---|------|------|---------|-------|
| 1 | `database-migrations.sql` | SQL | Shipping tables schema | ~200 |
| 2 | `database-orders-migration.sql` | SQL | Orders table schema | ~300 |
| 3 | `supabase-get-shipping-quote.ts` | Edge Fn | T-Force API integration | ~500 |
| 4 | `supabase-stripe-webhook.ts` | Edge Fn | Payment processing | ~450 |
| 5 | `supabase-post-purchase-emails.ts` | Edge Fn | Email automation | ~500 |
| 6 | `configurator-shipping-step.tsx` | React | Configurator Step 4 | ~450 |
| 7 | `checkout-shipping-section.tsx` | React | Checkout shipping UI | ~400 |
| 8 | `use-shipping-quote.ts` | React | Reusable hook | ~200 |
| 9 | `n8n-workflow-shipping-quote.json` | n8n | Alternative workflow | ~300 |
| 10 | `TFORCE-SHIPPING-SETUP.md` | Docs | Setup guide | ~600 |
| 11 | `PLATFORM-CHECKOUT-INTEGRATION.md` | Docs | Platform spec | ~700 |

### Files to Create

| # | File | Type | Purpose | Priority |
|---|------|------|---------|----------|
| 12 | `analytics-dashboard-queries.sql` | SQL | Admin views & queries | HIGH |
| 13 | `test-data-setup.sql` | SQL | Development test data | HIGH |
| 14 | `analytics-dashboard-component.tsx` | React | Admin dashboard UI | MEDIUM |
| 15 | `scheduled-emails-migration.sql` | SQL | Scheduled emails table | HIGH |

---

## 4. DATABASE SCHEMA

### Table: shipping_quotes
```sql
- id (UUID, PK)
- quote_id (TEXT, unique) — e.g., "EZC-ABC123-XYZ"
- destination_zip (TEXT)
- destination_city (TEXT)
- destination_state (TEXT)
- is_residential (BOOLEAN)
- product_sku (TEXT) — "AUN200" or "AUN250"
- base_rate (DECIMAL)
- residential_surcharge (DECIMAL)
- total_rate (DECIMAL)
- origin_terminal_code (TEXT)
- destination_terminal_code (TEXT)
- destination_terminal_name (TEXT)
- tforce_quote_id (TEXT)
- transit_days (INTEGER)
- valid_until (TIMESTAMPTZ)
- source (TEXT) — "configurator" or "checkout"
- lead_id (UUID, FK)
- created_at (TIMESTAMPTZ)
```

### Table: orders
```sql
- id (UUID, PK)
- order_number (TEXT, unique) — e.g., "EZC-20241205-AB12"
- customer_email (TEXT)
- customer_phone (TEXT)
- customer_name (TEXT)
- status (TEXT) — pending/processing/shipped/delivered/cancelled/refunded
- product_sku (TEXT)
- product_name (TEXT)
- product_price (DECIMAL)
- quantity (INTEGER)
- delivery_method (TEXT) — "shipping" or "pickup"
- shipping_quote_id (TEXT, FK)
- shipping_cost (DECIMAL)
- shipping_address (JSONB)
- destination_terminal (JSONB)
- estimated_transit_days (INTEGER)
- billing_address (JSONB)
- payment_intent_id (TEXT)
- payment_method (TEXT)
- payment_status (TEXT)
- subtotal (DECIMAL)
- shipping_total (DECIMAL)
- tax_total (DECIMAL)
- grand_total (DECIMAL)
- lead_id (UUID, FK)
- session_id (TEXT)
- utm_source/medium/campaign (TEXT)
- shipped_at (TIMESTAMPTZ)
- tracking_number (TEXT)
- carrier (TEXT)
- delivered_at (TIMESTAMPTZ)
- pickup_ready_at (TIMESTAMPTZ)
- picked_up_at (TIMESTAMPTZ)
- order_confirmation_sent_at (TIMESTAMPTZ)
- shipping_notification_sent_at (TIMESTAMPTZ)
- review_request_sent_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table: shipping_errors
```sql
- id (UUID, PK)
- destination_zip (TEXT)
- product_sku (TEXT)
- source (TEXT)
- error_type (TEXT) — API_ERROR, INVALID_ZIP, RATE_LIMITED, etc.
- error_message (TEXT)
- tforce_response (JSONB)
- support_notified_at (TIMESTAMPTZ)
- resolved_at (TIMESTAMPTZ)
- resolution_notes (TEXT)
- user_email (TEXT)
- session_id (TEXT)
- created_at (TIMESTAMPTZ)
```

### Table: scheduled_emails (TO CREATE)
```sql
- id (UUID, PK)
- order_id (UUID, FK)
- email_type (TEXT) — review_request, installation_tips
- scheduled_for (TIMESTAMPTZ)
- status (TEXT) — pending, sent, failed, cancelled
- sent_at (TIMESTAMPTZ)
- error (TEXT)
- created_at (TIMESTAMPTZ)
```

---

## 5. FREIGHT SPECIFICATIONS

### Products

| SKU | Name | Price | Weight | Pallet Dimensions | Freight Class |
|-----|------|-------|--------|-------------------|---------------|
| AUN200 | EZ Cycle Ramp AUN 200 | $2,495 | 300 lbs | 96" × 48" × 12" | 125 |
| AUN250 | EZ Cycle Ramp AUN 250 | $2,795 | 350 lbs | 84" × 48" × 14" | 125 |

### Shipping Configuration

| Setting | Value |
|---------|-------|
| Origin ZIP | 30188 (Woodstock, GA) |
| Carrier | T-Force Freight |
| Service Code | 308 (LTL Standard) |
| Residential Surcharge | $150 |
| Quote Validity | 24 hours |
| Pickup Location | 2500 Continental Blvd, Woodstock, GA 30188 |

### T-Force API Details

| Item | Value |
|------|-------|
| Base URL | https://api.tforcefreight.com/rating |
| Auth | OAuth2 (Microsoft Identity Platform) |
| Endpoint | POST /getRate |
| Test Version | api-version=cie-v1 |
| Prod Version | api-version=v1 |

---

## 6. EXECUTION PLAN

### Phase 1: Database Setup
**Order:** Run these SQL files in Supabase SQL Editor

1. `database-migrations.sql` — Creates shipping_quotes, shipping_errors, shipping_addresses
2. `database-orders-migration.sql` — Creates orders table with triggers
3. `scheduled-emails-migration.sql` — Creates scheduled_emails table (TO CREATE)
4. `analytics-dashboard-queries.sql` — Creates admin views (TO CREATE)
5. `test-data-setup.sql` — Inserts sample data for testing (TO CREATE)

### Phase 2: Edge Function Deployment
**Order:** Deploy via Supabase CLI

1. `supabase functions deploy get-shipping-quote`
2. `supabase functions deploy stripe-webhook`
3. `supabase functions deploy trigger-post-purchase-emails`

**Secrets to set:**
```bash
supabase secrets set TFORCE_CLIENT_ID=xxx
supabase secrets set TFORCE_CLIENT_SECRET=xxx
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set SENDGRID_API_KEY=SG.xxx
supabase secrets set TWILIO_ACCOUNT_SID=xxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
supabase secrets set TWILIO_FROM_NUMBER=+1xxx
supabase secrets set SUPPORT_PHONE=+19377256790
supabase secrets set SUPPORT_EMAIL=support@ezcycleramp.com
```

### Phase 3: Frontend Integration
**Order:** Integrate React components

1. Add `use-shipping-quote.ts` hook to project
2. Integrate `ConfiguratorShippingStep` into configurator
3. Integrate `CheckoutShippingSection` into checkout
4. Add `AnalyticsDashboard` to admin area (TO CREATE)

### Phase 4: External Service Configuration

1. **T-Force Freight:** Register developer account, wait for approval (1-5 days), configure OAuth
2. **Stripe:** Configure webhook endpoint pointing to Edge Function
3. **SendGrid:** Create email templates, get template IDs
4. **Twilio:** Configure phone number for SMS

### Phase 5: Testing

1. Test shipping quotes in CIE environment
2. Test Stripe webhook with test payments
3. Test email triggers
4. Test full checkout flow
5. Switch to production API

---

## 7. FILES TO CREATE — DETAILED REQUIREMENTS

### File 12: analytics-dashboard-queries.sql

**Purpose:** SQL views and queries for admin dashboard

**Required Views:**

```
v_orders_overview
- Total orders, revenue, avg order value (today, this week, this month)

v_orders_pending_shipment
- Orders with status='processing', delivery_method='shipping', shipped_at IS NULL
- Days since order, customer info, shipping address

v_orders_ready_for_pickup
- Orders with delivery_method='pickup', pickup_ready_at IS NOT NULL, picked_up_at IS NULL
- Days waiting, customer contact info

v_orders_by_status
- Count and revenue by status

v_daily_revenue
- Date, order count, product revenue, shipping revenue, total revenue
- Grouped by day for last 90 days

v_weekly_revenue
- Week, order count, revenue, growth % vs prior week

v_monthly_revenue
- Month, order count, revenue, growth % vs prior month, YoY comparison

v_shipping_performance
- Avg days from order to ship
- Avg days from ship to deliver
- On-time delivery percentage
- By week for trending

v_shipping_quotes_analytics
- Quotes by ZIP prefix (first 3 digits)
- Conversion rate (quotes that became orders)
- Avg rates by region

v_lead_conversion_funnel
- Configurator completions → Leads captured → Orders placed
- Conversion rates at each step
- By week for trending

v_error_log_summary
- Errors grouped by type
- Count by day
- Unresolved errors needing attention

v_customer_geography
- Orders by state
- Revenue by state
- Shipping vs pickup by region

v_product_performance
- Orders by product SKU
- Revenue by product
- Delivery method preference by product
```

**Required Indexes:**
- Optimize for common dashboard queries
- Partial indexes for status-based filters

### File 13: test-data-setup.sql

**Purpose:** Realistic sample data for development/testing

**Requirements:**

```
shipping_quotes (10 records)
- Various ZIPs: 90210 (CA), 75001 (TX), 10001 (NY), 33101 (FL), 98101 (WA), 60601 (IL), 30301 (GA), 85001 (AZ), 80201 (CO), 97201 (OR)
- Mix: 5 AUN200, 5 AUN250
- Mix: 6 terminal, 4 residential
- Mix: 8 valid, 2 expired
- Realistic rates: $200-$450 range
- Various transit days: 3-8 days

orders (15 records)
- Statuses: 3 pending, 3 processing, 4 shipped, 3 delivered, 1 cancelled, 1 pickup completed
- Delivery methods: 12 shipping, 3 pickup
- Dates: Spread over last 60 days
- Realistic names, emails, addresses
- Link some to shipping_quotes
- Link some to configurator_leads
- Various payment methods

configurator_leads (10 records)
- Mix: 5 converted (have orders), 5 unconverted
- Various recommendations: AUN200, AUN250, custom
- Various dates over last 90 days
- Realistic emails

shipping_errors (5 records)
- Types: API_ERROR, INVALID_ZIP, RATE_LIMITED, NO_SERVICE, CONFIG_ERROR
- Mix: 3 resolved, 2 unresolved
- Various dates

scheduled_emails (5 records)
- Types: 3 review_request, 2 installation_tips
- Mix: 2 pending (future), 2 sent, 1 failed
- Link to orders
```

### File 14: analytics-dashboard-component.tsx (Optional)

**Purpose:** React component for admin dashboard

**Requirements:**
- Today's metrics card (orders, revenue)
- Pending actions card (orders to ship, pickups waiting)
- Week-over-week comparison
- Quick filter links
- Responsive design
- Uses existing Tailwind styling

### File 15: scheduled-emails-migration.sql

**Purpose:** Table for scheduled email queue

**Schema:**
```sql
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  email_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. ENVIRONMENT VARIABLES

### Required for Deployment

```bash
# Supabase (auto-configured)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# T-Force Freight
TFORCE_CLIENT_ID=your_oauth_client_id
TFORCE_CLIENT_SECRET=your_oauth_client_secret
TFORCE_ACCOUNT_NUMBER=your_account_number

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-xxx
SENDGRID_TEMPLATE_SHIPPING=d-xxx
SENDGRID_TEMPLATE_DELIVERED=d-xxx
SENDGRID_TEMPLATE_PICKUP_READY=d-xxx
SENDGRID_TEMPLATE_REVIEW_REQUEST=d-xxx
SENDGRID_TEMPLATE_INSTALLATION=d-xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890

# Support
SUPPORT_PHONE=+19377256790
SUPPORT_EMAIL=support@ezcycleramp.com

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
N8N_ORDER_WEBHOOK_URL=https://n8n.example.com/webhook/order
```

---

## 9. TESTING CHECKLIST

### Database
- [ ] All tables created without errors
- [ ] Foreign key relationships work
- [ ] Triggers fire correctly (order number generation, lead conversion)
- [ ] RLS policies allow service role access
- [ ] Test data inserts successfully
- [ ] Views return expected data

### Shipping Quotes
- [ ] API returns quotes for valid ZIPs
- [ ] Quotes cached correctly (same ZIP returns cached)
- [ ] Expired quotes refresh
- [ ] Residential surcharge applied
- [ ] Error notifications sent (SMS + Email)
- [ ] Invalid ZIP handled gracefully

### Checkout
- [ ] Quote persists from configurator to checkout
- [ ] Address changes trigger re-quote
- [ ] Residential toggle updates total
- [ ] Quote validated before payment
- [ ] Pickup option shows $0 shipping

### Payments
- [ ] Stripe webhook receives events
- [ ] Order created on successful payment
- [ ] Lead marked as converted
- [ ] Email sequences stopped for converted leads
- [ ] Order confirmation email sent

### Post-Purchase
- [ ] Shipping notification sent when tracking added
- [ ] Delivery confirmation sent when delivered
- [ ] Pickup ready notification sent (email + SMS)
- [ ] Review request scheduled for 7 days post-delivery
- [ ] Scheduled emails processed by cron

### Admin Dashboard
- [ ] Views return correct data
- [ ] Pending shipments list accurate
- [ ] Revenue calculations correct
- [ ] Error log shows unresolved issues

---

## 10. DEPLOYMENT SEQUENCE

### Step 1: Prepare Database (Supabase SQL Editor)
```
1. Run database-migrations.sql
2. Run database-orders-migration.sql
3. Run scheduled-emails-migration.sql
4. Run analytics-dashboard-queries.sql
5. Verify all tables and views created
```

### Step 2: Deploy Edge Functions (Terminal)
```bash
# Navigate to project
cd your-project

# Deploy functions
supabase functions deploy get-shipping-quote
supabase functions deploy stripe-webhook
supabase functions deploy trigger-post-purchase-emails

# Set secrets
supabase secrets set TFORCE_CLIENT_ID=xxx
# ... (all secrets)
```

### Step 3: Configure Stripe Webhook
```
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://xxx.supabase.co/functions/v1/stripe-webhook
3. Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
4. Copy webhook secret to Supabase secrets
```

### Step 4: Configure SendGrid Templates
```
1. Create 6 dynamic templates in SendGrid
2. Copy template IDs to Supabase secrets
3. Test each template with sample data
```

### Step 5: Test in CIE Environment
```
1. Change API version to cie-v1 in Edge Function
2. Test shipping quotes with various ZIPs
3. Test full checkout flow with Stripe test mode
4. Verify all emails send correctly
```

### Step 6: Go Live
```
1. Register T-Force production account (if not done)
2. Change API version to v1
3. Switch Stripe to live mode
4. Monitor first 10 orders closely
```

---

## 11. SUPPORT INFORMATION

| Resource | Contact |
|----------|---------|
| T-Force API Support | groundfreightapisupport@tforcefreight.com |
| T-Force Customer Service | 1-800-333-7400 |
| EZ Cycle Ramp Support | (937) 725-6790 |
| EZ Cycle Ramp Email | support@ezcycleramp.com |

---

## END OF MASTER PLANNING DOCUMENT
