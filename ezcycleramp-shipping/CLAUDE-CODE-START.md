# Claude Code Starter Prompt

Copy and paste this into Claude Code to begin:

---

I'm implementing the T-Force Freight shipping integration for EZ Cycle Ramp (motorcycle loading ramps e-commerce).

Please read the planning document at ./docs/MASTER-PLANNING-DOCUMENT.md

**Project Context:**
- Multi-tenant platform (NexCyte), EZ Cycle Ramp is tenant
- Products: AUN200 ($2,495) and AUN250 ($2,795)
- LTL freight via T-Force Freight from Woodstock, GA 30188
- Stack: Supabase + React/Next.js + Stripe + SendGrid + Twilio

**Files Already Created (in this project):**
- ./supabase/migrations/001_shipping_tables.sql
- ./supabase/migrations/002_orders_table.sql
- ./supabase/functions/get-shipping-quote/index.ts
- ./supabase/functions/stripe-webhook/index.ts
- ./supabase/functions/trigger-post-purchase-emails/index.ts
- ./src/components/shipping/ (React components)
- ./src/hooks/useShippingQuote.ts
- ./src/types/shipping.ts

**Files Needed (please create):**
1. ./supabase/migrations/003_scheduled_emails.sql
2. ./supabase/migrations/004_analytics_views.sql
3. ./supabase/migrations/005_test_data.sql
4. ./src/components/shipping/AnalyticsDashboard.tsx (optional)

After reviewing the planning document, confirm your understanding and we'll create each file.

---
