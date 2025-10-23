import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { testimonialId, isHelpful = true } = body

    if (!testimonialId) {
      return NextResponse.json(
        { error: 'Testimonial ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Generate session ID for anonymous users
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('testimonial_session_id')?.value

    if (!sessionId && !user) {
      // Create new session ID for anonymous user
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      // Note: In production, you'd set this cookie with proper options
    }

    // Check if user/session has already voted
    const { data: existingVote } = await supabase
      .from('testimonial_votes')
      .select('id')
      .eq('testimonial_id', testimonialId)
      .or(user ? `user_id.eq.${user.id}` : `session_id.eq.${sessionId}`)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this testimonial' },
        { status: 400 }
      )
    }

    // Insert vote
    const { error } = await supabase
      .from('testimonial_votes')
      .insert({
        testimonial_id: testimonialId,
        user_id: user?.id || null,
        session_id: !user ? sessionId : null,
        is_helpful: isHelpful,
      })

    if (error) {
      console.error('Error inserting vote:', error)
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      )
    }

    // Return success with session ID for future requests
    const response = NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
    })

    // Set session cookie if needed (anonymous user)
    if (!user && sessionId) {
      response.cookies.set('testimonial_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    return response
  } catch (error) {
    console.error('Error in testimonials vote API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
