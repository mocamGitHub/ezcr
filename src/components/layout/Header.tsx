// src/components/layout/Header.tsx
import Link from 'next/link'
import { ShoppingCart, Search, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
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
          <Button variant="ghost" size="icon" aria-label="Account">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F78309] text-white text-xs flex items-center justify-center">
              0
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="border-t bg-muted/50">
        <div className="container flex items-center justify-center py-2 space-x-8 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Veteran Owned</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">BBB A+ Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Free Shipping Over $500</span>
          </div>
        </div>
      </div>
    </header>
  )
}