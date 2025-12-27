These are templates for Next.js App Router route handlers.

Claude Code should:
- Place them under:
  - app/api/admin/notifications/templates/route.ts
  - app/api/admin/notifications/templates/upsert/route.ts
- Wire:
  - requireSession()
  - requireTenantAdmin(tenantId)
  - Supabase server client
- Scope:
  - for now, `scope=scheduler` maps to event keys starting with `booking_`
