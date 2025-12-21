'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  format?: 'currency' | 'number' | 'percent'
}

export function StatsCard({ title, value, change, icon, format }: StatsCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val)
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`
    }
    return val.toLocaleString()
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-muted-foreground" />
    }
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground'
    return change > 0 ? 'text-green-500' : 'text-red-500'
  }

  return (
    <div className="bg-card border rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{formatValue(value)}</div>
      {change !== undefined && (
        <div className={cn('flex items-center justify-center gap-1 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span>{Math.abs(change).toFixed(1)}% vs last period</span>
        </div>
      )}
    </div>
  )
}
