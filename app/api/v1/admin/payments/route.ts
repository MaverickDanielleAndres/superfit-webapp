import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ALLOWED_STATUSES = new Set(['succeeded', 'failed', 'refunded', 'pending'])

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
  const pageSize = parsePositiveInt(params.get('pageSize'), 20, 1, 100)
  const search = normalizeSearchTerm(String(params.get('search') || '').trim())
  const statusFilter = normalizeFilter(params.get('status'))
  const dateFrom = String(params.get('dateFrom') || '').trim()
  const dateTo = String(params.get('dateTo') || '').trim()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (supabase as any)
    .from('payment_transactions')
    .select('id,user_id,coach_id,amount_cents,status,currency,created_at,external_ref', { count: 'exact' })

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  if (dateFrom.length) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo.length) {
    query = query.lte('created_at', dateTo)
  }

  if (search.length) {
    const escapedSearch = search.replaceAll(',', ' ').replaceAll('.', ' ')
    const { data: profileMatches } = await (supabase as any)
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
      .limit(50)

    const candidateIds = (profileMatches || [])
      .map((row: { id?: string | null }) => String(row.id || '').trim())
      .filter(Boolean)

    const clauses = [
      `id.ilike.%${escapedSearch}%`,
      `external_ref.ilike.%${escapedSearch}%`,
    ]

    if (candidateIds.length) {
      const inValues = candidateIds.join(',')
      clauses.push(`user_id.in.(${inValues})`, `coach_id.in.(${inValues})`)
    }

    query = query.or(clauses.join(','))
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_PAYMENTS_FETCH_FAILED',
      title: 'Payments Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const rows = data || []
  const userIds = new Set<string>()
  for (const row of rows) {
    if (row.user_id) userIds.add(String(row.user_id))
    if (row.coach_id) userIds.add(String(row.coach_id))
  }

  let profilesData: Array<{ id: string; full_name: string | null; email: string | null }> = []
  if (userIds.size) {
    const profilesResult = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .in('id', Array.from(userIds))

    profilesData = profilesResult.data || []
  }

  const profiles = (profilesData || []).map((profile: any) => ({
    id: String(profile.id || ''),
    name: String(profile.full_name || profile.email || 'User'),
  }))

  const total = Number(count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return dataResponse({
    requestId,
    data: {
      payments: rows,
      profiles,
      total,
      page,
      pageSize,
      totalPages,
    },
  })
}
