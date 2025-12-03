'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  title?: string
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((current) => [...current, { id, message, type, title }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-5 duration-300 ${bgColors[toast.type]}`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{toast.title}</p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  )
}
