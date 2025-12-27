/**
 * GET/POST /api/admin/scheduling/settings
 * GET query: tenantSlug
 * POST body: { tenantSlug, organization_slug, is_enabled }
 */

export async function GET(req: Request): Promise<Response> {
  // TODO: require session
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenantSlug") ?? "";
  if (!tenantSlug) return Response.json({ error: "tenantSlug required" }, { status: 400 });

  // TODO: resolve tenantId from tenantSlug
  // TODO: require tenant admin/staff
  // TODO: fetch row from nx_scheduler_settings

  return Response.json({ settings: null }, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  // TODO: require session
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, organization_slug, is_enabled } = body ?? {};
  if (!tenantSlug || !organization_slug) {
    return Response.json({ error: "tenantSlug and organization_slug required" }, { status: 400 });
  }

  // TODO: resolve tenantId; require tenant admin/staff
  // TODO: upsert into nx_scheduler_settings with tenant_id

  return Response.json({ ok: true }, { status: 200 });
}
