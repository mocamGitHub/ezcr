import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendNewTestimonialNotification } from '@/lib/email/admin-notifications';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// =====================================================
// VALIDATION SCHEMA
// =====================================================

const submitTestimonialSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(20).max(1000),
  product_id: z.string().uuid().optional().nullable(),
  customer_avatar_url: z.string().url().optional().nullable(),
});

// =====================================================
// TYPES
// =====================================================

interface SubmitTestimonialRequest {
  rating: number;
  review_text: string;
  product_id?: string | null;
  customer_avatar_url?: string | null;
}

// =====================================================
// POST: Submit Testimonial (Authenticated Customers Only)
// =====================================================

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute for submission endpoints
  const rateLimit = withRateLimit(request, RATE_LIMITS.submission);
  if (rateLimit.limited) {
    return rateLimit.response;
  }

  try {
    const supabase = await createClient();

    // -------------------- Authentication --------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit a testimonial.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';

    // -------------------- Get User Profile --------------------
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, avatar_url, tenant_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      );
    }

    // -------------------- Parse & Validate Request --------------------
    const body: SubmitTestimonialRequest = await request.json();

    const validation = submitTestimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { rating, review_text, product_id, customer_avatar_url } =
      validation.data;

    // -------------------- Validate Product (if provided) --------------------
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product_id)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found.' },
          { status: 404 }
        );
      }
    }

    // -------------------- Generate Customer Name (First Name + Last Initial) --------------------
    const firstName = profile.first_name || 'Anonymous';
    const lastInitial = profile.last_name ? profile.last_name.charAt(0) + '.' : '';
    const customerName = `${firstName} ${lastInitial}`.trim();

    // -------------------- Use Avatar (Profile or Custom) --------------------
    const avatarUrl = customer_avatar_url || profile.avatar_url || null;

    // -------------------- Insert Testimonial --------------------
    const { data: testimonial, error: insertError } = await supabase
      .from('testimonials')
      .insert({
        tenant_id: profile.tenant_id,
        user_id: userId,
        customer_name: customerName,
        customer_email: userEmail,
        customer_avatar_url: avatarUrl,
        rating,
        review_text,
        product_id: product_id || null,
        status: 'pending',
        is_verified_customer: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting testimonial:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit testimonial. Please try again.' },
        { status: 500 }
      );
    }

    // -------------------- Send Email Notification to Admin --------------------
    try {
      await sendNewTestimonialNotification({
        testimonialId: testimonial.id,
        customerName: customerName,
        customerEmail: userEmail,
        rating: testimonial.rating,
        reviewText: testimonial.review_text,
        productId: testimonial.product_id,
        createdAt: testimonial.created_at,
      });
    } catch (emailError) {
      // Log email error but don't fail the testimonial submission
      console.error('Failed to send email notification:', emailError);
    }

    // -------------------- Success Response --------------------
    return NextResponse.json(
      {
        message: 'Testimonial submitted successfully! It will be reviewed shortly.',
        testimonial: {
          id: testimonial.id,
          rating: testimonial.rating,
          review_text: testimonial.review_text,
          customer_name: testimonial.customer_name,
          status: testimonial.status,
          created_at: testimonial.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in submit testimonial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
