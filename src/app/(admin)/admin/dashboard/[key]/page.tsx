'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  Settings,
  DollarSign,
  HeadphonesIcon,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange as PickerDateRange } from 'react-day-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  getDashboard,
  getDashboards,
  getWidgets,
} from '../dashboard-actions'
import {
  getDatePreset,
  type Dashboard,
  type Widget,
  type DateRange,
} from '../dashboard-utils'

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
  HeadphonesIcon: <HeadphonesIcon className="h-4 w-4" />,
}

const DATE_RANGE_STORAGE_KEY = 'dashboard-date-range'

function loadDateRange(): { pickerRange: PickerDateRange, dateRange: DateRange } {
  if (typeof window === 'undefined') {
    const preset = getDatePreset('30d')
    return {
      pickerRange: { from: new Date(preset.from), to: new Date(preset.to) },
      dateRange: preset
    }
  }
  try {
    const stored = localStorage.getItem(DATE_RANGE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.from && parsed.to) {
        return {
          pickerRange: { from: new Date(parsed.from), to: new Date(parsed.to) },
          dateRange: { from: parsed.from, to: parsed.to }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  const preset = getDatePreset('30d')
  return {
    pickerRange: { from: new Date(preset.from), to: new Date(preset.to) },
    dateRange: preset
  }
}

function saveDateRange(from: string, to: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify({ from, to }))
  } catch (e) {
    // ignore
  }
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardKey = params?.key as string

  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [pickerRange, setPickerRange] = useState<PickerDateRange | undefined>(() => {
    return loadDateRange().pickerRange
  })
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return loadDateRange().dateRange
  })
  const [refreshKey, setRefreshKey] = useState(0)

  usePageTitle(dashboard?.name || 'Dashboard')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboardData, allDashboards] = await Promise.all([
        getDashboard(dashboardKey),
        getDashboards(),
      ])

      setDashboard(dashboardData)
      setDashboards(allDashboards)

      if (dashboardData) {
        const widgetData = await getWidgets(dashboardData.id)
        setWidgets(widgetData)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [dashboardKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDateRangeChange = (range: PickerDateRange | undefined) => {
    setPickerRange(range)
    if (range?.from && range?.to) {
      const from = format(range.from, 'yyyy-MM-dd')
      const to = format(range.to, 'yyyy-MM-dd')
      setDateRange({ from, to })
      saveDateRange(from, to)
      setRefreshKey(prev => prev + 1)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium">Dashboard not found</h2>
        <p className="text-muted-foreground">
          The dashboard &quot;{dashboardKey}&quot; doesn&apos;t exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/dashboard">Go to Default Dashboard</Link>
        </Button>
      </div>
    )
  }

  // Build grid layout
  const maxRow = Math.max(...widgets.map(w => w.grid_config.row + w.grid_config.height), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Dashboard Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                {dashboard.icon && iconMap[dashboard.icon]}
                <span className="text-xl font-bold">{dashboard.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dashboards.map(d => (
                <DropdownMenuItem
                  key={d.key}
                  onClick={() => router.push(`/admin/dashboard/${d.key}`)}
                  className={d.key === dashboardKey ? 'bg-accent' : ''}
                >
                  {d.icon && iconMap[d.icon]}
                  <span className="ml-2">{d.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {dashboard.description && (
            <span className="text-muted-foreground text-sm">{dashboard.description}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <DateRangePicker
            value={pickerRange}
            onChange={handleDateRangeChange}
            presets
          />

          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: `repeat(${maxRow}, minmax(120px, auto))`,
        }}
      >
        {widgets.map(widget => (
          <div
            key={widget.id}
            style={{
              gridColumn: `${widget.grid_config.col + 1} / span ${widget.grid_config.width}`,
              gridRow: `${widget.grid_config.row + 1} / span ${widget.grid_config.height}`,
            }}
          >
            <WidgetRenderer key={refreshKey} widget={widget} dateRange={dateRange} />
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No widgets configured for this dashboard.</p>
        </div>
      )}
    </div>
  )
}
