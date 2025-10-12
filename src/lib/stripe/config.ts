import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'usd',
  shippingCost: 5000, // $50.00 in cents
  freeShippingThreshold: 50000, // $500.00 in cents (free shipping over $500)
  taxRate: 0.08, // 8%
} as const
