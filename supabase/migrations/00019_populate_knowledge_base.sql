-- ========================================
-- POPULATE KNOWLEDGE BASE WITH SUPPORT CONTENT
-- ========================================
-- This migration populates the knowledge_base table with content from support pages
-- Note: Embeddings should be generated via API after this migration runs
-- The chatbot will use these for RAG (Retrieval-Augmented Generation)

-- Get the ezcr-dev tenant ID
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'ezcr-dev' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Tenant ezcr-dev not found. Please run tenant migrations first.';
  END IF;

  -- ========================================
  -- PRODUCT INFORMATION
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'product', 'Product Comparison: AUN250 vs AUN210 vs AUN200',
   'The AUN250 is our premium folding ramp with the highest weight capacity (up to 1,000 lbs) and most adjustability. The AUN210 is our standard model with excellent versatility for most motorcycles (up to 800 lbs). The AUN200 is our basic model, perfect for lighter bikes and budget-conscious buyers (up to 600 lbs). All models include a safety factor of 2:1, meaning they are tested to twice their rated capacity.',
   'support_pages', '{"page": "/faq", "section": "product_info"}'),

  (tenant_uuid, 'product', 'Weight Capacities by Model',
   'AUN250: 1,000 lbs | AUN210: 800 lbs | AUN200: 600 lbs. All models include a safety factor of 2:1, meaning they are tested to twice their rated capacity.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'product', 'Vehicle Compatibility',
   'Our ramps are designed to work with most pickup trucks (including lifted trucks up to 6" lift), cargo vans, and trailers. The adjustable height feature accommodates bed heights from 18" to 48". Use our configurator tool to find the perfect fit for your specific setup.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'product', 'ATV and Snowmobile Use',
   'Yes! While designed primarily for motorcycles, our ramps work great for ATVs, snowmobiles, lawn equipment, and other wheeled vehicles within the weight capacity.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'product', 'Made in USA',
   'Yes, all EZ Cycle Ramps are designed, manufactured, and assembled in the USA using American steel and components.',
   'support_pages', '{"page": "/faq"}');

  -- ========================================
  -- INSTALLATION
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'installation', 'Installation Difficulty and Time',
   'Most customers complete installation in 30-60 minutes with basic hand tools. No welding or permanent modifications required. The skill level required is basic. We recommend 1-2 people for installation.',
   'support_pages', '{"page": "/installation"}'),

  (tenant_uuid, 'installation', 'Tools Required for Installation',
   'You will need: Socket wrench set (SAE: 7/16", 1/2", 9/16"), adjustable wrench (10-12"), electric or cordless drill, drill bits (1/4", 5/16", 1/2"), Phillips and flathead screwdrivers, measuring tape (25 ft minimum), level (2-3 ft), marker or pencil for marking holes, and center punch or nail for pilot holes. All mounting hardware is included.',
   'support_pages', '{"page": "/installation"}'),

  (tenant_uuid, 'installation', 'Installation Steps Overview',
   'Installation involves 10 main steps: 1) Unpack and inventory all parts, 2) Measure truck bed height, 3) Position mounting brackets, 4) Mark mounting holes, 5) Drill pilot holes, 6) Attach mounting brackets, 7) Install main ramp assembly, 8) Adjust ramp angle, 9) Install safety strap, 10) Final inspection and testing.',
   'support_pages', '{"page": "/installation"}'),

  (tenant_uuid, 'installation', 'Drilling Holes in Truck Bed',
   'For the most secure installation, we recommend using the included mounting hardware which requires drilling. However, we also offer a no-drill option using heavy-duty clamps (sold separately as an accessory).',
   'support_pages', '{"page": "/faq", "page2": "/installation"}'),

  (tenant_uuid, 'installation', 'Professional Installation',
   'Most customers install the ramp themselves. If you are comfortable with basic mechanical tasks, you should have no problem. Professional installation is available through select dealers if you prefer.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'installation', 'Bed Liner and Tonneau Cover Compatibility',
   'Our ramps are designed to work with most bed liners (spray-in and drop-in). For tonneau covers, the ramp folds flat when not in use, allowing most covers to close. Specific compatibility varies by cover type - contact us for details about your setup.',
   'support_pages', '{"page": "/faq"}');

  -- ========================================
  -- SHIPPING & DELIVERY
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'shipping', 'Shipping Time and Options',
   'Standard shipping typically takes 5-7 business days. Expedited shipping (2-3 days) is available for an additional fee. You will receive a tracking number via email once your order ships.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'shipping', 'Free Shipping Policy',
   'Yes! We offer free standard ground shipping on all orders over $500. Orders under $500 have a flat shipping rate of $49.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'shipping', 'International Shipping',
   'Currently, we ship to all 50 US states, Canada, and US military APO/FPO addresses. International shipping rates and times vary by location. Contact us for a shipping quote to your country.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'shipping', 'Package Dimensions and Weight',
   'Ramps are packaged in a heavy-duty cardboard box with protective foam. Total package dimensions are approximately 72" x 18" x 12" and weight varies by model (85-120 lbs). Signature may be required upon delivery.',
   'support_pages', '{"page": "/faq"}');

  -- ========================================
  -- WARRANTY
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'warranty', 'Lifetime Warranty Overview',
   'All ramps come with a lifetime warranty against manufacturing defects. This covers materials and workmanship for as long as you own the ramp. Normal wear and tear, misuse, or modifications are not covered.',
   'support_pages', '{"page": "/warranty"}'),

  (tenant_uuid, 'warranty', 'What is Covered by Warranty',
   'The warranty covers: Structural components (welded steel frame, support beams, structural elements), mechanical parts (hinges, pivot points, adjustment mechanisms, locking systems), hardware and fasteners, powder coating and finish (5 years), and workmanship (all welds, assembly, manufacturing processes).',
   'support_pages', '{"page": "/warranty"}'),

  (tenant_uuid, 'warranty', 'What is Not Covered by Warranty',
   'Not covered: Normal wear and tear (surface scratches, scuffs, minor cosmetic issues, fading from UV exposure, minor surface rust), misuse or abuse, modifications, improper installation, accidents and acts of nature, and commercial or rental use (different warranty terms apply).',
   'support_pages', '{"page": "/warranty"}'),

  (tenant_uuid, 'warranty', 'How to File a Warranty Claim',
   'To file a warranty claim: 1) Contact customer service at 800-687-4410 or support@ezcycleramp.com with your order number, 2) Provide details and clear photos showing the defect, 3) Our team will review within 2-3 business days, 4) If approved, we will send a replacement part, provide repair instructions, or replace the entire unit. All shipping costs for warranty replacements are covered.',
   'support_pages', '{"page": "/warranty"}');

  -- ========================================
  -- RETURNS & REFUNDS
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'general', '30-Day Money-Back Guarantee',
   'We offer a 30-day money-back guarantee. If for any reason you are not happy with your ramp, you can return it within 30 days of delivery for a full refund. The ramp must be in like-new, resalable condition with original packaging.',
   'support_pages', '{"page": "/returns"}'),

  (tenant_uuid, 'general', 'Return Eligibility Requirements',
   'Returns must be initiated within 30 days of delivery date. The ramp must be in original condition with all components, hardware, and accessories included. Original packaging required (restocking fee may apply if missing). You must obtain a Return Merchandise Authorization (RMA) number before shipping back.',
   'support_pages', '{"page": "/returns"}'),

  (tenant_uuid, 'general', 'How to Initiate a Return',
   'To return: 1) Contact us at 800-687-4410 or support@ezcycleramp.com within 30 days, 2) Receive RMA number and return instructions (typically within 1 business day), 3) Pack and ship with RMA number on box using trackable method, 4) We will inspect and process refund within 5-7 business days.',
   'support_pages', '{"page": "/returns"}'),

  (tenant_uuid, 'general', 'Restocking Fees',
   'In most cases, there is no restocking fee for returns in original condition with original packaging. However: 15% restocking fee for products without original packaging, 25% restocking fee for products showing signs of use or missing components, no refund for modified or damaged products.',
   'support_pages', '{"page": "/returns"}'),

  (tenant_uuid, 'general', 'Return Shipping Costs',
   'Customer-initiated returns: Customer pays return shipping ($50-$80 estimated). Defective or incorrect items: We provide prepaid return label at no cost and expedite replacement.',
   'support_pages', '{"page": "/returns"}');

  -- ========================================
  -- USAGE & SAFETY
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'general', 'Loading Safety Tips',
   'Is it safe to load alone? Yes, when used properly with our safety guidelines. We recommend having a helper for larger/heavier bikes. Always use the safety strap (included), ensure the ramp is secure, and practice on level ground before attempting on an incline.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Ground Level Requirements',
   'For safety, the vehicle should be on level ground whenever loading or unloading. The ramp itself can handle slight variations, but significant unevenness can affect stability and safety.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Ramp Maintenance',
   'Periodically check all bolts and connections for tightness. Keep the ramp surface clean and free of debris. Store in a dry location when possible to prevent rust. Apply a light coating of oil to moving parts annually. Avoid exposing to road salt when possible.',
   'support_pages', '{"page": "/faq", "page2": "/installation"}'),

  (tenant_uuid, 'general', 'Maximum Incline Angle',
   'For safety, we recommend keeping the angle under 30 degrees. Our ramps are adjustable to accommodate different truck bed heights while maintaining a safe loading angle.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Permanent Installation',
   'Can I leave the ramp installed all the time? Yes, many customers leave the ramp installed permanently. The folding models can stay folded in the bed when not in use. However, removing the ramp when not needed can extend its life and reduce exposure to weather.',
   'support_pages', '{"page": "/faq"}');

  -- ========================================
  -- ORDERING & PAYMENT
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'general', 'Payment Methods Accepted',
   'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and wire transfers for large orders. Business purchase orders are accepted from qualified accounts.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Financing Options',
   'Yes, we offer financing through Affirm and PayPal Credit. Apply at checkout to see your options. Approval is instant for most customers.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Bulk Order Discounts',
   'Yes! We offer volume discounts for dealers, fleet purchases, and bulk orders of 3+ ramps. Contact our sales team at sales@ezcycleramp.com for a custom quote.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Military and Veteran Discounts',
   'Yes, we offer a 10% discount for active military, veterans, and first responders. Contact us with proof of service to receive your discount code.',
   'support_pages', '{"page": "/faq"}');

  -- ========================================
  -- TECHNICAL SUPPORT
  -- ========================================

  INSERT INTO knowledge_base (tenant_id, category, title, content, source, metadata) VALUES
  (tenant_uuid, 'general', 'Replacement Parts',
   'Replacement parts are available for all current and past models. Contact customer service with your model number and we will help you identify and order the correct part.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Accessories and Upgrades',
   'Can I upgrade my ramp with accessories later? Yes! We offer various accessories including side rails, wheel chocks, tie-down anchors, and storage bags. All accessories are compatible with our current ramp models.',
   'support_pages', '{"page": "/faq"}'),

  (tenant_uuid, 'general', 'Customer Service Contact Information',
   'Phone: 800-687-4410 | Email: support@ezcycleramp.com | Hours: Monday-Friday 8 AM - 6 PM EST, Saturday 9 AM - 2 PM EST. Live chat AI assistant available 24/7.',
   'support_pages', '{"page": "/contact"}'),

  (tenant_uuid, 'general', 'Damaged in Transit',
   'Inspect your shipment immediately upon delivery. If there is visible damage to the packaging or product, note it on the delivery receipt and contact us within 48 hours. We will arrange for a replacement at no cost.',
   'support_pages', '{"page": "/faq", "page2": "/returns"}');

END $$;

-- ========================================
-- NOTES
-- ========================================
-- After running this migration, you should:
-- 1. Generate embeddings for all knowledge base entries via API
-- 2. Update the embedding column using OpenAI's text-embedding-ada-002 model
-- 3. Test the RAG chatbot to ensure it can retrieve relevant knowledge
--
-- Example API call to generate embeddings:
-- POST https://api.openai.com/v1/embeddings
-- { "model": "text-embedding-ada-002", "input": "content here" }
