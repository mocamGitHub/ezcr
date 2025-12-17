# COMMS PACK - START HERE

**Status**: ✅ Files integrated, ready for deployment
**Time Required**: ~30 minutes for full deployment
**Difficulty**: Medium (requires SSH + provider setup)

---

## WHAT YOU DO NEXT (10 STEPS)

### Step 1: Discover Database (2 minutes)
```powershell
ssh root@supabase.nexcyte.com 'bash -s' < .\scripts\ops\discover-supabase-db.sh
```
**Write down**: POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD, Port

### Step 2: Apply Migrations (5 minutes)
```powershell
.\scripts\ops\apply-comms-migrations.ps1
```
**Enter when prompted**: Server IP, PostgreSQL password from Step 1

### Step 3: Configure Environment (5 minutes)
```powershell
# Copy template
cp .env.comms.example .env.local

# Edit file
notepad .env.local
```
**Required variables**: See .env.comms.example for full list

### Step 4: Generate Secrets (1 minute)
```powershell
# Generate NC_INTERNAL_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate EZCR_MAILGUN_INBOUND_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
**Add to .env.local**

### Step 5: Get Tenant ID (2 minutes)
```powershell
# Find your tenant UUID
ssh root@supabase.nexcyte.com -L 15432:localhost:5432
# Then in another window:
psql "postgresql://postgres:<password>@localhost:15432/postgres" -c "SELECT id, tenant_slug FROM tenants;"
```
**Add to .env.local**: EZCR_TENANT_ID=<uuid>

### Step 6: Run Seed Script (2 minutes)
```powershell
# Load environment variables
foreach ($line in Get-Content .env.local) {
    if ($line -match '^([^#][^=]+)=(.+)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Run seed
node .\scripts\seed-comms-full.ts
```

### Step 7: Configure Mailgun Domain (5 minutes)
1. Go to: https://app.mailgun.com/app/sending/domains
2. Add domain: `mg.ezcycleramp.com`
3. Add DNS records (TXT, CNAME)
4. Wait 5-10 minutes, click "Verify DNS"

### Step 8: Set Up Mailgun Webhooks (3 minutes)
**Inbound Route**:
- Go to: https://app.mailgun.com/app/receiving/routes
- Expression: `match_recipient(".*@mg.ezcycleramp.com")`
- Forward URL: `https://staging.ezcycleramp.com/api/webhooks/mailgun/inbound/<your-secret>`

**Events Webhook**:
- Go to: Domain → Webhooks
- URL: `https://staging.ezcycleramp.com/api/webhooks/mailgun/events`
- Events: ALL (or delivered, failed, opened, clicked, unsubscribed, complained)
- Copy "HTTP webhook signing key" → add to .env.local as MAILGUN_WEBHOOK_SIGNING_KEY

### Step 9: Configure Twilio (3 minutes)
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click your phone number
3. Set "A MESSAGE COMES IN": `https://staging.ezcycleramp.com/api/webhooks/twilio/inbound`
4. Set "STATUS CALLBACK URL": `https://staging.ezcycleramp.com/api/webhooks/twilio/status`
5. Click "Save"

### Step 10: Smoke Test (2 minutes)
```powershell
# Start dev server
npm run dev

# In another window, run tests
.\scripts\ops\comms-smoke-test.ps1
```

**Expected**: "All smoke tests PASSED ✓"

---

## IF SOMETHING FAILS

**Problem**: Migration fails
→ **Solution**: See COMMS_DEPLOYMENT_RUNBOOK.md Section "Step 2.4"

**Problem**: Smoke tests fail
→ **Solution**: Check .env.local has all required variables

**Problem**: Can't connect to database
→ **Solution**: Verify SSH tunnel is open, check PostgreSQL password

**Problem**: Webhooks return 500 errors
→ **Solution**: Check Next.js dev server logs for errors

---

## FULL DOCUMENTATION

- **Complete deployment guide**: COMMS_DEPLOYMENT_RUNBOOK.md
- **What was integrated**: COMMS_PACK_STATUS.md
- **Environment template**: .env.comms.example

---

## QUICK VERIFICATION

After Step 10, run these queries to verify everything works:

```powershell
# Open DB connection
ssh root@supabase.nexcyte.com -L 15432:localhost:5432

# In another window, check tables
psql "postgresql://postgres:<password>@localhost:15432/postgres" -c "\dt public.comms_*"
```

**Expected**: 13 tables listed

```sql
-- Check seed data
SELECT COUNT(*) FROM comms_contacts;        -- Expected: 1
SELECT COUNT(*) FROM comms_templates;       -- Expected: 2
SELECT COUNT(*) FROM comms_phone_numbers;   -- Expected: 1
```

---

## AFTER DEPLOYMENT

1. ✅ Test send email: Call /api/comms/send with channel=email
2. ✅ Test inbound email: Send to your Mailgun inbound address
3. ✅ Test send SMS: Call /api/comms/send with channel=sms
4. ✅ Test inbound SMS: Text your Twilio number
5. ✅ Deploy to staging: Update webhook URLs, redeploy

---

**Ready?** Start with Step 1 above, or read COMMS_DEPLOYMENT_RUNBOOK.md for full details.
