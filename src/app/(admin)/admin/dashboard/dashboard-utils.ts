// Types
export interface Dashboard {
  id: string
  tenant_id: string
  key: string
  name: string
  description: string | null
  is_default: boolean
  icon: string | null
  position: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Widget {
  id: string
  tenant_id: string
  dashboard_id: string
  key: string
  widget_type: 'kpi' | 'timeseries' | 'trend' | 'table' | 'bar' | 'donut'
  title: string
  subtitle: string | null
  rpc_name: string | null
  rpc_args: Record<string, unknown>
  display_config: Record<string, unknown>
  position: number
  grid_config: {
    col: number
    row: number
    width: number
    height: number
  }
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface SavedView {
  id: string
  tenant_id: string
  dashboard_id: string
  owner_id: string
  name: string
  filters: {
    date_from?: string
    date_to?: string
    preset?: string
  }
  is_shared: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DateRange {
  from: Date
  to: Date
  preset?: string
}

// Date preset helpers
export function getDatePreset(preset: string): DateRange {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case '7d':
      return {
        from: new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000),
        to,
        preset,
      }
    case '30d':
      return {
        from: new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000),
        to,
        preset,
      }
    case 'mtd':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to,
        preset,
      }
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        from: new Date(now.getFullYear(), quarter * 3, 1),
        to,
        preset,
      }
    case 'ytd':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to,
        preset,
      }
    default:
      return {
        from: new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000),
        to,
        preset: '30d',
      }
  }
}
