-- =====================================================
-- FOMO Banners Table
-- Creates table for database-driven FOMO/urgency banners
-- =====================================================

-- Create the fomo_banners table
CREATE TABLE IF NOT EXISTS fomo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL CHECK (type IN ('countdown', 'stock', 'recent_purchase', 'visitors', 'custom')),
  message TEXT NOT NULL,

  -- For countdown type
  end_date TIMESTAMPTZ,

  -- For stock type
  stock_count INTEGER,
  stock_threshold INTEGER,

  -- For recent purchase type (stored as JSONB array)
  recent_purchases JSONB,

  -- For visitors type
  visitor_count INTEGER,

  -- Styling
  background_color TEXT DEFAULT '#FEF3C7',
  text_color TEXT DEFAULT '#92400E',
  accent_color TEXT DEFAULT '#F78309',
  position TEXT NOT NULL DEFAULT 'top' CHECK (position IN ('top', 'bottom', 'floating')),
  dismissible BOOLEAN NOT NULL DEFAULT true,
  show_icon BOOLEAN NOT NULL DEFAULT true,

  -- Scheduling
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Priority for multiple banners (lower = higher priority)
  priority INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying of active banners
CREATE INDEX IF NOT EXISTS idx_fomo_banners_active
  ON fomo_banners (enabled, start_date, end_date, priority);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fomo_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fomo_banners_updated_at
  BEFORE UPDATE ON fomo_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_fomo_banners_updated_at();

-- Enable Row Level Security
ALTER TABLE fomo_banners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled banners (for public display)
CREATE POLICY "Anyone can read enabled banners"
  ON fomo_banners
  FOR SELECT
  USING (enabled = true);

-- Policy: Only authenticated admins can insert/update/delete
-- Note: Adjust this based on your admin role setup
CREATE POLICY "Admins can manage banners"
  ON fomo_banners
  FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- =====================================================
-- Sample Data
-- =====================================================

-- Sample 1: Low Stock Warning (Active)
INSERT INTO fomo_banners (
  enabled,
  type,
  message,
  stock_count,
  stock_threshold,
  background_color,
  text_color,
  accent_color,
  position,
  dismissible,
  show_icon,
  start_date,
  end_date,
  priority
) VALUES (
  true,
  'stock',
  'Only {count} ramps left in stock! Order now before they''re gone.',
  7,
  10,
  '#FEF3C7',
  '#92400E',
  '#F78309',
  'top',
  true,
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  1
);

-- Sample 2: Holiday Sale Countdown (Inactive - for future use)
INSERT INTO fomo_banners (
  enabled,
  type,
  message,
  end_date,
  background_color,
  text_color,
  accent_color,
  position,
  dismissible,
  show_icon,
  start_date,
  priority
) VALUES (
  false,
  'countdown',
  'Holiday Sale ends in {countdown}! Save 15% with code HOLIDAY15',
  NOW() + INTERVAL '7 days',
  '#FEE2E2',
  '#991B1B',
  '#DC2626',
  'top',
  true,
  true,
  NOW(),
  2
);

-- Sample 3: Active Visitors Banner (Inactive - for future use)
INSERT INTO fomo_banners (
  enabled,
  type,
  message,
  visitor_count,
  background_color,
  text_color,
  accent_color,
  position,
  dismissible,
  show_icon,
  start_date,
  end_date,
  priority
) VALUES (
  false,
  'visitors',
  '{visitors} people are viewing our ramps right now!',
  23,
  '#DBEAFE',
  '#1E40AF',
  '#2563EB',
  'top',
  true,
  true,
  NOW(),
  NOW() + INTERVAL '90 days',
  3
);

-- Sample 4: Free Shipping Banner (Inactive - for future use)
INSERT INTO fomo_banners (
  enabled,
  type,
  message,
  background_color,
  text_color,
  accent_color,
  position,
  dismissible,
  show_icon,
  start_date,
  end_date,
  priority
) VALUES (
  false,
  'custom',
  'FREE SHIPPING on all orders over $500! Limited time offer.',
  '#D1FAE5',
  '#065F46',
  '#10B981',
  'top',
  true,
  true,
  NOW(),
  NOW() + INTERVAL '14 days',
  4
);

-- Sample 5: Recent Purchase Social Proof (Inactive - for future use)
INSERT INTO fomo_banners (
  enabled,
  type,
  message,
  recent_purchases,
  background_color,
  text_color,
  accent_color,
  position,
  dismissible,
  show_icon,
  start_date,
  end_date,
  priority
) VALUES (
  false,
  'recent_purchase',
  'Mike from Texas just purchased an AUN250 Folding Ramp!',
  '[{"name": "Mike", "location": "Texas", "time": "2 minutes ago"}, {"name": "Sarah", "location": "California", "time": "15 minutes ago"}]'::jsonb,
  '#FEF3C7',
  '#92400E',
  '#F78309',
  'floating',
  true,
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  5
);

-- =====================================================
-- Helpful Queries
-- =====================================================

-- Query to get the currently active banner (same as API)
-- SELECT * FROM fomo_banners
-- WHERE enabled = true
--   AND start_date <= NOW()
--   AND (end_date IS NULL OR end_date >= NOW())
-- ORDER BY priority ASC
-- LIMIT 1;

-- Query to enable/disable a specific banner
-- UPDATE fomo_banners SET enabled = true WHERE id = 'your-banner-id';

-- Query to update stock count
-- UPDATE fomo_banners SET stock_count = 5 WHERE type = 'stock' AND enabled = true;
