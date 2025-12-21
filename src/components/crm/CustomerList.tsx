'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCustomers, getCRMDashboardStats } from '@/actions/crm'
import type { CustomerProfile, CustomerListFilters, CustomerSegment } from '@/types/crm'
import { DEFAULT_SEGMENTS } from '@/types/crm'
import { CustomerTable, type SortField } from './CustomerTable'
import { CustomerFilters } from './CustomerFilters'
import { CustomerSegmentTabs } from './CustomerSegmentTabs'
import { CRMStats } from './CRMStats'
import { useAuth } from '@/contexts/AuthContext'

export function CustomerList() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
    </div>
  )
}
