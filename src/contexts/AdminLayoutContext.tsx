'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

interface AdminLayoutContextValue {
  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean
  /** Toggle the sidebar collapsed state */
  toggleSidebar: () => void
  /** Set the sidebar collapsed state directly */
  setSidebarCollapsed: (collapsed: boolean) => void
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null)

interface AdminLayoutProviderProps {
  children: ReactNode
}

/**
 * Provider for admin layout state.
 * Uses React Context as primary state holder.
 * localStorage for initial hydration and persistence.
 * Browser storage event for cross-tab sync (no polling).
 */
export function AdminLayoutProvider({ children }: AdminLayoutProviderProps) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Initial hydration from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== null) {
      setSidebarCollapsedState(stored === 'true')
    }
    setIsHydrated(true)
  }, [])

  // Cross-tab sync via storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SIDEBAR_COLLAPSED_KEY && event.newValue !== null) {
        setSidebarCollapsedState(event.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed, setSidebarCollapsed])

  // Prevent flash of wrong state before hydration
  if (!isHydrated) {
    return null
  }

  return (
    <AdminLayoutContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AdminLayoutContext.Provider>
  )
}

/**
 * Hook to access admin layout context.
 * Must be used within AdminLayoutProvider.
 */
export function useAdminLayout() {
  const context = useContext(AdminLayoutContext)
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayoutProvider')
  }
  return context
}

/**
 * Optional hook that returns null if outside provider.
 * Use this for components that may render outside admin layout.
 */
export function useAdminLayoutOptional() {
  return useContext(AdminLayoutContext)
}
