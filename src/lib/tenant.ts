/**
 * Tenant Configuration Utility
 *
 * Manages tenant identification across development and production environments.
 * Uses environment variables to determine the correct tenant slug.
 *
 * Usage:
 *   import { getCurrentTenant, getTenantId } from '@/lib/tenant'
 *
 *   const tenant = getCurrentTenant() // Returns 'ezcr-dev' or 'ezcr-01'
 *   const tenantId = await getTenantId() // Returns UUID from database
 */

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Environment configuration
 */
export const TENANT_CONFIG = {
  development: {
    slug: 'ezcr-dev',
    name: 'EZ Cycle Ramp (Development)',
    isProduction: false,
  },
  production: {
    slug: 'ezcr-01',
    name: 'EZ Cycle Ramp',
    isProduction: true,
  },
} as const

/**
 * Get current environment
 */
export function getEnvironment(): 'development' | 'production' {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development'
  return env === 'production' ? 'production' : 'development'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Get current tenant slug based on environment
 *
 * @returns Tenant slug ('ezcr-dev' or 'ezcr-01')
 */
export function getCurrentTenant(): string {
  // Allow override via environment variable
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override

  const env = getEnvironment()
  return TENANT_CONFIG[env].slug
}

/**
 * Get current tenant name
 */
export function getTenantName(): string {
  const env = getEnvironment()
  return TENANT_CONFIG[env].name
}

/**
 * Get tenant ID from database
 *
 * @param slug Optional tenant slug (defaults to current environment tenant)
 * @returns Tenant UUID from database
 * @throws Error if tenant not found
 */
export async function getTenantId(slug?: string): Promise<string> {
  const tenantSlug = slug || getCurrentTenant()
  const supabase = createServiceClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (error || !tenant) {
    throw new Error(`Tenant '${tenantSlug}' not found. Error: ${error?.message || 'Unknown'}`)
  }

  return tenant.id
}

/**
 * Get tenant configuration for current environment
 */
export function getTenantConfig() {
  const env = getEnvironment()
  return {
    ...TENANT_CONFIG[env],
    slug: getCurrentTenant(),
  }
}

/**
 * Type exports
 */
export type Environment = 'development' | 'production'
export type TenantConfig = typeof TENANT_CONFIG[Environment]
