# Next Steps: Complete Stripe Integration

Your Stripe payment integration is **fully coded and ready to test**. Here's what you need to do to make it work:

## Step 1: Add Stripe API Keys (5 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy these keys and add them to `.env.local`:

```bash
# Replace these empty values in .env.local:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 2: Apply Database Migration (2 minutes)

The migration adds the `stripe_checkout_session_id` column to your orders table.

**Option A: Via Supabase Dashboard** (Recommended)
1. Go to https://supabase.nexcyte.com (your VPS instance)
2. Navigate to SQL Editor
3. Run this SQL from `supabase/migrations/00006_add_stripe_session.sql`:

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
ON orders(stripe_checkout_session_id);

COMMENT ON COLUMN orders.stripe_checkout_session_id
IS 'Stripe Checkout Session ID for tracking payment sessions';
```

## Step 3: Set Up Webhook Secret (Development Only - 5 minutes)

For local testing, you need the Stripe CLI:

```bash
# Install Stripe CLI (one-time)
# Download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local dev server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Copy the webhook secret (whsec_...) it displays and add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 4: Restart Dev Server

```bash
npm run dev
```

## Step 5: Test the Checkout Flow

1. Add products to cart at http://localhost:3001/products
2. Go to checkout at http://localhost:3001/checkout
3. Fill out the form with test data
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiration date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete payment
6. You should be redirected to order confirmation page

## What's Already Complete

✅ Checkout page with customer/shipping form (`src/app/(shop)/checkout/page.tsx`)
✅ Stripe Checkout API route (`src/app/api/stripe/checkout/route.ts`)
✅ Webhook handler for payment events (`src/app/api/stripe/webhook/route.ts`)
✅ Order confirmation page (`src/app/(shop)/order-confirmation/page.tsx`)
✅ Order lookup API (`src/app/api/orders/by-session/route.ts`)
✅ Stripe configuration (`src/lib/stripe/config.ts`)
✅ Database migration script (`supabase/migrations/00006_add_stripe_session.sql`)

## Payment Flow

```
Cart → Checkout Form → Stripe Payment → Order Confirmation
  ↓         ↓              ↓                  ↓
Products   API         Webhook           Shows order
           Creates     Updates           details
           Order       Status
```

## Need Help?

- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Test Cards**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Documentation**: See `STRIPE_INTEGRATION_HANDOFF.md` and `STRIPE_SETUP.md`

## Once Testing Works

After you've successfully tested a payment, we can:
- Commit all the Stripe integration files
- Move on to the next feature (order history, email notifications, etc.)
- Set up production webhook endpoint when ready to go live

---

**Estimated time to complete**: 15 minutes
**Current blocker**: Need Stripe API keys from dashboard
