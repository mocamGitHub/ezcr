'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Get environment from client-side
 */
function getClientEnvironment(): 'development' | 'staging' | 'production' {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development'
  if (env === 'production') return 'production'
  if (env === 'staging') return 'staging'
  return 'development'
}

/**
 * Get tenant slug from client-side
 */
function getClientTenant(): string {
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override

  const env = getClientEnvironment()
  if (env === 'production') return 'ezcr-01'
  if (env === 'staging') return 'ezcr-staging'
  return 'ezcr-dev'
}

/**
 * Environment Banner Component
 *
 * Displays a prominent banner when running in non-production environments
 * to prevent confusion between dev/staging and production data.
 *
 * Usage: Add to root layout
 */
export function EnvironmentBanner() {
  const env = getClientEnvironment()
  const tenant = getClientTenant()

  // Only show in development or staging
  if (env === 'production') return null

  const isStaging = env === 'staging'
  const bgColor = isStaging ? 'bg-blue-500' : 'bg-yellow-500'
  const textColor = isStaging ? 'text-blue-900' : 'text-yellow-900'
  const borderColor = isStaging ? 'border-blue-600' : 'border-yellow-600'
  const modeLabel = isStaging ? 'STAGING MODE' : 'DEVELOPMENT MODE'

  return (
    <div className={`${bgColor} ${textColor} px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 border-b-2 ${borderColor}`}>
      <AlertTriangle className="h-4 w-4" />
      <span>
        <strong>{modeLabel}</strong> | Tenant: {tenant} |
        {isStaging ? 'Pre-production testing environment' : 'Test data only - not connected to production'}
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

  const isStaging = env === 'staging'
  const bgColor = isStaging ? 'bg-blue-100' : 'bg-yellow-100'
  const textColor = isStaging ? 'text-blue-800' : 'text-yellow-800'
  const borderColor = isStaging ? 'border-blue-300' : 'border-yellow-300'
  const label = isStaging ? 'STAGING' : 'DEV'

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${bgColor} ${textColor} text-xs font-medium rounded-full border ${borderColor}`}>
      <AlertTriangle className="h-3 w-3" />
      {label}: {tenant}
    </div>
  )
}
