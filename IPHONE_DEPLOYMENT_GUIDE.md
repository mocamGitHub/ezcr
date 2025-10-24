# iPhone Deployment Guide - Coolify + DreamHost Architecture

**Complete deployment guide for iPhone users** - Everything done through web browsers!

---

## 🎯 What We're Building

```
┌─────────────────────┐         ┌─────────────────────┐
│   Hetzner VPS       │         │   DreamHost VPS     │
│                     │  SSH    │                     │
│  Coolify (Manager)  │────────>│  Your Application   │
│                     │         │                     │
│  coolify.nexcyte.com      │         │  dev.ezcycleramp.com│
└─────────────────────┘         └─────────────────────┘
        ↑                                 ↑
        │                                 │
   You manage via                    Users access
   iPhone browser                    your website
```

**You'll do everything from your iPhone browser - no SSH client needed!**

---

## 📱 What You Need

Before starting, have these ready on your iPhone:

### Browser Tabs to Open

1. **Coolify Dashboard**: https://coolify.nexcyte.com (or your Coolify URL)
2. **DreamHost Panel**: https://panel.dreamhost.com
3. **GitHub**: https://github.com
4. **Supabase**: https://supabase.nexcyte.com
5. **Stripe Dashboard**: https://dashboard.stripe.com
6. **OpenAI**: https://platform.openai.com

### Credentials You'll Need

- [ ] **DreamHost login** (panel.dreamhost.com)
- [ ] **Coolify login** (coolify.nexcyte.com)
- [ ] **GitHub Personal Access Token** (or OAuth)
- [ ] **Supabase account** (will create project)
- [ ] **Stripe API keys** (production or test)
- [ ] **OpenAI API key**

### Apps to Install (Optional but Helpful)

- **Safari** or **Chrome** browser
- **Notes app** (for saving credentials temporarily)
- **Copy/paste** ready!

---

## ⏱️ Estimated Time

| Phase | Time |
|-------|------|
| Prepare Credentials | 30 min |
| Setup DreamHost | 20 min |
| Connect Servers | 15 min |
| Deploy Application | 30 min |
| Configure Database | 20 min |
| DNS & SSL | 15 min |
| Verify & Test | 15 min |
| **Total** | **~2-2.5 hours** |

**You can pause at any time and resume later!**

---

## 📋 Step-by-Step Guide

---

## PHASE 1: Gather Credentials (30 minutes)

### Step 1.1: Access Your Self-Hosted Supabase

**On your iPhone:**

1. Open Safari/Chrome
2. Go to https://supabase.nexcyte.com
3. **Sign In** with your Supabase admin credentials
4. Tap **New Project** (or select existing project if already created)
5. Fill in (if creating new):
   - **Organization**: Select your organization
   - **Project Name**: `EZ Cycle Ramp Production`
   - **Database Password**: Tap "Generate password" (SAVE THIS!)
   - **Region**: Default (self-hosted, no region selection needed)
6. Tap **Create new project** (if new)
7. Wait 2-3 minutes for project setup

**Copy your project credentials:**

8. Go to **Settings** (gear icon) → **API**
9. Copy to Notes app:
   ```
   SUPABASE_URL=https://supabase.nexcyte.com (or project-specific URL)
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

**Note:** Your self-hosted Supabase URL format may be:
- `https://supabase.nexcyte.com`
- Or with project subdomain: `https://project-name.supabase.nexcyte.com`

Check the URL shown in Settings → API for the exact format.

**✅ Checkpoint:** You have 3 Supabase credentials saved

---

### Step 1.2: Get Stripe API Keys

1. Open new tab: https://dashboard.stripe.com
2. Sign in
3. Tap top-left toggle: **Test mode** → **Live mode**
   - Or stay in Test mode for testing first
4. Go to **Developers** → **API keys**
5. Copy to Notes:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx (or pk_test_xxxxx)
   STRIPE_SECRET_KEY=sk_live_xxxxx (or sk_test_xxxxx)
   ```

**We'll get webhook secret later after deployment**

**✅ Checkpoint:** You have 2 Stripe keys saved

---

### Step 1.3: Get OpenAI API Key

1. Open new tab: https://platform.openai.com/api-keys
2. Sign in
3. Tap **Create new secret key**
4. Name: `EZ Cycle Ramp Production`
5. Tap **Create secret key**
6. Copy key (starts with `sk-proj-...`)
7. Save to Notes:
   ```
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

**⚠️ You won't see this key again - save it now!**

**✅ Checkpoint:** You have OpenAI key saved

---

### Step 1.4: Get GitHub Personal Access Token

1. Open new tab: https://github.com/settings/tokens
2. Tap **Generate new token** → **Generate new token (classic)**
3. Fill in:
   - **Note**: `Coolify - EZ Cycle Ramp`
   - **Expiration**: 90 days (or No expiration)
   - **Scopes**: Check these boxes:
     - ✅ `repo` (all sub-options)
     - ✅ `read:org`
     - ✅ `user:email`
4. Scroll down, tap **Generate token**
5. Copy token (starts with `ghp_...`)
6. Save to Notes:
   ```
   GITHUB_TOKEN=ghp_xxxxx
   ```

**⚠️ Save this now - you won't see it again!**

**✅ Checkpoint:** You have GitHub token saved

---

### Step 1.5: Organize Your Notes

Your Notes app should now have:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
OPENAI_API_KEY=sk-proj-xxxxx
GITHUB_TOKEN=ghp_xxxxx
```

**Keep this Notes document open - you'll copy/paste from it!**

---

## PHASE 2: Setup DreamHost VPS (20 minutes)

### Step 2.1: Access DreamHost Panel

1. Open Safari: https://panel.dreamhost.com
2. Sign in
3. Tap **VPS** in left menu (or find in menu)

**You should see your VPS listed**

Copy to Notes:
```
DREAMHOST_IP=123.45.67.89 (your VPS IP)
DREAMHOST_SERVER=ps123456.dreamhostps.com (server name)
```

---

### Step 2.2: Enable SSH Access

1. In DreamHost panel, go to **Users** → **Manage Users**
2. Find your username, tap **Edit**
3. **User Type**: Change to **Shell User**
4. **SSH Type**: Select **Passwordless login only**
5. Scroll down to **SSH Keys** section
6. **Keep this tab open** - we'll add a key in next step

**✅ Checkpoint:** User is now a Shell User

---

### Step 2.3: Generate SSH Key via Coolify

**Now switch to Coolify tab:**

1. Open new tab: https://coolify.nexcyte.com (your Coolify URL)
2. Sign in to Coolify
3. Go to **Servers** (left sidebar)
4. You should see your Hetzner server listed
5. Tap on the server name
6. Look for **Terminal** or **Console** tab
   - If available, tap it
   - If not available, we'll use Coolify's SSH key generation

**Option A: If Coolify has built-in SSH key generation:**

1. Go to **Settings** → **SSH Keys** (or similar)
2. Tap **Generate New Key**
3. Name: `DreamHost VPS`
4. Copy the **Public Key** (starts with `ssh-ed25519` or `ssh-rsa`)

**Option B: If no built-in key generation:**

We'll have Coolify generate it when adding the server. Continue to next step.

---

### Step 2.4: Add SSH Key to DreamHost

**Back in DreamHost panel tab:**

1. Still in **Users** → **Edit User** page
2. Scroll to **SSH Keys** section
3. Tap **Add a public SSH key**
4. **Name**: `Coolify Hetzner`
5. **Key**: We'll paste Coolify's public key here

**How to get Coolify's public key:**

**Method 1: From Coolify UI (if available)**
- In Coolify → Settings → SSH Keys
- Copy public key

**Method 2: Generate during server add (next phase)**
- We'll come back here after Coolify generates it

**For now, leave this tab open**

---

### Step 2.5: Verify DreamHost User Info

In your Notes, add:

```
DREAMHOST_USERNAME=your_username (from Users page)
DREAMHOST_IP=123.45.67.89
DREAMHOST_SERVER=ps123456.dreamhostps.com
```

**✅ Checkpoint:** DreamHost user is Shell User, IP noted

---

## PHASE 3: Add DreamHost to Coolify (30 minutes)

### Step 3.1: Add New Server in Coolify

1. In Coolify tab: https://coolify.nexcyte.com
2. Tap **Servers** (left sidebar)
3. Tap **+ Add Server** or **Add New Server**

---

### Step 3.2: Fill in Server Details

**Basic Information:**

1. **Name**: `DreamHost Production VPS`
2. **Description**: `DreamHost VPS for EZ Cycle Ramp application`
3. **Is it your own server?**: Toggle **ON** (yes)

**Connection Details:**

4. **IP Address/Host**: Paste your DreamHost IP
   - Get from Notes: `123.45.67.89`
5. **Port**: `22` (default SSH port)
6. **User**: Your DreamHost username
   - Get from Notes: `your_username`

---

### Step 3.3: SSH Key Configuration

**If Coolify offers "Generate SSH Key" option:**

1. Tap **Generate SSH Key**
2. Coolify will show the **Public Key**
3. **Copy this public key** (long string starting with `ssh-ed25519`)
4. **Switch to DreamHost tab**
5. Paste into SSH Keys section (from Step 2.4)
6. Tap **Add Key** in DreamHost
7. **Switch back to Coolify**

**If Coolify asks for Private Key:**

1. Coolify will generate a key pair
2. The private key stays in Coolify (automatic)
3. You need to add the public key to DreamHost (as above)

**Important:** The SSH key allows Coolify (Hetzner) to connect to DreamHost

---

### Step 3.4: Validate Server

1. After adding SSH key, tap **Validate & Configure** in Coolify
2. Coolify will:
   - Connect to DreamHost via SSH
   - Check operating system (Ubuntu 20.04/22.04)
   - Install Docker (if not installed)
   - Install Docker Compose
   - Install Coolify agent
   - Start Coolify proxy (Traefik/Nginx)

**This takes 5-10 minutes**

**You'll see progress:**
```
✓ Connecting to server...
✓ Checking Docker...
✓ Installing Docker...
✓ Installing Coolify agent...
✓ Starting proxy...
✓ Server validated successfully
```

**If validation fails:**
- Check SSH key was added to DreamHost correctly
- Check DreamHost user has sudo/admin access
- Try **Validate & Repair** button in Coolify

---

### Step 3.5: Verify Server Connected

**In Coolify, check server status shows:**

- ✅ **Status**: Connected / Reachable
- ✅ **Docker**: Running
- ✅ **Proxy**: Running (Traefik or Nginx)
- ✅ **Agent**: Running

**You should see:**
- Server name: DreamHost Production VPS
- IP: Your DreamHost IP
- Status: Green/Online

**✅ Checkpoint:** DreamHost server is connected to Coolify!

---

## PHASE 4: Deploy Application (30 minutes)

### Step 4.1: Connect GitHub to Coolify

1. In Coolify, tap **Sources** (left sidebar)
2. Tap **+ Add Source**
3. Select **GitHub**

**Choose authentication method:**

**Option A: OAuth (Recommended)**
1. Tap **Connect with GitHub**
2. You'll be redirected to GitHub
3. Tap **Authorize** to allow Coolify access
4. Select repositories: `mocamGitHub/ezcr`
5. Tap **Install**
6. You'll be redirected back to Coolify

**Option B: Personal Access Token**
1. Select **Personal Access Token**
2. Paste your GitHub token (from Notes)
3. Tap **Save**

**✅ Checkpoint:** GitHub connected, shows "Connected" status

---

### Step 4.2: Create New Project

1. Tap **Projects** (left sidebar)
2. Tap **+ New Project**
3. **Project Name**: `EZ Cycle Ramp`
4. **Description**: `E-commerce application for motorcycle ramps`
5. Tap **Save**

**✅ Created project**

---

### Step 4.3: Create Environment

1. Inside "EZ Cycle Ramp" project
2. Tap **+ New Environment**
3. **Name**: `production`
4. Tap **Save**

**✅ Created environment**

---

### Step 4.4: Add Application

1. Inside "production" environment
2. Tap **+ New Resource**
3. Select **Application**
4. **Source**: Select your GitHub connection
5. **Repository**:
   - Search for: `mocamGitHub/ezcr`
   - Or paste: `https://github.com/mocamGitHub/ezcr`
6. **Branch**: `claude/navigate-directory-011CUQgfs8ekttSxkfCuxhFX`
   - This is the production-ready branch
   - (Or `main` if feature branch has been merged)
7. Tap **Continue**

---

### Step 4.5: Configure Build Settings

**Basic Settings:**

1. **Application Name**: `ezcr-production`
2. **Description**: `EZ Cycle Ramp production deployment`

**⚠️ CRITICAL - Server Selection:**

3. **Server**: Select **DreamHost Production VPS**
   - NOT the Hetzner server!
   - This is where the app will run

4. **Destination**: Select available network on DreamHost
   - Usually auto-selected

**Build Configuration:**

5. **Build Pack**: Should auto-detect **Nixpacks** (for Next.js)
6. **Port**: `3000`
   - This is Next.js default port
7. **Build Command**: `npm run build` (auto-detected)
8. **Start Command**: `npm start` (auto-detected)
9. **Install Command**: `npm install` (auto-detected)

**Advanced (tap "Show Advanced" if needed):**

10. **Base Directory**: `/` (root)
11. **Publish Directory**: `.next` (Next.js build output)

**Tap "Save" or "Continue"**

**✅ Checkpoint:** Application configured

---

### Step 4.6: Add Domain

1. In application dashboard, tap **Domains** tab
2. Tap **+ Add Domain**
3. **Domain**: `dev.ezcycleramp.com`
4. **SSL**: Toggle **ON** (Enable Let's Encrypt)
5. **Generate wildcard**: Toggle **OFF** (not needed)
6. Tap **Save**

**Coolify will:**
- Configure reverse proxy on DreamHost
- Prepare for SSL certificate (needs DNS first)

**✅ Domain added**

---

### Step 4.7: Add Environment Variables

**Now the important part - adding all the credentials!**

1. In application, tap **Environment Variables** tab
2. Tap **+ Add Variable** (or **+ Add**)

**Add each variable:**

**Variable 1: Supabase URL**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Copy from Notes (`https://xxxxx.supabase.co`)
- Type: **Build + Runtime** (both checkboxes ON)
- Secret: OFF
- Tap **Add**

**Variable 2: Supabase Anon Key**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Copy from Notes (`eyJhbGc...`)
- Type: **Build + Runtime**
- Secret: OFF
- Tap **Add**

**Variable 3: Supabase Service Role Key**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Copy from Notes (different `eyJhbGc...`)
- Type: **Runtime Only**
- Secret: **ON** (toggle on)
- Tap **Add**

**Variable 4: Stripe Publishable Key**
- Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Value: Copy from Notes (`pk_live_xxxxx` or `pk_test_xxxxx`)
- Type: **Build + Runtime**
- Secret: OFF
- Tap **Add**

**Variable 5: Stripe Secret Key**
- Name: `STRIPE_SECRET_KEY`
- Value: Copy from Notes (`sk_live_xxxxx` or `sk_test_xxxxx`)
- Type: **Runtime Only**
- Secret: **ON**
- Tap **Add**

**Variable 6: OpenAI API Key**
- Name: `OPENAI_API_KEY`
- Value: Copy from Notes (`sk-proj-xxxxx`)
- Type: **Runtime Only**
- Secret: **ON**
- Tap **Add**

**Variable 7: Site URL**
- Name: `NEXT_PUBLIC_SITE_URL`
- Value: `https://dev.ezcycleramp.com`
- Type: **Build + Runtime**
- Secret: OFF
- Tap **Add**

**Variable 8: API URL**
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://dev.ezcycleramp.com/api`
- Type: **Build + Runtime**
- Secret: OFF
- Tap **Add**

**Variable 9: Admin Email**
- Name: `ADMIN_EMAIL`
- Value: `admin@ezcycleramp.com` (or your email)
- Type: **Runtime Only**
- Secret: OFF
- Tap **Add**

**Variable 10: Node Environment**
- Name: `NODE_ENV`
- Value: `production`
- Type: **Build + Runtime**
- Secret: OFF
- Tap **Add**

**Optional Variable 11: Stripe Webhook Secret**
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_xxxxx` (we'll get this after first deploy)
- Type: **Runtime Only**
- Secret: **ON**
- **Skip for now** - add after creating webhook

**✅ Checkpoint:** 10+ environment variables added

---

### Step 4.8: Review Configuration

Before deploying, verify:

- [ ] **Server**: DreamHost Production VPS (NOT Hetzner!)
- [ ] **Domain**: dev.ezcycleramp.com
- [ ] **Environment Variables**: 10 variables added
- [ ] **Build Settings**: Port 3000, npm run build, npm start
- [ ] **Branch**: claude/navigate-directory-011CUQgfs8ekttSxkfCuxhFX

**Ready to deploy!**

---

## PHASE 5: Configure DNS (15 minutes)

**⚠️ Important: Do this BEFORE deploying for SSL to work!**

### Step 5.1: Find Your DreamHost IP

**In your Notes, you should have:**
```
DREAMHOST_IP=123.45.67.89
```

**If not, get it from:**
- DreamHost Panel → VPS → Your VPS IP
- Or Coolify → Servers → DreamHost server → IP Address

---

### Step 5.2: Configure DNS

**Where is your domain registered?**

- GoDaddy, Namecheap, Cloudflare, DreamHost Domains, etc.

**Go to your domain registrar's DNS settings:**

**Example: If using Cloudflare**
1. Open tab: https://dash.cloudflare.com
2. Tap your domain: `ezcycleramp.com`
3. Tap **DNS**
4. Tap **Add record**
5. Fill in:
   - **Type**: `A`
   - **Name**: `dev`
   - **IPv4 address**: Your DreamHost IP (`123.45.67.89`)
   - **Proxy status**: Toggle OFF (DNS only, not proxied)
   - **TTL**: Auto
6. Tap **Save**

**Example: If using DreamHost DNS**
1. In DreamHost panel
2. Go to **Domains** → **Manage Domains**
3. Find `ezcycleramp.com`
4. Tap **DNS**
5. Tap **Add Record**
6. Fill in:
   - **Record**: `dev`
   - **Type**: `A`
   - **Value**: Your DreamHost VPS IP
   - **TTL**: Auto or 14400
7. Tap **Add Record**

**For other registrars:**
- Add A record
- Name/Host: `dev`
- Points to: Your DreamHost VPS IP
- TTL: 3600 or Auto

**✅ Checkpoint:** DNS A record added

---

### Step 5.3: Verify DNS Propagation

**Wait 5-10 minutes, then check:**

1. Open new tab: https://dnschecker.org
2. Enter: `dev.ezcycleramp.com`
3. Type: `A`
4. Tap **Search**

**You should see:**
- Multiple locations showing your DreamHost IP
- ✅ Green checkmarks

**If you see old IP or no results:**
- DNS hasn't propagated yet
- Wait 10-30 minutes
- Try again

**Also test with ping:**
1. Open tab: https://www.wormly.com/test_ping
2. Enter: `dev.ezcycleramp.com`
3. Tap **Ping**
4. Should show your DreamHost IP

**✅ DNS pointing to DreamHost VPS**

---

## PHASE 6: Deploy Application (15 minutes)

### Step 6.1: Start Deployment

**Back in Coolify:**

1. Go to your application: `ezcr-production`
2. Tap the big **Deploy** button

**Coolify will now:**
```
Step 1: Connect to DreamHost VPS via SSH
Step 2: Clone GitHub repository
Step 3: Build Docker image
Step 4: Run npm install (2-3 minutes)
Step 5: Run npm run build (1-2 minutes)
Step 6: Create container
Step 7: Start application
Step 8: Configure reverse proxy
Step 9: Request SSL certificate (if DNS ready)
```

**This takes 5-10 minutes total**

---

### Step 6.2: Watch Build Logs

1. Tap **Logs** tab
2. You'll see live output
3. Watch for key milestones:
   ```
   ✓ Cloning repository...
   ✓ Installing dependencies...
   ✓ Building application...
   ✓ Starting application...
   ✓ Application listening on port 3000
   ```

**If build fails:**
- Check logs for specific error
- Common issues:
  - Missing environment variable
  - Wrong branch name
  - GitHub connection issue
- Fix and tap **Redeploy**

---

### Step 6.3: Wait for SSL Certificate

**After app starts, Coolify will:**
1. Detect domain is ready (DNS propagated)
2. Request SSL certificate from Let's Encrypt
3. Install certificate on DreamHost
4. Configure HTTPS

**Check SSL status:**
1. Go to **Domains** tab
2. Look for SSL status: **Active** ✅

**If SSL shows "Pending" or "Failed":**
- Check DNS is propagated (dnschecker.org)
- Wait 5-10 more minutes
- Tap **Regenerate Certificate**

**✅ Checkpoint:** Application deployed and running!

---

## PHASE 7: Setup Database (20 minutes)

### Step 7.1: Run Database Migrations

**You need to run 24 SQL migration files**

**Open Supabase tab:**
1. Go to https://supabase.nexcyte.com
2. Open your project: "EZ Cycle Ramp Production"
3. Tap **SQL Editor** (in left menu)

---

### Step 7.2: Access Migration Files

**Open GitHub tab:**
1. Go to https://github.com/mocamGitHub/ezcr
2. Navigate to: `supabase/migrations/`
3. You'll see files: `00001_initial_schema.sql`, `00002_seed_categories.sql`, etc.

---

### Step 7.3: Run Each Migration

**For each file (00001 through 00024):**

**In GitHub tab:**
1. Tap file: `00001_initial_schema.sql`
2. Tap **Raw** button (to see plain text)
3. **Select all text** (tap and hold, then "Select All")
4. Tap **Copy**

**In Supabase tab:**
5. In SQL Editor, tap **New Query**
6. **Paste** the SQL code
7. Tap **Run** (or play button)
8. Wait for "Success" message

**Repeat for all 24 migrations IN ORDER:**

```
✓ 00001_initial_schema.sql
✓ 00002_seed_categories.sql
✓ 00003_create_customers.sql
✓ 00004_create_orders.sql
✓ 00005_create_shipping.sql
✓ 00006_create_team_management.sql
✓ 00007_seed_team_members.sql
✓ 00008_create_configurator.sql
✓ 00009_seed_configurator_data.sql
✓ 00010_create_ai_chat.sql
✓ 00011_create_embeddings.sql
✓ 00012_create_analytics.sql
✓ 00013_seed_sample_data.sql
✓ 00014_create_support_pages.sql
✓ 00015_seed_support_pages.sql
✓ 00016_create_customer_support_system.sql
✓ 00017_seed_support_tickets.sql
✓ 00018_fix_rls_recursion.sql
✓ 00019_create_gallery.sql
✓ 00020_seed_gallery_data.sql
✓ 00021_create_surveys.sql
✓ 00022_seed_surveys.sql
✓ 00023_create_testimonials.sql
✓ 00024_seed_testimonials.sql
```

**This is tedious but important - don't skip any!**

**Tips:**
- Keep GitHub tab and Supabase tab open
- Copy/paste one at a time
- If a migration fails, check error message
- Most migrations should run in < 5 seconds

---

### Step 7.4: Verify Database

**In Supabase:**
1. Tap **Table Editor** (left menu)
2. You should see many tables:
   - products
   - product_categories
   - product_images
   - testimonials
   - gallery_items
   - orders
   - customers
   - support_tickets
   - (20+ tables total)

**Click on "products" table:**
- Should show some sample products
- If empty, that's okay (you'll add real products later)

**✅ Checkpoint:** Database is set up with all tables!

---

## PHASE 8: Verify Deployment (15 minutes)

### Step 8.1: Access Your Website

**In Safari/Chrome, open new tab:**

1. Go to: **https://dev.ezcycleramp.com**

**You should see:**
- ✅ Homepage loads
- ✅ Green padlock (SSL is working)
- ✅ Hero section, featured products
- ✅ No errors

**If you get an error:**
- **502 Bad Gateway**: App not running, check Coolify logs
- **SSL Error**: Certificate not ready, wait 5 more minutes
- **DNS Error**: DNS not propagated, wait 10-30 minutes

---

### Step 8.2: Test Key Features

**Homepage:**
- [ ] Hero section displays
- [ ] "Featured Products" section shows products
- [ ] Testimonials section appears
- [ ] Animations work (smooth transitions)

**Products Page:**
1. Tap menu → **Products** (or go to `/products`)
2. Check:
   - [ ] Products load from database
   - [ ] Product cards display
   - [ ] Search box works
   - [ ] Category filters work

**Product Detail:**
1. Tap any product
2. Check:
   - [ ] Product details load
   - [ ] Images display
   - [ ] "Add to Cart" button works
   - [ ] Button shows success animation

**Shopping Cart:**
1. Add item to cart
2. Check:
   - [ ] Cart sheet opens
   - [ ] Item appears in cart
   - [ ] Quantity can be changed
   - [ ] Total price updates
   - [ ] "Remove" works

**Empty Cart:**
1. Remove all items
2. Check:
   - [ ] Lottie animation plays (wobbling cart)
   - [ ] "Your cart is empty" message

**Dark Mode:**
1. Tap theme toggle (usually in header)
2. Check:
   - [ ] Switches to dark mode
   - [ ] All text readable
   - [ ] Animations still work

**Testimonials:**
1. Go to homepage
2. Scroll to testimonials section
3. Check:
   - [ ] Customer reviews display
   - [ ] Star ratings show
   - [ ] "Helpful" button works

**Gallery:**
1. Go to `/gallery`
2. Check:
   - [ ] Images load
   - [ ] Categories filter works
   - [ ] Lightbox opens on click

---

### Step 8.3: Check for Errors

**Open browser console:**
1. In Safari: Tap **Aa** → **Show Reader** (no, wrong...)

**Actually on iPhone:**
- Scroll to bottom of page
- Tap **Desktop View** to switch
- Or just check visually for obvious errors

**Look for:**
- ❌ Missing images
- ❌ Broken links
- ❌ Layout issues
- ❌ Features not working

**If everything looks good:** ✅ Deployment successful!

---

### Step 8.4: Test Authentication (Optional)

1. Tap **Sign Up** or **Register**
2. Create test account:
   - Email: your email
   - Password: strong password
3. Check email for verification link
4. Tap verification link
5. Should redirect to site, logged in

**✅ Authentication working!**

---

### Step 8.5: Test Checkout (Optional)

**Only if you want to test Stripe:**

1. Add product to cart
2. Tap **Proceed to Checkout**
3. Fill in shipping info (test data)
4. Card number: `4242 4242 4242 4242`
5. Expiry: Any future date (e.g., `12/25`)
6. CVC: Any 3 digits (e.g., `123`)
7. Tap **Pay**
8. Should redirect to success page
9. Should see Lottie success animation

**✅ Checkout working!**

---

## PHASE 9: Setup Stripe Webhook (Optional - 10 minutes)

**To save orders to database, you need a webhook:**

### Step 9.1: Create Webhook in Stripe

1. Open Stripe Dashboard: https://dashboard.stripe.com
2. Tap **Developers** → **Webhooks**
3. Tap **Add endpoint**
4. **Endpoint URL**: `https://dev.ezcycleramp.com/api/stripe/webhook`
5. **Events to send**: Tap **Select events**
6. Search and select:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
7. Tap **Add events**
8. Tap **Add endpoint**

---

### Step 9.2: Get Webhook Secret

1. Click on the webhook you just created
2. Scroll to **Signing secret**
3. Tap **Reveal** (or **Click to reveal**)
4. Copy the secret (starts with `whsec_...`)

---

### Step 9.3: Add to Coolify

1. Back in Coolify
2. Go to application → **Environment Variables**
3. Tap **+ Add Variable**
4. Name: `STRIPE_WEBHOOK_SECRET`
5. Value: Paste webhook secret (`whsec_xxxxx`)
6. Type: **Runtime Only**
7. Secret: **ON**
8. Tap **Add**

---

### Step 9.4: Restart Application

1. In Coolify application dashboard
2. Tap **Restart** button
3. Wait for restart (30 seconds)

**✅ Webhook configured! Orders will now save to database**

---

## 🎉 Congratulations!

### What You've Accomplished

You've successfully deployed a **production-grade e-commerce application** with:

✅ **Coolify on Hetzner** - Managing everything remotely
✅ **Application on DreamHost** - Serving public traffic
✅ **Automatic SSL** - Valid HTTPS certificate
✅ **GitHub integration** - Deploy from repository
✅ **Database** - Supabase with 24 tables
✅ **Environment variables** - All credentials secure
✅ **Domain** - dev.ezcycleramp.com pointing correctly
✅ **Features working** - Cart, checkout, animations, testimonials

### Your Application is Live! 🚀

**Website**: https://dev.ezcycleramp.com

**Management**: https://coolify.nexcyte.com (Coolify dashboard)

---

## 📱 Daily Management from iPhone

### Update Application

**When you push to GitHub:**

1. Open Coolify on iPhone
2. Go to application
3. Tap **Deploy**
4. Or enable **Auto Deploy** in Settings

### View Logs

1. Coolify → Application → **Logs** tab
2. See real-time application output

### Check Status

1. Coolify → Application → Dashboard
2. See: Status, Health, Resource usage

### Restart App

1. Coolify → Application
2. Tap **Restart** button

### Monitor Resources

1. Coolify → Application → **Metrics** tab
2. View CPU, memory, network usage

---

## 🆘 Troubleshooting

### Website Not Loading

**Check:**
1. Coolify → Application → Status shows "Running" ✅
2. Coolify → Logs → No errors
3. DNS propagated (dnschecker.org)
4. SSL certificate active

**Solutions:**
- Wait 5-10 more minutes for DNS
- Tap **Restart** in Coolify
- Check DreamHost server is online

---

### SSL Certificate Error

**Check:**
1. Coolify → Domains → SSL status
2. DNS points to DreamHost IP (not Hetzner)

**Solutions:**
1. Coolify → Domains → **Regenerate Certificate**
2. Wait 5-10 minutes
3. Refresh browser

---

### Database Connection Error

**Check:**
1. Coolify → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Verify `SUPABASE_ANON_KEY` is correct

**Solutions:**
1. Go to Supabase → Settings → API
2. Copy correct values
3. Update in Coolify
4. Restart application

---

### Products Not Showing

**Likely causes:**
1. Database migrations not run
2. RLS policies blocking access
3. Environment variables incorrect

**Solutions:**
1. Check Supabase → Table Editor → products table
2. If empty, run migrations again
3. Check RLS policies are enabled

---

## 📋 Quick Reference

### Important URLs

```
Website:        https://dev.ezcycleramp.com
Coolify:        https://coolify.nexcyte.com
DreamHost:      https://panel.dreamhost.com
Supabase:       https://supabase.nexcyte.com
GitHub:         https://github.com/mocamGitHub/ezcr
Stripe:         https://dashboard.stripe.com
```

### Key Credentials (Keep Secure!)

Stored in your Notes app:
- Supabase URL, anon key, service role key
- Stripe publishable & secret keys
- OpenAI API key
- GitHub token
- DreamHost SSH details

**Backup these to a password manager!**

---

## 🎯 Next Steps

### Add Real Products

1. Go to `/admin` (login as admin)
2. Add products with real:
   - Names
   - Descriptions
   - Prices
   - Images

### Customize Content

1. Update homepage hero text
2. Add real testimonials
3. Upload product photos
4. Write product descriptions

### Switch Stripe to Live Mode

1. Get Stripe live API keys
2. Update environment variables in Coolify
3. Create new webhook with live endpoint
4. Test with real payment

### Add More Features

Application already has:
- Products & categories ✅
- Shopping cart ✅
- Checkout ✅
- Testimonials ✅
- Gallery ✅
- Customer support ✅
- AI chatbot ✅
- Admin panel ✅

**You can now add more products and content!**

---

## 🎓 What You Learned

- ✅ Managing remote servers with Coolify
- ✅ Deploying Next.js applications
- ✅ Configuring environment variables
- ✅ Setting up SSL certificates
- ✅ Managing DNS records
- ✅ Running database migrations
- ✅ Stripe integration
- ✅ All from your iPhone!

---

**You did it! 🎉 Your application is live and production-ready!**

Visit **https://dev.ezcycleramp.com** to see your work!

Manage everything from **Coolify** on your iPhone: https://coolify.nexcyte.com
