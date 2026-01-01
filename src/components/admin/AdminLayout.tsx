'use client'

import { cn } from '@/lib/utils'
import { AdminSidebar } from './AdminSidebar'
import { AdminBreadcrumbs } from './AdminBreadcrumbs'
import {
  AdminLayoutProvider,
  useAdminLayout,
} from '@/contexts/AdminLayoutContext'

interface AdminLayoutProps {
  children: React.ReactNode
  /** Override breadcrumbs with custom items */
  breadcrumbs?: Array<{ title: string; href?: string }>
  /** Additional class names for the main content area */
  className?: string
  /** Hide breadcrumbs for this page */
  hideBreadcrumbs?: boolean
}

/**
 * Inner layout component that uses the context.
 */
function AdminLayoutInner({
  children,
  breadcrumbs,
  className,
  hideBreadcrumbs = false,
}: AdminLayoutProps) {
  const { sidebarCollapsed } = useAdminLayout()

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      {/* Main content area */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
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

/**
 * Admin layout wrapper with sidebar, breadcrumbs, and consistent spacing.
 * Uses React Context for sidebar state (no polling).
 */
export function AdminLayout(props: AdminLayoutProps) {
  return (
    <AdminLayoutProvider>
      <AdminLayoutInner {...props} />
    </AdminLayoutProvider>
  )
}
