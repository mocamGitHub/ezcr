# Claude Code Execution Prompt (MASTER) — NexCyte Scheduler Bundle

You have full access to this repo. Implement the entire scheduling + admin + notifications stack end-to-end with minimal user input.
This bundle is authoritative and intended to avoid copy/paste.

## High-level goal
Provide a **login-required** scheduling experience (prospects + customers) in NexCyte, with:
- Soft multi-tenancy (tenant separation by tenant_id + Cal.com org slug mapping)
- No public booking pages
- Tenant-admin configuration UI
- NexCyte-only notifications (Mailgun/Twilio) via durable outbox + templates

## Apply in this order

### Phase 1 — Core Scheduler
Use pack: `packs/01_core_scheduler/`
- Add env vars (Cal.com API v2)
- Apply scheduler migration
- Implement server Cal.com client
- Implement schedule API routes:
  - /api/schedule/slots
  - /api/schedule/reserve
  - /api/schedule/book
  - /api/schedule/cancel
  - /api/schedule/reschedule
  - /api/schedule/my-bookings
- Add minimal schedule UI route in tenant portal (login required)

### Phase 2 — Scheduler Admin UI
Use pack: `packs/02_scheduler_admin_ui/`
- Add tenant admin pages:
  - /t/[tenant]/admin/scheduling
  - /t/[tenant]/admin/scheduling/event-types
- Add admin API routes or server actions for:
  - reading/upserting nx_scheduler_settings
  - reading/upserting nx_scheduler_event_type_map
- Ensure tenant admin/staff restriction.

### Phase 3 — Notifications Outbox (NexCyte-only)
Use pack: `packs/03_notifications_outbox/`
- Apply outbox migration (nx_notification_outbox + templates + triggers)
- Ensure booking routes mirror nx_scheduler_booking so triggers fire
- Add internal dispatcher endpoint:
  - POST /api/internal/comms/dispatch
- Wire dispatcher execution via:
  - existing n8n scheduler or Coolify cron (preferred: n8n every 1–2 minutes)
- Ensure provider sends use existing NexCyte comms module (Mailgun message streams + per-tenant from email).

### Phase 4 — Notification Templates Admin UI
Use pack: `packs/04_notification_templates_admin_ui/`
- Add tenant admin page:
  - /t/[tenant]/admin/scheduling/notifications
- Add admin routes/actions to manage nx_notification_template for booking_* events
- Update dispatcher to:
  - load tenant template by (tenant_id, event_key, channel)
  - render placeholders
  - send via Mailgun/Twilio

## Required environment variables (consolidated)

Cal.com (server-side only):
- CALCOM_API_BASE_URL=https://api.cal.com
- CALCOM_API_KEY=...
- CALCOM_API_VERSION=2024-08-13

Dispatcher internal auth (server-side only):
- NEXCYTE_INTERNAL_DISPATCH_SECRET=... (random long secret)

Mailgun (server-side only):
- MAILGUN_API_KEY=...
- MAILGUN_DOMAIN=...
- MAILGUN_MESSAGE_STREAM=... (optional)
- (Per-tenant from email should come from tenant branding/config; fallback via MAILGUN_FROM_EMAIL if used)

Twilio (server-side only, if SMS enabled):
- TWILIO_ACCOUNT_SID=...
- TWILIO_AUTH_TOKEN=...
- TWILIO_FROM_NUMBER=...

## Hard requirements
- Customers/prospects MUST be logged in to schedule/cancel/reschedule.
- Tenant separation must be enforced by:
  - tenant resolution (slug/subdomain) + membership checks
  - Supabase RLS on all tenant-scoped tables
- Do not expose Cal.com booking pages to users.

## Outputs required (print at end)
- Files added/changed (with paths)
- SQL migrations applied
- New/updated env vars
- How to test:
  1) Prospect signup -> intro_call booking -> cancel
  2) Customer -> support booking -> reschedule
  3) Verify notifications are sent only via NexCyte
  4) Verify tenant admin pages cannot be accessed by non-admin


## Zero-touch orchestration (optional but recommended)

If you want the most hands-off install:
- Run from repo root:
  - `powershell -ExecutionPolicy Bypass -File .\installer\ZeroTouch_Install.ps1 -MasterBundleZip "<PATH_TO_THIS_ZIP>" -N8nImport:$true`
- Then proceed with the phases below (Claude Code wiring).

Env checklist:
- `installer/ENV_ONE_TIME_CHECKLIST.md`

