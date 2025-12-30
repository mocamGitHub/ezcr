'use client'

import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils/format'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { getStripe } from '@/lib/stripe/client'
import { toast } from 'sonner'

type FormErrors = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const validatePhone = (phone: string): boolean => {
  // Accept various phone formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX
  return /^[\d\s\-\(\)\.+]{10,}$/.test(phone.replace(/\D/g, ''))
}

const validateZip = (zip: string): boolean => {
  // US ZIP code: 5 digits or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(zip)
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return !value.trim() ? 'This field is required' : undefined
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!validateEmail(value)) return 'Please enter a valid email address'
        return undefined
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!validatePhone(value)) return 'Please enter a valid phone number'
        return undefined
      case 'address':
        return !value.trim() ? 'Street address is required' : undefined
      case 'city':
        return !value.trim() ? 'City is required' : undefined
      case 'state':
        return !value.trim() ? 'State is required' : undefined
      case 'zip':
        if (!value.trim()) return 'ZIP code is required'
        if (!validateZip(value)) return 'Please enter a valid ZIP code (e.g., 12345)'
        return undefined
      default:
        return undefined
    }
  }, [])

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Only validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some products before checking out.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  const shippingCost = 50 // Always $50 shipping
  const tax = cart.totalPrice * 0.08 // 8% tax
  const total = cart.totalPrice + shippingCost + tax

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Get form values
      const firstName = formData.get('firstName') as string
      const lastName = formData.get('lastName') as string
      const email = formData.get('email') as string
      const phone = formData.get('phone') as string
      const address = formData.get('address') as string
      const address2 = formData.get('address2') as string
      const city = formData.get('city') as string
      const state = formData.get('state') as string
      const zip = formData.get('zip') as string
      const country = formData.get('country') as string

      // Prepare shipping address
      const shippingAddress = {
        firstName,
        lastName,
        line1: address,
        line2: address2 || undefined,
        city,
        state,
        postalCode: zip,
        country,
      }

      // Prepare billing address (same as shipping for now)
      const billingAddress = { ...shippingAddress }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.items,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`,
          customerPhone: phone,
          shippingAddress,
          billingAddress,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Clear cart before redirect
      clearCart()

      // Redirect to Stripe Checkout using the URL from the session
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
      setIsProcessing(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="mb-6">
        <Button asChild variant="ghost" className="hover:text-[#0B5394]">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information */}
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      disabled={isProcessing}
                      required
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      disabled={isProcessing}
                      required
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p id="lastName-error" className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    disabled={isProcessing}
                    required
                    onBlur={handleBlur}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    disabled={isProcessing}
                    required
                    placeholder="(555) 123-4567"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="address"
                    name="address"
                    disabled={isProcessing}
                    required
                    onBlur={handleBlur}
                    onChange={handleChange}
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? 'address-error' : undefined}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p id="address-error" className="text-sm text-destructive mt-1">{errors.address}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                  <Input id="address2" name="address2" disabled={isProcessing} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input
                      id="city"
                      name="city"
                      disabled={isProcessing}
                      required
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && (
                      <p id="city-error" className="text-sm text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Input
                      id="state"
                      name="state"
                      disabled={isProcessing}
                      required
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-invalid={!!errors.state}
                      aria-describedby={errors.state ? 'state-error' : undefined}
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && (
                      <p id="state-error" className="text-sm text-destructive mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip">ZIP Code <span className="text-destructive">*</span></Label>
                    <Input
                      id="zip"
                      name="zip"
                      disabled={isProcessing}
                      required
                      placeholder="12345"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-invalid={!!errors.zip}
                      aria-describedby={errors.zip ? 'zip-error' : undefined}
                      className={errors.zip ? 'border-destructive' : ''}
                    />
                    {errors.zip && (
                      <p id="zip-error" className="text-sm text-destructive mt-1">{errors.zip}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue="United States"
                      disabled={isProcessing}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 10h18v4H3v-4zm0-6h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                </svg>
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isProcessing}
              className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Proceed to Payment - {formatPrice(total)}</>
              )}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-background border rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#F78309] text-white text-xs flex items-center justify-center font-medium">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2 text-sm">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="font-semibold text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (estimated)</span>
                <span>{formatPrice(tax)}</span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
