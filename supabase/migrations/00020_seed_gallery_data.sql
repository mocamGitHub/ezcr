-- Seed gallery with sample data
-- Migration: 00020_seed_gallery_data.sql

-- Get the ezcr-dev tenant ID
DO $$
DECLARE
  v_tenant_id UUID;
  v_category_projects UUID;
  v_category_installations UUID;
  v_category_events UUID;
  v_category_testimonials UUID;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'ezcr-dev' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant ezcr-dev not found';
  END IF;

  -- Create gallery categories
  INSERT INTO gallery_categories (id, tenant_id, name, slug, description, display_order, is_active)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Projects', 'projects', 'Our custom cycle ramp projects', 1, true),
    (gen_random_uuid(), v_tenant_id, 'Installations', 'installations', 'Installation photos from happy customers', 2, true),
    (gen_random_uuid(), v_tenant_id, 'Events', 'events', 'Trade shows and motorcycle events', 3, true),
    (gen_random_uuid(), v_tenant_id, 'Testimonial Videos', 'testimonials', 'Video testimonials from our customers', 4, true)
  RETURNING id INTO v_category_projects;

  -- Get category IDs
  SELECT id INTO v_category_projects FROM gallery_categories WHERE tenant_id = v_tenant_id AND slug = 'projects' LIMIT 1;
  SELECT id INTO v_category_installations FROM gallery_categories WHERE tenant_id = v_tenant_id AND slug = 'installations' LIMIT 1;
  SELECT id INTO v_category_events FROM gallery_categories WHERE tenant_id = v_tenant_id AND slug = 'events' LIMIT 1;
  SELECT id INTO v_category_testimonials FROM gallery_categories WHERE tenant_id = v_tenant_id AND slug = 'testimonials' LIMIT 1;

  -- Insert sample gallery images (using placeholder images)
  INSERT INTO gallery_items (
    tenant_id,
    category_id,
    item_type,
    title,
    description,
    caption,
    image_url,
    thumbnail_url,
    alt_text,
    tags,
    is_featured,
    display_order,
    is_active,
    published_at
  )
  VALUES
    -- Projects
    (
      v_tenant_id,
      v_category_projects,
      'image',
      'Custom Ramp for Harley Davidson',
      'A custom-built cycle ramp designed specifically for a Harley Davidson touring motorcycle.',
      'Custom ramp with non-slip surface and reinforced construction',
      'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800',
      'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=400',
      'Custom cycle ramp for Harley Davidson motorcycle',
      ARRAY['harley-davidson', 'custom', 'touring'],
      true,
      1,
      true,
      NOW()
    ),
    (
      v_tenant_id,
      v_category_projects,
      'image',
      'Sport Bike Loading System',
      'Complete loading system for sport bikes with integrated tie-down points.',
      'Designed for easy loading and secure transport',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=400',
      'Sport bike loading ramp system',
      ARRAY['sport-bike', 'loading-system', 'transport'],
      true,
      2,
      true,
      NOW()
    ),

    -- Installations
    (
      v_tenant_id,
      v_category_installations,
      'image',
      'Pickup Truck Installation',
      'EZ Cycle Ramp installed in a full-size pickup truck bed.',
      'Perfect fit for standard truck beds',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400',
      'Cycle ramp installed in pickup truck',
      ARRAY['pickup-truck', 'installation', 'ford'],
      false,
      1,
      true,
      NOW()
    ),
    (
      v_tenant_id,
      v_category_installations,
      'image',
      'Trailer Setup',
      'Professional installation in an enclosed motorcycle trailer.',
      'Secure and stable trailer configuration',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400',
      'Cycle ramp in enclosed trailer',
      ARRAY['trailer', 'enclosed', 'professional'],
      false,
      2,
      true,
      NOW()
    ),

    -- Events
    (
      v_tenant_id,
      v_category_events,
      'image',
      'Sturgis Motorcycle Rally 2024',
      'Our booth at the annual Sturgis Motorcycle Rally.',
      'Showcasing our latest ramp designs',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'EZ Cycle Ramp booth at Sturgis Rally',
      ARRAY['sturgis', 'rally', 'trade-show'],
      false,
      1,
      true,
      NOW()
    ),
    (
      v_tenant_id,
      v_category_events,
      'image',
      'Daytona Bike Week',
      'Meeting customers and showcasing products at Daytona Bike Week.',
      'Great turnout and positive feedback',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400',
      'Daytona Bike Week event booth',
      ARRAY['daytona', 'bike-week', 'florida'],
      false,
      2,
      true,
      NOW()
    );

  -- Insert sample video testimonials
  INSERT INTO gallery_items (
    tenant_id,
    category_id,
    item_type,
    title,
    description,
    caption,
    thumbnail_url,
    video_url,
    video_provider,
    video_embed_id,
    video_duration,
    alt_text,
    tags,
    is_featured,
    display_order,
    is_active,
    published_at
  )
  VALUES
    (
      v_tenant_id,
      v_category_testimonials,
      'video',
      'Customer Review - John from Texas',
      'John shares his experience with our custom ramp system for his Indian motorcycle.',
      'Hear what our customers have to say',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'youtube',
      'dQw4w9WgXcQ',
      180,
      'Customer testimonial video',
      ARRAY['testimonial', 'review', 'indian-motorcycle'],
      true,
      1,
      true,
      NOW()
    ),
    (
      v_tenant_id,
      v_category_testimonials,
      'video',
      'Installation Guide',
      'Step-by-step guide on installing your EZ Cycle Ramp.',
      'Easy installation in under 30 minutes',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=400',
      'https://www.youtube.com/watch?v=example123',
      'youtube',
      'example123',
      420,
      'Installation guide video',
      ARRAY['tutorial', 'installation', 'how-to'],
      false,
      2,
      true,
      NOW()
    );

  RAISE NOTICE 'Gallery data seeded successfully for tenant: %', v_tenant_id;
END $$;
