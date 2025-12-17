# NexCyte Comms Management System — Full Pack (2025-12-15)

This ZIP is an overwrite-safe **drop-in** module pack for a Next.js App Router + Supabase stack.

It includes:
- Email (**Mailgun-first**): outbound send + inbound route webhook + events webhook (signature-verified)
- SMS (Twilio): outbound send + inbound webhook + status callback webhook
- Multi-tenant isolation (tenant_id everywhere)
- Template CRUD with immutable version history (publish/rollback via templates.active_version_id)
- Sequences CRUD with step builder (steps persist)
- Unified Inbox (threads + reply composer using canned template versions)
- Seed + checklists + env template

## How to apply
1. Unzip into your repo root.
2. Ensure `@/components/ui/*` (ShadCN) exists (Button/Card/Input/Tabs/Select/Textarea/etc.).
3. Apply migrations.
4. Set env vars (`.env.local`).
5. Run the seed script (optional) or insert your tenant mappings.

## Security model
- All public webhooks use **Supabase service role**.
- `/api/comms/send` is protected by `NC_INTERNAL_API_KEY` and intended for n8n/worker calls.

## Notes
- Mailgun custom variables are kept **minimal and non-sensitive**:
  - `v:nc_message_id` only (plus optional `v:nc_token` if enabled)
  - Variables are visible in delivered email headers (Mailgun) and have a truncation limit for webhook/event payloads. citeturn0search5
- Webhook signature validation:
  - Mailgun: enabled by default (timestamp+token signed with HMAC-SHA256). citeturn1search10turn1search2
  - Twilio: supported (recommended on).
- Inbound email attachments:
  - Metadata stored in `comms_message_attachments`.
  - Optional upload to Supabase Storage bucket `comms-attachments` (if present).
