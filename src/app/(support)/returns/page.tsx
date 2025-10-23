// src/app/(support)/returns/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Returns & Refund Policy | EZ Cycle Ramp',
  description: '30-day money-back guarantee on all EZ Cycle Ramp products. Learn about our return policy, refund process, and how to initiate a return.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Returns & Refund Policy
          </h1>
          <p className="text-xl text-blue-100">
            30-day money-back guarantee on all products
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Overview */}
          <div className="mb-12 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600 p-6 rounded-r">
            <h2 className="text-2xl font-bold mb-3 text-[#0B5394]">Our Satisfaction Guarantee</h2>
            <p className="text-lg leading-relaxed">
              We want you to be completely satisfied with your EZ Cycle Ramp purchase. If for any reason
              you are not happy with your ramp, you can return it within <strong>30 days of delivery</strong> for
              a full refund. No questions asked.
            </p>
          </div>

          {/* Return Eligibility */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Return Eligibility
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">30-Day Window</h3>
                  <p className="text-muted-foreground">
                    Returns must be initiated within 30 days of the delivery date (not the order date).
                    The delivery date is confirmed by the shipping carrier tracking information.
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
                  <h3 className="font-semibold mb-1">Original Condition</h3>
                  <p className="text-muted-foreground">
                    The ramp must be in like-new, resalable condition. Light testing is acceptable, but
                    the product should show minimal signs of use. All components, hardware, and accessories
                    must be included.
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
                  <h3 className="font-semibold mb-1">Original Packaging</h3>
                  <p className="text-muted-foreground">
                    Products must be returned in original packaging with all protective materials. If original
                    packaging is damaged or missing, a restocking fee may apply (see below).
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
                  <h3 className="font-semibold mb-1">Authorization Required</h3>
                  <p className="text-muted-foreground">
                    You must obtain a Return Merchandise Authorization (RMA) number before shipping the
                    product back. Unauthorized returns will not be accepted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Initiate a Return */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              How to Initiate a Return
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">1</div>
                  <h3 className="font-semibold text-lg">Contact Customer Service</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Call us at <strong>800-687-4410</strong> or email <strong>support@ezcycleramp.com</strong> within
                  30 days of delivery. Have your order number ready.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">2</div>
                  <h3 className="font-semibold text-lg">Receive RMA Number</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Our team will issue you a Return Merchandise Authorization (RMA) number and provide
                  return shipping instructions. This is typically provided within 1 business day.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">3</div>
                  <h3 className="font-semibold text-lg">Pack & Ship</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Carefully repack the ramp in its original packaging. Write the RMA number clearly on
                  the outside of the box. Ship via a trackable method and keep your tracking number.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold">4</div>
                  <h3 className="font-semibold text-lg">Inspection & Refund</h3>
                </div>
                <p className="text-muted-foreground ml-11">
                  Once we receive and inspect your return, we will process your refund within 5-7 business days.
                  The refund will be issued to your original payment method.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Information */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Refund Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-5">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  What is Refunded
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Full product purchase price</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Original taxes paid</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Accessories purchased with ramp</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-5">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  What is Not Refunded
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Original shipping costs (unless product defect)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Return shipping costs (customer pays)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Restocking fees (if applicable)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Restocking Fees */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Restocking Fees
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="mb-4">
                In most cases, there is <strong>no restocking fee</strong> for returns in original condition
                with original packaging. However, a restocking fee may apply in the following situations:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#F78309] font-bold">•</span>
                  <span><strong>15% restocking fee:</strong> Product opened but in like-new condition without original packaging</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309] font-bold">•</span>
                  <span><strong>25% restocking fee:</strong> Product shows signs of use or installation, missing components, or damaged packaging</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309] font-bold">•</span>
                  <span><strong>No refund:</strong> Products modified, damaged beyond resale condition, or missing major components</span>
                </li>
              </ul>
              <p className="mt-4 text-sm">
                <strong>Note:</strong> Defective products and our errors (wrong item shipped, damaged in transit, etc.)
                have no restocking fee and return shipping is covered by us.
              </p>
            </div>
          </div>

          {/* Return Shipping */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Return Shipping
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-[#F78309] pl-4 py-2">
                <h3 className="font-semibold mb-2">Customer-Initiated Returns</h3>
                <p className="text-muted-foreground">
                  Customers are responsible for return shipping costs. We recommend using a trackable shipping
                  method with insurance, as we cannot be responsible for items lost or damaged in return transit.
                  Estimated return shipping cost: $50-$80 depending on location.
                </p>
              </div>

              <div className="border-l-4 border-green-600 pl-4 py-2">
                <h3 className="font-semibold mb-2">Defective or Incorrect Items</h3>
                <p className="text-muted-foreground">
                  If we shipped the wrong item or the product arrived defective or damaged, we will provide
                  a prepaid return shipping label at no cost to you. We will also expedite the replacement shipment.
                </p>
              </div>
            </div>
          </div>

          {/* Exchanges */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Exchanges
            </h2>
            <p className="text-muted-foreground mb-4">
              We do not offer direct exchanges. If you need a different model or product:
            </p>
            <ol className="space-y-3 ml-6 text-muted-foreground">
              <li className="list-decimal">
                Initiate a return for your current product following the process above
              </li>
              <li className="list-decimal">
                Place a new order for the desired product on our website
              </li>
              <li className="list-decimal">
                Once we receive and process your return, you will receive a refund to your original payment method
              </li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Tip:</strong> Contact us before ordering to ensure you are selecting the right product for your needs.
              Our configurator tool and customer service team can help you choose the perfect ramp the first time.
            </p>
          </div>

          {/* Special Cases */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Special Cases
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Damaged in Transit</h3>
                <p className="text-muted-foreground">
                  Inspect your shipment immediately upon delivery. If there is visible damage to the packaging
                  or product, note it on the delivery receipt and contact us within 48 hours. We will arrange
                  for a replacement at no cost.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Custom or Special Orders</h3>
                <p className="text-muted-foreground">
                  Custom-manufactured products or special orders may have different return policies. These will
                  be communicated at the time of purchase. Generally, custom products are not eligible for return
                  unless defective.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bulk or Fleet Orders</h3>
                <p className="text-muted-foreground">
                  Orders of 3 or more units may have different return terms. Contact our sales team for details
                  on bulk order return policies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">International Returns</h3>
                <p className="text-muted-foreground">
                  International customers are responsible for all return shipping costs, customs fees, and duties.
                  Contact us before returning an international order to discuss the process.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Timeline */}
          <div className="mb-12 bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-[#0B5394]">Refund Processing Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold">RMA Issued:</span>
                <span className="text-muted-foreground">Within 1 business day of request</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Product Ships Back:</span>
                <span className="text-muted-foreground">Customer responsibility</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Inspection:</span>
                <span className="text-muted-foreground">1-3 business days after receipt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Refund Processed:</span>
                <span className="text-muted-foreground">5-7 business days after approval</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Funds in Account:</span>
                <span className="text-muted-foreground">Varies by bank (typically 3-5 days)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help with a Return?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is ready to assist you with your return or answer any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/contact">Initiate Return</Link>
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
