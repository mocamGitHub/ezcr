-- Migration: Seed Testimonials Data
-- Description: Sample testimonials for testing and initial content
-- Version: 00024
-- Date: 2025-10-23

-- Insert sample approved testimonials
INSERT INTO public.testimonials (
  customer_name,
  customer_email,
  customer_location,
  title,
  content,
  rating,
  status,
  is_featured,
  helpful_count,
  created_at
) VALUES
  (
    'Mike Rodriguez',
    'mike.r@example.com',
    'Phoenix, AZ',
    'Best Purchase I''ve Made!',
    'This bike ramp has completely transformed my training routine. The quality is outstanding, and the custom configurator let me build exactly what I needed. Setup was a breeze, and it''s holding up perfectly after 6 months of daily use. Worth every penny!',
    5,
    'approved',
    true,
    24,
    NOW() - INTERVAL '3 months'
  ),
  (
    'Sarah Chen',
    'sarah.chen@example.com',
    'Los Angeles, CA',
    'Perfect for My Garage Gym',
    'I was skeptical about ordering online, but the customer service was incredible. They helped me choose the right size for my space, and delivery was faster than expected. The ramp is solid, looks professional, and my training has improved significantly.',
    5,
    'approved',
    true,
    18,
    NOW() - INTERVAL '2 months'
  ),
  (
    'Jason Martinez',
    'j.martinez@example.com',
    'Austin, TX',
    'High Quality Construction',
    'As someone who works in construction, I can tell this ramp is built to last. The welds are clean, the materials are top-notch, and it''s engineered properly. Great product from a company that clearly cares about quality.',
    5,
    'approved',
    true,
    15,
    NOW() - INTERVAL '4 months'
  ),
  (
    'Emily Thompson',
    'emily.t@example.com',
    'Portland, OR',
    'Exactly What I Needed',
    'The configurator made it so easy to customize the ramp for my specific needs. I love that I could choose the exact dimensions and features. Shipping was well-packaged and the ramp arrived in perfect condition.',
    5,
    'approved',
    false,
    12,
    NOW() - INTERVAL '1 month'
  ),
  (
    'David Kim',
    'david.k@example.com',
    'Seattle, WA',
    'Great Customer Support',
    'Had a few questions before ordering and the support team was incredibly helpful. They responded quickly and gave me expert advice. The ramp itself exceeded my expectations in both quality and functionality.',
    5,
    'approved',
    false,
    9,
    NOW() - INTERVAL '5 weeks'
  ),
  (
    'Rachel Williams',
    'rachel.w@example.com',
    'Denver, CO',
    'Worth the Investment',
    'I''ve had cheaper ramps before that fell apart quickly. This one is clearly made with quality materials and proper engineering. It''s stable, safe, and exactly what I was looking for. Highly recommend!',
    4,
    'approved',
    false,
    7,
    NOW() - INTERVAL '3 weeks'
  ),
  (
    'Tom Anderson',
    'tom.a@example.com',
    'Miami, FL',
    'Solid and Reliable',
    'Been using this ramp for training for about 2 months now. It''s rock solid, doesn''t shift during use, and the surface grip is excellent. Setup was straightforward with clear instructions.',
    4,
    'approved',
    false,
    6,
    NOW() - INTERVAL '2 weeks'
  ),
  (
    'Lisa Brown',
    'lisa.b@example.com',
    'Chicago, IL',
    'Professional Grade Equipment',
    'This isn''t a toy - it''s professional grade equipment at a reasonable price. The build quality is apparent from the moment you unpack it. Very happy with my purchase and would buy from EZ Cycle Ramp again.',
    5,
    'approved',
    false,
    5,
    NOW() - INTERVAL '1 week'
  ),
  (
    'Carlos Sanchez',
    'carlos.s@example.com',
    'Houston, TX',
    'Great Value for Money',
    'Compared to other options on the market, this ramp offers incredible value. The quality is comparable to much more expensive brands. Fast shipping and excellent packaging too.',
    4,
    'approved',
    false,
    4,
    NOW() - INTERVAL '5 days'
  ),
  (
    'Amanda Foster',
    'amanda.f@example.com',
    'Boston, MA',
    'Exceeded My Expectations',
    'I was impressed from start to finish - easy ordering process, helpful customer service, quick delivery, and a product that''s even better in person than on the website. Can''t recommend highly enough!',
    5,
    'approved',
    false,
    3,
    NOW() - INTERVAL '3 days'
  ),
  -- A few pending testimonials for testing admin workflow
  (
    'John Smith',
    'john.s@example.com',
    'San Diego, CA',
    'Very Happy Customer',
    'Just received my ramp yesterday and already loving it. The quality is exactly as described and it was easy to set up. Looking forward to many years of use!',
    5,
    'pending',
    false,
    0,
    NOW() - INTERVAL '1 day'
  ),
  (
    'Maria Garcia',
    'maria.g@example.com',
    'New York, NY',
    'Good Product',
    'Solid ramp with good build quality. Took about a week to arrive but it was worth the wait. Would recommend to others.',
    4,
    'pending',
    false,
    0,
    NOW() - INTERVAL '6 hours'
  );

-- Add some sample votes
INSERT INTO public.testimonial_votes (testimonial_id, session_id, is_helpful)
SELECT
  t.id,
  'session_' || generate_series(1, t.helpful_count),
  true
FROM public.testimonials t
WHERE t.helpful_count > 0;

COMMENT ON TABLE public.testimonials IS 'Sample testimonials seeded for testing and initial content';
