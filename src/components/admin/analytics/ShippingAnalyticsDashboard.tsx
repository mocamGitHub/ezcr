'use client'

import { useEffect, useState } from 'react'
import {
  RefreshCw,
  Truck,
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  Mail,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getOrdersOverview,
  getShippingPerformance,
  getAdminActionItems,
  getQuoteAnalytics,
  getErrorSummary,
  getDailyRevenueData,
  getCustomerGeography,
  type OrdersOverview,
  type ShippingPerformance,
  type AdminActionItem,
  type QuoteAnalytics,
  type ErrorSummary,
  type DailyRevenue,
  type CustomerGeography,
} from '@/actions/shipping-analytics'

// ============================================
// HELPER COMPONENTS
// ============================================

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}) {
  if (loading) {
    return <Skeleton className="h-[100px] rounded-lg" />
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  )
}

function ActionItemCard({
  item,
  loading,
}: {
  item: AdminActionItem
  loading?: boolean
}) {
  if (loading) {
    return <Skeleton className="h-[80px] rounded-lg" />
  }

  const getIcon = () => {
    switch (item.item_type) {
      case 'pending_shipment':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'pending_pickup':
        return <Package className="h-5 w-5 text-purple-500" />
      case 'unresolved_errors':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'pending_emails':
        return <Mail className="h-5 w-5 text-yellow-500" />
      case 'failed_emails':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getBadgeVariant = () => {
    if (item.count === 0) return 'outline'
    if (item.item_type.includes('error') || item.item_type.includes('failed')) {
      return 'destructive'
    }
    return 'default'
  }

  return (
    <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-muted-foreground">{item.description}</div>
        </div>
      </div>
      <Badge variant={getBadgeVariant() as any}>{item.count}</Badge>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ShippingAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OrdersOverview | null>(null)
  const [shippingPerf, setShippingPerf] = useState<ShippingPerformance[]>([])
  const [actionItems, setActionItems] = useState<AdminActionItem[]>([])
  const [quoteAnalytics, setQuoteAnalytics] = useState<QuoteAnalytics[]>([])
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
  const [geography, setGeography] = useState<CustomerGeography[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [
        overviewData,
        shippingData,
        actionsData,
        quotesData,
        errorsData,
        revenueData,
        geoData,
      ] = await Promise.all([
        getOrdersOverview(),
        getShippingPerformance(8),
        getAdminActionItems(),
        getQuoteAnalytics(10),
        getErrorSummary(),
        getDailyRevenueData(14),
        getCustomerGeography(),
      ])

      setOverview(overviewData)
      setShippingPerf(shippingData)
      setActionItems(actionsData)
      setQuoteAnalytics(quotesData)
      setErrorSummary(errorsData)
      setDailyRevenue(revenueData)
      setGeography(geoData)
    } catch (error) {
      console.error('Error fetching shipping analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  // Calculate shipping stats from latest performance data
  const latestShipping = shippingPerf[0]
  const avgDaysToShip = latestShipping?.avg_days_to_ship ?? 'N/A'
  const onTimeRate = latestShipping?.on_time_delivery_pct ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shipping Analytics</h2>
          <p className="text-muted-foreground">
            Monitor shipping performance and order fulfillment
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Orders Today"
          value={overview?.orders_today ?? 0}
          subtitle={`${formatCurrency(overview?.revenue_today ?? 0)} revenue`}
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="This Week"
          value={overview?.orders_this_week ?? 0}
          subtitle={`${formatCurrency(overview?.revenue_this_week ?? 0)} revenue`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="This Month"
          value={overview?.orders_this_month ?? 0}
          subtitle={`${formatCurrency(overview?.revenue_this_month ?? 0)} revenue`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(overview?.avg_order_value ?? 0)}
          subtitle={`${overview?.orders_all_time ?? 0} total orders`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* KPI Cards Row 2 - Shipping Specific */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Days to Ship"
          value={typeof avgDaysToShip === 'number' ? `${avgDaysToShip} days` : avgDaysToShip}
          subtitle="Order to shipment"
          icon={<Truck className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Avg Transit Time"
          value={
            latestShipping?.avg_transit_days
              ? `${latestShipping.avg_transit_days} days`
              : 'N/A'
          }
          subtitle="Shipment to delivery"
          icon={<Clock className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="On-Time Delivery"
          value={formatPercent(onTimeRate)}
          subtitle="Delivered by estimated date"
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Shipping Quotes"
          value={quoteAnalytics.reduce((sum, q) => sum + q.quote_count, 0)}
          subtitle="Last 90 days"
          icon={<MapPin className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Action Items */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Action Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[80px]" />)
            : actionItems.map((item, i) => (
                <ActionItemCard key={i} item={item} />
              ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Performance Table */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Weekly Shipping Performance</h3>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">On-Time %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingPerf.slice(0, 6).map((week, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {new Date(week.week_start).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">{week.total_orders}</TableCell>
                      <TableCell className="text-right">{week.orders_shipped}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(week.on_time_delivery_pct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Top Shipping Regions */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Top Shipping Regions</h3>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Pickup %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geography.slice(0, 8).map((geo, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{geo.state || 'Unknown'}</TableCell>
                      <TableCell className="text-right">{geo.order_count}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(geo.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(geo.pickup_pct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Quote Analytics */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Shipping Quote Analytics (by Region)</h3>
        {loading ? (
          <Skeleton className="h-[250px]" />
        ) : quoteAnalytics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shipping quotes recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ZIP Prefix</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Quotes</TableHead>
                  <TableHead className="text-right">Avg Rate</TableHead>
                  <TableHead className="text-right">Avg Transit</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quoteAnalytics.map((quote, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{quote.zip_prefix}xx</TableCell>
                    <TableCell>{quote.destination_state || 'N/A'}</TableCell>
                    <TableCell className="text-right">{quote.quote_count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(quote.avg_rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {quote.avg_transit_days ? `${quote.avg_transit_days} days` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          quote.conversion_rate_pct > 10
                            ? 'default'
                            : quote.conversion_rate_pct > 0
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {formatPercent(quote.conversion_rate_pct)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Error Summary */}
      {errorSummary.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Shipping Errors
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Unresolved</TableHead>
                  <TableHead className="text-right">Last 24h</TableHead>
                  <TableHead className="text-right">Last 7 days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorSummary.map((error, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium capitalize">
                      {error.error_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-right">{error.total_errors}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={error.unresolved_errors > 0 ? 'destructive' : 'outline'}>
                        {error.unresolved_errors}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{error.errors_last_24h}</TableCell>
                    <TableCell className="text-right">{error.errors_last_7_days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
