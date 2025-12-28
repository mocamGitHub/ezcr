# NexCyte Scheduler Enhancement - Runbook NEXT

**Generated**: 2025-12-27
**Branch**: chore/scheduler-analog-upgrade-20251227
**Purpose**: Step-by-step execution guide for PHASE 2

---

## Quick Reference Commands

### Development
```bash
# Install dependencies
npm install

# Run dev server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Testing
```bash
# Unit tests (Vitest)
npm run test
npm run test:run      # Run once
npm run test:ui       # UI mode

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui   # UI mode
```

### Database
```bash
# Push migrations to remote
npx supabase db push --db-url "$DATABASE_URL"

# Generate migration diff
npx supabase db diff --db-url "$DATABASE_URL"

# Direct psql (with SSH tunnel)
PGPASSWORD=xxx psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/XXXX.sql
```

---

## Environment Setup

### Required Env Vars (Already Configured)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
CALCOM_API_KEY=cal_live_xxx
```

### New Env Vars Needed (PHASE 2)
```
# Optional - for cron job auth
WEBCAL_REFRESH_SECRET=<random-32-chars>

# Optional - rate limiting
SHORTCUTS_API_RATE_LIMIT=100
```

---

## PHASE 2 Execution Sequence

### Step 1: Create Database Migration

Create `supabase/migrations/20251227_001_scheduler_enhancements.sql`:

```sql
-- External calendar subscriptions
CREATE TABLE IF NOT EXISTS nx_external_calendar_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  webcal_url TEXT NOT NULL,
  sync_frequency_minutes INT DEFAULT 60,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- External calendar events
CREATE TABLE IF NOT EXISTS nx_external_calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES nx_external_calendar_subscription(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  external_uid TEXT NOT NULL,
  title TEXT,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  raw_ical TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (subscription_id, external_uid)
);

-- Shortcuts tokens
CREATE TABLE IF NOT EXISTS nx_shortcuts_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS nx_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User calendar preferences (extend user_profiles or standalone)
CREATE TABLE IF NOT EXISTS nx_user_calendar_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view TEXT DEFAULT 'week',
  week_starts_on INT DEFAULT 0,
  time_format TEXT DEFAULT '12h',
  default_timezone TEXT DEFAULT 'America/New_York',
  show_weekends BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_sub_tenant ON nx_external_calendar_subscription(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_event_tenant ON nx_external_calendar_event(tenant_id, start_at);
CREATE INDEX IF NOT EXISTS idx_nx_shortcuts_token_user ON nx_shortcuts_token(user_id);
CREATE INDEX IF NOT EXISTS idx_nx_audit_log_tenant ON nx_audit_log(tenant_id, created_at DESC);

-- RLS
ALTER TABLE nx_external_calendar_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE nx_external_calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE nx_shortcuts_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE nx_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE nx_user_calendar_prefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: External calendar subscription
CREATE POLICY "sub_select_own" ON nx_external_calendar_subscription
FOR SELECT USING (user_id = public.nx_uid() OR public.nx_is_tenant_admin(tenant_id));

CREATE POLICY "sub_insert_own" ON nx_external_calendar_subscription
FOR INSERT WITH CHECK (user_id = public.nx_uid());

CREATE POLICY "sub_update_own" ON nx_external_calendar_subscription
FOR UPDATE USING (user_id = public.nx_uid());

CREATE POLICY "sub_delete_own" ON nx_external_calendar_subscription
FOR DELETE USING (user_id = public.nx_uid());

-- RLS Policies: External calendar events
CREATE POLICY "ext_event_select" ON nx_external_calendar_event
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM nx_external_calendar_subscription s
    WHERE s.id = subscription_id
    AND (s.user_id = public.nx_uid() OR public.nx_is_tenant_admin(s.tenant_id))
  )
);

-- RLS Policies: Shortcuts tokens
CREATE POLICY "token_select_own" ON nx_shortcuts_token
FOR SELECT USING (user_id = public.nx_uid());

CREATE POLICY "token_insert_own" ON nx_shortcuts_token
FOR INSERT WITH CHECK (user_id = public.nx_uid());

CREATE POLICY "token_update_own" ON nx_shortcuts_token
FOR UPDATE USING (user_id = public.nx_uid());

-- RLS Policies: Audit log (admin read only)
CREATE POLICY "audit_select_admin" ON nx_audit_log
FOR SELECT USING (public.nx_is_tenant_admin(tenant_id));

-- RLS Policies: Calendar prefs
CREATE POLICY "prefs_select_own" ON nx_user_calendar_prefs
FOR SELECT USING (user_id = public.nx_uid());

CREATE POLICY "prefs_upsert_own" ON nx_user_calendar_prefs
FOR ALL USING (user_id = public.nx_uid()) WITH CHECK (user_id = public.nx_uid());
```

### Step 2: Apply Migration

```bash
# Via Supabase CLI
npx supabase db push --db-url "$DATABASE_URL"

# Or via psql
PGPASSWORD=xxx psql -h host -U postgres -d postgres -f supabase/migrations/20251227_001_scheduler_enhancements.sql
```

### Step 3: Install Dependencies

```bash
# ICS parsing
npm install ical.js

# Local search (lightweight)
npm install fuse.js

# Input masking (optional)
npm install react-input-mask
```

### Step 4: Implement Features in Order

1. **ICS Parser + Webcal Sync** (foundation for calendar features)
2. **Shortcuts Token Auth + Audit** (security layer)
3. **API Routes** (calendar/*, shortcuts/*)
4. **Search Index + Sync** (requires existing data)
5. **UI Components** (depends on APIs)
6. **Calendar Prefs + UX Polish** (final touches)

### Step 5: Add Tests

```bash
# Run tests after implementation
npm run test:run

# Check coverage
npm run test:coverage
```

### Step 6: Commit Changes

```bash
# Logical commits
git add supabase/migrations/20251227_001_scheduler_enhancements.sql
git commit -m "feat(scheduler): add database tables for enhancements"

git add src/lib/ical/ src/app/api/calendar/
git commit -m "feat(scheduler): add ICS import and webcal subscription"

git add src/lib/shortcuts/ src/app/api/shortcuts/
git commit -m "feat(scheduler): add iOS Shortcuts API with token auth"

git add src/lib/search/ src/components/search/
git commit -m "feat(scheduler): add local-first search"

git add src/components/ui/AmbientNotice.tsx src/components/calendar/
git commit -m "feat(scheduler): add calendar UX improvements"

git add tests/
git commit -m "test(scheduler): add unit and integration tests"
```

---

## How to Run Webcal Refresh Job Locally

### Option A: Direct Script

```bash
# Create script: scripts/webcal-refresh.ts
npx tsx scripts/webcal-refresh.ts
```

### Option B: API Endpoint with Cron

```bash
# Call the cron endpoint
curl -X POST http://localhost:3000/api/cron/webcal-refresh \
  -H "Authorization: Bearer $WEBCAL_REFRESH_SECRET"
```

### Option C: n8n Workflow

1. Import `n8n/workflow_webcal_refresh.json`
2. Configure with API URL + secret
3. Set schedule (every 60 minutes)

---

## Post-Implementation Checklist

- [ ] All migrations applied successfully
- [ ] Dev server runs without errors
- [ ] Unit tests pass
- [ ] API routes respond correctly
- [ ] UI components render properly
- [ ] Search returns relevant results
- [ ] Shortcuts API authenticates tokens
- [ ] Audit log records actions
- [ ] Calendar prefs persist across sessions
- [ ] Webcal sync updates events
- [ ] ICS import parses files correctly

---

## Troubleshooting

### "Migration failed"
```bash
# Check for syntax errors
cat supabase/migrations/20251227_001_scheduler_enhancements.sql | psql -h localhost

# Check existing tables
psql -c "\dt nx_*"
```

### "Token auth not working"
```bash
# Verify token hash
node -e "console.log(require('crypto').createHash('sha256').update('your-token').digest('hex'))"

# Check database
SELECT * FROM nx_shortcuts_token WHERE revoked_at IS NULL;
```

### "Search not indexing"
```bash
# Check browser console for IndexedDB errors
# Clear and rebuild index via dev tools
```

### "Webcal not syncing"
```bash
# Test URL manually
curl -I "webcal://example.com/calendar.ics"

# Check subscription status
SELECT * FROM nx_external_calendar_subscription WHERE is_active = true;
```

---

## Files Summary

### Migrations
- `supabase/migrations/20251227_001_scheduler_enhancements.sql`

### Libraries
- `src/lib/ical/icsParser.ts`
- `src/lib/ical/webcalSync.ts`
- `src/lib/search/searchIndex.ts`
- `src/lib/search/syncService.ts`
- `src/lib/shortcuts/tokenAuth.ts`
- `src/lib/audit/logger.ts`

### API Routes
- `src/app/api/calendar/import/route.ts`
- `src/app/api/calendar/subscriptions/route.ts`
- `src/app/api/cron/webcal-refresh/route.ts`
- `src/app/api/shortcuts/today/route.ts`
- `src/app/api/shortcuts/block-time/route.ts`
- `src/app/api/shortcuts/create-booking-link/route.ts`
- `src/app/api/shortcuts/reschedule/route.ts`
- `src/app/api/shortcuts/tokens/route.ts`
- `src/app/api/search/route.ts`

### Components
- `src/components/search/GlobalSearch.tsx`
- `src/components/search/SearchResults.tsx`
- `src/components/calendar/ICSImportDialog.tsx`
- `src/components/calendar/SubscriptionsManager.tsx`
- `src/components/shortcuts/TokenManager.tsx`
- `src/components/ui/AmbientNotice.tsx`
- `src/components/ui/TimeInput.tsx`
- `src/components/calendar/CalendarPrefsDialog.tsx`

### Pages
- `src/app/(admin)/admin/calendar/subscriptions/page.tsx`
- `src/app/(admin)/admin/shortcuts/page.tsx`

### Tests
- `tests/unit/icsParser.test.ts`
- `tests/unit/tokenAuth.test.ts`
- `tests/unit/searchIndex.test.ts`
- `tests/integration/shortcuts-api.test.ts`
