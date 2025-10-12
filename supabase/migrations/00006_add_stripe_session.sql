-- Add Stripe checkout session ID to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);

-- Add comment
COMMENT ON COLUMN orders.stripe_checkout_session_id IS 'Stripe Checkout Session ID for tracking payment sessions';
