# EZ Cycle Ramp Shipping Integration — Quick Start

## Step 1: Run Setup Script

```bash
# Download the setup script
# (or copy from Claude outputs)

# Make executable and run
chmod +x setup-shipping-project.sh
./setup-shipping-project.sh
```

This creates:
```
ezcycleramp-shipping/
├── docs/                          ← Planning documents go here
├── supabase/
│   ├── migrations/                ← SQL files go here
│   └── functions/                 ← Edge function code goes here
├── src/
│   ├── components/shipping/       ← React components go here
│   ├── hooks/                     ← useShippingQuote goes here
│   └── types/                     ← Already has shipping.ts
├── n8n-workflows/                 ← Optional n8n workflow
├── .env.example                   ← Copy to .env, fill in values
├── CLAUDE-CODE-START.md           ← Starter prompt for Claude Code
└── DOWNLOAD-CHECKLIST.md          ← What to download where
```

---

## Step 2: Download Files from Claude

Download these from the outputs folder:

| File | Put In |
|------|--------|
| `MASTER-PLANNING-DOCUMENT.md` | `docs/` |
| `CLAUDE-CODE-EXECUTION-GUIDE.md` | `docs/` |
| `TFORCE-SHIPPING-SETUP.md` | `docs/` |
| `PLATFORM-CHECKOUT-INTEGRATION.md` | `docs/` |
| `database-migrations.sql` | `supabase/migrations/001_shipping_tables.sql` |
| `database-orders-migration.sql` | `supabase/migrations/002_orders_table.sql` |
| `supabase-get-shipping-quote.ts` | `supabase/functions/get-shipping-quote/index.ts` |
| `supabase-stripe-webhook.ts` | `supabase/functions/stripe-webhook/index.ts` |
| `supabase-post-purchase-emails.ts` | `supabase/functions/trigger-post-purchase-emails/index.ts` |
| `configurator-shipping-step.tsx` | `src/components/shipping/ConfiguratorShippingStep.tsx` |
| `checkout-shipping-section.tsx` | `src/components/shipping/CheckoutShippingSection.tsx` |
| `use-shipping-quote.ts` | `src/hooks/useShippingQuote.ts` |

---

## Step 3: Start Claude Code

```bash
cd ezcycleramp-shipping
claude
```

---

## Step 4: Paste This Prompt

```
Read ./docs/MASTER-PLANNING-DOCUMENT.md and review the T-Force Freight shipping integration project.

After reviewing, we need to create:
1. ./supabase/migrations/003_scheduled_emails.sql
2. ./supabase/migrations/004_analytics_views.sql
3. ./supabase/migrations/005_test_data.sql

Confirm your understanding of the project.
```

---

## Step 5: Follow Execution Guide

Use `./docs/CLAUDE-CODE-EXECUTION-GUIDE.md` for detailed prompts for each step.

---

## Quick Reference

| What | Where |
|------|-------|
| Full project plan | `docs/MASTER-PLANNING-DOCUMENT.md` |
| Step-by-step prompts | `docs/CLAUDE-CODE-EXECUTION-GUIDE.md` |
| T-Force API setup | `docs/TFORCE-SHIPPING-SETUP.md` |
| Platform integration | `docs/PLATFORM-CHECKOUT-INTEGRATION.md` |
| Environment variables | `.env.example` |

---

## Need Help?

- **T-Force API:** groundfreightapisupport@tforcefreight.com
- **EZ Cycle Ramp:** (937) 725-6790
