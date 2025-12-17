# EZ Cycle Ramp — Claude Code Execution Guide
## Complete Step-by-Step Instructions with Prompts

**Purpose:** This guide provides exact prompts to give Claude Code at each step of implementing the T-Force Freight shipping integration.

---

## BEFORE YOU BEGIN

### Prerequisites
1. **Claude Code installed** and working in your terminal
2. **Supabase project** created with URL and service role key
3. **Access to these files** (download from outputs or have available):
   - All `.sql` files
   - All `.ts` files
   - All `.tsx` files
   - All `.md` documentation files

### How to Use This Guide
1. Start with **Step 0** (Plan Mode Review)
2. Execute each step in order
3. Copy/paste the exact prompt provided
4. Wait for Claude Code to complete before moving to next step
5. Verify the output before proceeding

---

## STEP 0: PLAN MODE REVIEW (Optional but Recommended)

**Purpose:** Have Claude Code review the entire project plan before execution.

### Prompt for Claude Code:

```
/plan Review the T-Force Freight shipping integration project for EZ Cycle Ramp.

## Project Summary
Building LTL freight shipping integration for premium motorcycle ramps ($2,495-$2,795) on a multi-tenant e-commerce platform. Need real-time T-Force Freight quotes, order processing, and post-purchase automation.

## Technical Stack
- Backend: Supabase (PostgreSQL + Edge Functions)
- Frontend: React/Next.js with TypeScript
- Payments: Stripe
- Email: SendGrid
- SMS: Twilio

## Files Already Created (I will provide these)
1. database-migrations.sql - Shipping tables
2. database-orders-migration.sql - Orders table
3. supabase-get-shipping-quote.ts - T-Force API Edge Function
4. supabase-stripe-webhook.ts - Payment processing
5. supabase-post-purchase-emails.ts - Email automation
6. configurator-shipping-step.tsx - React component
7. checkout-shipping-section.tsx - React component
8. use-shipping-quote.ts - React hook

## Files Needed
1. scheduled-emails-migration.sql - Scheduled emails table
2. analytics-dashboard-queries.sql - Admin dashboard views
3. test-data-setup.sql - Development test data
4. analytics-dashboard-component.tsx - Admin UI (optional)

## Execution Order
1. Database migrations (in order)
2. Edge function deployment
3. Frontend integration
4. External service configuration
5. Testing

Please review this plan and confirm understanding. Then we'll proceed step-by-step.
```

---

## STEP 1: CREATE SCHEDULED EMAILS TABLE

**Purpose:** Create the missing table for scheduled email queue.

### Prompt for Claude Code:

```
Create the scheduled_emails table migration for the EZ Cycle Ramp shipping integration.

## Requirements
- Table: scheduled_emails
- Purpose: Queue emails to be sent at future times (review requests 7 days after delivery, installation tips 2 days after delivery)

## Schema
- id: UUID primary key
- order_id: UUID foreign key to orders table
- email_type: TEXT ('review_request', 'installation_tips', 'follow_up')
- scheduled_for: TIMESTAMPTZ when to send
- status: TEXT ('pending', 'sent', 'failed', 'cancelled')
- sent_at: TIMESTAMPTZ when actually sent
- error: TEXT if failed
- attempts: INTEGER default 0
- created_at: TIMESTAMPTZ

## Also Include
- Indexes for status + scheduled_for queries
- Index for order_id
- RLS policy for service role
- Function to get pending emails due for sending
- Function to mark email as sent or failed

## Output
Save as: scheduled-emails-migration.sql
```

---

## STEP 2: CREATE ANALYTICS DASHBOARD QUERIES

**Purpose:** Create SQL views for the admin dashboard.

### Prompt for Claude Code:

```
Create comprehensive analytics dashboard SQL queries for EZ Cycle Ramp admin.

## Context
- E-commerce for motorcycle ramps ($2,495-$2,795)
- Two products: AUN200 and AUN250
- Delivery methods: shipping (LTL freight) or pickup
- Order statuses: pending, processing, shipped, delivered, cancelled, refunded

## Required Views

### Operational Views
1. v_orders_pending_shipment
   - Orders needing to ship (status='processing', delivery_method='shipping', shipped_at IS NULL)
   - Include: order_number, customer_email, customer_name, product, shipping_address, days_waiting

2. v_orders_ready_for_pickup
   - Pickup orders waiting (pickup_ready_at NOT NULL, picked_up_at IS NULL)
   - Include: order_number, customer info, phone, days_waiting

3. v_orders_in_transit
   - Shipped but not delivered
   - Include: tracking_number, carrier, estimated_delivery, days_in_transit

### Revenue Views
4. v_daily_revenue (last 90 days)
   - date, order_count, product_revenue, shipping_revenue, total_revenue, avg_order_value

5. v_weekly_revenue (last 52 weeks)
   - week_start, order_count, revenue, growth_pct vs prior week

6. v_monthly_revenue (last 24 months)
   - month, order_count, revenue, growth_pct, yoy_growth_pct

### Performance Views
7. v_shipping_performance (by week)
   - avg_days_to_ship, avg_transit_days, on_time_pct, orders_shipped

8. v_shipping_quotes_analytics
   - zip_prefix (first 3 digits), quote_count, conversion_count, conversion_rate, avg_rate

9. v_lead_conversion_funnel (by week)
   - configurator_completions, leads_captured, orders_placed, lead_to_order_rate

### Support Views
10. v_error_log_summary
    - error_type, count_today, count_week, unresolved_count, last_occurrence

11. v_customer_geography
    - state, order_count, revenue, shipping_pct, pickup_pct

### Summary View
12. v_dashboard_summary
    - Single row with: today_orders, today_revenue, pending_shipments, pending_pickups, week_orders, week_revenue, month_orders, month_revenue

## Also Include
- Optimized indexes for dashboard queries
- Comments on each view explaining purpose

## Output
Save as: analytics-dashboard-queries.sql
```

---

## STEP 3: CREATE TEST DATA

**Purpose:** Create realistic test data for development.

### Prompt for Claude Code:

```
Create realistic test data for EZ Cycle Ramp shipping integration development.

## Context
- Origin: Woodstock, GA 30188
- Products: AUN200 ($2,495, 300lbs), AUN250 ($2,795, 350lbs)
- Residential surcharge: $150
- Typical shipping rates: $200-$450

## Required Test Data

### shipping_quotes (10 records)
ZIPs to use with realistic rates:
- 90210 (Beverly Hills, CA) - $385
- 75201 (Dallas, TX) - $245
- 10001 (New York, NY) - $425
- 33101 (Miami, FL) - $295
- 98101 (Seattle, WA) - $445
- 60601 (Chicago, IL) - $285
- 30301 (Atlanta, GA) - $125
- 85001 (Phoenix, AZ) - $365
- 80202 (Denver, CO) - $325
- 97201 (Portland, OR) - $415

Mix: 5 AUN200, 5 AUN250
Mix: 6 terminal-to-terminal, 4 residential (+$150)
Mix: 8 valid (future valid_until), 2 expired

### orders (15 records)
Statuses:
- 3 pending (just placed)
- 3 processing (payment confirmed, awaiting shipment)
- 4 shipped (have tracking numbers)
- 3 delivered
- 1 cancelled
- 1 pickup (picked_up_at set)

Delivery methods: 12 shipping, 3 pickup
Dates: Spread realistically over last 60 days
Use realistic fake names/emails (John Smith, jane.doe@email.com, etc.)
Link appropriate orders to shipping_quotes

### configurator_leads (10 records)
- 5 converted (have matching orders by email)
- 5 unconverted (no orders)
- Various truck/bike combinations
- Various recommended products
- Spread over last 90 days

### shipping_errors (5 records)
- 1 API_ERROR (T-Force timeout)
- 1 INVALID_ZIP (99999)
- 1 RATE_LIMITED (429 response)
- 1 NO_SERVICE (remote Alaska ZIP)
- 1 CONFIG_ERROR (missing credentials)
Mix: 3 resolved, 2 unresolved

### scheduled_emails (5 records)
- 2 review_request (1 pending future, 1 sent)
- 2 installation_tips (1 pending future, 1 sent)
- 1 failed (with error message)
Link to appropriate delivered orders

## Important
- Use realistic data that tells a story
- Dates should make sense (shipped after processing, delivered after shipped)
- Transit times should be realistic (3-8 days)
- Include order numbers in format: EZC-YYYYMMDD-XXXX

## Output
Save as: test-data-setup.sql
```

---

## STEP 4: CREATE ADMIN DASHBOARD COMPONENT (Optional)

**Purpose:** Create React component for admin dashboard UI.

### Prompt for Claude Code:

```
Create an admin dashboard React component for EZ Cycle Ramp order management.

## Technical Requirements
- React with TypeScript
- Tailwind CSS for styling
- Fetch data from Supabase views created earlier
- Dark theme (zinc-900 background, zinc-800 cards)
- Amber-500 accent color (matching brand)

## Component Structure

### AnalyticsDashboard.tsx
Main dashboard with sections:

1. **Summary Cards Row**
   - Today's Orders (count + revenue)
   - Pending Actions (shipments + pickups needing attention)
   - This Week (count + revenue with % change vs last week)
   - This Month (count + revenue with % change vs last month)

2. **Action Required Section**
   - Orders Pending Shipment (table with quick actions)
   - Pickups Ready (table with customer contact info)

3. **Performance Charts** (using recharts)
   - Daily revenue line chart (last 30 days)
   - Orders by status pie chart

4. **Quick Stats**
   - Lead conversion rate
   - Average shipping cost
   - On-time delivery rate
   - Top states by orders

## Props
```typescript
interface DashboardProps {
  supabaseUrl: string;
  supabaseKey: string;
}
```

## Features
- Auto-refresh every 5 minutes
- Loading states
- Error handling
- Responsive design
- Click rows to navigate to order detail

## Data Fetching
Use the views we created:
- v_dashboard_summary for cards
- v_orders_pending_shipment for shipments table
- v_orders_ready_for_pickup for pickups table
- v_daily_revenue for chart
- v_shipping_performance for stats

## Output
Save as: analytics-dashboard-component.tsx
```

---

## STEP 5: REVIEW ALL FILES

**Purpose:** Have Claude Code summarize all files and confirm readiness.

### Prompt for Claude Code:

```
List all files we've created for the EZ Cycle Ramp shipping integration and provide a deployment summary.

## Files to Review
1. Database migrations (SQL)
2. Edge functions (TypeScript)
3. React components (TSX)
4. Documentation (MD)

## For Each File Provide
- Filename
- Purpose (1 sentence)
- Dependencies (what it needs)
- Deployment location

## Also Provide
1. Complete deployment order (numbered steps)
2. Environment variables checklist
3. Testing checklist
4. Estimated deployment time

Format as a clean markdown document I can use as a deployment checklist.
```

---

## STEP 6: DATABASE DEPLOYMENT

**Purpose:** Deploy all database migrations in order.

### Prompt for Claude Code:

```
Provide the complete database deployment script for EZ Cycle Ramp.

## Requirements
Combine all SQL migrations into proper execution order:

1. First: Core shipping tables (shipping_quotes, shipping_errors, shipping_addresses)
2. Second: Orders table with triggers
3. Third: Scheduled emails table
4. Fourth: Analytics views
5. Fifth: Test data (wrapped in transaction, optional)

## Output Format
Create a single combined SQL file with:
- Clear section headers
- Transaction wrapping where appropriate
- IF NOT EXISTS checks to be idempotent
- Comments explaining each section
- ROLLBACK option for test data

Save as: complete-database-deployment.sql
```

---

## STEP 7: EDGE FUNCTION DEPLOYMENT COMMANDS

**Purpose:** Get exact CLI commands for Edge Function deployment.

### Prompt for Claude Code:

```
Provide the complete Supabase Edge Function deployment commands for EZ Cycle Ramp.

## Functions to Deploy
1. get-shipping-quote
2. stripe-webhook
3. trigger-post-purchase-emails

## For Each Function Provide
1. Folder structure needed
2. CLI command to create
3. CLI command to deploy
4. Required secrets with placeholder values

## Also Include
- Command to verify deployment
- Command to check logs
- Command to update an existing function
- Troubleshooting common errors

Format as a bash script with comments that I can run step-by-step.
```

---

## STEP 8: FRONTEND INTEGRATION GUIDE

**Purpose:** Get instructions for integrating React components.

### Prompt for Claude Code:

```
Provide frontend integration instructions for EZ Cycle Ramp React components.

## Components to Integrate
1. useShippingQuote hook
2. ConfiguratorShippingStep (Step 4 of configurator)
3. CheckoutShippingSection (checkout page)
4. AnalyticsDashboard (admin area)

## For Each Component Provide
1. Import statement
2. Required props with types
3. Example usage code
4. Parent component requirements
5. State management needs

## Also Include
1. Session storage setup for quote persistence
2. Supabase client configuration
3. Environment variables for frontend
4. TypeScript types file (shared types)

Format as a developer guide with code examples.
```

---

## STEP 9: TESTING SCRIPT

**Purpose:** Get comprehensive testing instructions.

### Prompt for Claude Code:

```
Create a comprehensive testing script for EZ Cycle Ramp shipping integration.

## Test Categories

### 1. Database Tests
- Verify all tables exist
- Verify all views return data
- Test triggers (order number generation, lead conversion)
- Test RLS policies

### 2. Shipping Quote Tests
- Valid ZIP returns quote
- Invalid ZIP returns error
- Quote caching works (same request returns cached)
- Expired quote refreshes
- Residential surcharge applied correctly
- Error notifications sent

### 3. Checkout Flow Tests
- Quote persists from configurator
- Address change triggers re-quote
- Pickup shows $0 shipping
- Quote validated before payment

### 4. Payment Tests
- Stripe webhook receives events
- Order created on success
- Lead converted
- Confirmation email sent

### 5. Post-Purchase Tests
- Shipping notification on tracking update
- Delivery confirmation works
- Pickup ready sends SMS
- Review request scheduled

## Output Format
Provide as a numbered checklist with:
- Test name
- Steps to execute
- Expected result
- How to verify

Save as: testing-checklist.md
```

---

## STEP 10: GO-LIVE CHECKLIST

**Purpose:** Final checklist before production launch.

### Prompt for Claude Code:

```
Create a go-live checklist for EZ Cycle Ramp shipping integration.

## Sections Needed

### Pre-Launch (1 week before)
- [ ] T-Force production credentials obtained
- [ ] Stripe live mode configured
- [ ] SendGrid templates created
- [ ] Twilio number provisioned
- etc.

### Launch Day
- [ ] Switch API from cie-v1 to v1
- [ ] Switch Stripe from test to live
- [ ] Verify webhook endpoints
- [ ] Test one real transaction
- etc.

### Post-Launch Monitoring (first week)
- [ ] Check error logs daily
- [ ] Verify emails sending
- [ ] Monitor quote success rate
- [ ] Review shipping performance
- etc.

### Rollback Plan
- Steps to revert if critical issues
- Contact information for support

Format as a printable checklist document.
Save as: go-live-checklist.md
```

---

## EXECUTION SUMMARY

| Step | Purpose | Time Est. |
|------|---------|-----------|
| 0 | Plan Review | 5 min |
| 1 | Scheduled Emails Table | 5 min |
| 2 | Analytics Queries | 15 min |
| 3 | Test Data | 15 min |
| 4 | Dashboard Component | 20 min |
| 5 | Review All Files | 5 min |
| 6 | Database Deployment | 10 min |
| 7 | Edge Function Deployment | 10 min |
| 8 | Frontend Integration | 15 min |
| 9 | Testing Script | 10 min |
| 10 | Go-Live Checklist | 5 min |

**Total Estimated Time:** ~2 hours

---

## TROUBLESHOOTING

### Claude Code Not Responding
- Check internet connection
- Restart Claude Code: `claude --restart`
- Clear context: Start new session

### SQL Errors
- Check table dependencies (run in order)
- Verify Supabase connection
- Check for existing tables with same name

### Edge Function Errors
- Verify secrets are set
- Check function logs: `supabase functions logs <name>`
- Ensure CORS headers present

### Component Errors
- Check TypeScript types match
- Verify Supabase client initialized
- Check environment variables set

---

## QUICK REFERENCE: File Locations After Completion

```
/project
├── supabase/
│   ├── migrations/
│   │   ├── 001_shipping_tables.sql
│   │   ├── 002_orders_table.sql
│   │   ├── 003_scheduled_emails.sql
│   │   ├── 004_analytics_views.sql
│   │   └── 005_test_data.sql
│   └── functions/
│       ├── get-shipping-quote/
│       │   └── index.ts
│       ├── stripe-webhook/
│       │   └── index.ts
│       └── trigger-post-purchase-emails/
│           └── index.ts
├── src/
│   ├── components/
│   │   ├── ConfiguratorShippingStep.tsx
│   │   ├── CheckoutShippingSection.tsx
│   │   └── AnalyticsDashboard.tsx
│   ├── hooks/
│   │   └── useShippingQuote.ts
│   └── types/
│       └── shipping.ts
└── docs/
    ├── TFORCE-SHIPPING-SETUP.md
    ├── PLATFORM-CHECKOUT-INTEGRATION.md
    ├── testing-checklist.md
    └── go-live-checklist.md
```
