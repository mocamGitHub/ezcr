These are templates for Next.js App Router route handlers.

Claude Code should:
- Place them under `app/api/admin/scheduling/.../route.ts`
- Wire:
  - requireSession()
  - requireTenantAdmin(tenantId)
  - database access (Supabase server client)
- Return JSON with {error} on failure
