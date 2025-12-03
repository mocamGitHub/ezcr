-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT,
  category VARCHAR(100),
  image_url TEXT,
  author_name VARCHAR(255) DEFAULT 'EZ Cycle Ramp Team',
  read_time VARCHAR(50),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_published ON blog_posts(tenant_id, is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (published posts only)
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- Policy for authenticated admin users to manage posts
CREATE POLICY "Admins can manage blog posts" ON blog_posts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Insert sample blog posts
INSERT INTO blog_posts (slug, title, excerpt, content, category, image_url, read_time, is_published, is_featured, published_at) VALUES
(
  'how-to-choose-motorcycle-loading-ramp',
  'How to Choose the Right Motorcycle Loading Ramp',
  'Choosing the right motorcycle loading ramp depends on several key factors: your bike''s weight, your truck bed height, and how often you''ll be loading. In this guide, we break down everything you need to know.',
  'Choosing the right motorcycle loading ramp depends on several key factors: your bike''s weight, your truck bed height, and how often you''ll be loading. In this guide, we break down everything you need to know about selecting the perfect ramp for your needs.',
  'Buying Guide',
  'https://ezcycleramp.com/images/ramp6.webp',
  '5 min read',
  true,
  true,
  NOW() - INTERVAL '2 days'
),
(
  'motorcycle-loading-safety-tips',
  '10 Essential Safety Tips for Loading Your Motorcycle',
  'Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.',
  'Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.',
  'Safety',
  'https://ezcycleramp.com/images/ramp4.webp',
  '4 min read',
  true,
  true,
  NOW() - INTERVAL '8 days'
),
(
  'folding-vs-standard-ramps',
  'Folding vs Standard Ramps: Which Is Right for You?',
  'Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.',
  'Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.',
  'Comparison',
  'https://ezcycleramp.com/images/ramp2.webp',
  '6 min read',
  true,
  true,
  NOW() - INTERVAL '13 days'
),
(
  'maintaining-your-motorcycle-ramp',
  'How to Maintain Your Motorcycle Ramp for Years of Use',
  'A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years. Here''s how to keep it in top condition.',
  'A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years.',
  'Maintenance',
  'https://ezcycleramp.com/images/ramp1.webp',
  '3 min read',
  true,
  false,
  NOW() - INTERVAL '18 days'
),
(
  'loading-heavy-touring-motorcycles',
  'Loading Heavy Touring Motorcycles: A Complete Guide',
  'Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.',
  'Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.',
  'How-To',
  'https://ezcycleramp.com/images/ramp3.webp',
  '7 min read',
  true,
  false,
  NOW() - INTERVAL '23 days'
),
(
  'why-veteran-owned-matters',
  'Why Buying from a Veteran-Owned Business Matters',
  'EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.',
  'EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.',
  'Company',
  'https://ezcycleramp.com/images/ramp5.webp',
  '4 min read',
  true,
  false,
  NOW() - INTERVAL '30 days'
);
