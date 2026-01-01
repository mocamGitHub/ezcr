'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { executeWidgetRpc } from '@/app/(admin)/admin/dashboard/dashboard-actions'
import { type Widget, type DateRange } from '@/app/(admin)/admin/dashboard/dashboard-utils'
import { cn } from '@/lib/utils'

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
      return <KPIWidget widget={widget} data={data} dateRange={dateRange} />
    case 'timeseries':
      return <TimeseriesWidget widget={widget} data={data as { bucket_date: string; amount: number }[] | null} />
    case 'trend':
      return <TrendWidget widget={widget} dateRange={dateRange} />
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

// KPI Widget - Shows key metrics with comparison
function KPIWidget({ widget, data, dateRange }: { widget: Widget; data: unknown; dateRange: DateRange }) {
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

  // Finance KPIs with comparison (new format)
  if ('revenue' in kpiData && 'revenue_prev' in kpiData) {
    const periodDays = kpiData.period_days as number || 30
    const periodLabel = getPeriodLabel(periodDays)

    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPIItemWithComparison
              label="Revenue"
              periodLabel={periodLabel}
              value={kpiData.revenue as number}
              prevValue={kpiData.revenue_prev as number}
              icon={<DollarSign className="h-4 w-4" />}
              positiveIsGood={true}
            />
            <KPIItemWithComparison
              label="Expenses"
              periodLabel={periodLabel}
              value={kpiData.expenses as number}
              prevValue={kpiData.expenses_prev as number}
              icon={<TrendingDown className="h-4 w-4" />}
              positiveIsGood={false}
            />
            <KPIItemWithComparison
              label="Profit"
              periodLabel={periodLabel}
              value={kpiData.profit as number}
              prevValue={kpiData.profit_prev as number}
              icon={<TrendingUp className="h-4 w-4" />}
              positiveIsGood={true}
            />
            <KPIItemWithComparison
              label="Avg Order Value"
              periodLabel=""
              value={kpiData.avg_order_value as number}
              prevValue={kpiData.aov_prev as number}
              icon={<Package className="h-4 w-4" />}
              positiveIsGood={true}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Legacy Finance KPIs (MTD format - for backwards compatibility)
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

function getPeriodLabel(days: number): string {
  if (days === 7) return '7d'
  if (days === 30) return '30d'
  if (days === 31) return 'MTD'
  if (days === 90) return 'QTD'
  if (days === 365 || days === 366) return 'YTD'
  return `${days}d`
}

function KPIItemWithComparison({
  label,
  periodLabel,
  value,
  prevValue,
  icon,
  positiveIsGood = true,
}: {
  label: string
  periodLabel: string
  value: number
  prevValue: number
  icon?: React.ReactNode
  positiveIsGood?: boolean
}) {
  const change = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 0.5

  // Determine if the change is good or bad
  const isGood = isNeutral ? null : (positiveIsGood ? isPositive : !isPositive)

  return (
    <div>
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        {icon}
        {label}
        {periodLabel && <span className="text-muted-foreground/70">({periodLabel})</span>}
      </div>
      <div className="text-2xl font-bold text-foreground">{formatCurrency(value)}</div>
      {prevValue > 0 && (
        <div className={cn(
          "flex items-center gap-1 text-xs mt-1",
          isNeutral ? "text-muted-foreground" : isGood ? "text-green-600" : "text-red-600"
        )}>
          {isNeutral ? (
            <Minus className="h-3 w-3" />
          ) : isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          <span>{Math.abs(change).toFixed(1)}% vs prev</span>
        </div>
      )}
    </div>
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

// Trend Widget - Multi-metric chart with toggles
type MetricKey = 'revenue' | 'expenses' | 'profit' | 'aov'

interface TrendData {
  bucket_date: string
  revenue: number
  expenses: number
  profit: number
  order_count: number
  avg_order_value: number
}

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; bgColor: string }> = {
  revenue: { label: 'Revenue', color: 'rgb(59, 130, 246)', bgColor: 'bg-blue-500' },
  expenses: { label: 'Expenses', color: 'rgb(249, 115, 22)', bgColor: 'bg-orange-500' },
  profit: { label: 'Profit', color: 'rgb(34, 197, 94)', bgColor: 'bg-green-500' },
  aov: { label: 'AOV', color: 'rgb(168, 85, 247)', bgColor: 'bg-purple-500' },
}

function TrendWidget({ widget, dateRange }: { widget: Widget; dateRange: DateRange }) {
  const [data, setData] = useState<TrendData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(new Set(['revenue']))

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const result = await executeWidgetRpc('nx_finance_timeseries', dateRange, widget.rpc_args || {})
        setData(result as TrendData[] | null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange, widget.rpc_args])

  const toggleMetric = (metric: MetricKey) => {
    setActiveMetrics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(metric)) {
        // Don't allow removing the last metric
        if (newSet.size > 1) {
          newSet.delete(metric)
        }
      } else {
        newSet.add(metric)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
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

  // Calculate max value across all active metrics for scaling
  const getMetricValue = (point: TrendData, metric: MetricKey): number => {
    switch (metric) {
      case 'revenue': return point.revenue
      case 'expenses': return point.expenses
      case 'profit': return point.profit
      case 'aov': return point.avg_order_value
    }
  }

  const maxValue = Math.max(
    ...data.flatMap(point =>
      Array.from(activeMetrics).map(metric => Math.abs(getMetricValue(point, metric)))
    )
  )

  // Calculate totals for active metrics
  const totals = Array.from(activeMetrics).map(metric => ({
    metric,
    total: data.reduce((sum, point) => sum + getMetricValue(point, metric), 0),
    config: METRIC_CONFIG[metric],
  }))

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </div>
        {/* Metric Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(metric => {
            const config = METRIC_CONFIG[metric]
            const isActive = activeMetrics.has(metric)
            return (
              <Button
                key={metric}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1.5",
                  isActive && config.bgColor,
                  isActive && "text-white hover:opacity-90",
                  !isActive && "hover:bg-muted"
                )}
                onClick={() => toggleMetric(metric)}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-white" : config.bgColor
                )} />
                {config.label}
              </Button>
            )
          })}
        </div>
        {/* Show totals */}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          {totals.map(({ metric, total, config }) => (
            <span key={metric}>
              <span className="font-medium" style={{ color: config.color }}>{config.label}:</span>{' '}
              {formatCurrency(metric === 'aov' ? total / data.length : total)}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Multi-line Chart */}
        <div className="relative h-32">
          {/* Chart area */}
          <div className="flex items-end gap-0.5 h-full">
            {data.map((point, i) => (
              <div key={i} className="flex-1 relative h-full flex flex-col justify-end">
                {Array.from(activeMetrics).map(metric => {
                  const value = getMetricValue(point, metric)
                  const height = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0
                  const config = METRIC_CONFIG[metric]
                  return (
                    <div
                      key={metric}
                      className="absolute bottom-0 left-0 right-0 rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        minHeight: value > 0 ? '2px' : '0',
                        backgroundColor: config.color,
                        opacity: 0.7 + (0.3 * Array.from(activeMetrics).indexOf(metric) / activeMetrics.size),
                      }}
                      title={`${point.bucket_date}: ${config.label} ${formatCurrency(value)}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{data[0]?.bucket_date}</span>
          <span>{data[data.length - 1]?.bucket_date}</span>
        </div>
      </CardContent>
    </Card>
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
