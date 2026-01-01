'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AdminErrorStateProps {
  /** Error message to display */
  message: string
  /** Retry callback */
  onRetry?: () => void
  /** Additional description */
  description?: string
  className?: string
}

/**
 * Standard error state component for admin tables/lists.
 * Shows when data fetching fails with retry option.
 */
export function AdminErrorState({
  message,
  onRetry,
  description,
  className,
}: AdminErrorStateProps) {
  return (
    <div
      className={cn(
        'border border-destructive/50 rounded-lg p-12 text-center bg-destructive/5',
        className
      )}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="font-medium text-lg mb-1 text-destructive">
        {message}
      </h3>
      {description && (
        <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}
