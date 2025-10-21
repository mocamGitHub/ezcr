// src/app/(support)/contact/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Implement API endpoint for contact form submissions
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('Message sent successfully! We will respond within 24 hours.')

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        orderNumber: '',
      })
    } catch (error) {
      toast.error('Failed to send message. Please try again or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-blue-100">
            We're here to help! Reach out with questions, feedback, or support needs.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-background border rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Subject and Order Number */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select a subject...</option>
                        <option value="product_inquiry">Product Inquiry</option>
                        <option value="order_status">Order Status</option>
                        <option value="installation_help">Installation Help</option>
                        <option value="warranty_claim">Warranty Claim</option>
                        <option value="return_request">Return Request</option>
                        <option value="technical_support">Technical Support</option>
                        <option value="billing_question">Billing Question</option>
                        <option value="partnership">Partnership/Dealer Inquiry</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="orderNumber">Order Number (if applicable)</Label>
                      <Input
                        id="orderNumber"
                        name="orderNumber"
                        type="text"
                        value={formData.orderNumber}
                        onChange={handleChange}
                        placeholder="e.g., #12345"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                      placeholder="Please provide as much detail as possible..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For fastest response, include relevant details like your ramp model, truck type, and specific issue.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#F78309] hover:bg-[#F78309]/90"
                      size="lg"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      We typically respond within 24 hours during business days
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">

              {/* Phone */}
              <div className="bg-background border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F78309]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#F78309]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <a href="tel:8006874410" className="text-[#F78309] font-semibold text-lg hover:underline">
                      800-687-4410
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monday-Friday: 8 AM - 6 PM EST<br />
                      Saturday: 9 AM - 2 PM EST
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-background border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0B5394]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <a href="mailto:support@ezcycleramp.com" className="text-[#0B5394] hover:underline break-all">
                      support@ezcycleramp.com
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Response within 24 hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-background border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0B5394]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Mailing Address</h3>
                    <address className="text-sm text-muted-foreground not-italic">
                      NEO-DYNE Manufacturing<br />
                      123 Industrial Parkway<br />
                      Anytown, USA 12345
                    </address>
                  </div>
                </div>
              </div>

              {/* Live Chat */}
              <div className="bg-gradient-to-br from-[#F78309] to-orange-600 text-white rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Live Chat</h3>
                    <p className="text-sm text-white/90 mb-3">
                      Get instant answers from our AI assistant. Available 24/7.
                    </p>
                    <p className="text-xs text-white/75">
                      Look for the chat widget in the bottom-right corner of any page
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Business Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">8 AM - 6 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">9 AM - 2 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Live Chat (AI)</span>
                    <span className="font-medium text-[#F78309]">24/7</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Looking for Quick Answers?</h2>
          <p className="text-muted-foreground mb-6">
            Check out our FAQ page for instant answers to common questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">View FAQ</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/installation">Installation Guide</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/warranty">Warranty Info</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
