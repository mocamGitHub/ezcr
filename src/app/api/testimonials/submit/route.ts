import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerLocation, title, content, rating } = body

    // Validation
    if (!customerName || !customerEmail || !content || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert testimonial
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_location: customerLocation || null,
        title: title || null,
        content,
        rating,
        status: 'pending', // Default to pending for admin approval
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting testimonial:', error)
      return NextResponse.json(
        { error: 'Failed to submit testimonial' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        testimonial: data,
        message: 'Testimonial submitted successfully. It will be reviewed shortly.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in testimonials submit API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
