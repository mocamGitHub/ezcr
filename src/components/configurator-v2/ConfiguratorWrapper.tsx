'use client'

import { ReactNode } from 'react'
import { PricingProvider, usePricing } from '@/contexts/PricingContext'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CONTACT } from '@/types/configurator-v2'

interface ConfiguratorWrapperProps {
  children: ReactNode
}

function ConfiguratorContent({ children }: { children: ReactNode }) {
  const { loading, error, refetch } = usePricing()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading configurator...</p>
        <p className="text-sm text-muted-foreground mt-2">Fetching current pricing</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Unable to Load Configurator</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                We couldn&apos;t load the current pricing information. This may be due to a
                temporary connection issue.
              </p>
              <p className="text-sm mb-4 opacity-80">Error: {error}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={refetch} variant="outline" size="sm">
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = `tel:${CONTACT.phone.replace(/-/g, '')}`}
                >
                  Call {CONTACT.phone}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * ConfiguratorWrapper - Wraps configurator components with pricing context
 *
 * This component:
 * 1. Provides pricing data from the database via PricingContext
 * 2. Shows loading state while pricing is being fetched
 * 3. Shows error state if pricing fails (no fallback - pricing is required)
 * 4. Only renders children once pricing is successfully loaded
 *
 * Usage:
 * <ConfiguratorWrapper>
 *   <ConfiguratorProvider>
 *     <YourConfiguratorUI />
 *   </ConfiguratorProvider>
 * </ConfiguratorWrapper>
 */
export function ConfiguratorWrapper({ children }: ConfiguratorWrapperProps) {
  return (
    <PricingProvider>
      <ConfiguratorContent>{children}</ConfiguratorContent>
    </PricingProvider>
  )
}
