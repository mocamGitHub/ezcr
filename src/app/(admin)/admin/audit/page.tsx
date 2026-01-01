'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  PageHeader,
  AdminDataTable,
  AdminDataTableSkeleton,
  AdminFilterBar,
  type ColumnDef,
  type FilterConfig,
} from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw, FileText, User, Bot, Webhook, Eye } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  getAuditLogs,
  getAuditStats,
  type AuditLogEntry,
  type GetAuditLogsParams,
} from '@/actions/audit-admin'

function getActorTypeColor(actorType: string): string {
  switch (actorType) {
    case 'user':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'shortcut':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'system':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    case 'webhook':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getActorIcon(actorType: string) {
  switch (actorType) {
    case 'user':
      return <User className="h-3 w-3 mr-1" />
    case 'shortcut':
      return <Bot className="h-3 w-3 mr-1" />
    case 'system':
      return <FileText className="h-3 w-3 mr-1" />
    case 'webhook':
      return <Webhook className="h-3 w-3 mr-1" />
    default:
      return null
  }
}

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    key: 'created_at',
    header: 'Time',
    sortable: true,
    cell: (entry) => (
      <div>
        <div className="text-sm font-medium">
          {format(new Date(entry.created_at), 'MMM d, h:mm a')}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
        </div>
      </div>
    ),
  },
  {
    key: 'actor_type',
    header: 'Actor',
    sortable: true,
    cell: (entry) => (
      <div className="space-y-1">
        <Badge className={`${getActorTypeColor(entry.actor_type)} flex items-center w-fit`}>
          {getActorIcon(entry.actor_type)}
          {entry.actor_type}
        </Badge>
        {entry.user_email && (
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
            {entry.user_email}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'action',
    header: 'Action',
    sortable: true,
    cell: (entry) => (
      <div className="font-mono text-sm">{entry.action}</div>
    ),
  },
  {
    key: 'resource_type',
    header: 'Resource',
    sortable: true,
    cell: (entry) => (
      <div className="text-sm">
        {entry.resource_type ? (
          <>
            <span className="font-medium">{entry.resource_type}</span>
            {entry.resource_id && (
              <span className="text-muted-foreground ml-1">
                ({entry.resource_id.substring(0, 8)}...)
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    key: 'ip_address',
    header: 'IP',
    cell: (entry) => (
      <span className="text-xs font-mono text-muted-foreground">
        {entry.ip_address || '-'}
      </span>
    ),
  },
]

interface AuditStats {
  totalLogs: number
  last24Hours: number
  last7Days: number
  byActorType: Record<string, number>
}

export default function AdminAuditPage() {
  usePageTitle('Audit Logs')

  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<AuditStats | null>(null)

  // Filters
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchValue, setSearchValue] = useState('')
  const [actorTypeFilter, setActorTypeFilter] = useState<
    'all' | 'user' | 'shortcut' | 'system' | 'webhook'
  >('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Detail dialog
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: GetAuditLogsParams = {
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search: searchValue,
        actorTypeFilter,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      }
      const result = await getAuditLogs(params)
      setEntries(result.data)
      setTotalCount(result.totalCount)
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, actorTypeFilter, dateRange])

  const fetchStats = useCallback(async () => {
    try {
      const result = await getAuditStats()
      setStats(result)
    } catch (err) {
      console.error('Error fetching audit stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

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
    setSearchValue(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleActorTypeChange = (value: string) => {
    setActorTypeFilter(value as typeof actorTypeFilter)
    setPage(1)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setPage(1)
  }

  const handleClearFilters = () => {
    setActorTypeFilter('all')
    setDateRange(undefined)
    setPage(1)
  }

  // Build filter config for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'actorType',
      label: 'Actor Type',
      value: actorTypeFilter,
      onChange: handleActorTypeChange,
      allLabel: 'All Actors',
      options: [
        { value: 'user', label: 'User' },
        { value: 'shortcut', label: 'Shortcut' },
        { value: 'system', label: 'System' },
        { value: 'webhook', label: 'Webhook' },
      ],
    },
    {
      type: 'daterange' as const,
      key: 'dateRange',
      label: 'Date Range',
      value: dateRange,
      onChange: handleDateRangeChange,
      placeholder: 'Filter by date',
      presets: true,
    },
  ], [actorTypeFilter, dateRange])

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setDetailDialogOpen(true)
  }

  const rowActions = (entry: AuditLogEntry) => [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => handleViewDetails(entry),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="View system activity and security events"
        primaryAction={
          <Button onClick={() => { fetchEntries(); fetchStats() }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 24 Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last24Hours.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last7Days.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actor Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byActorType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <AdminFilterBar
        filters={filterConfig}
        onClearAll={handleClearFilters}
        showFilterIcon
      />

      {/* Data Table */}
      {loading && entries.length === 0 ? (
        <AdminDataTableSkeleton columns={5} rows={10} />
      ) : (
        <AdminDataTable
          data={entries}
          columns={columns}
          keyField="id"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by action, resource..."
          loading={loading}
          error={error}
          onRetry={fetchEntries}
          emptyIcon={FileText}
          emptyTitle="No audit logs found"
          emptyDescription="There are no audit events matching your filters."
          rowActions={rowActions}
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Full details for this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Time</div>
                  <div>{format(new Date(selectedEntry.created_at), 'PPpp')}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Actor Type</div>
                  <Badge className={getActorTypeColor(selectedEntry.actor_type)}>
                    {selectedEntry.actor_type}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Action</div>
                  <div className="font-mono">{selectedEntry.action}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">User</div>
                  <div>{selectedEntry.user_email || selectedEntry.user_id || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Resource Type</div>
                  <div>{selectedEntry.resource_type || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Resource ID</div>
                  <div className="font-mono text-xs break-all">
                    {selectedEntry.resource_id || '-'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">IP Address</div>
                  <div className="font-mono">{selectedEntry.ip_address || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Actor ID</div>
                  <div className="font-mono text-xs break-all">
                    {selectedEntry.actor_id || '-'}
                  </div>
                </div>
              </div>

              {selectedEntry.user_agent && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">User Agent</div>
                  <div className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                    {selectedEntry.user_agent}
                  </div>
                </div>
              )}

              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">Metadata</div>
                  <pre className="text-xs font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <div className="font-medium text-muted-foreground text-sm">Event ID</div>
                <div className="text-xs font-mono bg-muted p-2 rounded mt-1">
                  {selectedEntry.id}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
