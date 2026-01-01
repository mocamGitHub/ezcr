'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
import { useAdminLayoutOptional } from '@/contexts/AdminLayoutContext'
import {
  adminNavSections,
  adminUserNavItems,
  getAccessibleNavItems,
  getAccessibleNavSections,
  findSectionForPath,
  type AdminNavItem,
} from '@/config/admin-nav'
import { type UserRole } from '@/lib/permissions'

const SECTIONS_COLLAPSED_KEY = 'admin-sections-collapsed'

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const layoutContext = useAdminLayoutOptional()

  // Use context if available, otherwise fall back to local state
  const collapsed = layoutContext?.sidebarCollapsed ?? false
  const setCollapsed = layoutContext?.setSidebarCollapsed

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Load collapsed sections from localStorage
  useEffect(() => {
    const storedSections = localStorage.getItem(SECTIONS_COLLAPSED_KEY)
    if (storedSections) {
      try {
        setCollapsedSections(new Set(JSON.parse(storedSections)))
      } catch {
        // Ignore parse errors - use default collapsed state
        setCollapsedSections(new Set(adminNavSections.map((s) => s.title)))
      }
    } else {
      // Default: all sections collapsed except "Main"
      setCollapsedSections(
        new Set(adminNavSections.filter((s) => s.title !== 'Main').map((s) => s.title))
      )
    }
  }, [])

  // Auto-expand section containing the current page
  useEffect(() => {
    if (!pathname) return
    const currentSection = findSectionForPath(pathname)
    if (currentSection && collapsedSections.has(currentSection.title)) {
      setCollapsedSections((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentSection.title)
        localStorage.setItem(SECTIONS_COLLAPSED_KEY, JSON.stringify([...newSet]))
        return newSet
      })
    }
  }, [pathname])

  // Toggle sidebar collapsed state via context
  const toggleCollapsed = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed)
    }
  }

  // Toggle section collapsed state
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle)
      } else {
        newSet.add(sectionTitle)
      }
      localStorage.setItem(SECTIONS_COLLAPSED_KEY, JSON.stringify([...newSet]))
      return newSet
    })
  }

  const userRole = (profile?.role as UserRole) || 'viewer'
  const navSections = getAccessibleNavSections(adminNavSections, userRole)
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
          <nav className="flex flex-col gap-2">
            {navSections.map((section) => {
              const isSectionCollapsed = collapsedSections.has(section.title)
              return (
                <div key={section.title}>
                  {/* Section Title - clickable to collapse, hidden when sidebar collapsed on desktop */}
                  {(!collapsed || isMobile) && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-md bg-muted/40 hover:bg-muted/70 border border-transparent hover:border-border/50',
                        section.color || 'text-muted-foreground'
                      )}
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 transition-transform duration-200',
                          isSectionCollapsed && '-rotate-90'
                        )}
                      />
                    </button>
                  )}
                  {collapsed && !isMobile && (
                    <div className="h-px bg-border mx-2 mb-2" />
                  )}
                  {/* Section Items - animate collapse */}
                  <div
                    className={cn(
                      'flex flex-col gap-1 overflow-hidden transition-all duration-200',
                      isSectionCollapsed && (!collapsed || isMobile)
                        ? 'max-h-0 opacity-0'
                        : 'max-h-[500px] opacity-100'
                    )}
                  >
                    {section.items.map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        showTooltip={!isMobile}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
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

        {/* User info (when expanded) - clickable to profile */}
        {(!collapsed || isMobile) && profile && (
          <Link
            href="/admin/profile"
            onClick={() => setMobileOpen(false)}
            className="mt-4 px-3 py-2 text-xs text-muted-foreground block rounded-lg hover:bg-accent transition-colors"
          >
            <div className="font-medium text-foreground truncate">
              {profile.first_name || profile.email}
            </div>
            <div className="truncate">{profile.role}</div>
          </Link>
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
