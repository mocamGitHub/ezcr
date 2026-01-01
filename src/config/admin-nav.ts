import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  MessageSquare,
  UserCog,
  UserCircle,
  Megaphone,
  Mail,
  Building2,
  Wrench,
  Receipt,
  BookOpen,
  Settings,
  User,
  SlidersHorizontal,
  CalendarCheck,
  FileText,
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
  /** Color for the section heading */
  color?: string
}

/**
 * Grouped admin navigation sections
 */
export const adminNavSections: AdminNavSection[] = [
  {
    title: 'Main',
    color: 'text-amber-600 dark:text-amber-400',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Overview and analytics',
      },
    ],
  },
  {
    title: 'Operations',
    color: 'text-blue-600 dark:text-blue-400',
    items: [
      {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        description: 'Manage customer orders',
      },
      {
        title: 'QBO Invoices',
        href: '/admin/qbo',
        icon: Receipt,
        description: 'QuickBooks Online invoices',
      },
      {
        title: 'Books',
        href: '/admin/books',
        icon: BookOpen,
        description: 'Receipt & transaction matching',
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
        title: 'Bookings',
        href: '/admin/scheduler/bookings',
        icon: CalendarCheck,
        description: 'Scheduled appointments',
      },
    ],
  },
  {
    title: 'Customers',
    color: 'text-emerald-600 dark:text-emerald-400',
    items: [
      {
        title: 'Customers',
        href: '/admin/crm',
        icon: UserCircle,
        description: 'Customer relationship management',
        minRole: 'customer_service',
      },
      {
        title: 'Communications',
        href: '/admin/comms',
        icon: Mail,
        description: 'Email & SMS messaging',
        minRole: 'customer_service',
      },
      {
        title: 'Testimonials',
        href: '/admin/testimonials',
        icon: MessageSquare,
        description: 'Manage customer reviews',
      },
    ],
  },
  {
    title: 'Admin',
    color: 'text-purple-600 dark:text-purple-400',
    items: [
      {
        title: 'Configurator',
        href: '/admin/configurator/rules',
        icon: SlidersHorizontal,
        description: 'Manage configurator rules',
        minRole: 'admin',
      },
      {
        title: 'Team',
        href: '/admin/team',
        icon: Users,
        description: 'Manage team members',
        minRole: 'admin',
      },
      {
        title: 'FOMO Banners',
        href: '/admin/fomo',
        icon: Megaphone,
        description: 'Manage urgency banners',
        minRole: 'admin',
      },
      {
        title: 'Business Contacts',
        href: '/admin/contacts',
        icon: Building2,
        description: 'Vendors, suppliers, partners',
        minRole: 'admin',
      },
      {
        title: 'Tools',
        href: '/admin/tools',
        icon: Wrench,
        description: 'Software subscriptions & services',
        minRole: 'admin',
      },
      {
        title: 'Audit Logs',
        href: '/admin/audit',
        icon: FileText,
        description: 'View system activity logs',
        minRole: 'admin',
      },
    ],
  },
]

/**
 * Flat list of all admin nav items (for backwards compatibility and breadcrumbs)
 */
export const adminNavItems: AdminNavItem[] = adminNavSections.flatMap(
  (section) => section.items
)

/**
 * Secondary nav items (user-specific)
 */
export const adminUserNavItems: AdminNavItem[] = [
  {
    title: 'Profile',
    href: '/admin/profile',
    icon: User,
    description: 'Your profile information',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Account preferences',
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
 * Get accessible nav sections with filtered items based on user role
 */
export function getAccessibleNavSections(
  sections: AdminNavSection[],
  userRole: UserRole
): AdminNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: getAccessibleNavItems(section.items, userRole),
    }))
    .filter((section) => section.items.length > 0)
}

/**
 * Breadcrumb configuration for admin pages
 */
export interface BreadcrumbItem {
  title: string
  href?: string
}

/**
 * Find the section containing a given href
 */
export function findSectionForHref(href: string): AdminNavSection | null {
  for (const section of adminNavSections) {
    const found = section.items.some((item) => href.startsWith(item.href))
    if (found) return section
  }
  return null
}

/**
 * Find the section containing the current pathname
 */
export function findSectionForPath(pathname: string): AdminNavSection | null {
  for (const section of adminNavSections) {
    const found = section.items.some((item) => {
      if (item.href === '/admin/dashboard') {
        return pathname === item.href
      }
      return pathname.startsWith(item.href)
    })
    if (found) return section
  }
  return null
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

  // Skip if we're on dashboard
  if (pathname === '/admin/dashboard') {
    return breadcrumbs
  }

  // Find the section for this path and add it to breadcrumbs
  const section = findSectionForPath(pathname)
  if (section && section.title !== 'Main') {
    // Add section as a non-clickable breadcrumb (sections don't have their own page)
    breadcrumbs.push({
      title: section.title,
      // No href - section headers aren't clickable pages
    })
  }

  // Skip 'admin' segment, start from index 1
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isLastSegment = i === segments.length - 1

    // Skip if it's dashboard (already added)
    if (segment === 'dashboard') continue

    // Special case: /admin/configurator is a parent path, skip it and let the child handle it
    // This prevents "Configurator > Configurator" breadcrumb
    if (href === '/admin/configurator' && !isLastSegment) {
      continue
    }

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
      // Check if there's a nav item that uses this path as a prefix (parent path)
      const childNavItem = adminNavItems.find(
        (item) => item.href.startsWith(href + '/') && item.href !== href
      )

      if (navItem) {
        // For the last segment, use the segment name (formatted) for clarity
        // e.g., "Rules" for /admin/configurator/rules instead of nav item title "Configurator"
        const title = isLastSegment
          ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
          : navItem.title

        breadcrumbs.push({
          title,
          href: isLastSegment ? undefined : href,
        })
      } else if (childNavItem) {
        // This is a parent path with no dedicated page (e.g., /admin/configurator)
        // Link it to the child nav item's page
        breadcrumbs.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: isLastSegment ? undefined : childNavItem.href,
        })
      } else {
        // Capitalize first letter for unknown segments
        breadcrumbs.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: isLastSegment ? undefined : href,
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
