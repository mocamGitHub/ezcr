'use client'

import { useState, useEffect } from 'react'
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NoticeType = 'info' | 'success' | 'warning' | 'error'

interface AmbientNoticeProps {
  id: string
  type?: NoticeType
  title: string
  message?: string
  dismissible?: boolean
  autoDismiss?: number // milliseconds, 0 = no auto dismiss
  onDismiss?: () => void
  className?: string
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const styleMap = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

const iconStyleMap = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
}

/**
 * AmbientNotice - Non-blocking notification component
 * Can be dismissed manually or auto-dismissed after a timeout
 * Persists dismissed state in localStorage
 */
export function AmbientNotice({
  id,
  type = 'info',
  title,
  message,
  dismissible = true,
  autoDismiss = 0,
  onDismiss,
  className,
}: AmbientNoticeProps) {
  const [visible, setVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Check if already dismissed
  useEffect(() => {
    const dismissedNotices = getDismissedNotices()
    if (dismissedNotices.includes(id)) {
      setDismissed(true)
      setVisible(false)
    }
  }, [id])

  // Auto dismiss
  useEffect(() => {
    if (autoDismiss > 0 && visible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, visible])

  const handleDismiss = () => {
    setVisible(false)
    saveDismissedNotice(id)
    onDismiss?.()
  }

  if (!visible || dismissed) {
    return null
  }

  const Icon = iconMap[type]

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 transition-all duration-300',
        styleMap[type],
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyleMap[type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// LocalStorage helpers for dismissed notices

function getDismissedNotices(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('nx_dismissed_notices')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveDismissedNotice(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const dismissed = getDismissedNotices()
    if (!dismissed.includes(id)) {
      dismissed.push(id)
      // Keep only last 50 dismissed notices
      const trimmed = dismissed.slice(-50)
      localStorage.setItem('nx_dismissed_notices', JSON.stringify(trimmed))
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear all dismissed notices (useful for testing)
 */
export function clearDismissedNotices(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('nx_dismissed_notices')
}

/**
 * Check if a notice has been dismissed
 */
export function isNoticeDismissed(id: string): boolean {
  return getDismissedNotices().includes(id)
}
