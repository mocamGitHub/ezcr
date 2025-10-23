// src/components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, User, Sun, Moon, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartButton } from '@/components/cart/CartButton'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useState } from 'react'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setShowUserMenu(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex h-20 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center">
          <Image
            src="/logo.png"
            alt="EZ Cycle Ramp Logo"
            width={180}
            height={60}
            priority
            className="h-auto w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/products" className="transition-colors hover:text-[#F78309]">
            Products
          </Link>
          <Link href="/configure" className="transition-colors hover:text-[#F78309]">
            Configurator
          </Link>
          <Link href="/gallery" className="transition-colors hover:text-[#F78309]">
            Gallery
          </Link>
          <Link href="/about" className="transition-colors hover:text-[#F78309]">
            About
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[#F78309]">
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <Link href="/login">
              <Button variant="ghost" size="icon" aria-label="Sign In">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <CartButton />
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

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