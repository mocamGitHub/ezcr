'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  RefreshCw,
  Search,
  Eye,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  getInvoices,
  getInvoiceWithLines,
  getInvoiceStats,
} from './actions'
import type {
  QboInvoice,
  QboInvoiceWithLines,
  QboInvoiceStats,
} from '@/types/qbo'

function formatPrice(amount: number | null): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'Sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'Viewed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'Overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

export default function QboInvoicesPage() {
  const [invoices, setInvoices] = useState<QboInvoice[]>([])
  const [stats, setStats] = useState<QboInvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<QboInvoiceWithLines | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invoiceData, statsData] = await Promise.all([
        getInvoices({
          status: statusFilter === 'all' ? undefined : statusFilter as 'Paid' | 'Sent' | 'Viewed' | 'Overdue' | 'Outstanding',
        }),
        getInvoiceStats(),
      ])
      setInvoices(invoiceData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices
    const query = searchQuery.toLowerCase()
    return invoices.filter(
      (inv) =>
        inv.doc_number?.toLowerCase().includes(query) ||
        inv.customer_name?.toLowerCase().includes(query)
    )
  }, [invoices, searchQuery])

  // Sorted invoices
  const sortedInvoices = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredInvoices

    return [...filteredInvoices].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortColumn) {
        case 'doc_number':
          aVal = a.doc_number
          bVal = b.doc_number
          break
        case 'date':
          aVal = a.txn_date
          bVal = b.txn_date
          break
        case 'customer':
          aVal = a.customer_name
          bVal = b.customer_name
          break
        case 'total':
          aVal = a.total_amount
          bVal = b.total_amount
          break
        case 'status':
          aVal = a.status
          bVal = b.status
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
  }, [filteredInvoices, sortColumn, sortDirection])

  const viewInvoiceDetails = async (invoice: QboInvoice) => {
    startTransition(async () => {
      try {
        const fullInvoice = await getInvoiceWithLines(invoice.qbo_entity_id)
        if (fullInvoice) {
          setSelectedInvoice(fullInvoice)
          setDetailsOpen(true)
        }
      } catch (err) {
        console.error('Error fetching invoice details:', err)
        toast.error('Failed to load invoice details')
      }
    })
  }

  const handleExport = () => {
    const csv = [
      ['Doc #', 'Date', 'Customer', 'Total', 'Status'].join(','),
      ...sortedInvoices.map((inv) =>
        [
          inv.doc_number || '',
          inv.txn_date || '',
          `"${(inv.customer_name || '').replace(/"/g, '""')}"`,
          inv.total_amount?.toFixed(2) || '0',
          inv.status || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qbo-invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${sortedInvoices.length} invoices`)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">QBO Invoices</h1>
          <p className="text-muted-foreground mt-1">
            QuickBooks Online invoice data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Total Invoices
          </div>
          <div className="text-2xl font-bold mt-1">
            {stats?.totalInvoices || 0}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total Revenue
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
            {formatPrice(stats?.totalRevenue || 0)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            Paid
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
            {stats?.paidCount || 0}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Outstanding
          </div>
          <div className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">
            {stats?.outstandingCount || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Outstanding">Outstanding</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Viewed">Viewed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="doc_number"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Invoice #
              </SortableTableHead>
              <SortableTableHead
                sortKey="date"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                sortKey="customer"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Customer
              </SortableTableHead>
              <SortableTableHead
                sortKey="total"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className="text-right"
              >
                Total
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Status
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : sortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              sortedInvoices.map((invoice) => (
                <TableRow
                  key={invoice.qbo_entity_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => viewInvoiceDetails(invoice)}
                >
                  <TableCell className="font-mono font-medium">
                    {invoice.doc_number || '-'}
                  </TableCell>
                  <TableCell>{formatDate(invoice.txn_date)}</TableCell>
                  <TableCell>
                    <div>{invoice.customer_name || '-'}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewInvoiceDetails(invoice)
                      }}
                      disabled={isPending}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice #{selectedInvoice?.doc_number}</SheetTitle>
          </SheetHeader>
          {selectedInvoice && (
            <div className="space-y-6 mt-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {formatDate(selectedInvoice.txn_date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <p className="font-medium">{selectedInvoice.customer_name}</p>
                {selectedInvoice.bill_email && (
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.bill_email}
                  </p>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-2">Line Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedInvoice.lines
                    .filter((line) => line.line_amount !== null && line.line_amount > 0)
                    .map((line) => (
                      <div key={line.line_num} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <p className="font-medium text-sm">
                              {line.item_name || 'Item'}
                            </p>
                            {line.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {line.description}
                              </p>
                            )}
                            {line.quantity && line.unit_price && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {line.quantity} x {formatPrice(line.unit_price)}
                              </p>
                            )}
                          </div>
                          <p className="font-medium whitespace-nowrap">
                            {formatPrice(line.line_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total</span>
                <span>{formatPrice(selectedInvoice.total_amount)}</span>
              </div>

              {/* Balance */}
              {selectedInvoice.balance !== null && selectedInvoice.balance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="text-red-600 font-medium">
                    {formatPrice(selectedInvoice.balance)}
                  </span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
