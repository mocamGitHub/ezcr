# QBO Sync Tool - Runbook

On-demand QuickBooks Online → Postgres/Supabase sync tool for the EZ Cycle Ramp stack.

## Prerequisites

- Node.js 18+ (with npm)
- PostgreSQL access (via DATABASE_URL)
- QuickBooks Online Developer Account with OAuth2 app
- Windows 11 PowerShell (for wrapper scripts)

## Initial Setup

### 1. Install Dependencies

```powershell
cd tools/qbo-sync
npm install
npm run build
```

### 2. Apply Database Schema

The schema is included in main Supabase migrations:

```bash
# From project root
npm run db:push
```

Or apply manually:

```sql
-- Run supabase/migrations/00027_qbo_sync_schema.sql
```

### 3. Configure Environment

Create a `.env.local` file (never commit this file):

```bash
# Copy from template
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# QBO OAuth Credentials (from Intuit Developer Portal)
QBO_CLIENT_ID=your_client_id
QBO_CLIENT_SECRET=your_client_secret
QBO_REDIRECT_URI=http://localhost:3000/callback
QBO_REALM_ID=your_company_realm_id

# Refresh token (obtained via OAuth flow)
QBO_REFRESH_TOKEN=your_refresh_token

# Database connection
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# Tenant ID (use same as main app)
EZCR_TENANT_ID=174bed32-89ff-4920-94d7-4527a3aba352
```

## OAuth Flow (First Time Setup)

### Step 1: Get Authorization URL

```powershell
npm run auth:url
```

This prints a URL. Open it in a browser, log in to QuickBooks, and authorize the app.

### Step 2: Exchange Authorization Code

After authorization, you'll be redirected to your callback URL with a `code` parameter and `realmId`.

```powershell
npm run auth:exchange -- --code=YOUR_AUTH_CODE --realmId=YOUR_REALM_ID
```

This returns tokens including `refresh_token`. Save the refresh token to your `.env.local`.

### Step 3: Store Refresh Token

```bash
# In .env.local
QBO_REFRESH_TOKEN=AB11...your_refresh_token
QBO_REALM_ID=123456789
```

## Running Sync

### Using PowerShell Scripts (Recommended)

```powershell
# Development - Full sync
.\scripts\sync-dev.ps1 full

# Development - Incremental (CDC) sync
.\scripts\sync-dev.ps1 cdc

# Staging
.\scripts\sync-staging.ps1 full

# Production (requires confirmation)
.\scripts\sync-prod.ps1 cdc

# Production (skip confirmation)
.\scripts\sync-prod.ps1 cdc -Force
```

### Using NPM Directly

```powershell
# Full backfill (all historical data)
npm run sync:full

# Incremental sync (changes only)
npm run sync:cdc
```

### CLI Options

```powershell
# Override entities to sync
node dist/index.js sync --mode=full --entities="Invoice,SalesReceipt"

# Override CDC start time
node dist/index.js sync --mode=cdc --since="2024-01-01T00:00:00Z"
```

## Environment-Specific Configuration

### Development
- **Tenant ID**: `174bed32-89ff-4920-94d7-4527a3aba352`
- **Database**: Local or dev Supabase instance
- **File**: `.env.local`

### Staging
- **Tenant ID**: (staging tenant UUID)
- **Database**: Staging Supabase instance
- **File**: `.env.staging`

### Production
- **Tenant ID**: (production tenant UUID)
- **Database**: Production Supabase instance
- **File**: `.env.production`

## Database Tables

| Table | Description |
|-------|-------------|
| `qbo_sync_state` | Sync progress tracking per tenant/realm |
| `qbo_entity_raw` | Raw JSON payloads from QBO API |
| `web_transactions` | Normalized transaction summary |
| `web_transaction_lines` | Line item details |

## Entities Synced

Default entities (configurable via `QBO_SYNC_ENTITY_LIST`):

- `Invoice` - Sales invoices
- `SalesReceipt` - Point-of-sale receipts
- `Payment` - Customer payments
- `RefundReceipt` - Refunds issued
- `CreditMemo` - Credit memos

Optional entities:

- `Bill` - Vendor bills
- `Purchase` - Purchases/expenses
- `Deposit` - Bank deposits
- `JournalEntry` - Manual journal entries
- `Transfer` - Bank transfers

## Troubleshooting

### Token Expired

If you see `401 Unauthorized` errors:

1. The tool automatically refreshes tokens when possible
2. If refresh fails, re-run the OAuth flow (Steps 1-3 above)
3. Update `QBO_REFRESH_TOKEN` in your env file

### Missing Environment Variables

```
ERROR: Missing required env var: QBO_CLIENT_ID
```

Ensure all required variables are set in your environment file.

### Database Connection Failed

```
Error: Connection refused
```

1. Check `DATABASE_URL` is correct
2. Verify network access to database server
3. Check firewall rules if applicable

### No Data Synced

1. Verify `QBO_REALM_ID` is correct
2. Check QBO has data for the entities you're syncing
3. Try running with `--entities=Invoice` to test a single entity

## Secrets Management

**Never commit secrets to git!**

### Local Development
- Use `.env.local` (gitignored)

### CI/CD
- Use GitHub Secrets or environment variables
- Example: `${{ secrets.QBO_CLIENT_SECRET }}`

### Production
- Use Supabase Vault or external secrets manager
- Rotate refresh tokens periodically

## Logs

Sync progress is logged to stdout:

```
[QBO] Full sync start: tenant=xxx realm=yyy entities=Invoice,SalesReceipt
[QBO] Invoice: fetched 50 at start=1
[QBO] SalesReceipt: fetched 12 at start=1
[QBO] Full sync complete.
```

## Legacy Data Import

To import legacy MySQL data (products/measurements):

```powershell
# From tools/qbo-sync directory
psql $DATABASE_URL -f sql/010_import_legacy_mysql_converted.sql
```

This imports:
- ~10 products from legacy catalog
- ~830 customer measurement records
