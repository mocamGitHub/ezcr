# COMMS FULL PACK - NO-CONFUSION DEPLOYMENT RUNBOOK

**Target**: Self-hosted Supabase at supabase.nexcyte.com
**Repo**: C:\Users\morri\Dropbox\Websites\ezcr
**Platform**: Windows 11 PowerShell

---

## WHAT YOU DO NEXT (5-STEP OVERVIEW)

1. **Discover Supabase DB** - SSH to server, run discovery script
2. **Apply Migrations** - Use PS1 script to apply via SSH tunnel
3. **Seed Tenant Data** - Run TypeScript seed script
4. **Configure Providers** - Set up Mailgun & Twilio webhooks
5. **Smoke Test** - Verify everything works

---

## PREREQUISITES CHECK

Before starting, verify:

- [ ] SSH access to supabase.nexcyte.com server
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Node.js 18+ installed
- [ ] PostgreSQL client (psql) installed (optional, for manual queries)
- [ ] Mailgun account with domain configured
- [ ] Twilio account with phone number

---

## STEP 1: DISCOVER SUPABASE DATABASE

### 1.1 Run Discovery Script on Server

```powershell
# From repo root
ssh root@supabase.nexcyte.com 'bash -s' < .\scripts\ops\discover-supabase-db.sh
```

**What this does**: Finds the PostgreSQL container, extracts credentials, shows connection details.

**Expected output**:
```
Container Name: supabase-db (or similar)
POSTGRES_USER: postgres
POSTGRES_DB: postgres
POSTGRES_PASSWORD: [FOUND - length XX chars]
Internal Port: 5432
SSL Enabled: on/off
```

### 1.2 Save These Values

Write down:
- POSTGRES_USER: `____________`
- POSTGRES_DB: `____________`
- POSTGRES_PASSWORD: `____________`
- Internal Port: `____________`
- SSL Enabled: `____________`

---

## STEP 2: APPLY DATABASE MIGRATIONS

### 2.1 Run Migration Script

```powershell
# From repo root: C:\Users\morri\Dropbox\Websites\ezcr
.\scripts\ops\apply-comms-migrations.ps1
```

### 2.2 Script Will Prompt For:

1. **Supabase server IP**: Enter `supabase.nexcyte.com` (or IP from Step 1)
2. **PostgreSQL password**: Enter password from Step 1

### 2.3 What Happens:

- ✓ Opens SSH tunnel: localhost:15432 → supabase:5432
- ✓ Applies 2 migrations:
  - `00025_comms_core_schema.sql` (creates 12 core tables)
  - `00026_comms_phone_numbers.sql` (adds phone mappings)
- ✓ Verifies tables created
- ✓ Closes tunnel automatically

**Expected output**:
```
✓ Migration applied successfully!
✓ Tables created:
    - comms_contacts
    - comms_channel_preferences
    - comms_templates
    ...
```

### 2.4 If Migration Fails

**Option 2: Manual psql approach**:

```powershell
# 1. Open SSH tunnel manually
ssh -L 15432:localhost:5432 root@supabase.nexcyte.com

# 2. In another PowerShell window, apply migrations
psql "postgresql://postgres:<password>@localhost:15432/postgres" -f .\supabase\migrations\00025_comms_core_schema.sql
psql "postgresql://postgres:<password>@localhost:15432/postgres" -f .\supabase\migrations\00026_comms_phone_numbers.sql

# 3. Close tunnel: Ctrl+C in first window
```

---

## STEP 3: SEED TENANT DATA

### 3.1 Set Environment Variables

Create `.env.local` in repo root if it doesn't exist:

```powershell
# Copy example
cp .env.example .env.local

# Edit .env.local
notepad .env.local
```

### 3.2 Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.nexcyte.com
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Tenant
EZCR_TENANT_ID=<your-tenant-uuid>

# Optional for seed
EZCR_TWILIO_NUMBER=+15551234567
EZCR_MAILGUN_INBOUND_SECRET=some-random-string-32-chars

# Internal API
NC_INTERNAL_API_KEY=<generate-random-key>

# Mailgun
MAILGUN_API_KEY=<your-mailgun-api-key>
MAILGUN_DOMAIN=mg.ezcycleramp.com
MAILGUN_FROM_EMAIL=noreply@mg.ezcycleramp.com
MAILGUN_FROM_NAME=EZ Cycle Ramp
MAILGUN_WEBHOOK_SIGNING_KEY=<from-mailgun-dashboard>
MAILGUN_VERIFY_WEBHOOK_SIGNATURE=true

# Twilio
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_DEFAULT_FROM=+15551234567
TWILIO_VALIDATE_SIGNATURE=true
TWILIO_STATUS_CALLBACK_URL=https://staging.ezcycleramp.com/api/webhooks/twilio/status
```

### 3.3 Find Your Tenant ID

```powershell
# Option 1: Query Supabase
psql "postgresql://postgres:<password>@localhost:15432/postgres" -c "SELECT id, tenant_slug FROM tenants;"

# Option 2: Check existing migrations
grep -r "ezcr-01" .\supabase\migrations\
```

### 3.4 Generate Random Secrets

```powershell
# For NC_INTERNAL_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For EZCR_MAILGUN_INBOUND_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3.5 Run Seed Script

```powershell
# Load .env.local
foreach ($line in Get-Content .env.local) {
    if ($line -match '^([^#][^=]+)=(.+)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Run seed
node .\scripts\seed-comms-full.ts
```

**Expected output**:
```
[seed] comms_phone_numbers upserted: +15551234567
[seed] comms_inbound_routes upserted: mailgun inbound secret
[seed] Created example contact
[seed] Created example templates (email + SMS)
```

---

## STEP 4: CONFIGURE PROVIDERS

### 4.1 Mailgun Domain Setup

**A. Add Domain**

1. Go to: https://app.mailgun.com/app/sending/domains
2. Click "Add New Domain"
3. Enter: `mg.ezcycleramp.com`
4. Click "Add Domain"

**B. Add DNS Records**

Mailgun will show DNS records. Add these to your DNS provider:

```
TXT  mg.ezcycleramp.com  v=spf1 include:mailgun.org ~all
TXT  k1._domainkey.mg.ezcycleramp.com  <DKIM-value-from-mailgun>
CNAME email.mg.ezcycleramp.com  mailgun.org
```

**C. Verify Domain**

Wait 5-10 minutes, then click "Verify DNS Settings" in Mailgun.

### 4.2 Mailgun Inbound Route

**A. Create Route**

1. Go to: https://app.mailgun.com/app/receiving/routes
2. Click "Create Route"
3. **Expression**: `match_recipient(".*@mg.ezcycleramp.com")`
4. **Actions**: Select "Forward"
5. **URL**: `https://staging.ezcycleramp.com/api/webhooks/mailgun/inbound/<secret>`
   - Replace `<secret>` with your `EZCR_MAILGUN_INBOUND_SECRET`
6. **Priority**: 0
7. Click "Create Route"

### 4.3 Mailgun Events Webhook

1. Go to: https://app.mailgun.com/app/sending/domains/mg.ezcycleramp.com/webhooks
2. Click "Add Webhook"
3. **URL**: `https://staging.ezcycleramp.com/api/webhooks/mailgun/events`
4. **Events**: Select ALL (or at minimum):
   - delivered
   - permanent_fail
   - temporary_fail
   - opened
   - clicked
   - unsubscribed
   - complained
5. Click "Create Webhook"

### 4.4 Mailgun Webhook Signing Key

1. Same page as Step 4.3
2. Find "HTTP webhook signing key" section
3. Click "Show"
4. Copy the key
5. Add to `.env.local`: `MAILGUN_WEBHOOK_SIGNING_KEY=<key>`

### 4.5 Twilio Phone Number Setup

**A. Configure Webhooks**

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click your phone number
3. Scroll to "Messaging Configuration"
4. **A MESSAGE COMES IN**:
   - Webhook: `https://staging.ezcycleramp.com/api/webhooks/twilio/inbound`
   - HTTP POST
5. **STATUS CALLBACK URL**:
   - URL: `https://staging.ezcycleramp.com/api/webhooks/twilio/status`
   - HTTP POST
6. Click "Save"

**B. Verify Signature Validation**

In `.env.local`, ensure:
```env
TWILIO_VALIDATE_SIGNATURE=true
```

---

## STEP 5: SMOKE TEST

### 5.1 Start Dev Server

```powershell
npm run dev
```

Wait for: `Local: http://localhost:3000`

### 5.2 Run Smoke Tests

```powershell
# In another PowerShell window
.\scripts\ops\comms-smoke-test.ps1
```

**Expected output**:
```
✓ Environment variables configured
✓ Dev server is running
✓ Database tables exist
✓ Mailgun provider initialized
✓ Twilio provider initialized
✓ Webhook endpoints reachable

All smoke tests PASSED ✓
```

### 5.3 Manual End-to-End Tests

**Test 1: Outbound Email**

```powershell
# Create test script
$body = @{
    tenantId = "<your-tenant-id>"
    contactId = "<contact-id-from-seed>"
    channel = "email"
    templateVersionId = "<template-version-id-from-seed>"
    variables = @{
        "order.number" = "TEST-001"
        "order.total" = "$99.99"
        "contact.display_name" = "Test User"
    }
} | ConvertTo-Json

# Send request
Invoke-WebRequest `
    -Uri "http://localhost:3000/api/comms/send" `
    -Method POST `
    -Headers @{ "x-nc-internal-key" = $env:NC_INTERNAL_API_KEY } `
    -ContentType "application/json" `
    -Body $body
```

**Verify**:
```sql
-- Check message was created
SELECT id, status, to_address, subject, created_at
FROM comms_messages
ORDER BY created_at DESC
LIMIT 1;

-- Check events
SELECT event_type, provider, created_at
FROM comms_message_events
WHERE message_id = '<message-id-from-above>'
ORDER BY created_at;
```

**Test 2: Inbound Email**

1. Send email to: `test@mg.ezcycleramp.com`
2. Check logs: `docker logs -f ezcr-nextjs`
3. Verify in DB:

```sql
-- Check conversation created
SELECT id, subject, status, created_at
FROM comms_conversations
ORDER BY created_at DESC
LIMIT 1;

-- Check inbound message
SELECT id, direction, from_address, text_body, created_at
FROM comms_messages
WHERE direction = 'inbound'
ORDER BY created_at DESC
LIMIT 1;
```

**Test 3: Outbound SMS**

```powershell
$body = @{
    tenantId = "<your-tenant-id>"
    contactId = "<contact-id>"
    channel = "sms"
    templateVersionId = "<sms-template-version-id>"
    variables = @{
        "order.number" = "TEST-002"
        "order.total" = "$199.99"
        "contact.display_name" = "Test User"
    }
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:3000/api/comms/send" `
    -Method POST `
    -Headers @{ "x-nc-internal-key" = $env:NC_INTERNAL_API_KEY } `
    -ContentType "application/json" `
    -Body $body
```

**Test 4: Inbound SMS**

1. Text your Twilio number
2. Check webhook logs
3. Verify in DB (same query as email inbound)

---

## TROUBLESHOOTING

### Problem: Migrations fail with "permission denied"

**Solution**: Run as service role:
```powershell
# Set environment variable before running script
$env:SUPABASE_ACCESS_TOKEN = "<your-access-token>"
```

### Problem: "Cannot find module @supabase/supabase-js"

**Solution**: Install dependencies:
```powershell
npm install
```

### Problem: Webhook signature validation fails

**Solution**: Check signing keys match:
```powershell
# Mailgun
Write-Host $env:MAILGUN_WEBHOOK_SIGNING_KEY

# Twilio
Write-Host $env:TWILIO_AUTH_TOKEN
```

### Problem: SSH tunnel won't connect

**Solution**:
```powershell
# Test SSH manually
ssh root@supabase.nexcyte.com 'echo OK'

# If this fails, check:
# 1. SSH keys are set up
# 2. Firewall allows SSH (port 22)
# 3. Server hostname is correct
```

### Problem: Tables don't show up after migration

**Solution**: Query directly:
```powershell
# Open tunnel
ssh -L 15432:localhost:5432 root@supabase.nexcyte.com

# In another window
psql "postgresql://postgres:<password>@localhost:15432/postgres" -c "\dt public.comms_*"
```

---

## VERIFICATION CHECKLIST

After completing all steps, verify:

**Database**:
- [ ] 12+ comms_* tables exist
- [ ] comms_phone_numbers has your Twilio number
- [ ] comms_inbound_routes has Mailgun secret
- [ ] Example templates exist

**Mailgun**:
- [ ] Domain verified (green check)
- [ ] Inbound route created
- [ ] Events webhook configured
- [ ] Signing key saved in .env.local

**Twilio**:
- [ ] Phone number webhook configured
- [ ] Status callback configured
- [ ] Credentials in .env.local

**Application**:
- [ ] Dev server starts without errors
- [ ] Smoke tests pass
- [ ] Outbound email works
- [ ] Inbound email creates conversation
- [ ] Outbound SMS works
- [ ] Inbound SMS creates conversation

---

## SQL QUERIES FOR VALIDATION

```sql
-- Count rows in each table
SELECT
  'comms_contacts' as table_name,
  COUNT(*) as row_count
FROM comms_contacts
UNION ALL
SELECT 'comms_templates', COUNT(*) FROM comms_templates
UNION ALL
SELECT 'comms_template_versions', COUNT(*) FROM comms_template_versions
UNION ALL
SELECT 'comms_phone_numbers', COUNT(*) FROM comms_phone_numbers
UNION ALL
SELECT 'comms_inbound_routes', COUNT(*) FROM comms_inbound_routes;

-- View recent messages with events
SELECT
  m.id,
  m.channel,
  m.direction,
  m.status,
  m.to_address,
  m.created_at,
  COUNT(e.id) as event_count
FROM comms_messages m
LEFT JOIN comms_message_events e ON e.message_id = m.id
GROUP BY m.id
ORDER BY m.created_at DESC
LIMIT 10;

-- Check tenant mappings
SELECT
  'Phone' as type,
  phone_number as value,
  is_primary,
  is_active
FROM comms_phone_numbers
UNION ALL
SELECT
  'Inbound Route',
  provider || ' (' || channel || ')',
  NULL,
  is_active
FROM comms_inbound_routes
ORDER BY type;
```

---

## PASS/FAIL CRITERIA

### ✅ PASS if:

1. All migrations apply without errors
2. All 12+ comms_* tables exist in database
3. Seed script completes successfully
4. Mailgun domain shows "Verified" status
5. Twilio webhooks save without errors
6. Smoke test script reports "All tests PASSED"
7. Test email sends and appears in comms_messages
8. Test inbound email creates conversation
9. Test SMS sends and appears in comms_messages
10. Test inbound SMS creates conversation

### ❌ FAIL if:

1. Migration errors during apply
2. Missing tables after migration
3. Seed script fails with DB errors
4. Mailgun domain stuck in "Unverified"
5. Twilio webhook configuration errors
6. Smoke test reports failures
7. /api/comms/send returns errors
8. Inbound webhooks return 500 errors
9. Messages stuck in "queued" status
10. Provider signature validation fails

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Test in staging**: Deploy to staging.ezcycleramp.com
2. **Configure production domains**: Use real sending domains
3. **Set up monitoring**: Track message delivery rates
4. **Create templates**: Build real email/SMS templates
5. **Integrate with app**: Call /api/comms/send from order flow

---

## SUPPORT

If you encounter issues not covered in this runbook:

1. Check logs: `npm run dev` output
2. Check Docker logs: `ssh root@supabase.nexcyte.com 'docker logs supabase-db'`
3. Verify environment variables: All required vars set
4. Re-run smoke tests: `.\scripts\ops\comms-smoke-test.ps1`

**Common Mistakes**:
- Forgetting to set EZCR_TENANT_ID
- Using wrong Mailgun signing key (there are multiple in dashboard)
- Not waiting for DNS propagation (5-10 minutes)
- SSH tunnel closes before migration completes
- Wrong PostgreSQL password

---

**End of Runbook**
