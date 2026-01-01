'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
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
  /** Header label (string or React node) */
  header: React.ReactNode
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
  onClick?: (row: T) => void
  /** Optional href for link actions */
  href?: string
  /** Icon component */
  icon?: React.ReactNode
  /** Whether this is a destructive action (shows in red) */
  destructive?: boolean
  /** Whether to show a separator before this action */
  separator?: boolean
}

/**
 * Bulk action definition
 */
export interface BulkAction {
  label: string
  onClick?: () => void
  /** Icon component */
  icon?: React.ReactNode
  /** Whether this is a destructive action (shows in red) */
  destructive?: boolean
  /** Button variant */
  variant?: 'default' | 'outline' | 'destructive' | 'ghost'
  /** Whether the action is disabled */
  disabled?: boolean
  /** Custom render for complex actions (like AlertDialog) */
  customRender?: React.ReactNode
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
  emptyIcon?: LucideIcon
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

  // Bulk selection (optional)
  /** Enable row selection checkboxes */
  selectable?: boolean
  /** Currently selected row keys */
  selectedKeys?: Set<string>
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string>) => void
  /** Bulk actions to show when rows are selected */
  bulkActions?: BulkAction[]

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
  emptyIcon,
  emptyTitle = 'No results found',
  emptyDescription,
  emptyAction,
  emptySecondaryAction,
  rowActions,
  onRowClick,
  toolbar,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  bulkActions,
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

  // Selection helpers
  const allSelected = selectable && data.length > 0 && data.every((row) => selectedKeys.has(String(row[keyField])))
  const someSelected = selectable && data.some((row) => selectedKeys.has(String(row[keyField]))) && !allSelected

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return
    if (allSelected) {
      // Deselect all on current page
      const newKeys = new Set(selectedKeys)
      data.forEach((row) => newKeys.delete(String(row[keyField])))
      onSelectionChange(newKeys)
    } else {
      // Select all on current page
      const newKeys = new Set(selectedKeys)
      data.forEach((row) => newKeys.add(String(row[keyField])))
      onSelectionChange(newKeys)
    }
  }, [allSelected, data, keyField, onSelectionChange, selectedKeys])

  const handleSelectRow = useCallback(
    (row: T) => {
      if (!onSelectionChange) return
      const key = String(row[keyField])
      const newKeys = new Set(selectedKeys)
      if (newKeys.has(key)) {
        newKeys.delete(key)
      } else {
        newKeys.add(key)
      }
      onSelectionChange(newKeys)
    },
    [keyField, onSelectionChange, selectedKeys]
  )

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
          icon={emptyIcon}
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

      {/* Bulk action bar */}
      {selectable && selectedKeys.size > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 border rounded-lg">
          <span className="text-sm font-medium">
            {selectedKeys.size} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) =>
              action.customRender ? (
                action.customRender
              ) : (
                <Button
                  key={action.label}
                  variant={action.variant || (action.destructive ? 'destructive' : 'outline')}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              )
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange?.(new Set())}
            className="ml-auto"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        (el as unknown as HTMLInputElement).indeterminate = someSelected
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
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
                  loading && 'opacity-50',
                  selectable && selectedKeys.has(String(row[keyField])) && 'bg-muted/30'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedKeys.has(String(row[keyField]))}
                      onCheckedChange={() => handleSelectRow(row)}
                      aria-label={`Select row`}
                    />
                  </TableCell>
                )}
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
                            {action.href ? (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={action.href}
                                  className={cn(
                                    action.destructive &&
                                      'text-destructive focus:text-destructive'
                                  )}
                                >
                                  {action.icon && (
                                    <span className="mr-2">{action.icon}</span>
                                  )}
                                  {action.label}
                                </Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => action.onClick?.(row)}
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
                            )}
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
