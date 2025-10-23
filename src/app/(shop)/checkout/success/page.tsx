'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Lottie from 'lottie-react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Home, Package } from 'lucide-react'
import successAnimation from '@/public/animations/success.json'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Verify the session if needed
    if (!sessionId) {
      console.warn('No session ID found')
    }
  }, [sessionId])

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-48">
            <Lottie
              animationData={successAnimation}
              loop={false}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-green-600 dark:text-green-400">
            Order Confirmed!
          </h1>

          <p className="text-xl text-muted-foreground">
            Thank you for your purchase
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mt-8">
            <p className="text-sm text-muted-foreground mb-2">
              Order confirmation sent to your email
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono">
                Session ID: {sessionId.substring(0, 24)}...
              </p>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-background border rounded-lg p-6 mt-8 text-left">
            <h2 className="text-lg font-semibold mb-4 text-center">What's Next?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0B5394] text-sm font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent you an order confirmation with all the details
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0B5394] text-sm font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">We'll prepare your order</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will carefully package your bike ramp(s)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0B5394] text-sm font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Track your shipment</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive tracking information via email once shipped
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0B5394] text-sm font-semibold">4</span>
                </div>
                <div>
                  <p className="font-medium">Delivery to your door</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will arrive within 3-7 business days
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-[#0B5394] hover:bg-[#0B5394]/90">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">
                <Package className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Support Information */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Questions about your order?{' '}
              <Link href="/contact" className="text-[#0B5394] hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
