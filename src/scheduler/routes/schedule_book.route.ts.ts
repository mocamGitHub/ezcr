/**
 * POST /api/schedule/book
 * Body: { tenantSlug, purpose, start, timeZone, notes? }
 */
import { calcomFetchJson, getCalcomConfigFromEnv } from "../calcomServerClient";

export async function handleScheduleBook(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { tenantSlug, purpose, start, timeZone, notes } = body ?? {};

  if (!tenantSlug || !purpose || !start || !timeZone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: require session
  // const session = ...
  // attendee comes from logged-in user
  const attendee = {
    name: "TODO_FROM_SESSION",
    email: "TODO_FROM_SESSION",
    timeZone,
    language: "en",
  };

  // TODO: tenant membership + purpose permission
  const calEventTypeId = 0; // TODO

  const cfg = getCalcomConfigFromEnv();
  const booking = await calcomFetchJson<any>(cfg, {
    method: "POST",
    path: "/v2/bookings",
    body: {
      eventTypeId: calEventTypeId,
      start,
      attendee,
      metadata: {
        notes: notes ?? null,
        tenantSlug,
        purpose,
      },
    },
  });

  // TODO: mirror booking into Supabase using service role
  return Response.json({ booking }, { status: 200 });
}
