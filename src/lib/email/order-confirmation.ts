// Temporary stub for staging deployment - bypasses Html import issue

export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  // Temporary: Skip email sending for staging deployment
  console.log('Email sending disabled for staging deployment', {
    to: data.customerEmail,
    orderNumber: data.orderNumber
  })

  return {
    success: true,
    error: undefined
  }
}