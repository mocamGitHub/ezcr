-- Testimonials Seed Data
-- IMPORTANT: Before running this script, you need to:
-- 1. Replace 'YOUR_TENANT_ID' with your actual tenant UUID from the tenants table
-- 2. Replace 'YOUR_USER_ID' with a valid user UUID from auth.users table
--
-- To find your tenant_id, run: SELECT id FROM tenants LIMIT 1;
-- To find a user_id, run: SELECT id FROM auth.users LIMIT 1;

-- Set variables (replace these with your actual UUIDs)
-- Example: DO $$ DECLARE tenant UUID := 'your-actual-tenant-uuid'; ...

INSERT INTO testimonials (tenant_id, user_id, customer_name, customer_email, rating, review_text, status, is_featured, is_verified_customer, created_at)
VALUES
-- 5-star reviews
('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Mike J.', 'mike.j@example.com', 5,
 'Best motorcycle ramp I''ve ever owned. The quality is outstanding and loading my Harley has never been easier. Worth every penny!',
 'approved', true, true, NOW() - INTERVAL '30 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Sarah W.', 'sarah.w@example.com', 5,
 'Amazing customer service and fast shipping. The ramp is incredibly sturdy and folds up nicely for storage. Highly recommend!',
 'approved', true, true, NOW() - INTERVAL '28 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'David C.', 'david.c@example.com', 5,
 'Finally a ramp that can handle my adventure bike! The build quality is top-notch and setup took less than 30 minutes.',
 'approved', true, true, NOW() - INTERVAL '25 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Tom M.', 'tom.m@example.com', 5,
 'I was skeptical at first due to the price, but after using it for 6 months I can say it''s the best investment I''ve made for my bikes.',
 'approved', true, true, NOW() - INTERVAL '22 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Chris A.', 'chris.a@example.com', 5,
 'Veteran-owned and you can tell they care about quality. My Gold Wing loads perfectly every time. Great product!',
 'approved', true, true, NOW() - INTERVAL '20 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'James W.', 'james.w@example.com', 5,
 'The folding mechanism is genius. Stores in my truck bed and sets up in under a minute. Game changer for track days!',
 'approved', true, true, NOW() - INTERVAL '18 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Robert T.', 'robert.t@example.com', 5,
 'Bought this for my Goldwing and couldn''t be happier. Rock solid construction and the powder coat finish looks great.',
 'approved', true, true, NOW() - INTERVAL '15 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Kevin B.', 'kevin.b@example.com', 5,
 'Third ramp I''ve owned and by far the best. No flex, no wobble, just confidence when loading my Street Glide.',
 'approved', true, true, NOW() - INTERVAL '12 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Steve M.', 'steve.m@example.com', 5,
 'Customer support helped me pick the right size for my F-150. Perfect fit and works exactly as advertised.',
 'approved', true, true, NOW() - INTERVAL '10 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Dan R.', 'dan.r@example.com', 5,
 'Used it for the first time last weekend - loaded my Road King in under 2 minutes. Why did I wait so long to buy this?',
 'approved', true, true, NOW() - INTERVAL '8 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Mark T.', 'mark.t@example.com', 5,
 'Heavy duty is an understatement. This thing is built like a tank. My Indian Scout loads smoothly every time.',
 'approved', true, true, NOW() - INTERVAL '5 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Paul G.', 'paul.g@example.com', 5,
 'Excellent quality and fast delivery. The adjustable width feature is perfect for my different bikes.',
 'approved', true, true, NOW() - INTERVAL '3 days'),

-- 4-star reviews for variety
('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Brian H.', 'brian.h@example.com', 4,
 'Great ramp overall. Assembly instructions could be clearer but the end result is fantastic. Very sturdy.',
 'approved', false, true, NOW() - INTERVAL '14 days'),

('YOUR_TENANT_ID', 'YOUR_USER_ID', 'Jason L.', 'jason.l@example.com', 4,
 'Solid construction and works great with my Yamaha. Shipping was a bit slow but worth the wait.',
 'approved', false, true, NOW() - INTERVAL '7 days');
