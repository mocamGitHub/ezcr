# NexCyte Scheduler Enhancement Pack - Implementation Map

**Generated**: 2025-12-27
**Branch**: chore/scheduler-analog-upgrade-20251227
**Status**: PHASE 1 COMPLETE

---

## 1. Repo Summary

### Frameworks & Runtime
- **Framework**: Next.js 15 (App Router with Turbopack)
- **Runtime**: Node.js
- **Language**: TypeScript
- **Package Manager**: npm (package-lock.json present)
- **UI Framework**: React 19 + Tailwind CSS 4 + Radix UI
- **State Management**: Zustand, React Query
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Supabase Auth
- **Forms**: React Hook Form + Zod validation

### Key Directories
```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # React components (scheduler/, ui/, admin/, etc.)
├── lib/              # Core utilities (supabase/, auth/, tenant.ts, permissions.ts)
├── scheduler/        # Cal.com integration logic
├── notifications/    # Notification dispatcher
├── actions/          # Server actions
├── hooks/            # Custom React hooks
└── types/            # TypeScript types

supabase/
├── migrations/       # SQL migrations (00001-00031 + 20251224_*)
├── seed/             # Seed data
└── functions/        # Edge functions

n8n/                  # n8n workflow definitions
tests/                # Vitest unit + Playwright e2e
```

---

## 2. Scheduler Surface Area

### Current API Routes (`src/app/api/schedule/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/schedule/slots` | GET | Fetch available Cal.com slots |
| `/api/schedule/book` | POST | Create booking |
| `/api/schedule/cancel` | POST | Cancel booking |
| `/api/schedule/reschedule` | POST | Reschedule booking |
| `/api/schedule/my-bookings` | GET | User's bookings |

### Current UI Components (`src/components/scheduler/`)
- `SchedulerBooking.tsx` - Main booking flow (18KB)
- `MyBookings.tsx` - User's booking list (7KB)
- `index.ts` - Exports

### Current Admin UI (`src/scheduler/admin-ui/`)
- `EventTypeMapClient.tsx` - Event type mapping management
- `SchedulerSettingsClient.tsx` - Cal.com org settings

### Admin Page
- `/admin/scheduler` - Test page for scheduler (`src/app/(admin)/admin/scheduler/page.tsx`)

---

## 3. Auth & Identity

### Authentication Flow
1. **Middleware** (`src/middleware.ts`): Protects `/admin/*` routes
2. **Supabase Auth**: `supabase.auth.getUser()` validates session
3. **User Profiles**: `user_profiles` table stores role, tenant_id

### API Auth Helper (`src/lib/auth/api-auth.ts`)
```typescript
interface AuthUser {
  id: string
  email: string
  role: string      // 'customer' | 'viewer' | 'customer_service' | 'admin' | 'owner'
  tenantId: string
}

// Usage in API routes:
const authResult = await requireAuth(request)
if ('error' in authResult) return NextResponse.json(authResult.error, { status: 401 })
const { user } = authResult
```

### Role Hierarchy (`src/lib/permissions.ts`)
```
customer < viewer < customer_service < admin < owner
```

---

## 4. Multi-Tenancy Enforcement

### Tenant Resolution (`src/lib/tenant.ts`)
- Environment-based: `NEXT_PUBLIC_TENANT_SLUG` or derived from `NODE_ENV`
- Slugs: `ezcr-dev`, `ezcr-staging`, `ezcr-01`
- `getTenantId()`: Resolves slug to UUID from `tenants` table

### Database RLS
- All `nx_*` tables have RLS enabled
- Helper functions: `nx_uid()`, `nx_is_tenant_member()`, `nx_is_tenant_admin()`
- Policies enforce `tenant_id` in WHERE clauses

### API Pattern
```typescript
const tenantId = await getTenantId()
const { data } = await supabase
  .from('nx_scheduler_booking')
  .select('*')
  .eq('tenant_id', tenantId)
```

---

## 5. Database Layer

### Migration Location
`supabase/migrations/`

### Existing Scheduler Tables (from `20251224_000001_calcom_scheduler.sql`)
- `nx_user_profile` - Extended user profile
- `nx_scheduler_settings` - Cal.com org config per tenant
- `nx_scheduler_event_type_map` - Purpose -> Cal.com event ID
- `nx_scheduler_booking` - Local booking mirror
- `nx_tenant_membership` - User-tenant relationships

### Notification Tables (from `20251224_000002_scheduler_notifications_outbox.sql`)
- `nx_notification_outbox` - Queue for pending notifications
- `nx_notification_template` - Email/SMS templates

### How to Apply Migrations
```bash
# Using Supabase CLI
npx supabase db push --db-url "$DATABASE_URL"

# Or via psql
PGPASSWORD=xxx psql -h host -U postgres -d postgres -f supabase/migrations/XXXX.sql
```

---

## 6. Jobs / Cron / Workers

### Current Job Runner
- **n8n** (external): Workflow definitions in `n8n/`
- `workflow_dispatcher_every_2m.json` - Notification dispatch (runs every 2min)

### Pattern for Adding Jobs
1. Create n8n workflow JSON in `n8n/`
2. OR add cron endpoint in `/api/cron/*` for Vercel/Coolify cron
3. OR use Supabase pg_cron (if enabled)

### Webcal Refresh Job (To Be Added)
- Will use n8n workflow OR API cron endpoint
- Suggested: `/api/cron/webcal-refresh`

---

## 7. UI Component System

### Component Libraries
- **Radix UI**: Dialog, Popover, Select, etc.
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icons
- **Sonner**: Toast notifications
- **Framer Motion**: Animations

### Reusable UI (`src/components/ui/`)
- Button, Card, Dialog, Input, Label, Select, etc.

### Ambient Notices Pattern (To Be Added)
- Create `AmbientNotice.tsx` in `src/components/ui/`
- Use Sonner for toast-style notices
- Persist dismissed state in localStorage

---

## 8. Search & Caching

### Current Patterns
- **React Query**: Data fetching with caching
- **Zustand**: Client-side state
- **No full-text search** implemented yet

### Local-First Search Approach (To Be Implemented)
- Use browser IndexedDB or localStorage for search index
- Sync incrementally from Supabase
- Libraries: `fuse.js` (lightweight) or `minisearch`

---

## 9. Feature-by-Feature Implementation Plan

### A) Local-First Search (Tenant-Scoped)

**Files to Add:**
- `src/lib/search/searchIndex.ts` - IndexedDB wrapper
- `src/lib/search/syncService.ts` - Incremental sync
- `src/components/search/GlobalSearch.tsx` - Search UI
- `src/components/search/SearchResults.tsx` - Results display
- `src/hooks/useGlobalSearch.ts` - React hook

**Searchable Entities:**
- Bookings (`nx_scheduler_booking`)
- Contacts (`contacts` table if exists, or CRM data)
- Event types (`nx_scheduler_event_type_map`)
- Notification templates (`nx_notification_template`)

**UI Entry Points:**
- Global search box in admin header
- Keyboard shortcut: Cmd/Ctrl + K

**Security:**
- Filter results by `tenant_id` and user permissions
- Never index sensitive fields (tokens, passwords)

---

### B) ICS Import + Webcal Subscription

**Database Objects (new migration):**
```sql
CREATE TABLE nx_external_calendar_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  webcal_url TEXT NOT NULL,
  sync_frequency_minutes INT DEFAULT 60,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nx_external_calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES nx_external_calendar_subscription(id),
  tenant_id UUID NOT NULL,
  external_uid TEXT NOT NULL,
  title TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  raw_ical TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (subscription_id, external_uid)
);
```

**Files to Add:**
- `src/lib/ical/icsParser.ts` - ICS parsing (use `ical.js` npm package)
- `src/lib/ical/webcalSync.ts` - Fetch + diff + upsert
- `src/app/api/calendar/import/route.ts` - ICS file upload
- `src/app/api/calendar/subscriptions/route.ts` - CRUD webcal subscriptions
- `src/app/api/cron/webcal-refresh/route.ts` - Cron job endpoint
- `n8n/workflow_webcal_refresh.json` - n8n workflow (alternative)
- `src/components/calendar/ICSImportDialog.tsx` - Upload UI
- `src/components/calendar/SubscriptionsManager.tsx` - Manage webcal URLs
- `src/app/(admin)/admin/calendar/subscriptions/page.tsx` - Admin page

**Anti-Double-Booking:**
- External events block time slots in availability check
- Modify `/api/schedule/slots` to filter out conflicting times

---

### C) iOS Shortcuts API

**Database Objects:**
```sql
CREATE TABLE nx_shortcuts_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token_hash TEXT NOT NULL UNIQUE,  -- SHA256 hash
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nx_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  actor_type TEXT NOT NULL,  -- 'user', 'shortcut', 'system'
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**API Routes to Add:**
- `src/app/api/shortcuts/today/route.ts` - GET today's bookings
- `src/app/api/shortcuts/block-time/route.ts` - POST create time block
- `src/app/api/shortcuts/create-booking-link/route.ts` - POST generate booking link
- `src/app/api/shortcuts/reschedule/route.ts` - POST reschedule booking
- `src/app/api/shortcuts/tokens/route.ts` - CRUD tokens (admin)

**Auth Pattern:**
```typescript
// Bearer token auth for shortcuts
const token = request.headers.get('Authorization')?.replace('Bearer ', '')
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
const { data: tokenRecord } = await supabase
  .from('nx_shortcuts_token')
  .select('*')
  .eq('token_hash', tokenHash)
  .is('revoked_at', null)
  .single()
```

**Audit Logging:**
- Every action writes to `nx_audit_log`
- Include: actor, action, resource, IP, user-agent

**UI (Admin):**
- `src/components/shortcuts/TokenManager.tsx` - Create/revoke tokens
- `src/app/(admin)/admin/shortcuts/page.tsx` - Admin page

---

### D) Calendar UX Polish

**User Preferences (extend existing profile or new table):**
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS calendar_prefs JSONB DEFAULT '{}';
-- OR new table:
CREATE TABLE nx_user_calendar_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  default_view TEXT DEFAULT 'week',
  week_starts_on INT DEFAULT 0,  -- 0=Sunday
  time_format TEXT DEFAULT '12h',
  default_timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to Add/Modify:**
- `src/hooks/useCalendarPrefs.ts` - Load/save prefs
- `src/components/calendar/CalendarPrefsDialog.tsx` - Settings UI
- Modify `SchedulerBooking.tsx` to use prefs
- `src/components/ui/AmbientNotice.tsx` - Reusable notice component
- `src/components/ui/TimeInput.tsx` - Improved time input with validation

**UX Improvements:**
- Persist scroll position in localStorage
- Add trackpad-friendly scroll (if timeline view exists)
- Better time input masking: `react-input-mask` or custom
- Ambient notices: non-blocking, auto-dismiss

---

### E) AI Calling Provider Stub (Optional)

**Check First:**
- Look for existing Twilio/voice integration
- If not present, create stub only

**Files to Add (stub only):**
- `src/lib/ai-calling/types.ts` - Interface definitions
- `src/lib/ai-calling/providers/index.ts` - Provider registry
- `src/lib/ai-calling/providers/calai.stub.ts` - Cal.ai stub
- `src/lib/ai-calling/providers/twilio-voice.stub.ts` - Twilio stub
- `src/config/ai-calling.ts` - Config/toggle

**Admin Toggle:**
- Add toggle in scheduler settings
- No actual API calls made

---

## 10. License / Compliance Notes

### Cal.com / AGPL
- Cal.com is AGPL-licensed
- Current integration uses Cal.com **API** (SaaS), not self-hosted code
- API usage is typically allowed under SaaS terms
- If importing Cal.com source code: must open-source modifications

### Recommendation
- Continue using Cal.com API (no AGPL concerns)
- If self-hosting Cal.com in future: review AGPL requirements
- Document in `documents/LICENSE_COMPLIANCE.md` if needed

---

## 11. Risks & Unknowns

| Risk | Mitigation |
|------|------------|
| IndexedDB quota limits | Sync only recent data (30 days), purge old |
| Webcal URL auth | Support basic auth in URL, document limitations |
| Token security | Use SHA256 hash, never log tokens, rate limit |
| RLS performance | Add indexes on tenant_id, use EXPLAIN ANALYZE |
| ICS parsing edge cases | Use battle-tested ical.js, add fallbacks |

### Safe Defaults
- Search: In-memory Fuse.js first, IndexedDB optional
- Webcal: 60-minute refresh minimum
- Tokens: 32-byte random, scoped permissions
- Audit: Log all, paginate queries

---

## 12. Next Execution Checklist (PHASE 2)

1. [ ] Create database migration for new tables
2. [ ] Implement ICS parser + webcal sync service
3. [ ] Create API routes: calendar/import, calendar/subscriptions, shortcuts/*
4. [ ] Implement shortcuts token auth + audit logging
5. [ ] Add search index + sync service
6. [ ] Create UI components: GlobalSearch, ICSImportDialog, TokenManager
7. [ ] Add calendar preferences persistence
8. [ ] Create AmbientNotice component
9. [ ] Improve time input validation
10. [ ] Add n8n workflow for webcal refresh OR cron endpoint
11. [ ] Add unit tests: ICS parsing, token auth, search
12. [ ] Add API tests: shortcuts endpoints, calendar endpoints
13. [ ] Create AI calling provider stubs (if applicable)
14. [ ] Update admin navigation with new pages
15. [ ] Commit in logical chunks
16. [ ] Document env vars needed

---

## Appendix: Env Vars (Names Only)

### Existing
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `CALCOM_API_KEY`
- `CALCOM_API_BASE_URL`
- `CALCOM_API_VERSION`
- `NEXCYTE_INTERNAL_DISPATCH_SECRET`

### New (To Be Added)
- `SHORTCUTS_API_RATE_LIMIT` (optional, default 100/hour)
- `WEBCAL_REFRESH_SECRET` (for cron endpoint auth)
