// src/app/(marketing)/faq/page.tsx
import { Metadata } from 'next'
import { UniversalChatWidget } from '@/components/chat/UniversalChatWidget'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ - EZ Cycle Ramp',
  description: 'Frequently asked questions about EZ Cycle Ramp motorcycle loading ramps, shipping, warranty, and more.',
}

// FAQ data organized by category
const faqCategories = [
  {
    title: 'Products & Features',
    faqs: [
      {
        question: 'What is the weight capacity of your ramps?',
        answer: 'Our ramps are designed to handle motorcycles up to 1,500 lbs. The AUN250 folding ramp and AUN210 standard ramp both feature heavy-duty aluminum construction with reinforced support beams for maximum stability and safety.',
      },
      {
        question: 'What is the difference between the AUN250 and AUN210?',
        answer: 'The AUN250 is our premium folding ramp that folds in half for easy storage and transport. The AUN210 is a standard one-piece ramp. Both offer the same weight capacity and durability, but the AUN250 is ideal for those with limited storage space.',
      },
      {
        question: 'Are your ramps adjustable for different truck bed heights?',
        answer: 'Yes! Our ramps feature adjustable legs that accommodate various truck bed heights from 18" to 36". This makes them compatible with most pickup trucks, vans, and trailers.',
      },
      {
        question: 'What material are the ramps made from?',
        answer: 'Our ramps are constructed from heavy-duty aircraft-grade aluminum with a non-slip textured surface. This provides excellent durability while keeping the weight manageable for one-person setup.',
      },
    ],
  },
  {
    title: 'Ordering & Shipping',
    faqs: [
      {
        question: 'What are your shipping rates?',
        answer: 'Shipping rates vary based on your location and the products ordered. During checkout, you will see the exact shipping cost calculated for your order. We offer competitive rates and work with reliable carriers to ensure your ramp arrives safely.',
      },
      {
        question: 'How long does shipping take?',
        answer: 'Most orders ship within 1-2 business days. Standard delivery takes 5-7 business days, while expedited shipping options are available at checkout for faster delivery.',
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Currently, we only ship within the United States. We are working on expanding our shipping options to Canada and other countries in the future.',
      },
      {
        question: 'Can I track my order?',
        answer: 'Absolutely! Once your order ships, you will receive a confirmation email with tracking information. You can also log into your account to view order status and tracking details.',
      },
    ],
  },
  {
    title: 'Warranty & Returns',
    faqs: [
      {
        question: 'What is your warranty policy?',
        answer: 'All EZ Cycle Ramp products come with a 2 Year Neo-Dyne Manufacturers Warranty against manufacturing defects. This covers any issues with materials or workmanship under normal use conditions.',
      },
      {
        question: 'How do I make a warranty claim?',
        answer: 'Contact our customer service team at support@ezcycleramp.com or call 800-687-4410 with your order number and a description of the issue. We will work with you to resolve the problem quickly.',
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day satisfaction guarantee. If you are not completely satisfied with your purchase, you can return it within 30 days for a full refund. The product must be in original condition and packaging.',
      },
      {
        question: 'Do I need to pay for return shipping?',
        answer: 'For warranty claims and defective products, we cover all return shipping costs. For standard returns within the 30-day period, the customer is responsible for return shipping.',
      },
    ],
  },
  {
    title: 'Installation & Usage',
    faqs: [
      {
        question: 'How difficult is it to set up the ramp?',
        answer: 'Our ramps are designed for quick and easy setup. Most customers can set up the ramp in under 5 minutes without any tools. The AUN250 folding ramp unfolds and locks into place with a simple pin system.',
      },
      {
        question: 'Can one person load a motorcycle using your ramp?',
        answer: 'Yes! Our ramps are designed with the solo rider in mind. The wide track width and non-slip surface provide stability, making it safe for one person to load their motorcycle. However, we always recommend having a spotter for heavy bikes.',
      },
      {
        question: 'Will the ramp work with my specific truck/trailer?',
        answer: 'Our ramps are compatible with most standard pickup trucks, enclosed trailers, and cargo vans. Use our online configurator to enter your vehicle specifications and we will recommend the best ramp for your setup.',
      },
      {
        question: 'How do I maintain my ramp?',
        answer: 'Minimal maintenance is required. Simply wipe down with a damp cloth after use to remove dirt and debris. Periodically check all pins and locks to ensure they are secure. Store in a dry location when not in use.',
      },
    ],
  },
  {
    title: 'Company & Support',
    faqs: [
      {
        question: 'Is EZ Cycle Ramp a veteran-owned business?',
        answer: 'Yes! EZ Cycle Ramp is proudly veteran-owned and operated since 1999. We understand the importance of quality, reliability, and standing behind our products.',
      },
      {
        question: 'What is your BBB rating?',
        answer: 'We maintain an A+ rating with the Better Business Bureau, reflecting our commitment to customer satisfaction and ethical business practices.',
      },
      {
        question: 'How can I contact customer support?',
        answer: 'You can reach us by phone at 800-687-4410 (Monday-Friday, 9 AM - 5 PM EST), email at support@ezcycleramp.com, or use the chat assistant on this page for instant help.',
      },
      {
        question: 'Do you have a showroom I can visit?',
        answer: 'We primarily operate online to keep our prices competitive. However, you can see our products at various motorcycle shows and events throughout the year. Check our social media for upcoming appearances.',
      },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-gray-200 dark:border-gray-700">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 pr-4">{question}</h3>
        <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0" />
      </summary>
      <div className="pb-4 text-gray-600 dark:text-gray-300 pr-8">
        <p>{answer}</p>
      </div>
    </details>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-blue-100">
              Find answers to common questions about our products, shipping, warranty, and more.
              Can not find what you are looking for? Chat with our assistant below!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* FAQ Sections */}
            <div className="lg:col-span-2 space-y-10">
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h2 className="text-2xl font-bold text-[#0B5394] dark:text-blue-400 mb-4 pb-2 border-b-2 border-[#F78309]">
                    {category.title}
                  </h2>
                  <div className="space-y-1">
                    {category.faqs.map((faq, faqIndex) => (
                      <FAQItem key={faqIndex} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Widget - Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Still have questions?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Chat with our AI assistant for instant answers to your questions.
                </p>
                <UniversalChatWidget embedded pageContext={{ page: 'faq' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat CTA Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="banner"
            title="Can't find your answer?"
            description="Ask Charli, our AI assistant, for instant help with any questions about ramps, shipping, or compatibility."
            buttonText="Ask Charli"
            showIcon={true}
          />
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Our customer support team is here to help Monday through Friday, 9 AM to 5 PM EST.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:800-687-4410"
              className="inline-flex items-center px-6 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#0B5394]/90 transition-colors"
            >
              Call 800-687-4410
            </a>
            <a
              href="mailto:support@ezcycleramp.com"
              className="inline-flex items-center px-6 py-3 bg-[#F78309] text-white rounded-lg hover:bg-[#F78309]/90 transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
