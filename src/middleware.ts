import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user has admin access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    if (!profile || !profile.is_active) {
      // User not found or inactive
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Account not found or inactive')
      return NextResponse.redirect(url)
    }

    // Check if user has sufficient role
    const allowedRoles = ['owner', 'admin', 'customer_service', 'viewer']
    if (!allowedRoles.includes(profile.role)) {
      // User doesn't have admin access
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Auth routes - redirect to admin if already logged in
  if ((pathname === '/login' || pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/admin/team', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/signup',
  ],
}
