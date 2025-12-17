# File Download Checklist

Download these files from Claude outputs and place in the correct locations:

## Documentation (-> .\docs\)
- [ ] MASTER-PLANNING-DOCUMENT.md
- [ ] CLAUDE-CODE-EXECUTION-GUIDE.md
- [ ] TFORCE-SHIPPING-SETUP.md
- [ ] PLATFORM-CHECKOUT-INTEGRATION.md

## Database Migrations (-> .\supabase\migrations\)
- [ ] database-migrations.sql -> rename to 001_shipping_tables.sql
- [ ] database-orders-migration.sql -> rename to 002_orders_table.sql

## Edge Functions
- [ ] supabase-get-shipping-quote.ts -> .\supabase\functions\get-shipping-quote\index.ts
- [ ] supabase-stripe-webhook.ts -> .\supabase\functions\stripe-webhook\index.ts
- [ ] supabase-post-purchase-emails.ts -> .\supabase\functions\trigger-post-purchase-emails\index.ts

## React Components (-> .\src\components\shipping\)
- [ ] configurator-shipping-step.tsx -> ConfiguratorShippingStep.tsx
- [ ] checkout-shipping-section.tsx -> CheckoutShippingSection.tsx

## Hooks (-> .\src\hooks\)
- [ ] use-shipping-quote.ts -> useShippingQuote.ts

## n8n (-> .\n8n-workflows\)
- [ ] n8n-workflow-shipping-quote.json -> shipping-quote-workflow.json

---

After downloading all files, run Claude Code:

```powershell
cd .\ezcycleramp-shipping
claude
```

Then paste the contents of CLAUDE-CODE-START.md
