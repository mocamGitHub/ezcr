import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  MessageSquare,
  UserCog,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'
import { type UserRole, hasPermission } from '@/lib/permissions'

export interface AdminNavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  /** Minimum role required to see this item */
  minRole?: UserRole
  /** Badge count (optional, for dynamic badges) */
  badge?: number
}

export interface AdminNavSection {
  title: string
  items: AdminNavItem[]
}

/**
 * Main admin navigation items
 */
export const adminNavItems: AdminNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics',
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    description: 'Manage customer orders',
  },
  {
    title: 'Inventory',
    href: '/admin/inventory',
    icon: Package,
    description: 'Track product stock levels',
  },
  {
    title: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
    description: 'Shipping analytics and management',
  },
  {
    title: 'Customers',
    href: '/admin/crm',
    icon: UserCircle,
    description: 'Customer relationship management',
    minRole: 'customer_service',
  },
  {
    title: 'Testimonials',
    href: '/admin/testimonials',
    icon: MessageSquare,
    description: 'Manage customer reviews',
  },
  {
    title: 'Team',
    href: '/admin/team',
    icon: Users,
    description: 'Manage team members',
    minRole: 'admin',
  },
]

/**
 * Secondary nav items (user-specific)
 */
export const adminUserNavItems: AdminNavItem[] = [
  {
    title: 'Profile',
    href: '/admin/profile',
    icon: UserCog,
    description: 'Your account settings',
  },
]

/**
 * Filter nav items based on user role
 */
export function getAccessibleNavItems(
  items: AdminNavItem[],
  userRole: UserRole
): AdminNavItem[] {
  return items.filter((item) => {
    if (!item.minRole) return true
    return hasPermission(userRole, item.minRole)
  })
}

/**
 * Breadcrumb configuration for admin pages
 */
export interface BreadcrumbItem {
  title: string
  href?: string
}

/**
 * Generate breadcrumbs from pathname
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Dashboard
  breadcrumbs.push({
    title: 'Dashboard',
    href: '/admin/dashboard',
  })

  // Skip 'admin' segment, start from index 1
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    // Skip if it's dashboard (already added)
    if (segment === 'dashboard') continue

    // Check if this is a dynamic segment (like [productId] or [email])
    const isDynamic = !adminNavItems.some((item) => item.href === href) && i > 1

    if (isDynamic) {
      // For dynamic segments, use the value as title but decode it
      breadcrumbs.push({
        title: decodeURIComponent(segment),
        // No href for the current page
      })
    } else {
      // Find the nav item for this segment
      const navItem = adminNavItems.find((item) => item.href === href)

      if (navItem) {
        breadcrumbs.push({
          title: navItem.title,
          href: i === segments.length - 1 ? undefined : href,
        })
      } else {
        // Capitalize first letter for unknown segments
        breadcrumbs.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1),
          href: i === segments.length - 1 ? undefined : href,
        })
      }
    }
  }

  // Remove href from last item (current page)
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].href = undefined
  }

  return breadcrumbs
}
