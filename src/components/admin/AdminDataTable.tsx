'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AdminDataTableSkeleton } from './AdminDataTableSkeleton'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminErrorState } from './AdminErrorState'

/**
 * Column definition for AdminDataTable
 */
export interface ColumnDef<T> {
  /** Unique key for the column (used for sorting) */
  key: string
  /** Header label */
  header: string
  /** Whether this column is sortable */
  sortable?: boolean
  /** Custom cell renderer */
  cell: (row: T) => React.ReactNode
  /** Optional className for the column */
  className?: string
  /** Header className */
  headerClassName?: string
}

/**
 * Row action definition
 */
export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  /** Icon component */
  icon?: React.ReactNode
  /** Whether this is a destructive action (shows in red) */
  destructive?: boolean
  /** Whether to show a separator before this action */
  separator?: boolean
}

/**
 * Props for AdminDataTable
 * Stable contract - must be consistent across all pages
 */
export interface AdminDataTableProps<T> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]
  /** Field to use as unique key for each row */
  keyField: keyof T

  // Sorting (server-side)
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (column: string) => void

  // Pagination (server-side)
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void

  // Search
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string

  // State
  loading?: boolean
  error?: string | null
  onRetry?: () => void

  // Empty state
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  emptySecondaryAction?: { label: string; onClick: () => void }

  // Row actions (optional)
  rowActions?: (row: T) => RowAction<T>[]

  // Row click handler (optional)
  onRowClick?: (row: T) => void

  // Additional content above table (e.g., filters, bulk actions)
  toolbar?: React.ReactNode

  className?: string
}

/**
 * Reusable admin data table with server-side sorting, pagination, and search.
 * Provides consistent UX across all admin list pages.
 */
export function AdminDataTable<T extends object>({
  data,
  columns,
  keyField,
  sortColumn,
  sortDirection,
  onSortChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No results found',
  emptyDescription,
  emptyAction,
  emptySecondaryAction,
  rowActions,
  onRowClick,
  toolbar,
  className,
}: AdminDataTableProps<T>) {
  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  // Debounced search handler
  useEffect(() => {
    if (!onSearchChange) return

    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, searchValue, onSearchChange])

  const handleSort = useCallback(
    (column: string) => {
      if (onSortChange) {
        onSortChange(column)
      }
    },
    [onSortChange]
  )

  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, totalCount)

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  }

  // Loading state
  if (loading && data.length === 0) {
    return (
      <AdminDataTableSkeleton
        rows={pageSize}
        columns={columns.length}
        showSearch={!!onSearchChange}
        className={className}
      />
    )
  }

  // Error state
  if (error && !loading) {
    return (
      <AdminErrorState
        message="Failed to load data"
        description={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Search bar even when empty */}
        {onSearchChange && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        <AdminEmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          secondaryAction={emptySecondaryAction}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {toolbar}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/70 transition-colors',
                    column.headerClassName
                  )}
                  onClick={
                    column.sortable ? () => handleSort(column.key) : undefined
                  }
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={String(row[keyField])}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  loading && 'opacity-50'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions(row).map((action, index) => (
                          <div key={action.label}>
                            {action.separator && index > 0 && (
                              <DropdownMenuSeparator />
                            )}
                            <DropdownMenuItem
                              onClick={() => action.onClick(row)}
                              className={cn(
                                action.destructive &&
                                  'text-destructive focus:text-destructive'
                              )}
                            >
                              {action.icon && (
                                <span className="mr-2">{action.icon}</span>
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {totalCount} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
