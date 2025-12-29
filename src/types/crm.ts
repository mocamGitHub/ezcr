// CRM Types - Multi-tenant support
// All CRM operations require tenant_id

export interface CustomerTag {
  id: string
  tenant_id: string
  name: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CustomerTagAssignment {
  id: string
  tenant_id: string
  customer_email: string
  tag_id: string
  assigned_by?: string
  created_at: string
  tag?: CustomerTag
}

export interface CustomerNote {
  id: string
  tenant_id: string
  customer_email: string
  author_id?: string
  note: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  author?: {
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface CustomerTask {
  id: string
  tenant_id: string
  customer_email: string
  assigned_to?: string
  created_by?: string
  title: string
  description?: string
  due_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  completed_at?: string
  created_at: string
  updated_at: string
  assignee?: {
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface CustomerHealthScore {
  id: string
  tenant_id: string
  customer_email: string
  score: number
  factors: {
    recency?: string
    frequency?: string
    monetary?: string
    engagement?: string
  }
  calculated_at: string
}

export interface CRMActivity {
  id: string
  tenant_id: string
  customer_email: string
  activity_type: string
  activity_data: Record<string, unknown>
  metadata?: Record<string, unknown>
  related_entity_type?: string
  related_entity_id?: string
  performed_by?: string
  created_at: string
}

export interface CustomerProfile {
  tenant_id: string
  customer_email: string
  name?: string
  phone?: string
  order_count: number
  lifetime_value: number
  last_order_date?: string
  first_order_date?: string
  last_appointment_date?: string
  completed_orders: number
  pending_orders: number
  tags?: CustomerTag[]
  health_score?: number
  note_count: number
  open_task_count: number
}

export interface CustomerListFilters {
  search?: string
  tags?: string[]
  min_ltv?: number
  max_ltv?: number
  min_orders?: number
  max_orders?: number
  health_score_min?: number
  health_score_max?: number
  last_order_after?: string
  last_order_before?: string
  has_open_tasks?: boolean
}

export interface CustomerListSortOptions {
  field: 'name' | 'lifetime_value' | 'order_count' | 'last_order_date' | 'health_score' | 'open_task_count'
  direction: 'asc' | 'desc'
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  filter: CustomerListFilters
  count?: number
}

// Activity Types for timeline
export const ACTIVITY_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  CHAT_SESSION: 'chat_session',
  EMAIL_SENT: 'email_sent',
  SMS_SENT: 'sms_sent',
  NOTE_ADDED: 'note_added',
  TAG_ADDED: 'tag_added',
  TAG_REMOVED: 'tag_removed',
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  SUPPORT_INQUIRY: 'support_inquiry',
  SURVEY_COMPLETED: 'survey_completed',
  WAITLIST_JOINED: 'waitlist_joined',
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

// Predefined customer segments
export const DEFAULT_SEGMENTS: CustomerSegment[] = [
  {
    id: 'all',
    name: 'All Customers',
    description: 'All customers in the system',
    filter: {},
  },
  {
    id: 'vip',
    name: 'VIP Customers',
    description: 'High-value customers (LTV > $2,000)',
    filter: { min_ltv: 2000 },
  },
  {
    id: 'at-risk',
    name: 'At Risk',
    description: 'No activity in 90+ days',
    filter: { last_order_before: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
  },
  {
    id: 'new',
    name: 'New Customers',
    description: 'First-time buyers (last 30 days)',
    filter: {
      max_orders: 1,
      last_order_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'repeat',
    name: 'Repeat Customers',
    description: 'Customers with 2+ orders',
    filter: { min_orders: 2 },
  },
  {
    id: 'high-value',
    name: 'High Value',
    description: 'LTV > $1,000',
    filter: { min_ltv: 1000 },
  },
  {
    id: 'recent',
    name: 'Recent Purchasers',
    description: 'Ordered in last 30 days',
    filter: { last_order_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  },
  {
    id: 'pending-tasks',
    name: 'With Open Tasks',
    description: 'Customers with pending follow-ups',
    filter: { has_open_tasks: true },
  },
]
