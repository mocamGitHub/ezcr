import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';

// =====================================================
// GET: Fetch All Testimonials (Admin Only)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    const { searchParams } = new URL(request.url);

    // -------------------- Parse Query Parameters --------------------
    const status = searchParams.get('status') || 'all'; // all, pending, approved, rejected
    const product_id = searchParams.get('product_id');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // -------------------- Build Query --------------------
    let query = supabase
      .from('testimonials')
      .select('*, user_profiles!inner(first_name, last_name, email)', { count: 'exact' });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply other filters
    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (rating) {
      query = query.eq('rating', rating);
    }

    // Sort by created_at (newest first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // -------------------- Execute Query --------------------
    const { data: testimonials, count, error } = await query;

    if (error) {
      console.error('Error fetching admin testimonials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    // -------------------- Calculate Pagination Metadata --------------------
    const totalPages = count ? Math.ceil(count / limit) : 0;

    // -------------------- Success Response --------------------
    return NextResponse.json({
      testimonials: testimonials || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error('Unexpected error in admin fetch testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
