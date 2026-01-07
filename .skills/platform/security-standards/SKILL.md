# Security Standards

> **Tier:** Platform (Tier 1)
> **Applies To:** All NexCyte repos
> **Override Policy:** LOCKED
> **Version:** 1.0.0

## Skill Relationships

**Complements:** supabase-patterns, api-design
**Extended By:** None
**See Also:** multi-tenant

## Purpose

Defines the mandatory security patterns for authentication, authorization, role-based access control, and data protection across all NexCyte projects. These standards are LOCKED and cannot be overridden.

## Scope Boundaries

**This skill covers:**
- Role hierarchy and permissions
- Authentication middleware
- Supabase auth integration
- Service client usage (bypass RLS)
- Input validation
- Secret management

**This skill does NOT cover (see other skills):**
- Database schema -> see supabase-patterns
- API route structure -> see api-design
- Tenant isolation -> see multi-tenant

## Patterns

### 1. Role Hierarchy

**When to use:** Any permission check in the application

**Implementation:**

```typescript
// src/lib/permissions.ts
export type UserRole = 'customer' | 'viewer' | 'customer_service' | 'admin' | 'owner'

// Role hierarchy (lower index = lower permissions)
const ROLE_HIERARCHY: UserRole[] = [
  'customer',        // Level 0: Public customer with order access
  'viewer',          // Level 1: Read-only access to CRM
  'customer_service',// Level 2: View and edit customers and orders
  'admin',           // Level 3: Full CRM access, cannot manage users
  'owner'            // Level 4: Full access including user management
]

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = getRoleLevel(userRole)
  const requiredLevel = getRoleLevel(requiredRole)

  if (userLevel === -1 || requiredLevel === -1) return false
  return userLevel >= requiredLevel
}

// Specific permission checks
export function canAccessCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'customer_service')
}

export function canEditCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'customer_service')
}

export function canDeleteCRM(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin')
}

export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'owner'
}

export function canInviteTeamMembers(userRole: UserRole): boolean {
  return userRole === 'owner'
}
```

**Anti-patterns to avoid:**

```typescript
// DON'T hardcode role checks
if (user.role === 'admin' || user.role === 'owner') { ... }

// DON'T allow role escalation without checks
function setUserRole(userId: string, newRole: UserRole) {
  // Missing check that requester has higher role than target!
}

// DON'T compare roles as strings
if (user.role > 'admin') { ... }  // Strings don't compare correctly
```

### 2. Middleware Authentication

**When to use:** Protecting routes that require authentication

**Implementation:**

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  // Check env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars not configured')
    return response
  }

  // Create auth client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  // Protected admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    if (!supabaseServiceKey) {
      console.warn('SUPABASE_SERVICE_KEY not configured')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role with service client (bypasses RLS)
    const serviceClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Account not found or inactive')
      return NextResponse.redirect(url)
    }

    const allowedRoles = ['owner', 'admin', 'customer_service', 'viewer']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
}
```

### 3. Service Client Usage

**When to use:** Admin operations that need to bypass RLS

**Implementation:**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Regular client - uses anon key, respects RLS
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component - ignore */ }
        },
      },
    }
  )
}

// Service client - bypasses RLS, use sparingly!
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

**Critical rules:**
- NEVER expose service key to client
- ONLY use in server-side code
- ALWAYS verify user permissions before using
- LOG admin actions for audit trail

### 4. API Input Validation

**When to use:** Every API endpoint that accepts user input

**Implementation:**

```typescript
// src/lib/validations/api-schemas.ts
import { z } from 'zod'

export const checkoutSchema = z.object({
  cartItems: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().optional(),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().length(2),
    postal_code: z.string().min(5).max(10),
    country: z.literal('US'),
  }),
  billingAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    postal_code: z.string().min(5).max(10),
    country: z.literal('US'),
  }),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false as const,
      error: {
        message: 'Validation failed',
        details: result.error.issues,
      },
    }
  }
  return { success: true as const, data: result.data }
}
```

### 5. Environment Variables

**When to use:** Managing secrets and configuration

```env
# .env.example - Document all required vars

# Public (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_TENANT_SLUG=ezcr-dev

# Server-only (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Checklist

Before committing security-related code:

- [ ] No hardcoded secrets or API keys
- [ ] Service client only used server-side with permission checks
- [ ] All user input validated with Zod schemas
- [ ] Role checks use `hasPermission()` not direct comparison
- [ ] Protected routes have middleware authentication
- [ ] Sensitive env vars not prefixed with `NEXT_PUBLIC_`
- [ ] Error messages don't leak internal details
- [ ] Admin actions are logged

## Critical Rules (NON-NEGOTIABLE)

1. **Never expose `SUPABASE_SERVICE_KEY` to client code**
2. **Always validate user permissions before service client operations**
3. **Use Zod validation on all external inputs**
4. **Role hierarchy is immutable** - don't add shortcuts
5. **Log all admin/destructive actions**

## Permission Error Messages

```typescript
export const PermissionErrors = {
  NOT_AUTHENTICATED: 'You must be logged in to perform this action',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  OWNER_ONLY: 'Only owners can perform this action',
  CANNOT_MODIFY_OWNER: 'Owner accounts cannot be modified',
  CANNOT_MODIFY_SELF: 'You cannot perform this action on your own account',
} as const
```
