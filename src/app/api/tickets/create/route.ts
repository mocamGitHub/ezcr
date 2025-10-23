import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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
      customer_email,
      customer_name,
      subject,
      description,
      priority = 'normal',
      category,
      source = 'web_form',
      channel_metadata,
    } = body

    // Validate required fields
    if (!customer_email || !subject || !description) {
      return NextResponse.json(
        { error: 'customer_email, subject, and description are required' },
        { status: 400 }
      )
    }

    // Look up customer by email
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', customer_email)
      .single()

    // Generate ticket number
    const { data: ticketNumberResult } = await supabase
      .rpc('generate_ticket_number', { tenant_uuid: tenant.id })

    const ticketNumber = ticketNumberResult || `TICKET-${Date.now()}`

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        tenant_id: tenant.id,
        ticket_number: ticketNumber,
        customer_id: customer?.id || null,
        customer_email,
        customer_name: customer_name || null,
        subject,
        description,
        priority,
        category: category || null,
        source,
        channel_metadata: channel_metadata || null,
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    // Create initial message
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        tenant_id: tenant.id,
        ticket_id: ticket.id,
        message_type: 'email',
        sender_type: 'customer',
        sender_email: customer_email,
        sender_name: customer_name || null,
        subject,
        body: description,
      })

    if (messageError) {
      console.error('Error creating ticket message:', messageError)
      // Don't fail the request, ticket is already created
    }

    // Create activity in CRM if customer exists
    if (customer) {
      await supabase
        .from('activities')
        .insert({
          tenant_id: tenant.id,
          customer_id: customer.id,
          activity_type: 'ticket',
          title: `Created ticket: ${subject}`,
          notes: description,
          activity_metadata: {
            ticket_id: ticket.id,
            ticket_number: ticketNumber,
            priority,
          },
        })
    }

    // TODO: Run automation rules
    // TODO: Send notification emails

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
      },
    })
  } catch (error) {
    console.error('Error in ticket creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
