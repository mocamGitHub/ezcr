# T-Force Freight API Integration - Shipping Cost Calculator

**Date**: 2025-10-13
**Status**: 📋 Planned - Not Yet Implemented
**Purpose**: Calculate real-time shipping costs based on customer location

---

## Overview

Integrate T-Force Freight API to provide accurate shipping quotes based on:
- Customer's city, state, and ZIP code
- Product weight and dimensions
- Delivery service level (standard, expedited, white glove)
- Residential vs commercial delivery

---

## T-Force Freight API

### API Documentation
- **Provider**: T-Force Freight (formerly UPS Freight)
- **API Endpoint**: `https://api.tforce.com/freight/v1/rates`
- **Documentation**: [https://developer.tforce.com/](https://developer.tforce.com/)
- **Authentication**: API Key + OAuth 2.0

### Required API Credentials

```bash
# Add to .env.local
TFORCE_API_KEY=your_api_key_here
TFORCE_CLIENT_ID=your_client_id
TFORCE_CLIENT_SECRET=your_client_secret
TFORCE_ACCOUNT_NUMBER=your_account_number
```

### Rate Request Format

```json
POST https://api.tforce.com/freight/v1/rates

{
  "origin": {
    "city": "YourCity",
    "state": "ST",
    "zip": "12345",
    "country": "US"
  },
  "destination": {
    "city": "CustomerCity",
    "state": "CA",
    "zip": "90210",
    "country": "US",
    "residential": true
  },
  "shipment": {
    "pieces": [
      {
        "weight": 45,
        "weightUnit": "LBS",
        "length": 89,
        "width": 12,
        "height": 6,
        "dimensionUnit": "IN",
        "packagingType": "BOX",
        "freightClass": "70"
      }
    ],
    "declaredValue": 1299.00,
    "currency": "USD"
  },
  "serviceOptions": {
    "liftgatePickup": false,
    "liftgateDelivery": true,
    "residentialDelivery": true,
    "insideDelivery": false
  }
}
```

### Rate Response Format

```json
{
  "rateQuoteId": "RQ-2025-001",
  "rates": [
    {
      "serviceLevel": "STANDARD",
      "serviceName": "T-Force Standard Freight",
      "totalCharges": 125.50,
      "baseRate": 95.00,
      "fuelSurcharge": 18.50,
      "additionalCharges": [
        {
          "type": "LIFTGATE_DELIVERY",
          "amount": 12.00
        }
      ],
      "transitDays": 5,
      "estimatedDeliveryDate": "2025-10-20",
      "currency": "USD"
    },
    {
      "serviceLevel": "EXPEDITED",
      "serviceName": "T-Force Expedited",
      "totalCharges": 185.75,
      "transitDays": 2,
      "estimatedDeliveryDate": "2025-10-17",
      "currency": "USD"
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: API Integration (Week 1)

#### Step 1.1: Create T-Force Client Library

**File**: `src/lib/shipping/tforce-client.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

interface TForceRateRequest {
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
      length: number
      width: number
      height: number
      freightClass: string
    }>
    declaredValue: number
  }
  serviceOptions?: {
    liftgateDelivery?: boolean
    residentialDelivery?: boolean
    insideDelivery?: boolean
  }
}

interface TForceRate {
  serviceLevel: string
  serviceName: string
  totalCharges: number
  transitDays: number
  estimatedDeliveryDate: string
}

export class TForceFreightClient {
  private apiKey: string
  private clientId: string
  private clientSecret: string
  private accountNumber: string
  private baseUrl = 'https://api.tforce.com/freight/v1'

  constructor() {
    this.apiKey = process.env.TFORCE_API_KEY!
    this.clientId = process.env.TFORCE_CLIENT_ID!
    this.clientSecret = process.env.TFORCE_CLIENT_SECRET!
    this.accountNumber = process.env.TFORCE_ACCOUNT_NUMBER!

    if (!this.apiKey || !this.clientId || !this.clientSecret) {
      throw new Error('T-Force API credentials not configured')
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    const response = await fetch('https://api.tforce.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get T-Force access token')
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Get shipping rates for a shipment
   */
  async getRates(request: TForceRateRequest): Promise<TForceRate[]> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        ...request,
        accountNumber: this.accountNumber,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('T-Force API error:', error)
      throw new Error(`T-Force API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    return data.rates || []
  }

  /**
   * Calculate shipping for EZCR products
   */
  async calculateShipping(
    destination: { city: string; state: string; zip: string; residential?: boolean },
    products: Array<{ sku: string; quantity: number; weight: number; dimensions: { length: number; width: number; height: number }; value: number }>
  ): Promise<TForceRate[]> {
    // EZCR origin (your warehouse/shipping location)
    const origin = {
      city: 'YourCity',  // TODO: Replace with actual warehouse city
      state: 'ST',       // TODO: Replace with actual warehouse state
      zip: '12345',      // TODO: Replace with actual warehouse ZIP
      country: 'US',
    }

    // Map products to shipment pieces
    const pieces = products.flatMap(product =>
      Array(product.quantity).fill({
        weight: product.weight,
        weightUnit: 'LBS',
        length: product.dimensions.length,
        width: product.dimensions.width,
        height: product.dimensions.height,
        dimensionUnit: 'IN',
        packagingType: 'BOX',
        freightClass: this.getFreightClass(product.weight),  // Determine class based on weight/density
      })
    )

    const totalValue = products.reduce((sum, p) => sum + (p.value * p.quantity), 0)

    const serviceOptions = {
      liftgateDelivery: destination.residential !== false,  // Assume residential needs liftgate
      residentialDelivery: destination.residential !== false,
    }

    return this.getRates({
      origin,
      destination: {
        ...destination,
        country: 'US',
        residential: destination.residential !== false,
      },
      shipment: {
        pieces,
        declaredValue: totalValue,
      },
      serviceOptions,
    })
  }

  /**
   * Determine freight class based on weight and density
   * https://www.tforce.com/freight-class-guide
   */
  private getFreightClass(weight: number): string {
    // Simplified freight class determination
    // In production, calculate density (lbs/cubic foot) for accurate classification
    if (weight < 50) return '85'
    if (weight < 100) return '70'
    if (weight < 200) return '65'
    return '60'
  }
}
```

#### Step 1.2: Create Shipping Calculator API

**File**: `src/app/api/shipping/calculate/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { TForceFreightClient } from '@/lib/shipping/tforce-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/shipping/calculate
 * Calculate shipping costs for cart items based on customer location
 */
export async function POST(request: Request) {
  try {
    const { city, state, zip, residential, cartItems } = await request.json()

    // Validate required fields
    if (!city || !state || !zip || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get product details for cart items
    const productIds = cartItems.map((item: any) => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, name, weight_lbs, dimensions, price')
      .in('id', productIds)

    if (productsError || !products) {
      throw new Error('Failed to fetch product details')
    }

    // Map cart items to products with dimensions
    const productsWithQuantity = cartItems.map((item: any) => {
      const product = products.find(p => p.id === item.product_id)
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`)
      }

      return {
        sku: product.sku,
        quantity: item.quantity,
        weight: product.weight_lbs || 45,  // Default weight if not specified
        dimensions: product.dimensions || { length: 89, width: 12, height: 6 },
        value: product.price,
      }
    })

    // Calculate shipping using T-Force
    const tforce = new TForceFreightClient()
    const rates = await tforce.calculateShipping(
      { city, state, zip, residential: residential !== false },
      productsWithQuantity
    )

    return NextResponse.json({
      success: true,
      rates,
      destination: { city, state, zip },
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}
```

### Phase 2: Frontend Integration (Week 2)

#### Step 2.1: Create Shipping Calculator Component

**File**: `src/components/checkout/ShippingCalculator.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package } from 'lucide-react'

interface ShippingRate {
  serviceLevel: string
  serviceName: string
  totalCharges: number
  transitDays: number
  estimatedDeliveryDate: string
}

interface ShippingCalculatorProps {
  cartItems: Array<{ product_id: string; quantity: number }>
  onRateSelected?: (rate: ShippingRate) => void
}

export function ShippingCalculator({ cartItems, onRateSelected }: ShippingCalculatorProps) {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [residential, setResidential] = useState(true)
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateShipping = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          state,
          zip,
          residential,
          cartItems,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate shipping')
      }

      const data = await response.json()
      setRates(data.rates)
    } catch (err) {
      setError('Unable to calculate shipping. Please try again.')
      console.error('Shipping calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectRate = (rate: ShippingRate) => {
    setSelectedRate(rate)
    onRateSelected?.(rate)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4">Calculate Shipping</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Los Angeles"
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="CA"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="90210"
              maxLength={5}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="residential"
            checked={residential}
            onChange={(e) => setResidential(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="residential">Residential address (includes liftgate delivery)</Label>
        </div>

        <Button
          onClick={calculateShipping}
          disabled={loading || !city || !state || !zip}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Shipping'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rates.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Available Shipping Options</h4>
          <div className="space-y-3">
            {rates.map((rate, index) => (
              <button
                key={index}
                onClick={() => selectRate(rate)}
                className={`w-full p-4 border rounded-lg text-left transition-colors ${
                  selectedRate === rate
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{rate.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        Arrives by {new Date(rate.estimatedDeliveryDate).toLocaleDateString()} ({rate.transitDays} business days)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${rate.totalCharges.toFixed(2)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

#### Step 2.2: Integrate into Checkout Flow

```typescript
// src/app/checkout/page.tsx
import { ShippingCalculator } from '@/components/checkout/ShippingCalculator'

export default function CheckoutPage() {
  const [selectedShippingRate, setSelectedShippingRate] = useState(null)

  return (
    <div className="container py-12">
      <h1>Checkout</h1>

      {/* ... other checkout sections ... */}

      <ShippingCalculator
        cartItems={cartItems}
        onRateSelected={(rate) => {
          setSelectedShippingRate(rate)
          // Update order total with shipping cost
        }}
      />

      {/* ... order summary ... */}
    </div>
  )
}
```

### Phase 3: Database Integration (Week 3)

#### Step 3.1: Add Shipping Columns to Orders Table

```sql
-- Migration: Add shipping details to orders
ALTER TABLE orders
ADD COLUMN shipping_carrier VARCHAR(100),
ADD COLUMN shipping_service_level VARCHAR(50),
ADD COLUMN shipping_cost DECIMAL(10,2),
ADD COLUMN shipping_transit_days INTEGER,
ADD COLUMN tforce_rate_quote_id VARCHAR(100);

-- Add index for shipping tracking
CREATE INDEX idx_orders_shipping ON orders(shipping_carrier, tracking_number);
```

#### Step 3.2: Store Shipping Rate with Order

```typescript
// When creating order, save shipping details
const { data: order } = await supabase
  .from('orders')
  .insert({
    // ... other order fields ...
    shipping_carrier: 'T-Force Freight',
    shipping_service_level: selectedRate.serviceLevel,
    shipping_cost: selectedRate.totalCharges,
    shipping_transit_days: selectedRate.transitDays,
    expected_delivery_date: selectedRate.estimatedDeliveryDate,
    tforce_rate_quote_id: rateQuoteId,
  })
```

---

## Chatbot Integration

### Add Shipping Cost Queries to Chatbot

Update `chat-rag/route.ts` to handle shipping cost questions:

```typescript
// Add to function tools
{
  type: 'function',
  function: {
    name: 'calculate_shipping_estimate',
    description: 'Get shipping cost estimate based on customer location',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              quantity: { type: 'number' },
            },
          },
        },
      },
      required: ['city', 'state', 'zip', 'products'],
    },
  },
}
```

**Example Chatbot Conversation**:
```
User: "How much is shipping for an AUN250 to Los Angeles, CA 90210?"
Assistant: *Calls calculate_shipping_estimate function*
Assistant: "Shipping for the AUN250 to Los Angeles (90210) would be:
  • Standard Freight: $125.50 (5 business days)
  • Expedited: $185.75 (2 business days)

All rates include liftgate delivery for residential addresses. Would you like to proceed with an order?"
```

---

## Testing & Validation

### Test Cases

1. **Standard Residential Delivery**
   - Inputs: Residential address in CA
   - Expected: Rates with liftgate delivery included

2. **Commercial Delivery**
   - Inputs: Commercial address (no residential flag)
   - Expected: Lower rates without liftgate charges

3. **Multiple Items**
   - Inputs: Cart with 2x AUN250 + accessories
   - Expected: Combined shipment rates

4. **Edge Cases**
   - Invalid ZIP code → Error message
   - Remote location → Higher shipping cost
   - Alaska/Hawaii → Special handling rates

### Test API Call

```bash
# Test T-Force API directly
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210",
    "residential": true,
    "cartItems": [
      {
        "product_id": "uuid-here",
        "quantity": 1
      }
    ]
  }'
```

---

## Cost & Pricing Strategy

### T-Force API Costs
- **Rate Quotes**: Free (unlimited)
- **Tracking Updates**: Free
- **Actual Shipping**: Pay per shipment (negotiated rates)

### Customer Pricing Strategy

**Option 1: Pass-through pricing**
- Show exact T-Force rates to customers
- Customer pays actual shipping cost
- Transparent but variable pricing

**Option 2: Flat-rate with threshold**
- Free shipping over $500
- $50 flat rate under $500
- Simple pricing, absorb overage costs

**Option 3: Markup strategy**
- Add 10-15% markup to T-Force rates
- Covers handling, packaging materials
- Still competitive pricing

**Recommended**: Option 2 (matches current "Free shipping over $500" policy)

---

## Implementation Timeline

**Week 1**: Backend integration
- [ ] Set up T-Force API credentials
- [ ] Create TForceFreightClient class
- [ ] Create /api/shipping/calculate endpoint
- [ ] Test API connectivity

**Week 2**: Frontend components
- [ ] Create ShippingCalculator component
- [ ] Integrate into checkout flow
- [ ] Add loading states and error handling
- [ ] Test user experience

**Week 3**: Chatbot & database
- [ ] Add calculate_shipping_estimate function to chatbot
- [ ] Add shipping columns to orders table
- [ ] Store shipping details with orders
- [ ] Test end-to-end flow

**Week 4**: Testing & launch
- [ ] Test all shipping scenarios
- [ ] Validate pricing accuracy
- [ ] Update documentation
- [ ] Deploy to production

---

## Alternatives to T-Force Freight

If T-Force Freight doesn't meet requirements, consider:

1. **UPS Freight API**
   - Similar to T-Force
   - Well-documented API
   - Good coverage

2. **FedEx Freight API**
   - Competitive rates
   - Reliable service
   - Easy integration

3. **ShipStation API**
   - Multi-carrier support
   - Compare rates across carriers
   - Unified tracking

4. **Manual Entry (Interim Solution)**
   - Admin manually enters shipping costs
   - Customer enters location, receives quote via email
   - Low-tech but works until API integrated

---

**Status**: 📋 Planned - Ready for Implementation
**Priority**: High (user specifically requested)
**Dependencies**: T-Force API account setup
**Estimated Effort**: 3-4 weeks

**Next Steps**:
1. Contact T-Force to set up API account
2. Obtain API credentials
3. Begin Week 1 implementation
