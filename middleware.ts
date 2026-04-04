import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isProtectedPath(pathname: string) {
  if (pathname === '/') return false
  if (pathname.startsWith('/auth')) return false
  if (pathname.startsWith('/_next')) return false
  if (pathname.startsWith('/api')) return false
  return true
}

function isCoachPortalPath(pathname: string) {
  return pathname === '/coach' || pathname.startsWith('/coach/')
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === 'true'

  // Keep current local-auth flow functional until Supabase auth migration is completed.
  if (!isEnabled || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      }
    }
  })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  if (isProtectedPath(pathname) && !session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (session && (pathname === '/' || isProtectedPath(pathname))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role,account_status')
      .eq('id', session.user.id)
      .maybeSingle()

    const role = (profile?.role as string | undefined) ?? (session.user.user_metadata?.role as string | undefined)
    const accountStatus =
      (profile?.account_status as string | undefined) ??
      (session.user.user_metadata?.account_status as string | undefined) ??
      'active'

    if (accountStatus !== 'active') {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('reason', 'account-inactive')
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname === '/') {
      if (role === 'coach') {
        return NextResponse.redirect(new URL('/coach', request.url))
      }

      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isCoachPortalPath(pathname) && role !== 'coach' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
