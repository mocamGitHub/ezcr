# Configurable Dashboard with Date Range Picker - Design

**Date:** 2026-01-04
**Status:** Approved
**Scope:** EZCR codebase

---

## Overview

Build a database-driven dashboard system with:
- `nx_dashboards` / `nx_widgets` tables for configuration
- Date Range Picker component for filtering
- Three widget types: `kpi`, `trend`, `table`
- Real RPC functions using EZCR's existing data

## Architecture

```
User selects date range
    ↓
Dashboard page passes range to all widgets
    ↓
Each widget calls its configured RPC function
    ↓
RPC returns data filtered by date range
    ↓
WidgetRenderer renders appropriate component
```

## Database Schema

### nx_dashboards

```sql
CREATE TABLE nx_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  position INT DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### nx_widgets

```sql
CREATE TABLE nx_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES nx_dashboards(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('kpi', 'trend', 'table')),
  title TEXT NOT NULL,
  subtitle TEXT,
  rpc_name TEXT NOT NULL,
  rpc_args JSONB DEFAULT '{}',
  display_config JSONB DEFAULT '{}',
  grid_config JSONB NOT NULL,
  position INT DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dashboard_id, key)
);
```

### Seed Data

Three dashboards:
- `executive` - Revenue KPIs, order trend chart, top products table
- `finance` - Revenue/expenses/profit KPIs, financial trend chart
- `ops` - Order status KPIs, recent orders table

### RPC Functions

| RPC Name | Parameters | Returns |
|----------|------------|---------|
| `dashboard_kpi_summary` | p_from_date, p_to_date | revenue, orders, customers, avg_order_value with prev period |
| `dashboard_trend_data` | p_from_date, p_to_date | daily buckets: revenue, expenses, profit, order_count |
| `dashboard_top_products` | p_from_date, p_to_date, p_limit | product name, units sold, revenue |
| `dashboard_recent_orders` | p_from_date, p_to_date, p_limit | order#, customer, total, status, date |
| `dashboard_order_status_counts` | p_from_date, p_to_date | status, count |

## Components

### DateRangePicker

```typescript
interface DateRangePickerProps {
  value?: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date } | undefined) => void
  placeholder?: string
  className?: string
}
```

Features:
- Dual calendars (From / To)
- Presets: Today, Last 7 days, Last 30 days, This month, Last month
- Month/Year dropdowns
- Apply/Cancel buttons
- localStorage persistence
- Default: Last 30 days

### KPIWidget

- Metric value with label
- Comparison to previous period (arrow + percentage)
- Color coding: green positive, red negative
- Config: `{ format: 'currency' | 'number' | 'percent', invertColors?: boolean }`

### TrendWidget

- Multi-metric Recharts time series
- Metric toggle checkboxes
- Chart style: Bar / Line / Area
- Size: Compact (208px) / Expanded (300px)
- Hover tooltip
- localStorage preferences

### TableWidget

- Column headers with sort
- Max 10 rows
- "View All" link
- Config: `{ columns: [{ key, label, format? }], linkTo?: string }`

### WidgetRenderer

```typescript
interface WidgetRendererProps {
  widget: Widget
  dateRange: { from: Date; to: Date }
}

function WidgetRenderer({ widget, dateRange }: WidgetRendererProps) {
  // 1. Fetch via supabase.rpc(widget.rpc_name, { p_from_date, p_to_date, ...widget.rpc_args })
  // 2. Handle loading/error
  // 3. Switch widget.widget_type -> render component
}
```

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/XXXXXX_nx_dashboards.sql` | Tables, RPCs, seed data |
| `src/components/ui/date-range-picker.tsx` | Date range picker |
| `src/components/dashboard/WidgetRenderer.tsx` | Widget orchestrator |
| `src/components/dashboard/widgets/KPIWidget.tsx` | KPI display |
| `src/components/dashboard/widgets/TrendWidget.tsx` | Trend chart |
| `src/components/dashboard/widgets/TableWidget.tsx` | Data table |
| `src/app/(admin)/admin/dashboard/[key]/page.tsx` | Update to use new system |

## Implementation Order

1. Create migration (tables + RPCs + seed)
2. Run migration against EZCR Supabase
3. Build Date Range Picker
4. Build widget components (KPI, Trend, Table)
5. Build WidgetRenderer
6. Update dashboard page
7. Test with real data

## Dependencies

Already in EZCR:
- `date-fns`
- `react-day-picker`
- `recharts`
- shadcn/ui components

---

**Approved:** 2026-01-04
