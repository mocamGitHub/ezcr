/**
 * Template: Tenant Admin Scheduling Notifications page (App Router)
 *
 * Place at something like:
 *   app/t/[tenant]/admin/scheduling/notifications/page.tsx
 */

import { SchedulerTemplatesClient } from "../SchedulerTemplatesClient";

export default function TenantAdminSchedulingNotificationsPage({ params }: { params: { tenant: string } }) {
  const tenantSlug = params.tenant;
  return <SchedulerTemplatesClient tenantSlug={tenantSlug} />;
}
