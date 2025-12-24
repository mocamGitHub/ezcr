-- Add RLS policies to allow authenticated admin users to view all data
-- These policies work in conjunction with the middleware that verifies admin access
-- Any user who reaches the admin pages has already been verified by middleware

-- ========================================
-- ORDERS TABLE
-- ========================================

-- Allow authenticated users to view all orders
-- (Middleware already verifies admin role before granting access to /admin routes)
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
CREATE POLICY "Authenticated users can view all orders" ON orders
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update orders (for status changes, etc.)
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE TO authenticated USING (true)
  WITH CHECK (true);

-- ========================================
-- ORDER_ITEMS TABLE
-- ========================================

-- Allow authenticated users to view all order items
DROP POLICY IF EXISTS "Authenticated users can view all order items" ON order_items;
CREATE POLICY "Authenticated users can view all order items" ON order_items
  FOR SELECT TO authenticated USING (true);

-- ========================================
-- PRODUCT UPDATES POLICY
-- ========================================

-- Products already has a SELECT policy for authenticated users
-- Add UPDATE policy for inventory management
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE TO authenticated USING (true)
  WITH CHECK (true);

-- ========================================
-- CONTACTS TABLE (if it exists for CRM)
-- ========================================

DO $$
BEGIN
  -- Check if contacts table exists before adding policy
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'contacts') THEN
    -- Drop existing policy if any
    DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;

    -- Create new policy
    CREATE POLICY "Authenticated users can view contacts" ON contacts
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ========================================
-- PRODUCT_CONFIGURATIONS TABLE
-- ========================================

-- Allow authenticated users to view all configurations
DROP POLICY IF EXISTS "Authenticated users can view all configurations" ON product_configurations;
CREATE POLICY "Authenticated users can view all configurations" ON product_configurations
  FOR SELECT TO authenticated USING (true);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON POLICY "Authenticated users can view all orders" ON orders IS
  'Admin access policy - users are verified by Next.js middleware before reaching admin pages';

COMMENT ON POLICY "Authenticated users can update orders" ON orders IS
  'Admin access policy - allows order status updates from admin dashboard';
