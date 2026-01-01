'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LucideIcon, Inbox } from 'lucide-react'

interface AdminEmptyStateProps {
  /** Icon to display (defaults to Inbox) */
  icon?: LucideIcon
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Secondary action (e.g., "Clear filters") */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Standard empty state component for admin tables/lists.
 * Shows when there's no data to display.
 */
export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-12 text-center bg-muted/5',
        className
      )}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-2">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
