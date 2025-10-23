-- Create gallery tables for images and videos
-- Migration: 00019_create_gallery.sql

-- Gallery Categories Table
CREATE TABLE IF NOT EXISTS gallery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Gallery Items Table (supports both images and videos)
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES gallery_categories(id) ON DELETE SET NULL,

  -- Item type
  item_type TEXT NOT NULL CHECK (item_type IN ('image', 'video')),

  -- Common fields
  title TEXT NOT NULL,
  description TEXT,
  caption TEXT,

  -- Image fields
  image_url TEXT, -- For images, direct URL
  thumbnail_url TEXT, -- Thumbnail for videos or optimized image

  -- Video fields
  video_url TEXT, -- For videos, direct URL or embed URL
  video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'direct')),
  video_embed_id TEXT, -- YouTube video ID or Vimeo ID
  video_duration INTEGER, -- Duration in seconds

  -- Metadata
  alt_text TEXT,
  tags TEXT[], -- Array of tags for search/filtering

  -- Display settings
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_image CHECK (
    item_type != 'image' OR image_url IS NOT NULL
  ),
  CONSTRAINT valid_video CHECK (
    item_type != 'video' OR (video_url IS NOT NULL OR video_embed_id IS NOT NULL)
  )
);

-- Gallery Item Views (for analytics)
CREATE TABLE IF NOT EXISTS gallery_item_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id UUID NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_categories_tenant ON gallery_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_active ON gallery_categories(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_gallery_items_tenant ON gallery_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON gallery_items(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON gallery_items(tenant_id, item_type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_featured ON gallery_items(tenant_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_items_active ON gallery_items(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_items_tags ON gallery_items USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_gallery_item_views_item ON gallery_item_views(gallery_item_id);
CREATE INDEX IF NOT EXISTS idx_gallery_item_views_date ON gallery_item_views(viewed_at);

-- Enable RLS
ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_item_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_categories
CREATE POLICY "Gallery categories are viewable by everyone"
  ON gallery_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gallery categories are manageable by authenticated users"
  ON gallery_categories FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for gallery_items
CREATE POLICY "Gallery items are viewable by everyone"
  ON gallery_items FOR SELECT
  USING (is_active = true AND (published_at IS NULL OR published_at <= NOW()));

CREATE POLICY "Gallery items are manageable by authenticated users"
  ON gallery_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for gallery_item_views
CREATE POLICY "Anyone can create gallery item views"
  ON gallery_item_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Gallery item views are viewable by authenticated users"
  ON gallery_item_views FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_categories_updated_at
  BEFORE UPDATE ON gallery_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_updated_at();

CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON gallery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_updated_at();

-- Comments
COMMENT ON TABLE gallery_categories IS 'Categories for organizing gallery items';
COMMENT ON TABLE gallery_items IS 'Gallery items supporting both images and videos';
COMMENT ON TABLE gallery_item_views IS 'Track views of gallery items for analytics';
COMMENT ON COLUMN gallery_items.item_type IS 'Type of item: image or video';
COMMENT ON COLUMN gallery_items.video_provider IS 'Video hosting provider: youtube, vimeo, or direct';
COMMENT ON COLUMN gallery_items.video_embed_id IS 'YouTube video ID (e.g., dQw4w9WgXcQ) or Vimeo ID';
