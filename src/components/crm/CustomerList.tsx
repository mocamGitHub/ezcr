'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCustomers, getCRMDashboardStats, bulkAddTags } from '@/actions/crm'
import type { CustomerProfile, CustomerListFilters } from '@/types/crm'
import { DEFAULT_SEGMENTS } from '@/types/crm'
import { CustomerTable, type SortField } from './CustomerTable'
import { CustomerFilters } from './CustomerFilters'
import { CustomerSegmentTabs } from './CustomerSegmentTabs'
import { CRMStats } from './CRMStats'
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
import { Tags, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function CustomerList() {
  const router = useRouter()
  const { profile } = useAuth()

  // Get health score visibility preference from user metadata
  const showHealthScore = profile?.metadata?.crm_preferences?.show_health_score ?? true

  const [customers, setCustomers] = useState<CustomerProfile[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [activeSegment, setActiveSegment] = useState<string>('all')
  const [filters, setFilters] = useState<CustomerListFilters>({})
  const [sortBy, setSortBy] = useState<SortField>('last_order_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Bulk selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Load customers on mount and when filters change
  useEffect(() => {
    loadCustomers()
  }, [page, filters, sortBy, sortOrder])

  // Load stats once on mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getCustomers(
        filters,
        { field: sortBy, direction: sortOrder },
        page,
        50
      )
      
      setCustomers(result.customers)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load customers:', err)
      setError('Failed to load customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const dashboardStats = await getCRMDashboardStats()
      setStats(dashboardStats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleSegmentChange = (segmentId: string) => {
    setActiveSegment(segmentId)
    setPage(1)
    
    if (segmentId === 'all') {
      setFilters({})
    } else {
      const segment = DEFAULT_SEGMENTS.find(s => s.id === segmentId)
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

  const handleSortChange = (column: SortField) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleCustomerClick = (email: string) => {
    router.push(`/admin/crm/${encodeURIComponent(email)}`)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Bulk action handlers
  const handleBulkAddTag = async () => {
    if (!newTag.trim() || selectedEmails.size === 0) return

    setBulkActionLoading(true)
    try {
      await bulkAddTags(Array.from(selectedEmails), [newTag.trim()])
      toast.success(`Tag "${newTag.trim()}" added to ${selectedEmails.size} customer(s)`)
      setAddTagDialogOpen(false)
      setNewTag('')
      setSelectedEmails(new Set())
      loadCustomers() // Refresh
    } catch (err) {
      console.error('Error adding tags:', err)
      toast.error('Failed to add tag')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkExport = () => {
    // Create CSV from selected customers
    const selectedCustomers = customers.filter((c) => selectedEmails.has(c.customer_email))
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Orders', 'Lifetime Value', 'Health Score', 'Tags'].join(','),
      ...selectedCustomers.map((c) =>
        [
          `"${c.name || ''}"`,
          `"${c.customer_email}"`,
          `"${c.phone || ''}"`,
          c.order_count,
          c.lifetime_value.toFixed(2),
          c.health_score ?? '',
          `"${(c.tags || []).join('; ')}"`,
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

    toast.success(`Exported ${selectedEmails.size} customer(s)`)
  }

  const handleClearSelection = () => {
    setSelectedEmails(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {stats && <CRMStats stats={stats} />}

      {/* Segment Tabs */}
      <CustomerSegmentTabs
        activeSegment={activeSegment}
        onSegmentChange={handleSegmentChange}
      />

      {/* Filters */}
      <CustomerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Bulk Action Bar */}
      {selectedEmails.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 border rounded-lg">
          <span className="text-sm font-medium">{selectedEmails.size} selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddTagDialogOpen(true)}
            >
              <Tags className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="ml-auto"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Customer Table */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <CustomerTable
        customers={customers}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onCustomerClick={handleCustomerClick}
        showHealthScore={showHealthScore}
        selectable
        selectedEmails={selectedEmails}
        onSelectionChange={setSelectedEmails}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {customers.length} of {total} customers
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
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
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 text-sm border rounded-md hover:bg-accent ${
                      page === pageNum ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Tag Dialog */}
      <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to {selectedEmails.size} Customer(s)</DialogTitle>
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
