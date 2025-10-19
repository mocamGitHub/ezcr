import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';

// =====================================================
// POST: Approve Testimonial (Admin Only)
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

    // -------------------- Update Testimonial Status --------------------
    const { data: testimonial, error: updateError } = await supabase
      .from('testimonials')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
      })
      .eq('id', testimonialId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving testimonial:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve testimonial' },
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
      message: 'Testimonial approved successfully',
      testimonial,
    });
  } catch (error) {
    console.error('Unexpected error in approve testimonial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
