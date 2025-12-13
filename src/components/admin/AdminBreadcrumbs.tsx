'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateBreadcrumbs } from '@/config/admin-nav'
import { Button } from '@/components/ui/button'

interface AdminBreadcrumbsProps {
  className?: string
  /** Override the auto-generated breadcrumbs with custom items */
  items?: Array<{ title: string; href?: string }>
  /** Show back button */
  showBack?: boolean
}

export function AdminBreadcrumbs({ className, items, showBack = true }: AdminBreadcrumbsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumbs = items || generateBreadcrumbs(pathname || '/admin/dashboard')

  // Check if we're on a sub-page (not the main dashboard)
  const isSubPage = pathname !== '/admin/dashboard' && breadcrumbs.length > 1

  // Don't show breadcrumbs on dashboard (it's the root)
  if (breadcrumbs.length <= 1 && pathname === '/admin/dashboard') {
    return null
  }

  // Get the back URL (parent page)
  const backUrl = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2]?.href : '/admin/dashboard'

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}
    >
      {/* Back Button */}
      {showBack && isSubPage && backUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {!isFirst && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'hover:text-foreground transition-colors',
                    isFirst && 'flex items-center gap-1'
                  )}
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  <span className={cn(isFirst && 'sr-only md:not-sr-only')}>
                    {item.title}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.title}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
