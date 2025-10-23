# EZ Cycle Ramp - Production Deployment Guide

Complete step-by-step instructions for deploying to **dev.ezcycleramp.com**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Option A: Vercel (Recommended)](#option-a-vercel-recommended)
3. [Deployment Option B: Self-Hosted VPS](#option-b-self-hosted-vps)
4. [Database Setup (Supabase)](#database-setup)
5. [Domain Configuration](#domain-configuration)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with repository access to `mocamGitHub/ezcr`
- [ ] Domain `ezcycleramp.com` with DNS access
- [ ] Supabase project (or ability to create one)
- [ ] Stripe account (for payments)
- [ ] OpenAI API key (for AI chat features)
- [ ] Node.js 18+ installed locally (for testing)

---

## Option A: Vercel (Recommended)

Vercel is the recommended hosting platform for Next.js applications. It offers:
- Automatic deployments from Git
- Built-in CI/CD
- Edge network (CDN)
- Zero-config SSL
- Serverless functions
- Free for hobby projects

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### Step 2: Import Project

1. From Vercel dashboard, click **Add New** → **Project**
2. Find `mocamGitHub/ezcr` in the repository list
3. Click **Import**
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (keep default)
   - **Build Command**: `npm run build` (default is fine)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 3: Configure Environment Variables

**IMPORTANT:** Before deploying, add all environment variables.

In Vercel project settings, go to **Settings** → **Environment Variables** and add:

#### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration (Production Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxx

# Application URLs
NEXT_PUBLIC_SITE_URL=https://dev.ezcycleramp.com
NEXT_PUBLIC_API_URL=https://dev.ezcycleramp.com/api

# Admin Configuration
ADMIN_EMAIL=your-admin@email.com

# Optional: Email Service (if using)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Sentry Error Tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Node Environment
NODE_ENV=production
```

**Environment Selection:**
- For each variable, select **Production**, **Preview**, and **Development** (or just Production for now)

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide a deployment URL: `ezcr-xxxxx.vercel.app`
4. Test the deployment URL before connecting custom domain

### Step 5: Connect Custom Domain

1. In Vercel project, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter `dev.ezcycleramp.com`
4. Vercel will show DNS configuration instructions

**DNS Configuration (at your domain registrar):**

Add a CNAME record:
```
Type:  CNAME
Name:  dev
Value: cname.vercel-dns.com
TTL:   3600 (or Auto)
```

**Alternative (if CNAME doesn't work):**
Add an A record:
```
Type:  A
Name:  dev
Value: 76.76.21.21
TTL:   3600
```

5. Wait for DNS propagation (5 minutes to 48 hours, usually 10-30 minutes)
6. Vercel will automatically provision SSL certificate

### Step 6: Verify Deployment

Visit https://dev.ezcycleramp.com and verify:
- [ ] Homepage loads correctly
- [ ] Products page shows products from database
- [ ] Cart functionality works
- [ ] Testimonials appear
- [ ] Animations play smoothly
- [ ] Dark mode toggle works
- [ ] SSL certificate is valid (padlock in browser)

---

## Option B: Self-Hosted VPS

If you prefer self-hosting on a VPS (DigitalOcean, Linode, AWS EC2, etc.):

### Step 1: Provision Server

**Recommended Specs:**
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2 cores minimum
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 25GB minimum
- **Provider**: DigitalOcean ($12/month), Linode, AWS, etc.

### Step 2: Initial Server Setup

SSH into your server:

```bash
ssh root@your-server-ip
```

Update system:
```bash
apt update && apt upgrade -y
```

Create non-root user:
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Step 3: Install Dependencies

Install Node.js 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x
npm -v   # Should show 10.x
```

Install PM2 (process manager):
```bash
sudo npm install -g pm2
```

Install Nginx:
```bash
sudo apt install -y nginx
```

### Step 4: Clone Repository

Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "deploy@ezcycleramp"
cat ~/.ssh/id_ed25519.pub
```

Add the SSH key to GitHub:
1. Copy the output
2. Go to GitHub → Settings → SSH Keys → Add New
3. Paste and save

Clone repository:
```bash
cd /var/www
sudo mkdir ezcr
sudo chown deploy:deploy ezcr
cd ezcr
git clone git@github.com:mocamGitHub/ezcr.git .
```

### Step 5: Configure Environment

Create production environment file:
```bash
nano .env.production.local
```

Add all environment variables (same as Vercel section above).

### Step 6: Build Application

Install dependencies:
```bash
npm install
```

Build for production:
```bash
npm run build
```

This creates an optimized production build in `.next/`

### Step 7: Configure PM2

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ezcr',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ezcr',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

Create logs directory:
```bash
mkdir logs
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

### Step 8: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/ezcr
```

```nginx
server {
    listen 80;
    server_name dev.ezcycleramp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ezcr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Step 10: Install SSL Certificate

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Get certificate:
```bash
sudo certbot --nginx -d dev.ezcycleramp.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

Certbot automatically updates Nginx config and sets up auto-renewal.

### Step 11: Configure DNS

At your domain registrar, add an A record:

```
Type:  A
Name:  dev
Value: your-server-ip
TTL:   3600
```

Wait for DNS propagation (5-30 minutes).

### Step 12: Verify Deployment

Visit https://dev.ezcycleramp.com and run through verification checklist (same as Vercel).

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **New Project**
3. Fill in details:
   - **Name**: EZ Cycle Ramp Production
   - **Database Password**: (generate strong password, save it)
   - **Region**: Choose closest to your users (US East, EU West, etc.)
   - **Pricing Plan**: Free (or Pro if needed)
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

### Step 2: Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)

### Step 3: Configure Database

In Supabase dashboard, go to **SQL Editor**

Run migrations in order:

1. Click **New Query**
2. Copy contents of `supabase/migrations/00001_initial_schema.sql`
3. Paste and click **Run**
4. Repeat for all migration files in order (00002, 00003, ... 00024)

**Important:** Run migrations in exact numerical order!

### Step 4: Enable RLS Policies

All migrations include RLS policies. Verify they're enabled:

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - products
   - testimonials
   - customers
   - orders
   - etc.

### Step 5: Seed Initial Data

Run seed files:

1. `supabase/migrations/00002_seed_categories.sql` (creates product categories)
2. `supabase/migrations/00024_seed_testimonials.sql` (creates sample testimonials)

### Step 6: Upload Product Images

**Option 1: Using Supabase Storage**

1. Go to **Storage** → **Create bucket**
2. Name: `product-images`
3. Make public
4. Upload product images
5. Update `product_images` table with URLs

**Option 2: Using External CDN**

- Upload to Cloudinary, AWS S3, or similar
- Update `product_images` table with URLs

### Step 7: Verify Database Connection

Test from your application:

```bash
# Local test
npm run dev

# Check browser console for any Supabase errors
# Try loading products page
```

---

## Domain Configuration

### DNS Records Summary

At your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**For Vercel:**
```
Type:  CNAME
Name:  dev
Value: cname.vercel-dns.com
TTL:   Auto
```

**For Self-Hosted:**
```
Type:  A
Name:  dev
Value: your-server-ip
TTL:   3600
```

**Optional: Add WWW redirect:**
```
Type:  CNAME
Name:  www.dev
Value: dev.ezcycleramp.com
TTL:   3600
```

### DNS Propagation Check

Check if DNS has propagated:

```bash
# macOS/Linux
dig dev.ezcycleramp.com

# Or use online tool
https://dnschecker.org
```

---

## Environment Variables

### Complete List

Create a `.env.production.local` file with these variables:

```bash
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# STRIPE CONFIGURATION (PRODUCTION KEYS)
# =============================================================================
# Get from: Stripe Dashboard → Developers → API Keys
# IMPORTANT: Use "live" keys, not "test" keys!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxx
STRIPE_SECRET_KEY=sk_live_51xxxxx

# Webhook secret (create webhook endpoint first)
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# Endpoint URL: https://dev.ezcycleramp.com/api/stripe/webhook
# Events to listen: checkout.session.completed, payment_intent.succeeded
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# =============================================================================
# OPENAI CONFIGURATION
# =============================================================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxx

# =============================================================================
# APPLICATION URLS
# =============================================================================
NEXT_PUBLIC_SITE_URL=https://dev.ezcycleramp.com
NEXT_PUBLIC_API_URL=https://dev.ezcycleramp.com/api

# =============================================================================
# ADMIN CONFIGURATION
# =============================================================================
ADMIN_EMAIL=admin@ezcycleramp.com

# =============================================================================
# EMAIL SERVICE (Optional - if using Resend)
# =============================================================================
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# =============================================================================
# ANALYTICS (Optional)
# =============================================================================
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# =============================================================================
# ERROR TRACKING (Optional)
# =============================================================================
# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# =============================================================================
# NODE ENVIRONMENT
# =============================================================================
NODE_ENV=production

# =============================================================================
# SHIPPING (Optional - if using T-Force)
# =============================================================================
TFORCE_API_KEY=xxxxx
TFORCE_API_SECRET=xxxxx
```

### Where to Get Each Key

| Variable | Where to Get It |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (keep secret!) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys (Live mode) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys (Live mode) |
| `STRIPE_WEBHOOK_SECRET` | Create webhook first, then copy secret |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `RESEND_API_KEY` | https://resend.com/api-keys |

---

## Post-Deployment Checklist

### Functional Testing

- [ ] **Homepage**
  - [ ] Hero section loads
  - [ ] Featured products display
  - [ ] Testimonials section shows reviews
  - [ ] All animations play smoothly (Lottie)

- [ ] **Products Page**
  - [ ] All products load from database
  - [ ] Product images display correctly
  - [ ] Filtering by category works
  - [ ] Search functionality works
  - [ ] Add to Cart button animations work

- [ ] **Product Detail Page**
  - [ ] Product details load correctly
  - [ ] Image gallery works
  - [ ] Add to Cart button works with success animation
  - [ ] Related products appear

- [ ] **Shopping Cart**
  - [ ] Cart sheet opens/closes
  - [ ] Quantity updates work
  - [ ] Remove item works
  - [ ] Total calculates correctly
  - [ ] Empty cart shows Lottie animation

- [ ] **Checkout**
  - [ ] Stripe integration works
  - [ ] Test payment succeeds (use test card: 4242 4242 4242 4242)
  - [ ] Order confirmation page shows success animation
  - [ ] Order saved to database

- [ ] **Authentication**
  - [ ] Sign up works
  - [ ] Login works
  - [ ] Password reset works
  - [ ] Protected routes redirect correctly

- [ ] **Admin Panel** (login as admin)
  - [ ] `/admin` requires authentication
  - [ ] Products management works
  - [ ] Orders dashboard loads
  - [ ] Testimonials approval workflow works
  - [ ] Analytics display correctly

- [ ] **Testimonials**
  - [ ] Submit review form works
  - [ ] Star rating interactive
  - [ ] Admin can approve/reject
  - [ ] Approved reviews appear on homepage

- [ ] **UI/UX**
  - [ ] Dark mode toggle works
  - [ ] Responsive design (test on mobile)
  - [ ] All Lottie animations play smoothly
  - [ ] No console errors

### Performance Testing

```bash
# Run Lighthouse audit
# Chrome DevTools → Lighthouse → Run audit

# Target scores:
# Performance: > 80
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### Security Checklist

- [ ] SSL certificate is valid and auto-renewing
- [ ] Environment variables are set (not using .env.local)
- [ ] Supabase RLS policies are enabled
- [ ] Admin routes require authentication
- [ ] API routes validate input
- [ ] Stripe webhook signature verification enabled
- [ ] CORS configured correctly
- [ ] Security headers set (CSP, X-Frame-Options, etc.)

### Monitoring Setup

**Set up monitoring tools:**

1. **Vercel Analytics** (if using Vercel)
   - Automatically enabled
   - View in Vercel dashboard

2. **Sentry Error Tracking** (recommended)
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Uptime Monitoring** (optional)
   - UptimeRobot (free): https://uptimerobot.com
   - Add monitor for https://dev.ezcycleramp.com

4. **Database Monitoring**
   - Supabase Dashboard → Database → Monitoring
   - Check connection count, query performance

---

## Troubleshooting

### Issue: Build Fails with "Module not found"

**Cause:** Import paths incorrect or missing dependencies

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Issue: "Failed to fetch Inter from Google Fonts"

**Cause:** Build environment can't access Google Fonts

**Solution:** Already fixed in latest commit (6986d69) - uses system font temporarily

**To restore Google Fonts** (after deployment):
```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// In body tag:
<body className={inter.className}>
```

### Issue: Database Connection Error

**Symptoms:** "Failed to fetch products" or 401/403 errors

**Solutions:**

1. **Check Supabase credentials:**
   ```bash
   # Verify environment variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Verify RLS policies:**
   - Go to Supabase → Authentication → Policies
   - Check policies allow public read access for products

3. **Check Supabase project status:**
   - Dashboard → Project should show "Healthy"

4. **Test connection:**
   ```bash
   # In browser console
   const { createClient } = require('@supabase/supabase-js')
   const supabase = createClient(
     'your-url',
     'your-anon-key'
   )
   const { data } = await supabase.from('products').select('*')
   console.log(data)
   ```

### Issue: Stripe Webhook Failing

**Symptoms:** Orders created but not saved to database

**Solutions:**

1. **Verify webhook endpoint:**
   - Stripe Dashboard → Developers → Webhooks
   - Endpoint should be: `https://dev.ezcycleramp.com/api/stripe/webhook`

2. **Check webhook secret:**
   ```bash
   # Environment variable should match Stripe
   echo $STRIPE_WEBHOOK_SECRET
   ```

3. **Test webhook:**
   - Stripe Dashboard → Developers → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Check endpoint logs

4. **Verify events:**
   - Webhook should listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`

### Issue: Images Not Loading

**Symptoms:** Broken image icons or 404 errors

**Solutions:**

1. **Check Supabase Storage:**
   - Supabase → Storage → product-images bucket
   - Verify images uploaded
   - Check bucket is public

2. **Verify Next.js image domains:**
   ```typescript
   // next.config.ts
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'images.unsplash.com',
       },
       {
         protocol: 'https',
         hostname: '*.supabase.co', // Add if using Supabase Storage
       },
     ],
   }
   ```

3. **Check image URLs in database:**
   ```sql
   SELECT url FROM product_images LIMIT 5;
   ```

### Issue: 502 Bad Gateway (Self-Hosted)

**Cause:** Next.js app not running or Nginx misconfigured

**Solutions:**

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs ezcr
   ```

2. **Restart application:**
   ```bash
   pm2 restart ezcr
   ```

3. **Check Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo systemctl restart nginx
   ```

4. **Check port 3000:**
   ```bash
   netstat -tlnp | grep 3000
   curl http://localhost:3000
   ```

### Issue: Animations Not Playing

**Symptoms:** Static images instead of Lottie animations

**Solutions:**

1. **Check animation files:**
   ```bash
   ls -la src/animations/
   # Should show: empty-cart.json, loading.json, no-results.json, success.json
   ```

2. **Verify lottie-react installed:**
   ```bash
   npm list lottie-react
   # Should show: lottie-react@2.4.1
   ```

3. **Check browser console for errors**

4. **Test animation import:**
   ```tsx
   import successAnimation from '@/animations/success.json'
   console.log(successAnimation) // Should log animation object
   ```

### Issue: Dark Mode Not Working

**Solution:**

Check theme script in `layout.tsx`:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    `,
  }}
/>
```

### Getting Help

If issues persist:

1. **Check application logs:**
   - Vercel: Project → Deployments → [latest] → Runtime Logs
   - Self-hosted: `pm2 logs ezcr`

2. **Check Supabase logs:**
   - Dashboard → Logs Explorer

3. **Browser DevTools:**
   - Console tab (JavaScript errors)
   - Network tab (failed requests)
   - Application tab (localStorage, cookies)

4. **Contact support:**
   - Create GitHub issue with:
     - Error message
     - Steps to reproduce
     - Browser/OS info
     - Screenshots

---

## Quick Reference

### Vercel Deployment Commands

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy from command line
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

### Self-Hosted Management Commands

```bash
# Application
pm2 restart ezcr          # Restart app
pm2 logs ezcr            # View logs
pm2 monit                # Monitor resources

# Nginx
sudo nginx -t            # Test config
sudo systemctl reload nginx   # Reload config
sudo systemctl restart nginx  # Restart Nginx

# SSL Certificate
sudo certbot renew --dry-run  # Test renewal
sudo certbot certificates      # Check expiry

# Updates
cd /var/www/ezcr
git pull origin main
npm install
npm run build
pm2 restart ezcr
```

### Database Commands

```bash
# Connect to Supabase Database (psql)
# Get connection string from Supabase Dashboard → Settings → Database

psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# List tables
\dt

# Check products
SELECT id, name, sku FROM products LIMIT 5;

# Check testimonials
SELECT id, customer_name, status FROM testimonials LIMIT 5;
```

---

## Success Criteria

Your deployment is successful when:

✅ **Website loads at https://dev.ezcycleramp.com**
✅ **SSL certificate is valid (padlock icon)**
✅ **All products display from database**
✅ **Cart functionality works end-to-end**
✅ **Stripe test payment completes**
✅ **Lottie animations play smoothly**
✅ **Testimonials load and display**
✅ **Admin panel accessible and functional**
✅ **No console errors in browser**
✅ **Mobile responsive design works**
✅ **Dark mode toggle functions correctly**

---

## Next Steps After Deployment

1. **Configure Production Stripe:**
   - Switch from test mode to live mode
   - Update webhook endpoint
   - Test with real payment (small amount)

2. **Add Real Product Data:**
   - Update product descriptions
   - Upload high-quality images
   - Set accurate pricing
   - Configure inventory

3. **Marketing Setup:**
   - Add Google Analytics
   - Set up Facebook Pixel (optional)
   - Configure SEO meta tags
   - Submit sitemap to Google Search Console

4. **Legal Pages:**
   - Add Privacy Policy
   - Add Terms of Service
   - Add Shipping Policy
   - Add Return Policy

5. **Email Integration:**
   - Configure order confirmation emails
   - Set up shipping notification emails
   - Create welcome email for new users

6. **Backup Strategy:**
   - Enable Supabase daily backups (Settings → Database → Backups)
   - Export database weekly
   - Backup environment variables securely

---

## Support

For questions or issues:

- **Documentation:** This file
- **Repository:** https://github.com/mocamGitHub/ezcr
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Last Updated:** 2025-10-23
**Version:** 1.0
**Build Tested:** 6986d69 (production ready)
