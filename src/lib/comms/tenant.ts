import { headers, cookies } from "next/headers";

export type TenantContext = { tenantId: string };

/**
 * Dev-friendly tenant resolver:
 * - header: x-nc-tenant-id
 * - cookie: nc_tenant_id
 * - env: NC_DEFAULT_TENANT_ID
 *
 * Production: inject x-nc-tenant-id via middleware based on hostname/subdomain.
 */
export async function requireTenant(): Promise<TenantContext> {
  const h = await headers();
  const c = await cookies();

  const fromHeader = h.get("x-nc-tenant-id")?.trim();
  if (fromHeader) return { tenantId: fromHeader };

  const fromCookie = c.get("nc_tenant_id")?.value?.trim();
  if (fromCookie) return { tenantId: fromCookie };

  const fromEnv = process.env.NC_DEFAULT_TENANT_ID?.trim();
  if (fromEnv) return { tenantId: fromEnv };

  throw new Error("Tenant not resolved. Set x-nc-tenant-id header or NC_DEFAULT_TENANT_ID for dev.");
}
