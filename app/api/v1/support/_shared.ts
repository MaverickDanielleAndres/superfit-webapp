import { createServerSupabaseClient } from '@/lib/supabase/server'
import { problemResponse } from '@/lib/api/problem'

export type SupportRole = 'admin' | 'coach' | 'user'

export interface AuthContext {
  requestId: string
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  userId: string
  role: SupportRole
  isAdmin: boolean
}

export async function requireSupportAuth(requestId: string): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }
> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: problemResponse({
        status: 401,
        code: 'UNAUTHORIZED',
        title: 'Unauthorized',
        detail: 'Authentication required.',
        requestId,
        retriable: false,
      }),
    }
  }

  const roleClaim =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined)

  const normalizedClaimRole = normalizeSupportRole(roleClaim)

  let role: SupportRole = normalizedClaimRole || 'user'

  if (!normalizedClaimRole) {
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return {
        ok: false,
        response: problemResponse({
          status: 403,
          code: 'FORBIDDEN',
          title: 'Forbidden',
          detail: 'Unable to resolve account role.',
          requestId,
          retriable: false,
        }),
      }
    }

    role = normalizeSupportRole(profile.role) || 'user'
  }

  return {
    ok: true,
    ctx: {
      requestId,
      supabase,
      userId: user.id,
      role,
      isAdmin: role === 'admin',
    },
  }
}

export function normalizeSearchTerm(value: string | null): string {
  return String(value || '')
    .replace(/[^a-zA-Z0-9@._\-\s]/g, ' ')
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parsePositiveInt(value: string | null, fallback: number, min: number, max: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const clamped = Math.floor(numeric)
  if (clamped < min) return min
  if (clamped > max) return max
  return clamped
}

export function normalizeSupportRole(value: unknown): SupportRole | null {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'admin' || normalized === 'coach' || normalized === 'user') {
    return normalized
  }
  return null
}

export function supportActionUrlForRole(role: 'coach' | 'user'): string {
  return role === 'coach' ? '/coach/support' : '/support'
}
