'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Primary action button (rightmost) */
  primaryAction?: React.ReactNode
  /** Secondary actions (left of primary) */
  secondaryActions?: React.ReactNode
  className?: string
}

/**
 * Standard admin page header with title, description, and action buttons.
 * Provides consistent spacing and responsive layout across all admin pages.
 */
export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex items-center gap-2 flex-wrap">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  )
}
