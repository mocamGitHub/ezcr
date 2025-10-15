'use server'

import { createServiceClient } from '@/lib/supabase/server'
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
  const supabase = createServiceClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  // TODO: Remove this bypass once authentication is implemented
  // For now, allow access without auth for development/testing
  if (!user) {
    console.warn('WARN: Team management owner action accessed without authentication (dev mode)')
    return 'dev-bypass'
  }

  const { data: profile, error } = await supabase
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
  const supabase = createServiceClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  // TODO: Remove this bypass once authentication is implemented
  // For now, allow access without auth for development/testing
  if (!user) {
    console.warn('WARN: Team management accessed without authentication (dev mode)')
    return 'dev-bypass'
  }

  const { data: profile, error } = await supabase
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
    if (existing.role === 'owner' && updates.role && updates.role !== 'owner') {
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
