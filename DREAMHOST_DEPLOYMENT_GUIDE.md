# DreamHost VPS Deployment Guide - EZ Cycle Ramp

Complete step-by-step instructions for deploying to **dev.ezcycleramp.com** on a fresh DreamHost VPS.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DreamHost VPS Initial Setup](#dreamhost-vps-initial-setup)
3. [Server Configuration](#server-configuration)
4. [Install Dependencies](#install-dependencies)
5. [Deploy Application](#deploy-application)
6. [Configure Web Server](#configure-web-server)
7. [Setup Database](#setup-database)
8. [Configure SSL](#configure-ssl)
9. [Setup Domain](#setup-domain)
10. [Environment Variables](#environment-variables)
11. [Start Application](#start-application)
12. [Verification](#verification)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:

- [ ] **DreamHost VPS account** with root/admin access
- [ ] **Domain ownership** for ezcycleramp.com (managed in DreamHost panel)
- [ ] **Supabase account** (or ready to create one)
- [ ] **Stripe account** with API keys
- [ ] **OpenAI API key**
- [ ] **GitHub account** with access to mocamGitHub/ezcr repository
- [ ] **SSH client** (Terminal on Mac/Linux, PuTTY on Windows)

**Expected Time:** 2-3 hours for complete setup

---

## DreamHost VPS Initial Setup

### Step 1: Access DreamHost Panel

1. Log in to https://panel.dreamhost.com
2. Navigate to **VPS** section in left sidebar
3. Note your VPS details:
   - **Server Name**: (e.g., ps123456)
   - **IP Address**: (e.g., 123.456.78.90)
   - **SSH Username**: (usually your DreamHost username)

### Step 2: Enable SSH Access

1. In DreamHost Panel, go to **Users** → **Manage Users**
2. Find your user and click **Edit**
3. Change **User Type** to **Shell User**
4. Select **SSH Key** or **Password** authentication
5. If using SSH key:
   - Click **Add Public Key**
   - Paste your SSH public key (`cat ~/.ssh/id_rsa.pub` on your local machine)
   - Or generate a new key: `ssh-keygen -t ed25519 -C "your-email@example.com"`
6. Click **Save Changes**
7. Wait 5 minutes for changes to propagate

### Step 3: Connect to VPS via SSH

```bash
# Replace with your actual username and server name
ssh username@psXXXXXX.dreamhostps.com

# Or using IP address
ssh username@123.456.78.90

# If using SSH key with custom name
ssh -i ~/.ssh/id_dreamhost username@psXXXXXX.dreamhostps.com
```

**Troubleshooting Connection:**
```bash
# If connection is refused, check SSH is enabled
# If timeout, verify VPS is running in DreamHost panel

# Test connection
ping psXXXXXX.dreamhostps.com

# Verbose SSH for debugging
ssh -vvv username@psXXXXXX.dreamhostps.com
```

### Step 4: Verify Server Access

Once connected, verify your environment:

```bash
# Check current directory
pwd
# Should show: /home/username

# Check OS version
cat /etc/os-release
# DreamHost typically uses Ubuntu 20.04 or 22.04

# Check available disk space
df -h

# Check memory
free -h

# Check current shell
echo $SHELL
# Should be /bin/bash

# Check if you need sudo (DreamHost VPS gives admin access)
groups
# Should include 'adm' or 'sudo' group
```

---

## Server Configuration

### Step 1: Update System Packages

```bash
# Switch to admin/root if needed (DreamHost may require this)
# DreamHost VPS users typically have sudo access

# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git
```

**Note:** DreamHost VPS may show warnings about "managed updates" - this is normal.

### Step 2: Configure Firewall

DreamHost manages the firewall at the network level, but you can also configure UFW:

```bash
# Check if UFW is installed
sudo ufw status

# If not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall (be careful not to lock yourself out!)
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Step 3: Create Application Directory

```bash
# Create directory for application
sudo mkdir -p /var/www/ezcr

# Change ownership to your user
sudo chown -R $USER:$USER /var/www/ezcr

# Verify permissions
ls -la /var/www/

# Navigate to directory
cd /var/www/ezcr
```

---

## Install Dependencies

### Step 1: Install Node.js 20.x (LTS)

DreamHost may have an older Node.js version. Install the latest LTS:

```bash
# Download and run NodeSource setup script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node -v
# Should show: v20.x.x

npm -v
# Should show: 10.x.x

# If node command not found, add to PATH
echo 'export PATH=$PATH:/usr/bin' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 -v

# Setup PM2 to start on boot
pm2 startup

# This will show a command to run - copy and execute it
# It will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

### Step 3: Install Nginx

DreamHost VPS typically uses Apache, but we'll use Nginx for better Node.js performance:

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Should show: active (running)
```

**Important DreamHost Note:**
If you're using DreamHost's managed hosting features, Apache may be pre-configured. We'll configure Nginx to run on a different port and proxy through, OR disable Apache:

```bash
# Check if Apache is running
sudo systemctl status apache2

# If Apache is running and you want to use Nginx instead:
sudo systemctl stop apache2
sudo systemctl disable apache2

# OR, if you want to keep Apache for other sites:
# We'll configure Nginx to proxy on port 3000 and Apache to forward
```

### Step 4: Install Git (if not already installed)

```bash
# Verify Git is installed
git --version

# If not installed
sudo apt install -y git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## Deploy Application

### Step 1: Generate SSH Key for GitHub

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_github

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_github

# Display public key
cat ~/.ssh/id_github.pub
```

### Step 2: Add SSH Key to GitHub

1. Copy the output from `cat ~/.ssh/id_github.pub`
2. Go to https://github.com/settings/keys
3. Click **New SSH key**
4. **Title**: DreamHost VPS - EZ Cycle Ramp
5. **Key type**: Authentication Key
6. **Key**: Paste the public key
7. Click **Add SSH key**

### Step 3: Configure SSH for GitHub

```bash
# Create SSH config
nano ~/.ssh/config
```

Add this content:
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_github
  IdentitiesOnly yes
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Set correct permissions
chmod 600 ~/.ssh/config

# Test GitHub connection
ssh -T git@github.com

# Should show: Hi username! You've successfully authenticated
```

### Step 4: Clone Repository

```bash
# Navigate to application directory
cd /var/www/ezcr

# Clone repository
git clone git@github.com:mocamGitHub/ezcr.git .

# Check out the production-ready branch
git checkout claude/navigate-directory-011CUQgfs8ekttSxkfCuxhFX

# Verify files
ls -la

# Should see: package.json, src/, supabase/, etc.
```

### Step 5: Install Application Dependencies

```bash
# Install npm packages
npm install

# This may take 2-5 minutes
```

**If you encounter permission errors:**
```bash
# Fix npm permissions
sudo chown -R $USER:$USER /var/www/ezcr
sudo chown -R $USER:$USER ~/.npm

# Try again
npm install
```

---

## Configure Web Server

### Option A: Nginx Only (Recommended)

Create Nginx configuration for the application:

```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/ezcr
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name dev.ezcycleramp.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/ezcr_access.log;
    error_log /var/log/nginx/ezcr_error.log;

    # Client upload size (for product images)
    client_max_body_size 10M;

    location / {
        # Proxy to Node.js application
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Don't cache
        proxy_cache_bypass $http_upgrade;
    }

    # Static files from Next.js
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=86400";
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

### Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/ezcr /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Should show: syntax is ok, test is successful
```

**If test fails, check for typos:**
```bash
# View error details
sudo nginx -t 2>&1

# Common issues:
# - Missing semicolons
# - Incorrect file paths
# - Port conflicts
```

### Reload Nginx

```bash
# Reload Nginx to apply changes
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Should show: active (running)
```

---

## Setup Database

### Step 1: Create Supabase Production Project

1. Go to https://supabase.com
2. Click **New Project**
3. **Organization**: Select or create organization
4. **Project Name**: EZ Cycle Ramp Production
5. **Database Password**: Generate strong password (save this!)
6. **Region**: Choose closest to DreamHost datacenter (US West or US East)
7. **Pricing Plan**: Free or Pro (depending on needs)
8. Click **Create new project**
9. Wait 2-3 minutes for provisioning

### Step 2: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in left sidebar
3. Copy these values (you'll need them for environment variables):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (long string starting with eyJ)
   - **service_role** key: `eyJhbGc...` (different long string)

**Save these in a temporary text file on your local machine!**

### Step 3: Connect to Supabase Database

1. In Supabase dashboard, go to **Settings** → **Database**
2. Copy **Connection string** (Transaction mode)
3. It will look like: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

### Step 4: Run Database Migrations

We'll run migrations directly from the VPS:

```bash
# Navigate to application directory
cd /var/www/ezcr

# Install Supabase CLI (if not already installed)
curl -sSL https://supabase.com/install.sh | bash

# Verify installation
supabase --version

# Link to your Supabase project
supabase link --project-ref xxxxx
# Replace xxxxx with your project reference ID (from Supabase URL)

# When prompted, enter your database password
```

**Alternative: Run Migrations via SQL Editor**

If Supabase CLI has issues, run migrations manually:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open each migration file locally (in `supabase/migrations/` folder)
4. Copy and paste contents into SQL Editor
5. Click **Run**
6. Repeat for all 24 migrations in order (00001, 00002, ... 00024)

**Migration Order (CRITICAL - Run in Exact Order):**
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

### Step 5: Verify Database Setup

```bash
# Check if tables were created
# Use psql or Supabase dashboard

# Via Supabase Dashboard:
# 1. Go to Table Editor
# 2. You should see all tables: products, testimonials, gallery_items, etc.
```

---

## Configure SSL

### Step 1: Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Obtain SSL Certificate

**IMPORTANT:** Before running this, make sure DNS is configured (see Setup Domain section below)

```bash
# Obtain certificate for dev.ezcycleramp.com
sudo certbot --nginx -d dev.ezcycleramp.com

# Follow the prompts:
# 1. Enter email address for renewal notices
# 2. Agree to Terms of Service (Y)
# 3. Share email with EFF? (Y or N, your choice)
# 4. Redirect HTTP to HTTPS? (2 - Yes, recommended)
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/dev.ezcycleramp.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/dev.ezcycleramp.com/privkey.pem
```

### Step 3: Verify SSL Configuration

Certbot automatically updates your Nginx configuration. Verify:

```bash
# Check Nginx config
sudo nano /etc/nginx/sites-available/ezcr

# Should now have two server blocks:
# - One listening on port 80 (redirects to HTTPS)
# - One listening on port 443 (SSL)
```

### Step 4: Test SSL Auto-Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Should show: Congratulations, all renewals succeeded
```

Certbot automatically sets up a cron job for renewal. Verify:

```bash
# Check systemd timer
sudo systemctl status certbot.timer

# Should show: active (waiting)
```

---

## Setup Domain

### Step 1: Configure DNS in DreamHost Panel

1. Log in to https://panel.dreamhost.com
2. Navigate to **Domains** → **Manage Domains**
3. Find `ezcycleramp.com` in the list
4. Click **DNS** next to the domain

### Step 2: Add Subdomain DNS Record

**Option A: A Record (Direct IP)**

Click **Add Record** and enter:
- **Record**: `dev` (creates dev.ezcycleramp.com)
- **Type**: `A`
- **Value**: Your VPS IP address (e.g., 123.456.78.90)
- **TTL**: `Auto` or `14400`

Click **Add Record**

**Option B: CNAME Record (Using Server Name)**

Click **Add Record** and enter:
- **Record**: `dev`
- **Type**: `CNAME`
- **Value**: `psXXXXXX.dreamhostps.com` (your server name)
- **TTL**: `Auto`

Click **Add Record**

**Recommendation:** Use A record for better performance.

### Step 3: Verify DNS Propagation

DNS changes can take 5 minutes to 48 hours. Check status:

```bash
# From your VPS, check DNS
dig dev.ezcycleramp.com

# Look for ANSWER SECTION showing your IP

# Check from external source
# Visit: https://dnschecker.org
# Enter: dev.ezcycleramp.com
# Should show your VPS IP in all regions
```

**Test with ping:**
```bash
ping dev.ezcycleramp.com

# Should respond with your VPS IP
```

### Step 4: Update DreamHost Web Hosting (If Applicable)

If you have web hosting configured for this subdomain:

1. In DreamHost Panel, go to **Domains** → **Manage Domains**
2. Find `dev.ezcycleramp.com`
3. Click **Edit** (or **Add** if not listed)
4. **Remove web hosting** for this subdomain (we're using VPS directly)
5. Or set **Document Root** to `/var/www/ezcr` (not recommended - use Nginx proxy instead)
6. Click **Save**

---

## Environment Variables

### Step 1: Create Production Environment File

```bash
# Navigate to application directory
cd /var/www/ezcr

# Create production environment file
nano .env.production.local
```

### Step 2: Add Environment Variables

Paste the following content, replacing placeholders with your actual values:

```bash
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# STRIPE CONFIGURATION (PRODUCTION KEYS)
# =============================================================================
# Get from: https://dashboard.stripe.com/apikeys (toggle to Live mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxx
STRIPE_SECRET_KEY=sk_live_51xxxxx

# Webhook secret (create webhook endpoint first)
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# URL: https://dev.ezcycleramp.com/api/stripe/webhook
# Events: checkout.session.completed, payment_intent.succeeded
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
# EMAIL SERVICE (Optional - Resend)
# =============================================================================
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# =============================================================================
# ANALYTICS (Optional)
# =============================================================================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# =============================================================================
# ERROR TRACKING (Optional - Sentry)
# =============================================================================
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# =============================================================================
# NODE ENVIRONMENT
# =============================================================================
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Secure Environment File

```bash
# Set restrictive permissions
chmod 600 .env.production.local

# Verify permissions
ls -la .env.production.local

# Should show: -rw------- (owner read/write only)
```

### Step 4: Verify Environment Variables

```bash
# Check file contains expected variables
cat .env.production.local | grep NEXT_PUBLIC_SUPABASE_URL

# Should show your Supabase URL
```

---

## Start Application

### Step 1: Build Application

```bash
# Navigate to application directory
cd /var/www/ezcr

# Build for production
npm run build

# This will take 1-3 minutes
# Expected output: "Compiled successfully"
```

**If build fails, check common issues:**
```bash
# Clear cache and try again
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npm run build 2>&1 | grep error

# Check environment variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Step 2: Create PM2 Ecosystem File

```bash
# Create PM2 configuration
nano ecosystem.config.js
```

Add this content:

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
    error_file: '/var/www/ezcr/logs/err.log',
    out_file: '/var/www/ezcr/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
}
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Create Logs Directory

```bash
# Create logs directory
mkdir -p /var/www/ezcr/logs

# Set permissions
chmod 755 /var/www/ezcr/logs
```

### Step 4: Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Expected output: status 'online'
```

### Step 5: Save PM2 Configuration

```bash
# Save PM2 process list
pm2 save

# Setup PM2 to start on boot (run the command it shows)
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Copy and run that command
```

### Step 6: Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Should show:
# │ name │ status │ ↺ │ cpu │ memory │
# │ ezcr │ online │ 0 │ 0%  │ 50.0mb │

# View logs
pm2 logs ezcr --lines 50

# Should show: "Ready on http://localhost:3000"

# Check application responds
curl http://localhost:3000

# Should return HTML (the homepage)
```

---

## Verification

### Step 1: Check All Services Are Running

```bash
# Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# Check PM2
pm2 status
# Should show: ezcr online

# Check Node.js process
ps aux | grep node
# Should show multiple node processes

# Check port 3000 is listening
sudo netstat -tlnp | grep 3000
# Should show: LISTEN on 3000
```

### Step 2: Test HTTP Access

```bash
# Test from VPS
curl -I http://localhost:3000

# Should return: HTTP/1.1 200 OK

# Test domain (after DNS propagates)
curl -I http://dev.ezcycleramp.com

# Should return: HTTP/1.1 301 Moved Permanently (redirect to HTTPS)

# Test HTTPS
curl -I https://dev.ezcycleramp.com

# Should return: HTTP/2 200 OK
```

### Step 3: Browser Testing

Open browser and visit: **https://dev.ezcycleramp.com**

**Verify the following:**

- [ ] **Homepage loads** - Should see hero section, featured products
- [ ] **SSL is valid** - Green padlock in browser address bar
- [ ] **Products page works** - `/products` should list products
- [ ] **Cart functionality** - Add item to cart, cart sheet opens
- [ ] **Animations work** - Lottie animations play (empty cart, success, etc.)
- [ ] **Dark mode toggle** - Switch between light and dark themes
- [ ] **Search works** - Product search returns results
- [ ] **Responsive design** - Resize browser, check mobile view
- [ ] **Testimonials display** - Homepage shows customer reviews
- [ ] **No console errors** - Open DevTools (F12), check console

### Step 4: Test Backend Features

**Test Authentication:**
1. Go to `/signup`
2. Create test account
3. Check email for verification link
4. Click verification link
5. Should redirect to homepage, logged in

**Test Admin Panel:**
1. Go to `/admin` (requires admin role)
2. Should show dashboard or redirect to login
3. Test product management, testimonials approval

**Test Checkout:**
1. Add product to cart
2. Go to `/checkout`
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect to success page with animation

### Step 5: Performance Check

```bash
# Check resource usage
pm2 monit

# Or
htop

# Check memory usage
free -h

# Check disk usage
df -h

# Check Nginx access logs
sudo tail -f /var/log/nginx/ezcr_access.log

# Check application logs
pm2 logs ezcr
```

---

## Troubleshooting

### Issue 1: Application Won't Start

**Symptoms:** PM2 shows status "errored" or keeps restarting

**Solutions:**

```bash
# Check PM2 logs
pm2 logs ezcr --lines 100

# Common errors:

# 1. Port already in use
sudo lsof -i :3000
# Kill process using port: sudo kill -9 <PID>

# 2. Environment variables not loaded
# Verify .env.production.local exists and has correct permissions
ls -la .env.production.local
cat .env.production.local | head

# 3. Build artifacts missing
# Rebuild application
cd /var/www/ezcr
npm run build
pm2 restart ezcr

# 4. Dependencies not installed
npm install
pm2 restart ezcr

# 5. Permission issues
sudo chown -R $USER:$USER /var/www/ezcr
pm2 restart ezcr
```

### Issue 2: 502 Bad Gateway

**Symptoms:** Nginx shows 502 error when accessing domain

**Solutions:**

```bash
# 1. Check Node.js application is running
pm2 status
# If not online: pm2 restart ezcr

# 2. Check port 3000
curl http://localhost:3000
# Should return HTML

# 3. Check Nginx configuration
sudo nginx -t

# 4. Check Nginx error log
sudo tail -f /var/log/nginx/ezcr_error.log

# 5. Restart services
pm2 restart ezcr
sudo systemctl restart nginx
```

### Issue 3: SSL Certificate Issues

**Symptoms:** Browser shows "Not Secure" or SSL error

**Solutions:**

```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew --force-renewal

# 3. Check Nginx SSL configuration
sudo nano /etc/nginx/sites-available/ezcr

# Verify these lines exist:
#   listen 443 ssl;
#   ssl_certificate /etc/letsencrypt/live/dev.ezcycleramp.com/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/dev.ezcycleramp.com/privkey.pem;

# 4. Reload Nginx
sudo systemctl reload nginx
```

### Issue 4: Database Connection Errors

**Symptoms:** "Failed to fetch products" or 401/403 errors

**Solutions:**

```bash
# 1. Verify environment variables
cat .env.production.local | grep SUPABASE

# 2. Test Supabase connection from VPS
curl -I https://xxxxx.supabase.co

# Should return: HTTP/2 200

# 3. Check RLS policies in Supabase dashboard
# Go to: Authentication → Policies
# Verify policies exist for products table

# 4. Test with psql
# Install psql: sudo apt install -y postgresql-client
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"

# In psql:
\dt
# Should list all tables

SELECT COUNT(*) FROM products;
# Should return number of products

# 5. Restart application
pm2 restart ezcr
```

### Issue 5: Stripe Webhook Not Working

**Symptoms:** Orders created but not saved to database

**Solutions:**

```bash
# 1. Verify webhook endpoint in Stripe
# Go to: https://dashboard.stripe.com/webhooks
# Check endpoint: https://dev.ezcycleramp.com/api/stripe/webhook
# Should show: Enabled

# 2. Check webhook secret in environment variables
cat .env.production.local | grep STRIPE_WEBHOOK_SECRET

# 3. Test webhook locally
# Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Check application logs for webhook errors
pm2 logs ezcr | grep stripe

# 5. Verify events are configured:
# - checkout.session.completed
# - payment_intent.succeeded
```

### Issue 6: Images Not Loading

**Symptoms:** Broken image icons or 404 errors

**Solutions:**

```bash
# 1. Check Next.js image configuration
nano next.config.ts

# Verify remotePatterns includes:
# - images.unsplash.com
# - *.supabase.co (if using Supabase Storage)

# 2. Check Supabase Storage bucket
# Go to: Supabase Dashboard → Storage
# Verify: product-images bucket exists and is public

# 3. Rebuild application
npm run build
pm2 restart ezcr

# 4. Check Nginx is serving _next/image correctly
curl -I https://dev.ezcycleramp.com/_next/image?url=...
# Should return: 200 OK
```

### Issue 7: High Memory Usage

**Symptoms:** PM2 restarts frequently, "max_memory_restart"

**Solutions:**

```bash
# 1. Check memory usage
pm2 monit
free -h

# 2. Reduce PM2 instances
nano ecosystem.config.js
# Change: instances: 2 to instances: 1

pm2 restart ezcr

# 3. Increase max_memory_restart
nano ecosystem.config.js
# Change: max_memory_restart: '500M' to '1G'

pm2 restart ezcr

# 4. Check for memory leaks
pm2 logs ezcr | grep "heap"
```

### Issue 8: DNS Not Resolving

**Symptoms:** Domain doesn't point to VPS

**Solutions:**

```bash
# 1. Check DNS from multiple locations
# Visit: https://dnschecker.org
# Enter: dev.ezcycleramp.com

# 2. Flush local DNS cache (on your computer)
# macOS: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
# Linux: sudo systemd-resolve --flush-caches

# 3. Check DreamHost DNS settings
# Panel → Domains → DNS
# Verify A record exists for 'dev' subdomain

# 4. Wait for propagation
# Can take up to 48 hours, but usually 5-30 minutes

# 5. Test with direct IP
curl -H "Host: dev.ezcycleramp.com" http://YOUR_VPS_IP
# Should return HTML
```

---

## Maintenance Commands

### Daily Operations

```bash
# Check application status
pm2 status

# View logs
pm2 logs ezcr

# Restart application
pm2 restart ezcr

# Stop application
pm2 stop ezcr

# Start application
pm2 start ezcr

# Monitor resources
pm2 monit
```

### Update Application

```bash
# Navigate to directory
cd /var/www/ezcr

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart ezcr
```

### Check Logs

```bash
# Application logs
pm2 logs ezcr

# Nginx access logs
sudo tail -f /var/log/nginx/ezcr_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/ezcr_error.log

# System logs
sudo journalctl -u nginx -f
```

### Backup Database

```bash
# Backup Supabase database
# In Supabase Dashboard:
# Settings → Database → Backups
# Click "Download backup"

# Or use pg_dump
pg_dump "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres" > backup.sql
```

### SSL Certificate Renewal

```bash
# Renew all certificates
sudo certbot renew

# Check renewal status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

---

## Performance Optimization

### Enable Gzip Compression

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

```bash
# Reload Nginx
sudo systemctl reload nginx
```

### Enable Nginx Caching

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/ezcr
```

Add at the top (before `server` block):
```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;
```

```bash
# Create cache directory
sudo mkdir -p /var/cache/nginx
sudo chown www-data:www-data /var/cache/nginx

# Reload Nginx
sudo systemctl reload nginx
```

### Optimize PM2

```bash
# Enable cluster mode (already configured in ecosystem.config.js)
# Adjust instances based on CPU cores

# Check CPU cores
nproc

# Edit ecosystem.config.js
nano ecosystem.config.js

# Set instances to number of cores - 1
# For 2 cores: instances: 1
# For 4 cores: instances: 3

pm2 restart ezcr
```

---

## Security Best Practices

### 1. Secure SSH

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config

# Change these settings:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Configure Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Enable SSH jail (should already be enabled)

# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### 3. Regular Updates

```bash
# Update packages weekly
sudo apt update && sudo apt upgrade -y

# Check for security updates
sudo apt list --upgradable

# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Secure Environment Variables

```bash
# Verify .env.production.local permissions
ls -la /var/www/ezcr/.env.production.local

# Should be: -rw------- (600)

# If not:
chmod 600 /var/www/ezcr/.env.production.local
```

### 5. Set Up Monitoring

```bash
# Install monitoring tool (optional)
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Quick Reference

### Essential Commands

```bash
# Application
pm2 status                  # Check status
pm2 restart ezcr           # Restart app
pm2 logs ezcr              # View logs
pm2 monit                  # Monitor resources

# Nginx
sudo systemctl status nginx       # Check status
sudo systemctl reload nginx       # Reload config
sudo nginx -t                     # Test config
sudo tail -f /var/log/nginx/ezcr_error.log  # View errors

# SSL
sudo certbot renew               # Renew certificates
sudo certbot certificates        # Check certificate status

# Database
# Connect via Supabase dashboard or psql

# Git
cd /var/www/ezcr
git pull origin main            # Pull updates
npm install                     # Install dependencies
npm run build                   # Build
pm2 restart ezcr               # Restart
```

### Important File Locations

```
Application:        /var/www/ezcr
Nginx Config:       /etc/nginx/sites-available/ezcr
Environment:        /var/www/ezcr/.env.production.local
PM2 Config:         /var/www/ezcr/ecosystem.config.js
Logs:              /var/www/ezcr/logs/
SSL Certificates:   /etc/letsencrypt/live/dev.ezcycleramp.com/
```

### Support Resources

- **DreamHost Wiki**: https://help.dreamhost.com/
- **DreamHost Support**: https://panel.dreamhost.com/support
- **Next.js Docs**: https://nextjs.org/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Nginx Docs**: https://nginx.org/en/docs/

---

## Success Checklist

Your deployment is successful when:

- [ ] SSH access to DreamHost VPS working
- [ ] Node.js 20.x installed and verified
- [ ] PM2 installed and configured
- [ ] Nginx installed and running
- [ ] Application cloned from GitHub
- [ ] Dependencies installed (npm install)
- [ ] Environment variables configured
- [ ] Database migrations completed (all 24)
- [ ] Production build successful (npm run build)
- [ ] PM2 running application (status: online)
- [ ] Nginx proxying to port 3000
- [ ] DNS configured (A record for dev.ezcycleramp.com)
- [ ] SSL certificate installed and working
- [ ] Website loads at https://dev.ezcycleramp.com
- [ ] All features tested and working
- [ ] No errors in browser console
- [ ] No errors in pm2 logs

---

## Estimated Timeline

| Task | Time |
|------|------|
| DreamHost VPS Setup | 15 min |
| Server Configuration | 30 min |
| Install Dependencies | 20 min |
| Deploy Application | 20 min |
| Configure Web Server | 15 min |
| Setup Database | 30 min |
| Configure SSL | 10 min |
| Setup Domain | 30 min |
| Environment Variables | 15 min |
| Start Application | 15 min |
| Verification & Testing | 30 min |
| **Total** | **~3-4 hours** |

---

**Deployment Complete! 🎉**

Your EZ Cycle Ramp application should now be live at **https://dev.ezcycleramp.com**

For questions or issues, refer to the Troubleshooting section or consult the support resources above.
