'use client'

import type { CRMActivity } from '@/types/crm'
import { formatCurrency } from '@/lib/utils'

interface ActivityTimelineProps {
  activities: CRMActivity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No activities recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <ActivityItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
      ))}
    </div>
  )
}

function ActivityItem({ activity, isLast }: { activity: CRMActivity; isLast: boolean }) {
  const icon = getActivityIcon(activity.activity_type)
  const description = getActivityDescription(activity)
  const timestamp = new Date(activity.created_at)

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${getActivityColor(activity.activity_type)}`}>
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2"></div>}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="font-medium">{description}</div>
            <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
              {formatTimestamp(timestamp)}
            </div>
          </div>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <ActivityMetadata activity={activity} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActivityMetadata({ activity }: { activity: CRMActivity }) {
  const metadata = activity.metadata as any

  switch (activity.activity_type) {
    case 'order_placed':
      return (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{metadata.order_number}</span>
          </div>
          {metadata.total_amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{formatCurrency(metadata.total_amount)}</span>
            </div>
          )}
          {metadata.status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{metadata.status}</span>
            </div>
          )}
        </div>
      )

    case 'appointment_scheduled':
    case 'appointment_modified':
      return (
        <div className="space-y-1 text-sm">
          {metadata.appointment_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {new Date(metadata.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {metadata.time_slot && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium capitalize">{metadata.time_slot}</span>
            </div>
          )}
        </div>
      )

    case 'chat_session':
      return (
        <div className="space-y-1 text-sm">
          {metadata.message_count && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Messages:</span>
              <span className="font-medium">{metadata.message_count}</span>
            </div>
          )}
          {metadata.duration && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{Math.round(metadata.duration / 60)} minutes</span>
            </div>
          )}
        </div>
      )

    case 'note_added':
      return (
        <div className="text-sm">
          {metadata.note && (
            <div className="bg-muted/30 p-3 rounded-md border-l-4 border-primary">
              <p className="text-foreground whitespace-pre-wrap">{metadata.note}</p>
            </div>
          )}
          {metadata.is_pinned && (
            <div className="mt-2 text-xs text-primary font-medium">📌 Pinned</div>
          )}
        </div>
      )

    case 'tag_added':
    case 'tag_removed':
      return (
        <div className="text-sm">
          {metadata.tag_name && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: metadata.tag_color || '#3B82F6' }}
              ></span>
              <span className="font-medium">{metadata.tag_name}</span>
            </div>
          )}
        </div>
      )

    case 'task_created':
    case 'task_completed':
      return (
        <div className="space-y-1 text-sm">
          {metadata.task_title && (
            <div className="font-medium">{metadata.task_title}</div>
          )}
          {metadata.task_description && (
            <div className="text-muted-foreground">{metadata.task_description}</div>
          )}
          {metadata.due_date && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>📅</span>
              Due: {new Date(metadata.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="text-sm text-muted-foreground">
          <pre className="whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )
  }
}

function getActivityIcon(activityType: string): string {
  const icons: Record<string, string> = {
    order_placed: '🛒',
    order_shipped: '📦',
    order_delivered: '✅',
    appointment_scheduled: '📅',
    appointment_modified: '🔄',
    appointment_cancelled: '❌',
    chat_session: '💬',
    email_sent: '📧',
    note_added: '📝',
    tag_added: '🏷️',
    tag_removed: '🏷️',
    task_created: '✏️',
    task_completed: '✓',
    phone_call: '📞',
    payment_received: '💰',
  }
  return icons[activityType] || '•'
}

function getActivityColor(activityType: string): string {
  if (activityType.includes('order')) return 'bg-blue-100 text-blue-700'
  if (activityType.includes('appointment')) return 'bg-purple-100 text-purple-700'
  if (activityType.includes('chat') || activityType.includes('email')) return 'bg-green-100 text-green-700'
  if (activityType.includes('note')) return 'bg-yellow-100 text-yellow-700'
  if (activityType.includes('tag')) return 'bg-pink-100 text-pink-700'
  if (activityType.includes('task')) return 'bg-orange-100 text-orange-700'
  if (activityType.includes('payment')) return 'bg-emerald-100 text-emerald-700'
  return 'bg-gray-100 text-gray-700'
}

function getActivityDescription(activity: CRMActivity): string {
  const metadata = activity.metadata as any

  switch (activity.activity_type) {
    case 'order_placed':
      return metadata.order_number 
        ? `Order ${metadata.order_number} placed`
        : 'Order placed'
    case 'order_shipped':
      return 'Order shipped'
    case 'order_delivered':
      return 'Order delivered'
    case 'appointment_scheduled':
      return 'Appointment scheduled'
    case 'appointment_modified':
      return 'Appointment modified'
    case 'appointment_cancelled':
      return 'Appointment cancelled'
    case 'chat_session':
      return metadata.message_count
        ? `Chat session (${metadata.message_count} messages)`
        : 'Chat session started'
    case 'email_sent':
      return metadata.subject || 'Email sent'
    case 'note_added':
      return 'Note added'
    case 'tag_added':
      return metadata.tag_name 
        ? `Tag "${metadata.tag_name}" added`
        : 'Tag added'
    case 'tag_removed':
      return metadata.tag_name
        ? `Tag "${metadata.tag_name}" removed`
        : 'Tag removed'
    case 'task_created':
      return metadata.task_title || 'Task created'
    case 'task_completed':
      return metadata.task_title || 'Task completed'
    case 'phone_call':
      return 'Phone call'
    case 'payment_received':
      return metadata.amount
        ? `Payment received: ${formatCurrency(metadata.amount)}`
        : 'Payment received'
    default:
      return activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
