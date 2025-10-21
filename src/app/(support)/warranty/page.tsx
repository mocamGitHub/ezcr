// src/app/(support)/warranty/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Lifetime Warranty | EZ Cycle Ramp',
  description: 'Learn about our lifetime warranty on EZ Cycle Ramp motorcycle loading ramps. Coverage details, exclusions, and how to make a warranty claim.',
}

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Lifetime Warranty
          </h1>
          <p className="text-xl text-blue-100">
            We stand behind the quality of our products with a comprehensive lifetime warranty
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Overview */}
          <div className="mb-12 bg-[#F78309]/10 border-l-4 border-[#F78309] p-6 rounded-r">
            <h2 className="text-2xl font-bold mb-3 text-[#0B5394]">Our Commitment to Quality</h2>
            <p className="text-lg leading-relaxed">
              Every EZ Cycle Ramp is backed by our <strong>Lifetime Limited Warranty</strong> against
              manufacturing defects. This warranty covers materials and workmanship for as long as you own the ramp.
              We take pride in building products that last, and we will stand behind them.
            </p>
          </div>

          {/* What's Covered */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              What is Covered
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Structural Components</h3>
                  <p className="text-muted-foreground">
                    All welded steel frame components, support beams, and structural elements are covered
                    for the lifetime of the product against cracking, breaking, or structural failure.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mechanical Parts</h3>
                  <p className="text-muted-foreground">
                    Hinges, pivot points, adjustment mechanisms, and locking systems are covered against
                    manufacturing defects and premature failure under normal use.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Hardware & Fasteners</h3>
                  <p className="text-muted-foreground">
                    All included mounting hardware, bolts, nuts, and fasteners are covered against defects
                    and premature wear when installed and maintained properly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Powder Coating & Finish</h3>
                  <p className="text-muted-foreground">
                    The powder-coated finish is warranted against peeling, chipping, or bubbling under
                    normal conditions for 5 years from date of purchase.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Workmanship</h3>
                  <p className="text-muted-foreground">
                    All welds, assembly, and manufacturing processes are covered. If a defect in workmanship
                    causes product failure, we will repair or replace it at no cost.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Not Covered */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              What is Not Covered
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Normal Wear and Tear</h3>
                  <p className="text-muted-foreground">
                    Surface scratches, scuffs, minor cosmetic issues, and wear from regular use are not covered.
                    This includes fading from UV exposure and minor surface rust from environmental exposure.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Misuse or Abuse</h3>
                  <p className="text-muted-foreground">
                    Damage caused by exceeding weight capacity, using the ramp for purposes other than intended,
                    or improper loading techniques is not covered.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Modifications</h3>
                  <p className="text-muted-foreground">
                    Any modifications, alterations, or repairs made to the ramp by anyone other than
                    EZ Cycle Ramp or an authorized dealer will void the warranty.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Improper Installation</h3>
                  <p className="text-muted-foreground">
                    Damage resulting from improper installation, failure to follow installation instructions,
                    or use of non-standard mounting hardware is not covered.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Accidents & Acts of Nature</h3>
                  <p className="text-muted-foreground">
                    Damage from vehicle accidents, fire, theft, vandalism, natural disasters, or extreme
                    weather conditions is not covered.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Commercial or Rental Use</h3>
                  <p className="text-muted-foreground">
                    Ramps used commercially, for rental purposes, or in high-volume applications have
                    different warranty terms. Contact us for commercial warranty information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How to File a Claim */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              How to File a Warranty Claim
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">1</div>
                  <h3 className="font-semibold text-lg">Contact Customer Service</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Call us at <strong>800-687-4410</strong> or email <strong>support@ezcycleramp.com</strong>.
                  Have your order number or proof of purchase ready.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">2</div>
                  <h3 className="font-semibold text-lg">Provide Details & Photos</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Describe the issue and provide clear photos showing the defect. Include images from multiple
                  angles if possible. This helps us process your claim quickly.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">3</div>
                  <h3 className="font-semibold text-lg">Claim Review</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Our team will review your claim within 2-3 business days. We may ask additional questions
                  or request more information if needed.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">4</div>
                  <h3 className="font-semibold text-lg">Resolution</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  If your claim is approved, we will either send a replacement part, provide repair instructions,
                  or replace the entire unit depending on the nature of the defect. All shipping costs for
                  warranty replacements are covered by us.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-12 bg-muted/50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-[#0B5394]">Important Notes</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>This warranty is non-transferable and applies only to the original purchaser.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>Proof of purchase is required for all warranty claims.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>Warranty coverage begins on the date of original purchase.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>EZ Cycle Ramp is not liable for incidental or consequential damages.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>Regular maintenance is required to keep the warranty valid. See installation guide for maintenance recommendations.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F78309] font-bold">•</span>
                <span>This warranty gives you specific legal rights. You may also have other rights which vary by state.</span>
              </li>
            </ul>
          </div>

          {/* Registration */}
          <div className="mb-12 border-l-4 border-[#0B5394] pl-6 py-4">
            <h2 className="text-xl font-bold mb-3">Product Registration</h2>
            <p className="text-muted-foreground mb-4">
              While not required, we recommend registering your ramp for faster warranty service and to
              receive product updates, safety notices, and special offers.
            </p>
            <Button className="bg-[#0B5394] hover:bg-[#0B5394]/90">
              Register Your Product
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Our Warranty?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is here to help answer any warranty questions you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">
            <p>
              Phone: <a href="tel:8006874410" className="hover:text-[#F78309]">800-687-4410</a>
              {' | '}
              Email: <a href="mailto:support@ezcycleramp.com" className="hover:text-[#F78309]">support@ezcycleramp.com</a>
            </p>
            <p className="mt-2">
              Monday-Friday 8 AM - 6 PM EST | Saturday 9 AM - 2 PM EST
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
