# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for your EZCR e-commerce application.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to your Supabase database
- Node.js and npm installed

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:**
- Never commit your `.env.local` file to version control
- Use test keys for development (they start with `pk_test_` and `sk_test_`)
- You'll need to get the webhook secret in Step 4

## Step 3: Apply Database Migration

The Stripe integration requires an additional column in the `orders` table. Apply the migration:

### Option A: Using Supabase CLI (if installed)
```bash
npx supabase db push
```

### Option B: Manual SQL (via Supabase Dashboard)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Add Stripe checkout session ID to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
ON orders(stripe_checkout_session_id);
```

## Step 4: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your application about payment events.

### For Development (using Stripe CLI)

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

5. Keep the Stripe CLI running while testing payments

### For Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret and add it to your production environment variables

## Step 5: Start the Development Server

```bash
npm run dev
```

Your application should now be running on http://localhost:3002 (or 3000)

## Step 6: Test the Payment Flow

1. Add products to your cart
2. Go to checkout
3. Fill in the form
4. Click "Proceed to Payment"
5. You'll be redirected to Stripe Checkout
6. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
7. Use any future expiration date (e.g., 12/34)
8. Use any 3-digit CVC
9. Use any ZIP code

## Payment Flow Overview

```
1. Customer fills checkout form
   ↓
2. App creates Stripe Checkout Session via /api/stripe/checkout
   ↓
3. Customer redirected to Stripe's hosted checkout page
   ↓
4. Customer completes payment
   ↓
5. Stripe sends webhook to /api/stripe/webhook
   ↓
6. Order status updated to "paid" in database
   ↓
7. Customer redirected to /order-confirmation
```

## Files Created/Modified

### New Files
- `src/lib/stripe/config.ts` - Stripe server configuration
- `src/lib/stripe/client.ts` - Stripe client-side helper
- `src/lib/supabase/admin.ts` - Admin client for server operations
- `src/app/api/stripe/checkout/route.ts` - Checkout session creation
- `src/app/api/stripe/webhook/route.ts` - Webhook handler
- `src/app/api/orders/by-session/route.ts` - Order lookup API
- `src/app/(shop)/order-confirmation/page.tsx` - Confirmation page
- `supabase/migrations/00006_add_stripe_session.sql` - Database migration

### Modified Files
- `src/app/(shop)/checkout/page.tsx` - Integrated with Stripe

## Troubleshooting

### "Missing Stripe keys" error
- Make sure all three environment variables are set in `.env.local`
- Restart your dev server after adding environment variables

### Webhooks not working
- Make sure Stripe CLI is running (`stripe listen --forward-to...`)
- Check that the webhook secret in `.env.local` matches the CLI output
- Verify the webhook URL is correct

### Order not found after payment
- Check that the database migration was applied
- Verify the webhook is being received (check Stripe CLI output)
- Look for errors in the server console

### Payment succeeds but order status doesn't update
- Check webhook events are being sent
- Look for errors in `/api/stripe/webhook` logs
- Verify database permissions allow updates to orders table

## Security Best Practices

1. **Never expose secret keys**: Only `NEXT_PUBLIC_*` variables are sent to the browser
2. **Verify webhook signatures**: The webhook handler validates all incoming webhooks
3. **Use HTTPS in production**: Required for PCI compliance
4. **Validate prices server-side**: Never trust prices from the client
5. **Keep Stripe.js up to date**: Updates include security patches

## Going to Production

Before going live:

1. Switch to live API keys:
   - Get live keys from Stripe Dashboard (they start with `pk_live_` and `sk_live_`)
   - Update environment variables in your production environment

2. Set up production webhooks:
   - Create webhook endpoint in Stripe Dashboard
   - Point to your production domain
   - Update `STRIPE_WEBHOOK_SECRET` with production webhook secret

3. Test with real cards in test mode first

4. Review Stripe's go-live checklist: https://stripe.com/docs/development/checklist

## Next Steps

- Add email notifications for order confirmations
- Implement order history page (/orders)
- Add refund handling
- Set up inventory management
- Configure shipping rate calculation
- Add discount codes support

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test your integration: https://stripe.com/docs/testing

---

**Note:** This integration uses Stripe Checkout, which is PCI-compliant out of the box. You don't need to handle card details directly, making it secure and easy to implement.
