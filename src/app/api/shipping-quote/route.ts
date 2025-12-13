// ============================================
// NEXT.JS API ROUTE: /api/shipping-quote
// T-Force Freight LTL Rating Integration
// ============================================
//
// Required Environment Variables (from T-Force Developer Portal https://developer.tforcefreight.com/profile):
//   TFORCE_CLIENT_ID=your_client_id
//   TFORCE_CLIENT_SECRET=your_client_secret
//   TFORCE_ACCOUNT_NUMBER=your_account_number
// Optional (defaults to T-Force production values):
//   TFORCE_TOKEN_ENDPOINT=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
//   TFORCE_SCOPE=https://tffproduction.onmicrosoft.com/{app-id}/.default
//   TWILIO_ACCOUNT_SID=your_twilio_sid
//   TWILIO_AUTH_TOKEN=your_twilio_token
//   TWILIO_FROM_NUMBER=+1234567890
//   SUPPORT_PHONE=+19377256790
//   SUPPORT_EMAIL=support@ezcycleramp.com
//   SENDGRID_API_KEY=your_sendgrid_key
//   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
//   SUPABASE_SERVICE_KEY=your_service_role_key

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const TFORCE_CONFIG = {
  // API Endpoints - T-Force specific tenant ID required
  // Token endpoint and scope can be overridden via env vars from T-Force developer portal
  tokenUrl: process.env.TFORCE_TOKEN_ENDPOINT || 'https://login.microsoftonline.com/ca4f5969-c10f-40d4-8127-e74b691f95de/oauth2/v2.0/token',
  tokenScope: process.env.TFORCE_SCOPE || 'https://tffproduction.onmicrosoft.com/f06cb173-a8e6-44ad-89a1-06c1070a1f62/.default',
  ratingUrl: 'https://api.tforcefreight.com/rating/getRate',
  apiVersion: 'v1',

  // Origin: Woodstock, GA 30188
  origin: {
    city: 'Woodstock',
    stateProvinceCode: 'GA',
    postalCode: '30188',
    country: 'US',
    isResidential: false,
  },

  // Service options
  serviceCode: '308', // TForce Freight LTL (standard)
  billingCode: '10',  // Prepaid
  callType: 'L',      // LTL only

  // Quote validity
  quoteValidHours: 24,

  // Surcharges
  residentialSurcharge: 150, // Fallback if API doesn't return separate line
};

// Product freight specifications
const PRODUCT_FREIGHT: Record<string, {
  description: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  freightClass: string;
  packagingType: string;
  pieces: number;
}> = {
  AUN200: {
    description: 'EZ Cycle Ramp AUN 200',
    weight: 300,
    length: 96,   // 8ft pallet in inches
    width: 48,
    height: 12,
    freightClass: '125',
    packagingType: 'PLT', // Pallet
    pieces: 1,
  },
  AUN250: {
    description: 'EZ Cycle Ramp AUN 250',
    weight: 350,
    length: 84,   // 7ft pallet in inches
    width: 48,
    height: 14,
    freightClass: '125',
    packagingType: 'PLT',
    pieces: 1,
  },
};

// ============================================
// TYPES
// ============================================

interface ShippingQuoteRequest {
  destinationZip: string;
  destinationCity?: string;
  destinationState?: string;
  productSku: 'AUN200' | 'AUN250';
  isResidential?: boolean;
  source: 'configurator' | 'checkout';
  leadId?: string;
  sessionId?: string;
  userEmail?: string;
}

interface ShippingQuoteResponse {
  success: boolean;
  quoteId?: string;
  baseRate?: number;
  residentialSurcharge?: number;
  totalRate?: number;
  originTerminal?: {
    code: string;
    name: string;
  };
  destinationTerminal?: {
    code: string;
    name: string;
  };
  transitDays?: number;
  validUntil?: string;
  error?: {
    type: string;
    message: string;
    userMessage: string;
  };
}

interface TForceRateRequest {
  requestOptions: {
    serviceCode: string;
    pickupDate: string;
    type: string;
    timeInTransit: boolean;
    quoteNumber: boolean;
    customerContext?: string;
  };
  shipFrom: {
    address: {
      city?: string;
      stateProvinceCode?: string;
      postalCode: string;
      country: string;
    };
    isResidential: boolean;
  };
  shipTo: {
    address: {
      city?: string;
      stateProvinceCode?: string;
      postalCode: string;
      country: string;
    };
    isResidential: boolean;
  };
  payment: {
    payer: {
      address: {
        city?: string;
        stateProvinceCode?: string;
        postalCode: string;
        country: string;
      };
    };
    billingCode: string;
  };
  serviceOptions?: {
    pickup?: string[];
    delivery?: string[];
  };
  commodities: Array<{
    class: string;
    pieces: number;
    weight: {
      weight: number;
      weightUnit: string;
    };
    packagingType: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
  }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateQuoteId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `EZC-${timestamp}-${random}`.toUpperCase();
}

function getPickupDate(): string {
  const now = new Date();
  // Add 1 business day (skip weekends)
  let daysToAdd = 1;
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 5) daysToAdd = 3; // Friday -> Monday
  if (dayOfWeek === 6) daysToAdd = 2; // Saturday -> Monday

  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function validateZipCode(zip: string): boolean {
  // US ZIP: 5 digits or 5+4 format
  const usZipRegex = /^\d{5}(-\d{4})?$/;
  return usZipRegex.test(zip);
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// T-FORCE API FUNCTIONS
// ============================================

async function getAccessToken(): Promise<string> {
  const clientId = process.env.TFORCE_CLIENT_ID;
  const clientSecret = process.env.TFORCE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('T-Force credentials not configured');
  }

  const tokenResponse = await fetch(TFORCE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: TFORCE_CONFIG.tokenScope,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function callTForceRatingAPI(
  request: TForceRateRequest,
  accessToken: string
): Promise<any> {
  const url = `${TFORCE_CONFIG.ratingUrl}?api-version=${TFORCE_CONFIG.apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '60';
    throw new Error(`RATE_LIMITED:${retryAfter}`);
  }

  if (response.status === 403) {
    const retryAfter = response.headers.get('Retry-After') || '300';
    throw new Error(`QUOTA_EXCEEDED:${retryAfter}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`T-Force API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function buildTForceRequest(
  params: ShippingQuoteRequest,
  productConfig: typeof PRODUCT_FREIGHT.AUN200
): TForceRateRequest {
  const request: TForceRateRequest = {
    requestOptions: {
      serviceCode: TFORCE_CONFIG.serviceCode,
      pickupDate: getPickupDate(),
      type: TFORCE_CONFIG.callType,
      timeInTransit: true,
      quoteNumber: true,
      customerContext: params.leadId || params.sessionId || generateQuoteId(),
    },
    shipFrom: {
      address: {
        city: TFORCE_CONFIG.origin.city,
        stateProvinceCode: TFORCE_CONFIG.origin.stateProvinceCode,
        postalCode: TFORCE_CONFIG.origin.postalCode,
        country: TFORCE_CONFIG.origin.country,
      },
      isResidential: TFORCE_CONFIG.origin.isResidential,
    },
    shipTo: {
      address: {
        postalCode: params.destinationZip,
        country: 'US',
      },
      isResidential: params.isResidential || false,
    },
    payment: {
      payer: {
        address: {
          postalCode: TFORCE_CONFIG.origin.postalCode,
          country: TFORCE_CONFIG.origin.country,
        },
      },
      billingCode: TFORCE_CONFIG.billingCode,
    },
    commodities: [
      {
        class: productConfig.freightClass,
        pieces: productConfig.pieces,
        weight: {
          weight: productConfig.weight,
          weightUnit: 'LBS',
        },
        packagingType: productConfig.packagingType,
        dimensions: {
          length: productConfig.length,
          width: productConfig.width,
          height: productConfig.height,
          unit: 'IN',
        },
      },
    ],
  };

  // Add destination city/state if provided
  if (params.destinationCity) {
    request.shipTo.address.city = params.destinationCity;
  }
  if (params.destinationState) {
    request.shipTo.address.stateProvinceCode = params.destinationState;
  }

  // Add residential delivery service option if needed
  if (params.isResidential) {
    request.serviceOptions = {
      delivery: ['RESD'], // Residential Delivery
    };
  }

  return request;
}

function parseRateResponse(
  response: any,
  isResidential: boolean
): { baseRate: number; residentialSurcharge: number; totalRate: number; transitDays?: number; originTerminal?: any; destinationTerminal?: any; tforceQuoteNumber?: string } {
  // Check for successful response
  if (response.summary?.responseStatus?.code !== 'OK') {
    throw new Error(`T-Force returned error: ${response.summary?.responseStatus?.message || 'Unknown error'}`);
  }

  // Get the first detail (main rate)
  const detail = response.detail?.[0];
  if (!detail) {
    throw new Error('No rate details in T-Force response');
  }

  // Extract rates from the response
  let baseRate = 0;
  let residentialSurcharge = 0;

  if (detail.rate && Array.isArray(detail.rate)) {
    for (const rateItem of detail.rate) {
      // Base rate after discount
      if (rateItem.code === 'AFTR_DSCNT' || rateItem.code === 'LND_GROSS') {
        baseRate = parseFloat(rateItem.value) || 0;
      }
      // Residential delivery surcharge
      if (rateItem.code === 'RESD') {
        residentialSurcharge = parseFloat(rateItem.value) || 0;
      }
    }
  }

  // Get total from shipmentCharges if available
  if (detail.shipmentCharges?.total?.value) {
    const total = parseFloat(detail.shipmentCharges.total.value);
    // If we got a total, use it; otherwise calculate
    if (total > 0) {
      // If residential but no separate surcharge returned, it might be included
      if (isResidential && residentialSurcharge === 0) {
        // Total already includes residential
        return {
          baseRate: total - TFORCE_CONFIG.residentialSurcharge,
          residentialSurcharge: TFORCE_CONFIG.residentialSurcharge,
          totalRate: total,
          transitDays: detail.timeInTransit?.value ? parseInt(detail.timeInTransit.value) : undefined,
          originTerminal: detail.serviceCenter?.origin,
          destinationTerminal: detail.serviceCenter?.destination,
          tforceQuoteNumber: response.summary?.quoteNumber,
        };
      }
      return {
        baseRate: total - residentialSurcharge,
        residentialSurcharge,
        totalRate: total,
        transitDays: detail.timeInTransit?.value ? parseInt(detail.timeInTransit.value) : undefined,
        originTerminal: detail.serviceCenter?.origin,
        destinationTerminal: detail.serviceCenter?.destination,
        tforceQuoteNumber: response.summary?.quoteNumber,
      };
    }
  }

  // Calculate total if not provided
  const totalRate = baseRate + residentialSurcharge;

  return {
    baseRate,
    residentialSurcharge,
    totalRate,
    transitDays: detail.timeInTransit?.value ? parseInt(detail.timeInTransit.value) : undefined,
    originTerminal: detail.serviceCenter?.origin,
    destinationTerminal: detail.serviceCenter?.destination,
    tforceQuoteNumber: response.summary?.quoteNumber,
  };
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

async function sendSupportNotification(
  error: { type: string; message: string; details?: any },
  request: ShippingQuoteRequest
): Promise<void> {
  const supportPhone = process.env.SUPPORT_PHONE;
  const supportEmail = process.env.SUPPORT_EMAIL;

  const errorDetails = `
Shipping Quote Error
--------------------
Type: ${error.type}
Message: ${error.message}
Time: ${new Date().toISOString()}

Request Details:
- ZIP: ${request.destinationZip}
- Product: ${request.productSku}
- Residential: ${request.isResidential ? 'Yes' : 'No'}
- Source: ${request.source}
- Lead ID: ${request.leadId || 'N/A'}
- User Email: ${request.userEmail || 'N/A'}

${error.details ? `API Response:\n${JSON.stringify(error.details, null, 2)}` : ''}
  `.trim();

  // Send SMS via Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom && supportPhone) {
    try {
      const smsBody = `⚠️ EZ Cycle Ramp Shipping Error\n${error.type}: ${error.message}\nZIP: ${request.destinationZip}\nProduct: ${request.productSku}`;

      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: supportPhone,
            From: twilioFrom,
            Body: smsBody.substring(0, 1600), // SMS limit
          }),
        }
      );
      console.log('SMS notification sent');
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }
  }

  // Send Email via SendGrid
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (sendgridKey && supportEmail) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: supportEmail }] }],
          from: { email: 'noreply@ezcycleramp.com', name: 'EZ Cycle Ramp System' },
          subject: `⚠️ Shipping Quote Error: ${error.type}`,
          content: [
            {
              type: 'text/plain',
              value: errorDetails,
            },
          ],
        }),
      });
      console.log('Email notification sent');
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
  }
}

// ============================================
// CACHING FUNCTIONS
// ============================================

async function getCachedQuote(
  supabase: any,
  destinationZip: string,
  productSku: string,
  isResidential: boolean
): Promise<ShippingQuoteResponse | null> {
  const { data, error } = await supabase
    .from('shipping_quotes')
    .select('*')
    .eq('destination_zip', destinationZip)
    .eq('product_sku', productSku)
    .eq('is_residential', isResidential)
    .gt('valid_until', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    success: true,
    quoteId: data.quote_id,
    baseRate: parseFloat(data.base_rate),
    residentialSurcharge: parseFloat(data.residential_surcharge),
    totalRate: parseFloat(data.total_rate),
    originTerminal: data.origin_terminal_code ? {
      code: data.origin_terminal_code,
      name: data.origin_terminal_name,
    } : undefined,
    destinationTerminal: data.destination_terminal_code ? {
      code: data.destination_terminal_code,
      name: data.destination_terminal_name,
    } : undefined,
    transitDays: data.transit_days,
    validUntil: data.valid_until,
  };
}

async function saveQuote(
  supabase: any,
  quoteId: string,
  request: ShippingQuoteRequest,
  rates: ReturnType<typeof parseRateResponse>,
  tforceQuoteNumber?: string
): Promise<void> {
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + TFORCE_CONFIG.quoteValidHours);

  await supabase.from('shipping_quotes').insert({
    quote_id: quoteId,
    destination_zip: request.destinationZip,
    destination_city: request.destinationCity,
    destination_state: request.destinationState,
    is_residential: request.isResidential || false,
    product_sku: request.productSku,
    base_rate: rates.baseRate,
    residential_surcharge: rates.residentialSurcharge,
    total_rate: rates.totalRate,
    origin_terminal_code: rates.originTerminal?.code,
    origin_terminal_name: rates.originTerminal?.name,
    destination_terminal_code: rates.destinationTerminal?.code,
    destination_terminal_name: rates.destinationTerminal?.name,
    tforce_quote_id: tforceQuoteNumber,
    valid_until: validUntil.toISOString(),
    source: request.source,
    lead_id: request.leadId,
    transit_days: rates.transitDays,
  });
}

async function logError(
  supabase: any,
  errorType: string,
  errorMessage: string,
  request: ShippingQuoteRequest,
  tforceResponse?: any
): Promise<void> {
  await supabase.from('shipping_errors').insert({
    destination_zip: request.destinationZip,
    destination_address: request.destinationCity && request.destinationState
      ? `${request.destinationCity}, ${request.destinationState}`
      : null,
    product_sku: request.productSku,
    source: request.source,
    error_type: errorType,
    error_message: errorMessage,
    tforce_response: tforceResponse,
    user_email: request.userEmail,
    session_id: request.sessionId,
    support_notified_at: new Date().toISOString(),
  });
}

// ============================================
// API ROUTE HANDLERS
// ============================================

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const request: ShippingQuoteRequest = await req.json();

    // Validate request
    if (!request.destinationZip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Destination ZIP code is required',
            userMessage: 'Please enter your ZIP code to get a shipping quote.',
          },
        },
        { status: 400 }
      );
    }

    if (!validateZipCode(request.destinationZip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_ZIP',
            message: 'Invalid ZIP code format',
            userMessage: 'Please enter a valid US ZIP code (e.g., 90210 or 90210-1234).',
          },
        },
        { status: 400 }
      );
    }

    if (!request.productSku || !PRODUCT_FREIGHT[request.productSku]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_PRODUCT',
            message: 'Invalid product SKU',
            userMessage: 'Please select a valid product.',
          },
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedQuote = await getCachedQuote(
      supabase,
      request.destinationZip,
      request.productSku,
      request.isResidential || false
    );

    if (cachedQuote) {
      console.log(`Returning cached quote for ZIP ${request.destinationZip}`);
      return NextResponse.json(cachedQuote);
    }

    // Get fresh quote from T-Force
    console.log(`Fetching new quote for ZIP ${request.destinationZip}`);

    const productConfig = PRODUCT_FREIGHT[request.productSku];
    const tforceRequest = buildTForceRequest(request, productConfig);

    // Get access token
    const accessToken = await getAccessToken();

    // Call T-Force API
    const tforceResponse = await callTForceRatingAPI(tforceRequest, accessToken);

    // Parse response
    const rates = parseRateResponse(tforceResponse, request.isResidential || false);

    // Generate quote ID and save
    const quoteId = generateQuoteId();
    await saveQuote(supabase, quoteId, request, rates, rates.tforceQuoteNumber);

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + TFORCE_CONFIG.quoteValidHours);

    const response: ShippingQuoteResponse = {
      success: true,
      quoteId,
      baseRate: rates.baseRate,
      residentialSurcharge: rates.residentialSurcharge,
      totalRate: rates.totalRate,
      originTerminal: rates.originTerminal,
      destinationTerminal: rates.destinationTerminal,
      transitDays: rates.transitDays,
      validUntil: validUntil.toISOString(),
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Shipping quote error:', error);

    let errorType = 'API_ERROR';
    const errorMessage = error.message || 'Unknown error';
    let userMessage = 'We couldn\'t calculate shipping at this time. Please contact us at (937) 725-6790 for a quote.';
    let statusCode = 500;

    // Handle specific errors
    if (errorMessage.startsWith('RATE_LIMITED:')) {
      errorType = 'RATE_LIMITED';
      userMessage = 'Our shipping system is busy. Please try again in a minute.';
      statusCode = 429;
    } else if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
      errorType = 'QUOTA_EXCEEDED';
      userMessage = 'Our shipping system is temporarily unavailable. Please try again in 5 minutes or call us.';
      statusCode = 503;
    } else if (errorMessage.includes('credentials')) {
      errorType = 'CONFIG_ERROR';
      userMessage = 'Shipping quotes are temporarily unavailable. Please call (937) 725-6790 for a quote.';
    } else if (errorMessage.includes('No rate details')) {
      errorType = 'NO_SERVICE';
      userMessage = 'Freight shipping is not available to this location. Please call (937) 725-6790 for alternative options.';
    }

    // Create minimal request for logging
    const request: ShippingQuoteRequest = {
      destinationZip: 'unknown',
      productSku: 'AUN200',
      source: 'checkout',
    };

    // Log error to database
    await logError(supabase, errorType, errorMessage, request);

    // Send support notification
    await sendSupportNotification(
      { type: errorType, message: errorMessage },
      request
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          userMessage,
        },
      },
      { status: statusCode }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
