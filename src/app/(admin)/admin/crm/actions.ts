'use server'

// Re-export existing CRM actions and adapt for AdminDataTable pattern
import {
  getCustomers as getCustomersBase,
  getCRMDashboardStats,
  bulkAddTags,
  bulkRemoveTags,
} from '@/actions/crm'
import type {
  CustomerProfile,
  CustomerListFilters,
  CustomerListSortOptions,
} from '@/types/crm'

// Re-export types
export type { CustomerProfile, CustomerListFilters } from '@/types/crm'

// Re-export existing actions
export { getCRMDashboardStats, bulkAddTags, bulkRemoveTags }

// =====================================================
// TYPES
// =====================================================

export interface GetCustomersPaginatedParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  filters?: CustomerListFilters
}

export interface GetCustomersPaginatedResult {
  data: CustomerProfile[]
  totalCount: number
  page: number
  pageSize: number
}

// =====================================================
// GET CUSTOMERS PAGINATED (for AdminDataTable)
// =====================================================

export async function getCustomersPaginated(
  params: GetCustomersPaginatedParams = {}
): Promise<GetCustomersPaginatedResult> {
  const {
    page = 1,
    pageSize = 50,
    sortColumn = 'last_order_date',
    sortDirection = 'desc',
    search = '',
    filters = {},
  } = params

  // Map sort column to the expected field names
  const sortFieldMap: Record<string, CustomerListSortOptions['field']> = {
    name: 'name',
    health_score: 'health_score',
    order_count: 'order_count',
    lifetime_value: 'lifetime_value',
    last_order_date: 'last_order_date',
    open_task_count: 'open_task_count',
  }

  const sortField = sortFieldMap[sortColumn] || 'last_order_date'

  // Merge search into filters
  const mergedFilters: CustomerListFilters = {
    ...filters,
    ...(search ? { search } : {}),
  }

  const result = await getCustomersBase(
    mergedFilters,
    { field: sortField, direction: sortDirection },
    page,
    pageSize
  )

  return {
    data: result.customers,
    totalCount: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
}

// =====================================================
// GET CUSTOMERS FOR EXPORT
// =====================================================

export async function getCustomersForExport(
  filters?: CustomerListFilters
): Promise<CustomerProfile[]> {
  // Fetch all matching customers (up to 1000)
  const result = await getCustomersBase(
    filters || {},
    { field: 'last_order_date', direction: 'desc' },
    1,
    1000
  )
  return result.customers
}
