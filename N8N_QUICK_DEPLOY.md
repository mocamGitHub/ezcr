# n8n Workflows - Quick Deployment Guide

**Date**: 2025-10-14
**n8n URL**: https://n8n.nexcyte.com
**Time Required**: 30-40 minutes

---

## Overview

You have 4 workflows ready to deploy:
1. ✅ **Appointment Automation** (15 nodes) - Email, SMS, calendar, Slack
2. ✅ **Order Inquiry Handler** (14 nodes) - Smart order status responses
3. ✅ **Chat Analytics** (12 nodes) - Daily metrics reports
4. ✅ **Abandoned Cart Recovery** (bonus workflow)

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Access to https://n8n.nexcyte.com (login ready)
- [ ] Resend API key (for emails) - https://resend.com
- [ ] Twilio credentials (for SMS) - https://twilio.com
- [ ] Google Calendar OAuth (optional)
- [ ] Slack Webhook URL (optional)
- [ ] ~30 minutes of focused time

---

## Workflow 1: Appointment Automation (Highest Priority)

### Step 1: Import Workflow (2 min)

1. Go to https://n8n.nexcyte.com
2. Click **"Workflows"** in sidebar
3. Click **"Import from File"** button (top right)
4. Select: `C:\Users\morri\Dropbox\Websites\ezcr\n8n\workflows\appointment-automation.json`
5. Click **"Import"**

### Step 2: Configure Credentials (10 min)

#### A. Resend Email (Required)
1. In n8n workflow, click on any **"Resend"** node
2. Click **"Create New Credential"**
3. Name it: `Resend - EZCR Appointments`
4. Paste your Resend API key
5. Click **"Save"**
6. Apply this credential to ALL Resend nodes in the workflow

#### B. Twilio SMS (Highly Recommended)
1. Click on any **"Twilio"** node
2. Click **"Create New Credential"**
3. Name it: `Twilio - EZCR SMS`
4. Enter:
   - Account SID: (from Twilio dashboard)
   - Auth Token: (from Twilio dashboard)
5. Click **"Save"**
6. Apply to ALL Twilio nodes

#### C. Google Calendar (Optional)
1. Click on **"Google Calendar"** node
2. Follow OAuth flow to connect your calendar
3. Grant permissions

#### D. Slack Webhook (Optional)
1. Click on **"Slack"** node
2. Create new credential
3. Paste webhook URL from Slack

### Step 3: Get Webhook URL (2 min)

1. Click on the **"Webhook"** node (first node in workflow)
2. Copy the **Production URL** (e.g., `https://n8n.nexcyte.com/webhook/appointment`)
3. Save this URL - you'll need it later

### Step 4: Activate Workflow (1 min)

1. Click **"Activate"** toggle (top right)
2. Workflow should show **"Active"** with green indicator

✅ **Appointment Automation is now live!**

---

## Workflow 2: Order Inquiry Handler

### Step 1: Import Workflow (2 min)

1. In n8n, click **"Import from File"**
2. Select: `C:\Users\morri\Dropbox\Websites\ezcr\n8n\workflows\order-inquiry-handler.json`
3. Click **"Import"**

### Step 2: Configure Credentials (5 min)

1. **Resend Email**: Select existing `Resend - EZCR Appointments` credential
2. **Slack** (optional): Select existing Slack credential or skip

### Step 3: Get Webhook URL (2 min)

1. Click on **"Webhook"** node
2. Copy the **Production URL** (e.g., `https://n8n.nexcyte.com/webhook/order-inquiry`)
3. Save this URL

### Step 4: Activate Workflow (1 min)

1. Click **"Activate"** toggle
2. Verify green "Active" indicator

✅ **Order Inquiry Handler is now live!**

---

## Workflow 3: Chat Analytics (Daily Reports)

### Step 1: Import Workflow (2 min)

1. In n8n, click **"Import from File"**
2. Select: `C:\Users\morri\Dropbox\Websites\ezcr\n8n\workflows\chat-analytics-daily.json`
3. Click **"Import"**

### Step 2: Configure Credentials (5 min)

1. **Supabase HTTP Request**:
   - Click on **"HTTP Request"** nodes
   - Add header: `apikey: your-supabase-anon-key`
   - Add header: `Authorization: Bearer your-supabase-anon-key`

2. **Email/Slack**: Use existing credentials

### Step 3: Set Schedule (2 min)

1. Click on **"Schedule Trigger"** node
2. Configure schedule (default: Daily at 6:00 AM)
3. Adjust timezone if needed

### Step 4: Activate Workflow (1 min)

1. Click **"Activate"** toggle
2. Verify it's active

✅ **Chat Analytics is now live!**

---

## Workflow 4: Abandoned Cart Recovery (Bonus)

### Step 1: Import Workflow (2 min)

1. In n8n, click **"Import from File"**
2. Select: `C:\Users\morri\Dropbox\Websites\ezcr\n8n\workflows\abandoned-cart-recovery.json`
3. Click **"Import"**

### Step 2: Configure (5 min)

1. Use existing Resend credential
2. Configure schedule (default: Hourly)
3. Activate workflow

✅ **Abandoned Cart Recovery is now live!**

---

## Final Step: Update Your .env.local

Now that you have webhook URLs, add them to your Next.js project:

### Open `.env.local` and add:

```env
# ========================================
# N8N WEBHOOKS (from n8n workflows)
# ========================================
N8N_APPOINTMENT_WEBHOOK=https://n8n.nexcyte.com/webhook/appointment
N8N_ORDER_INQUIRY_WEBHOOK=https://n8n.nexcyte.com/webhook/order-inquiry
```

### Restart your dev server:

```bash
# Kill existing server
# Then restart
npm run dev
```

---

## Testing Your Workflows

### Test 1: Appointment Automation (5 min)

```bash
curl -X POST https://n8n.nexcyte.com/webhook/appointment \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "TEST-001",
    "customer_email": "your-email@example.com",
    "customer_name": "Test Customer",
    "appointment_date": "2025-10-20",
    "appointment_time": "morning",
    "customer_phone": "+1234567890"
  }'
```

**Expected Results**:
- ✅ Immediate confirmation email received
- ✅ Slack notification (if configured)
- ✅ Calendar event created (if configured)
- ✅ Check n8n "Executions" tab for success

### Test 2: Order Inquiry Handler (5 min)

```bash
curl -X POST https://n8n.nexcyte.com/webhook/order-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "TEST-001",
    "customer_email": "your-email@example.com",
    "inquiry_type": "status_check"
  }'
```

**Expected Results**:
- ✅ Status email received
- ✅ Proactive support if order delayed
- ✅ Check n8n executions

### Test 3: Chat Analytics (Manual)

1. In n8n, open **Chat Analytics** workflow
2. Click **"Execute Workflow"** button
3. Check email for analytics report

**Expected Results**:
- ✅ Email with chat metrics
- ✅ Message counts, response times, etc.

---

## Monitoring & Troubleshooting

### Check Workflow Status

1. Go to https://n8n.nexcyte.com
2. Click **"Executions"** in sidebar
3. View recent workflow runs:
   - ✅ Green = Success
   - 🔴 Red = Error (click to see details)

### Common Issues

#### Issue: "Webhook not found"
- **Cause**: Workflow not active
- **Fix**: Activate workflow in n8n

#### Issue: "Credential not found"
- **Cause**: Missing API key
- **Fix**: Add credential to workflow nodes

#### Issue: "Email not sending"
- **Cause**: Invalid Resend API key
- **Fix**: Check API key, verify domain

#### Issue: "SMS not sending"
- **Cause**: Twilio not configured
- **Fix**: Add Twilio credentials or disable SMS nodes

---

## Workflow Performance Metrics

### Expected ROI

| Workflow | Monthly Cost | Monthly Value | ROI |
|----------|--------------|---------------|-----|
| Appointment Automation | $2-3 | $2,000-3,000 | 1,500x |
| Order Inquiry Handler | $1 | $4,000-6,000 | 4,000x |
| Chat Analytics | $0 | Insights | ∞ |
| Abandoned Cart Recovery | $20 | $2,000-5,000 | 100-250x |
| **TOTAL** | **~$25/mo** | **$8,000-14,000** | **320-560x** |

### Expected Volume

- **Appointments**: 50-100/month
- **Order Inquiries**: 200-300/month
- **Chat Sessions**: 500-1,000/month
- **Cart Recovery**: 20-40 conversions/month

---

## Success Checklist

After deployment, verify:

- [ ] All 4 workflows showing "Active" in n8n
- [ ] Webhook URLs added to `.env.local`
- [ ] Dev server restarted
- [ ] Test appointment webhook works
- [ ] Test order inquiry webhook works
- [ ] Chat analytics can be manually executed
- [ ] Abandoned cart workflow scheduled properly
- [ ] No errors in n8n executions tab
- [ ] Confirmation email received from test

---

## Next Steps After Deployment

### Week 1: Monitor & Adjust
1. Check n8n executions daily
2. Adjust email templates if needed
3. Fine-tune SMS timing
4. Monitor customer feedback

### Week 2: Optimize
1. Review chat analytics reports
2. Adjust appointment reminders based on no-show rates
3. Optimize cart recovery email timing
4. Add more Slack notifications if needed

### Month 1: Measure ROI
1. Track appointment no-show rate (expect 30-50% reduction)
2. Track order inquiry resolution time (expect 80% reduction)
3. Track cart recovery conversions (expect 5-15% recovery rate)
4. Calculate time saved (expect 10-15 hrs/week)

---

## Support Resources

### Documentation
- `APPOINTMENT_AUTOMATION_SETUP.md` - Detailed appointment guide
- `ORDER_INQUIRY_HANDLER_SETUP.md` - Detailed order inquiry guide
- `CHAT_ANALYTICS_SETUP.md` - Detailed analytics guide
- `N8N_DEPLOYMENT_CHECKLIST.md` - Master deployment checklist

### Official Docs
- n8n: https://docs.n8n.io/
- Resend: https://resend.com/docs
- Twilio: https://www.twilio.com/docs

### Troubleshooting
1. Check n8n execution logs first
2. Verify all credentials are saved
3. Test webhooks with curl commands
4. Check email spam folder
5. Verify environment variables loaded

---

## Quick Command Reference

```bash
# Restart dev server to load new webhook URLs
npm run dev

# Test appointment webhook
curl -X POST https://n8n.nexcyte.com/webhook/appointment -H "Content-Type: application/json" -d '{"test": true}'

# Test order inquiry webhook
curl -X POST https://n8n.nexcyte.com/webhook/order-inquiry -H "Content-Type: application/json" -d '{"test": true}'

# Check n8n via SSH (if needed)
ssh root@nexcyte.com "docker ps | grep n8n"
```

---

## Deployment Timeline

| Task | Time | Status |
|------|------|--------|
| Import Appointment Automation | 2 min | ⏳ |
| Configure Appointment credentials | 10 min | ⏳ |
| Import Order Inquiry Handler | 2 min | ⏳ |
| Configure Order credentials | 5 min | ⏳ |
| Import Chat Analytics | 2 min | ⏳ |
| Configure Chat credentials | 5 min | ⏳ |
| Import Abandoned Cart | 2 min | ⏳ |
| Configure Cart credentials | 5 min | ⏳ |
| Update .env and restart server | 3 min | ⏳ |
| Test all workflows | 10 min | ⏳ |
| **TOTAL** | **46 min** | |

---

## Status Summary

✅ **Ready to Deploy**:
- All 4 workflow JSON files ready
- Comprehensive documentation available
- Test commands prepared
- Environment configuration ready

⏳ **Pending**:
- Import workflows to n8n
- Configure API credentials
- Update webhook URLs in .env
- Test end-to-end functionality

🎯 **Goal**: All workflows active and tested within 1 hour

---

**Last Updated**: 2025-10-14
**Next Step**: Go to https://n8n.nexcyte.com and start importing workflows!
