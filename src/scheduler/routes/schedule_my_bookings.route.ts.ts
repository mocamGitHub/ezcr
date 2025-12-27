/**
 * GET /api/schedule/my-bookings?tenantSlug=...
 * Returns bookings for the logged-in attendee in this tenant.
 */
export async function handleScheduleMyBookings(req: Request): Promise<Response> {
  // TODO: require session
  // TODO: resolve tenant_id and query nx_scheduler_booking for attendee_user_id
  return Response.json({ bookings: [] }, { status: 200 });
}
