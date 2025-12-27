/**
 * POST /api/schedule/reschedule
 * Body: { tenantSlug, bookingUid, newStart, reason?, timeZone }
 */
import { calcomFetchJson, getCalcomConfigFromEnv } from "../calcomServerClient";

export async function handleScheduleReschedule(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, bookingUid, newStart, reason } = body ?? {};

  if (!tenantSlug || !bookingUid || !newStart) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: require session + authorization (attendee or admin)

  const cfg = getCalcomConfigFromEnv();
  const result = await calcomFetchJson<any>(cfg, {
    method: "POST",
    path: `/v2/bookings/${encodeURIComponent(bookingUid)}/reschedule`,
    body: { start: newStart, reschedulingReason: reason ?? "User requested reschedule" },
  });

  // TODO: update local mirror (status rescheduled + new booking uid if returned)
  return Response.json({ result }, { status: 200 });
}
