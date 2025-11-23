# n8n Workflows Deployment Checklist

**Created**: 2025-10-13
**Purpose**: Master checklist for deploying all three n8n workflows
**Status**: Ready for deployment

---

## Overview

This checklist guides you through deploying three high-impact n8n workflows:

1. **Appointment Automation** (ROI: 1,500x)
2. **Order Inquiry Handler** (ROI: 3,000-4,500x)
3. **Chat Analytics Daily Report** (ROI: Infinite)

**Combined Impact**: 
- Monthly cost: ~$2.50
- Monthly value: ~$4,400-5,850
- Total ROI: **1,760-2,340x** 🚀

---

## Pre-Deployment Setup

### ✅ Step 1: Database Preparation (10 min)

**Required Tables** (should already exist):
- ✅ `orders` - with appointment columns
- ✅ `order_items` - order details
- ✅ `chat_sessions` - conversation tracking
- ✅ `chat_messages` - message history
- ✅ `knowledge_base` - RAG content

**New Table Needed**:
```sql
-- Create analytics_snapshots table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, snapshot_date, snapshot_type)
);

CREATE INDEX idx_analytics_snapshots_tenant_date 
ON analytics_snapshots(tenant_id, snapshot_date DESC);

CREATE INDEX idx_analytics_snapshots_type 
ON analytics_snapshots(snapshot_type);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access"
ON analytics_snapshots FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

**Verify orders table has appointment columns**:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('appointment_date', 'appointment_time_slot');

-- Add if missing
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time_slot VARCHAR(50);
```

### ✅ Step 2: Environment Variables (5 min)

Add to `.env.local`:
```bash
# n8n Webhook URLs (add after setting up workflows)
N8N_APPOINTMENT_WEBHOOK=https://n8n.nexcyte.com/webhook/appointment-scheduled
N8N_ORDER_INQUIRY_WEBHOOK=https://n8n.nexcyte.com/webhook/order-inquiry

# These should already exist:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
RESEND_API_KEY=re_your-resend-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Template updated**: `.env.example` now includes n8n webhook sections

### ✅ Step 3: Access n8n Instance (2 min)

1. Open: https://n8n.nexcyte.com
2. Log in with your credentials
3. Verify you can create new workflows

---

## Workflow 1: Appointment Automation

**Priority**: HIGH ⭐⭐⭐
**Time to Deploy**: ~1 hour
**ROI**: 1,500x

### Import Workflow (10 min)

- [ ] Click "+" (New workflow)
- [ ] Click three dots menu → "Import from File"
- [ ] Select: `n8n/workflows/appointment-automation.json`
- [ ] Verify 15 nodes imported successfully
- [ ] Name: "Appointment Automation"

### Configure Credentials (20 min)

#### Supabase PostgreSQL
- [ ] Click "Credentials" → "Add Credential" → "Postgres"
- [ ] Name: "Supabase PostgreSQL"
- [ ] Fill in: Host, Database, User, Password, Port (5432), SSL (Enabled)
- [ ] Test Connection → Save

#### Resend API (Email)
- [ ] Go to: https://resend.com/api-keys
- [ ] Create API key: "n8n-appointment-emails"
- [ ] In n8n: Add "Resend API" credential
- [ ] Paste API key → Save

#### Google Calendar OAuth2
- [ ] In n8n: Add "Google Calendar OAuth2 API" credential
- [ ] Follow OAuth flow
- [ ] Grant calendar access
- [ ] Select calendar: "primary" or "Installations"
- [ ] Save

#### Slack Webhook
- [ ] Go to: https://api.slack.com/apps
- [ ] Create app: "Appointment Notifications"
- [ ] Enable "Incoming Webhooks"
- [ ] Add webhook to channel: #installations or #general
- [ ] Copy webhook URL
- [ ] Add to n8n environment or hardcode in HTTP Request node

#### Twilio API (SMS)
- [ ] Go to: https://www.twilio.com/console
- [ ] Get: Account SID, Auth Token, Phone Number
- [ ] In n8n: Add "Twilio API" credential
- [ ] Fill in credentials → Save

### Update Workflow Settings (5 min)

- [ ] Click "Webhook - Appointment Scheduled" node
- [ ] Copy webhook URL (e.g., `https://n8n.nexcyte.com/webhook/appointment-scheduled`)
- [ ] Update `.env.local` with this URL as `N8N_APPOINTMENT_WEBHOOK`
- [ ] Review email templates in "Send Confirmation Email" node
- [ ] Update sender email if needed
- [ ] Review SMS message templates
- [ ] Update phone number variable if needed

### Test Workflow (15 min)

**Test 1: Manual webhook call**
```bash
curl -X POST https://n8n.nexcyte.com/webhook/appointment-scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "ORD-TEST-001",
    "customer_email": "test@example.com",
    "appointment_date": "2025-10-25",
    "appointment_time_slot": "morning",
    "action": "schedule"
  }'
```

**Verify**:
- [ ] Workflow executes successfully
- [ ] Order details retrieved from database
- [ ] Confirmation email sent (check inbox)
- [ ] Calendar event created (check Google Calendar)
- [ ] Slack notification sent (check channel)
- [ ] No errors in n8n execution log

**Test 2: Via chatbot** (after Next.js code is deployed)
- [ ] Open chatbot
- [ ] Say: "Schedule installation for order #ORD-TEST-001, email test@example.com, for October 25th morning"
- [ ] Verify GPT-4 responds with confirmation
- [ ] Check email, calendar, and Slack

### Activate Workflow (2 min)

- [ ] Toggle workflow to "Active" (top right)
- [ ] Verify green "Active" badge shows
- [ ] Workflow is now listening for webhooks

---

## Workflow 2: Order Inquiry Handler

**Priority**: HIGH ⭐⭐⭐
**Time to Deploy**: ~40 minutes
**ROI**: 3,000-4,500x

### Import Workflow (5 min)

- [ ] Click "+" (New workflow)
- [ ] Click three dots menu → "Import from File"
- [ ] Select: `n8n/workflows/order-inquiry-handler.json`
- [ ] Verify 14 nodes imported successfully
- [ ] Name: "Order Inquiry Handler"

### Configure Credentials (15 min)

**Good News**: Can reuse credentials from Workflow 1!

- [ ] Supabase PostgreSQL: Select existing "Supabase PostgreSQL"
- [ ] Resend API: Select existing "Resend API"
- [ ] Slack Webhook: Use same webhook URL (or create new for #support channel)

### Update Workflow Settings (5 min)

- [ ] Click "Webhook - Order Inquiry" node
- [ ] Copy webhook URL (e.g., `https://n8n.nexcyte.com/webhook/order-inquiry`)
- [ ] Update `.env.local` with this URL as `N8N_ORDER_INQUIRY_WEBHOOK`
- [ ] Review email templates for delayed/shipped/delivered orders
- [ ] Update survey link in "Send Satisfaction Survey" node
- [ ] Update review site links (Google, BBB, Trustpilot)

### Test Workflow (15 min)

**Test 1: Delayed Order**
```sql
-- Create test delayed order
INSERT INTO orders (
  tenant_id, order_number, customer_email, customer_name,
  status, total_amount, expected_delivery_date, created_at
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'ezcr-01'),
  'ORD-DELAYED-001', 'test-delayed@example.com', 'Test Customer',
  'delayed', 1299.00, CURRENT_DATE + INTERVAL '5 days', 
  CURRENT_DATE - INTERVAL '15 days'
);
```

```bash
curl -X POST https://n8n.nexcyte.com/webhook/order-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "ORD-DELAYED-001",
    "customer_email": "test-delayed@example.com",
    "status": "delayed"
  }'
```

**Verify**:
- [ ] Support team notified in Slack (⚠️ alert)
- [ ] Proactive email sent to customer
- [ ] Database updated with inquiry metadata

**Test 2: Shipped Order**
```bash
# Create test shipped order, then:
curl -X POST https://n8n.nexcyte.com/webhook/order-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "ORD-SHIPPED-001",
    "customer_email": "test-shipped@example.com",
    "status": "shipped"
  }'
```

**Verify**:
- [ ] Tracking tips email sent

### Activate Workflow (2 min)

- [ ] Toggle workflow to "Active"
- [ ] Verify green "Active" badge shows

---

## Workflow 3: Chat Analytics Daily Report

**Priority**: MEDIUM ⭐⭐
**Time to Deploy**: ~25 minutes
**ROI**: Infinite (essentially free)

### Import Workflow (5 min)

- [ ] Click "+" (New workflow)
- [ ] Click three dots menu → "Import from File"
- [ ] Select: `n8n/workflows/chat-analytics-daily.json`
- [ ] Verify 12 nodes imported successfully
- [ ] Name: "Chat Analytics Daily Report"

### Configure Credentials (10 min)

**Good News**: Can reuse credentials again!

- [ ] Supabase PostgreSQL: Select existing "Supabase PostgreSQL"
- [ ] Slack Webhook: Use same webhook URL (or create new for #analytics channel)
- [ ] (Optional) Resend API: For email reports (node is disabled by default)

### Update Workflow Settings (5 min)

- [ ] Click "Schedule Daily at 6 AM" node
- [ ] Verify cron expression: `0 6 * * *` (6 AM daily)
- [ ] Adjust if needed (e.g., `0 9 * * *` for 9 AM)
- [ ] Review SQL queries to ensure tenant slug matches ('ezcr-01')
- [ ] (Optional) Enable "Send Email Report" node if desired
- [ ] (Optional) Update recipient email address

### Test Workflow (5 min)

**Manual Test**:
- [ ] Click "Execute Workflow" button (play icon)
- [ ] Wait ~10-15 seconds for execution
- [ ] Check execution results for all 6 query nodes
- [ ] Verify Slack report was sent
- [ ] Review report format and data

**If no chat data exists**:
```sql
-- Insert sample chat data for testing
INSERT INTO chat_sessions (id, tenant_id, user_id, status, created_at, updated_at, metadata)
VALUES (gen_random_uuid(), (SELECT id FROM tenants WHERE slug = 'ezcr-01'), 
        'test-user-1', 'completed', CURRENT_DATE - INTERVAL '1 day', 
        CURRENT_DATE - INTERVAL '1 day' + INTERVAL '5 minutes', 
        '{"converted": "true"}'::jsonb);

INSERT INTO chat_messages (session_id, role, content, created_at)
VALUES ((SELECT id FROM chat_sessions ORDER BY created_at DESC LIMIT 1), 
        'user', 'What is the weight capacity?', CURRENT_DATE - INTERVAL '1 day');
```

### Activate Workflow (2 min)

- [ ] Toggle workflow to "Active"
- [ ] Verify green "Active" badge shows
- [ ] First report will arrive tomorrow at 6 AM

---

## Next.js Code Deployment

### Verify Code Changes (5 min)

**File**: `src/app/api/ai/chat-rag/route.ts`

- [ ] Two new functions added:
  - `triggerAppointmentWebhook()`
  - `triggerOrderInquiryWebhook()`
- [ ] Function calls trigger webhooks after successful operations
- [ ] Webhooks are non-blocking (don't fail if n8n is down)

### Deploy to Production (10 min)

```bash
# Commit changes
git add src/app/api/ai/chat-rag/route.ts .env.example
git commit -m "feat: Integrate n8n webhooks for appointment automation and order inquiries"

# Push to production
git push origin main

# Or deploy via Vercel/Netlify dashboard
```

### Update Production Environment (5 min)

**In your hosting platform** (Vercel/Netlify/etc):

- [ ] Add `N8N_APPOINTMENT_WEBHOOK` environment variable
- [ ] Add `N8N_ORDER_INQUIRY_WEBHOOK` environment variable
- [ ] Redeploy application
- [ ] Verify deployment successful

---

## Post-Deployment Verification

### End-to-End Testing (20 min)

**Test Appointment Scheduling**:
1. [ ] Open chatbot on live site
2. [ ] Say: "Schedule installation for order #ORD-TEST-001, email test@example.com, for October 25th morning"
3. [ ] Verify chatbot confirms appointment
4. [ ] Check email inbox for confirmation
5. [ ] Check Google Calendar for event
6. [ ] Check Slack for team notification

**Test Order Inquiry**:
1. [ ] Open chatbot on live site
2. [ ] Say: "Check order #ORD-TEST-001 for test@example.com"
3. [ ] Verify chatbot returns order status
4. [ ] Check if appropriate follow-up was triggered (based on order status)
5. [ ] Check Slack for summary notification

**Test Analytics Report**:
1. [ ] Wait for next scheduled report (6 AM next day)
2. [ ] Or manually execute workflow in n8n
3. [ ] Check Slack for daily report
4. [ ] Verify data accuracy
5. [ ] Check `analytics_snapshots` table in database

---

## Monitoring & Maintenance

### Daily Monitoring (5 min/day)

- [ ] Check Slack for daily analytics report
- [ ] Review any workflow execution errors in n8n
- [ ] Monitor customer feedback on automated communications

### Weekly Review (30 min/week)

- [ ] Review n8n execution history for all workflows
- [ ] Check success rates (should be >95%)
- [ ] Review email delivery rates (Resend dashboard)
- [ ] Review SMS delivery rates (Twilio dashboard)
- [ ] Analyze knowledge gaps from analytics reports
- [ ] Update knowledge base articles as needed

### Monthly Maintenance (1 hour/month)

- [ ] Review and optimize email templates
- [ ] Review and optimize SMS message copy
- [ ] Analyze conversion rate trends
- [ ] Calculate actual ROI from workflows
- [ ] Update survey links if needed
- [ ] Review and respond to customer feedback

---

## Troubleshooting

### Workflow Not Triggering

**Symptoms**: Chatbot function works, but no emails/SMS received

**Check**:
- [ ] Workflow is "Active" in n8n
- [ ] Webhook URL is correct in `.env.local` and production
- [ ] Network connectivity (firewall rules)
- [ ] n8n server is running
- [ ] Check n8n execution history for errors

**Test**:
```bash
# Test webhook directly
curl -X POST https://n8n.nexcyte.com/webhook/appointment-scheduled \
  -H "Content-Type: application/json" \
  -d '{"order_number": "TEST"}'
```

### Emails Not Sending

**Check**:
- [ ] Resend API key is valid
- [ ] Sender email is verified in Resend
- [ ] Customer email is valid format
- [ ] Not hitting Resend rate limits
- [ ] Check Resend dashboard for bounce/error details

### SMS Not Sending

**Check**:
- [ ] Twilio credentials correct
- [ ] Phone number format (E.164: +12345678900)
- [ ] Customer has phone number in database
- [ ] Twilio account is funded
- [ ] Phone number is SMS-capable
- [ ] Check Twilio logs for delivery status

### Calendar Not Creating

**Check**:
- [ ] Google OAuth is connected and not expired
- [ ] Calendar permissions granted
- [ ] Correct calendar ID selected
- [ ] Date format valid (YYYY-MM-DD)
- [ ] Check n8n execution logs for error details

### Database Errors

**Check**:
- [ ] PostgreSQL credentials correct
- [ ] Tables exist with correct schema
- [ ] Service role has necessary permissions
- [ ] Database is not at connection limit
- [ ] Check Supabase logs for errors

---

## Success Metrics

### Week 1 Goals

- [ ] All three workflows active and executing
- [ ] At least 5 appointments automated successfully
- [ ] At least 10 order inquiries handled automatically
- [ ] Daily analytics reports received in Slack
- [ ] Zero critical errors

### Month 1 Goals

- [ ] 50+ appointments automated
- [ ] 100+ order inquiries handled
- [ ] 30 daily analytics reports collected
- [ ] Measurable reduction in no-show rate
- [ ] Measurable reduction in support tickets
- [ ] Positive customer feedback on automated communications

### Expected Results

**Appointment Automation**:
- 50-70% reduction in no-shows
- 15-20 min saved per appointment
- Professional customer experience

**Order Inquiry Handler**:
- 30-40% reduction in support tickets
- Faster response to delayed orders
- More satisfaction surveys completed

**Chat Analytics**:
- Daily visibility into chatbot performance
- Data-driven content improvements
- Knowledge gaps identified and filled

---

## Rollback Plan

If something goes wrong:

### Quick Disable (2 min)

- [ ] Open n8n workflow
- [ ] Toggle to "Inactive"
- [ ] Workflow stops immediately
- [ ] Chat continues to work (without automation)

### Full Rollback (10 min)

```bash
# Revert Next.js changes
git revert [commit-hash]
git push origin main

# Or remove environment variables
# Remove N8N_APPOINTMENT_WEBHOOK
# Remove N8N_ORDER_INQUIRY_WEBHOOK
# Redeploy

# Disable workflows in n8n
# Set all workflows to "Inactive"
```

---

## Support Resources

### Documentation
- **Appointment Automation**: `APPOINTMENT_AUTOMATION_SETUP.md`
- **Order Inquiry Handler**: `ORDER_INQUIRY_HANDLER_SETUP.md`
- **Chat Analytics**: `CHAT_ANALYTICS_SETUP.md`
- **Analysis Document**: `N8N_VS_GPT_ANALYSIS.md`

### External Resources
- n8n Documentation: https://docs.n8n.io/
- Resend Docs: https://resend.com/docs
- Twilio Docs: https://www.twilio.com/docs
- Google Calendar API: https://developers.google.com/calendar

### Getting Help
1. Check n8n execution logs first
2. Review error messages in each node
3. Test nodes individually
4. Verify all credentials are valid
5. Check external service dashboards (Resend, Twilio, etc.)

---

## Deployment Status

**Pre-Deployment**:
- [ ] Database prepared
- [ ] Environment variables configured
- [ ] n8n access verified

**Workflow 1 - Appointment Automation**:
- [ ] Imported
- [ ] Credentials configured
- [ ] Tested
- [ ] Activated

**Workflow 2 - Order Inquiry Handler**:
- [ ] Imported
- [ ] Credentials configured
- [ ] Tested
- [ ] Activated

**Workflow 3 - Chat Analytics**:
- [ ] Imported
- [ ] Credentials configured
- [ ] Tested
- [ ] Activated

**Next.js Integration**:
- [ ] Code changes committed
- [ ] Deployed to production
- [ ] Environment variables updated
- [ ] End-to-end tested

**Post-Deployment**:
- [ ] All workflows running smoothly
- [ ] Monitoring in place
- [ ] Team trained on reports
- [ ] Success metrics tracking

---

**Status**: Ready for Deployment
**Total Time Estimate**: ~3-4 hours for complete deployment
**Expected Impact**: $4,400-5,850/month value for $2.50/month cost

**Good luck with your deployment! 🚀**

---

**Document Created**: 2025-10-13
**Last Updated**: 2025-10-13
**Version**: 1.0
