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
              <li><Link href="/#configurator" className="text-muted-foreground hover:text-[#F78309]">Quick Ramp Finder</Link></li>
              <li><Link href="/configure" className="text-muted-foreground hover:text-[#F78309]">Full Configurator</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">Support</h3>
            <ul className="space-y-1.5 text-xs md:text-sm">
              <li><Link href="/faq" className="text-muted-foreground hover:text-[#F78309]">FAQ</Link></li>
              <li><Link href="/track-order" className="text-muted-foreground hover:text-[#F78309]">Track Order</Link></li>
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
            {/* Veteran Owned - Flag-Inspired Shield */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                <svg viewBox="0 0 56 56" className="w-full h-full">
                  {/* Shield background */}
                  <path
                    d="M28 4 L50 12 L50 28 C50 42 28 52 28 52 C28 52 6 42 6 28 L6 12 Z"
                    fill="#0B5394"
                  />
                  {/* Red stripes */}
                  <path d="M12 20 L44 20 L44 24 L12 24 Z" fill="#B91C1C" />
                  <path d="M12 32 L44 32 L44 36 L12 36 Z" fill="#B91C1C" />
                  {/* Star */}
                  <path
                    d="M28 10 L30 16 L36 16 L31 20 L33 26 L28 22 L23 26 L25 20 L20 16 L26 16 Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-xs md:text-sm">Veteran Owned</p>
                <p className="text-xs text-muted-foreground hidden md:block">Since 1999</p>
              </div>
            </div>
            {/* BBB A+ - Verified Shield */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                <svg viewBox="0 0 56 56" className="w-full h-full">
                  {/* Shield */}
                  <path
                    d="M28 4 L48 10 L48 26 C48 40 28 50 28 50 C28 50 8 40 8 26 L8 10 Z"
                    fill="#00529B"
                  />
                  {/* Inner shield */}
                  <path
                    d="M28 8 L44 13 L44 25 C44 37 28 46 28 46 C28 46 12 37 12 25 L12 13 Z"
                    fill="white"
                  />
                  {/* A+ text */}
                  <text x="28" y="28" textAnchor="middle" fontSize="14" fontWeight="900" fill="#00529B">A+</text>
                  {/* Checkmark circle */}
                  <circle cx="40" cy="40" r="10" fill="#22C55E" />
                  <path d="M35 40 L38 43 L45 36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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