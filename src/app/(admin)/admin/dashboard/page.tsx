'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, DollarSign, ShoppingCart, Users, TrendingUp, Package, UserCircle, MessageSquare, LogOut, Truck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RevenueChart,
  OrderStatusChart,
  CustomerAcquisitionChart,
  StatsCard,
  TopProductsTable,
  InventoryStatusCard,
} from '@/components/admin/analytics'
import { ActivityLog } from '@/components/admin/ActivityLog'
import {
  getDashboardStats,
  getRevenueTrend,
  getTopProducts,
  getOrderStatusBreakdown,
  getCustomerAcquisition,
  getInventoryStatus,
  type DashboardStats,
  type RevenueDataPoint,
  type TopProduct,
  type OrderStatusBreakdown,
  type CustomerAcquisition,
} from '@/actions/analytics'

type InventoryStatus = {
  total: number
  healthy: number
  lowStock: number
  outOfStock: number
  lowStockProducts: Array<{
    id: string
    name: string
    inventory_count: number
    low_stock_threshold: number | null
  }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<RevenueDataPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatusBreakdown[]>([])
  const [customerAcquisition, setCustomerAcquisition] = useState<CustomerAcquisition[]>([])
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const days = parseInt(period)
      const [statsData, revenueData, productsData, statusData, acquisitionData, inventoryData] =
        await Promise.all([
          getDashboardStats(days),
          getRevenueTrend(days),
          getTopProducts(5),
          getOrderStatusBreakdown(),
          getCustomerAcquisition(days),
          getInventoryStatus(),
        ])

      setStats(statsData)
      setRevenueTrend(revenueData)
      setTopProducts(productsData)
      setOrderStatus(statusData)
      setCustomerAcquisition(acquisitionData)
      setInventoryStatus(inventoryData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const quickLinks = [
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/shipping', label: 'Shipping', icon: Truck },
    { href: '/admin/crm', label: 'Customers', icon: UserCircle },
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
    { href: '/admin/team', label: 'Team', icon: Users },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 mb-6">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <Button variant="outline" size="sm">
              <link.icon className="h-4 w-4 mr-2" />
              {link.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading || !stats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Revenue"
              value={stats.totalRevenue}
              change={stats.revenueChange}
              format="currency"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              change={stats.ordersChange}
              format="number"
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <StatsCard
              title="Avg. Order Value"
              value={stats.averageOrderValue}
              change={stats.aovChange}
              format="currency"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatsCard
              title="New Customers"
              value={stats.totalCustomers}
              change={stats.customersChange}
              format="number"
              icon={<Users className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <RevenueChart data={revenueTrend} />
          )}
        </div>

        {/* Order Status */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          {loading ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <OrderStatusChart data={orderStatus} />
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer Acquisition - Takes 2 columns */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Customer Activity</h3>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <CustomerAcquisitionChart data={customerAcquisition} />
          )}
        </div>

        {/* Inventory Status */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
          {loading || !inventoryStatus ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <InventoryStatusCard status={inventoryStatus} />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Products (Last 30 Days)</h3>
            <Link href="/admin/inventory">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[48px]" />
              ))}
            </div>
          ) : (
            <TopProductsTable products={topProducts} />
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ActivityLog maxItems={5} loading={loading} />
        </div>
      </div>
    </div>
  )
}
