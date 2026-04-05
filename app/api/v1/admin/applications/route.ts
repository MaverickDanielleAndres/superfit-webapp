import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ALLOWED_STATUSES = new Set(['pending', 'approved', 'rejected'])

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
  const emailFilter = String(params.get('email') || '').trim().toLowerCase()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (supabase as any)
    .from('admin_coach_applications')
    .select('id,applicant_id,full_name,email,specialties,experience_years,certificate_url,status,submitted_at,review_notes,reviewed_at,reviewed_by', { count: 'exact' })

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  if (emailFilter.length) {
    query = query.eq('email', emailFilter)
  }

  if (search.length) {
    const escapedSearch = search.replaceAll(',', ' ').replaceAll('.', ' ')
    query = query.or(`full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error, count } = await query
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_APPLICATIONS_FETCH_FAILED',
      title: 'Applications Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const total = Number(count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return dataResponse({
    requestId,
    data: {
      applications: data ?? [],
      total,
      page,
      pageSize,
      totalPages,
    },
  })
}
