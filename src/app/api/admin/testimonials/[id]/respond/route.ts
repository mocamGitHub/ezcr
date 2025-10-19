import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMA
// =====================================================

const respondTestimonialSchema = z.object({
  admin_response: z.string().min(10).max(500),
});

// =====================================================
// POST: Add Admin Response to Testimonial (Admin Only)
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
    const validation = respondTestimonialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { admin_response } = validation.data;

    // -------------------- Add Admin Response --------------------
    const { data: testimonial, error: updateError } = await supabase
      .from('testimonials')
      .update({
        admin_response,
        admin_response_by: user.id,
        admin_response_at: new Date().toISOString(),
      })
      .eq('id', testimonialId)
      .select()
      .single();

    if (updateError) {
      console.error('Error adding admin response:', updateError);
      return NextResponse.json(
        { error: 'Failed to add admin response' },
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
      message: 'Admin response added successfully',
      testimonial,
    });
  } catch (error) {
    console.error('Unexpected error in add admin response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
