import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_PROXY_TIMEOUT_MS = 2500

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }
}

function isCoachPortalPath(pathname: string) {
  return pathname === '/coach' || pathname.startsWith('/coach/')
}

function isAdminPortalPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === 'true'
  const pathname = request.nextUrl.pathname

  // Keep current local-auth flow functional until Supabase auth migration is completed.
  if (!isEnabled || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const isRootPath = pathname === '/'
  const isCoachPath = isCoachPortalPath(pathname)
  const isAdminPath = isAdminPortalPath(pathname)

  // Proxy is intentionally scoped to root and role-locked portals.
  if (!isRootPath && !isCoachPath && !isAdminPath) {
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
    global: {
      fetch: createTimeoutFetch(SUPABASE_PROXY_TIMEOUT_MS),
    },
  })

  type SupabaseUser = NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>['user']

  let user: SupabaseUser | null = null

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    user = session?.user ?? null
  } catch {
    // Keep root route responsive even when Supabase is transiently unavailable.
    if (isCoachPath || isAdminPath) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  if ((isCoachPath || isAdminPath) && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && (isRootPath || isCoachPath || isAdminPath)) {
    const shouldAlwaysVerifyProfile = isCoachPath || isAdminPath

    const roleClaim =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined)
    const accountStatusClaim =
      (user.user_metadata?.account_status as string | undefined) ||
      (user.app_metadata?.account_status as string | undefined)

    let role = roleClaim || 'user'
    let accountStatus = accountStatusClaim || 'active'

    const hasClaims =
      typeof roleClaim === 'string' && roleClaim.length > 0 &&
      typeof accountStatusClaim === 'string' && accountStatusClaim.length > 0

    if (shouldAlwaysVerifyProfile || !hasClaims) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role,account_status')
        .eq('id', user.id)
        .maybeSingle()

      role = (profile?.role as string | undefined) ?? role
      accountStatus = (profile?.account_status as string | undefined) ?? accountStatus
    }

    if (accountStatus === 'suspended') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }

    if (accountStatus === 'pending_review' && role === 'coach') {
      return NextResponse.redirect(new URL('/under-review', request.url))
    }

    if (accountStatus !== 'active') {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('reason', 'account-inactive')
      return NextResponse.redirect(redirectUrl)
    }

    if (isRootPath) {
      if (role === 'coach') {
        return NextResponse.redirect(new URL('/coach', request.url))
      }

      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isAdminPath && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isCoachPath && role !== 'coach' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/', '/coach/:path*', '/admin/:path*'],
}
