# Coolify Deployment Guide - EZ Cycle Ramp

Complete step-by-step instructions for deploying to **dev.ezcycleramp.com** using **Coolify** on your Hetzner VPS.

---

## Why Coolify is Perfect for This

Coolify handles automatically:
- ✅ **Git deployment** - Push to GitHub, auto-deploy
- ✅ **SSL certificates** - Automatic Let's Encrypt
- ✅ **Reverse proxy** - Built-in Traefik/Nginx
- ✅ **Environment variables** - GUI management
- ✅ **Docker containers** - Isolated deployments
- ✅ **Logs & monitoring** - Web-based interface
- ✅ **Zero-downtime deploys** - Rolling updates

**Estimated time:** 30-45 minutes (vs 3-4 hours manual setup!)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Access Coolify](#access-coolify)
3. [Connect GitHub Repository](#connect-github-repository)
4. [Create New Project](#create-new-project)
5. [Configure Application](#configure-application)
6. [Add Environment Variables](#add-environment-variables)
7. [Configure Domain](#configure-domain)
8. [Setup Database](#setup-database)
9. [Deploy Application](#deploy-application)
10. [Verification](#verification)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Coolify installed** on Hetzner VPS (you mentioned it's already installed ✅)
- [ ] **Coolify admin access** (username/password or SSH key)
- [ ] **GitHub account** with access to mocamGitHub/ezcr
- [ ] **Domain DNS access** for ezcycleramp.com
- [ ] **Supabase account** (or ready to create one)
- [ ] **Stripe API keys** (production or test mode)
- [ ] **OpenAI API key**

### What You Need to Know

- **Coolify URL**: https://coolify.yourdomain.com (or your Coolify IP)
- **Hetzner VPS IP**: Your server IP address
- **GitHub Repository**: https://github.com/mocamGitHub/ezcr

---

## Access Coolify

### Step 1: Log into Coolify Dashboard

1. Open browser and navigate to your Coolify instance:
   ```
   https://coolify31.com
   ```
   (or whatever your Coolify domain is)

2. **Log in** with your credentials

3. You should see the **Coolify Dashboard**

### Step 2: Verify Coolify Status

On the dashboard, check:
- [ ] **Server status**: Should show "Connected" or "Healthy"
- [ ] **Docker**: Should show "Running"
- [ ] **Proxy**: Should show "Running" (Traefik or Nginx)

**If any service is not running:**
1. Click on **Servers** in left sidebar
2. Click on your server
3. Click **Validate & Repair**

---

## Connect GitHub Repository

### Step 1: Add GitHub as Source

1. In Coolify dashboard, click **Sources** in left sidebar
2. Click **+ Add Source**
3. Choose **GitHub**

### Step 2: GitHub OAuth (Option A - Recommended)

1. Click **Connect with GitHub**
2. Authorize Coolify to access your GitHub account
3. Grant access to repositories (select `mocamGitHub/ezcr`)
4. Click **Authorize**

**You'll be redirected back to Coolify with GitHub connected**

### Step 3: Personal Access Token (Option B - Alternative)

If OAuth doesn't work:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. **Note**: "Coolify - EZ Cycle Ramp"
4. **Expiration**: 90 days or No expiration
5. **Scopes**: Select:
   - [x] `repo` (all sub-options)
   - [x] `read:org`
   - [x] `user:email`
6. Click **Generate token**
7. **Copy the token** (you won't see it again!)
8. Back in Coolify:
   - Select **GitHub**
   - Choose **Personal Access Token**
   - Paste token
   - Click **Save**

### Step 4: Verify Repository Access

1. In Coolify, go to **Sources**
2. You should see **GitHub** listed
3. Status should show **Connected** ✅

---

## Create New Project

### Step 1: Create Project

1. In Coolify dashboard, click **Projects** in left sidebar
2. Click **+ New Project**
3. Fill in details:
   - **Project Name**: `EZ Cycle Ramp`
   - **Description**: `E-commerce site for motorcycle loading ramps`
4. Click **Save**

### Step 2: Create Environment

1. Inside the project, click **+ New Environment**
2. **Name**: `production` (or `dev` for staging)
3. Click **Save**

---

## Configure Application

### Step 1: Add New Resource

1. Inside the environment, click **+ New Resource**
2. Choose **Application**
3. Click **Public Repository** or **Private Repository** (mocamGitHub is private)

### Step 2: Select Repository

1. **Source**: Select your connected GitHub account
2. **Repository**: Search for `mocamGitHub/ezcr` or paste URL:
   ```
   https://github.com/mocamGitHub/ezcr
   ```
3. **Branch**: `claude/navigate-directory-011CUQgfs8ekttSxkfCuxhFX` (production-ready branch)
   - Or `main` if you've merged the feature branch
4. Click **Continue**

### Step 3: Configure Build Settings

**Coolify will auto-detect Next.js. Verify these settings:**

1. **Build Pack**: Should auto-select **Nixpacks** or **Dockerfile**
2. **Port**: `3000` (default for Next.js)
3. **Build Command**: `npm run build` (auto-detected)
4. **Start Command**: `npm start` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

**Advanced Settings (click Show Advanced):**

- **Base Directory**: `/` (root)
- **Publish Directory**: `.next` (auto-detected)
- **Node Version**: `20` (specify if not auto-detected)

### Step 4: Name Your Application

1. **Application Name**: `ezcr-production`
2. **Description**: `EZ Cycle Ramp production deployment`
3. Click **Save**

---

## Add Environment Variables

### Step 1: Navigate to Environment Variables

1. In your application dashboard, click **Environment Variables** tab
2. Click **+ Add Variable**

### Step 2: Add Required Variables

**Add each variable one by one:**

#### Supabase Configuration

```bash
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co
Type: Build + Runtime
```

```bash
Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Type: Build + Runtime
```

```bash
Variable Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Type: Runtime Only (Secret)
```

#### Stripe Configuration

```bash
Variable Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_xxxxx (or pk_test_xxxxx for testing)
Type: Build + Runtime
```

```bash
Variable Name: STRIPE_SECRET_KEY
Value: sk_live_xxxxx (or sk_test_xxxxx for testing)
Type: Runtime Only (Secret)
```

```bash
Variable Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxx (get after creating webhook)
Type: Runtime Only (Secret)
```

#### OpenAI Configuration

```bash
Variable Name: OPENAI_API_KEY
Value: sk-proj-xxxxx
Type: Runtime Only (Secret)
```

#### Application URLs

```bash
Variable Name: NEXT_PUBLIC_SITE_URL
Value: https://dev.ezcycleramp.com
Type: Build + Runtime
```

```bash
Variable Name: NEXT_PUBLIC_API_URL
Value: https://dev.ezcycleramp.com/api
Type: Build + Runtime
```

#### Admin Configuration

```bash
Variable Name: ADMIN_EMAIL
Value: admin@ezcycleramp.com
Type: Runtime Only
```

#### Node Environment

```bash
Variable Name: NODE_ENV
Value: production
Type: Build + Runtime
```

#### Optional: Email Service (Resend)

```bash
Variable Name: RESEND_API_KEY
Value: re_xxxxx
Type: Runtime Only (Secret)
```

```bash
Variable Name: RESEND_FROM_EMAIL
Value: noreply@ezcycleramp.com
Type: Runtime Only
```

#### Optional: Analytics

```bash
Variable Name: NEXT_PUBLIC_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX
Type: Build + Runtime
```

### Step 3: Bulk Import (Alternative Method)

If Coolify supports bulk import:

1. Click **Bulk Add** or **Import Variables**
2. Paste all variables in format:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxx
   OPENAI_API_KEY=sk-proj-xxxxx
   NEXT_PUBLIC_SITE_URL=https://dev.ezcycleramp.com
   NEXT_PUBLIC_API_URL=https://dev.ezcycleramp.com/api
   ADMIN_EMAIL=admin@ezcycleramp.com
   NODE_ENV=production
   ```
3. Click **Import**

### Step 4: Verify Variables

1. Go to **Environment Variables** tab
2. You should see all variables listed
3. Secret variables should show `***` (hidden)

---

## Configure Domain

### Step 1: Add Domain in Coolify

1. In your application dashboard, click **Domains** tab
2. Click **+ Add Domain**
3. Enter domain: `dev.ezcycleramp.com`
4. **SSL**: Enable **Let's Encrypt** (should be default)
5. Click **Save**

**Coolify will:**
- Configure reverse proxy (Traefik/Nginx)
- Set up SSL certificate automatically
- Handle HTTP → HTTPS redirect

### Step 2: Configure DNS

**At your domain registrar (wherever ezcycleramp.com is managed):**

#### Option A: A Record (Recommended)

```
Type:  A
Name:  dev
Value: YOUR_HETZNER_VPS_IP (e.g., 5.161.84.153)
TTL:   3600 or Auto
```

#### Option B: CNAME Record

```
Type:  CNAME
Name:  dev
Value: your-coolify-domain.com
TTL:   3600 or Auto
```

**To find your Hetzner VPS IP:**
1. In Coolify, go to **Servers**
2. Click on your server
3. Copy the **IP Address**

### Step 3: Wait for DNS Propagation

```bash
# Check DNS from your local machine
dig dev.ezcycleramp.com

# Or use online tool
# Visit: https://dnschecker.org
# Enter: dev.ezcycleramp.com
# Should show your Hetzner VPS IP
```

DNS typically propagates in 5-30 minutes, but can take up to 48 hours.

### Step 4: Verify SSL Certificate

Once DNS propagates, Coolify will automatically:
1. Request SSL certificate from Let's Encrypt
2. Install certificate
3. Configure HTTPS

**Check SSL status in Coolify:**
1. Go to application → **Domains** tab
2. Status should show **SSL: Active** ✅

---

## Setup Database

### Step 1: Create Supabase Production Project

1. Go to https://supabase.com
2. Click **New Project**
3. **Organization**: Select or create organization
4. **Project Name**: `EZ Cycle Ramp Production`
5. **Database Password**: Generate strong password (save this!)
6. **Region**: Choose closest to Hetzner datacenter
   - `eu-central-1` (Frankfurt) - Good for Hetzner Germany
   - `us-east-1` (N. Virginia) - Good for Hetzner US
7. **Pricing Plan**: Free or Pro
8. Click **Create new project**
9. Wait 2-3 minutes for provisioning

### Step 2: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...`

**These should already be added to Coolify environment variables in previous step.**

### Step 3: Run Database Migrations

**Option A: Via Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. For each migration file in `supabase/migrations/` (on GitHub):
   - Open the file locally or view on GitHub
   - Copy the SQL content
   - Paste into SQL Editor
   - Click **Run**
4. **Run in order**: 00001, 00002, 00003... through 00024

**Migration files to run (in exact order):**
```
00001_initial_schema.sql
00002_seed_categories.sql
00003_create_customers.sql
00004_create_orders.sql
00005_create_shipping.sql
00006_create_team_management.sql
00007_seed_team_members.sql
00008_create_configurator.sql
00009_seed_configurator_data.sql
00010_create_ai_chat.sql
00011_create_embeddings.sql
00012_create_analytics.sql
00013_seed_sample_data.sql
00014_create_support_pages.sql
00015_seed_support_pages.sql
00016_create_customer_support_system.sql
00017_seed_support_tickets.sql
00018_fix_rls_recursion.sql
00019_create_gallery.sql
00020_seed_gallery_data.sql
00021_create_surveys.sql
00022_seed_surveys.sql
00023_create_testimonials.sql
00024_seed_testimonials.sql
```

**Option B: Via Supabase CLI**

If you have CLI access to your Hetzner VPS:

```bash
# SSH into Hetzner VPS
ssh root@YOUR_HETZNER_IP

# Install Supabase CLI
curl -sSL https://supabase.com/install.sh | bash

# Clone repository (if not already there)
git clone https://github.com/mocamGitHub/ezcr.git
cd ezcr

# Link to your Supabase project
supabase link --project-ref xxxxx

# Run migrations
supabase db push
```

### Step 4: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see all tables:
   - products
   - product_categories
   - testimonials
   - gallery_items
   - orders
   - customers
   - etc. (24 tables total)

---

## Deploy Application

### Step 1: Start Initial Deployment

Now that everything is configured, start the deployment:

1. In Coolify application dashboard, click **Deploy** button
2. Coolify will:
   - Clone repository from GitHub
   - Install dependencies (`npm install`)
   - Build application (`npm run build`)
   - Create Docker container
   - Start application (`npm start`)
   - Configure reverse proxy
   - Request SSL certificate (if DNS is ready)

**This process takes 3-5 minutes.**

### Step 2: Monitor Build Progress

1. Click **Logs** tab to watch live build output
2. You should see:
   ```
   Cloning repository...
   Installing dependencies...
   Building application...
   Starting application...
   Application ready on port 3000
   ```

### Step 3: Check Deployment Status

In application dashboard, check:
- **Status**: Should show **Running** ✅
- **Health**: Should show **Healthy** ✅
- **Logs**: Should show "Ready on http://localhost:3000"

**If deployment fails, check:**
1. **Logs** tab for error messages
2. **Environment Variables** are all set correctly
3. **Build Command** is correct (`npm run build`)
4. **Start Command** is correct (`npm start`)

---

## Verification

### Step 1: Test Application URL

1. Open browser and visit: **https://dev.ezcycleramp.com**
2. You should see the homepage load

**If you get an error:**
- **502 Bad Gateway**: Application not running, check logs
- **SSL Error**: Certificate not ready, wait 5-10 more minutes
- **DNS Error**: DNS not propagated yet, wait or use IP directly

### Step 2: Verify All Features

Go through this checklist:

- [ ] **Homepage loads** - Hero section, featured products visible
- [ ] **SSL is valid** - Green padlock in browser
- [ ] **Products page** - `/products` lists all products
- [ ] **Product detail** - Click product, detail page loads
- [ ] **Add to cart** - Add item, animated button works, cart sheet opens
- [ ] **Cart operations** - Update quantity, remove item
- [ ] **Search** - Product search returns results
- [ ] **Filters** - Category filtering works
- [ ] **Animations** - Lottie animations play (empty cart, success, etc.)
- [ ] **Dark mode** - Toggle between light and dark
- [ ] **Testimonials** - Homepage shows customer reviews
- [ ] **Gallery** - `/gallery` page works, lightbox opens
- [ ] **Admin panel** - `/admin` redirects to login or shows dashboard
- [ ] **Responsive** - Resize browser, mobile view works
- [ ] **No console errors** - Open DevTools (F12), check console

### Step 3: Test Authentication

1. Go to `/signup`
2. Create test account
3. Check email for verification
4. Click verification link
5. Should be logged in

### Step 4: Test Checkout (Optional)

1. Add product to cart
2. Go to `/checkout`
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Should redirect to success page with Lottie animation

### Step 5: Check Coolify Metrics

In Coolify application dashboard:

1. **Metrics** tab - Check CPU, memory usage
2. **Logs** tab - Verify no errors
3. **Deployments** tab - Shows successful deployment

---

## Troubleshooting

### Issue 1: Deployment Failed

**Check Logs:**
1. Go to **Logs** tab in Coolify
2. Look for error messages

**Common Issues:**

**1. Build failed - "Module not found"**
```
Solution:
- Check node_modules are installing correctly
- Verify package.json is in repository root
- Try redeploying
```

**2. Environment variable errors**
```
Solution:
- Go to Environment Variables tab
- Verify all NEXT_PUBLIC_* variables are marked "Build + Runtime"
- Verify secret variables are set
- Redeploy
```

**3. Port binding error**
```
Solution:
- Check port 3000 is set in application settings
- Verify no other app is using port 3000
- In Coolify, go to Settings → Port → Set to 3000
```

### Issue 2: Domain Not Working

**DNS Issues:**
```bash
# Check DNS propagation
dig dev.ezcycleramp.com

# Should return your Hetzner VPS IP
```

**Solutions:**
1. Verify A record points to correct IP
2. Wait for DNS propagation (5-30 minutes)
3. Clear your DNS cache:
   - Mac: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`
   - Linux: `sudo systemd-resolve --flush-caches`

### Issue 3: SSL Certificate Not Working

**Symptoms:** Browser shows "Not Secure"

**Solutions:**
1. In Coolify, check **Domains** tab
2. SSL status should show "Active"
3. If not:
   - Click **Regenerate Certificate**
   - Wait 5-10 minutes
   - Refresh page

**Requirements for SSL:**
- DNS must be pointing to correct IP
- Port 80 and 443 must be open
- Coolify proxy must be running

### Issue 4: Application Keeps Restarting

**Check Logs:**
```
Go to Logs tab, look for:
- "Out of memory" → Increase memory allocation
- "Port already in use" → Check port settings
- "Database connection failed" → Check Supabase credentials
```

**Solutions:**
1. In Coolify, go to **Resources** tab
2. Increase **Memory Limit** (e.g., 512MB → 1GB)
3. Increase **CPU Limit** if needed
4. Redeploy

### Issue 5: Database Connection Errors

**Symptoms:** "Failed to fetch products" or 401 errors

**Solutions:**
1. Verify environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Check Supabase project is "Healthy" in dashboard
3. Verify RLS policies are enabled in Supabase
4. Test connection from Supabase SQL Editor:
   ```sql
   SELECT COUNT(*) FROM products;
   ```

### Issue 6: Images Not Loading

**Solutions:**
1. Check `next.config.ts` includes image domains
2. Verify Supabase Storage bucket is public
3. Check Coolify logs for image optimization errors
4. Redeploy application

---

## Maintenance

### Update Application (Deploy New Changes)

When you push changes to GitHub:

**Option A: Auto-Deploy (Recommended)**

1. In Coolify, go to **Settings** tab
2. Enable **Auto Deploy**
3. Choose trigger:
   - **Push to branch** (recommended)
   - **Manual only**
4. Save settings

**Now, every time you push to GitHub, Coolify will auto-deploy!**

**Option B: Manual Deploy**

1. Push changes to GitHub
2. In Coolify application dashboard, click **Deploy**
3. Coolify will pull latest changes and redeploy

### View Logs

```
1. Go to Coolify application dashboard
2. Click "Logs" tab
3. View real-time logs
4. Filter by: Build logs, Runtime logs, Error logs
```

### Restart Application

```
1. In Coolify dashboard, click "Restart" button
2. Application will restart in ~10 seconds
3. Zero downtime (Coolify handles rolling restart)
```

### Check Resource Usage

```
1. Go to "Metrics" tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Disk usage
```

### Scale Application

```
1. Go to "Resources" tab
2. Adjust:
   - Memory: 512MB, 1GB, 2GB, etc.
   - CPU: 1 core, 2 cores, etc.
   - Replicas: 1, 2, 3... (for load balancing)
3. Click "Save"
4. Application will restart with new resources
```

### Backup Database

```
1. In Supabase Dashboard:
   Settings → Database → Backups
2. Click "Create Backup"
3. Download backup file
4. Store securely
```

### Monitor Uptime

Coolify has built-in monitoring, but you can also add external:

1. **UptimeRobot** (free): https://uptimerobot.com
2. Add monitor for: https://dev.ezcycleramp.com
3. Get email alerts if site goes down

---

## Advanced Configuration

### Enable GitHub Webhooks (Auto-Deploy)

1. In Coolify, go to **Settings** → **Webhooks**
2. Copy the webhook URL
3. Go to GitHub repository → **Settings** → **Webhooks**
4. Click **Add webhook**
5. **Payload URL**: Paste Coolify webhook URL
6. **Content type**: `application/json`
7. **Events**: Push events
8. Click **Add webhook**

**Now every push to GitHub triggers auto-deploy!**

### Setup Staging Environment

1. In Coolify project, click **+ New Environment**
2. Name: `staging`
3. Add same application, but:
   - Branch: `develop` or `staging`
   - Domain: `staging.ezcycleramp.com`
   - Environment variables: Use test Stripe keys
4. Deploy

**Now you have staging + production!**

### Configure Custom Build Command

If you need custom build steps:

1. Go to **Settings** → **Build**
2. **Build Command**:
   ```bash
   npm install && npm run build
   ```
3. **Pre-deploy Command** (optional):
   ```bash
   npm run db:migrate
   ```
4. Save and redeploy

### Add Health Checks

1. Go to **Settings** → **Health Check**
2. **Path**: `/api/health` (create this endpoint)
3. **Interval**: 30 seconds
4. **Timeout**: 5 seconds
5. **Retries**: 3
6. Save

Create health check endpoint in your app:
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' })
}
```

---

## Quick Reference

### Essential Commands (Via Coolify UI)

| Action | Steps |
|--------|-------|
| Deploy | Application → Deploy button |
| View Logs | Application → Logs tab |
| Restart | Application → Restart button |
| Update Env Vars | Application → Environment Variables → Add/Edit |
| Check Status | Application dashboard → Status indicator |
| View Metrics | Application → Metrics tab |

### Important URLs

```
Coolify Dashboard:  https://coolify31.com (or your domain)
Application:        https://dev.ezcycleramp.com
Supabase:          https://supabase.com
GitHub Repo:       https://github.com/mocamGitHub/ezcr
```

### Support Resources

- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://coollabs.io/discord
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Comparison: Coolify vs Manual Setup

| Feature | Coolify | Manual VPS |
|---------|---------|------------|
| Setup Time | 30-45 min | 3-4 hours |
| SSL Setup | Automatic | Manual (Certbot) |
| Deployments | One-click | SSH + commands |
| Logs | Web UI | SSH + tail |
| Monitoring | Built-in | Manual setup |
| Updates | Auto-deploy | Git pull + restart |
| Rollbacks | One-click | Manual git revert |
| Scaling | GUI sliders | Edit config files |

**Coolify is clearly the better option for your use case! 🚀**

---

## Success Checklist

Your deployment is successful when:

- [ ] Coolify dashboard accessible
- [ ] GitHub repository connected
- [ ] Application created in Coolify
- [ ] Environment variables configured (11+ variables)
- [ ] Domain added (dev.ezcycleramp.com)
- [ ] DNS configured (A record to Hetzner IP)
- [ ] SSL certificate active (Let's Encrypt)
- [ ] Database migrations completed (24 migrations)
- [ ] Application deployed (status: Running)
- [ ] Website loads at https://dev.ezcycleramp.com
- [ ] All features tested and working
- [ ] Logs show no errors
- [ ] Metrics show healthy status

---

## Estimated Timeline (Coolify)

| Task | Time |
|------|------|
| Access Coolify | 2 min |
| Connect GitHub | 5 min |
| Create Project | 5 min |
| Configure Application | 10 min |
| Add Environment Variables | 10 min |
| Configure Domain | 5 min |
| Setup Database | 20 min |
| Deploy Application | 5 min |
| Verification | 10 min |
| **Total** | **~45 min - 1 hour** |

---

**Deployment Complete with Coolify! 🎉**

Your EZ Cycle Ramp application should now be live at **https://dev.ezcycleramp.com**

Coolify makes deployments and maintenance incredibly simple. Enjoy your streamlined workflow!

For questions, refer to the Troubleshooting section or Coolify documentation.
