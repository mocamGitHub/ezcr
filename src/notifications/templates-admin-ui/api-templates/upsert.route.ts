/**
 * POST /api/admin/notifications/templates/upsert
 * Body: { tenantSlug, scope, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled }
 */

function isValidEventKey(k: any): boolean {
  return ["booking_created","booking_cancelled","booking_rescheduled"].includes(String(k));
}

function isValidChannel(c: any): boolean {
  return ["email","sms","in_app"].includes(String(c));
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled } = body ?? {};

  if (!tenantSlug || !isValidEventKey(event_key) || !isValidChannel(channel)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  // TODO: require session
  // TODO: resolve tenantId; require tenant admin/staff
  // TODO: upsert into nx_notification_template (tenant_id, event_key, channel, ...)
  // Ensure email-only fields null for sms

  return Response.json({ ok: true }, { status: 200 });
}
