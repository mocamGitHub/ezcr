# EZ Cycle Ramp — QuickBooks Online Transaction Sync (on-demand)

This package pulls transactional data from **QuickBooks Online (QBO)** and stores it in Postgres (e.g., Supabase).
It supports:
- **Full backfill** (pagination via QBO Query API)
- **Incremental sync** (CDC — Change Data Capture)
- A single command you can run **on-demand** for dev/staging/prod

> Note: ChatGPT cannot directly log into your QBO tenant. This repo is the runnable connector you execute in your environments.

---

## 1) Prereqs

- Node.js 20+
- A Postgres database (Supabase Postgres is fine)
- An Intuit Developer app (QBO OAuth2 credentials)

---

## 2) Create tables

Run the SQL in `sql/001_qbo_storage.sql` on your target database.

---

## 3) Configure secrets

Copy `.env.example` to `.env` and fill:
- `QBO_CLIENT_ID`
- `QBO_CLIENT_SECRET`
- `QBO_REDIRECT_URI`
- `QBO_REALM_ID`

Then you need an initial consent flow to obtain a refresh token.

---

## 4) One-time consent flow (to get refresh token)

### Option A (recommended): simple local flow (no framework)
1) Build:
   - `npm i`
   - `npm run build`

2) Generate consent URL:
   - `npm run auth:url`

3) Open the printed URL in your browser, sign in, authorize.
4) Intuit redirects to your `QBO_REDIRECT_URI` with a `code` and `realmId` in the URL.
5) Exchange that `code`:
   - `npm run auth:exchange -- --code="PASTE_CODE" --realmId="PASTE_REALMID"`

This prints JSON that includes a `refresh_token`. Put the **latest** refresh token into your `.env`.

**Important:** Each token refresh may return a new refresh token value — always persist the newest one.  

---

## 5) Run sync (on demand)

### Full backfill
- `npm run sync:full`

### Incremental (CDC)
- `npm run sync:cdc`

You can override env vars inline (PowerShell examples):
- `$env:APP_ENV="staging"; npm run sync:cdc`
- `$env:DATABASE_URL="...prod..."; npm run sync:full`

---

## 6) Suggested usage pattern per environment

- **dev/staging**: run `sync:full` whenever you need a clean refresh.
- **prod**: run `sync:full` once, then `sync:cdc` periodically (or on-demand).

---

## 7) What gets stored

- `qbo_entity_raw`: JSON payloads keyed by entity type/id (plus deletion markers)
- `web_transactions` + `web_transaction_lines`: normalized rollups for the most common sales entities

You can add more transforms later (Bills, Purchases, Deposits, etc.) without reworking the raw storage.

---

## 8) Troubleshooting

- If you get 401: access token expired; the script will refresh automatically.
- If you get `invalid_grant`: your refresh token is invalid/expired/disconnected — redo the one-time consent flow.
- If CDC returns too much data, shorten the look-back window (see `src/qbo/sync_cdc.ts`).

