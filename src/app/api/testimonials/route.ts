import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// =====================================================
// TYPES
// =====================================================

interface TestimonialFilters {
  product_id?: string;
  rating?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'rating';
  sort_order?: 'asc' | 'desc';
}

// =====================================================
// GET: Fetch Testimonials (Public - Approved Only)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);

    // -------------------- Parse Query Parameters --------------------
    const filters: TestimonialFilters = {
      product_id: searchParams.get('product_id') || undefined,
      rating: searchParams.get('rating')
        ? parseInt(searchParams.get('rating')!)
        : undefined,
      featured: searchParams.get('featured') === 'true',
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page')!)
        : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10,
      sort_by: (searchParams.get('sort_by') as 'created_at' | 'rating') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    // Validate pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const offset = (page - 1) * limit;

    // -------------------- Build Query --------------------
    let query = supabase
      .from('testimonials')
      .select('*', { count: 'exact' })
      .eq('status', 'approved'); // Only show approved testimonials

    // Apply filters
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }

    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    // Apply sorting
    if (filters.sort_by === 'rating') {
      query = query.order('rating', { ascending: filters.sort_order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: filters.sort_order === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // -------------------- Execute Query --------------------
    const { data: testimonials, count, error } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
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
      filters: {
        product_id: filters.product_id,
        rating: filters.rating,
        featured: filters.featured,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      },
    });
  } catch (error) {
    console.error('Unexpected error in fetch testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
