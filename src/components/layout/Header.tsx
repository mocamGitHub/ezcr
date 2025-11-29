// src/components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Menu, User, Sun, Moon, LogOut, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartButton } from '@/components/cart/CartButton'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useState, useCallback } from 'react'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setShowUserMenu(false)
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
    }
  }, [searchQuery, router])

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/configure', label: 'Configurator' },
    { href: '/testimonials', label: 'Reviews' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex h-20 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center flex-shrink-0">
          <Image
            src="/logo.png"
            alt="EZ Cycle Ramp Logo"
            width={180}
            height={60}
            priority
            className="h-auto w-auto max-w-[140px] sm:max-w-[180px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#F78309]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle Switch - Hidden on very small screens */}
          <button
            onClick={toggleTheme}
            className="relative hidden sm:inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ backgroundColor: theme === 'dark' ? '#3b82f6' : '#94a3b8' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="h-3.5 w-3.5 text-blue-600" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              )}
            </span>
          </button>

          {/* User Account */}
          {user && profile ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Account"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-5 w-5" />
              </Button>

              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">
                        Role: {profile.role.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="py-2">
                      {['owner', 'admin', 'customer_service', 'viewer'].includes(profile.role) && (
                        <Link
                          href="/admin/team"
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="Sign In">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <CartButton />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Search Bar - Expandable */}
      {showSearch && (
        <div className="border-t bg-background px-4 py-3">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#0B5394]"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#0B5394] hover:bg-[#0B5394]/90"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-medium transition-colors hover:text-[#F78309] py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile-only items */}
            <div className="pt-4 border-t space-y-4">
              {!user && (
                <Link
                  href="/login"
                  className="flex items-center text-lg font-medium transition-colors hover:text-[#F78309] py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Sign In
                </Link>
              )}

              {/* Theme toggle for mobile */}
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-medium">Dark Mode</span>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? '#3b82f6' : '#94a3b8' }}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg transition-transform ${
                      theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Trust Badges Bar */}
      <div className="border-t bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-2 space-x-8 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Veteran Owned</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">BBB A+ Rating</span>
          </div>
        </div>
      </div>
    </header>
  )
}
