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
  from: string
  to: string
  preset?: string
}

// Date preset helpers
function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDatePreset(preset: string): DateRange {
  const now = new Date()
  const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = formatDateString(toDate)

  switch (preset) {
    case '7d':
      return {
        from: formatDateString(new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
        to,
        preset,
      }
    case '30d':
      return {
        from: formatDateString(new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
        to,
        preset,
      }
    case 'mtd':
      return {
        from: formatDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
        to,
        preset,
      }
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        from: formatDateString(new Date(now.getFullYear(), quarter * 3, 1)),
        to,
        preset,
      }
    case 'ytd':
      return {
        from: formatDateString(new Date(now.getFullYear(), 0, 1)),
        to,
        preset,
      }
    default:
      return {
        from: formatDateString(new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
        to,
        preset: '30d',
      }
  }
}
