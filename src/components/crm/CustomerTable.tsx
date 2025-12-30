'use client'

import { useMemo } from 'react'
import type { CustomerProfile } from '@/types/crm'
import { formatCurrency } from '@/lib/utils'
import { HealthScoreBadge } from './HealthScoreBadge'
import { CustomerTagBadges } from './CustomerTagBadges'
import { CustomerTableSkeleton } from '@/components/ui/table-skeleton'
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type SortField = 'name' | 'health_score' | 'order_count' | 'lifetime_value' | 'last_order_date' | 'open_task_count'

interface CustomerTableProps {
  customers: CustomerProfile[]
  loading: boolean
  error?: string | null
  sortBy: SortField
  sortOrder: 'asc' | 'desc'
  onSortChange: (column: SortField) => void
  onCustomerClick: (email: string) => void
  onRetry?: () => void
  showHealthScore?: boolean
}

export function CustomerTable({
  customers,
  loading,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  onCustomerClick,
  onRetry,
  showHealthScore = true,
}: CustomerTableProps) {
  const SortIcon = ({ column }: { column: SortField }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Client-side sorting for columns not supported by server
  const sortedCustomers = useMemo(() => {
    // Server sorts: lifetime_value, last_order_date, order_count
    // Client sorts: name, health_score, open_task_count
    const clientSortFields = ['name', 'health_score', 'open_task_count']

    if (!clientSortFields.includes(sortBy)) {
      return customers // Already sorted by server
    }

    return [...customers].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortBy) {
        case 'name':
          aVal = (a.name || '').toLowerCase()
          bVal = (b.name || '').toLowerCase()
          break
        case 'health_score':
          aVal = a.health_score ?? -1
          bVal = b.health_score ?? -1
          break
        case 'open_task_count':
          aVal = a.open_task_count ?? 0
          bVal = b.open_task_count ?? 0
          break
        default:
          return 0
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      const comparison = String(aVal).localeCompare(String(bVal))
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [customers, sortBy, sortOrder])

  if (error) {
    return (
      <div className="border border-destructive/50 rounded-lg p-12 text-center bg-destructive/5">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium text-lg mb-1 text-destructive">Failed to load customers</h3>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (loading) {
    return <CustomerTableSkeleton />
  }

  if (customers.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No customers found matching your filters.</p>
      </div>
    )
  }

  const headerClass = "px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors select-none"

  const getSortAriaLabel = (column: SortField, label: string) => {
    if (sortBy !== column) {
      return `Sort by ${label}`
    }
    return sortOrder === 'asc' ? `Sort by ${label}, currently ascending` : `Sort by ${label}, currently descending`
  }

  const getAriaSort = (column: SortField): 'ascending' | 'descending' | 'none' => {
    if (sortBy !== column) return 'none'
    return sortOrder === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full min-w-[600px] lg:min-w-0">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th
              className={`text-left ${headerClass}`}
              onClick={() => onSortChange('name')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSortChange('name')}
              aria-label={getSortAriaLabel('name', 'customer name')}
              aria-sort={getAriaSort('name')}
            >
              <div className="flex items-center">
                Customer
                <SortIcon column="name" />
              </div>
            </th>
            {showHealthScore && (
              <th
                className={`text-left ${headerClass} hidden sm:table-cell`}
                onClick={() => onSortChange('health_score')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSortChange('health_score')}
                aria-label={getSortAriaLabel('health_score', 'health score')}
                aria-sort={getAriaSort('health_score')}
              >
                <div className="flex items-center">
                  Health
                  <SortIcon column="health_score" />
                </div>
              </th>
            )}
            <th className="text-left px-4 py-3 font-medium text-sm hidden lg:table-cell">Tags</th>
            <th
              className={`text-right ${headerClass}`}
              onClick={() => onSortChange('order_count')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSortChange('order_count')}
              aria-label={getSortAriaLabel('order_count', 'order count')}
              aria-sort={getAriaSort('order_count')}
            >
              <div className="flex items-center justify-end">
                <span className="hidden sm:inline">Orders</span>
                <span className="sm:hidden">#</span>
                <SortIcon column="order_count" />
              </div>
            </th>
            <th
              className={`text-right ${headerClass} hidden md:table-cell`}
              onClick={() => onSortChange('lifetime_value')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSortChange('lifetime_value')}
              aria-label={getSortAriaLabel('lifetime_value', 'lifetime value')}
              aria-sort={getAriaSort('lifetime_value')}
            >
              <div className="flex items-center justify-end">
                <span className="hidden lg:inline">Lifetime Value</span>
                <span className="lg:hidden">LTV</span>
                <SortIcon column="lifetime_value" />
              </div>
            </th>
            <th
              className={`text-left ${headerClass} hidden lg:table-cell`}
              onClick={() => onSortChange('last_order_date')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSortChange('last_order_date')}
              aria-label={getSortAriaLabel('last_order_date', 'last order date')}
              aria-sort={getAriaSort('last_order_date')}
            >
              <div className="flex items-center">
                Last Order
                <SortIcon column="last_order_date" />
              </div>
            </th>
            <th
              className={`text-center ${headerClass}`}
              onClick={() => onSortChange('open_task_count')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSortChange('open_task_count')}
              aria-label={getSortAriaLabel('open_task_count', 'open tasks')}
              aria-sort={getAriaSort('open_task_count')}
            >
              <div className="flex items-center justify-center">
                <span className="hidden sm:inline">Tasks</span>
                <span className="sm:hidden">T</span>
                <SortIcon column="open_task_count" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCustomers.map((customer) => (
            <tr
              key={customer.customer_email}
              onClick={() => onCustomerClick(customer.customer_email)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCustomerClick(customer.customer_email)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${customer.name || customer.customer_email}`}
              className="border-t hover:bg-muted/30 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <td className="px-4 py-4 sm:py-3">
                <div>
                  <div className="font-medium">{customer.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">{customer.customer_email}</div>
                  {customer.phone && (
                    <div className="text-sm text-muted-foreground hidden sm:block">{customer.phone}</div>
                  )}
                  {/* Show health score inline on mobile */}
                  {showHealthScore && (
                    <div className="sm:hidden mt-1">
                      <HealthScoreBadge score={customer.health_score ?? 0} />
                    </div>
                  )}
                </div>
              </td>
              {showHealthScore && (
                <td className="px-4 py-3 hidden sm:table-cell">
                  <HealthScoreBadge score={customer.health_score ?? 0} />
                </td>
              )}
              <td className="px-4 py-3 hidden lg:table-cell">
                <CustomerTagBadges tags={customer.tags || []} />
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {customer.order_count}
              </td>
              <td className="px-4 py-3 text-right font-medium hidden md:table-cell">
                {formatCurrency(customer.lifetime_value)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                {customer.last_order_date
                  ? new Date(customer.last_order_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </td>
              <td className="px-4 py-3 text-center">
                {(customer.open_task_count ?? 0) > 0 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {customer.open_task_count}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
