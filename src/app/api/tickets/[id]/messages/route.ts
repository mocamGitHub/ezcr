import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await context.params
    const supabase = await createClient()

    // Get tenant from headers or use default
    const tenantSlug = request.headers.get('x-tenant-slug') || 'ezcr-dev'

    // Get tenant_id
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      message_type = 'email',
      sender_type = 'agent',
      sender_email,
      sender_name,
      subject,
      message_body,
      is_internal = false,
    } = body

    if (!message_body) {
      return NextResponse.json(
        { error: 'message_body is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Create message
    const { data: message, error } = await supabase
      .from('ticket_messages')
      .insert({
        tenant_id: tenant.id,
        ticket_id: ticketId,
        message_type,
        sender_type,
        sender_email: sender_email || null,
        sender_name: sender_name || null,
        subject: subject || null,
        body: message_body,
        is_internal,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Update ticket status if it was resolved/closed and customer replied
    if (sender_type === 'customer') {
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', ticketId)
        .single()

      if (currentTicket?.status === 'resolved' || currentTicket?.status === 'closed') {
        await supabase
          .from('tickets')
          .update({ status: 'open' })
          .eq('id', ticketId)
      }
    }

    // Update first_response_at if this is the first agent response
    if (sender_type === 'agent' && !is_internal) {
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('first_response_at')
        .eq('id', ticketId)
        .single()

      if (!currentTicket?.first_response_at) {
        await supabase
          .from('tickets')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', ticketId)
      }
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error('Error creating ticket message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
