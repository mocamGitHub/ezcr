// ============================================
// NEXT.JS API ROUTE: /api/tforce-tracking
// T-Force Freight Shipment Tracking Integration
// ============================================
//
// Endpoints:
//   GET /api/tforce-tracking?pro=123456789 - Track by PRO number
//   POST /api/tforce-tracking/search - Search by BOL/PO number
//
// Uses same OAuth credentials as shipping-quote:
//   TFORCE_CLIENT_ID, TFORCE_CLIENT_SECRET

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const TFORCE_CONFIG = {
  tokenUrl: process.env.TFORCE_TOKEN_ENDPOINT || 'https://login.microsoftonline.com/ca4f5969-c10f-40d4-8127-e74b691f95de/oauth2/v2.0/token',
  tokenScope: process.env.TFORCE_SCOPE || 'https://tffproduction.onmicrosoft.com/f06cb173-a8e6-44ad-89a1-06c1070a1f62/.default',
  trackingUrl: 'https://api.tforcefreight.com/track',
  apiVersion: 'v1',
};

// ============================================
// TYPES
// ============================================

interface TrackingEvent {
  date: string;
  description: string;
  displayDescription?: string;
  serviceCenter?: string;
  code?: string;
}

interface TrackingDetail {
  pro: string;
  pieces?: number;
  weight?: { weight: number; weightUnit: string };
  currentStatus: {
    code: string;
    description: string;
    details: string; // 005=In Transit, 006=Out for Delivery, 011=Delivered, 013=Exception
  };
  pickup?: {
    date: string;
    serviceCenter?: string;
  };
  delivery?: {
    estimated?: { date: string; serviceCenter?: string };
    actual?: { date: string; serviceCenter?: string };
    signedBy?: string;
  };
  reference?: {
    bol?: string;
    po?: string;
  };
  origin?: {
    address?: {
      name?: string;
      city?: string;
      stateProvince?: string;
      postalCode?: string;
      country?: string;
    };
  };
  destination?: {
    address?: {
      name?: string;
      city?: string;
      stateProvince?: string;
      postalCode?: string;
      country?: string;
    };
  };
  events?: TrackingEvent[];
}

interface TrackingResponse {
  success: boolean;
  tracking?: TrackingDetail;
  error?: {
    type: string;
    message: string;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

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

function parseStatusDetails(details: string): string {
  switch (details) {
    case '004': return 'voided';
    case '005': return 'in_transit';
    case '006': return 'out_for_delivery';
    case '011': return 'delivered';
    case '013': return 'exception';
    default: return 'unknown';
  }
}

// ============================================
// API HANDLERS
// ============================================

// GET /api/tforce-tracking?pro=123456789
// GET /api/tforce-tracking?orderId=xxx (looks up PRO from order)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let proNumber = searchParams.get('pro');
    const orderId = searchParams.get('orderId');

    // If orderId provided, look up PRO number from order
    if (orderId && !proNumber) {
      const supabase = getSupabaseClient();
      const { data: order, error } = await supabase
        .from('orders')
        .select('pro_number')
        .eq('id', orderId)
        .single();

      if (error || !order?.pro_number) {
        return NextResponse.json({
          success: false,
          error: {
            type: 'NO_PRO_NUMBER',
            message: 'Order does not have a PRO number. Enter the PRO number first.',
          },
        }, { status: 400 });
      }

      proNumber = order.pro_number;
    }

    if (!proNumber) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'MISSING_PRO',
          message: 'PRO number is required',
        },
      }, { status: 400 });
    }

    // Validate PRO format (9 digits)
    const cleanPro = proNumber.replace(/\D/g, '');
    if (cleanPro.length !== 9) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'INVALID_PRO',
          message: 'PRO number must be 9 digits',
        },
      }, { status: 400 });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Call TForce Tracking API
    const url = `${TFORCE_CONFIG.trackingUrl}/pro/${cleanPro}?api-version=${TFORCE_CONFIG.apiVersion}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (response.status === 429) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'RATE_LIMITED',
          message: 'TForce API rate limit exceeded. Try again in 60 seconds.',
        },
      }, { status: 429 });
    }

    if (response.status === 404) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: `No shipment found for PRO ${proNumber}`,
        },
      }, { status: 404 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TForce API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Check response status
    if (data.summary?.responseStatus?.code !== 'OK') {
      return NextResponse.json({
        success: false,
        error: {
          type: 'TFORCE_ERROR',
          message: data.summary?.responseStatus?.message || 'TForce returned an error',
        },
      }, { status: 400 });
    }

    // Get the first detail (single PRO lookup)
    const detail = data.detail?.[0];
    if (!detail) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'NO_DATA',
          message: 'No tracking data returned',
        },
      }, { status: 404 });
    }

    // If orderId was provided, update the order with tracking data
    if (orderId) {
      const supabase = getSupabaseClient();
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Map TForce status to order status
      const statusCode = parseStatusDetails(detail.currentStatus?.details);
      if (statusCode === 'delivered') {
        updateData.status = 'delivered';
        updateData.delivered_at = detail.delivery?.actual?.date || new Date().toISOString();
        if (detail.delivery?.signedBy) {
          updateData.delivery_signature = detail.delivery.signedBy;
        }
      } else if (statusCode === 'out_for_delivery') {
        updateData.status = 'shipped';
      } else if (statusCode === 'in_transit') {
        updateData.status = 'shipped';
        if (!updateData.shipped_at && detail.pickup?.date) {
          updateData.shipped_at = detail.pickup.date;
        }
      }

      // Update carrier info
      updateData.carrier = 'tforce';

      // Update estimated delivery if available
      if (detail.delivery?.estimated?.date) {
        updateData.estimated_delivery_date = detail.delivery.estimated.date.split('T')[0];
      }

      // Update BOL if returned
      if (detail.reference?.bol) {
        updateData.bol_number = detail.reference.bol;
      }

      await supabase.from('orders').update(updateData).eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      tracking: detail,
    });

  } catch (error: any) {
    console.error('Tracking error:', error);

    return NextResponse.json({
      success: false,
      error: {
        type: 'API_ERROR',
        message: error.message || 'Failed to get tracking information',
      },
    }, { status: 500 });
  }
}

// POST /api/tforce-tracking - Search by BOL/PO number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, code, pickupStartDate, pickupEndDate, orderId } = body;

    // Validate required fields
    if (!number || !code || !pickupStartDate || !pickupEndDate) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'MISSING_FIELDS',
          message: 'number, code (BL or PO), pickupStartDate, and pickupEndDate are required',
        },
      }, { status: 400 });
    }

    if (!['BL', 'PO'].includes(code)) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'INVALID_CODE',
          message: 'code must be BL (Bill of Lading) or PO (Purchase Order)',
        },
      }, { status: 400 });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Build search request
    const searchRequest = {
      number,
      code,
      pickupStartDate,
      pickupEndDate,
    };

    // Call TForce Search API
    const url = `${TFORCE_CONFIG.trackingUrl}/pro/search?api-version=${TFORCE_CONFIG.apiVersion}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest),
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'RATE_LIMITED',
          message: 'TForce API rate limit exceeded. Please try again in a minute.',
        },
      }, { status: 429 });
    }

    // Check response status - handle both HTTP errors and TForce error codes
    const responseCode = data.summary?.responseStatus?.code;
    if (responseCode === 'RNF' || response.status === 404) {
      // Reference Not Found - provide a friendly message
      const refType = code === 'BL' ? 'Bill of Lading' : 'Purchase Order';
      return NextResponse.json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: `No shipment found for ${refType} #${number}. This BOL may be too old (TForce typically keeps records for 90-180 days) or the number may be incorrect.`,
        },
      }, { status: 404 });
    }

    if (responseCode !== 'OK') {
      // Other TForce errors
      let friendlyMessage = data.summary?.responseStatus?.message || 'Unable to find shipment';

      // Make common error messages more user-friendly
      if (friendlyMessage.toLowerCase().includes('reference number not found')) {
        const refType = code === 'BL' ? 'Bill of Lading' : 'Purchase Order';
        friendlyMessage = `No shipment found for ${refType} #${number}. Please verify the number is correct.`;
      }

      return NextResponse.json({
        success: false,
        error: {
          type: 'TFORCE_ERROR',
          message: friendlyMessage,
        },
      }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'API_ERROR',
          message: 'Unable to connect to TForce. Please try again later.',
        },
      }, { status: response.status });
    }

    const details = data.detail || [];

    // If orderId provided and we found exactly one result, update the order
    if (orderId && details.length === 1) {
      const detail = details[0];
      const supabase = getSupabaseClient();

      await supabase.from('orders').update({
        pro_number: detail.pro,
        carrier: 'tforce',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      results: details,
      count: details.length,
    });

  } catch (error: any) {
    console.error('Tracking search error:', error);

    return NextResponse.json({
      success: false,
      error: {
        type: 'API_ERROR',
        message: error.message || 'Failed to search for shipment',
      },
    }, { status: 500 });
  }
}
