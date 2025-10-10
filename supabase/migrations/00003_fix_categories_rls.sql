-- Enable RLS on product_categories if not already enabled
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read product categories" ON product_categories;

-- Create policy to allow public read access to product categories
CREATE POLICY "Public can read product categories"
ON product_categories
FOR SELECT
USING (true);

-- Verify the policy is active
-- You should now be able to query: SELECT * FROM product_categories;
