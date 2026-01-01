# Dashboard System Architecture

## Overview

The Dashboard System provides a registry-driven widget framework for displaying business metrics and KPIs. Key features:

- Multiple dashboards per tenant (executive, ops, finance, support)
- Widget registry with RPC-backed data
- Date range filtering with presets
- Saved views for user preferences
- Responsive grid layout

## Data Model

### Core Tables

```
nx_dashboards
├── Dashboard definitions
├── key: unique identifier (executive, ops, finance)
├── is_default: primary dashboard flag
└── icon, description metadata

nx_widgets
├── Widget configurations
├── widget_type: kpi, timeseries, table, bar, donut
├── rpc_name: data source function
├── rpc_args: additional RPC parameters
├── display_config: UI settings
└── grid_config: position and size

nx_dashboard_layouts
├── Breakpoint-specific layouts
├── Responsive grid positions
└── (Currently unused - future enhancement)

nx_saved_views
├── User-saved filter states
├── Date ranges, custom filters
├── is_shared: team visibility
└── is_default: auto-load preference
```

## Widget Types

### KPI Widget

Displays key metrics with optional trend indicators.

```typescript
{
  widget_type: 'kpi',
  rpc_name: 'nx_finance_kpis',
  display_config: {
    icon: 'DollarSign',
    variant: 'success' | 'warning' | 'danger'
  }
}
```

### Timeseries Widget

Line/bar chart for time-based data.

```typescript
{
  widget_type: 'timeseries',
  rpc_name: 'nx_finance_revenue_timeseries',
  display_config: {
    chartType: 'line' | 'bar' | 'area'
  }
}
```

### Table Widget

Tabular data display with pagination.

```typescript
{
  widget_type: 'table',
  rpc_name: 'nx_tasks_aging_list',
  display_config: {
    columns: ['title', 'priority', 'due_at'],
    pageSize: 10
  }
}
```

### Bar Widget

Horizontal bar chart for categorical data.

```typescript
{
  widget_type: 'bar',
  rpc_name: 'nx_finance_expense_by_category',
  display_config: {
    colorScheme: 'blue' | 'green' | 'multi'
  }
}
```

### Donut Widget

Pie/donut chart for status breakdowns.

```typescript
{
  widget_type: 'donut',
  rpc_name: 'nx_orders_by_status',
  display_config: {
    showTotal: true
  }
}
```

## RPC Pattern

All widget RPCs follow a standard signature:

```sql
CREATE FUNCTION nx_{domain}_{metric}(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
) RETURNS {table|jsonb|setof record}
```

### Available RPCs

| RPC | Returns | Description |
|-----|---------|-------------|
| `nx_finance_kpis` | JSONB | Revenue, expenses, profit, AOV |
| `nx_finance_revenue_timeseries` | TABLE | Daily/weekly revenue buckets |
| `nx_finance_expense_by_category` | TABLE | Expenses grouped by category |
| `nx_finance_transactions` | TABLE | Transaction drilldown |
| `nx_tasks_kpis` | JSONB | Open, overdue, completed counts |
| `nx_tasks_by_column` | TABLE | Task counts per column |
| `nx_tasks_aging_list` | TABLE | Oldest open tasks |
| `nx_orders_by_status` | TABLE | Order counts by status |
| `nx_orders_aging` | TABLE | Oldest pending orders |
| `nx_upcoming_appointments` | TABLE | Next scheduled bookings |

## Grid Configuration

Widgets use a 4-column grid with configurable position and size:

```typescript
grid_config: {
  col: 0,      // 0-3 column start
  row: 0,      // row start (0-indexed)
  width: 2,    // columns to span (1-4)
  height: 1    // rows to span
}
```

### Example Layout

```
+-------+-------+-------+-------+
| KPI 1 | KPI 2 | KPI 3 | KPI 4 |  row 0
+-------+-------+-------+-------+
|     Revenue Chart     | Donut |  row 1
+-------+-------+-------+-------+
|     Expense Chart     | Table |  row 2
+-------+-------+-------+-------+
```

## UI Components

### Routes

```
/admin/dashboard           → Redirect to default
/admin/dashboard/[key]     → Dashboard view
```

### Components

| Component | Purpose |
|-----------|---------|
| `WidgetRenderer` | Widget type router |
| `KPIWidget` | KPI display |
| `TimeseriesWidget` | Chart rendering |
| `TableWidget` | Data tables |
| `BarWidget` | Bar charts |
| `DonutWidget` | Pie/donut charts |

## Date Range Presets

| Preset | Description |
|--------|-------------|
| `7d` | Last 7 days |
| `30d` | Last 30 days |
| `mtd` | Month to date |
| `qtd` | Quarter to date |
| `ytd` | Year to date |

## Seeded Dashboards

### Executive

Overview dashboard with finance KPIs, revenue trend, tasks summary, and order status.

### Operations

Task-focused dashboard with order aging, task columns, and scheduling.

### Finance

Detailed financial dashboard with revenue, expenses, transactions, and category breakdowns.

### Support

Placeholder for support metrics (tickets, response times).

## Adding Custom Widgets

1. **Create RPC** following the standard signature
2. **Insert Widget** into `nx_widgets`:
   ```sql
   INSERT INTO nx_widgets (
     tenant_id, dashboard_id, key, widget_type,
     title, rpc_name, grid_config
   ) VALUES (...);
   ```
3. **Update WidgetRenderer** if new widget_type needed

## Security

- RLS enforces tenant isolation
- Widgets only show data for current tenant
- Saved views respect ownership and sharing rules
- Admin role required for dashboard management
