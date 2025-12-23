// ============================================
// NEXT.JS API ROUTE: /api/tforce-tracking/sync-all
// Batch sync tracking for all shipped orders
// ============================================
//
// Endpoints:
//   POST /api/tforce-tracking/sync-all - Sync all shipped orders with PRO numbers
//
// This can be called manually or via a cron job to keep tracking data up to date

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

interface SyncResult {
  orderId: string;
  orderNumber: string;
  proNumber: string;
  success: boolean;
  status?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get all shipped orders with PRO numbers that haven't been delivered yet
    // or haven't been synced in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, pro_number, status, tracking_synced_at')
      .not('pro_number', 'is', null)
      .in('status', ['shipped', 'processing'])
      .or(`tracking_synced_at.is.null,tracking_synced_at.lt.${oneHourAgo}`)
      .limit(50); // Limit to avoid rate limiting

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders need syncing',
        synced: 0,
        results: [],
      });
    }

    const results: SyncResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each order
    for (const order of orders) {
      try {
        // Call our tracking API for this order
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/tforce-tracking?orderId=${order.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          successCount++;
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            proNumber: order.pro_number,
            success: true,
            status: data.tracking?.currentStatus?.description || 'Unknown',
          });
        } else {
          errorCount++;
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            proNumber: order.pro_number,
            success: false,
            error: data.error?.message || 'Unknown error',
          });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err: any) {
        errorCount++;
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          proNumber: order.pro_number,
          success: false,
          error: err.message || 'Unexpected error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} orders, ${errorCount} errors`,
      synced: successCount,
      errors: errorCount,
      total: orders.length,
      results,
    });

  } catch (error: any) {
    console.error('Batch sync error:', error);

    return NextResponse.json({
      success: false,
      error: {
        type: 'BATCH_SYNC_ERROR',
        message: error.message || 'Failed to sync orders',
      },
    }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(req: NextRequest) {
  return POST(req);
}
