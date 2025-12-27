/**
 * GET /api/schedule/slots
 * Query: tenantSlug, purpose, start, end, timeZone
 */
import { calcomFetchJson, getCalcomConfigFromEnv } from "../calcomServerClient";

// TODO: import your server auth + db client utilities
// import { requireSession } from "@/lib/auth";
// import { db } from "@/lib/db";

export async function handleScheduleSlots(req: Request): Promise<Response> {
  // TODO: 1) require NexCyte session
  // const session = await requireSession(req);

  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenantSlug") ?? "";
  const purpose = url.searchParams.get("purpose") ?? "";
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  const timeZone = url.searchParams.get("timeZone") ?? "America/New_York";

  if (!tenantSlug || !purpose || !start || !end) {
    return Response.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // TODO: 2) resolve tenant_id from tenantSlug, confirm user is member of tenant
  // TODO: 3) load Cal.com organization_slug + mapped cal_event_type_id for purpose (and permission check for prospect/customer)
  const calEventTypeId = 0; // TODO

  const cfg = getCalcomConfigFromEnv();

  // Cal.com: Get available time slots for an event type (v2)
  // Uses /v2/slots?eventTypeId=...&start=...&end=...&timeZone=... (see docs)
  const data = await calcomFetchJson<any>(cfg, {
    path: "/v2/slots",
    query: {
      eventTypeId: calEventTypeId,
      start,
      end,
      timeZone,
    },
  });

  return Response.json({ slots: data }, { status: 200 });
}
