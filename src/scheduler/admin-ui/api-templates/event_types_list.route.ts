/**
 * GET /api/admin/scheduling/event-types?tenantSlug=...
 * Returns mappings for that tenant.
 */

export async function GET(req: Request): Promise<Response> {
  // TODO: require session
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenantSlug") ?? "";
  if (!tenantSlug) return Response.json({ error: "tenantSlug required" }, { status: 400 });

  // TODO: resolve tenantId; require tenant admin/staff
  // TODO: select from nx_scheduler_event_type_map for tenant_id

  return Response.json({ mappings: [] }, { status: 200 });
}
