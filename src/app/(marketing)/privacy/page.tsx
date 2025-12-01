// src/app/(marketing)/privacy/page.tsx

export const metadata = {
  title: 'Privacy Policy - EZ Cycle Ramp',
  description: 'Privacy Policy for EZ Cycle Ramp - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-blue-100">Last updated: December 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-6">
              EZ Cycle Ramp (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>

            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We may collect information about you in various ways, including:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, phone number, shipping address, and billing information when you make a purchase or contact us.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited, time spent on pages, and links clicked.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and IP address for analytics purposes.</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your order, account, or inquiries</li>
              <li>Send promotional emails (with your consent)</li>
              <li>Improve our website and customer service</li>
              <li>Prevent fraudulent transactions</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
            <p className="text-muted-foreground mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, processing payments, or delivering products. These providers are bound by confidentiality agreements.
            </p>

            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground mb-6">
              Our website may use cookies to enhance your experience. Cookies are small files stored on your device that help us remember your preferences and understand how you use our site. You can disable cookies in your browser settings, but some features may not function properly.
            </p>

            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
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
