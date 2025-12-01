# Session Handoff - Content Accuracy & Filter Fixes

**Date**: 2025-12-01
**Previous Commit**: `5b69ab1` - feat: Content accuracy updates and product filter improvements
**Branch**: main
**Staging URL**: https://staging.ezcycleramp.com
**VPS**: 5.161.187.109 (SSH as root)

---

## What Was Accomplished This Session

### 1. Content Accuracy Updates
- **Removed false claims**: No more "Made in USA", "Free Shipping", or "Lifetime Warranty" claims
- **Updated warranty info**: Now displays "2 Year Neo-Dyne Manufacturers Warranty" across all pages
- **Button text changes**: "Find Your Ramp" buttons now say "Free Quote"
- **Improved button contrast**: Start Configurator button now has white background with orange text for better visibility on orange backgrounds

### 2. Product Filters Fixed
- **Available Now filter**: Added green visual feedback when active (green background, border, checkbox styling)
- **Price range filter**: Now auto-applies with 500ms debounce (removed confusing Apply button)
- Shows "Adjusting..." while dragging, "Loading..." while updating

### 3. Hero Images Localized
- Downloaded hero images to `/public/images/hero/` for local hosting
- Files: `10.webp`, `11.webp`, `12.webp`
- Ready for license plate blurring (manual image editing required)

### 4. Featured Ramps Section
- Reduced image sizes to 85% with padding for better proportions

---

## Files Modified This Session

- `src/app/(marketing)/page.tsx` - Homepage hero/CTA updates, Featured Ramps sizing
- `src/app/(marketing)/about/page.tsx` - Removed Made in USA claims
- `src/app/(marketing)/faq/page.tsx` - Updated warranty/shipping FAQ answers
- `src/app/(marketing)/hero-preview/page.tsx` - Hero preview variants updated
- `src/app/(shop)/products/[slug]/page.tsx` - Product detail warranty info
- `src/app/api/ai/chat-rag/route.ts` - Updated chat suggested questions
- `src/components/chat/UniversalChatWidget.tsx` - Updated chat prompts
- `src/components/products/ProductFilters.tsx` - Fixed Available Now and price range filters
- `public/images/hero/` - Added local hero images (10.webp, 11.webp, 12.webp)

---

## Pending Tasks

### 1. Add Misc Category to Products (Database)
Run this SQL in Supabase SQL Editor:
```sql
-- Insert Misc category
INSERT INTO categories (tenant_id, name, slug, description, display_order)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Misc',
  'misc',
  'Miscellaneous motorcycle accessories and parts',
  99
);

-- Add some sample products (get category ID first)
WITH misc_cat AS (
  SELECT id FROM categories WHERE slug = 'misc' AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
)
INSERT INTO products (tenant_id, category_id, name, slug, description, price, available)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  misc_cat.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.available
FROM misc_cat, (VALUES
  ('Tie-Down Straps Set', 'tie-down-straps-set', 'Heavy-duty ratchet tie-down straps for secure motorcycle transport', 49.99, true),
  ('Wheel Chock', 'wheel-chock', 'Front wheel chock for stable loading and transport', 89.99, true),
  ('Anti-Slip Mat', 'anti-slip-mat', 'Rubber anti-slip mat for ramp surface', 34.99, true)
) AS p(name, slug, description, price, available);
```

### 2. Blur License Plates in Hero Images
Manual task: Edit these images to blur visible license plates:
- `/public/images/hero/10.webp` - Truck with license plate
- `/public/images/hero/11.webp` - Check for visible plates
- `/public/images/hero/12.webp` - Motorcycle with license plate

Use image editing software (Photoshop, GIMP, etc.) to apply blur effect.

---

## Technical Details

### Product Filtering Architecture
- URL-based filtering using Next.js `useSearchParams`
- Filters: `available=true`, `minPrice`, `maxPrice`, `q` (search), `category`
- Price range uses debounced auto-apply (500ms delay after user stops dragging)
- Available Now filter provides immediate visual feedback with green styling

### Database
- Tenant ID: `00000000-0000-0000-0000-000000000001`
- Uses Supabase PostgreSQL
- UUID columns require `::uuid` casting in SQL

---

## Deployment Commands

```bash
# SSH to VPS
ssh root@5.161.187.109

# Auto-deploy should trigger on git push
# Manual deploy if needed:
cd /opt/ezcr-staging
git fetch origin && git reset --hard origin/main
docker build -t ezcr-nextjs-prod:latest --build-arg CACHEBUST=$(date +%s) .
docker stop ezcr-nextjs && docker rm ezcr-nextjs
docker run -d --name ezcr-nextjs --restart unless-stopped --network coolify \
  -p 3001:3000 -e NODE_ENV=production -e PORT=3000 -e HOSTNAME=0.0.0.0 \
  --env-file /opt/ezcr-staging/.env.production ezcr-nextjs-prod:latest
```

---

## How to Resume

```bash
# Navigate to project
cd C:\Users\morri\Dropbox\Websites\ezcr

# Start Claude
claude

# Resume session
/resume
```

---

**Session Status**: COMPLETE
**Build Status**: Passing
**Deploy Status**: Ready to push to main
**Next Session**: Run Misc category SQL, blur license plates in hero images
