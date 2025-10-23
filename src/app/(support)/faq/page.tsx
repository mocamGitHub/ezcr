// src/app/(support)/faq/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | EZ Cycle Ramp',
  description: 'Find answers to common questions about our motorcycle loading ramps, installation, shipping, warranty, and more.',
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  // Product Questions
  {
    category: 'Product Information',
    question: 'What is the difference between the AUN250, AUN210, and AUN200 models?',
    answer: 'The AUN250 is our premium folding ramp with the highest weight capacity (up to 1,000 lbs) and most adjustability. The AUN210 is our standard model with excellent versatility for most motorcycles (up to 800 lbs). The AUN200 is our basic model, perfect for lighter bikes and budget-conscious buyers (up to 600 lbs).',
  },
  {
    category: 'Product Information',
    question: 'What is the weight capacity of each ramp?',
    answer: 'AUN250: 1,000 lbs | AUN210: 800 lbs | AUN200: 600 lbs. All models include a safety factor of 2:1, meaning they are tested to twice their rated capacity.',
  },
  {
    category: 'Product Information',
    question: 'Will this ramp work with my truck/van/trailer?',
    answer: 'Our ramps are designed to work with most pickup trucks (including lifted trucks up to 6" lift), cargo vans, and trailers. The adjustable height feature accommodates bed heights from 18" to 48". Use our configurator tool to find the perfect fit for your specific setup.',
  },
  {
    category: 'Product Information',
    question: 'Can I use this ramp for an ATV or snowmobile?',
    answer: 'Yes! While designed primarily for motorcycles, our ramps work great for ATVs, snowmobiles, lawn equipment, and other wheeled vehicles within the weight capacity.',
  },
  {
    category: 'Product Information',
    question: 'Are the ramps made in the USA?',
    answer: 'Yes, all EZ Cycle Ramps are designed, manufactured, and assembled in the USA using American steel and components.',
  },

  // Installation
  {
    category: 'Installation',
    question: 'How difficult is the installation?',
    answer: 'Most customers complete installation in 30-60 minutes with basic hand tools. No welding or permanent modifications required. Our step-by-step installation guide and video tutorials make the process straightforward. We also offer phone support if you need assistance.',
  },
  {
    category: 'Installation',
    question: 'What tools do I need for installation?',
    answer: 'You will need: Socket wrench set (SAE), adjustable wrench, Phillips and flathead screwdrivers, measuring tape, and a drill with bits. All mounting hardware is included.',
  },
  {
    category: 'Installation',
    question: 'Do I need to drill holes in my truck bed?',
    answer: 'For the most secure installation, we recommend using the included mounting hardware which requires drilling. However, we also offer a no-drill option using heavy-duty clamps (sold separately as an accessory).',
  },
  {
    category: 'Installation',
    question: 'Can I install it myself or do I need professional help?',
    answer: 'Most customers install the ramp themselves. If you are comfortable with basic mechanical tasks, you should have no problem. Professional installation is available through select dealers if you prefer.',
  },
  {
    category: 'Installation',
    question: 'Will the ramp interfere with my bed liner or tonneau cover?',
    answer: 'Our ramps are designed to work with most bed liners (spray-in and drop-in). For tonneau covers, the ramp folds flat when not in use, allowing most covers to close. Specific compatibility varies by cover type - contact us for details about your setup.',
  },

  // Shipping & Delivery
  {
    category: 'Shipping & Delivery',
    question: 'How long does shipping take?',
    answer: 'Standard shipping typically takes 5-7 business days. Expedited shipping (2-3 days) is available for an additional fee. You will receive a tracking number via email once your order ships.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free standard ground shipping on all orders over $500. Orders under $500 have a flat shipping rate of $49.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Do you ship internationally?',
    answer: 'Currently, we ship to all 50 US states, Canada, and US military APO/FPO addresses. International shipping rates and times vary by location. Contact us for a shipping quote to your country.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How is the ramp packaged for shipping?',
    answer: 'Ramps are packaged in a heavy-duty cardboard box with protective foam. Total package dimensions are approximately 72" x 18" x 12" and weight varies by model (85-120 lbs). Signature may be required upon delivery.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Can I arrange my own freight?',
    answer: 'Yes, we can ship to a freight forwarder or arrange for pickup at our facility. Contact us before placing your order to coordinate.',
  },

  // Warranty & Returns
  {
    category: 'Warranty & Returns',
    question: 'What is your warranty policy?',
    answer: 'All ramps come with a lifetime warranty against manufacturing defects. This covers materials and workmanship for as long as you own the ramp. Normal wear and tear, misuse, or modifications are not covered. See our full warranty page for details.',
  },
  {
    category: 'Warranty & Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day money-back guarantee. If you are not completely satisfied, you can return the ramp in original condition for a full refund (minus shipping costs). Ramp must be unused and in original packaging. Restocking fee may apply to opened products.',
  },
  {
    category: 'Warranty & Returns',
    question: 'What if my ramp arrives damaged?',
    answer: 'Inspect your shipment immediately upon delivery. If there is visible damage to the packaging or ramp, note it on the delivery receipt and contact us within 48 hours. We will arrange for a replacement at no cost to you.',
  },
  {
    category: 'Warranty & Returns',
    question: 'How do I make a warranty claim?',
    answer: 'Contact our customer service team at support@ezcycleramp.com or call 800-687-4410. Provide your order number, photos of the issue, and a description. We will review and process your claim typically within 2-3 business days.',
  },

  // Usage & Safety
  {
    category: 'Usage & Safety',
    question: 'Is it safe to load my motorcycle alone?',
    answer: 'Yes, when used properly with our safety guidelines. We recommend having a helper for larger/heavier bikes. Always use the safety strap (included), ensure the ramp is secure, and practice on level ground before attempting on an incline.',
  },
  {
    category: 'Usage & Safety',
    question: 'Can I use the ramp on uneven ground?',
    answer: 'For safety, the vehicle should be on level ground whenever loading or unloading. The ramp itself can handle slight variations, but significant unevenness can affect stability and safety.',
  },
  {
    category: 'Usage & Safety',
    question: 'How do I maintain the ramp?',
    answer: 'Periodically check all bolts and connections for tightness. Keep the ramp surface clean and free of debris. Store in a dry location when possible to prevent rust. Apply a light coating of oil to moving parts annually. Avoid exposing to road salt when possible.',
  },
  {
    category: 'Usage & Safety',
    question: 'What is the maximum incline angle?',
    answer: 'For safety, we recommend keeping the angle under 30 degrees. Our ramps are adjustable to accommodate different truck bed heights while maintaining a safe loading angle.',
  },
  {
    category: 'Usage & Safety',
    question: 'Can I leave the ramp installed all the time?',
    answer: 'Yes, many customers leave the ramp installed permanently. The folding models can stay folded in the bed when not in use. However, removing the ramp when not needed can extend its life and reduce exposure to weather.',
  },

  // Ordering & Payment
  {
    category: 'Ordering & Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and wire transfers for large orders. Business purchase orders are accepted from qualified accounts.',
  },
  {
    category: 'Ordering & Payment',
    question: 'Do you offer financing?',
    answer: 'Yes, we offer financing through Affirm and PayPal Credit. Apply at checkout to see your options. Approval is instant for most customers.',
  },
  {
    category: 'Ordering & Payment',
    question: 'Can I get a discount for bulk orders?',
    answer: 'Yes! We offer volume discounts for dealers, fleet purchases, and bulk orders of 3+ ramps. Contact our sales team at sales@ezcycleramp.com for a custom quote.',
  },
  {
    category: 'Ordering & Payment',
    question: 'Do you offer military or veteran discounts?',
    answer: 'Yes, we offer a 10% discount for active military, veterans, and first responders. Contact us with proof of service to receive your discount code.',
  },

  // Technical Support
  {
    category: 'Technical Support',
    question: 'What if I lose a part or need a replacement?',
    answer: 'Replacement parts are available for all current and past models. Contact customer service with your model number and we will help you identify and order the correct part.',
  },
  {
    category: 'Technical Support',
    question: 'Can I upgrade my ramp with accessories later?',
    answer: 'Yes! We offer various accessories including side rails, wheel chocks, tie-down anchors, and storage bags. All accessories are compatible with our current ramp models.',
  },
  {
    category: 'Technical Support',
    question: 'Do you provide phone support?',
    answer: 'Yes, our customer service team is available Monday-Friday 8 AM - 6 PM EST and Saturday 9 AM - 2 PM EST at 800-687-4410. You can also email support@ezcycleramp.com 24/7.',
  },
]

export default function FAQPage() {
  // Group FAQs by category
  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-blue-100">
            Find answers to common questions about our motorcycle loading ramps
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-b bg-muted/30 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold mb-3">Jump to section:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1 bg-background border rounded-md text-sm hover:bg-[#F78309] hover:text-white hover:border-[#F78309] transition-colors"
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((category) => {
            const categoryFaqs = faqs.filter(faq => faq.category === category)

            return (
              <div
                key={category}
                id={category.toLowerCase().replace(/\s+/g, '-')}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
                  {category}
                </h2>
                <div className="space-y-6">
                  {categoryFaqs.map((faq, index) => (
                    <div key={index} className="border-l-4 border-[#F78309] pl-4">
                      <h3 className="font-semibold text-lg mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is here to help you find the perfect ramp for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/configure">Use Ramp Configurator</Link>
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
