# Coolify Remote Deployment Guide - DreamHost VPS

Deploy to **DreamHost VPS** managed remotely by **Coolify on Hetzner VPS**

---

## Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│   Hetzner VPS       │         │   DreamHost VPS     │
│                     │         │                     │
│  ┌──────────────┐   │  SSH    │  ┌──────────────┐   │
│  │   Coolify    │───┼────────>│  │ Application  │   │
│  │  (Manager)   │   │         │  │   (ezcr)     │   │
│  └──────────────┘   │         │  └──────────────┘   │
│                     │         │                     │
│  - Web UI           │         │  - Node.js + PM2    │
│  - Monitoring       │         │  - Nginx            │
│  - Orchestration    │         │  - Database client  │
│                     │         │  - Public traffic   │
└─────────────────────┘         └─────────────────────┘
        ↑                                 ↑
        │                                 │
    You manage                       Users access
    via browser                   dev.ezcycleramp.com
```

**Benefits of This Setup:**
- ✅ **Isolation** - Coolify issues won't affect application
- ✅ **Security** - Management plane separate from public traffic
- ✅ **Scalability** - Can add more DreamHost servers later
- ✅ **Monitoring** - Coolify monitors from external location
- ✅ **Cost Optimization** - Use DreamHost resources for app, Hetzner for management

---

## Prerequisites

### What You Need

- [ ] **Coolify running on Hetzner VPS** (already installed ✅)
- [ ] **DreamHost VPS** with root/admin access
- [ ] **SSH access** to both servers
- [ ] **Domain**: ezcycleramp.com with DNS control
- [ ] **GitHub account** with repository access
- [ ] **Supabase, Stripe, OpenAI** credentials ready

### Server Requirements

**DreamHost VPS Minimum:**
- Ubuntu 20.04 or 22.04
- 2 CPU cores
- 2GB RAM
- 25GB disk space
- Root/sudo access

**Coolify on Hetzner:**
- Already installed and running ✅
- Can reach DreamHost VPS on port 22 (SSH)

---

## Table of Contents

1. [Prepare DreamHost VPS](#prepare-dreamhost-vps)
2. [Setup SSH Access](#setup-ssh-access)
3. [Add DreamHost to Coolify](#add-dreamhost-to-coolify)
4. [Validate Server Connection](#validate-server-connection)
5. [Deploy Application](#deploy-application)
6. [Configure Domain & SSL](#configure-domain--ssl)
7. [Setup Database](#setup-database)
8. [Environment Variables](#environment-variables)
9. [Deploy & Verify](#deploy--verify)
10. [Troubleshooting](#troubleshooting)

---

## Prepare DreamHost VPS

### Step 1: Access DreamHost Panel

1. Log in to https://panel.dreamhost.com
2. Go to **VPS** section
3. Note your VPS details:
   - **Server Name**: ps123456.dreamhostps.com
   - **IP Address**: (e.g., 123.45.67.89)
   - **Admin Username**: (your username)

### Step 2: Enable SSH Access

1. Go to **Users** → **Manage Users**
2. Find your user, click **Edit**
3. Change **User Type** to **Shell User**
4. **SSH Type**: Password or SSH Key
5. Click **Save Changes**
6. Wait 5 minutes for changes to apply

### Step 3: Test SSH Connection

From your local machine:

```bash
# Test connection
ssh username@ps123456.dreamhostps.com

# Or using IP
ssh username@123.45.67.89

# If successful, you'll see a shell prompt
# Type 'exit' to disconnect
```

### Step 4: Verify Root/Sudo Access

```bash
# SSH into DreamHost
ssh username@ps123456.dreamhostps.com

# Check if you have sudo
groups

# Should include 'sudo' or 'admin'

# Test sudo
sudo whoami
# Should output: root

# Exit
exit
```

**Important:** If you don't have sudo access, contact DreamHost support to enable it.

### Step 5: Update System Packages

```bash
# SSH into DreamHost
ssh username@ps123456.dreamhostps.com

# Update packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Verify Docker is NOT installed (Coolify will install it)
docker --version
# If Docker is already installed, that's fine
# If not, Coolify will install it

# Exit
exit
```

---

## Setup SSH Access

Coolify needs SSH access to DreamHost to deploy and manage applications.

### Step 1: Generate SSH Key on Hetzner (Coolify Server)

```bash
# SSH into your Hetzner VPS (where Coolify runs)
ssh root@YOUR_HETZNER_IP

# Generate SSH key for Coolify
ssh-keygen -t ed25519 -C "coolify@hetzner" -f ~/.ssh/coolify_dreamhost

# This creates:
# - Private key: ~/.ssh/coolify_dreamhost
# - Public key: ~/.ssh/coolify_dreamhost.pub

# Display public key
cat ~/.ssh/coolify_dreamhost.pub
# Copy the entire output (starts with ssh-ed25519)
```

### Step 2: Add Public Key to DreamHost

**Option A: Via SSH (Recommended)**

```bash
# On your local machine, SSH into DreamHost
ssh username@ps123456.dreamhostps.com

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add Coolify's public key to authorized_keys
nano ~/.ssh/authorized_keys

# Paste the public key you copied earlier
# (the entire line starting with ssh-ed25519)

# Save and exit (Ctrl+X, Y, Enter)

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Exit DreamHost
exit
```

**Option B: Via DreamHost Panel**

1. Log in to https://panel.dreamhost.com
2. Go to **Users** → **Manage Users**
3. Click on your user
4. Scroll to **SSH Keys**
5. Click **Add Public Key**
6. Paste the Coolify public key
7. Click **Save**
8. Wait 5 minutes for changes to apply

### Step 3: Test SSH Access from Hetzner to DreamHost

```bash
# On Hetzner VPS (where Coolify runs)
ssh -i ~/.ssh/coolify_dreamhost username@ps123456.dreamhostps.com

# Should connect without password prompt
# If successful, exit:
exit
```

**Troubleshooting:**
```bash
# If connection fails, check verbose output
ssh -vvv -i ~/.ssh/coolify_dreamhost username@ps123456.dreamhostps.com

# Common issues:
# 1. Wrong permissions: chmod 600 ~/.ssh/coolify_dreamhost
# 2. Public key not added: Verify in ~/.ssh/authorized_keys on DreamHost
# 3. Firewall: Ensure port 22 is open on DreamHost
```

### Step 4: Add SSH Config on Hetzner (Optional)

Makes connection easier:

```bash
# On Hetzner VPS
nano ~/.ssh/config
```

Add this:
```
Host dreamhost-vps
  HostName ps123456.dreamhostps.com
  User username
  IdentityFile ~/.ssh/coolify_dreamhost
  IdentitiesOnly yes
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Set permissions
chmod 600 ~/.ssh/config

# Test
ssh dreamhost-vps
# Should connect without password

exit
```

---

## Add DreamHost to Coolify

### Step 1: Access Coolify Dashboard

1. Open browser: https://coolify31.com (or your Coolify domain)
2. Log in with your credentials

### Step 2: Add New Server

1. Click **Servers** in left sidebar
2. Click **+ Add Server**
3. Fill in details:

**Server Information:**
- **Name**: `DreamHost Production VPS`
- **Description**: `DreamHost VPS for EZ Cycle Ramp`
- **IP Address**: `123.45.67.89` (your DreamHost IP)
- **Port**: `22` (SSH port)
- **User**: `username` (your DreamHost SSH username)

**Important:** Check if your DreamHost username has sudo access. If not, you may need to use `root` (though DreamHost typically doesn't allow direct root login).

**SSH Key:**
- **Private Key**: Copy the content of `~/.ssh/coolify_dreamhost` (from Hetzner)

```bash
# On Hetzner, display private key
cat ~/.ssh/coolify_dreamhost

# Copy the entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (key content)
# -----END OPENSSH PRIVATE KEY-----
```

- Paste into Coolify's **Private Key** field

**Server Type:**
- **Type**: Remote Server
- **Proxy**: Traefik or Nginx (Coolify will install)

4. Click **Add Server**

### Step 3: Coolify Validates Server

Coolify will:
1. SSH into DreamHost VPS
2. Check OS version
3. Install Docker (if not installed)
4. Install Docker Compose
5. Setup Coolify agent
6. Configure firewall
7. Start proxy (Traefik/Nginx)

**This takes 3-5 minutes.**

**Watch progress in Coolify logs:**
- You'll see real-time output
- Look for "Server validated successfully"

### Step 4: Verify Server Status

1. In Coolify, go to **Servers**
2. Your DreamHost server should show:
   - **Status**: Connected ✅
   - **Docker**: Running ✅
   - **Proxy**: Running ✅
   - **Agent**: Running ✅

**If validation fails:**
1. Check SSH connection manually:
   ```bash
   ssh -i ~/.ssh/coolify_dreamhost username@ps123456.dreamhostps.com
   ```
2. Check DreamHost user has sudo access:
   ```bash
   sudo whoami  # Should output: root
   ```
3. Check firewall allows Docker ports:
   ```bash
   sudo ufw status
   # Should allow: 22, 80, 443, 2376 (Docker), 6001 (Coolify agent)
   ```
4. In Coolify, click **Validate & Repair**

---

## Validate Server Connection

### Step 1: Check Server Dashboard

1. In Coolify, click on **DreamHost Production VPS** server
2. You should see:
   - **System Info**: CPU, RAM, Disk usage
   - **Docker Info**: Version, containers running
   - **Network**: IP address, proxy status

### Step 2: Test Docker on DreamHost

**Via Coolify UI:**
1. Go to server dashboard
2. Click **Terminal** tab (if available)
3. Run: `docker ps`
4. Should show Coolify proxy container

**Via SSH:**
```bash
# From your local machine
ssh username@ps123456.dreamhostps.com

# Check Docker
docker ps

# Should show:
# - coolify-proxy (Traefik or Nginx)
# - coolify-agent

# Check Coolify agent
docker logs coolify-agent

# Should show: "Agent connected to Coolify"

# Exit
exit
```

---

## Deploy Application

### Step 1: Create Project in Coolify

1. In Coolify dashboard, click **Projects**
2. Click **+ New Project**
3. **Name**: `EZ Cycle Ramp`
4. **Description**: `E-commerce application for motorcycle ramps`
5. Click **Save**

### Step 2: Create Environment

1. Inside project, click **+ New Environment**
2. **Name**: `production`
3. Click **Save**

### Step 3: Add Application

1. Inside environment, click **+ New Resource**
2. Select **Application**
3. **Source**: Select your GitHub connection
4. **Repository**: `mocamGitHub/ezcr` or paste URL
5. **Branch**: `claude/navigate-directory-011CUQgfs8ekttSxkfCuxhFX`
   - Or `main` if feature branch is merged
6. Click **Continue**

### Step 4: Configure Application

**Build Settings:**
- **Name**: `ezcr-production`
- **Description**: `EZ Cycle Ramp production deployment`
- **Server**: Select **DreamHost Production VPS** ⭐ (Important!)
- **Destination**: Select available Docker network on DreamHost
- **Build Pack**: Nixpacks (auto-detected for Next.js)
- **Port**: `3000`
- **Build Command**: `npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected)

**Advanced:**
- **Base Directory**: `/`
- **Publish Directory**: `.next`
- **Node Version**: `20`

Click **Save**

---

## Configure Domain & SSL

### Step 1: Add Domain in Coolify

1. In application, click **Domains** tab
2. Click **+ Add Domain**
3. **Domain**: `dev.ezcycleramp.com`
4. **SSL**: Enable **Let's Encrypt** (toggle on)
5. Click **Save**

Coolify will configure:
- Reverse proxy on DreamHost VPS
- SSL certificate from Let's Encrypt
- HTTP → HTTPS redirect

### Step 2: Configure DNS

**At your domain registrar:**

Add A record pointing to **DreamHost VPS IP** (NOT Hetzner IP):

```
Type:  A
Name:  dev
Value: 123.45.67.89  (DreamHost IP)
TTL:   3600
```

**Important:** Point DNS to DreamHost VPS, not Hetzner (Coolify) VPS!

### Step 3: Verify DNS Propagation

```bash
# Check DNS
dig dev.ezcycleramp.com

# Should return DreamHost VPS IP
# Not Hetzner IP!
```

**Wait 5-30 minutes for DNS to propagate.**

### Step 4: SSL Certificate

Once DNS propagates, Coolify will automatically:
1. Request SSL certificate from Let's Encrypt
2. Install certificate on DreamHost VPS
3. Configure HTTPS

**Check status in Coolify:**
- Domains tab → SSL status should show ✅ Active

---

## Setup Database

### Create Supabase Production Project

1. Go to https://supabase.com
2. Click **New Project**
3. **Name**: `EZ Cycle Ramp Production`
4. **Database Password**: Generate strong password (save it!)
5. **Region**: Choose closest to DreamHost
   - If DreamHost is US West: `us-west-1`
   - If DreamHost is US East: `us-east-1`
   - If DreamHost is EU: `eu-west-1`
6. Click **Create new project**
7. Wait 2-3 minutes

### Get Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...`

### Run Database Migrations

**Via Supabase SQL Editor (Recommended):**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. For each migration file (00001 through 00024):
   - Copy SQL from `supabase/migrations/XXXXX_*.sql`
   - Paste into SQL Editor
   - Click **Run**
4. Run in exact order: 00001, 00002, ..., 00024

**Migration files:** See complete list in `COOLIFY_DEPLOYMENT_GUIDE.md` or repository

### Verify Tables

1. Go to **Table Editor**
2. You should see all tables:
   - products, product_categories, product_images
   - testimonials, gallery_items
   - orders, customers, etc.

---

## Environment Variables

### Add Variables in Coolify

1. In application, go to **Environment Variables** tab
2. Click **+ Add Variable**

**Add these variables one by one:**

#### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Application URLs
NEXT_PUBLIC_SITE_URL=https://dev.ezcycleramp.com
NEXT_PUBLIC_API_URL=https://dev.ezcycleramp.com/api

# Admin
ADMIN_EMAIL=admin@ezcycleramp.com

# Node Environment
NODE_ENV=production
```

#### Optional Variables

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@ezcycleramp.com

# Analytics (Google)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking (Sentry)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**For each variable:**
- **Name**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
- **Value**: Actual value
- **Type**:
  - `NEXT_PUBLIC_*` → **Build + Runtime**
  - Secrets (API keys) → **Runtime Only** + Check "Is Secret"
- Click **Add**

---

## Deploy & Verify

### Step 1: Deploy Application

1. In Coolify application dashboard, click **Deploy** button
2. Coolify will:
   - Clone repository from GitHub to DreamHost VPS
   - Build Docker image on DreamHost
   - Install dependencies (`npm install`)
   - Build Next.js (`npm run build`)
   - Start container on DreamHost
   - Configure reverse proxy
   - Request SSL certificate

**This takes 5-10 minutes.**

### Step 2: Monitor Deployment

1. Click **Logs** tab to watch progress
2. Look for:
   ```
   ✓ Compiled successfully
   Ready on http://localhost:3000
   ```

### Step 3: Check Deployment Status

In application dashboard:
- **Status**: Running ✅
- **Health**: Healthy ✅
- **URL**: https://dev.ezcycleramp.com (clickable)

### Step 4: Access Application

1. Click the URL or open browser: **https://dev.ezcycleramp.com**
2. Homepage should load with:
   - SSL certificate (green padlock)
   - Products displayed
   - Animations working
   - No console errors

### Step 5: Verification Checklist

Test all features:

- [ ] **Homepage** - Loads correctly
- [ ] **SSL** - Green padlock, valid certificate
- [ ] **Products** - `/products` lists products from database
- [ ] **Product detail** - Click product, detail page loads
- [ ] **Add to cart** - Button animation works, cart opens
- [ ] **Cart operations** - Update quantity, remove item
- [ ] **Search** - Product search returns results
- [ ] **Filters** - Category filtering works
- [ ] **Animations** - Lottie animations play (empty cart, success)
- [ ] **Dark mode** - Toggle works
- [ ] **Testimonials** - Homepage shows reviews
- [ ] **Gallery** - `/gallery` page works
- [ ] **Admin** - `/admin` redirects to login
- [ ] **Responsive** - Mobile view works
- [ ] **No errors** - Check browser console (F12)

### Step 6: Test Authentication

1. Go to `/signup`
2. Create test account
3. Check email for verification
4. Verify signup works

### Step 7: Test Checkout (Optional)

1. Add product to cart
2. Go to `/checkout`
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify success page with animation

---

## Troubleshooting

### Issue 1: Coolify Can't Connect to DreamHost

**Symptoms:** Server shows "Disconnected" or validation fails

**Solutions:**

```bash
# 1. Test SSH manually from Hetzner
ssh -i ~/.ssh/coolify_dreamhost username@ps123456.dreamhostps.com

# 2. Check SSH key permissions
chmod 600 ~/.ssh/coolify_dreamhost
chmod 644 ~/.ssh/coolify_dreamhost.pub

# 3. Verify public key is on DreamHost
ssh username@ps123456.dreamhostps.com
cat ~/.ssh/authorized_keys
# Should contain Coolify's public key

# 4. Check DreamHost firewall
sudo ufw status
# Should allow port 22

# 5. In Coolify, click "Validate & Repair"
```

### Issue 2: Docker Installation Failed

**Symptoms:** Coolify shows "Docker not running"

**Solutions:**

```bash
# SSH into DreamHost
ssh username@ps123456.dreamhostps.com

# Check if Docker is installed
docker --version

# If not, install manually
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker ps

# Exit and try Coolify validation again
exit
```

### Issue 3: Deployment Fails

**Check Logs:**
1. In Coolify, go to application → **Logs** tab
2. Look for specific error

**Common Errors:**

**"npm ERR! code ENOENT"**
```
Solution:
- Repository not cloned correctly
- Check GitHub connection in Coolify
- Verify branch name is correct
- Try redeploying
```

**"Module not found"**
```
Solution:
- Environment variables not loaded
- Check all NEXT_PUBLIC_* variables are marked "Build + Runtime"
- Redeploy
```

**"Port 3000 already in use"**
```
Solution:
- Previous container not stopped
- SSH into DreamHost: docker ps -a
- Stop old container: docker stop <container_id>
- Remove: docker rm <container_id>
- Redeploy
```

### Issue 4: SSL Certificate Failed

**Symptoms:** Browser shows "Not Secure"

**Solutions:**

```bash
# 1. Verify DNS points to DreamHost (NOT Hetzner!)
dig dev.ezcycleramp.com
# Should return DreamHost IP

# 2. Check port 80/443 are open on DreamHost
ssh username@ps123456.dreamhostps.com
sudo ufw status
# Should allow 80/tcp and 443/tcp

# 3. In Coolify, go to Domains tab
# Click "Regenerate Certificate"
# Wait 5-10 minutes

# 4. Check Traefik/Nginx logs on DreamHost
docker logs coolify-proxy
```

### Issue 5: Application Not Accessible

**Symptoms:** Connection timeout or 502 error

**Solutions:**

```bash
# 1. Check application container is running
ssh username@ps123456.dreamhostps.com
docker ps
# Should show: ezcr-production container

# 2. Check application logs
docker logs ezcr-production
# Look for "Ready on http://localhost:3000"

# 3. Test locally on DreamHost
curl http://localhost:3000
# Should return HTML

# 4. Check proxy is forwarding
docker logs coolify-proxy | grep dev.ezcycleramp.com

# 5. Restart application in Coolify
# Click "Restart" button
```

### Issue 6: Database Connection Errors

**Symptoms:** "Failed to fetch products"

**Solutions:**

1. Verify environment variables in Coolify
2. Check Supabase project is active
3. Verify RLS policies in Supabase
4. Test connection:
   ```bash
   # SSH into DreamHost
   docker exec -it ezcr-production sh

   # Inside container
   echo $NEXT_PUBLIC_SUPABASE_URL
   # Should show Supabase URL

   exit
   ```

---

## Monitoring & Maintenance

### Check Application Health

**In Coolify Dashboard:**
1. Go to application
2. **Metrics** tab - CPU, memory, network
3. **Logs** tab - Real-time application logs
4. **Deployments** tab - Deployment history

**On DreamHost VPS:**
```bash
ssh username@ps123456.dreamhostps.com

# Check container status
docker ps

# View logs
docker logs ezcr-production

# Check resource usage
docker stats ezcr-production

# Exit
exit
```

### Update Application

**Auto-Deploy (Recommended):**
1. In Coolify, go to application → **Settings**
2. Enable **Auto Deploy**
3. Choose **Push to branch**
4. Now every push to GitHub triggers deployment!

**Manual Deploy:**
1. Push changes to GitHub
2. In Coolify, click **Deploy** button
3. Watch logs for completion

### Scale Resources

If application needs more resources:

**In Coolify:**
1. Go to application → **Resources** tab
2. Adjust:
   - **Memory Limit**: 512MB, 1GB, 2GB
   - **CPU Limit**: 1 core, 2 cores
   - **Replicas**: 1, 2, 3 (for load balancing)
3. Click **Save**
4. Application will restart with new resources

**On DreamHost:**
- Upgrade VPS plan in DreamHost panel if needed
- More CPU/RAM/disk space

### Backup Strategy

**Database:**
1. Supabase: Settings → Database → Backups
2. Schedule daily backups
3. Download weekly backups

**Application:**
- Code is in GitHub (backed up ✅)
- Coolify can redeploy anytime

**Environment Variables:**
- Export from Coolify → Settings → Export
- Store securely (password manager)

---

## Architecture Benefits

### Why This Setup is Great

**1. Separation of Concerns**
- Coolify (Hetzner): Management, monitoring, orchestration
- DreamHost: Application hosting, public traffic
- Problem in app won't affect Coolify
- Can swap DreamHost for another VPS easily

**2. Security**
- Coolify UI not exposed on application server
- SSH keys instead of passwords
- Firewall on both servers

**3. Scalability**
- Add more DreamHost VPSs easily
- Coolify can manage multiple servers
- Load balance across servers

**4. Cost Optimization**
- Hetzner: Cheaper for management server
- DreamHost: Better support, familiar platform
- Use resources where they're best suited

**5. Reliability**
- If DreamHost has issues, Coolify still accessible
- Can quickly redeploy to different server
- External monitoring from Hetzner

---

## Server Resource Usage

### Hetzner VPS (Coolify)
```
Expected Usage:
CPU:    5-10% (light load)
RAM:    500MB-1GB (Coolify + Proxy)
Disk:   5-10GB
Network: Low (SSH commands only)

Recommended Plan:
- Hetzner CX11: €4.51/month
- 1 vCPU, 2GB RAM, 20GB SSD
```

### DreamHost VPS (Application)
```
Expected Usage:
CPU:    20-50% (application + database client)
RAM:    1-2GB (Node.js + Docker)
Disk:   10-20GB (application + logs)
Network: High (public traffic)

Recommended Plan:
- DreamHost VPS Basic: $15/month
- 1 CPU, 1GB RAM, 30GB SSD
- Or VPS Business: $30/month for more resources
```

---

## Quick Reference

### SSH Access

```bash
# Hetzner (Coolify)
ssh root@YOUR_HETZNER_IP

# DreamHost (Application)
ssh username@ps123456.dreamhostps.com

# From Hetzner to DreamHost
ssh -i ~/.ssh/coolify_dreamhost username@ps123456.dreamhostps.com
```

### Docker Commands (on DreamHost)

```bash
# List containers
docker ps

# View logs
docker logs ezcr-production

# Restart container
docker restart ezcr-production

# Shell into container
docker exec -it ezcr-production sh

# Check resource usage
docker stats ezcr-production

# View proxy logs
docker logs coolify-proxy
```

### Coolify URLs

```
Coolify Dashboard:  https://coolify31.com
Application:        https://dev.ezcycleramp.com
GitHub:            https://github.com/mocamGitHub/ezcr
Supabase:          https://supabase.com
```

---

## Success Checklist

Your deployment is successful when:

- [ ] **SSH** - Hetzner can SSH into DreamHost with key
- [ ] **Coolify** - DreamHost server added and connected
- [ ] **Docker** - Running on DreamHost with proxy
- [ ] **Application** - Created in Coolify, pointing to DreamHost
- [ ] **GitHub** - Repository connected and accessible
- [ ] **Environment Variables** - All 11+ variables configured
- [ ] **Domain** - dev.ezcycleramp.com points to DreamHost IP
- [ ] **SSL** - Certificate active and valid
- [ ] **Database** - Supabase connected, migrations complete
- [ ] **Deployment** - Application running on DreamHost
- [ ] **Website** - Accessible at https://dev.ezcycleramp.com
- [ ] **Features** - All features working (cart, animations, etc.)
- [ ] **Monitoring** - Coolify showing healthy metrics

---

## Estimated Timeline

| Task | Time |
|------|------|
| Prepare DreamHost VPS | 15 min |
| Setup SSH Access | 20 min |
| Add DreamHost to Coolify | 10 min |
| Validate Connection | 5 min |
| Deploy Application | 15 min |
| Configure Domain & SSL | 20 min |
| Setup Database | 20 min |
| Add Environment Variables | 10 min |
| Deploy & Verify | 15 min |
| **Total** | **~2 hours** |

---

**Deployment Complete! 🎉**

You now have a **professional setup** with:
- ✅ Coolify on Hetzner managing everything
- ✅ Application running on DreamHost VPS
- ✅ Automatic deployments from GitHub
- ✅ SSL certificates managed automatically
- ✅ Monitoring and logs in one dashboard
- ✅ Scalable and maintainable architecture

Your application is live at **https://dev.ezcycleramp.com** and managed remotely by Coolify!
