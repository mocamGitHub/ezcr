'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Package, Users, Zap } from 'lucide-react'

// Types for FOMO banner configuration
export interface FOMOBannerConfig {
  id: string
  enabled: boolean
  type: 'countdown' | 'stock' | 'recent_purchase' | 'visitors' | 'custom'
  message: string
  // For countdown type
  endDate?: string
  // For stock type
  stockCount?: number
  stockThreshold?: number
  // For recent purchase type
  recentPurchases?: { name: string; location: string; time: string }[]
  // For visitors type
  visitorCount?: number
  // Styling
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  position: 'top' | 'bottom' | 'floating'
  dismissible: boolean
  showIcon: boolean
  // Scheduling
  startDate?: string
  // Priority for multiple banners
  priority: number
}

// Default configurations (fallback when database is not available)
const DEFAULT_CONFIGS: FOMOBannerConfig[] = [
  {
    id: 'default-stock',
    enabled: true,
    type: 'stock',
    message: 'Only {count} ramps left in stock! Order now before they\'re gone.',
    stockCount: 7,
    stockThreshold: 10,
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
    accentColor: '#F78309',
    position: 'top',
    dismissible: true,
    showIcon: true,
    priority: 1,
  },
]

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [endDate])

  return (
    <div className="flex items-center gap-1 font-mono text-sm font-bold">
      <span className="bg-black/10 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
      <span>:</span>
      <span className="bg-black/10 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span>:</span>
      <span className="bg-black/10 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span>:</span>
      <span className="bg-black/10 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  )
}

function getIcon(type: FOMOBannerConfig['type']) {
  switch (type) {
    case 'countdown':
      return <Clock className="w-5 h-5" />
    case 'stock':
      return <Package className="w-5 h-5" />
    case 'recent_purchase':
      return <Zap className="w-5 h-5" />
    case 'visitors':
      return <Users className="w-5 h-5" />
    default:
      return <Zap className="w-5 h-5" />
  }
}

function formatMessage(message: string, config: FOMOBannerConfig): string {
  return message
    .replace('{count}', String(config.stockCount || 0))
    .replace('{visitors}', String(config.visitorCount || 0))
}

export function FOMOBanner() {
  const [config, setConfig] = useState<FOMOBannerConfig | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has dismissed this banner before
    const dismissedBanners = localStorage.getItem('dismissedFOMOBanners')
    if (dismissedBanners) {
      const dismissed = JSON.parse(dismissedBanners)
      // Auto-expire dismissals after 24 hours
      const now = Date.now()
      const validDismissals = Object.entries(dismissed).filter(
        ([, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000
      )
      localStorage.setItem('dismissedFOMOBanners', JSON.stringify(Object.fromEntries(validDismissals)))
    }

    // Fetch banner config from API or use defaults
    async function fetchConfig() {
      try {
        const response = await fetch('/api/fomo-banner')
        if (response.ok) {
          const data = await response.json()
          if (data.config) {
            setConfig(data.config)
          } else {
            // Use first enabled default config
            const activeConfig = DEFAULT_CONFIGS.find(c => c.enabled)
            setConfig(activeConfig || null)
          }
        } else {
          // API not available, use defaults
          const activeConfig = DEFAULT_CONFIGS.find(c => c.enabled)
          setConfig(activeConfig || null)
        }
      } catch {
        // Error fetching, use defaults
        const activeConfig = DEFAULT_CONFIGS.find(c => c.enabled)
        setConfig(activeConfig || null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [])

  // Check if this specific banner was dismissed
  useEffect(() => {
    if (config) {
      const dismissedBanners = localStorage.getItem('dismissedFOMOBanners')
      if (dismissedBanners) {
        const dismissed = JSON.parse(dismissedBanners)
        if (dismissed[config.id]) {
          setIsDismissed(true)
        }
      }
    }
  }, [config])

  const handleDismiss = () => {
    if (config) {
      const dismissedBanners = JSON.parse(localStorage.getItem('dismissedFOMOBanners') || '{}')
      dismissedBanners[config.id] = Date.now()
      localStorage.setItem('dismissedFOMOBanners', JSON.stringify(dismissedBanners))
    }
    setIsDismissed(true)
  }

  if (isLoading || !config || isDismissed || !config.enabled) {
    return null
  }

  const positionClasses = {
    top: 'relative',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    floating: 'fixed bottom-4 right-4 max-w-md z-50 rounded-lg shadow-lg',
  }

  return (
    <div
      className={`${positionClasses[config.position]} transition-all duration-300`}
      style={{
        backgroundColor: config.backgroundColor || '#FEF3C7',
        color: config.textColor || '#92400E',
      }}
    >
      <div className={`${config.position === 'floating' ? 'p-4' : 'py-2 px-4'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
          {config.showIcon && (
            <span style={{ color: config.accentColor || '#F78309' }}>
              {getIcon(config.type)}
            </span>
          )}

          <span className="flex items-center gap-2 flex-wrap justify-center">
            {config.type === 'countdown' && config.endDate ? (
              <>
                <span>{config.message.split('{countdown}')[0]}</span>
                <CountdownTimer endDate={config.endDate} />
                <span>{config.message.split('{countdown}')[1]}</span>
              </>
            ) : (
              <span>{formatMessage(config.message, config)}</span>
            )}
          </span>

          {config.dismissible && (
            <button
              onClick={handleDismiss}
              className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Export for use in admin panels
export { DEFAULT_CONFIGS }
