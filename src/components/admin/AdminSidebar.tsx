'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'
import {
  adminNavItems,
  adminUserNavItems,
  getAccessibleNavItems,
  type AdminNavItem,
} from '@/config/admin-nav'
import { type UserRole } from '@/lib/permissions'

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== null) {
      setCollapsed(stored === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState))
  }

  const userRole = (profile?.role as UserRole) || 'viewer'
  const mainNavItems = getAccessibleNavItems(adminNavItems, userRole)
  const userNavItems = getAccessibleNavItems(adminUserNavItems, userRole)

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href) ?? false
  }

  const NavItem = ({
    item,
    showTooltip = false,
  }: {
    item: AdminNavItem
    showTooltip?: boolean
  }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    const content = (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          active
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground',
          collapsed && !mobileOpen && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
        {(!collapsed || mobileOpen) && <span>{item.title}</span>}
      </Link>
    )

    if (showTooltip && collapsed && !mobileOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.description && (
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          'flex h-14 items-center border-b px-4',
          collapsed && !isMobile && 'justify-center px-2'
        )}
      >
        {(!collapsed || isMobile) && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-semibold"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-primary">EZ</span>
            <span>Admin</span>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn('ml-auto h-8 w-8', collapsed && 'ml-0')}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <TooltipProvider>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                showTooltip={!isMobile}
              />
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-2 py-4">
        <TooltipProvider>
          <nav className="flex flex-col gap-1">
            {userNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                showTooltip={!isMobile}
              />
            ))}

            {/* Theme Toggle */}
            {collapsed && !isMobile ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors justify-center',
                      'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5 shrink-0" />
                    ) : (
                      <Moon className="h-5 w-5 shrink-0" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={toggleTheme}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                )}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 shrink-0" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" />
                )}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
            )}

            {/* Sign Out */}
            {collapsed && !isMobile ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut()}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors justify-center',
                      'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false)
                  signOut()
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Sign out</span>
              </button>
            )}
          </nav>
        </TooltipProvider>

        {/* User info (when expanded) */}
        {(!collapsed || isMobile) && profile && (
          <div className="mt-4 px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground truncate">
              {profile.first_name || profile.email}
            </div>
            <div className="truncate">{profile.role}</div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen border-r bg-background transition-all duration-300 md:block',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
