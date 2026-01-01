# Implementation Gate Checklist

Track progress through each phase. All gates must pass before moving to the next phase.

## Phase 0: Discovery
- [ ] `docs/combined/SCHEMA_MAP.json` created with table mappings
- [ ] `docs/combined/DISCOVERY_REPORT.md` created with schema analysis

## Phase 1: Tasks MVP
- [ ] Tasks migration created: `supabase/migrations/*_tasks_mvp.sql`
- [ ] Tasks RLS policies compile without errors
- [ ] Route renders: `/admin/tasks` (My Work view)
- [ ] Route renders: `/admin/tasks/queue` (Queue view)
- [ ] Route renders: `/admin/tasks/calendar` (Calendar view)
- [ ] Route renders: `/admin/tasks/boards/operations` (Kanban board)
- [ ] Webhook responds 200 for sample `order.created` payload
- [ ] Webhook responds 200 for sample `scheduler.booking_created` payload
- [ ] Webhook responds 401/403 when secret missing (if INTERNAL_WEBHOOK_SECRET set)

## Phase 2: Dashboards + Finance
- [ ] Dashboards migration created: `supabase/migrations/*_dashboards_system.sql`
- [ ] Dashboards RLS policies compile without errors
- [ ] Finance RPC `nx_finance_kpis` returns required keys:
  - revenue_mtd, revenue_ytd
  - expenses_mtd, expenses_ytd
  - profit_mtd, profit_ytd
  - avg_order_value, order_count
  - assumptions (text array)
- [ ] Route renders: `/admin/dashboard` (Executive dashboard)
- [ ] Route renders: `/admin/dashboard/finance` (Finance dashboard)
- [ ] Widgets load data without errors

## Phase 3: Documentation
- [ ] `docs/combined/RUNBOOK.md` created
- [ ] `docs/combined/TASKS_MVP.md` created
- [ ] `docs/combined/DASHBOARDS_SYSTEM.md` created
- [ ] `docs/combined/FINANCE_DASHBOARD.md` created

## Final
- [ ] All changes committed to `chore/tasks-dashboards` branch
- [ ] No TypeScript/ESLint errors (if configured)
