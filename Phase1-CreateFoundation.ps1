# EZCR Phase 1: Foundation - Layout & Core Utilities
# Creates: Supabase clients, Header, Footer, Updated Layout

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }

function New-UTF8File {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Log "Phase 1: Creating Foundation"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# 1. Supabase Client (Browser)
Log "Step 1/6: Creating Supabase client utilities..."

$supabaseClient = @'
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
'@

New-UTF8File "src\lib\supabase\client.ts" $supabaseClient
Success "Created: src\lib\supabase\client.ts"

# 2. Supabase Server
$supabaseServer = @'
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
'@

New-UTF8File "src\lib\supabase\server.ts" $supabaseServer
Success "Created: src\lib\supabase\server.ts"

# 3. Header Component
Log "Step 2/6: Creating Header component..."

$header = @'
// src/components/layout/Header.tsx
import Link from 'next/link'
import { ShoppingCart, Search, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="font-bold text-xl text-[#1a1a1a]">EZ CYCLE</span>
          <span className="font-bold text-xl text-[#ff6b35]">RAMP</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/products" className="transition-colors hover:text-[#ff6b35]">
            Products
          </Link>
          <Link href="/configure" className="transition-colors hover:text-[#ff6b35]">
            Configurator
          </Link>
          <Link href="/about" className="transition-colors hover:text-[#ff6b35]">
            About
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[#ff6b35]">
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
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ff6b35] text-white text-xs flex items-center justify-center">
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
            <span role="img" aria-label="US Flag">🇺🇸</span>
            <span className="font-medium">Veteran Owned</span>
          </div>
          <div className="flex items-center space-x-2">
            <span role="img" aria-label="Star">⭐</span>
            <span className="font-medium">BBB A+ Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <span role="img" aria-label="Truck">🚚</span>
            <span className="font-medium">Free Shipping Over $500</span>
          </div>
        </div>
      </div>
    </header>
  )
}
'@

New-UTF8File "src\components\layout\Header.tsx" $header
Success "Created: src\components\layout\Header.tsx"

# 4. Footer Component
Log "Step 3/6: Creating Footer component..."

$footer = @'
// src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">EZ Cycle Ramp</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Premium motorcycle loading ramps for pickups, vans, and trailers.
            </p>
            <p className="text-sm text-muted-foreground">
              📞 <a href="tel:8006874410" className="hover:text-[#ff6b35]">800-687-4410</a><br />
              📧 <a href="mailto:support@ezcycleramp.com" className="hover:text-[#ff6b35]">support@ezcycleramp.com</a>
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/aun250" className="text-muted-foreground hover:text-[#ff6b35]">AUN250 Folding</Link></li>
              <li><Link href="/products/aun210" className="text-muted-foreground hover:text-[#ff6b35]">AUN210 Standard</Link></li>
              <li><Link href="/products/aun200" className="text-muted-foreground hover:text-[#ff6b35]">AUN200 Basic</Link></li>
              <li><Link href="/products/accessories" className="text-muted-foreground hover:text-[#ff6b35]">Accessories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/installation" className="text-muted-foreground hover:text-[#ff6b35]">Installation Guide</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-[#ff6b35]">FAQ</Link></li>
              <li><Link href="/warranty" className="text-muted-foreground hover:text-[#ff6b35]">Warranty</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-[#ff6b35]">Returns</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-[#ff6b35]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-[#ff6b35]">About Us</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-[#ff6b35]">Blog</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-[#ff6b35]">Testimonials</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 NEO-DYNE, USA. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-[#ff6b35]">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-[#ff6b35]">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
'@

New-UTF8File "src\components\layout\Footer.tsx" $footer
Success "Created: src\components\layout\Footer.tsx"

# 5. Update Root Layout
Log "Step 4/6: Updating root layout..."

$layout = @'
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
  description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers. Veteran owned with A+ BBB rating. Free shipping over $500.',
  keywords: ['motorcycle ramp', 'loading ramp', 'truck ramp', 'folding ramp', 'AUN250', 'AUN210'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
'@

New-UTF8File "src\app\layout.tsx" $layout
Success "Updated: src\app\layout.tsx"

# 6. Update Homepage
Log "Step 5/6: Updating homepage..."

$homepage = @'
// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] to-gray-800 text-white py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Load Your Bike with Confidence
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Premium folding and standard motorcycle loading ramps. Made in USA. 
              Veteran owned. A+ BBB rating. Free shipping over $500.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#ff6b35] hover:bg-[#ff6b35]/90">
                <Link href="/products">Shop All Ramps</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link href="/configure">Find Your Perfect Ramp</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4" role="img" aria-label="Strong">💪</div>
              <h3 className="font-semibold text-lg mb-2">Heavy Duty</h3>
              <p className="text-muted-foreground">Built to handle heavy motorcycles with ease</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4" role="img" aria-label="Adjustable">📏</div>
              <h3 className="font-semibold text-lg mb-2">Adjustable Height</h3>
              <p className="text-muted-foreground">Fits various truck bed heights perfectly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4" role="img" aria-label="Easy">🔧</div>
              <h3 className="font-semibold text-lg mb-2">Easy Setup</h3>
              <p className="text-muted-foreground">Simple installation in under an hour</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Ramps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Product cards will be added in Phase 2 */}
            <div className="bg-background border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">AUN250 Folding Ramp</h3>
              <p className="text-2xl font-bold text-[#ff6b35] mb-4">$1,299</p>
              <Button asChild className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90">
                <Link href="/products/aun250">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">AUN210 Standard Ramp</h3>
              <p className="text-2xl font-bold text-[#ff6b35] mb-4">$999</p>
              <Button asChild className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90">
                <Link href="/products/aun210">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">AUN200 Basic Ramp</h3>
              <p className="text-2xl font-bold text-[#ff6b35] mb-4">$799</p>
              <Button asChild className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90">
                <Link href="/products/aun200">View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#ff6b35] text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Ramp Is Right?</h2>
          <p className="text-lg mb-8">Use our configurator to find the perfect ramp for your setup.</p>
          <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
            <Link href="/configure">Start Configurator</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
'@

New-UTF8File "src\app\page.tsx" $homepage
Success "Updated: src\app\page.tsx"

# 7. Create TypeScript types placeholder
Log "Step 6/6: Creating TypeScript types placeholder..."

$types = @'
// src/types/database.ts
// This file will be generated from Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be generated from Supabase
    }
  }
}
'@

New-UTF8File "src\types\database.ts" $types
Success "Created: src\types\database.ts"

Write-Host ""
Write-Host "=============================================="
Success "Phase 1 Complete!"
Write-Host "=============================================="
Write-Host ""
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  1. src\lib\supabase\client.ts (Browser client)"
Write-Host "  2. src\lib\supabase\server.ts (Server client)"
Write-Host "  3. src\components\layout\Header.tsx"
Write-Host "  4. src\components\layout\Footer.tsx"
Write-Host "  5. src\app\layout.tsx (Updated with Header/Footer)"
Write-Host "  6. src\app\page.tsx (Updated homepage)"
Write-Host "  7. src\types\database.ts (Placeholder)"
Write-Host ""
Write-Host "Test it now:" -ForegroundColor Yellow
Write-Host "  1. Run: pnpm dev"
Write-Host "  2. Open: http://localhost:3000"
Write-Host "  3. You should see: Header, Homepage content, Footer"
Write-Host ""
Write-Host "After testing, run Phase2-CreateRoutes.ps1"
Write-Host "=============================================="
