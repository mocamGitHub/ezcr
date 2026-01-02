import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Types for webhook events
interface OrderCreatedEvent {
  event: 'order.created'
  data: {
    order_id: string
    order_number?: string
    customer_email?: string
    total_amount?: number
  }
}

interface SchedulerBookingCreatedEvent {
  event: 'scheduler.booking_created' | 'scheduler.callbooked'
  data: {
    booking_id: string
    booking_uid?: string
    attendee_email?: string
    title?: string
    start_at?: string
  }
}

type WebhookEvent = OrderCreatedEvent | SchedulerBookingCreatedEvent

// Validate webhook secret if configured
function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[Tasks Webhook] INTERNAL_WEBHOOK_SECRET not set - accepting all requests')
    return true
  }

  const authHeader = request.headers.get('authorization')
  const secretHeader = request.headers.get('x-webhook-secret')

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === secret
  }

  if (secretHeader) {
    return secretHeader === secret
  }

  return false
}

function getTenantId(): string {
  const tenantId = process.env.EZCR_TENANT_ID
  if (!tenantId) throw new Error('EZCR_TENANT_ID not set')
  return tenantId
}

export async function POST(request: NextRequest) {
  try {
    // Validate secret
    if (!validateWebhookSecret(request)) {
      console.error('[Tasks Webhook] Invalid or missing webhook secret')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing webhook secret' },
        { status: 401 }
      )
    }

    // Parse body
    let body: WebhookEvent
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing event or data field' },
        { status: 400 }
      )
    }

    console.log(`[Tasks Webhook] Received event: ${body.event}`)

    const supabase = await createServiceClient()
    const tenantId = getTenantId()

    // Get the default workspace and board
    const { data: workspace } = await supabase
      .from('task_workspaces')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', 'ops')
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Default workspace not found' },
        { status: 404 }
      )
    }

    const { data: board } = await supabase
      .from('task_boards')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('slug', 'operations')
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Default board not found' },
        { status: 404 }
      )
    }

    // Get inbox column (position 0)
    const { data: inboxColumn } = await supabase
      .from('task_board_columns')
      .select('id')
      .eq('board_id', board.id)
      .eq('slug', 'inbox')
      .single()

    if (!inboxColumn) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Inbox column not found' },
        { status: 404 }
      )
    }

    const tasksCreated: string[] = []

    // Handle different event types
    switch (body.event) {
      case 'order.created': {
        const orderData = body.data
        const orderId = orderData.order_id
        const orderLabel = orderData.order_number || orderId

        // Create "Prepare order" task
        const { data: prepTask, error: prepError } = await supabase
          .from('task_items')
          .insert({
            board_id: board.id,
            column_id: inboxColumn.id,
            title: `Prepare order ${orderLabel}`,
            description: `Prepare order for shipping.\nOrder: ${orderLabel}\nCustomer: ${orderData.customer_email || 'N/A'}`,
            priority: 'high',
            status: 'open',
            position: 0,
            metadata: { source: 'webhook', event: body.event },
          })
          .select()
          .single()

        if (prepError) {
          console.error('[Tasks Webhook] Error creating prep task:', prepError)
        } else if (prepTask) {
          tasksCreated.push(prepTask.id)

          // Link to order
          await supabase.from('task_links').insert({
            task_id: prepTask.id,
            entity_kind: 'order',
            entity_id: orderId,
            meta: { label: orderLabel },
          })
        }

        // Create "Ship order" task
        const { data: shipTask, error: shipError } = await supabase
          .from('task_items')
          .insert({
            board_id: board.id,
            column_id: inboxColumn.id,
            title: `Ship order ${orderLabel}`,
            description: `Ship order to customer.\nOrder: ${orderLabel}`,
            priority: 'normal',
            status: 'open',
            position: 1,
            metadata: { source: 'webhook', event: body.event },
          })
          .select()
          .single()

        if (shipError) {
          console.error('[Tasks Webhook] Error creating ship task:', shipError)
        } else if (shipTask) {
          tasksCreated.push(shipTask.id)

          // Link to order
          await supabase.from('task_links').insert({
            task_id: shipTask.id,
            entity_kind: 'order',
            entity_id: orderId,
            meta: { label: orderLabel },
          })
        }
        break
      }

      case 'scheduler.booking_created':
      case 'scheduler.callbooked': {
        const bookingData = body.data
        const bookingId = bookingData.booking_id
        const bookingLabel = bookingData.attendee_email || bookingData.title || bookingId

        // Create "Prep for call" task
        const { data: prepTask, error: prepError } = await supabase
          .from('task_items')
          .insert({
            board_id: board.id,
            column_id: inboxColumn.id,
            title: `Prep for call: ${bookingLabel}`,
            description: `Prepare for scheduled call.\nAttendee: ${bookingData.attendee_email || 'N/A'}\nTime: ${bookingData.start_at || 'TBD'}`,
            priority: 'high',
            status: 'open',
            start_at: bookingData.start_at,
            position: 0,
            metadata: { source: 'webhook', event: body.event },
          })
          .select()
          .single()

        if (prepError) {
          console.error('[Tasks Webhook] Error creating prep task:', prepError)
        } else if (prepTask) {
          tasksCreated.push(prepTask.id)

          // Link to appointment
          await supabase.from('task_links').insert({
            task_id: prepTask.id,
            entity_kind: 'appointment',
            entity_id: bookingId,
            meta: { label: bookingLabel },
          })
        }

        // Create "Follow up" task
        const { data: followUpTask, error: followUpError } = await supabase
          .from('task_items')
          .insert({
            board_id: board.id,
            column_id: inboxColumn.id,
            title: `Follow up: ${bookingLabel}`,
            description: `Follow up after call with ${bookingData.attendee_email || 'attendee'}.`,
            priority: 'normal',
            status: 'open',
            position: 1,
            metadata: { source: 'webhook', event: body.event },
          })
          .select()
          .single()

        if (followUpError) {
          console.error('[Tasks Webhook] Error creating follow-up task:', followUpError)
        } else if (followUpTask) {
          tasksCreated.push(followUpTask.id)

          // Link to appointment
          await supabase.from('task_links').insert({
            task_id: followUpTask.id,
            entity_kind: 'appointment',
            entity_id: bookingId,
            meta: { label: bookingLabel },
          })
        }
        break
      }

      default: {
        // Type assertion to handle exhaustive check - should never reach here
        const _exhaustiveCheck: never = body
        console.log(`[Tasks Webhook] Unhandled event type: ${(_exhaustiveCheck as WebhookEvent).event}`)
        return NextResponse.json(
          { message: `Event type not handled`, tasks_created: 0 },
          { status: 200 }
        )
      }
    }

    console.log(`[Tasks Webhook] Created ${tasksCreated.length} tasks for event ${body.event}`)

    return NextResponse.json({
      message: 'Tasks created successfully',
      event: body.event,
      tasks_created: tasksCreated.length,
      task_ids: tasksCreated,
    })
  } catch (error) {
    console.error('[Tasks Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/tasks/webhook',
    supported_events: ['order.created', 'scheduler.booking_created', 'scheduler.callbooked'],
  })
}
