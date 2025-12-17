# NexCyte Comms Management System — Full Deployment Checklist (2025-12-15)

## 1) Apply DB migrations
- [ ] Apply `supabase/migrations/20251214_0001_comms_phone_numbers.sql`
- [ ] Confirm the core comms tables exist (from prior schema pack):
  - comms_contacts
  - comms_channel_preferences
  - comms_templates, comms_template_versions
  - comms_sequences, comms_sequence_steps
  - comms_conversations, comms_messages, comms_message_events
  - comms_message_attachments
  - comms_tenant_settings, comms_inbound_routes

## 2) Environment variables
Copy `.env.example` to `.env.local` and fill:

### Core
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY

### Dev tenant resolution
- [ ] NC_DEFAULT_TENANT_ID (recommended for local dev unless you inject `x-nc-tenant-id`)

### Internal send endpoint security
- [ ] NC_INTERNAL_API_KEY  
  - n8n/worker calls must include header: `x-nc-internal-key: <NC_INTERNAL_API_KEY>`

### Mailgun
- [ ] MAILGUN_API_KEY
- [ ] MAILGUN_DOMAIN (your sending domain configured in Mailgun)
- [ ] MAILGUN_FROM_EMAIL
- [ ] Optional: MAILGUN_FROM_NAME
- [ ] MAILGUN_WEBHOOK_SIGNING_KEY
- [ ] MAILGUN_VERIFY_WEBHOOK_SIGNATURE=true (recommended)
- [ ] MAILGUN_MAX_TIMESTAMP_SKEW_SECONDS=900 (default 15m)
- [ ] Optional: MAILGUN_INCLUDE_NC_TOKEN=false (recommended off unless you want extra safety)

### Twilio
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_DEFAULT_FROM (fallback if no tenant primary number found)
- [ ] TWILIO_VALIDATE_SIGNATURE=true (recommended)
- [ ] TWILIO_STATUS_CALLBACK_URL=https://<domain>/api/webhooks/twilio/status

## 3) Provider setup

### A) Mailgun domain authentication
- [ ] Add your domain in Mailgun (ex: `mg.ezcycleramp.com`)
- [ ] Add required DNS records from Mailgun (SPF/DKIM; optional DMARC)
- [ ] Verify the domain in Mailgun
- [ ] (Recommended) Enable tracking options you want (opens/clicks) if you plan to use them

### B) Mailgun inbound routing → NexCyte inbound webhook
You have two typical options:

**Option 1: forward() to your webhook (fully parsed)**
- [ ] Create a Mailgun Route expression for inbound email you want to capture (ex: `match_recipient(".*@mg.ezcycleramp.com")`)
- [ ] Add a `forward()` action to:
  - `POST https://<your-domain>/api/webhooks/mailgun/inbound/<secret>`
- [ ] Ensure it uses **Fully parsed** posting (preferred)

**Option 2: store() and notify**
- [ ] Use `store()` action with `notify` URL pointing to the same endpoint above

**Tenant mapping**
- [ ] Insert a row into `comms_inbound_routes`:
  - provider=`mailgun`, channel=`email`, route_secret=`<secret>`, tenant_id=`<tenantId>`

### C) Mailgun events webhooks → NexCyte events webhook
- [ ] In Mailgun → Domain → Webhooks, set each webhook type to:
  - `POST https://<your-domain>/api/webhooks/mailgun/events`
- [ ] Recommended webhook types to enable:
  - accepted (or “delivered/accepted” depending on UI)
  - delivered
  - permanent_fail / temporary_fail (or “failed”)
  - unsubscribed
  - complained
  - opened / clicked (optional; if you enabled tracking)
- [ ] Keep signature validation on in NexCyte (`MAILGUN_VERIFY_WEBHOOK_SIGNATURE=true`)

### D) Twilio inbound + status callbacks
- [ ] Configure Twilio Messaging webhook for your phone number:
  - Inbound: `POST https://<your-domain>/api/webhooks/twilio/inbound`
  - Status callback: `POST https://<your-domain>/api/webhooks/twilio/status`
- [ ] Seed/insert the phone number mapping into `comms_phone_numbers`:
  - tenant_id, phone_number (E.164), provider=`twilio`, is_primary=true

## 4) Seed data (optional)
- [ ] Set:
  - EZCR_TENANT_ID
  - EZCR_TWILIO_NUMBER
  - EZCR_MAILGUN_INBOUND_SECRET
- [ ] Run:
  - `node ./scripts/seed-comms-full.ts`

## 5) Test plan (end-to-end)

### Email outbound
- [ ] Create a template + publish a version
- [ ] Call `POST /api/comms/send` with channel=email
- [ ] Confirm:
  - comms_messages row created (queued → sent)
  - comms_message_events rows inserted (queued + sent)

### Email inbound
- [ ] Send an email reply to your inbound domain/routed address
- [ ] Confirm:
  - contact created/linked
  - conversation exists
  - inbound message inserted + attachments metadata (and storage upload if enabled)

### Mailgun events
- [ ] Trigger delivered/failed/unsubscribed/complained scenarios (as feasible)
- [ ] Confirm:
  - comms_message_events rows inserted with provider=mailgun
  - comms_messages status transitions (sent/delivered/failed)
  - comms_channel_preferences updated on unsubscribed/complained

### SMS inbound + status
- [ ] Send SMS to the tenant Twilio number
- [ ] Confirm:
  - tenant resolved by `To` using comms_phone_numbers
  - inbound message stored and threaded
- [ ] Send SMS outbound and confirm status callbacks:
  - queued → sent/delivered/failed updates comms_messages + events
