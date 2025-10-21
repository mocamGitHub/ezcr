// src/lib/shipping/tforce-client.ts
/**
 * T-Force Freight API Client
 * Provides real-time shipping rate calculations based on customer location
 * Documentation: https://developer.tforce.com/
 */

export interface TForceRateRequest {
  origin: {
    city: string
    state: string
    zip: string
    country: string
  }
  destination: {
    city: string
    state: string
    zip: string
    country: string
    residential: boolean
  }
  shipment: {
    pieces: Array<{
      weight: number
      weightUnit: 'LBS'
      length: number
      width: number
      height: number
      dimensionUnit: 'IN'
      packagingType: string
      freightClass: string
    }>
    declaredValue: number
    currency: 'USD'
  }
  serviceOptions?: {
    liftgatePickup?: boolean
    liftgateDelivery?: boolean
    residentialDelivery?: boolean
    insideDelivery?: boolean
  }
}

export interface TForceRate {
  serviceLevel: string
  serviceName: string
  totalCharges: number
  baseRate?: number
  fuelSurcharge?: number
  additionalCharges?: Array<{
    type: string
    amount: number
  }>
  transitDays: number
  estimatedDeliveryDate: string
  currency: 'USD'
}

export interface TForceRateResponse {
  rateQuoteId: string
  rates: TForceRate[]
}

/**
 * Product specifications for EZCR ramps
 */
const PRODUCT_SPECS = {
  AUN250: {
    weight: 120,
    dimensions: { length: 89, width: 14, height: 8 },
    freightClass: '70',
  },
  AUN210: {
    weight: 95,
    dimensions: { length: 89, width: 12, height: 6 },
    freightClass: '70',
  },
  AUN200: {
    weight: 85,
    dimensions: { length: 89, width: 12, height: 6 },
    freightClass: '85',
  },
}

/**
 * T-Force Freight API Client
 */
export class TForceFreightClient {
  private apiKey: string | undefined
  private clientId: string | undefined
  private clientSecret: string | undefined
  private accountNumber: string | undefined
  private baseUrl = 'https://api.tforce.com/freight/v1'
  private warehouseOrigin = {
    city: process.env.WAREHOUSE_CITY || 'Phoenix',
    state: process.env.WAREHOUSE_STATE || 'AZ',
    zip: process.env.WAREHOUSE_ZIP || '85001',
    country: 'US',
  }

  constructor() {
    this.apiKey = process.env.TFORCE_API_KEY
    this.clientId = process.env.TFORCE_CLIENT_ID
    this.clientSecret = process.env.TFORCE_CLIENT_SECRET
    this.accountNumber = process.env.TFORCE_ACCOUNT_NUMBER
  }

  /**
   * Check if T-Force API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId && this.clientSecret && this.accountNumber)
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('T-Force API credentials not configured')
    }

    const response = await fetch('https://api.tforce.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get T-Force access token')
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Get shipping rates from T-Force API
   */
  async getRates(request: TForceRateRequest): Promise<TForceRate[]> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': this.apiKey!,
      },
      body: JSON.stringify({
        ...request,
        accountNumber: this.accountNumber,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      console.error('T-Force API error:', error)
      throw new Error(`T-Force API error: ${error.message || response.statusText}`)
    }

    const data: TForceRateResponse = await response.json()
    return data.rates || []
  }

  /**
   * Calculate shipping for EZCR products
   */
  async calculateShipping(args: {
    city: string
    state: string
    zip: string
    country?: string
    residential?: boolean
    products?: Array<{
      sku: string
      quantity: number
    }>
    product_sku?: string // For single product quotes
  }): Promise<{
    success: boolean
    rates?: TForceRate[]
    cost?: number
    delivery_days?: string
    free_shipping?: boolean
    message: string
    error?: string
  }> {
    try {
      // Determine products to ship
      const products = args.products || (args.product_sku ? [{ sku: args.product_sku, quantity: 1 }] : [])

      if (products.length === 0) {
        // Default to AUN210 for generic quotes
        products.push({ sku: 'AUN210', quantity: 1 })
      }

      // Build shipment pieces from products
      const pieces: TForceRateRequest['shipment']['pieces'] = []
      let totalValue = 0

      for (const product of products) {
        const sku = product.sku.toUpperCase() as keyof typeof PRODUCT_SPECS
        const spec = PRODUCT_SPECS[sku] || PRODUCT_SPECS.AUN210

        for (let i = 0; i < product.quantity; i++) {
          pieces.push({
            weight: spec.weight,
            weightUnit: 'LBS',
            length: spec.dimensions.length,
            width: spec.dimensions.width,
            height: spec.dimensions.height,
            dimensionUnit: 'IN',
            packagingType: 'BOX',
            freightClass: spec.freightClass,
          })
        }

        // Calculate product value (for insurance)
        const price = sku === 'AUN250' ? 1299 : sku === 'AUN210' ? 999 : 799
        totalValue += price * product.quantity
      }

      // Prepare rate request
      const rateRequest: TForceRateRequest = {
        origin: this.warehouseOrigin,
        destination: {
          city: args.city,
          state: args.state,
          zip: args.zip,
          country: args.country || 'US',
          residential: args.residential !== false,
        },
        shipment: {
          pieces,
          declaredValue: totalValue,
          currency: 'USD',
        },
        serviceOptions: {
          liftgateDelivery: args.residential !== false,
          residentialDelivery: args.residential !== false,
        },
      }

      // Get rates from T-Force
      const rates = await this.getRates(rateRequest)

      if (!rates || rates.length === 0) {
        return {
          success: false,
          message: 'No shipping rates available for this location. Please call 800-687-4410 for a quote.',
          error: 'No rates returned from T-Force',
        }
      }

      // Find standard rate (cheapest option)
      const standardRate = rates.find((r) => r.serviceLevel === 'STANDARD') || rates[0]

      // Apply free shipping policy (orders over $500)
      const freeShipping = totalValue >= 500

      return {
        success: true,
        rates,
        cost: freeShipping ? 0 : standardRate.totalCharges,
        delivery_days: `${standardRate.transitDays}`,
        free_shipping: freeShipping,
        message: freeShipping
          ? `Free shipping! Your order qualifies for free freight delivery (${standardRate.transitDays} business days to ${args.city}, ${args.state}).`
          : `Shipping to ${args.city}, ${args.state} (${args.zip}): $${standardRate.totalCharges.toFixed(2)} (${standardRate.transitDays} business days). Orders over $500 ship free!`,
      }
    } catch (error) {
      console.error('T-Force shipping calculation error:', error)
      return {
        success: false,
        message: 'Unable to calculate shipping via T-Force. Please call 800-687-4410 for a quote.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get fallback shipping estimate (when T-Force API is unavailable)
   */
  static getFallbackEstimate(args: {
    zip: string
    product_sku?: string
    country?: string
  }): {
    success: boolean
    cost: number
    delivery_days: string
    free_shipping: boolean
    message: string
  } {
    const country = args.country || 'US'
    const zipCode = args.zip

    // International shipping
    if (country !== 'US') {
      return {
        success: true,
        cost: 150,
        delivery_days: '10-14',
        free_shipping: false,
        message: 'International shipping: $150 (10-14 business days). Additional customs fees may apply.',
      }
    }

    // Zone-based estimate (fallback logic)
    const getZone = (zip: string): number => {
      const firstDigit = parseInt(zip[0])
      if (firstDigit <= 2) return 1 // East Coast
      if (firstDigit <= 6) return 2 // Central
      return 3 // West Coast
    }

    const zone = getZone(zipCode)
    const baseCost = [49, 59, 69][zone - 1]
    const deliveryDays = ['5-7', '6-8', '7-9'][zone - 1]

    // Check product value for free shipping
    const productValue = args.product_sku === 'AUN200' ? 799 : args.product_sku === 'AUN210' ? 999 : 1299
    const freeShipping = productValue >= 500

    return {
      success: true,
      cost: freeShipping ? 0 : baseCost,
      delivery_days: deliveryDays,
      free_shipping: freeShipping,
      message: freeShipping
        ? `Free shipping! Your order qualifies for free freight delivery (${deliveryDays} business days).`
        : `Estimated shipping to ${zipCode}: $${baseCost} (${deliveryDays} business days). Orders over $500 ship free!`,
    }
  }
}
