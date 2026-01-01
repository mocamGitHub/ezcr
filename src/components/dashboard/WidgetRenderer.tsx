'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react'
import { type Widget, type DateRange, executeWidgetRpc } from '@/app/(admin)/admin/dashboard/dashboard-actions'

interface WidgetRendererProps {
  widget: Widget
  dateRange: DateRange
}

export function WidgetRenderer({ widget, dateRange }: WidgetRendererProps) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!widget.rpc_name) {
        // Placeholder widget
        setData(widget.display_config)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await executeWidgetRpc(widget.rpc_name, dateRange, widget.rpc_args)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [widget.rpc_name, widget.rpc_args, dateRange])

  if (loading) {
    return <WidgetSkeleton widget={widget} />
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  switch (widget.widget_type) {
    case 'kpi':
      return <KPIWidget widget={widget} data={data} />
    case 'timeseries':
      return <TimeseriesWidget widget={widget} data={data as { bucket_date: string; amount: number }[] | null} />
    case 'table':
      return <TableWidget widget={widget} data={data as Record<string, unknown>[] | null} />
    case 'bar':
      return <BarWidget widget={widget} data={data as { category?: string; column_name?: string; amount?: number; count?: number }[] | null} />
    case 'donut':
      return <DonutWidget widget={widget} data={data as { status: string; count: number; total_amount: number }[] | null} />
    default:
      return (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              Unknown widget type: {widget.widget_type}
            </div>
          </CardContent>
        </Card>
      )
  }
}

function WidgetSkeleton({ widget }: { widget: Widget }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        {widget.subtitle && <CardDescription>{widget.subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  )
}

// KPI Widget - Shows key metrics
function KPIWidget({ widget, data }: { widget: Widget; data: unknown }) {
  const kpiData = data as Record<string, unknown> | null

  if (!kpiData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No data</div>
        </CardContent>
      </Card>
    )
  }

  // Check if it's a placeholder
  if (widget.display_config?.placeholder) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          {widget.subtitle && <CardDescription>{widget.subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-muted-foreground">
            {(widget.display_config?.value as number) || 0}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Finance KPIs
  if ('revenue_mtd' in kpiData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPIItem
              label="Revenue (MTD)"
              value={formatCurrency(kpiData.revenue_mtd as number)}
              icon={<DollarSign className="h-4 w-4" />}
              variant="success"
            />
            <KPIItem
              label="Expenses (MTD)"
              value={formatCurrency(kpiData.expenses_mtd as number)}
              icon={<TrendingDown className="h-4 w-4" />}
              variant="warning"
            />
            <KPIItem
              label="Profit (MTD)"
              value={formatCurrency(kpiData.profit_mtd as number)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant={(kpiData.profit_mtd as number) >= 0 ? 'success' : 'danger'}
            />
            <KPIItem
              label="Avg Order Value"
              value={formatCurrency(kpiData.avg_order_value as number)}
              icon={<Package className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Tasks KPIs
  if ('open_count' in kpiData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <KPIItem
              label="Open"
              value={kpiData.open_count as number}
              icon={<Clock className="h-4 w-4" />}
            />
            <KPIItem
              label="Overdue"
              value={kpiData.overdue_count as number}
              icon={<AlertCircle className="h-4 w-4" />}
              variant="danger"
            />
            <KPIItem
              label="Completed"
              value={kpiData.completed_count as number}
              icon={<CheckCircle2 className="h-4 w-4" />}
              variant="success"
            />
            <KPIItem
              label="Avg Age"
              value={`${kpiData.avg_age_days}d`}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generic KPI display
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs overflow-auto">{JSON.stringify(kpiData, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}

function KPIItem({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const variantClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  }

  return (
    <div>
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${variantClasses[variant]}`}>{value}</div>
    </div>
  )
}

// Timeseries Widget - Line chart
function TimeseriesWidget({
  widget,
  data,
}: {
  widget: Widget
  data: { bucket_date: string; amount: number }[] | null
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const maxAmount = Math.max(...data.map(d => d.amount))
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <CardDescription>Total: {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {data.map((point, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${maxAmount > 0 ? (point.amount / maxAmount) * 100 : 0}%`, minHeight: '4px' }}
              title={`${point.bucket_date}: ${formatCurrency(point.amount)}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{data[0]?.bucket_date}</span>
          <span>{data[data.length - 1]?.bucket_date}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Table Widget
function TableWidget({
  widget,
  data,
}: {
  widget: Widget
  data: Record<string, unknown>[] | null
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                {columns.map(col => (
                  <th key={col} className="text-left p-2 font-medium">
                    {formatColumnName(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {columns.map(col => (
                    <td key={col} className="p-2">
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <div className="p-2 text-center text-xs text-muted-foreground border-t">
            Showing 10 of {data.length} rows
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Bar Widget
function BarWidget({
  widget,
  data,
}: {
  widget: Widget
  data: { category?: string; column_name?: string; amount?: number; count?: number }[] | null
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map(d => d.amount || d.count || 0))

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.slice(0, 8).map((item, i) => {
            const label = item.category || item.column_name || `Item ${i}`
            const value = item.amount || item.count || 0
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{label}</span>
                  <span className="text-muted-foreground">
                    {item.amount !== undefined ? formatCurrency(value) : value}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Donut Widget
function DonutWidget({
  widget,
  data,
}: {
  widget: Widget
  data: { status: string; count: number; total_amount: number }[] | null
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    shipped: 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    delivered: 'bg-green-600',
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <CardDescription>Total: {total}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-500'}`} />
                <span className="text-sm capitalize">{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.count}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(item.total_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    if (value > 1000) return formatCurrency(value)
    return value.toString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') {
    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(value).toLocaleDateString()
    }
    return value
  }
  return JSON.stringify(value)
}
