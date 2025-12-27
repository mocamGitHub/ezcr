/**
 * GET /api/admin/notifications/templates?tenantSlug=...&scope=scheduler
 */

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenantSlug") ?? "";
  const scope = url.searchParams.get("scope") ?? "scheduler";
  if (!tenantSlug) return Response.json({ error: "tenantSlug required" }, { status: 400 });

  // TODO: require session
  // TODO: resolve tenantId; require tenant admin/staff
  // TODO: select from nx_notification_template where tenant_id and event_key in booking_* and channel in ('email','sms')

  return Response.json({ templates: [] }, { status: 200 });
}
