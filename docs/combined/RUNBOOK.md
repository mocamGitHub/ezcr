# EZCR Tasks & Dashboards Runbook

## Overview

This document covers the setup, migration, and operational procedures for:
- **Tasks MVP**: Kanban/queue-based task management
- **Dashboard System**: Registry-driven widget framework
- **Finance Integration**: Books-backed KPIs and metrics

## Prerequisites

- Node.js 18+
- Supabase CLI installed and configured
- PostgreSQL access to remote database
- Environment variables configured

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EZCR_TENANT_ID` | Yes | Current tenant UUID (single-tenant deployment) |
| `INTERNAL_WEBHOOK_SECRET` | No | Secret for validating internal webhook calls |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |

## Database Migrations

### Migration Files

1. `supabase/migrations/20260101_001_tasks_mvp.sql` - Tasks system
2. `supabase/migrations/20260101_002_dashboards_system.sql` - Dashboards + Finance RPCs

### Running Migrations

```bash
# Connect to remote database via SSH tunnel
ssh -f -N -L 54322:localhost:5432 user@your-server

# Run migrations
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres" npx supabase db push
```

### Verifying Migrations

```sql
-- Check tasks tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'task_%';

-- Check dashboard tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'nx_%';

-- Check RPCs exist
SELECT proname FROM pg_proc
WHERE proname LIKE 'nx_%' AND pronamespace = 'public'::regnamespace;
```

## Feature Routes

### Tasks

| Route | Description |
|-------|-------------|
| `/admin/tasks` | My Work - tasks assigned to current user |
| `/admin/tasks/queue` | Queue view - sortable task list |
| `/admin/tasks/calendar` | Calendar view |
| `/admin/tasks/boards/[slug]` | Kanban board view |

### Dashboards

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Redirects to default dashboard |
| `/admin/dashboard/executive` | Executive summary dashboard |
| `/admin/dashboard/ops` | Operations dashboard |
| `/admin/dashboard/finance` | Finance dashboard |
| `/admin/dashboard/support` | Support dashboard |

## Webhook Integration

### Endpoint

`POST /api/tasks/webhook`

### Authentication

Include one of:
- Header: `Authorization: Bearer <INTERNAL_WEBHOOK_SECRET>`
- Header: `X-Webhook-Secret: <INTERNAL_WEBHOOK_SECRET>`

### Supported Events

```json
// Order created
{
  "event": "order.created",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-123",
    "customer_email": "customer@example.com"
  }
}

// Booking created
{
  "event": "scheduler.booking_created",
  "data": {
    "booking_id": "uuid",
    "attendee_email": "attendee@example.com",
    "start_at": "2024-01-15T10:00:00Z"
  }
}
```

### Testing Webhook

```bash
curl -X POST http://localhost:3000/api/tasks/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"event":"order.created","data":{"order_id":"test-123","order_number":"TEST-001"}}'
```

## Troubleshooting

### Tasks Not Showing

1. Check workspace/board seeding ran:
   ```sql
   SELECT * FROM task_workspaces WHERE tenant_id = 'your-tenant-id';
   SELECT * FROM task_boards;
   ```

2. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename LIKE 'task_%';
   ```

### Dashboard Widgets Empty

1. Check dashboard seeding:
   ```sql
   SELECT * FROM nx_dashboards WHERE tenant_id = 'your-tenant-id';
   SELECT * FROM nx_widgets;
   ```

2. Test RPC directly:
   ```sql
   SELECT nx_finance_kpis(
     'your-tenant-id'::uuid,
     '2024-01-01'::date,
     '2024-01-31'::date,
     '{}'::jsonb
   );
   ```

### Webhook Returns 404

1. Check workspace exists with slug 'ops'
2. Check board exists with slug 'operations'
3. Check inbox column exists

## Maintenance

### Adding New Widgets

1. Insert into `nx_widgets`:
   ```sql
   INSERT INTO nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, grid_config)
   VALUES (
     'tenant-uuid',
     'dashboard-uuid',
     'my_widget',
     'kpi',
     'My Widget',
     'nx_my_rpc',
     '{"col": 0, "row": 0, "width": 2, "height": 1}'::jsonb
   );
   ```

2. Create corresponding RPC if needed

### Adding New Dashboards

1. Insert into `nx_dashboards`
2. Add widgets for the dashboard

### Backup Considerations

Key tables to backup:
- `task_items` - actual task data
- `task_comments` - task discussions
- `nx_saved_views` - user-saved dashboard views
