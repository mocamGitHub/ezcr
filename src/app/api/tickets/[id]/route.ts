import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customers(id, email, first_name, last_name, phone)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Fetch tags
    const { data: tags } = await supabase
      .from('ticket_tags')
      .select('tag')
      .eq('ticket_id', id)

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        messages: messages || [],
        tags: tags?.map(t => t.tag) || [],
      },
    })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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
    const { status, priority, category, assigned_to, resolution_notes } = body

    const updates: any = {}

    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (category) updates.category = category
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes

    // Set resolved_at when status changes to resolved
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      )
    }

    // Create system message for status change
    if (status) {
      await supabase
        .from('ticket_messages')
        .insert({
          tenant_id: tenant.id,
          ticket_id: id,
          message_type: 'status_change',
          sender_type: 'system',
          body: `Status changed to: ${status}`,
          is_internal: false,
        })
    }

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
