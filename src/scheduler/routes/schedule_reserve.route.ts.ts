/**
 * POST /api/schedule/reserve
 * Body: { tenantSlug, purpose, start, timeZone }
 */
import { calcomFetchJson, getCalcomConfigFromEnv } from "../calcomServerClient";

export async function handleScheduleReserve(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, purpose, start, timeZone } = body ?? {};

  if (!tenantSlug || !purpose || !start || !timeZone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: require session + tenant membership + purpose permission
  const calEventTypeId = 0; // TODO

  const cfg = getCalcomConfigFromEnv();
  const reservation = await calcomFetchJson<any>(cfg, {
    method: "POST",
    path: "/v2/slots/reserve",
    body: {
      eventTypeId: calEventTypeId,
      start,
      timeZone,
    },
  });

  return Response.json({ reservation }, { status: 200 });
}
