import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMA
// =====================================================

const featureTestimonialSchema = z.object({
  is_featured: z.boolean(),
});

// =====================================================
// POST: Toggle Featured Status (Admin Only)
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    const testimonialId = params.id;

    // -------------------- Parse & Validate Request --------------------
    const body = await request.json();
    const validation = featureTestimonialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { is_featured } = validation.data;

    // -------------------- Update Featured Status --------------------
    const { data: testimonial, error: updateError } = await supabase
      .from('testimonials')
      .update({ is_featured })
      .eq('id', testimonialId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating featured status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update featured status' },
        { status: 500 }
      );
    }

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // -------------------- Success Response --------------------
    return NextResponse.json({
      message: `Testimonial ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      testimonial,
    });
  } catch (error) {
    console.error('Unexpected error in feature testimonial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
