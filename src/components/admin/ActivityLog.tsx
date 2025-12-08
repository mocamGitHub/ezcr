'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ShoppingCart,
  Package,
  User,
  Settings,
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export interface ActivityItem {
  id: string
  type: 'order' | 'inventory' | 'customer' | 'settings' | 'create' | 'update' | 'delete'
  action: string
  description: string
  user?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface ActivityLogProps {
  activities?: ActivityItem[]
  loading?: boolean
  maxItems?: number
  showRefresh?: boolean
  onRefresh?: () => void
}

const activityIcons: Record<string, React.ReactNode> = {
  order: <ShoppingCart className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  customer: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  update: <FileEdit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
}

const activityColors: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  inventory: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  customer: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  settings: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  create: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

// Mock data for demonstration
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    action: 'Order Updated',
    description: 'Order #ORD-2024-0042 status changed to shipped',
    user: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'inventory',
    action: 'Stock Adjusted',
    description: 'AUN-250 inventory increased by 10 units',
    user: 'System',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    type: 'customer',
    action: 'New Customer',
    description: 'John Smith created an account',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    type: 'order',
    action: 'New Order',
    description: 'Order #ORD-2024-0043 received - $1,299.00',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: '5',
    type: 'settings',
    action: 'Settings Updated',
    description: 'Shipping rates configuration updated',
    user: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
]

export function ActivityLog({
  activities,
  loading = false,
  maxItems = 10,
  showRefresh = false,
  onRefresh,
}: ActivityLogProps) {
  const [displayActivities, setDisplayActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Use provided activities or fall back to mock data
    const data = activities || mockActivities
    setDisplayActivities(data.slice(0, maxItems))
  }, [activities, maxItems])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showRefresh && onRefresh && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 group">
            <div
              className={`flex-shrink-0 p-2 rounded-full ${activityColors[activity.type]}`}
            >
              {activityIcons[activity.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{activity.action}</span>
                {activity.user && (
                  <Badge variant="outline" className="text-xs">
                    {activity.user}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
