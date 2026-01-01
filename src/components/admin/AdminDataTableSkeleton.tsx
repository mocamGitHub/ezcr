'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminDataTableSkeletonProps {
  /** Number of rows to show */
  rows?: number
  /** Number of columns to show */
  columns?: number
  /** Whether to show the search bar skeleton */
  showSearch?: boolean
  /** Whether to show pagination skeleton */
  showPagination?: boolean
  className?: string
}

/**
 * Loading skeleton for AdminDataTable.
 * Matches the structure of the actual table for smooth loading transitions.
 */
export function AdminDataTableSkeleton({
  rows = 5,
  columns = 5,
  showSearch = true,
  showPagination = true,
  className,
}: AdminDataTableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar skeleton */}
      {showSearch && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
      )}

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={`header-${i}`}
                className="h-4"
                style={{ width: `${100 / columns}%` }}
              />
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="border-b last:border-b-0 p-4"
          >
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4"
                  style={{ width: `${100 / columns}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      )}
    </div>
  )
}
