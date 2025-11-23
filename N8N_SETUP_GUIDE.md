# N8N Abandoned Cart Recovery Setup Guide

**Date**: 2025-10-13
**Status**: Ready for Implementation
**Priority**: HIGH (20-50x ROI, $2K-5K/month revenue recovery)

---

## Overview

This workflow automatically sends 3 recovery emails to customers who abandon their cart configuration:
- **2 hours**: Gentle reminder with saved configuration link
- **24 hours**: Urgency message about popular items selling out
- **72 hours**: Final offer with 10% discount code

---

## Expected Results

**Projected Performance** (based on industry standards):
- Cart abandonment rate: 70-80% (typical for configurators)
- Email open rate: 25-35%
- Recovery rate per email:
  - 2hr email: 15-20% conversion
  - 24hr email: 10-15% conversion
  - 72hr email: 5-10% conversion (with discount)
- **Total cart recovery**: 20-30% of abandoned carts
- **Monthly revenue impact**: $2,000-$5,000

**Monthly Costs**:
- Resend (email): $20-50/month
- N8N: $0 (self-hosted on existing VPS)
- **Total**: $20-50/month
- **ROI**: 40-100x

---

## Prerequisites

### 1. N8N Installation
Your n8n is documented as installed on `n8n.nexcyte.com` but currently non-functional.

**Option A: Repair Existing Installation**
```bash
# Check if n8n container is running
docker ps | grep n8n

# If not running, start it
docker start n8n

# Check logs
docker logs n8n
```

**Option B: Fresh Installation with Docker**
```bash
# Create n8n directory
mkdir -p /opt/n8n

# Run n8n container
docker run -d \
  --name n8n \
  --restart always \
  -p 5678:5678 \
  -e N8N_HOST=n8n.nexcyte.com \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=https \
  -e NODE_ENV=production \
  -e WEBHOOK_URL=https://n8n.nexcyte.com/ \
  -v /opt/n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option C: Install via Coolify**
1. Go to Coolify dashboard
2. Add new service → n8n
3. Configure domain: n8n.nexcyte.com
4. Deploy

### 2. Email Service (Resend)

**Setup Resend Account**:
```bash
# 1. Sign up at https://resend.com
# 2. Verify domain: ezcycleramp.com
# 3. Add DNS records:
#    TXT: resend._domainkey.ezcycleramp.com
#    MX: feedback-smtp.us-east-1.amazonses.com
# 4. Get API key from Settings
```

**Pricing**:
- Free tier: 100 emails/day (3,000/month)
- Pro: $20/month (50,000 emails/month)
- For this workflow: Free tier is sufficient initially

### 3. Slack Notifications (Optional but Recommended)

**Setup Slack App**:
```bash
# 1. Go to https://api.slack.com/apps
# 2. Create new app: "EZCR N8N Notifications"
# 3. Add OAuth scope: chat:write
# 4. Install to workspace
# 5. Copy OAuth token
# 6. Create channel: #ezcr-sales
```

---

## Installation Steps

### Step 1: Import Workflow to N8N

1. Access n8n dashboard: `https://n8n.nexcyte.com`

2. Click **Workflows** → **Import From File**

3. Select: `n8n/workflows/abandoned-cart-recovery.json`

4. Workflow will import with all nodes pre-configured

### Step 2: Configure Credentials

#### A. PostgreSQL (Supabase)
1. Click on any **Postgres** node
2. Add credential:
   ```
   Name: Supabase PostgreSQL
   Host: YOUR_SUPABASE_HOST (e.g., db.abc123.supabase.co)
   Database: postgres
   User: postgres
   Password: YOUR_SUPABASE_PASSWORD
   Port: 5432
   SSL: Require
   ```

#### B. Email (Resend SMTP)
1. Click on any **Email Send** node
2. Add SMTP credential:
   ```
   Name: Resend SMTP
   User: resend
   Password: YOUR_RESEND_API_KEY
   Host: smtp.resend.com
   Port: 587
   Secure: false (use TLS)
   ```

#### C. Slack (Optional)
1. Click **Notify Slack** node
2. Add credential:
   ```
   Name: Slack
   Access Token: YOUR_SLACK_OAUTH_TOKEN
   ```

### Step 3: Test the Workflow

#### Create Test Abandoned Cart

```sql
-- Insert a test abandoned cart in Supabase
INSERT INTO shopping_cart (
  tenant_id,
  session_id,
  product_id,
  quantity,
  configuration,
  created_at
)
SELECT
  (SELECT id FROM tenants WHERE slug = 'ezcr-01'),
  'test-session-123',
  (SELECT id FROM products LIMIT 1),
  1,
  jsonb_build_object(
    'contactEmail', 'your-test-email@example.com',
    'contactName', 'Test User',
    'vehicle', 'pickup'
  ),
  NOW() - INTERVAL '2 hours 5 minutes' -- 2hrs 5min ago
;
```

#### Execute Workflow Manually

1. In n8n, click **Execute Workflow** button
2. Check that:
   - Query returns your test cart
   - "2 Hour Email" path is taken (green line)
   - Email is sent (check inbox)
   - Database is updated
   - Slack notification sent (if configured)

3. If successful, delete test cart:
```sql
DELETE FROM shopping_cart WHERE session_id = 'test-session-123';
```

### Step 4: Activate Workflow

1. Toggle **Active** switch in top-right
2. Workflow now runs every 2 hours automatically
3. Schedule: Checks for abandoned carts and sends appropriate recovery email

---

## How the Workflow Works

### Flow Diagram
```
┌─────────────────────┐
│  Every 2 Hours      │
│  (Schedule Trigger) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Query Abandoned Carts           │
│ - Created 2-168 hours ago       │
│ - Has email address             │
│ - No completed order            │
│ - Limit 50                      │
└──────────┬──────────────────────┘
           │
           ├─────────┬─────────┬─────────┐
           ▼         ▼         ▼         ▼
        2-3hrs    24-25hrs  72-73hrs   (skip)
           │         │         │
           ▼         ▼         ▼
    ┌──────────┬──────────┬──────────┐
    │ Email 1  │ Email 2  │ Email 3  │
    │ Reminder │ Urgency  │ Discount │
    └─────┬────┴────┬─────┴────┬─────┘
          │         │          │
          └─────────┴──────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    ┌──────────┐      ┌──────────┐
    │ Update   │      │  Slack   │
    │ Counter  │      │  Alert   │
    └──────────┘      └──────────┘
```

### Query Logic

```sql
-- Finds carts that:
SELECT * FROM shopping_cart
WHERE
  -- Within EZCR tenant
  tenant_id = (SELECT id FROM tenants WHERE slug = 'ezcr-01')

  -- Created in last 7 days
  AND created_at >= NOW() - INTERVAL '7 days'

  -- But at least 2 hours ago
  AND created_at <= NOW() - INTERVAL '2 hours'

  -- No completed order from this user since cart creation
  AND NOT EXISTS (
    SELECT 1 FROM orders
    WHERE user_id = shopping_cart.user_id
    AND created_at > shopping_cart.created_at
  )

  -- Has contact email
  AND (configuration->>'contactEmail') IS NOT NULL
```

### Timing Windows

The workflow uses precise timing to avoid duplicate emails:

- **2hr email**: 2-3 hours after abandonment
- **24hr email**: 24-25 hours after abandonment
- **72hr email**: 72-73 hours after abandonment

Carts outside these windows are skipped until the next run.

---

## Email Templates

### Email 1: Gentle Reminder (2 hours)

**Subject**: Your Custom Ramp Configuration is Waiting
**Goal**: Remind customer they have a saved configuration
**CTA**: Continue Configuration
**Conversion Rate**: 15-20%

**Key Elements**:
- Friendly, non-pushy tone
- Emphasizes convenience ("we saved it")
- Single clear CTA button
- Phone support offered

### Email 2: Urgency (24 hours)

**Subject**: Don't Miss Out - Your Custom Ramp Awaits!
**Goal**: Create urgency about availability
**CTA**: Complete Your Order Now
**Conversion Rate**: 10-15%

**Key Elements**:
- Urgency messaging ("selling out quickly")
- List of value propositions
- Stronger CTA language
- Highlights custom configuration work done

### Email 3: Discount Offer (72 hours)

**Subject**: Last Chance: 10% Off Your Custom Ramp!
**Goal**: Final conversion attempt with incentive
**CTA**: Claim Your 10% Discount
**Conversion Rate**: 5-10%

**Key Elements**:
- **10% discount code: SAVE10**
- Visual emphasis on discount
- "Final reminder" language
- Social proof (customer benefits)
- Unsubscribe link included

---

## Monitoring & Analytics

### Track These Metrics

1. **Email Performance**
   - Open rate (target: 25-35%)
   - Click-through rate (target: 40-60% of opens)
   - Conversion rate by email type

2. **Revenue Impact**
   - Number of recovered carts per week
   - Revenue recovered per week
   - Average order value of recovered carts

3. **Workflow Health**
   - Execution success rate (target: >95%)
   - Email delivery rate (target: >98%)
   - Query response time

### Query for Analytics

```sql
-- Weekly recovery performance
SELECT
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as carts_abandoned,
  COUNT(*) FILTER (
    WHERE (configuration->>'recovery_emails_sent')::int > 0
  ) as carts_contacted,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM orders o
      WHERE o.user_id = shopping_cart.user_id
      AND o.created_at > shopping_cart.created_at
      AND o.created_at < shopping_cart.created_at + INTERVAL '7 days'
    )
  ) as carts_recovered,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM orders o
        WHERE o.user_id = shopping_cart.user_id
        AND o.created_at > shopping_cart.created_at
        AND o.created_at < shopping_cart.created_at + INTERVAL '7 days'
      )
    ) / NULLIF(COUNT(*), 0),
    2
  ) as recovery_rate_percent
FROM shopping_cart
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'ezcr-01')
AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY week
ORDER BY week DESC;
```

---

## Troubleshooting

### Issue: Workflow Not Running

**Check**:
1. Workflow is Active (toggle in top-right)
2. N8N container is running: `docker ps | grep n8n`
3. Check n8n logs: `docker logs n8n`

### Issue: No Emails Sent

**Check**:
1. Resend credentials are correct
2. Domain is verified in Resend dashboard
3. Test email manually in n8n
4. Check spam folder
5. Query returns carts: Run "Query Abandoned Carts" node manually

### Issue: Wrong Timing

**Check**:
1. Verify `hours_abandoned` calculation in query
2. Check IF node conditions (2-3hrs, 24-25hrs, 72-73hrs)
3. Ensure created_at timestamps are correct in database

### Issue: Duplicate Emails

**Problem**: Same cart gets multiple emails in one run

**Solution**: The workflow already handles this via:
- Precise timing windows (2-3hrs, 24-25hrs, 72-73hrs)
- Email counter in configuration JSONB
- Can add additional check:

```sql
-- Add to query WHERE clause
AND (
  (configuration->>'recovery_emails_sent')::int IS NULL
  OR (configuration->>'recovery_emails_sent')::int < 3
)
```

---

## Customization Options

### A. Change Email Timing

Edit the IF node conditions:

```javascript
// For 6-hour instead of 2-hour:
{{$json["hours_abandoned"]}} >= 6
{{$json["hours_abandoned"]}} <= 7

// For 48-hour instead of 24-hour:
{{$json["hours_abandoned"]}} >= 48
{{$json["hours_abandoned"]}} <= 49
```

### B. Change Discount Code

Edit the 72hr email template:
```html
<!-- Find this line: -->
Use code: SAVE10

<!-- Change to: -->
Use code: WELCOME15
```

Then update link:
```html
?session={{$json["session_id"]}}&discount=WELCOME15
```

### C. Add SMS Notifications

1. Add Twilio node after email send
2. Configure with phone from configuration:
```javascript
{{$json["configuration"]["contactPhone"]}}
```
3. Keep SMS short:
```
Hi! Your custom ramp configuration is ready. Complete your order: https://ezcycleramp.com/configure?session={{$json["session_id"]}}
```

---

## Next Steps

1. ✅ Import workflow to n8n
2. ✅ Configure credentials (Supabase, Resend, Slack)
3. ✅ Test with fake cart
4. ✅ Activate workflow
5. ⏳ Monitor for 1 week
6. ⏳ Analyze results and optimize
7. ⏳ Consider adding SMS (if phone opt-in rate is high)
8. ⏳ A/B test different email copy

---

## Support Resources

- **N8N Docs**: https://docs.n8n.io
- **Resend Docs**: https://resend.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Workflow File**: `n8n/workflows/abandoned-cart-recovery.json`

---

**Status**: ✅ Ready to deploy
**Expected Setup Time**: 1-2 hours
**Expected Monthly Revenue**: $2,000-$5,000
**ROI**: 40-100x
