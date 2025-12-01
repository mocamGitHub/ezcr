// src/app/(marketing)/terms/page.tsx

export const metadata = {
  title: 'Terms of Service - EZ Cycle Ramp',
  description: 'Terms of Service for EZ Cycle Ramp - Read our terms and conditions for using our website and services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-blue-100">Last updated: December 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-6">
              By accessing or using the EZ Cycle Ramp website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
            </p>

            <h2 className="text-2xl font-bold mb-4">Products and Services</h2>
            <p className="text-muted-foreground mb-6">
              EZ Cycle Ramp offers motorcycle loading ramps and related accessories. All products are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice.
            </p>

            <h2 className="text-2xl font-bold mb-4">Orders and Payment</h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>All orders are subject to acceptance and availability</li>
              <li>Prices are displayed in US dollars unless otherwise stated</li>
              <li>Payment is required at the time of order</li>
              <li>We accept major credit cards and other payment methods as displayed at checkout</li>
              <li>You agree to provide accurate billing and shipping information</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">Shipping and Delivery</h2>
            <p className="text-muted-foreground mb-6">
              Shipping times and costs vary based on location and product selection. Estimated delivery times are not guaranteed. EZ Cycle Ramp is not responsible for delays caused by shipping carriers or circumstances beyond our control.
            </p>

            <h2 className="text-2xl font-bold mb-4">Returns and Refunds</h2>
            <p className="text-muted-foreground mb-6">
              Please contact our customer service team for return authorization before sending any product back. Products must be returned in their original condition and packaging. Refunds will be processed to the original payment method within 7-10 business days of receiving the returned item.
            </p>

            <h2 className="text-2xl font-bold mb-4">Warranty</h2>
            <p className="text-muted-foreground mb-6">
              All EZ Cycle Ramp products come with a 2 Year Neo-Dyne Manufacturers Warranty against defects in materials and workmanship. This warranty does not cover damage caused by misuse, accidents, modifications, or normal wear and tear. Contact us for warranty claims.
            </p>

            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-6">
              To the maximum extent permitted by law, EZ Cycle Ramp shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our products or services. Our total liability shall not exceed the amount paid for the product in question.
            </p>

            <h2 className="text-2xl font-bold mb-4">Product Use and Safety</h2>
            <p className="text-muted-foreground mb-6">
              You are responsible for using our products safely and in accordance with provided instructions. Always observe weight limits and safety guidelines. EZ Cycle Ramp is not liable for injuries or damages resulting from improper use of our products.
            </p>

            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground mb-6">
              All content on this website, including text, images, logos, and graphics, is the property of EZ Cycle Ramp or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or use any content without our written permission.
            </p>

            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground mb-6">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to our website. Your continued use of our website after changes constitutes acceptance of the modified terms.
            </p>

            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-semibold">EZ Cycle Ramp</p>
              <p className="text-muted-foreground">Email: support@ezcycleramp.com</p>
              <p className="text-muted-foreground">Phone: 800-687-4410</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
