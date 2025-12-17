# EZCR Infrastructure Reference

**Last Updated**: 2025-12-16
**Purpose**: Single source of truth for all infrastructure endpoints and credentials locations.

---

## Quick Reference

| Service | URL/Endpoint | Notes |
|---------|--------------|-------|
| **Supabase Studio** | https://supabase.nexcyte.com | Self-hosted, managed by Coolify |
| **PostgreSQL** | 5.161.84.153:5432 | Direct database access |
| **n8n Workflows** | https://n8n.nexcyte.com | Automation platform |
| **Production Site** | https://ezcycleramp.com | Live site |
| **Staging Site** | https://staging.ezcycleramp.com | Pre-production testing |

---

## Database Connection

### Self-Hosted Supabase (NOT cloud Supabase)

This project uses a **self-hosted Supabase instance**, not the cloud-hosted supabase.co service.

```
Host:     5.161.84.153
Port:     5432
Database: postgres
User:     postgres
Password: (see .env.local DATABASE_URL)
```

### Connection String Format

```
postgresql://postgres:<PASSWORD>@5.161.84.153:5432/postgres
```

### Where to Find Credentials

| Credential | Location |
|------------|----------|
| DATABASE_URL | `.env.local` line ~82 |
| SUPABASE_ANON_KEY | `.env.local` line ~24 |
| SUPABASE_SERVICE_KEY | `.env.local` line ~25 |

### Connecting via psql

```powershell
# Direct connection (if port 5432 is open)
psql "postgresql://postgres:<password>@5.161.84.153:5432/postgres"

# Via SSH tunnel (if direct access blocked)
ssh -L 15432:localhost:5432 root@5.161.84.153
# Then in another terminal:
psql "postgresql://postgres:<password>@localhost:15432/postgres"
```

### Connecting via Supabase Studio

1. Open https://supabase.nexcyte.com
2. Navigate to SQL Editor or Table Editor
3. All tables visible in the `public` schema

---

## Server Infrastructure

### VPS Details

| Property | Value |
|----------|-------|
| IP Address | 5.161.84.153 |
| Provider | Hetzner (managed via Coolify) |
| OS | Ubuntu/Debian |
| SSH Access | `ssh root@5.161.84.153` or `ssh root@supabase.nexcyte.com` |

### Services Running (Docker)

| Container | Purpose | Port |
|-----------|---------|------|
| supabase-db | PostgreSQL 15 | 5432 |
| supabase-auth | Auth service | - |
| supabase-rest | PostgREST API | 3000 (internal) |
| supabase-studio | Dashboard UI | 443 (via proxy) |

---

## Tenant Configuration

| Environment | Tenant Slug | Usage |
|-------------|-------------|-------|
| Production | `ezcr-01` | Live site |
| Development | `ezcr-dev` | Local development |
| Staging | `ezcr-staging` | Pre-production |

Set via `NEXT_PUBLIC_TENANT_SLUG` in `.env.local`.

---

## External Services

### Email: Mailgun

| Setting | Value |
|---------|-------|
| Domain | mg.ezcycleramp.com |
| Dashboard | https://app.mailgun.com |
| Credentials | `.env.local` (MAILGUN_*) |

### SMS: Twilio

| Setting | Value |
|---------|-------|
| Phone | +18665256001 |
| Dashboard | https://console.twilio.com |
| Credentials | `.env.local` (TWILIO_*) |

### Payments: Stripe

| Setting | Value |
|---------|-------|
| Dashboard | https://dashboard.stripe.com |
| Mode | Test (pk_test_*, sk_test_*) |
| Credentials | `.env.local` (STRIPE_*) |

### Shipping: T-Force Freight

| Setting | Value |
|---------|-------|
| API | Microsoft OAuth + T-Force API |
| Credentials | `.env.local` (TFORCE_*) |

---

## Running Migrations

### For Self-Hosted Supabase

The standard `npx supabase db push` does NOT work with self-hosted instances. Use direct psql:

```powershell
# Apply a migration directly
psql "$env:DATABASE_URL" -f .\supabase\migrations\00025_comms_core_schema.sql

# Or load DATABASE_URL from .env.local first
$envContent = Get-Content .env.local
foreach ($line in $envContent) {
    if ($line -match '^DATABASE_URL=(.+)$') {
        $env:DATABASE_URL = $matches[1]
    }
}
psql "$env:DATABASE_URL" -f .\supabase\migrations\00025_comms_core_schema.sql
```

### Verify Tables

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count rows in key tables
SELECT 'tenants' as tbl, COUNT(*) FROM tenants
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders;
```

---

## Troubleshooting

### "Cannot connect to database"

1. **Check DATABASE_URL in .env.local** - ensure password is correct
2. **Test direct connection**: `psql "$env:DATABASE_URL" -c "SELECT 1"`
3. **Check firewall**: Port 5432 must be open on 5.161.84.153
4. **Use SSH tunnel** if direct access is blocked

### "Supabase CLI commands fail"

The Supabase CLI (`npx supabase`) is designed for cloud-hosted or local instances. For self-hosted:
- Use direct `psql` commands instead
- Or use Supabase Studio SQL Editor at https://supabase.nexcyte.com

### "Which database am I connected to?"

```sql
-- Check current database
SELECT current_database(), inet_server_addr(), inet_server_port();
```

---

## File Reference

| File | Purpose |
|------|---------|
| `.env.local` | All credentials (git-ignored) |
| `.env.example` | Template for new developers |
| `supabase/config.toml` | Local Supabase config (not used for self-hosted) |
| `supabase/migrations/` | Database schema migrations |
| `INFRASTRUCTURE.md` | This file |

---

## Change Log

| Date | Change |
|------|--------|
| 2025-12-16 | Created initial infrastructure documentation |
