'use client'

import { useMemo } from 'react'
import type { CustomerProfile } from '@/types/crm'
import { formatCurrency } from '@/lib/utils'
import { HealthScoreBadge } from './HealthScoreBadge'
import { CustomerTagBadges } from './CustomerTagBadges'
import { CustomerTableSkeleton } from '@/components/ui/table-skeleton'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export type SortField = 'name' | 'health_score' | 'order_count' | 'lifetime_value' | 'last_order_date' | 'open_task_count'

interface CustomerTableProps {
  customers: CustomerProfile[]
  loading: boolean
  sortBy: SortField
  sortOrder: 'asc' | 'desc'
  onSortChange: (column: SortField) => void
  onCustomerClick: (email: string) => void
  showHealthScore?: boolean
}

export function CustomerTable({
  customers,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  onCustomerClick,
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

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th
              className={`text-left ${headerClass}`}
              onClick={() => onSortChange('name')}
            >
              <div className="flex items-center">
                Customer
                <SortIcon column="name" />
              </div>
            </th>
            {showHealthScore && (
              <th
                className={`text-left ${headerClass}`}
                onClick={() => onSortChange('health_score')}
              >
                <div className="flex items-center">
                  Health
                  <SortIcon column="health_score" />
                </div>
              </th>
            )}
            <th className="text-left px-4 py-3 font-medium text-sm">Tags</th>
            <th
              className={`text-right ${headerClass}`}
              onClick={() => onSortChange('order_count')}
            >
              <div className="flex items-center justify-end">
                Orders
                <SortIcon column="order_count" />
              </div>
            </th>
            <th
              className={`text-right ${headerClass}`}
              onClick={() => onSortChange('lifetime_value')}
            >
              <div className="flex items-center justify-end">
                Lifetime Value
                <SortIcon column="lifetime_value" />
              </div>
            </th>
            <th
              className={`text-left ${headerClass}`}
              onClick={() => onSortChange('last_order_date')}
            >
              <div className="flex items-center">
                Last Order
                <SortIcon column="last_order_date" />
              </div>
            </th>
            <th
              className={`text-center ${headerClass}`}
              onClick={() => onSortChange('open_task_count')}
            >
              <div className="flex items-center justify-center">
                Tasks
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
              className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{customer.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{customer.customer_email}</div>
                  {customer.phone && (
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  )}
                </div>
              </td>
              {showHealthScore && (
                <td className="px-4 py-3">
                  <HealthScoreBadge score={customer.health_score ?? 0} />
                </td>
              )}
              <td className="px-4 py-3">
                <CustomerTagBadges tags={customer.tags || []} />
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {customer.order_count}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(customer.lifetime_value)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
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
