/**
 * Permission checking and role hierarchy utilities
 */

export type UserRole = 'customer' | 'viewer' | 'customer_service' | 'admin' | 'owner'

/**
 * Role hierarchy (lower index = lower permissions)
 */
const ROLE_HIERARCHY: UserRole[] = ['customer', 'viewer', 'customer_service', 'admin', 'owner']

/**
 * Get the numeric level of a role in the hierarchy
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

/**
 * Check if a user's role meets the minimum required role
 * Returns true if userRole >= requiredRole in the hierarchy
 *
 * @example
 * hasPermission('admin', 'viewer') // true (admin >= viewer)
 * hasPermission('viewer', 'admin') // false (viewer < admin)
 * hasPermission('owner', 'owner') // true (owner === owner)
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = getRoleLevel(userRole)
  const requiredLevel = getRoleLevel(requiredRole)

  if (userLevel === -1 || requiredLevel === -1) {
    return false
  }

  return userLevel >= requiredLevel
}

/**
 * Check if a user can manage (edit/delete) another user
 * Rules:
 * - Only owners can manage other users
 * - Cannot manage yourself (for certain operations like delete)
 * - Cannot manage other owners
 */
export function canManageUser(
  managerRole: UserRole,
  targetRole: UserRole,
  isSelf: boolean = false
): boolean {
  // Only owners can manage users
  if (managerRole !== 'owner') {
    return false
  }

  // Cannot manage other owners
  if (targetRole === 'owner') {
    return false
  }

  // For destructive operations (delete, deactivate), cannot manage yourself
  if (isSelf) {
    return false
  }

  return true
}

/**
 * Check if a user can view team members
 * Owners and admins can view team members
 */
export function canViewTeam(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin')
}

/**
 * Check if a user can invite new team members
 * Only owners can invite
 */
export function canInviteTeamMembers(userRole: UserRole): boolean {
  return userRole === 'owner'
}

/**
 * Check if a user can access CRM features
 * Customer service and above can access CRM
 */
export function canAccessCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'customer_service')
}

/**
 * Check if a user can edit CRM data (customers, orders)
 * Customer service and above can edit
 */
export function canEditCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'customer_service')
}

/**
 * Check if a user can delete CRM data
 * Only admins and owners can delete
 */
export function canDeleteCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin')
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    customer: 'Customer',
    viewer: 'Viewer',
    customer_service: 'Customer Service',
    admin: 'Admin',
    owner: 'Owner',
  }

  return names[role] || role
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    customer: 'Public customer with order access',
    viewer: 'Read-only access to CRM',
    customer_service: 'View and edit customers and orders',
    admin: 'Full CRM access, cannot manage users',
    owner: 'Full access including user management',
  }

  return descriptions[role] || 'No description available'
}

/**
 * Get available roles for invitation
 * Customers cannot be invited (they sign up), owners must be assigned manually in DB
 */
export function getInvitableRoles(): UserRole[] {
  return ['viewer', 'customer_service', 'admin']
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    customer: 'bg-gray-100 text-gray-800',
    viewer: 'bg-blue-100 text-blue-800',
    customer_service: 'bg-green-100 text-green-800',
    admin: 'bg-purple-100 text-purple-800',
    owner: 'bg-yellow-100 text-yellow-800',
  }

  return colors[role] || 'bg-gray-100 text-gray-800'
}

/**
 * Permission error messages
 */
export const PermissionErrors = {
  NOT_AUTHENTICATED: 'You must be logged in to perform this action',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  OWNER_ONLY: 'Only owners can perform this action',
  CANNOT_MODIFY_OWNER: 'Owner accounts cannot be modified',
  CANNOT_MODIFY_SELF: 'You cannot perform this action on your own account',
} as const
