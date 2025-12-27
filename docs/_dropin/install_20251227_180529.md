# NexCyte Scheduler MasterBundle Install Record

## Summary
- **Timestamp**: 2025-12-27 18:05:29
- **Status**: SUCCESS
- **Branch**: `chore/scheduler-dropin-20251227_180529`
- **ZIP**: `documents/NexCyte_Scheduler_MasterBundle_2025-12-24_WITH_INSTALLER_AND_ZEROTOUCH.zip`

## What Was Installed

### Migrations (apply these to database)
- `supabase/migrations/20251224_000001_calcom_scheduler.sql` - Core scheduler tables
- `supabase/migrations/20251224_000002_scheduler_notifications_outbox.sql` - Notification outbox tables

### Source Code
- `src/scheduler/` - Cal.com API client, routes, UI components, admin UI
- `src/notifications/` - Dispatcher, providers (Mailgun/Twilio), templates admin UI
- `supabase/functions/nx_outbox_dequeue.sql` - Outbox dequeue function
- `supabase/seed/scheduler_notification_templates.sql` - Default notification templates

### Configuration & Docs
- `claude/CLAUDE_EXECUTION_PROMPT_MASTER.md` - Implementation guide for route wiring
- `claude/CLAUDE_ZERO_TOUCH_PROMPT.md` - Zero-touch automation prompt
- `installer/` - PowerShell install scripts (fixed stray backslashes)
- `sql/zerotouch_seed_safe.sql`, `sql/zerotouch_smoke_tests.sql` - DB seeds and tests
- `n8n/workflow_dispatcher_every_2m.json` - n8n dispatcher workflow

## Files Added (Key)
```
src/scheduler/
├── admin-ui/
│   ├── EventTypeMapClient.tsx
│   ├── SchedulerSettingsClient.tsx
│   ├── api-templates/
│   └── page-templates/
├── calcomServerClient.ts
├── routes/
│   ├── schedule_book.route.ts.ts
│   ├── schedule_cancel.route.ts.ts
│   ├── schedule_my_bookings.route.ts.ts
│   ├── schedule_reschedule.route.ts.ts
│   ├── schedule_reserve.route.ts.ts
│   └── schedule_slots.route.ts.ts
├── types.ts
└── ui/SchedulePage.tsx

src/notifications/
├── dispatcher/
│   ├── dispatchOne.ts
│   ├── providers/mailgun.ts
│   ├── providers/twilio.ts
│   ├── render.ts
│   ├── route-templates/internal_dispatch.route.ts
│   └── types.ts
└── templates-admin-ui/
    ├── api-templates/
    └── page-templates/
```

## Next Steps

### 1. Apply Database Migrations
```bash
# Via SSH tunnel to production
ssh -f -N -L 54322:10.0.3.5:5432 root@5.161.84.153
PGPASSWORD=<password> psql -h localhost -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20251224_000001_calcom_scheduler.sql
PGPASSWORD=<password> psql -h localhost -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20251224_000002_scheduler_notifications_outbox.sql
```

### 2. Set Environment Variables
Add to `.env.local` / production:
```
CALCOM_API_BASE_URL=https://api.cal.com
CALCOM_API_KEY=<your-cal-api-key>
CALCOM_API_VERSION=2024-08-13
NEXCYTE_INTERNAL_DISPATCH_SECRET=<random-long-secret>
```

### 3. Wire Routes (see claude/CLAUDE_EXECUTION_PROMPT_MASTER.md)
The scheduler files are templates. Claude Code should:
1. Create API routes in `src/app/api/schedule/`
2. Create tenant admin pages in `src/app/(tenant)/[tenant]/admin/scheduling/`
3. Wire auth/tenant resolution per existing patterns

### 4. Seed Templates (optional)
```bash
psql ... -f supabase/seed/scheduler_notification_templates.sql
```

## Logs
- Dry-run: `docs/_dropin/logs/installer_dryrun_20251227_180529.log`
- Real install: `docs/_dropin/logs/installer_real_20251227_180529.log`
- Bundle install logs: `.nexcyte/_bundle_install_logs/20251227_181145/`

## Notes
- Fixed stray `\` at line 1 in all PowerShell scripts (bundle packaging artifact)
- Migrations NOT applied (no DATABASE_URL set) - apply manually per above
- n8n workflow import skipped (no N8N_API_URL/KEY) - import manually if using n8n
