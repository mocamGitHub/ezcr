// Admin components barrel export

// Layout
export { AdminLayout } from './AdminLayout'
export { AdminSidebar } from './AdminSidebar'
export { AdminBreadcrumbs } from './AdminBreadcrumbs'

// Page components
export { PageHeader } from './PageHeader'

// Data table
export { AdminDataTable } from './AdminDataTable'
export type { AdminDataTableProps, ColumnDef, RowAction, BulkAction } from './AdminDataTable'
export { AdminDataTableSkeleton } from './AdminDataTableSkeleton'

// Filters
export { AdminFilterBar, useFilters } from './AdminFilterBar'
export type { FilterConfig, SelectFilterConfig, MultiSelectFilterConfig, DateRangeFilterConfig } from './AdminFilterBar'
export { FilterPresetDropdown } from './FilterPresetDropdown'

// State components
export { AdminEmptyState } from './AdminEmptyState'
export { AdminErrorState } from './AdminErrorState'
export { AdminErrorBoundary } from './AdminErrorBoundary'

// Activity
export { ActivityLog } from './ActivityLog'
export type { ActivityItem } from './ActivityLog'
