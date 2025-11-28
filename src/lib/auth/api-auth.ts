import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * API Authentication Helper
 * Provides authentication and authorization for API routes
 */

export interface AuthUser {
  id: string
  email: string
  role: string
  tenantId: string
}

export interface AuthResult {
  authenticated: boolean
  user: AuthUser | null
  error: string | null
}

/**
 * Authenticate API request and get user info
 * Checks for valid session and retrieves user profile
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Get Supabase URL and anon key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        authenticated: false,
        user: null,
        error: 'Server configuration error',
      }
    }

    // Create Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })

    // Get session from cookies
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        authenticated: false,
        user: null,
        error: 'No valid session found',
      }
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, tenant_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return {
        authenticated: false,
        user: null,
        error: 'User profile not found',
      }
    }

    return {
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role || 'customer',
        tenantId: profile.tenant_id,
      },
      error: null,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      authenticated: false,
      user: null,
      error: 'Authentication failed',
    }
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role)
}

/**
 * Require authentication for API route
 * Returns user or throws error response data
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthUser; error?: never } | { error: any; status: number; user?: never }> {
  const authResult = await authenticateRequest(request)

  if (!authResult.authenticated || !authResult.user) {
    return {
      error: { error: authResult.error || 'Authentication required' },
      status: 401,
    }
  }

  return { user: authResult.user }
}

/**
 * Require specific role for API route
 * Returns user or throws error response data
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: AuthUser; error?: never } | { error: any; status: number; user?: never }> {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult
  }

  if (!hasRole(authResult.user, allowedRoles)) {
    return {
      error: {
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: authResult.user.role,
      },
      status: 403,
    }
  }

  return { user: authResult.user }
}

/**
 * Role definitions
 */
export const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  CUSTOMER_SERVICE: 'customer_service',
  CUSTOMER: 'customer',
} as const

/**
 * Common role groups
 */
export const ROLE_GROUPS = {
  ADMIN_ROLES: ['admin'] as string[],
  INVENTORY_ROLES: ['admin', 'inventory_manager'] as string[],
  STAFF_ROLES: ['admin', 'inventory_manager', 'customer_service'] as string[],
  ALL_ROLES: ['admin', 'inventory_manager', 'customer_service', 'customer'] as string[],
}

/**
 * Authenticate admin for API routes
 * Returns supabase client, user, and potential error
 */
export async function authenticateAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      supabase: null,
      user: null,
      error: { message: 'Server configuration error', status: 500 },
    }
  }

  // Create admin Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get auth result
  const authResult = await requireRole(request, ROLE_GROUPS.ADMIN_ROLES)

  if ('error' in authResult) {
    const errorResult = authResult as { error: { error: string }; status: number }
    return {
      supabase: null,
      user: null,
      error: { message: errorResult.error.error, status: errorResult.status },
    }
  }

  return {
    supabase,
    user: authResult.user,
    error: null,
  }
}
