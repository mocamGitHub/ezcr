// src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Mobile: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center md:text-left">
          {/* Company Info - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <h3 className="font-semibold text-lg mb-3">EZ Cycle Ramp</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Premium motorcycle loading ramps for pickups, vans, and trailers.
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="tel:8006874410" className="hover:text-[#F78309]">800-687-4410</a><br />
              <a href="mailto:support@ezcycleramp.com" className="hover:text-[#F78309] text-xs md:text-sm">support@ezcycleramp.com</a>
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">Products</h3>
            <ul className="space-y-1.5 text-xs md:text-sm">
              <li><Link href="/products" className="text-muted-foreground hover:text-[#F78309]">All Products</Link></li>
              <li><Link href="/configure-smooth" className="text-muted-foreground hover:text-[#F78309]">Configurator</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">Support</h3>
            <ul className="space-y-1.5 text-xs md:text-sm">
              <li><Link href="/faq" className="text-muted-foreground hover:text-[#F78309]">FAQ</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-[#F78309]">Contact</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-3 text-sm md:text-base">Company</h3>
            <ul className="space-y-1.5 text-xs md:text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-[#F78309]">About Us</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-[#F78309]">Reviews</Link></li>
              <li><Link href="/gallery" className="text-muted-foreground hover:text-[#F78309]">Gallery</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-[#F78309]">Blog</Link></li>
            </ul>
          </div>
        </div>

        {/* Trust Badges - Compact on mobile */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-row items-center justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0B5394] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm md:text-lg font-bold">VO</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-xs md:text-sm">Veteran Owned</p>
                <p className="text-xs text-muted-foreground hidden md:block">Since 1999</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0B5394] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm md:text-lg font-bold">A+</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-xs md:text-sm">BBB A+ Rated</p>
                <p className="text-xs text-muted-foreground hidden md:block">Accredited</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - More compact */}
        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>&copy; 2025 EZ Cycle Ramp. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy" className="hover:text-[#F78309]">Privacy</Link>
            {' | '}
            <Link href="/terms" className="hover:text-[#F78309]">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}