'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './ChartSkeleton'

// Dynamic imports for recharts components - reduces initial bundle by ~100KB
// Charts are only loaded when they're actually rendered (admin pages only)

export const RevenueChart = dynamic(
  () => import('./RevenueChart').then(mod => mod.RevenueChart),
  {
    loading: () => <ChartSkeleton height={300} type="area" />,
    ssr: false,
  }
)

export const OrderStatusChart = dynamic(
  () => import('./OrderStatusChart').then(mod => mod.OrderStatusChart),
  {
    loading: () => <ChartSkeleton height={250} type="pie" />,
    ssr: false,
  }
)

export const CustomerAcquisitionChart = dynamic(
  () => import('./CustomerAcquisitionChart').then(mod => mod.CustomerAcquisitionChart),
  {
    loading: () => <ChartSkeleton height={300} type="bar" />,
    ssr: false,
  }
)

// Non-chart components - import directly (small bundles)
export { StatsCard } from './StatsCard'
export { TopProductsTable } from './TopProductsTable'
export { InventoryStatusCard } from './InventoryStatusCard'
export { ShippingAnalyticsDashboard } from './ShippingAnalyticsDashboard'
export { ChartSkeleton } from './ChartSkeleton'
