import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMA
// =====================================================

const rejectTestimonialSchema = z.object({
  rejection_reason: z.string().min(10).max(500),
});

// =====================================================
// POST: Reject Testimonial (Admin Only)
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    const { id: testimonialId } = await params;

    // -------------------- Parse & Validate Request --------------------
    const body = await request.json();
    const validation = rejectTestimonialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { rejection_reason } = validation.data;

    // -------------------- Update Testimonial Status --------------------
    const { data: testimonial, error: updateError } = await supabase
      .from('testimonials')
      .update({
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason,
        approved_by: null,
        approved_at: null,
      })
      .eq('id', testimonialId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting testimonial:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject testimonial' },
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
      message: 'Testimonial rejected successfully',
      testimonial,
    });
  } catch (error) {
    console.error('Unexpected error in reject testimonial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
