'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'
import type {
  CustomerProfile,
  CustomerListFilters,
  CustomerListSortOptions,
  CustomerNote,
  CustomerTask,
  CustomerTag,
  CRMActivity,
  CustomerHealthScore,
} from '@/types/crm'

/**
 * Get tenant ID using environment-aware configuration
 * Uses the tenant utility which automatically detects dev vs prod
 */
async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

/**
 * Get list of customers with filters and sorting
 */
export async function getCustomers(
  filters?: CustomerListFilters,
  sort?: CustomerListSortOptions,
  page: number = 1,
  pageSize: number = 50
) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    let query = supabase
      .from('customer_profiles_unified')
      .select('*')
      .eq('tenant_id', tenantId)

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
    }

    if (filters?.min_ltv) {
      query = query.gte('lifetime_value', filters.min_ltv)
    }

    if (filters?.max_ltv) {
      query = query.lte('lifetime_value', filters.max_ltv)
    }

    if (filters?.min_orders) {
      query = query.gte('order_count', filters.min_orders)
    }

    if (filters?.max_orders) {
      query = query.lte('order_count', filters.max_orders)
    }

    if (filters?.health_score_min) {
      query = query.gte('health_score', filters.health_score_min)
    }

    if (filters?.health_score_max) {
      query = query.lte('health_score', filters.health_score_max)
    }

    if (filters?.last_order_after) {
      query = query.gte('last_order_date', filters.last_order_after)
    }

    if (filters?.last_order_before) {
      query = query.lte('last_order_date', filters.last_order_before)
    }

    if (filters?.has_open_tasks) {
      query = query.gt('open_task_count', 0)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('last_order_date', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      customers: data as CustomerProfile[],
      total: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
}

/**
 * Get single customer profile by email
 */
export async function getCustomerProfile(email: string): Promise<CustomerProfile | null> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_profiles_unified')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .single()

    if (error) throw error

    return data as CustomerProfile
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return null
  }
}

/**
 * Get customer activity timeline
 */
export async function getCustomerActivities(
  email: string,
  limit: number = 100
): Promise<CRMActivity[]> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data as CRMActivity[]
  } catch (error) {
    console.error('Error fetching customer activities:', error)
    return []
  }
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(email: string) {
  try {
    const supabase = createServiceClient()

    // Fetch orders directly without joins (FK relationship issues with order_items)
    // Product info is stored directly on order for QBO imports
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }
}

/**
 * Get customer notes
 */
export async function getCustomerNotes(email: string): Promise<CustomerNote[]> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_notes')
      .select(`
        *,
        author:author_id (
          email,
          user_profiles!inner (first_name, last_name)
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as CustomerNote[]
  } catch (error) {
    console.error('Error fetching customer notes:', error)
    return []
  }
}

/**
 * Add customer note
 */
export async function addCustomerNote(email: string, note: string, isPinned: boolean = false) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('customer_notes')
      .insert({
        tenant_id: tenantId,
        customer_email: email,
        author_id: user.id,
        note,
        is_pinned: isPinned,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity(email, 'note_added', { note_id: data.id, preview: note.substring(0, 100) })

    return data
  } catch (error) {
    console.error('Error adding customer note:', error)
    throw error
  }
}

/**
 * Update customer note
 */
export async function updateCustomerNote(noteId: string, note: string, isPinned: boolean) {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('customer_notes')
      .update({ note, is_pinned: isPinned })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating customer note:', error)
    throw error
  }
}

/**
 * Delete customer note
 */
export async function deleteCustomerNote(noteId: string) {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting customer note:', error)
    throw error
  }
}

/**
 * Get customer tasks
 */
export async function getCustomerTasks(email: string): Promise<CustomerTask[]> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_tasks')
      .select(`
        *,
        assignee:assigned_to (
          email,
          user_profiles!inner (first_name, last_name)
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .order('status', { ascending: true })
      .order('due_date', { ascending: true })

    if (error) throw error

    return data as CustomerTask[]
  } catch (error) {
    console.error('Error fetching customer tasks:', error)
    return []
  }
}

/**
 * Create customer task
 */
export async function createCustomerTask(
  email: string,
  title: string,
  description?: string,
  dueDate?: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  assignedTo?: string
) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('customer_tasks')
      .insert({
        tenant_id: tenantId,
        customer_email: email,
        created_by: user.id,
        assigned_to: assignedTo || user.id,
        title,
        description,
        due_date: dueDate,
        priority,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity(email, 'task_created', { task_id: data.id, title })

    return data
  } catch (error) {
    console.error('Error creating customer task:', error)
    throw error
  }
}

/**
 * Update customer task
 */
export async function updateCustomerTask(
  taskId: string,
  updates: Partial<CustomerTask>
) {
  try {
    const supabase = createServiceClient()

    // If marking as completed, set completed_at
    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('customer_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error

    // Log activity if completed
    if (updates.status === 'completed') {
      await logActivity(data.customer_email, 'task_completed', { task_id: taskId, title: data.title })
    }

    return data
  } catch (error) {
    console.error('Error updating customer task:', error)
    throw error
  }
}

/**
 * Delete customer task
 */
export async function deleteCustomerTask(taskId: string) {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('customer_tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting customer task:', error)
    throw error
  }
}

/**
 * Get all customer tags
 */
export async function getCustomerTags(): Promise<CustomerTag[]> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (error) throw error

    return data as CustomerTag[]
  } catch (error) {
    console.error('Error fetching customer tags:', error)
    return []
  }
}

/**
 * Get customer tags for specific customer
 */
export async function getCustomerTagsForCustomer(email: string): Promise<CustomerTag[]> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_tag_assignments')
      .select('tag:tag_id(*)')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)

    if (error) throw error

    return (data?.map(d => d.tag) || []) as unknown as CustomerTag[]
  } catch (error) {
    console.error('Error fetching customer tags:', error)
    return []
  }
}

/**
 * Add tag to customer
 */
export async function addTagToCustomer(email: string, tagId: string) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('customer_tag_assignments')
      .insert({
        tenant_id: tenantId,
        customer_email: email,
        tag_id: tagId,
        assigned_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Already exists, return success
        return { success: true, message: 'Tag already assigned' }
      }
      throw error
    }

    // Log activity
    const { data: tag } = await supabase
      .from('customer_tags')
      .select('name')
      .eq('id', tagId)
      .single()

    await logActivity(email, 'tag_added', { tag_id: tagId, tag_name: tag?.name })

    return data
  } catch (error) {
    console.error('Error adding tag to customer:', error)
    throw error
  }
}

/**
 * Remove tag from customer
 */
export async function removeTagFromCustomer(email: string, tagId: string) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Get tag name before deleting
    const { data: tag } = await supabase
      .from('customer_tags')
      .select('name')
      .eq('id', tagId)
      .single()

    const { error } = await supabase
      .from('customer_tag_assignments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .eq('tag_id', tagId)

    if (error) throw error

    // Log activity
    await logActivity(email, 'tag_removed', { tag_id: tagId, tag_name: tag?.name })

    return { success: true }
  } catch (error) {
    console.error('Error removing tag from customer:', error)
    throw error
  }
}

/**
 * Calculate and update customer health score
 */
export async function calculateHealthScore(email: string): Promise<number> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase.rpc('calculate_customer_health_score', {
      p_tenant_id: tenantId,
      p_customer_email: email,
    })

    if (error) throw error

    return data as number
  } catch (error) {
    console.error('Error calculating health score:', error)
    return 0
  }
}

/**
 * Get customer health score
 */
export async function getCustomerHealthScore(email: string): Promise<CustomerHealthScore | null> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .single()

    if (error) {
      // If not found, calculate it
      if (error.code === 'PGRST116') {
        const score = await calculateHealthScore(email)
        return {
          id: '',
          tenant_id: tenantId,
          customer_email: email,
          score,
          factors: {},
          calculated_at: new Date().toISOString(),
        }
      }
      throw error
    }

    return data as CustomerHealthScore
  } catch (error) {
    console.error('Error fetching health score:', error)
    return null
  }
}

/**
 * Log CRM activity (internal helper)
 */
async function logActivity(
  email: string,
  activityType: string,
  activityData: Record<string, any> = {},
  relatedEntityType?: string,
  relatedEntityId?: string
) {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.rpc('log_crm_activity', {
      p_tenant_id: tenantId,
      p_customer_email: email,
      p_activity_type: activityType,
      p_activity_data: activityData,
      p_related_entity_type: relatedEntityType,
      p_related_entity_id: relatedEntityId,
      p_performed_by: user?.id,
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - logging should not break main functionality
  }
}

/**
 * Get CRM dashboard stats
 */
export async function getCRMDashboardStats() {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Get customer count
    const { count: totalCustomers } = await supabase
      .from('customer_profiles_unified')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: newCustomers } = await supabase
      .from('customer_profiles_unified')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('first_order_date', thirtyDaysAgo)

    // Get at-risk customers (no order in 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count: atRiskCustomers } = await supabase
      .from('customer_profiles_unified')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('last_order_date', ninetyDaysAgo)

    // Get customers with open tasks
    const { count: customersWithTasks } = await supabase
      .from('customer_profiles_unified')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gt('open_task_count', 0)

    // Get average LTV
    const { data: ltvData } = await supabase
      .from('customer_profiles_unified')
      .select('lifetime_value')
      .eq('tenant_id', tenantId)

    const avgLTV = ltvData && ltvData.length > 0
      ? ltvData.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / ltvData.length
      : 0

    return {
      totalCustomers: totalCustomers || 0,
      newCustomers: newCustomers || 0,
      atRiskCustomers: atRiskCustomers || 0,
      customersWithTasks: customersWithTasks || 0,
      avgLTV: Math.round(avgLTV * 100) / 100,
    }
  } catch (error) {
    console.error('Error fetching CRM stats:', error)
    return {
      totalCustomers: 0,
      newCustomers: 0,
      atRiskCustomers: 0,
      customersWithTasks: 0,
      avgLTV: 0,
    }
  }
}
