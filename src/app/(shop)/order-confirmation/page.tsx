'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'

type Order = {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  status: string
  payment_status: string
  total_amount: number
  shipping_address: any
  created_at: string
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams?.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `/api/orders/by-session?session_id=${sessionId}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }

        const data = await response.json()
        setOrder(data.order)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Unable to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId])

  if (loading) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#0B5394]" />
          <p className="text-muted-foreground">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'We couldn\'t find your order. Please contact support if you need assistance.'}
          </p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-background border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-semibold text-lg">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Date</p>
              <p className="font-semibold text-lg">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="font-semibold text-lg">{formatPrice(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
              <p className="font-semibold text-lg capitalize text-green-600">
                {order.payment_status}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="font-semibold mb-3">Shipping Address</h3>
            <div className="text-sm text-muted-foreground">
              <p>{order.customer_name}</p>
              {order.shipping_address?.line1 && <p>{order.shipping_address.line1}</p>}
              {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
              {order.shipping_address?.city && (
                <p>
                  {order.shipping_address.city}
                  {order.shipping_address.state && `, ${order.shipping_address.state}`}
                  {order.shipping_address.postalCode && ` ${order.shipping_address.postalCode}`}
                </p>
              )}
              {order.shipping_address?.country && <p>{order.shipping_address.country}</p>}
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-background border rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <Package className="h-6 w-6 text-[#0B5394] flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• You&apos;ll receive an email confirmation at {order.customer_email}</li>
                <li>• We&apos;ll send you a shipping confirmation with tracking details once your order ships</li>
                <li>• You can view your order status anytime in your order history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button asChild className="bg-[#0B5394] hover:bg-[#0B5394]/90">
            <Link href="/orders">View Order History</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#0B5394]" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
