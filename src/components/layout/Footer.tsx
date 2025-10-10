// src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">EZ Cycle Ramp</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Premium motorcycle loading ramps for pickups, vans, and trailers.
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: <a href="tel:8006874410" className="hover:text-[#F78309]">800-687-4410</a><br />
              Email: <a href="mailto:support@ezcycleramp.com" className="hover:text-[#F78309]">support@ezcycleramp.com</a>
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/aun250" className="text-muted-foreground hover:text-[#F78309]">AUN250 Folding</Link></li>
              <li><Link href="/products/aun210" className="text-muted-foreground hover:text-[#F78309]">AUN210 Standard</Link></li>
              <li><Link href="/products/aun200" className="text-muted-foreground hover:text-[#F78309]">AUN200 Basic</Link></li>
              <li><Link href="/products/accessories" className="text-muted-foreground hover:text-[#F78309]">Accessories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/installation" className="text-muted-foreground hover:text-[#F78309]">Installation Guide</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-[#F78309]">FAQ</Link></li>
              <li><Link href="/warranty" className="text-muted-foreground hover:text-[#F78309]">Warranty</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-[#F78309]">Returns</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-[#F78309]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-[#F78309]">About Us</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-[#F78309]">Blog</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-[#F78309]">Testimonials</Link></li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[#0B5394] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">VO</span>
              </div>
              <div>
                <p className="font-semibold">Veteran Owned</p>
                <p className="text-sm text-muted-foreground">Proudly serving since 1999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[#0B5394] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-bold">A+</span>
              </div>
              <div>
                <p className="font-semibold">BBB A+ Rating</p>
                <p className="text-sm text-muted-foreground">Accredited Business</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NEO-DYNE, USA. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-[#F78309]">Privacy Policy</Link>
            {' â€¢ '}
            <Link href="/terms" className="hover:text-[#F78309]">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}