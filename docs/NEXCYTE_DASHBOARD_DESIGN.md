# NexCyte Platform Dashboard Design Document

**Source Analysis:** EZCR Admin Dashboards
**Date:** 2026-01-04
**Purpose:** Document proven UI/UX patterns from EZCR for adoption in nexcyte-platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Trend Charts](#1-trend-charts)
3. [Date Range Picker](#2-date-range-picker)
4. [Dashboard Architecture](#3-dashboard-architecture)
5. [Slide-out Detail Panels](#4-slide-out-detail-panels)
6. [Search & Advanced Filtering](#5-search--advanced-filtering)
7. [Standard Table Component](#6-standard-table-component)
8. [Implementation Recommendations](#7-implementation-recommendations)
9. [File References](#8-file-references)

---

## Executive Summary

The EZCR admin dashboards use a **database-driven, widget-based architecture** that is highly extensible and production-tested. Five key patterns stand out for nexcyte-platform adoption:

| Pattern | Value | Priority |
|---------|-------|----------|
| Trend Charts | Multi-metric visualization with user controls | High |
| Date Range Picker | Dual calendar with presets and persistence | High |
| Dashboard Registry | Database-driven widget configuration | High |
| Slide-out Panels | Non-blocking detail views | High |
| Search & Filtering | Composable, URL-synced filter system | High |

---

## 1. Trend Charts

### Overview

Multi-metric time series visualization with user-configurable display options. Used on Executive and Finance dashboards.

### Features

| Feature | Implementation | User Value |
|---------|---------------|------------|
| Multi-metric toggle | Checkboxes with color indicators | Users customize their view |
| Chart style switcher | Bar / Line / Area buttons | Different visualizations for different needs |
| Size mode | Compact (208px) / Expanded (300px) | Overview vs. detail analysis |
| Preference persistence | localStorage | Remembers user choices across sessions |
| Responsive | Recharts ResponsiveContainer | Works on all screen sizes |

### Data Structure

```typescript
interface TrendData {
  bucket_date: string      // ISO date (YYYY-MM-DD)
  revenue: number
  expenses: number
  profit: number
  order_count: number
  avg_order_value: number
}
```

### Metric Configuration

```typescript
const METRIC_CONFIG = {
  revenue:  { label: 'Revenue',  color: 'rgb(59, 130, 246)'  },  // Blue
  expenses: { label: 'Expenses', color: 'rgb(249, 115, 22)' },  // Orange
  profit:   { label: 'Profit',   color: 'rgb(34, 197, 94)'  },  // Green
  aov:      { label: 'AOV',      color: 'rgb(168, 85, 247)' },  // Purple
}
```

### User Interaction Flow

1. Open Finance/Executive Dashboard
2. View default chart (Revenue metric, Bar style, Compact size)
3. Toggle additional metrics via checkboxes
4. Switch chart style via Bar/Line/Area buttons
5. Expand for detailed view
6. Change date range (all widgets refresh)
7. Hover for tooltip with all active metric values

### Storage

```typescript
// localStorage key: 'dashboard-trend-prefs'
{
  "metrics": ["revenue", "expenses"],
  "chartStyle": "line",
  "sizeMode": "expanded"
}
```

### Recommended Enhancements for NexCyte

1. **Period Comparison** - Overlay previous period data (dotted line)
2. **Goal Lines** - Reference lines for targets/budgets
3. **Data Export** - CSV/PDF export buttons
4. **Annotations** - Mark significant events on timeline
5. **Custom Buckets** - Day/Week/Month/Quarter aggregation toggle
6. **Configurable Metrics** - Admin-defined metric list per tenant

---

## 2. Date Range Picker

### Overview

Dual-calendar date range selector with quick presets, Apply/Cancel workflow, and localStorage persistence.

### Features

| Feature | Implementation | User Value |
|---------|---------------|------------|
| Dual calendars | Two DayPicker components | Clear from/to selection |
| Quick presets | Sidebar buttons | Fast navigation to common ranges |
| Month/Year dropdowns | Select components | Jump to any date quickly |
| Apply/Cancel | Explicit confirmation | No accidental changes |
| localStorage | Persists between sessions | Convenience |
| Visual feedback | Shows selected range preview | User confidence |

### Preset Options

```typescript
const presetOptions: PresetOption[] = [
  { label: 'Today',        getValue: () => ({ from: today, to: today }) },
  { label: 'Last 7 days',  getValue: () => ({ from: subDays(now, 7), to: now }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(now, 30), to: now }) },
  { label: 'This month',   getValue: () => ({ from: startOfMonth(now), to: now }) },
  { label: 'Last month',   getValue: () => ({ from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) }) },
]
```

### Component Props

```typescript
interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  presets?: boolean  // Show preset sidebar
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────────┐│
│ │ Presets  │ │  From Calendar    │  To Calendar   ││
│ │          │ │  [Month ▼][Year▼] │ [Month▼][Year▼]││
│ │ Today    │ │  ┌─────────────┐  │ ┌─────────────┐││
│ │ Last 7d  │ │  │ Su Mo Tu We │  │ │ Su Mo Tu We │││
│ │ Last 30d │ │  │ Th Fr Sa    │  │ │ Th Fr Sa    │││
│ │ This mo  │ │  │  1  2  3  4 │  │ │  1  2  3  4 │││
│ │ Last mo  │ │  │  5  6  7  8 │  │ │  5  6  7  8 │││
│ │          │ │  │ ...         │  │ │ ...         │││
│ │ ──────── │ │  └─────────────┘  │ └─────────────┘││
│ │ Clear    │ │                                    ││
│ └──────────┘ │  Jan 1, 2026 – Jan 4, 2026        ││
│              │              [Cancel] [Apply]      ││
│              └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Recommended Enhancements for NexCyte

1. **Fiscal Periods** - Q1, Q2, Q3, Q4, FY presets
2. **Compare To** - "vs. Previous Period" toggle
3. **Keyboard Shortcuts** - Ctrl+7 for 7 days, Ctrl+M for month
4. **Relative Input** - Text field for "last 90 days"
5. **Named Ranges** - Save custom ranges (e.g., "Holiday Season")

---

## 3. Dashboard Architecture

### Overview

Database-driven widget system where dashboards and widgets are stored in tables, not code. Enables runtime configuration without deployments.

### Database Schema

```sql
-- Dashboard definitions
CREATE TABLE nx_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,           -- 'executive', 'ops', 'finance', 'support'
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  icon TEXT,                   -- Lucide icon name
  position INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, key)
);

-- Widget definitions
CREATE TABLE nx_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  dashboard_id UUID NOT NULL REFERENCES nx_dashboards(id),
  key TEXT NOT NULL,
  widget_type TEXT NOT NULL,   -- 'kpi', 'timeseries', 'trend', 'table', 'bar', 'donut'
  title TEXT NOT NULL,
  subtitle TEXT,
  rpc_name TEXT NOT NULL,      -- Supabase RPC function name
  rpc_args JSONB DEFAULT '{}',
  display_config JSONB DEFAULT '{}',
  position INT DEFAULT 0,
  grid_config JSONB NOT NULL,  -- { col, row, width, height }
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Widget Types

| Type | Purpose | Data Format |
|------|---------|-------------|
| `kpi` | Key metrics with comparison | `{ metric: value, metric_prev: value }` |
| `timeseries` | Simple time chart | `[{ bucket_date, amount }]` |
| `trend` | Multi-metric interactive | `[{ bucket_date, revenue, expenses, profit, aov }]` |
| `table` | Data table with pagination | `[{ col1, col2, ... }]` |
| `bar` | Horizontal bar chart | `[{ category, amount }]` |
| `donut` | Status distribution | `[{ status, count, total_amount }]` |

### Grid Configuration

```typescript
interface GridConfig {
  col: number    // Starting column (1-4)
  row: number    // Starting row (1-N)
  width: number  // Columns to span (1-4)
  height: number // Rows to span (1-N)
}

// Example: Full-width KPI bar at top
{ col: 1, row: 1, width: 4, height: 1 }

// Example: Half-width chart
{ col: 1, row: 2, width: 2, height: 2 }
```

### WidgetRenderer Component

```typescript
interface WidgetRendererProps {
  widget: Widget
  dateRange: DateRange
}

function WidgetRenderer({ widget, dateRange }: WidgetRendererProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    executeWidgetRpc(widget.rpc_name, dateRange, widget.rpc_args)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [widget, dateRange])

  if (loading) return <Skeleton />
  if (error) return <ErrorCard error={error} />

  switch (widget.widget_type) {
    case 'kpi': return <KPIWidget data={data} config={widget.display_config} />
    case 'trend': return <TrendWidget data={data} config={widget.display_config} />
    case 'table': return <TableWidget data={data} config={widget.display_config} />
    // ...
  }
}
```

### Benefits

1. **No code changes** to add/modify dashboards
2. **Tenant isolation** built-in via RLS
3. **Role-based access** configurable per dashboard
4. **A/B testing** - different layouts per user segment
5. **Self-service** - admins can modify without developers

---

## 4. Slide-out Detail Panels

### Overview

Right-side slide-out panels that show comprehensive detail information when clicking a table row. Enables viewing/editing details without losing list context.

### Features

| Feature | Implementation | User Value |
|---------|---------------|------------|
| Non-blocking | Sheet component (Radix UI) | View details without losing context |
| Rich content | Organized sections | All relevant info in one place |
| Inline editing | Status dropdown, input fields | Quick updates without navigation |
| State isolation | Ref tracking for item changes | Prevents stale data |
| Smooth animation | 500ms slide-in, 300ms slide-out | Polished feel |
| Scrollable | Overflow handling | Works with any content length |

### Animation Configuration

```typescript
// From sheet.tsx
const sheetVariants = {
  side: "right",
  className: cn(
    "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    "data-[state=open]:slide-in-from-right",
    "data-[state=closed]:slide-out-to-right",
    "data-[state=open]:duration-500",
    "data-[state=closed]:duration-300"
  )
}
```

### Content Sections (Order Detail Example)

1. **Header** - Order number, status badge, close button
2. **Status & Payment** - Editable status dropdown, payment badge
3. **Timeline** - Shipped, delivered, expected dates
4. **Tracking** - PRO#, BOL#, sync button, tracking events
5. **Customer** - Name, email (mailto), phone (tel)
6. **Vehicle Details** - Bed length, load height, etc.
7. **Addresses** - Shipping and billing
8. **Items** - Product list with quantities and prices
9. **Summary** - Subtotal, shipping, tax, total
10. **Notes** - Customer and internal notes
11. **Activity** - Recent status changes, events

### Usage Pattern

```typescript
// Parent component (list page)
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
const [detailsOpen, setDetailsOpen] = useState(false)

const handleRowClick = async (order: Order) => {
  setSelectedOrder(order)
  setDetailsOpen(true)
  // Optionally fetch enhanced details
  const enhanced = await getOrderDetails(order.id)
  setSelectedOrder(enhanced)
}

return (
  <>
    <AdminDataTable
      data={orders}
      onRowClick={handleRowClick}
    />

    <OrderDetailSlideOut
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
      order={selectedOrder}
      onStatusChange={handleStatusChange}
    />
  </>
)
```

### State Management

```typescript
// Prevent state contamination when switching items
const previousIdRef = useRef<string | null>(null)

useEffect(() => {
  const currentId = item?.id || null
  if (previousIdRef.current !== currentId) {
    // Reset ALL state when item changes
    setEditField('')
    setLocalData(null)
    setError(null)
    previousIdRef.current = currentId
  }
}, [item?.id])
```

### Recommended Enhancements for NexCyte

1. **Keyboard Navigation** - Escape to close, arrow keys for prev/next
2. **Breadcrumb Trail** - Show path: Orders > #12345
3. **Quick Actions** - Floating action buttons (edit, delete, duplicate)
4. **Related Items** - Links to related records
5. **Audit Log** - Expandable change history

---

## 5. Search & Advanced Filtering

### Overview

Composable filter system with multiple filter types, URL synchronization, preset support, and active filter indication.

### Features

| Feature | Implementation | User Value |
|---------|---------------|------------|
| URL sync | `useFilters` hook | Shareable, bookmarkable views |
| Multiple types | Select, MultiSelect, DateRange | Flexible filtering |
| Presets | FilterPresetDropdown | Quick access to common filters |
| Active count | Badge on filter button | Visual feedback |
| Clear all | Single button reset | Easy reset |
| Server-side | Filters passed to server action | Efficient for large datasets |

### Filter Types

#### Select Filter
```typescript
{
  type: 'select',
  key: 'status',
  label: 'Order Status',
  value: statusFilter,
  onChange: handleStatusFilterChange,
  allLabel: 'All Statuses',
  options: [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
  ],
}
```

#### Multi-Select Filter
```typescript
{
  type: 'multiselect',
  key: 'tags',
  label: 'Tags',
  value: selectedTags,  // string[]
  onChange: handleTagsChange,
  options: [
    { value: 'vip', label: 'VIP Customer' },
    { value: 'wholesale', label: 'Wholesale' },
  ],
}
```

#### Date Range Filter
```typescript
{
  type: 'daterange',
  key: 'dateRange',
  label: 'Order Date',
  value: dateRange,
  onChange: handleDateRangeChange,
  placeholder: 'Filter by date',
  presets: true,
}
```

### useFilters Hook

```typescript
const {
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
  applyPreset,
} = useFilters<OrderFilters>({
  initialState: {
    status: 'all',
    payment: 'all',
    dateRange: undefined,
  },
  syncToUrl: true,
  urlPrefix: 'f_',
})
```

### URL Parameter Format

```
/admin/orders?f_status=pending&f_payment=paid&f_dateRange=2025-12-01,2026-01-04
```

### AdminFilterBar Component

```typescript
<AdminFilterBar
  filters={filterConfig}
  onClearAll={handleClearFilters}
  showFilterIcon  // Shows "Filters" with active count badge
/>
```

### Active Filter Counting

```typescript
const activeFilterCount = filters.reduce((count, filter) => {
  if (filter.type === 'select' && filter.value && filter.value !== 'all') {
    return count + 1
  }
  if (filter.type === 'multiselect' && filter.value.length > 0) {
    return count + 1
  }
  if (filter.type === 'daterange' && filter.value?.from) {
    return count + 1
  }
  return count
}, 0)
```

### Recommended Enhancements for NexCyte

1. **Saved Filters** - Name and save filter combinations
2. **Filter Templates** - Admin-defined preset filters per role
3. **Smart Suggestions** - Auto-suggest based on data distribution
4. **Bulk Operations** - Actions on filtered results
5. **Export Filtered** - Export current view to CSV/Excel

---

## 6. Standard Table Component

### Overview

Every data table in nexcyte-platform should implement a consistent interface for search, filtering, sorting, pagination, and detail viewing.

### Standard Props Interface

```typescript
interface StandardTableProps<T> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string | null

  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchFields: (keyof T)[]

  // Filtering
  filters: FilterConfig[]
  onFilterChange: (key: string, value: unknown) => void
  syncFiltersToUrl?: boolean
  filterPresets?: FilterPreset[]

  // Sorting
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSortChange: (column: string) => void

  // Pagination
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]

  // Selection (optional)
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void

  // Detail slide-out
  onRowClick?: (row: T) => void
  selectedRow?: T | null
  DetailComponent?: React.ComponentType<{ item: T; onClose: () => void }>

  // Actions
  rowActions?: (row: T) => DropdownMenuItem[]
  bulkActions?: BulkAction[]

  // Export
  exportFormats?: ('csv' | 'excel' | 'pdf')[]
  onExport?: (format: string) => void
}
```

### Usage Example

```typescript
<StandardTable<Order>
  // Data
  data={orders}
  columns={orderColumns}
  loading={loading}
  error={error}

  // Search
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search orders..."
  searchFields={['order_number', 'customer_name', 'email']}

  // Filtering
  filters={filterConfig}
  onFilterChange={updateFilter}
  syncFiltersToUrl={true}

  // Sorting
  sortColumn={sortColumn}
  sortDirection={sortDirection}
  onSortChange={handleSort}

  // Pagination
  page={page}
  pageSize={pageSize}
  totalCount={totalCount}
  onPageChange={setPage}

  // Detail
  onRowClick={handleRowClick}
  selectedRow={selectedOrder}
  DetailComponent={OrderDetailSlideOut}
/>
```

---

## 7. Implementation Recommendations

### Priority Order

1. **Phase 1: Foundation**
   - Date Range Picker component
   - useFilters hook with URL sync
   - AdminFilterBar component
   - Sheet/SlideOut base component

2. **Phase 2: Tables**
   - StandardTable component
   - Column definitions system
   - Export functionality
   - Bulk actions

3. **Phase 3: Dashboards**
   - Database schema (nx_dashboards, nx_widgets)
   - WidgetRenderer component
   - KPI, Table, Bar widgets
   - Dashboard page template

4. **Phase 4: Charts**
   - Trend Chart component
   - Timeseries widget
   - Donut/Status widget
   - Chart export

### Technology Stack

| Component | EZCR Stack | NexCyte Recommendation |
|-----------|------------|------------------------|
| UI Library | shadcn/ui | Adopt (or similar) |
| Charts | Recharts | Adopt |
| Date Handling | date-fns | Adopt |
| Calendar | react-day-picker | Adopt |
| State | React useState/useEffect | Consider Zustand for complex state |
| Data Fetching | Server Actions | Adopt (or React Query) |
| Database | Supabase | Adopt |

### Code Organization

```
src/
├── components/
│   ├── ui/
│   │   ├── date-range-picker.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   ├── admin/
│   │   ├── AdminFilterBar.tsx
│   │   ├── AdminDataTable.tsx
│   │   └── ...
│   └── dashboard/
│       ├── WidgetRenderer.tsx
│       ├── widgets/
│       │   ├── KPIWidget.tsx
│       │   ├── TrendWidget.tsx
│       │   └── ...
│       └── ...
├── hooks/
│   ├── useFilters.ts
│   ├── useFilterParams.ts
│   └── ...
└── app/
    └── (admin)/
        └── admin/
            └── dashboard/
                ├── page.tsx
                ├── [key]/page.tsx
                └── dashboard-actions.ts
```

---

## 8. File References

### EZCR Source Files

| Purpose | File Path |
|---------|-----------|
| Dashboard Page | `src/app/(admin)/admin/dashboard/[key]/page.tsx` |
| Dashboard Actions | `src/app/(admin)/admin/dashboard/dashboard-actions.ts` |
| Dashboard Types | `src/app/(admin)/admin/dashboard/dashboard-utils.ts` |
| Widget Renderer | `src/components/dashboard/WidgetRenderer.tsx` |
| Date Range Picker | `src/components/ui/date-range-picker.tsx` |
| Sheet Component | `src/components/ui/sheet.tsx` |
| Admin Filter Bar | `src/components/admin/AdminFilterBar.tsx` |
| useFilters Hook | `src/hooks/useFilters.ts` |
| Orders Page | `src/app/(admin)/admin/orders/page.tsx` |
| Order Slide-Out | `src/components/orders/OrderDetailSlideOut.tsx` |
| Admin Data Table | `src/components/admin/AdminDataTable.tsx` |

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-04 | Claude | Initial analysis document |

---

*This document captures production-tested patterns from EZCR for consideration in nexcyte-platform development.*
