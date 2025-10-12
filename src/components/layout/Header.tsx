// src/components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { Search, Menu, User, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartButton } from '@/components/cart/CartButton'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

export function Header() {
  const { theme, toggleTheme } = useTheme()

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

          <Button variant="ghost" size="icon" aria-label="Account">
            <User className="h-5 w-5" />
          </Button>
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