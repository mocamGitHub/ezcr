# EZ Cycle Ramp — T-Force Freight Shipping Integration Guide

## Overview

This guide covers the complete setup for real-time shipping rate calculation using T-Force Freight's LTL (Less Than Truckload) Rating API. The system provides:

- **Real-time freight quotes** from T-Force Freight API
- **Quote caching** (24 hours by ZIP + product + residential status)
- **Terminal-to-terminal** pricing with optional residential delivery upgrade
- **Error handling** with automatic support notifications (Email + SMS)
- **Integration** for both Configurator and Checkout flows

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHIPPING RATE SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────┘

User enters ZIP ──► React Component ──► Supabase Edge Function
                                              │
                    ┌─────────────────────────┤
                    │                         │
                    ▼                         ▼
             Check Cache              Call T-Force API
             (Supabase DB)                   │
                    │                         │
                    │   Cache Hit?            │
                    │   ────────►             │
                    │     Yes: Return cached  │
                    │     No: ──────────────► │
                    │                         │
                    │                         ▼
                    │                  Parse Response
                    │                         │
                    │                         ▼
                    │                  Save to Cache
                    │                         │
                    └─────────► Return Quote ◄┘
                                      │
                    ┌─────────────────┤
                    ▼                 ▼
             On Success          On Error
             Show rates          • Log to DB
                                 • Notify Support (SMS + Email)
                                 • Show user-friendly message
```

---

## Prerequisites

Before starting, ensure you have:

1. **T-Force Freight Developer Account**
   - Sign up at [developer.tforcefreight.com](https://developer.tforcefreight.com)
   - Register as an "End User" (you're shipping your own products)
   - Wait for account approval (up to 5 business days)
   - Obtain OAuth credentials from your developer profile

2. **Supabase Project**
   - An active Supabase project with Edge Functions enabled

3. **Twilio Account** (for SMS notifications)
   - Account SID and Auth Token
   - A phone number for sending SMS

4. **SendGrid Account** (for email notifications)
   - API key with send permissions

---

## Step 1: T-Force Freight Setup

### 1.1 Create Developer Account

1. Go to [developer.tforcefreight.com/signup](https://developer.tforcefreight.com/signup)
2. Select **"End User"** as your User Type
3. Complete registration with your business information
4. Wait for approval email (typically 1-5 business days)

### 1.2 Register Your Application

After approval:

1. Log in to the developer portal
2. Go to **Profile** → **OAuth Client**
3. Configure your application:
   - **Display Name:** EZ Cycle Ramp E-Commerce
   - **Home Page URL:** https://ezcycleramp.com
4. Note your credentials:
   - Client ID
   - Client Secret

### 1.3 Test API Access

Test your credentials using the CIE (Customer Integration Environment):

```bash
# Get access token (replace with your credentials)
curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=https://api.tforcefreight.com/.default"

# Test rating API (use token from above)
curl -X POST "https://api.tforcefreight.com/rating/getRate?api-version=cie-v1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestOptions": {
      "serviceCode": "308",
      "pickupDate": "2024-12-10",
      "type": "L",
      "timeInTransit": true,
      "quoteNumber": true
    },
    "shipFrom": {
      "address": {
        "postalCode": "30188",
        "country": "US"
      },
      "isResidential": false
    },
    "shipTo": {
      "address": {
        "postalCode": "90210",
        "country": "US"
      },
      "isResidential": false
    },
    "payment": {
      "payer": {
        "address": {
          "postalCode": "30188",
          "country": "US"
        }
      },
      "billingCode": "10"
    },
    "commodities": [{
      "class": "125",
      "pieces": 1,
      "weight": { "weight": 300, "weightUnit": "LBS" },
      "packagingType": "PLT",
      "dimensions": {
        "length": 96,
        "width": 48,
        "height": 12,
        "unit": "IN"
      }
    }]
  }'
```

---

## Step 2: Database Setup

### 2.1 Run Migrations

In your Supabase SQL Editor, run the migration script from `database-migrations.sql`:

```sql
-- Run the complete migration file
-- This creates:
--   • shipping_quotes (cached quotes)
--   • shipping_errors (error tracking)
--   • shipping_addresses (saved addresses)
--   • Indexes and RLS policies
--   • Helper functions
```

### 2.2 Verify Tables

After running migrations, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'shipping%';
```

Expected result:
- shipping_quotes
- shipping_errors
- shipping_addresses

---

## Step 3: Edge Function Deployment

### 3.1 Create the Function

```bash
# From your project root
supabase functions new get-shipping-quote

# Copy the function code
cp supabase-get-shipping-quote.ts \
   supabase/functions/get-shipping-quote/index.ts
```

### 3.2 Set Environment Secrets

```bash
# T-Force Freight API
supabase secrets set TFORCE_CLIENT_ID=your_client_id_here
supabase secrets set TFORCE_CLIENT_SECRET=your_client_secret_here
supabase secrets set TFORCE_ACCOUNT_NUMBER=your_account_number

# Twilio (SMS notifications)
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_FROM_NUMBER=+1234567890

# Support contact
supabase secrets set SUPPORT_PHONE=+19377256790
supabase secrets set SUPPORT_EMAIL=support@ezcycleramp.com

# SendGrid (email notifications)
supabase secrets set SENDGRID_API_KEY=SG.your_sendgrid_key
```

### 3.3 Deploy

```bash
supabase functions deploy get-shipping-quote
```

### 3.4 Test the Function

```bash
# Local testing
curl -X POST http://localhost:54321/functions/v1/get-shipping-quote \
  -H "Content-Type: application/json" \
  -d '{
    "destinationZip": "90210",
    "productSku": "AUN250",
    "isResidential": false,
    "source": "configurator"
  }'

# Production testing (after deploy)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get-shipping-quote \
  -H "Content-Type: application/json" \
  -d '{
    "destinationZip": "90210",
    "productSku": "AUN250",
    "isResidential": false,
    "source": "configurator"
  }'
```

Expected response:

```json
{
  "success": true,
  "quoteId": "EZC-ABC123-XYZ",
  "baseRate": 285.00,
  "residentialSurcharge": 0,
  "totalRate": 285.00,
  "destinationTerminal": {
    "code": "LAX",
    "name": "Los Angeles Terminal"
  },
  "transitDays": 5,
  "validUntil": "2024-12-11T14:30:00.000Z"
}
```

---

## Step 4: Frontend Integration

### 4.1 Install Dependencies

```bash
npm install framer-motion
```

### 4.2 Add Environment Variable

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
```

### 4.3 Integrate into Configurator

```tsx
// In your configurator component
import { ConfiguratorShippingStep } from './configurator-shipping-step';

function Configurator() {
  const [shippingQuote, setShippingQuote] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  
  return (
    <div>
      {/* ... other configurator steps ... */}
      
      {/* Step 4: Delivery */}
      <ConfiguratorShippingStep
        productSku={selectedProduct} // 'AUN200' or 'AUN250'
        onQuoteReceived={(quote) => {
          setShippingQuote(quote);
          // Update total price display
        }}
        onDeliveryMethodChange={(method) => {
          setDeliveryMethod(method);
          if (method === 'pickup') {
            setShippingQuote(null); // Clear shipping quote
          }
        }}
      />
      
      {/* Total Price Display */}
      <div className="mt-4 p-4 bg-zinc-900 rounded-lg">
        <div className="flex justify-between">
          <span>Product:</span>
          <span>${productPrice}</span>
        </div>
        {deliveryMethod === 'shipping' && shippingQuote && (
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>${shippingQuote.totalRate}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t mt-2 pt-2">
          <span>Total:</span>
          <span>${productPrice + (shippingQuote?.totalRate || 0)}</span>
        </div>
      </div>
    </div>
  );
}
```

### 4.4 Using the Hook (Alternative)

For more control, use the hook directly:

```tsx
import { useShippingQuote, formatShippingCost } from './use-shipping-quote';

function CheckoutShipping() {
  const { quote, isLoading, error, fetchQuote, refetchWithResidential } = useShippingQuote({
    productSku: 'AUN250',
    source: 'checkout',
  });
  
  const handleZipChange = async (zip: string) => {
    if (zip.length === 5) {
      await fetchQuote({ zipCode: zip });
    }
  };
  
  return (
    <div>
      <input
        type="text"
        placeholder="ZIP Code"
        onChange={(e) => handleZipChange(e.target.value)}
      />
      
      {isLoading && <p>Calculating shipping...</p>}
      
      {error && (
        <p className="text-red-500">{error.userMessage}</p>
      )}
      
      {quote && (
        <div>
          <p>Terminal pickup: {formatShippingCost(quote.baseRate)}</p>
          <label>
            <input
              type="checkbox"
              onChange={(e) => refetchWithResidential(e.target.checked)}
            />
            Residential delivery (+$150)
          </label>
          <p className="font-bold">Total: {formatShippingCost(quote.totalRate)}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Checkout Integration

### 5.1 Pass Quote to Checkout

The shipping quote should persist from configurator to checkout. Options:

**Option A: URL Parameter**
```tsx
// After configurator completion
router.push(`/checkout?quoteId=${shippingQuote.quoteId}`);

// In checkout
const quoteId = searchParams.get('quoteId');
// Fetch quote details from database using quoteId
```

**Option B: Session Storage**
```tsx
// After getting quote
sessionStorage.setItem('shippingQuote', JSON.stringify(shippingQuote));

// In checkout
const savedQuote = JSON.parse(sessionStorage.getItem('shippingQuote'));
```

**Option C: Supabase Session (recommended)**
```tsx
// Save address to shipping_addresses table with session_id
const sessionId = crypto.randomUUID(); // Generate once per session

// In checkout, fetch by session_id
const { data } = await supabase
  .from('shipping_addresses')
  .select('*, shipping_quotes!last_quote_id(*)')
  .eq('session_id', sessionId)
  .single();
```

### 5.2 Validate Quote at Checkout

Before processing payment, verify the quote is still valid:

```tsx
import { isQuoteValid } from './use-shipping-quote';

async function handleCheckout() {
  // Check if quote is expired
  if (!isQuoteValid(shippingQuote)) {
    // Re-fetch quote
    const newQuote = await fetchQuote({
      zipCode: address.zipCode,
      isResidential: address.isResidential,
    });
    
    if (!newQuote) {
      alert('Unable to verify shipping. Please try again.');
      return;
    }
    
    // Update total with new quote
    setShippingQuote(newQuote);
  }
  
  // Proceed with payment
  // ...
}
```

---

## Step 6: Platform Integration

Since EZ Cycle Ramp is a tenant on a multi-tenant platform, discuss with the platform team:

### Questions for Platform Team

1. **Checkout Hook Points**
   - Can we inject custom shipping rate calculation at checkout?
   - Is there a shipping rates API we can integrate with?

2. **Order Data**
   - Can we attach the `quoteId` to order metadata?
   - Will the shipping cost be stored with the order?

3. **Address Validation**
   - Does the platform validate addresses?
   - Can we access the validated address data?

### Fallback: Platform Doesn't Support Custom Shipping

If the platform doesn't allow custom shipping integration:

1. **Use configurator quote as estimate only**
2. **Add disclaimer:** "Shipping calculated at checkout"
3. **Contact customers** if shipping differs significantly
4. **Manual adjustment** in platform dashboard if needed

---

## Freight Data Reference

### Product Specifications

| Product | Weight | Pallet Size | Freight Class |
|---------|--------|-------------|---------------|
| AUN 200 | 300 lbs | 96" × 48" × 12" (8ft) | 125 |
| AUN 250 | 350 lbs | 84" × 48" × 14" (7ft) | 125 |

### Service Codes

| Code | Description |
|------|-------------|
| 308 | TForce Freight LTL (Standard) |
| 309 | TForce Freight LTL - Guaranteed |
| 311 | TForce Freight Accelerated Guaranteed |

### Delivery Surcharges

| Code | Description | Typical Cost |
|------|-------------|--------------|
| RESD | Residential Delivery | ~$150-200 |
| LIFD | Liftgate Delivery | ~$175 |
| NTFN | Delivery Notification | ~$20 |

---

## Error Handling Reference

### Error Types

| Type | Cause | User Message |
|------|-------|--------------|
| `VALIDATION_ERROR` | Invalid ZIP format | "Please enter a valid ZIP code" |
| `INVALID_ZIP` | ZIP doesn't exist | "Please check your ZIP code" |
| `NO_SERVICE` | T-Force doesn't serve area | "Shipping unavailable to this location. Call us." |
| `RATE_LIMITED` | Too many API calls | "Please wait a moment and try again" |
| `QUOTA_EXCEEDED` | Daily quota hit | "Try again in 5 minutes" |
| `API_ERROR` | T-Force API failure | "Unable to calculate. Call (937) 725-6790" |
| `CONFIG_ERROR` | Missing credentials | "Shipping temporarily unavailable" |

### Support Notification Template

When errors occur, support receives:

**SMS:**
```
⚠️ EZ Cycle Ramp Shipping Error
API_ERROR: T-Force API returned 500
ZIP: 90210
Product: AUN250
```

**Email:**
```
Shipping Quote Error
--------------------
Type: API_ERROR
Message: T-Force API returned 500
Time: 2024-12-05T14:30:00Z

Request Details:
- ZIP: 90210
- Product: AUN250
- Residential: No
- Source: configurator
- User Email: customer@email.com
```

---

## Testing Checklist

### Pre-Launch Testing

- [ ] T-Force API credentials validated in CIE environment
- [ ] Edge function deploys without errors
- [ ] Database tables created correctly
- [ ] Quote caching works (same ZIP returns cached result)
- [ ] Quote expires after 24 hours
- [ ] Residential surcharge added correctly
- [ ] Error notifications sent (test with invalid credentials)
- [ ] User-friendly error messages display
- [ ] Quote persists from configurator to checkout
- [ ] Platform checkout integration works (or fallback documented)

### Production Checklist

- [ ] Switch API version from `cie-v1` to `v1`
- [ ] Verify negotiated rates appear (if configured with T-Force)
- [ ] Monitor first 10 orders for shipping accuracy
- [ ] Set up daily quote cleanup (if using pg_cron)
- [ ] Review error logs weekly

---

## Files Summary

| File | Purpose |
|------|---------|
| `supabase-get-shipping-quote.ts` | Supabase Edge Function - API integration |
| `database-migrations.sql` | Database tables and indexes |
| `configurator-shipping-step.tsx` | React component for configurator |
| `use-shipping-quote.ts` | React hook for quote management |
| `TFORCE-SHIPPING-SETUP.md` | This setup guide |

---

## Support Contacts

- **T-Force Freight API Support:** groundfreightapisupport@tforcefreight.com
- **T-Force Customer Service:** 1-800-333-7400
- **EZ Cycle Ramp Support:** (937) 725-6790

---

## Next Steps

1. **Immediate:** Set up T-Force developer account
2. **This Week:** Deploy and test in CIE environment
3. **Before Launch:** Switch to production API, verify rates
4. **Post-Launch:** Monitor errors, optimize based on data
