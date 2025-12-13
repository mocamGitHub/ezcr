'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { AdminSidebar } from './AdminSidebar'
import { AdminBreadcrumbs } from './AdminBreadcrumbs'

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

interface AdminLayoutProps {
  children: React.ReactNode
  /** Override breadcrumbs with custom items */
  breadcrumbs?: Array<{ title: string; href?: string }>
  /** Additional class names for the main content area */
  className?: string
  /** Hide breadcrumbs for this page */
  hideBreadcrumbs?: boolean
}

export function AdminLayout({
  children,
  breadcrumbs,
  className,
  hideBreadcrumbs = false,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Sync with sidebar collapsed state
  useEffect(() => {
    const checkCollapsed = () => {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      setSidebarCollapsed(stored === 'true')
    }

    checkCollapsed()

    // Listen for storage changes (in case user changes in another tab)
    window.addEventListener('storage', checkCollapsed)

    // Also listen for custom events from the sidebar
    const handleSidebarChange = () => checkCollapsed()
    window.addEventListener('sidebar-collapsed-change', handleSidebarChange)

    return () => {
      window.removeEventListener('storage', checkCollapsed)
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange)
    }
  }, [])

  // Poll for changes since storage event doesn't fire in same tab
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      const isCollapsed = stored === 'true'
      if (isCollapsed !== sidebarCollapsed) {
        setSidebarCollapsed(isCollapsed)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      {/* Main content area */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          // Offset for sidebar on desktop
          'md:pl-64',
          sidebarCollapsed && 'md:pl-16',
          // Add top padding on mobile to account for hamburger button
          'pt-14 md:pt-0'
        )}
      >
        <div className={cn('container mx-auto p-4 md:p-6 lg:p-8', className)}>
          {!hideBreadcrumbs && (
            <AdminBreadcrumbs items={breadcrumbs} className="mb-4" />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
