/**
 * Template: Tenant Admin Scheduling Settings page (App Router)
 *
 * Place at something like:
 *   app/t/[tenant]/admin/scheduling/page.tsx
 *
 * Ensure the route is protected by your existing admin auth.
 */

import { SchedulerSettingsClient } from "../SchedulerSettingsClient";

export default function TenantAdminSchedulingPage({ params }: { params: { tenant: string } }) {
  const tenantSlug = params.tenant;
  return <SchedulerSettingsClient tenantSlug={tenantSlug} />;
}
