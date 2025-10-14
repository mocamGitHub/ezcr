import { formatCurrency } from '@/lib/utils'

interface CRMStatsProps {
  stats: {
    totalCustomers: number
    newCustomers: number
    atRiskCustomers: number
    customersWithTasks: number
    avgLTV: number
  }
}

export function CRMStats({ stats }: CRMStatsProps) {
  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: '👥',
    },
    {
      label: 'Avg. Customer Value',
      value: formatCurrency(stats.avgLTV),
      icon: '📊',
    },
    {
      label: 'New (30 days)',
      value: stats.newCustomers.toLocaleString(),
      icon: '🆕',
      highlight: true,
    },
    {
      label: 'At Risk',
      value: stats.atRiskCustomers.toLocaleString(),
      icon: '⚠️',
      alert: stats.atRiskCustomers > 0,
    },
    {
      label: 'With Open Tasks',
      value: stats.customersWithTasks.toLocaleString(),
      icon: '📋',
      highlight: true,
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
