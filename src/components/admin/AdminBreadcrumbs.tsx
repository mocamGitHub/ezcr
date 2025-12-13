'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateBreadcrumbs } from '@/config/admin-nav'

interface AdminBreadcrumbsProps {
  className?: string
  /** Override the auto-generated breadcrumbs with custom items */
  items?: Array<{ title: string; href?: string }>
}

export function AdminBreadcrumbs({ className, items }: AdminBreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbs = items || generateBreadcrumbs(pathname || '/admin/dashboard')

  // Don't show breadcrumbs on dashboard (it's the root)
  if (breadcrumbs.length <= 1 && pathname === '/admin/dashboard') {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
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
