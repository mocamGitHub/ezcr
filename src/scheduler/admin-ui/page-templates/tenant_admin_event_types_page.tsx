/**
 * Template: Tenant Admin Event Types page (App Router)
 *
 * Place at something like:
 *   app/t/[tenant]/admin/scheduling/event-types/page.tsx
 */

import { EventTypeMapClient } from "../EventTypeMapClient";

export default function TenantAdminEventTypesPage({ params }: { params: { tenant: string } }) {
  const tenantSlug = params.tenant;
  return <EventTypeMapClient tenantSlug={tenantSlug} />;
}
