# Session Handoff - Database-Driven Content & Animated CTA

**Date**: December 3, 2025
**Latest Commit**: `e7e1ed4` - feat: Add database-driven content sections and animated CTA button
**Branch**: main
**Staging URL**: https://staging.ezcycleramp.com
**VPS**: 5.161.187.109 (SSH as root)

---

## What Was Accomplished This Session

### 1. Database-Driven Homepage Sections
- **FeaturedProducts**: Created server component that fetches featured products from Supabase
- **BlogPreview**: Created server component for blog posts from database with fallback data
- **Restructured page.tsx**: Split into server component (page.tsx) and client components (HomePageClient.tsx)

### 2. Blog Database Infrastructure
- Created `blog_posts` table migration: `supabase/migrations/20241203_create_blog_posts.sql`
- Added blog query functions to `src/lib/supabase/queries.ts`:
  - `getBlogPosts(limit?)` - Get all published posts
  - `getFeaturedBlogPosts(limit)` - Get featured posts
  - `getBlogPostBySlug(slug)` - Get single post
  - `getBlogPostsByCategory(category)` - Filter by category
- Sample blog posts included in migration

### 3. Animated CTA Button
- Created `src/components/ui/animated-cta-button.tsx`
- Rotating border beam effect with orange/white gradient
- Used in "Not Sure Which Ramp Is Right?" section
- Background matches section: `bg-gray-200 dark:bg-slate-900`

### 4. Bug Fixes
- **FAQ Page Scroll Issue**: Fixed chat widget causing page to scroll on load
  - Changed from `scrollIntoView()` to `scrollTop` on container
  - File: `src/components/chat/UniversalChatWidget.tsx`

### 5. Styling Updates
- Various button styling adjustments (transparent backgrounds, consistent sizing)
- Header theme support improvements

---

## Key Files Created/Modified

### New Files
- `src/components/products/FeaturedProducts.tsx` - Server component for featured products
- `src/components/blog/BlogPreview.tsx` - Server component for blog preview
- `src/components/marketing/HomePageClient.tsx` - Client components extracted from homepage
- `src/components/ui/animated-cta-button.tsx` - Animated button with border beam
- `supabase/migrations/20241203_create_blog_posts.sql` - Blog table migration

### Modified Files
- `src/app/(marketing)/page.tsx` - Now a server component importing both server and client components
- `src/app/(marketing)/blog/page.tsx` - Uses database with fallback
- `src/components/chat/UniversalChatWidget.tsx` - Fixed scroll issue
- `src/lib/supabase/queries.ts` - Added blog query functions
- `src/components/layout/Header.tsx` - Theme styling updates
- `tailwind.config.ts` - Added beam animation keyframes
- `src/app/globals.css` - Added beam-rotate animation

---

## Database Setup Required

The blog_posts table needs to be created in Supabase:

```sql
-- Run in Supabase SQL Editor:
-- Copy contents of: supabase/migrations/20241203_create_blog_posts.sql
```

Until the migration is run, the site uses fallback data and will work normally.

---

## Current Status

- **Build Status**: Passing
- **Dev Server**: Running on port 3002 (or default 3000)
- **Blog Database**: Migration created, needs to be run in Supabase
- **Fallback Data**: In place for all database-driven sections

---

## Pending Tasks from Previous Sessions

### 1. Blur License Plates in Hero Images
Manual task: Edit these images to blur visible license plates:
- `/public/images/hero/10.webp`
- `/public/images/hero/11.webp`
- `/public/images/hero/12.webp`

### 2. Blog Article Detail Pages
Blog cards link to `/blog/[slug]` - individual post pages may need content

### 3. Run Database Migration
Execute `supabase/migrations/20241203_create_blog_posts.sql` in Supabase SQL Editor

---

## Deployment Commands

```bash
# SSH to VPS
ssh root@5.161.187.109

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

After running `/clear`:

```bash
# 1. Read this handoff document
cat SESSION_HANDOFF.md

# 2. Start dev server if needed
npm run dev

# 3. Review key new files
# src/components/products/FeaturedProducts.tsx
# src/components/blog/BlogPreview.tsx
# src/components/marketing/HomePageClient.tsx
# supabase/migrations/20241203_create_blog_posts.sql
```

---

**Session Status**: COMPLETE
**Build Status**: Passing
**Deploy Status**: Ready for push
**Next Session**: Run blog_posts migration in Supabase, verify database-driven content
