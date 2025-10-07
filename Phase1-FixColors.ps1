# EZCR Phase 1 Fix: Correct Brand Colors
# Updates all components to use correct brand colors

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }

function New-UTF8File {
    param([string]$Path, [string]$Content)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Log "Fixing Brand Colors & Logo"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# Correct brand colors
$PRIMARY_BLUE = "#0B5394"
$SECONDARY_ORANGE = "#F78309"
$TERTIARY_GRAY = "#CCCCCC"

# 1. Update Header with correct colors
Log "Step 1/5: Updating Header with correct colors..."

$header = @"
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
          <Link href="/products" className="transition-colors hover:text-[$SECONDARY_ORANGE]">
            Products
          </Link>
          <Link href="/configure" className="transition-colors hover:text-[$SECONDARY_ORANGE]">
            Configurator
          </Link>
          <Link href="/about" className="transition-colors hover:text-[$SECONDARY_ORANGE]">
            About
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[$SECONDARY_ORANGE]">
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
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[$SECONDARY_ORANGE] text-white text-xs flex items-center justify-center">
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
            <span className="font-medium">Free Shipping Over `$500</span>
          </div>
        </div>
      </div>
    </header>
  )
}
"@

New-UTF8File "src\components\layout\Header.tsx" $header
Success "Updated: Header with logo and correct colors"

# 2. Update Footer
Log "Step 2/5: Updating Footer..."

$footer = @"
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
              Phone: <a href="tel:8006874410" className="hover:text-[$SECONDARY_ORANGE]">800-687-4410</a><br />
              Email: <a href="mailto:support@ezcycleramp.com" className="hover:text-[$SECONDARY_ORANGE]">support@ezcycleramp.com</a>
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/aun250" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">AUN250 Folding</Link></li>
              <li><Link href="/products/aun210" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">AUN210 Standard</Link></li>
              <li><Link href="/products/aun200" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">AUN200 Basic</Link></li>
              <li><Link href="/products/accessories" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Accessories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/installation" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Installation Guide</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">FAQ</Link></li>
              <li><Link href="/warranty" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Warranty</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Returns</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">About Us</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Blog</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-[$SECONDARY_ORANGE]">Testimonials</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NEO-DYNE, USA. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-[$SECONDARY_ORANGE]">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-[$SECONDARY_ORANGE]">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
"@

New-UTF8File "src\components\layout\Footer.tsx" $footer
Success "Updated: Footer with correct colors"

# 3. Update Homepage
Log "Step 3/5: Updating Homepage..."

$homepage = @"
// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[$PRIMARY_BLUE] to-blue-800 text-white py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Load Your Bike with Confidence
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Premium folding and standard motorcycle loading ramps. Made in USA. 
              Veteran owned. A+ BBB rating. Free shipping over `$500.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[$SECONDARY_ORANGE] hover:bg-[$SECONDARY_ORANGE]/90 text-white">
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
              <div className="text-4xl mb-4 font-bold text-[$PRIMARY_BLUE]">Heavy Duty</div>
              <h3 className="font-semibold text-lg mb-2">Built Tough</h3>
              <p className="text-muted-foreground">Built to handle heavy motorcycles with ease</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[$PRIMARY_BLUE]">Adjustable</div>
              <h3 className="font-semibold text-lg mb-2">Perfect Fit</h3>
              <p className="text-muted-foreground">Fits various truck bed heights perfectly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[$PRIMARY_BLUE]">Easy Setup</div>
              <h3 className="font-semibold text-lg mb-2">Quick Install</h3>
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
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN250 Folding Ramp</h3>
              <p className="text-2xl font-bold text-[$SECONDARY_ORANGE] mb-4">`$1,299</p>
              <Button asChild className="w-full bg-[$PRIMARY_BLUE] hover:bg-[$PRIMARY_BLUE]/90">
                <Link href="/products/aun250">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN210 Standard Ramp</h3>
              <p className="text-2xl font-bold text-[$SECONDARY_ORANGE] mb-4">`$999</p>
              <Button asChild className="w-full bg-[$PRIMARY_BLUE] hover:bg-[$PRIMARY_BLUE]/90">
                <Link href="/products/aun210">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN200 Basic Ramp</h3>
              <p className="text-2xl font-bold text-[$SECONDARY_ORANGE] mb-4">`$799</p>
              <Button asChild className="w-full bg-[$PRIMARY_BLUE] hover:bg-[$PRIMARY_BLUE]/90">
                <Link href="/products/aun200">View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[$SECONDARY_ORANGE] text-white py-16">
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
"@

New-UTF8File "src\app\page.tsx" $homepage
Success "Updated: Homepage with correct colors"

# 4. Update Tailwind config with brand colors
Log "Step 4/5: Updating Tailwind config..."

$tailwindConfig = @"
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // EZCR Brand Colors
        'brand-blue': '$PRIMARY_BLUE',      // Primary
        'brand-orange': '$SECONDARY_ORANGE', // Secondary/Accent
        'brand-gray': '$TERTIARY_GRAY',      // Tertiary
        
        // ShadCN defaults
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
"@

New-UTF8File "tailwind.config.ts" $tailwindConfig
Success "Updated: Tailwind config with brand colors"

# 5. Instructions for logo
Log "Step 5/5: Logo instructions..."

Write-Host ""
Write-Host "=============================================="
Write-Host "LOGO SETUP REQUIRED" -ForegroundColor Yellow
Write-Host "=============================================="
Write-Host ""
Write-Host "Save your logo file as:" -ForegroundColor Cyan
Write-Host "  public/logo.png"
Write-Host ""
Write-Host "The Header component is already configured to use it."
Write-Host ""

Write-Host "=============================================="
Success "Color Fix Complete!"
Write-Host "=============================================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Save logo: public/logo.png"
Write-Host "  2. Refresh browser (Ctrl+Shift+R)"
Write-Host "  3. Colors should now be correct!"
Write-Host ""
Write-Host "Correct colors:" -ForegroundColor Yellow
Write-Host "  Primary Blue:   $PRIMARY_BLUE"
Write-Host "  Secondary Orange: $SECONDARY_ORANGE"
Write-Host "  Tertiary Gray:  $TERTIARY_GRAY"
Write-Host "=============================================="
