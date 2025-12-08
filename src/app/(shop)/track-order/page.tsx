// src/app/(shop)/track-order/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { Package, Truck, CheckCircle, Clock, Search, AlertCircle, MapPin } from 'lucide-react'

interface OrderStatus {
  status: 'processing' | 'shipped' | 'in_transit' | 'delivered'
  orderNumber: string
  orderDate: string
  estimatedDelivery: string
  trackingNumber?: string
  carrier?: string
  items: { name: string; quantity: number }[]
  timeline: { date: string; status: string; description: string; completed: boolean }[]
}

// Mock order lookup - in production, this would call an API
const mockLookupOrder = (orderNumber: string, email: string): OrderStatus | null => {
  // Simulate different order states based on order number
  if (orderNumber.toLowerCase().startsWith('ez-')) {
    const statuses: OrderStatus['status'][] = ['processing', 'shipped', 'in_transit', 'delivered']
    const lastDigit = parseInt(orderNumber.slice(-1)) || 0
    const status = statuses[lastDigit % 4]

    return {
      status,
      orderNumber: orderNumber.toUpperCase(),
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      trackingNumber: status !== 'processing' ? '1Z999AA10123456784' : undefined,
      carrier: status !== 'processing' ? 'UPS' : undefined,
      items: [
        { name: 'AUN250 Folding Ramp', quantity: 1 },
        { name: 'Wheel Chock', quantity: 1 },
      ],
      timeline: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'Order Placed',
          description: 'Your order has been received and is being processed.',
          completed: true,
        },
        {
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'Processing',
          description: 'Your order is being prepared for shipment.',
          completed: status !== 'processing',
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'Shipped',
          description: 'Your order has been shipped.',
          completed: status === 'in_transit' || status === 'delivered',
        },
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'In Transit',
          description: 'Your package is on its way.',
          completed: status === 'in_transit' || status === 'delivered',
        },
        {
          date: new Date().toLocaleDateString(),
          status: 'Delivered',
          description: 'Your package has been delivered.',
          completed: status === 'delivered',
        },
      ],
    }
  }
  return null
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const result = mockLookupOrder(orderNumber, email)
    if (result) {
      setOrder(result)
    } else {
      setError('Order not found. Please check your order number and email address.')
    }
    setIsLoading(false)
  }

  const getStatusIcon = (status: OrderStatus['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-8 h-8 text-yellow-500" />
      case 'shipped':
        return <Package className="w-8 h-8 text-blue-500" />
      case 'in_transit':
        return <Truck className="w-8 h-8 text-[#0B5394]" />
      case 'delivered':
        return <CheckCircle className="w-8 h-8 text-green-500" />
    }
  }

  const getStatusText = (status: OrderStatus['status']) => {
    switch (status) {
      case 'processing':
        return 'Processing'
      case 'shipped':
        return 'Shipped'
      case 'in_transit':
        return 'In Transit'
      case 'delivered':
        return 'Delivered'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Your Order</h1>
          <p className="text-xl text-blue-100">
            Enter your order details to see the latest shipping status
          </p>
        </div>
      </section>

      {/* Order Lookup Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g., EZ-12345"
                  className="w-full px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#0B5394]"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your order confirmation email
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#0B5394]"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90 py-6 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Looking up order...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Track Order
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Order Status Display */}
          {order && (
            <div className="mt-8 bg-card border rounded-xl overflow-hidden shadow-sm">
              {/* Status Header */}
              <div className="bg-muted/50 p-6 border-b flex items-center gap-4">
                {getStatusIcon(order.status)}
                <div>
                  <p className="text-sm text-muted-foreground">Order {order.orderNumber}</p>
                  <p className="text-2xl font-bold">{getStatusText(order.status)}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6 space-y-6">
                {/* Delivery Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{order.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium">{order.estimatedDelivery}</p>
                  </div>
                  {order.trackingNumber && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Carrier</p>
                        <p className="font-medium">{order.carrier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tracking Number</p>
                        <p className="font-medium text-[#0B5394]">{order.trackingNumber}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Timeline */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Shipping Timeline</h3>
                  <div className="space-y-4">
                    {order.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              event.completed
                                ? 'bg-green-500 border-green-500'
                                : 'bg-background border-muted-foreground/30'
                            }`}
                          />
                          {index < order.timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-full min-h-[40px] ${
                                event.completed ? 'bg-green-500' : 'bg-muted-foreground/30'
                              }`}
                            />
                          )}
                        </div>
                        <div className={event.completed ? '' : 'opacity-50'}>
                          <p className="font-medium">{event.status}</p>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Items in Order</h3>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Help Section */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="card"
            title="Need Help With Your Order?"
            description="Ask Charli about shipping times, order changes, or any other questions."
            buttonText="Chat with Charli"
          />
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our customer service team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:8006874410"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#0B5394]/90 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Call: 800-687-4410
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
