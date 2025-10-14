'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Get environment from client-side
 */
function getClientEnvironment(): 'development' | 'production' {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development'
  return env === 'production' ? 'production' : 'development'
}

/**
 * Get tenant slug from client-side
 */
function getClientTenant(): string {
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override

  const env = getClientEnvironment()
  return env === 'production' ? 'ezcr-01' : 'ezcr-dev'
}

/**
 * Environment Banner Component
 *
 * Displays a prominent banner when running in development mode
 * to prevent confusion between dev and production data.
 *
 * Usage: Add to root layout
 */
export function EnvironmentBanner() {
  const env = getClientEnvironment()
  const tenant = getClientTenant()

  // Only show in development
  if (env === 'production') return null

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 border-b-2 border-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <span>
        <strong>DEVELOPMENT MODE</strong> | Tenant: {tenant} |
        Test data only - not connected to production
      </span>
      <AlertTriangle className="h-4 w-4" />
    </div>
  )
}

/**
 * Small environment badge for use in individual pages
 */
export function EnvironmentBadge() {
  const env = getClientEnvironment()
  const tenant = getClientTenant()

  if (env === 'production') return null

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-300">
      <AlertTriangle className="h-3 w-3" />
      DEV: {tenant}
    </div>
  )
}
