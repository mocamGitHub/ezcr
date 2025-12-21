'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowLeft,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
}

interface Transaction {
  id: string
  transaction_type: string
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason: string
  reference_id: string | null
  created_at: string
  created_by: string | null
  user_profiles: {
    email: string
    first_name: string | null
    last_name: string | null
  } | null
  orders: {
    order_number: string
    customer_email: string
  } | null
}

interface HistoryResponse {
  product: Product
  summary: {
    totalSales: number
    totalRefunds: number
    totalAdjustments: number
    currentStock: number
    lowStockThreshold: number
    isLowStock: boolean
  }
  transactions: Transaction[]
}

export default function ProductInventoryHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.productId as string

  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    if (!data?.transactions || !sortColumn || !sortDirection) return data?.transactions || []

    return [...data.transactions].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortColumn) {
        case 'date':
          aVal = a.created_at
          bVal = b.created_at
          break
        case 'type':
          aVal = a.transaction_type
          bVal = b.transaction_type
          break
        case 'change':
          aVal = a.quantity_change
          bVal = b.quantity_change
          break
        case 'previous':
          aVal = a.previous_quantity
          bVal = b.previous_quantity
          break
        case 'new':
          aVal = a.new_quantity
          bVal = b.new_quantity
          break
        case 'reason':
          aVal = a.reason
          bVal = b.reason
          break
        default:
          return 0
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal || '').localeCompare(String(bVal || ''))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data?.transactions, sortColumn, sortDirection])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/history/${productId}?limit=100`)
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch inventory history')
      }

      setData(responseData)
    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchHistory()
    }
  }, [productId])

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'refund':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'adjustment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'restock':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'damage':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'initial':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading inventory history...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load data'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.product.name}</h1>
            <p className="text-muted-foreground mt-1">SKU: {data.product.sku}</p>
          </div>
        </div>
        <Button onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            Current Stock
          </div>
          <div className={`text-2xl font-bold ${
            data.summary.isLowStock ? 'text-yellow-600' : ''
          }`}>
            {data.summary.currentStock}
          </div>
          {data.summary.isLowStock && (
            <div className="text-xs text-yellow-600 mt-1">Below threshold</div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" />
            Total Sales
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.totalSales}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            Total Refunds
          </div>
          <div className="text-2xl font-bold text-green-600">
            {data.summary.totalRefunds}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            Net Adjustments
          </div>
          <div className={`text-2xl font-bold ${
            data.summary.totalAdjustments > 0 ? 'text-green-600' : data.summary.totalAdjustments < 0 ? 'text-red-600' : ''
          }`}>
            {data.summary.totalAdjustments > 0 ? '+' : ''}
            {data.summary.totalAdjustments}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/50">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">
            Showing last {data.transactions.length} transactions
          </p>
        </div>

        {data.transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found for this product.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortKey="date"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Date & Time
                </SortableTableHead>
                <SortableTableHead
                  sortKey="type"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Type
                </SortableTableHead>
                <SortableTableHead
                  sortKey="change"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="text-right"
                >
                  Change
                </SortableTableHead>
                <SortableTableHead
                  sortKey="previous"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="text-right"
                >
                  Previous
                </SortableTableHead>
                <SortableTableHead
                  sortKey="new"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="text-right"
                >
                  New
                </SortableTableHead>
                <SortableTableHead
                  sortKey="reason"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Reason
                </SortableTableHead>
                <TableHead>Reference</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                      {formatTransactionType(transaction.transaction_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${
                        transaction.quantity_change > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.quantity_change > 0 ? '+' : ''}
                      {transaction.quantity_change}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {transaction.previous_quantity}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.new_quantity}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={transaction.reason}>
                      {transaction.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.reference_id ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.reference_id}
                      </code>
                    ) : transaction.orders?.order_number ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.orders.order_number}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.user_profiles ? (
                      <div className="text-sm">
                        <div className="font-medium">
                          {transaction.user_profiles.first_name || transaction.user_profiles.last_name
                            ? `${transaction.user_profiles.first_name || ''} ${transaction.user_profiles.last_name || ''}`.trim()
                            : transaction.user_profiles.email}
                        </div>
                        {(transaction.user_profiles.first_name || transaction.user_profiles.last_name) && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.user_profiles.email}
                          </div>
                        )}
                      </div>
                    ) : transaction.orders ? (
                      <div className="text-sm text-muted-foreground">
                        System (Order)
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">System</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
