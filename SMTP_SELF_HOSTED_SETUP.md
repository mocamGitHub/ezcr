# SMTP Configuration for Self-Hosted Supabase

Your Supabase instance is self-hosted on `supabase.nexcyte.com`, so SMTP is configured via Docker environment variables, not the dashboard UI.

## Understanding Your Setup

**Self-hosted Supabase** uses Docker Compose with environment variables for configuration. SMTP settings are in the GoTrue (auth) service configuration.

## Option 1: Quick Gmail Setup (Recommended for Testing)

### Step 1: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not enabled
3. Go to https://myaccount.google.com/apppasswords
4. Create "EZCR App" password
5. Copy the 16-character password (no spaces)

### Step 2: SSH to Server and Edit Docker Compose

```bash
ssh root@nexcyte.com
cd /path/to/supabase  # Find your Supabase directory
```

**Find the docker-compose.yml or .env file:**
```bash
# Common locations:
ls -la /opt/supabase/
ls -la /root/supabase/
ls -la /var/lib/supabase/

# Or search for it:
find / -name "docker-compose.yml" -path "*/supabase/*" 2>/dev/null
```

### Step 3: Add SMTP Environment Variables

Edit the file (likely `docker-compose.yml` or `.env`):

```bash
nano docker-compose.yml  # or nano .env
```

**Add these environment variables to the `auth` service (GoTrue):**

```yaml
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your-email@gmail.com
GOTRUE_SMTP_PASS=your-16-char-app-password
GOTRUE_SMTP_ADMIN_EMAIL=your-email@gmail.com
GOTRUE_SMTP_SENDER_NAME=EZ Cycle Ramp
GOTRUE_MAILER_AUTOCONFIRM=false
```

**If using .env file format:**
```bash
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your-email@gmail.com
GOTRUE_SMTP_PASS=your-16-char-app-password
GOTRUE_SMTP_ADMIN_EMAIL=your-email@gmail.com
GOTRUE_SMTP_SENDER_NAME="EZ Cycle Ramp"
GOTRUE_MAILER_AUTOCONFIRM=false
```

### Step 4: Restart Supabase Auth Service

```bash
# Restart just the auth service:
docker compose restart auth

# Or restart all services:
docker compose down && docker compose up -d
```

### Step 5: Verify Configuration

Check if auth service is running with new config:
```bash
docker logs supabase-auth --tail 50
```

Look for lines mentioning SMTP or email configuration.

---

## Option 2: Resend (Better for Production)

### Step 1: Get Resend API Key

1. Go to https://resend.com and sign up
2. Create API key named "EZCR Production"
3. Copy the API key (starts with `re_`)

### Step 2: Configure Environment Variables

```yaml
GOTRUE_SMTP_HOST=smtp.resend.com
GOTRUE_SMTP_PORT=465
GOTRUE_SMTP_USER=resend
GOTRUE_SMTP_PASS=re_your_api_key_here
GOTRUE_SMTP_ADMIN_EMAIL=noreply@nexcyte.com
GOTRUE_SMTP_SENDER_NAME=EZ Cycle Ramp
GOTRUE_MAILER_AUTOCONFIRM=false
```

### Step 3: Restart Services

```bash
docker compose restart auth
```

---

## Complete Environment Variables Reference

Here are ALL the email-related environment variables for GoTrue:

```bash
# SMTP Server Configuration
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your-email@gmail.com
GOTRUE_SMTP_PASS=your-app-password

# Email Settings
GOTRUE_SMTP_ADMIN_EMAIL=your-email@gmail.com
GOTRUE_SMTP_SENDER_NAME="EZ Cycle Ramp"

# Email Behavior
GOTRUE_MAILER_AUTOCONFIRM=false  # Users must confirm email
GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/confirm
GOTRUE_MAILER_URLPATHS_INVITE=/auth/invite
GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/reset-password
GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/confirm

# Site URL (important for email links)
GOTRUE_SITE_URL=http://localhost:3002  # Development
# GOTRUE_SITE_URL=https://ezcr.com     # Production
```

---

## Finding Your Supabase Configuration

### Method 1: Find docker-compose.yml

```bash
ssh root@nexcyte.com

# Search for Supabase Docker Compose file
find / -name "docker-compose.yml" -path "*/supabase/*" 2>/dev/null

# Common locations:
cat /opt/supabase/docker-compose.yml
cat /root/supabase/docker-compose.yml
cat ~/supabase/docker-compose.yml
```

### Method 2: Check Running Containers

```bash
# See all Supabase containers
docker ps | grep supabase

# Check auth container environment
docker inspect supabase-auth | grep -A 50 "Env"

# Check where the auth container is defined
docker inspect supabase-auth | grep -i compose
```

### Method 3: Check .env File

```bash
# Find .env files
find /opt /root /var -name ".env" -path "*supabase*" 2>/dev/null

# Or check common locations:
cat /opt/supabase/.env
cat /root/supabase/.env
```

---

## Testing SMTP Configuration

### 1. Check Container Logs

```bash
# Watch auth service logs in real-time
docker logs -f supabase-auth

# Check for SMTP errors
docker logs supabase-auth 2>&1 | grep -i smtp
docker logs supabase-auth 2>&1 | grep -i email
```

### 2. Test Password Reset

From your app:
```bash
# Open in browser:
http://localhost:3002/forgot-password

# Enter email: morris@mocampbell.com
# Click "Send Reset Link"
```

Watch the auth logs while testing:
```bash
ssh root@nexcyte.com
docker logs -f supabase-auth
```

### 3. Check Email Delivery

- Check your inbox
- Check spam folder
- Look for errors in docker logs

---

## Troubleshooting

### Container Not Found

If `supabase-auth` doesn't exist, find the actual container name:
```bash
docker ps --format "table {{.Names}}\t{{.Image}}" | grep -i auth
```

It might be named:
- `supabase_auth_1`
- `supabase-gotrue`
- `gotrue`
- `auth`

### SMTP Connection Refused

Check firewall on your server:
```bash
# Test SMTP connection from server
telnet smtp.gmail.com 587

# If telnet not installed:
nc -zv smtp.gmail.com 587
```

### Emails Not Sending (No Errors)

Check GOTRUE_SITE_URL matches your app URL:
```bash
docker inspect supabase-auth | grep GOTRUE_SITE_URL
```

It should be:
- Development: `http://localhost:3002`
- Production: `https://yourdomain.com`

### Wrong Email Template URL

The password reset link should go to:
```
http://localhost:3002/reset-password?token=xxxxx
```

If it's going to the wrong URL, set:
```bash
GOTRUE_SITE_URL=http://localhost:3002
GOTRUE_MAILER_URLPATHS_RECOVERY=/reset-password
```

---

## Quick Copy-Paste Configuration

**For Gmail (Development):**
```bash
# Add to docker-compose.yml under auth service:
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=YOUR_EMAIL@gmail.com
GOTRUE_SMTP_PASS=YOUR_16_CHAR_APP_PASSWORD
GOTRUE_SMTP_ADMIN_EMAIL=YOUR_EMAIL@gmail.com
GOTRUE_SMTP_SENDER_NAME="EZ Cycle Ramp"
GOTRUE_SITE_URL=http://localhost:3002
GOTRUE_MAILER_AUTOCONFIRM=false

# Restart:
docker compose restart auth
```

**For Resend (Production):**
```bash
GOTRUE_SMTP_HOST=smtp.resend.com
GOTRUE_SMTP_PORT=465
GOTRUE_SMTP_USER=resend
GOTRUE_SMTP_PASS=re_YOUR_RESEND_API_KEY
GOTRUE_SMTP_ADMIN_EMAIL=noreply@nexcyte.com
GOTRUE_SMTP_SENDER_NAME="EZ Cycle Ramp"
GOTRUE_SITE_URL=https://yourdomain.com
GOTRUE_MAILER_AUTOCONFIRM=false

# Restart:
docker compose restart auth
```

---

## Next Steps

1. SSH to your server
2. Find your docker-compose.yml or .env file
3. Add SMTP environment variables
4. Restart auth service
5. Test password reset from your app
6. Check docker logs for errors

Let me know if you need help finding your Supabase configuration files!
