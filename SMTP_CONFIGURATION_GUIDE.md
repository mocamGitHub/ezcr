# SMTP Configuration Guide for Supabase

This guide will help you configure SMTP for sending password reset emails and team invitations.

## Overview

Supabase needs SMTP credentials to send emails. You have several options:

1. **Resend** (Recommended) - Simple, developer-friendly, generous free tier
2. **Gmail SMTP** - Use your existing Gmail account
3. **SendGrid** - Popular email service
4. **Mailgun** - Another popular option
5. **AWS SES** - If you're already on AWS

## Option 1: Resend (Recommended)

### Why Resend?
- ✅ 3,000 emails/month free
- ✅ Simple API
- ✅ Great deliverability
- ✅ Easy setup
- ✅ Beautiful email templates

### Setup Steps

#### 1. Sign up for Resend
1. Go to https://resend.com
2. Click "Sign Up" or "Get Started"
3. Create account with your email
4. Verify your email address

#### 2. Get Your API Key
1. In Resend dashboard, click "API Keys" in left sidebar
2. Click "Create API Key"
3. Name it: "EZCR Development" or "EZCR Production"
4. Click "Create"
5. **Copy the API key immediately** (you won't see it again!)

#### 3. Add Domain (Optional but Recommended)
1. Click "Domains" in left sidebar
2. Click "Add Domain"
3. Enter your domain: `nexcyte.com` or `ezcr.com`
4. Follow the DNS verification instructions
5. Wait for verification (can take a few minutes)

**For Development:** You can skip domain verification and use Resend's test mode (emails go to your own email only).

#### 4. Configure Supabase

1. Go to https://supabase.nexcyte.com
2. Navigate to **Authentication** → **Email Templates**
3. Scroll to **SMTP Settings**
4. Use these settings:

```
SMTP Host: smtp.resend.com
SMTP Port: 465 (for SSL) or 587 (for TLS)
SMTP Username: resend
SMTP Password: [Your Resend API Key from step 2]
Sender Email: noreply@nexcyte.com (or your domain)
Sender Name: EZ Cycle Ramp
Enable SSL: Yes (if using port 465)
Enable TLS: Yes (if using port 587)
```

**Recommended:** Use port 465 with SSL.

#### 5. Update .env.local
Add your Resend API key:

```bash
# ========================================
# EMAIL (Resend - resend.com)
# ========================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Option 2: Gmail SMTP (Quick & Easy)

### Setup Steps

#### 1. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

#### 2. Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "EZCR App"
4. Click "Generate"
5. **Copy the 16-character password** (no spaces)

#### 3. Configure Supabase

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: [16-character app password from step 2]
Sender Email: your-email@gmail.com
Sender Name: EZ Cycle Ramp
Enable TLS: Yes
```

**Note:** Gmail has a sending limit of 500 emails/day.

---

## Option 3: SendGrid

### Setup Steps

#### 1. Sign up for SendGrid
1. Go to https://sendgrid.com
2. Create free account (100 emails/day free)
3. Verify your email

#### 2. Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it "EZCR"
4. Select "Full Access"
5. Click "Create & View"
6. **Copy the API key**

#### 3. Configure Supabase

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey (literally the word "apikey")
SMTP Password: [Your SendGrid API key]
Sender Email: noreply@yourdomain.com
Sender Name: EZ Cycle Ramp
Enable TLS: Yes
```

---

## Supabase Configuration Steps (All Options)

### 1. Access SMTP Settings

1. Go to https://supabase.nexcyte.com
2. Click **Authentication** in left sidebar
3. Click **Email Templates** tab
4. Scroll to **SMTP Settings** section

### 2. Enter SMTP Credentials

Fill in the form with your chosen provider's settings (from above).

### 3. Test the Configuration

After saving, test it:

```sql
-- In Supabase SQL Editor, check auth settings
SELECT * FROM auth.config WHERE key = 'smtp_admin_email';
```

### 4. Send Test Email

Use the forgot password page to test:
1. Go to http://localhost:3002/forgot-password
2. Enter your email: morris@mocampbell.com
3. Click "Send Reset Link"
4. Check your email inbox

---

## Email Templates (Customize Later)

Supabase has pre-built templates for:
- Password reset
- Email verification
- Magic link login
- Email change confirmation

You can customize these in **Authentication → Email Templates**.

### Default Template Variables

- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Token }}` - Verification token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials** - Ensure API key is correct
2. **Check sender email** - Must be verified domain
3. **Check spam folder** - Emails might be filtered
4. **Check Supabase logs** - Authentication → Logs

### "Authentication failed" Error

- Gmail: Make sure you're using App Password, not regular password
- Resend: Make sure API key starts with `re_`
- SendGrid: Make sure username is literally `apikey`

### Emails Going to Spam

1. **Add SPF record** to your DNS:
   ```
   v=spf1 include:_spf.resend.com ~all
   ```

2. **Add DKIM record** (provided by your email service)

3. **Add DMARC record**:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

---

## Production Checklist

Before going to production:

- [ ] Use custom domain (not Gmail)
- [ ] Verify domain ownership
- [ ] Set up SPF, DKIM, DMARC records
- [ ] Customize email templates with branding
- [ ] Test all email flows (reset, invite, verify)
- [ ] Monitor email deliverability
- [ ] Set up email rate limiting

---

## Cost Estimates

**Resend:**
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails

**SendGrid:**
- Free: 100 emails/day
- Essentials: $20/month for 50,000 emails

**Gmail:**
- Free: 500 emails/day (not recommended for production)

**AWS SES:**
- $0.10 per 1,000 emails (cheapest for high volume)

---

## Recommended for EZCR

**Development:** Gmail SMTP (quick setup, testing only)
**Production:** Resend (professional, reliable, good price)

Start with Gmail to test, then switch to Resend before launch.

---

## Next Steps

1. Choose your SMTP provider
2. Get API credentials
3. Configure in Supabase dashboard
4. Test password reset flow
5. Customize email templates
6. Add to production deployment checklist
