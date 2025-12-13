'use client'

import React, { useEffect } from 'react'
import { useConfiguratorSettings } from '@/hooks/useConfiguratorSettings'
import { setConfiguratorSettings } from '@/lib/configurator/db-settings'

/**
 * Provider that loads configurator settings from the database
 * and makes them available to all child components
 */
export function ConfiguratorSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { settings, loading, error } = useConfiguratorSettings()

  useEffect(() => {
    if (settings) {
      // Cache settings for runtime access
      setConfiguratorSettings(settings)
    }
  }, [settings])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[hsl(var(--primary))] border-r-transparent"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">
            Loading configurator...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
        <div className="text-center max-w-md p-6 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--destructive))] mb-2">
            Configuration Error
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md hover:bg-[hsl(var(--primary))]/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
