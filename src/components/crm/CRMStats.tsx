import { formatCurrency } from '@/lib/utils'

interface CRMStatsProps {
  stats: {
    total_customers: number
    total_ltv: number
    avg_ltv: number
    avg_order_count: number
    active_customers_30d: number
    new_customers_30d: number
    at_risk_customers: number
  }
}

export function CRMStats({ stats }: CRMStatsProps) {
  const statCards = [
    {
      label: 'Total Customers',
      value: stats.total_customers.toLocaleString(),
      icon: '👥',
    },
    {
      label: 'Total Lifetime Value',
      value: formatCurrency(stats.total_ltv),
      icon: '💰',
    },
    {
      label: 'Avg. Customer Value',
      value: formatCurrency(stats.avg_ltv),
      icon: '📊',
    },
    {
      label: 'Avg. Orders per Customer',
      value: stats.avg_order_count.toFixed(1),
      icon: '📦',
    },
    {
      label: 'Active (30 days)',
      value: stats.active_customers_30d.toLocaleString(),
      icon: '✅',
      highlight: true,
    },
    {
      label: 'New (30 days)',
      value: stats.new_customers_30d.toLocaleString(),
      icon: '🆕',
      highlight: true,
    },
    {
      label: 'At Risk',
      value: stats.at_risk_customers.toLocaleString(),
      icon: '⚠️',
      alert: stats.at_risk_customers > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`border rounded-lg p-4 ${
            stat.alert
              ? 'bg-destructive/5 border-destructive/30'
              : stat.highlight
              ? 'bg-primary/5 border-primary/30'
              : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
