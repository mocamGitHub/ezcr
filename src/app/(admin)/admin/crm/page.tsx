'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tags, Download, Users, RefreshCw } from 'lucide-react'
import {
  AdminDataTable,
  PageHeader,
  type ColumnDef,
  type BulkAction,
} from '@/components/admin'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { HealthScoreBadge } from '@/components/crm/HealthScoreBadge'
import { CustomerTagBadges } from '@/components/crm/CustomerTagBadges'
import { CustomerSegmentTabs } from '@/components/crm/CustomerSegmentTabs'
import { CustomerFilters } from '@/components/crm/CustomerFilters'
import { CRMStats } from '@/components/crm/CRMStats'
import { EnvironmentBadge } from '@/components/EnvironmentBanner'
import { DEFAULT_SEGMENTS } from '@/types/crm'
import type { CustomerListFilters } from '@/types/crm'
import {
  getCustomersPaginated,
  getCRMDashboardStats,
  bulkAddTags,
  getCustomersForExport,
  type CustomerProfile,
  type CRMDashboardStats,
} from './actions'

export default function CRMPage() {
  usePageTitle('CRM')
  const router = useRouter()
  const { profile } = useAuth()

  // Get health score visibility preference from user metadata
  const showHealthScore = profile?.metadata?.crm_preferences?.show_health_score ?? true

  // Table state
  const [customers, setCustomers] = useState<CustomerProfile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortColumn, setSortColumn] = useState('last_order_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and segments
  const [activeSegment, setActiveSegment] = useState<string>('all')
  const [filters, setFilters] = useState<CustomerListFilters>({})

  // Stats
  const [stats, setStats] = useState<CRMDashboardStats | null>(null)

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  // Bulk action state
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getCustomersPaginated({
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search,
        filters,
      })

      setCustomers(result.data)
      setTotalCount(result.totalCount)
    } catch (err: unknown) {
      console.error('Error loading customers:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers'
      setError(errorMessage)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search, filters])

  const loadStats = useCallback(async () => {
    try {
      const dashboardStats = await getCRMDashboardStats()
      setStats(dashboardStats as CRMDashboardStats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleSegmentChange = (segmentId: string) => {
    setActiveSegment(segmentId)
    setPage(1)

    if (segmentId === 'all') {
      setFilters({})
    } else {
      const segment = DEFAULT_SEGMENTS.find((s) => s.id === segmentId)
      if (segment) {
        setFilters(segment.filter || {})
      }
    }
  }

  const handleFilterChange = (newFilters: CustomerListFilters) => {
    setFilters(newFilters)
    setPage(1)
    setActiveSegment('all') // Reset segment when manually filtering
  }

  const handleCustomerClick = (customer: CustomerProfile) => {
    router.push(`/admin/crm/${encodeURIComponent(customer.customer_email)}`)
  }

  // Bulk action handlers
  const handleBulkAddTag = async () => {
    if (!newTag.trim() || selectedKeys.size === 0) return

    setBulkActionLoading(true)
    try {
      await bulkAddTags(Array.from(selectedKeys), [newTag.trim()])
      toast.success(`Tag "${newTag.trim()}" added to ${selectedKeys.size} customer(s)`)
      setAddTagDialogOpen(false)
      setNewTag('')
      setSelectedKeys(new Set())
      loadData() // Refresh
    } catch (err) {
      console.error('Error adding tags:', err)
      toast.error('Failed to add tag')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkExport = async () => {
    try {
      let dataToExport: CustomerProfile[]

      if (selectedKeys.size > 0) {
        dataToExport = customers.filter((c) => selectedKeys.has(c.customer_email))
      } else {
        dataToExport = await getCustomersForExport(filters)
      }

      const csvContent = [
        ['Name', 'Email', 'Phone', 'Orders', 'Lifetime Value', 'Health Score', 'Tags'].join(','),
        ...dataToExport.map((c) =>
          [
            `"${c.name || ''}"`,
            `"${c.customer_email}"`,
            `"${c.phone || ''}"`,
            c.order_count,
            c.lifetime_value.toFixed(2),
            c.health_score ?? '',
            `"${(c.tags || []).map((t) => t.name).join('; ')}"`,
          ].join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${dataToExport.length} customer(s)`)
    } catch (err) {
      console.error('Error exporting customers:', err)
      toast.error('Failed to export customers')
    }
  }

  // Column definitions
  const columns: ColumnDef<CustomerProfile>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      cell: (customer) => (
        <div>
          <div className="font-medium">{customer.name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {customer.customer_email}
          </div>
          {customer.phone && (
            <div className="text-sm text-muted-foreground hidden sm:block">{customer.phone}</div>
          )}
        </div>
      ),
    },
    ...(showHealthScore
      ? [
          {
            key: 'health_score',
            header: 'Health',
            sortable: true,
            headerClassName: 'hidden sm:table-cell',
            className: 'hidden sm:table-cell',
            cell: (customer: CustomerProfile) => (
              <HealthScoreBadge score={customer.health_score ?? 0} />
            ),
          },
        ]
      : []),
    {
      key: 'tags',
      header: 'Tags',
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      cell: (customer) => (
        <CustomerTagBadges tags={customer.tags || []} />
      ),
    },
    {
      key: 'order_count',
      header: 'Orders',
      sortable: true,
      cell: (customer) => <span className="font-medium">{customer.order_count}</span>,
    },
    {
      key: 'lifetime_value',
      header: 'LTV',
      sortable: true,
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (customer) => (
        <span className="font-medium">{formatCurrency(customer.lifetime_value)}</span>
      ),
    },
    {
      key: 'last_order_date',
      header: 'Last Order',
      sortable: true,
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      cell: (customer) => (
        <span className="text-muted-foreground">
          {customer.last_order_date
            ? new Date(customer.last_order_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'open_task_count',
      header: 'Tasks',
      sortable: true,
      cell: (customer) =>
        (customer.open_task_count ?? 0) > 0 ? (
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {customer.open_task_count}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Add Tag',
      onClick: () => setAddTagDialogOpen(true),
      icon: <Tags className="h-4 w-4" />,
      disabled: bulkActionLoading,
    },
    {
      label: 'Export',
      onClick: handleBulkExport,
      icon: <Download className="h-4 w-4" />,
      disabled: bulkActionLoading,
    },
  ]

  // Toolbar with segment tabs and filters
  const toolbar = (
    <div className="flex flex-col gap-4 w-full">
      {/* Segment Tabs */}
      <CustomerSegmentTabs
        activeSegment={activeSegment}
        onSegmentChange={handleSegmentChange}
      />

      {/* Advanced Filters */}
      <CustomerFilters filters={filters} onFilterChange={handleFilterChange} />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Relationship Management"
        description="View and manage all customer interactions, orders, and engagement"
        primaryAction={
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
        secondaryActions={<EnvironmentBadge />}
      />

      {/* Dashboard Stats */}
      {stats && <CRMStats stats={stats} />}

      {/* Customers Table */}
      <AdminDataTable
        data={customers}
        columns={columns}
        keyField="customer_email"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyIcon={Users}
        emptyTitle="No customers found"
        emptyDescription={
          search || Object.keys(filters).length > 0
            ? 'No customers match your current filters.'
            : 'No customers found.'
        }
        onRowClick={handleCustomerClick}
        toolbar={toolbar}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        bulkActions={bulkActions}
      />

      {/* Add Tag Dialog */}
      <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to {selectedKeys.size} Customer(s)</DialogTitle>
            <DialogDescription>
              Enter a tag name to add to the selected customers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBulkAddTag()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddTag} disabled={!newTag.trim() || bulkActionLoading}>
              {bulkActionLoading ? 'Adding...' : 'Add Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
