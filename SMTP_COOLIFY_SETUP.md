# SMTP Configuration via Coolify

Your Supabase is managed by **Coolify** on `5.161.84.153`. SMTP configuration is done through the Coolify web interface.

## Discovery Results

✅ **Auth Container Found:** `supabase-auth-ok0kw088ss4swwo4wc84gg0w`
✅ **SMTP Variables Exist:** Currently empty, need to be filled
✅ **Default Port:** 587 (TLS)

## Current Empty SMTP Variables

```
GOTRUE_SMTP_HOST=           (empty)
GOTRUE_SMTP_PORT=587        (set)
GOTRUE_SMTP_USER=           (empty)
GOTRUE_SMTP_PASS=           (empty)
GOTRUE_SMTP_ADMIN_EMAIL=    (empty)
GOTRUE_SMTP_SENDER_NAME=    (empty)
```

---

## Step 1: Access Coolify Dashboard

1. **Find your Coolify URL:**
   - Likely: `https://coolify.nexcyte.com` or `https://nexcyte.com:8000`
   - Check your browser bookmarks or ask where you access Coolify

2. **Login to Coolify**
   - Use your Coolify admin credentials

---

## Step 2: Get Gmail App Password (Quick Setup)

Before configuring in Coolify, get your Gmail credentials:

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Create "EZCR Supabase" password
5. **Copy the 16-character password** (no spaces)

---

## Step 3: Configure SMTP in Coolify

### Navigate to Supabase Service

1. In Coolify dashboard, go to **Services** or **Applications**
2. Find your **Supabase** service
3. Look for the **Auth** component or service
4. Click on it to edit

### Add Environment Variables

Find the **Environment Variables** section and set these:

```bash
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your-email@gmail.com
GOTRUE_SMTP_PASS=your-16-char-app-password
GOTRUE_SMTP_ADMIN_EMAIL=your-email@gmail.com
GOTRUE_SMTP_SENDER_NAME=EZ Cycle Ramp
GOTRUE_SITE_URL=http://localhost:3002
GOTRUE_MAILER_AUTOCONFIRM=false
```

**Important:** Replace:
- `your-email@gmail.com` - Your actual Gmail address
- `your-16-char-app-password` - The password from Step 2

### Alternative: Using Resend (Production)

If you prefer Resend instead of Gmail:

```bash
GOTRUE_SMTP_HOST=smtp.resend.com
GOTRUE_SMTP_PORT=465
GOTRUE_SMTP_USER=resend
GOTRUE_SMTP_PASS=re_your_resend_api_key
GOTRUE_SMTP_ADMIN_EMAIL=noreply@nexcyte.com
GOTRUE_SMTP_SENDER_NAME=EZ Cycle Ramp
GOTRUE_SITE_URL=http://localhost:3002
GOTRUE_MAILER_AUTOCONFIRM=false
```

Get Resend API key: https://resend.com (free 3,000 emails/month)

---

## Step 4: Restart the Auth Service

In Coolify:

1. Find the **Restart** or **Redeploy** button for the Auth service
2. Click it to restart with new environment variables
3. Wait for the service to come back online (1-2 minutes)

**Or via command line:**
```bash
ssh root@5.161.84.153
docker restart supabase-auth-ok0kw088ss4swwo4wc84gg0w
```

---

## Step 5: Verify Configuration

### Check Environment Variables Were Applied

```bash
ssh root@5.161.84.153
docker inspect supabase-auth-ok0kw088ss4swwo4wc84gg0w | grep -E "GOTRUE_SMTP"
```

You should see your values (not empty).

### Check Container Logs

```bash
ssh root@5.161.84.153
docker logs supabase-auth-ok0kw088ss4swwo4wc84gg0w --tail 50
```

Look for any SMTP-related errors.

---

## Step 6: Test Password Reset

1. Go to: http://localhost:3002/forgot-password
2. Enter: morris@mocampbell.com
3. Click "Send Reset Link"
4. Check your email inbox (and spam folder)

### Monitor Logs While Testing

In another terminal, watch the logs:
```bash
ssh root@5.161.84.153
docker logs -f supabase-auth-ok0kw088ss4swwo4wc84gg0w
```

You should see email sending activity in the logs.

---

## Troubleshooting

### Can't Find Coolify Dashboard

Check if Coolify is running:
```bash
ssh root@5.161.84.153
docker ps | grep coolify
```

Access Coolify container to find the URL:
```bash
docker inspect coolify | grep -i port
```

### Environment Variables Not Saving

- Make sure you're editing the **Auth** service specifically
- In Coolify, look for "GoTrue" or "Auth" component
- Save/Apply changes before restarting
- Some Coolify versions require "Redeploy" instead of just restart

### SMTP Connection Errors

Test SMTP from the server:
```bash
ssh root@5.161.84.153
telnet smtp.gmail.com 587
# Press Ctrl+] then type "quit" to exit
```

If connection fails, check firewall:
```bash
# Allow outbound SMTP
ufw allow out 587/tcp
ufw allow out 465/tcp
```

### Emails Not Arriving

1. **Check spam folder** - Gmail might filter them
2. **Check Gmail security** - Gmail might block the login attempt
3. **Verify app password** - Make sure you used app password, not regular password
4. **Check GOTRUE_SITE_URL** - Should match your app URL

---

## Alternative: Direct Docker Compose Edit

If Coolify doesn't have UI for environment variables, you can edit directly:

### Find the Docker Compose File

```bash
ssh root@5.161.84.153

# Coolify stores configs here (usually):
cd /data/coolify/services

# Or search:
find /data -name "docker-compose.yml" -path "*supabase*" 2>/dev/null
```

### Edit the File

```bash
nano /path/to/docker-compose.yml
```

Find the `auth` or `gotrue` service and add environment variables:

```yaml
services:
  auth:
    image: supabase/gotrue:v2.174.0
    environment:
      GOTRUE_SMTP_HOST: smtp.gmail.com
      GOTRUE_SMTP_PORT: 587
      GOTRUE_SMTP_USER: your-email@gmail.com
      GOTRUE_SMTP_PASS: your-app-password
      GOTRUE_SMTP_ADMIN_EMAIL: your-email@gmail.com
      GOTRUE_SMTP_SENDER_NAME: "EZ Cycle Ramp"
      GOTRUE_SITE_URL: http://localhost:3002
      # ... other variables
```

### Apply Changes

```bash
cd /path/to/docker-compose/directory
docker compose up -d auth
```

---

## Production Checklist

Before going live:

- [ ] Switch from Gmail to Resend or SendGrid
- [ ] Update GOTRUE_SITE_URL to production domain
- [ ] Verify domain ownership with email provider
- [ ] Set up SPF, DKIM, DMARC DNS records
- [ ] Customize email templates
- [ ] Test all email flows (reset, invite, confirm)

---

## Quick Reference: Environment Variables

**Minimum Required:**
```bash
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=email@gmail.com
GOTRUE_SMTP_PASS=app-password
GOTRUE_SMTP_ADMIN_EMAIL=email@gmail.com
```

**Recommended Additional:**
```bash
GOTRUE_SMTP_SENDER_NAME="EZ Cycle Ramp"
GOTRUE_SITE_URL=http://localhost:3002
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_MAILER_URLPATHS_RECOVERY=/reset-password
```

**For Production:**
```bash
GOTRUE_SITE_URL=https://yourdomain.com
GOTRUE_SMTP_HOST=smtp.resend.com
GOTRUE_SMTP_PORT=465
GOTRUE_SMTP_USER=resend
GOTRUE_SMTP_PASS=re_your_api_key
```

---

## Next Steps

1. ✅ Found container: `supabase-auth-ok0kw088ss4swwo4wc84gg0w`
2. 🔄 Get Gmail app password
3. 🔄 Configure in Coolify dashboard
4. 🔄 Restart auth service
5. 🔄 Test password reset flow

Need help finding the Coolify dashboard? Check your bookmarks or try common URLs:
- https://coolify.nexcyte.com
- https://nexcyte.com:8000
- http://5.161.84.153:8000
