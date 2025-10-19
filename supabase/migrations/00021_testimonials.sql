-- Migration: Testimonials System
-- Description: Creates testimonials table with approval workflow, admin responses, and RLS policies
-- Created: 2025-10-19

-- =====================================================
-- CREATE TESTIMONIALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS testimonials (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Customer info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL, -- First name + last initial
  customer_email VARCHAR(255) NOT NULL,
  customer_avatar_url TEXT, -- Optional customer photo

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (length(review_text) >= 20 AND length(review_text) <= 1000),

  -- Product reference (optional)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Workflow status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT false, -- Featured on homepage
  is_verified_customer BOOLEAN DEFAULT true, -- Badge for logged-in customers

  -- Admin response
  admin_response TEXT,
  admin_response_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_response_at TIMESTAMPTZ,

  -- Moderation
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Metadata
  helpful_count INTEGER DEFAULT 0, -- Future: users can mark as helpful
  reported_count INTEGER DEFAULT 0, -- Future: flag inappropriate content

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_testimonials_tenant_id ON testimonials(tenant_id);
CREATE INDEX idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX idx_testimonials_product_id ON testimonials(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX idx_testimonials_is_featured ON testimonials(is_featured) WHERE is_featured = true;

-- Composite indexes for common queries
CREATE INDEX idx_testimonials_approved ON testimonials(tenant_id, status) WHERE status = 'approved';
CREATE INDEX idx_testimonials_product_approved ON testimonials(product_id, status) WHERE status = 'approved' AND product_id IS NOT NULL;

-- =====================================================
-- CREATE UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view approved testimonials
CREATE POLICY testimonials_public_view ON testimonials
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Authenticated users can view their own testimonials (any status)
CREATE POLICY testimonials_own_view ON testimonials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Authenticated users can insert testimonials (logged-in customers)
CREATE POLICY testimonials_insert ON testimonials
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending' -- Can only create pending testimonials
  );

-- Policy 4: Users can update their own pending testimonials
CREATE POLICY testimonials_own_update ON testimonials
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy 5: Users can delete their own pending testimonials
CREATE POLICY testimonials_own_delete ON testimonials
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy 6: Admins can view all testimonials
CREATE POLICY testimonials_admin_view ON testimonials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy 7: Admins can update any testimonial (approve, reject, respond)
CREATE POLICY testimonials_admin_update ON testimonials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy 8: Admins can delete any testimonial
CREATE POLICY testimonials_admin_delete ON testimonials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get testimonial statistics
CREATE OR REPLACE FUNCTION get_testimonial_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_testimonials BIGINT,
  pending_testimonials BIGINT,
  approved_testimonials BIGINT,
  rejected_testimonials BIGINT,
  average_rating NUMERIC,
  five_star_count BIGINT,
  four_star_count BIGINT,
  three_star_count BIGINT,
  two_star_count BIGINT,
  one_star_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_testimonials,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_testimonials,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_testimonials,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_testimonials,
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
    COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
    COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
    COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
    COUNT(*) FILTER (WHERE rating = 1) as one_star_count
  FROM testimonials
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product testimonial statistics
CREATE OR REPLACE FUNCTION get_product_testimonial_stats(p_product_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  five_star_count BIGINT,
  four_star_count BIGINT,
  three_star_count BIGINT,
  two_star_count BIGINT,
  one_star_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_reviews,
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
    COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
    COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
    COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
    COUNT(*) FILTER (WHERE rating = 1) as one_star_count
  FROM testimonials
  WHERE product_id = p_product_id
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE testimonials IS 'Customer testimonials and reviews with approval workflow';
COMMENT ON COLUMN testimonials.customer_name IS 'Displayed name (First name + last initial, e.g., John D.)';
COMMENT ON COLUMN testimonials.is_verified_customer IS 'Badge indicating logged-in customer';
COMMENT ON COLUMN testimonials.is_featured IS 'Featured testimonials shown on homepage carousel';
COMMENT ON COLUMN testimonials.status IS 'Workflow status: pending, approved, rejected';
