# One-time secrets checklist (to enable “zero interaction” runs)

Set these in Coolify (server-side) OR in your local `.env` for the install run.

## Required

### Cal.com (server-side only)
- CALCOM_API_BASE_URL (default https://api.cal.com)
- CALCOM_API_KEY
- CALCOM_API_VERSION (default 2024-08-13)

### Dispatcher internal auth
- NEXCYTE_INTERNAL_DISPATCH_SECRET (random long secret)

### Supabase (one of the following)
Option A (preferred for automation):
- DATABASE_URL (direct Postgres connection string, service role)
  - Example: `postgresql://postgres:<pwd>@<host>:5432/postgres?sslmode=require`

Option B:
- SUPABASE_DB_URL (alias for DATABASE_URL)

Option C:
- Supabase CLI already configured for this project:
  - `supabase db push` works from repo root

## Recommended (for full notification sending)
### Mailgun
- MAILGUN_API_KEY
- MAILGUN_DOMAIN
- MAILGUN_FROM_EMAIL (fallback)
- MAILGUN_MESSAGE_STREAM (optional)

### Twilio (optional)
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER

## Recommended (for automatic dispatcher scheduling)
### n8n import (self-hosted)
- N8N_API_URL (e.g. https://n8n.nexcyte.com)
- N8N_API_KEY (header auth)
- N8N_API_KEY_HEADER (default: X-N8N-API-KEY)
