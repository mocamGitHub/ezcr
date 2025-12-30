'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface MarketingErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}

export function MarketingErrorBoundary({
  error,
  reset,
  title = 'Something went wrong',
}: MarketingErrorBoundaryProps) {
  useEffect(() => {
    console.error('Marketing page error:', error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an error loading this page. Please try again or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2 bg-[#0B5394] hover:bg-[#0B5394]/90">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
