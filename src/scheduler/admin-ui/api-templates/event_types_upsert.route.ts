/**
 * POST /api/admin/scheduling/event-types/upsert
 * Body: { tenantSlug, purpose, cal_event_type_id, allow_kinds, is_enabled }
 */

function isValidPurpose(p: any): boolean {
  return ["intro_call","demo","support"].includes(String(p));
}

function isValidAllowKinds(a: any): boolean {
  if (!Array.isArray(a)) return false;
  return a.every((x) => ["prospect","customer","staff"].includes(String(x)));
}

export async function POST(req: Request): Promise<Response> {
  // TODO: require session
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, purpose, cal_event_type_id, allow_kinds, is_enabled } = body ?? {};

  if (!tenantSlug || !isValidPurpose(purpose)) {
    return Response.json({ error: "Invalid tenantSlug or purpose" }, { status: 400 });
  }
  if (cal_event_type_id !== null && cal_event_type_id !== undefined && Number.isNaN(Number(cal_event_type_id))) {
    return Response.json({ error: "cal_event_type_id must be a number or null" }, { status: 400 });
  }
  if (!isValidAllowKinds(allow_kinds)) {
    return Response.json({ error: "allow_kinds invalid" }, { status: 400 });
  }

  // TODO: resolve tenantId; require tenant admin/staff
  // TODO: upsert into nx_scheduler_event_type_map

  return Response.json({ ok: true }, { status: 200 });
}
