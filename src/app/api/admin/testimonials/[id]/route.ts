import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/api-auth';

// =====================================================
// DELETE: Delete Testimonial (Admin Only)
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    const testimonialId = params.id;

    // -------------------- Delete Testimonial --------------------
    const { error: deleteError } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId);

    if (deleteError) {
      console.error('Error deleting testimonial:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete testimonial' },
        { status: 500 }
      );
    }

    // -------------------- Success Response --------------------
    return NextResponse.json({
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in delete testimonial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
