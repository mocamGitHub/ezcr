'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'

/**
 * Type definitions for team management
 */
export interface TeamMember {
  id: string
  tenant_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: 'owner' | 'admin' | 'customer_service' | 'viewer' | 'customer'
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface InviteTeamMemberData {
  email: string
  first_name?: string
  last_name?: string
  role: 'admin' | 'customer_service' | 'viewer'
}

export interface UpdateTeamMemberData {
  first_name?: string
  last_name?: string
  phone?: string
  role?: 'admin' | 'customer_service' | 'viewer'
  is_active?: boolean
}

/**
 * Get tenant ID using environment-aware configuration
 */
async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

/**
 * Check if current user is an owner
 */
async function requireOwner() {
  // Use user client to check authentication (reads cookies)
  const supabase = await createClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use service client for database operations
  const serviceClient = createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !profile || profile.role !== 'owner') {
    throw new Error('Only owners can perform this action')
  }

  return user.id
}

/**
 * Check if current user is an owner or admin
 */
async function requireOwnerOrAdmin() {
  // Use user client to check authentication (reads cookies)
  const supabase = await createClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use service client for database operations
  const serviceClient = createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !profile || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  return user.id
}

/**
 * Get all team members for the current tenant
 * Only owners and admins can view team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .neq('role', 'customer') // Don't show customer profiles
      .order('role', { ascending: true })
      .order('first_name', { ascending: true })

    if (error) throw error

    return data as TeamMember[]
  } catch (error) {
    console.error('Error fetching team members:', error)
    throw error
  }
}

/**
 * Get a single team member by ID
 */
export async function getTeamMember(userId: string): Promise<TeamMember | null> {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as TeamMember
  } catch (error) {
    console.error('Error fetching team member:', error)
    return null
  }
}

/**
 * Invite a new team member
 * Creates a user in Supabase Auth and user_profiles table
 * Only owners can invite team members
 */
export async function inviteTeamMember(inviteData: InviteTeamMemberData) {
  try {
    await requireOwner()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', inviteData.email)
      .eq('tenant_id', tenantId)
      .single()

    if (existingUser) {
      throw new Error('User with this email already exists in this tenant')
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: inviteData.email,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        first_name: inviteData.first_name || '',
        last_name: inviteData.last_name || '',
      },
    })

    if (authError) throw authError
    if (!authUser.user) throw new Error('Failed to create user')

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email: inviteData.email,
        first_name: inviteData.first_name || null,
        last_name: inviteData.last_name || null,
        role: inviteData.role,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      // Cleanup: Delete auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw profileError
    }

    // Send invitation email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(inviteData.email)
    if (inviteError) {
      console.error('Error sending invite email:', inviteError)
      // Don't throw - user is created, just email failed
    }

    return {
      success: true,
      user: profile as TeamMember,
      message: 'Team member invited successfully',
    }
  } catch (error) {
    console.error('Error inviting team member:', error)
    throw error
  }
}

/**
 * Update a team member's information
 * Only owners can update team members
 */
export async function updateTeamMember(userId: string, updates: UpdateTeamMemberData) {
  try {
    await requireOwner()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Prevent modifying users from other tenants
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (!existing) {
      throw new Error('User not found or does not belong to this tenant')
    }

    // Prevent changing owner role
    if (existing.role === 'owner' && updates.role) {
      throw new Error('Cannot change owner role')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      user: data as TeamMember,
      message: 'Team member updated successfully',
    }
  } catch (error) {
    console.error('Error updating team member:', error)
    throw error
  }
}

/**
 * Deactivate a team member (soft delete)
 * Only owners can deactivate team members
 */
export async function deactivateTeamMember(userId: string) {
  try {
    await requireOwner()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Prevent deactivating yourself or other owners
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser?.id === userId) {
      throw new Error('Cannot deactivate your own account')
    }

    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetUser) {
      throw new Error('User not found or does not belong to this tenant')
    }

    if (targetUser.role === 'owner') {
      throw new Error('Cannot deactivate owner accounts')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      user: data as TeamMember,
      message: 'Team member deactivated successfully',
    }
  } catch (error) {
    console.error('Error deactivating team member:', error)
    throw error
  }
}

/**
 * Reactivate a team member
 * Only owners can reactivate team members
 */
export async function reactivateTeamMember(userId: string) {
  try {
    await requireOwner()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: true })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      user: data as TeamMember,
      message: 'Team member reactivated successfully',
    }
  } catch (error) {
    console.error('Error reactivating team member:', error)
    throw error
  }
}

/**
 * Delete a team member (hard delete)
 * Only owners can delete team members
 * This deletes both the user_profile and the auth user
 */
export async function deleteTeamMember(userId: string) {
  try {
    await requireOwner()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Prevent deleting yourself or other owners
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser?.id === userId) {
      throw new Error('Cannot delete your own account')
    }

    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetUser) {
      throw new Error('User not found or does not belong to this tenant')
    }

    if (targetUser.role === 'owner') {
      throw new Error('Cannot delete owner accounts')
    }

    // Delete user profile (this will cascade due to foreign key)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId)

    if (profileError) throw profileError

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Error deleting auth user:', authError)
      // Don't throw - profile is deleted, just log the error
    }

    return {
      success: true,
      message: 'Team member deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting team member:', error)
    throw error
  }
}

/**
 * Paginated team members query for AdminDataTable
 */
export interface GetTeamMembersPaginatedParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
}

export interface GetTeamMembersPaginatedResult {
  data: TeamMember[]
  totalCount: number
  page: number
  pageSize: number
}

/**
 * Get paginated team members with sorting and search
 * Only owners and admins can view team members
 */
export async function getTeamMembersPaginated(
  params: GetTeamMembersPaginatedParams = {}
): Promise<GetTeamMembersPaginatedResult> {
  try {
    await requireOwnerOrAdmin()

    const {
      page = 1,
      pageSize = 10,
      sortColumn = 'first_name',
      sortDirection = 'asc',
      search = '',
    } = params

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Build base query
    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .neq('role', 'customer')

    // Apply search filter
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query = query.or(
        `email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`
      )
    }

    // Apply sorting
    const validSortColumns = ['first_name', 'last_name', 'email', 'role', 'is_active', 'last_login', 'created_at']
    const column = validSortColumns.includes(sortColumn) ? sortColumn : 'first_name'
    query = query.order(column, { ascending: sortDirection === 'asc', nullsFirst: false })

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data || []) as TeamMember[],
      totalCount: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error fetching paginated team members:', error)
    throw error
  }
}

/**
 * Get team statistics
 */
export async function getTeamStats() {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('tenant_id', tenantId)
      .neq('role', 'customer')

    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter(u => u.is_active).length,
      inactive: data.filter(u => !u.is_active).length,
      byRole: {
        owner: data.filter(u => u.role === 'owner').length,
        admin: data.filter(u => u.role === 'admin').length,
        customer_service: data.filter(u => u.role === 'customer_service').length,
        viewer: data.filter(u => u.role === 'viewer').length,
      },
    }

    return stats
  } catch (error) {
    console.error('Error fetching team stats:', error)
    throw error
  }
}
