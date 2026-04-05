import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ALLOWED_STATUSES = new Set(['active', 'suspended', 'inactive', 'pending_review'])

function parsePositiveInt(value: string | null, fallback: number, min: number, max: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const clamped = Math.floor(numeric)
  if (clamped < min) return min
  if (clamped > max) return max
  return clamped
}

function normalizeFilter(value: string | null): string | null {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized.length ? normalized : null
}

function normalizeSearchTerm(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9@._\-\s]/g, ' ')
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return problemResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      detail: 'Authentication required.',
      requestId,
      retriable: false,
    })
  }

  const roleClaim =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined)

  let isAdmin = String(roleClaim || '').toLowerCase() === 'admin'

  if (!isAdmin) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    isAdmin = !profileError && Boolean(profile) && String(profile?.role || '').toLowerCase() === 'admin'
  }

  if (!isAdmin) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admin access required.',
      requestId,
      retriable: false,
    })
  }

  const params = new URL(request.url).searchParams
  const page = parsePositiveInt(params.get('page'), 1, 1, 10_000)
  const pageSize = parsePositiveInt(params.get('pageSize'), 10, 1, 100)
  const search = normalizeSearchTerm(String(params.get('search') || '').trim())
  const statusFilter = normalizeFilter(params.get('status'))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let coachQuery = (supabase as any)
    .from('profiles')
    .select('id,full_name,email,account_status,created_at', { count: 'exact' })
    .eq('role', 'coach')
    .is('deleted_at', null)

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    coachQuery = coachQuery.eq('account_status', statusFilter)
  }

  if (search.length) {
    const escapedSearch = search.replaceAll(',', ' ').replaceAll('.', ' ')
    coachQuery = coachQuery.or(`full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data: coachesData, error: coachesError, count } = await coachQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  if (coachesError) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_COACHES_FETCH_FAILED',
      title: 'Coaches Fetch Failed',
      detail: coachesError.message,
      requestId,
    })
  }

  const coachRows = Array.isArray(coachesData) ? coachesData : []
  const coachIds = coachRows.map((row: any) => row.id)
  const total = Number(count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const [clientLinksResult, paymentResult] = await Promise.all([
    (supabase as any)
      .from('coach_client_links')
      .select('coach_id')
      .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000']),
    (supabase as any)
      .from('payment_transactions')
      .select('coach_id,amount_cents,status')
      .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000']),
  ])

  return dataResponse({
    requestId,
    data: {
      coaches: coachRows,
      clientLinks: clientLinksResult.data ?? [],
      payments: paymentResult.data ?? [],
      total,
      page,
      pageSize,
      totalPages,
    },
  })
}
