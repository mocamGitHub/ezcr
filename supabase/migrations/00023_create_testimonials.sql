-- Migration: Create Testimonials System
-- Description: Customer testimonials with ratings, approval workflow, and admin management
-- Version: 00023
-- Date: 2025-10-23

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TESTIMONIALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_location VARCHAR(255), -- e.g., "Los Angeles, CA"
  customer_avatar_url TEXT, -- Optional profile image

  -- Testimonial Content
  title VARCHAR(255), -- Optional headline
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Product Association (optional - can be general testimonial)
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

  -- Workflow & Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,

  -- Engagement Metrics
  helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Admin Notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT testimonials_rating_range CHECK (rating BETWEEN 1 AND 5)
);

-- Add indexes for performance
CREATE INDEX idx_testimonials_status ON public.testimonials(status);
CREATE INDEX idx_testimonials_featured ON public.testimonials(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_testimonials_product ON public.testimonials(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);
CREATE INDEX idx_testimonials_created ON public.testimonials(created_at DESC);

-- =====================================================
-- TESTIMONIAL HELPFUL VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.testimonial_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate votes
  CONSTRAINT unique_user_vote UNIQUE (testimonial_id, user_id),
  CONSTRAINT unique_session_vote UNIQUE (testimonial_id, session_id)
);

CREATE INDEX idx_testimonial_votes_testimonial ON public.testimonial_votes(testimonial_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_votes ENABLE ROW LEVEL SECURITY;

-- Public can view approved testimonials
CREATE POLICY "Anyone can view approved testimonials"
  ON public.testimonials
  FOR SELECT
  USING (status = 'approved');

-- Authenticated users can submit testimonials
CREATE POLICY "Authenticated users can submit testimonials"
  ON public.testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view their own testimonials
CREATE POLICY "Users can view their own testimonials"
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');

-- Users can update their own pending testimonials
CREATE POLICY "Users can update their own pending testimonials"
  ON public.testimonials
  FOR UPDATE
  TO authenticated
  USING (
    customer_email = auth.jwt() ->> 'email'
    AND status = 'pending'
  );

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage all testimonials"
  ON public.testimonials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Anyone can vote on testimonials
CREATE POLICY "Anyone can vote on testimonials"
  ON public.testimonial_votes
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own votes
CREATE POLICY "Users can view their own votes"
  ON public.testimonial_votes
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR session_id IS NOT NULL
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- Function to update helpful_count when vote is added
CREATE OR REPLACE FUNCTION update_testimonial_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE public.testimonials
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.testimonial_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE public.testimonials
      SET helpful_count = helpful_count - 1
      WHERE id = OLD.testimonial_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
CREATE TRIGGER testimonial_votes_count
  AFTER INSERT OR DELETE ON public.testimonial_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_helpful_count();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.testimonials IS 'Customer testimonials with ratings and approval workflow';
COMMENT ON COLUMN public.testimonials.status IS 'Workflow status: pending (awaiting review), approved (public), rejected (hidden)';
COMMENT ON COLUMN public.testimonials.is_featured IS 'Featured testimonials shown prominently on homepage';
COMMENT ON COLUMN public.testimonials.rating IS 'Star rating from 1-5';
COMMENT ON COLUMN public.testimonials.helpful_count IS 'Number of users who found this helpful';

COMMENT ON TABLE public.testimonial_votes IS 'User votes for helpful/not helpful on testimonials';
