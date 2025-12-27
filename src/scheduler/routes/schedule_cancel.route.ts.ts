/**
 * POST /api/schedule/cancel
 * Body: { tenantSlug, bookingUid, reason? }
 */
import { calcomFetchJson, getCalcomConfigFromEnv } from "../calcomServerClient";

export async function handleScheduleCancel(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, bookingUid, reason } = body ?? {};

  if (!tenantSlug || !bookingUid) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: require session + ensure booking belongs to tenant and user is attendee or tenant admin/staff

  const cfg = getCalcomConfigFromEnv();
  const result = await calcomFetchJson<any>(cfg, {
    method: "POST",
    path: `/v2/bookings/${encodeURIComponent(bookingUid)}/cancel`,
    body: { cancellationReason: reason ?? "User requested cancellation" },
  });

  // TODO: update local mirror status
  return Response.json({ result }, { status: 200 });
}
