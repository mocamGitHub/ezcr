'use client'

import { Skeleton } from './skeleton'

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number
  /** Column configuration: width classes and alignment */
  columns?: {
    width?: string
    align?: 'left' | 'center' | 'right'
    /** If true, shows two stacked lines (name + subtitle) */
    multiline?: boolean
  }[]
  /** Whether to show the header row */
  showHeader?: boolean
  /** Optional message to display below skeleton */
  loadingMessage?: string
}

const defaultColumns = [
  { width: 'w-32', align: 'left' as const, multiline: true },
  { width: 'w-20', align: 'left' as const },
  { width: 'w-24', align: 'left' as const },
  { width: 'w-16', align: 'right' as const },
  { width: 'w-20', align: 'right' as const },
]

export function TableSkeleton({
  rows = 10,
  columns = defaultColumns,
  showHeader = true,
  loadingMessage,
}: TableSkeletonProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {showHeader && (
        <div className="h-12 bg-muted/50 border-b flex items-center px-4 gap-4">
          {columns.map((col, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${col.width || 'w-20'} ${
                col.align === 'right' ? 'ml-auto' : ''
              } ${col.align === 'center' ? 'mx-auto' : ''}`}
            />
          ))}
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="h-16 flex items-center px-4 gap-4 bg-card"
          >
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                className={`flex ${
                  col.align === 'right'
                    ? 'justify-end ml-auto'
                    : col.align === 'center'
                    ? 'justify-center mx-auto'
                    : 'justify-start'
                } ${col.multiline ? 'flex-col gap-1' : ''}`}
              >
                <Skeleton className={`h-4 ${col.width || 'w-20'}`} />
                {col.multiline && (
                  <Skeleton className={`h-3 ${col.width || 'w-20'} opacity-60`} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {loadingMessage && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t">
          {loadingMessage}
        </div>
      )}
    </div>
  )
}

/** Pre-configured skeleton for customer tables */
export function CustomerTableSkeleton() {
  return (
    <TableSkeleton
      rows={10}
      columns={[
        { width: 'w-40', multiline: true }, // Customer name + email
        { width: 'w-16' }, // Health score
        { width: 'w-24' }, // Tags
        { width: 'w-12', align: 'right' }, // Orders
        { width: 'w-20', align: 'right' }, // LTV
        { width: 'w-24' }, // Last order
        { width: 'w-10', align: 'center' }, // Tasks
      ]}
    />
  )
}

/** Pre-configured skeleton for inventory tables */
export function InventoryTableSkeleton() {
  return (
    <TableSkeleton
      rows={10}
      columns={[
        { width: 'w-48', multiline: true }, // Product name
        { width: 'w-20' }, // SKU
        { width: 'w-24' }, // Category
        { width: 'w-16', align: 'right' }, // Stock
        { width: 'w-16', align: 'right' }, // Threshold
        { width: 'w-20' }, // Status badge
        { width: 'w-20', align: 'right' }, // Unit price
        { width: 'w-20', align: 'right' }, // Total value
        { width: 'w-24', align: 'right' }, // Actions
      ]}
    />
  )
}

/** Pre-configured skeleton for orders tables */
export function OrdersTableSkeleton() {
  return (
    <TableSkeleton
      rows={10}
      columns={[
        { width: 'w-24' }, // Order ID
        { width: 'w-32', multiline: true }, // Customer
        { width: 'w-20' }, // Status
        { width: 'w-20', align: 'right' }, // Total
        { width: 'w-24' }, // Date
        { width: 'w-16', align: 'right' }, // Actions
      ]}
    />
  )
}

/** Generic list skeleton for simpler lists */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-6 h-6 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 opacity-60" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
