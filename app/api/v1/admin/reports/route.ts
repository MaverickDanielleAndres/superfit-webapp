import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ALLOWED_STATUSES = new Set(['pending', 'dismissed', 'removed', 'warned', 'banned'])

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
  const contentTypeFilter = normalizeFilter(params.get('contentType'))
  const uploaderRoleFilter = normalizeFilter(params.get('uploaderRole'))
  const dateFrom = String(params.get('dateFrom') || '').trim()
  const dateTo = String(params.get('dateTo') || '').trim()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (supabase as any)
    .from('admin_moderation_reports')
    .select('id,reason,content_type,status,created_at,notes,target_user_id,target_post_id,reporter_id', { count: 'exact' })

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  if (contentTypeFilter) {
    query = query.eq('content_type', contentTypeFilter)
  }

  if (uploaderRoleFilter === 'coach' || uploaderRoleFilter === 'user') {
    const { data: matchingTargets, error: matchingTargetsError } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('role', uploaderRoleFilter)

    if (matchingTargetsError) {
      return problemResponse({
        status: 500,
        code: 'ADMIN_REPORTS_FETCH_FAILED',
        title: 'Reports Fetch Failed',
        detail: matchingTargetsError.message,
        requestId,
      })
    }

    const targetIds = (matchingTargets || [])
      .map((row: { id?: string | null }) => String(row.id || ''))
      .filter(Boolean)

    if (!targetIds.length) {
      return dataResponse({
        requestId,
        data: {
          reports: [],
          total: 0,
          page,
          pageSize,
          totalPages: 1,
        },
      })
    }

    query = query.in('target_user_id', targetIds)
  }

  if (dateFrom.length) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo.length) {
    query = query.lte('created_at', dateTo)
  }

  if (search.length) {
    const escapedSearch = search.replaceAll(',', ' ').replaceAll('.', ' ')
    const { data: reporterMatches, error: reporterMatchesError } = await (supabase as any)
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
      .limit(50)

    if (reporterMatchesError) {
      return problemResponse({
        status: 500,
        code: 'ADMIN_REPORTS_FETCH_FAILED',
        title: 'Reports Fetch Failed',
        detail: reporterMatchesError.message,
        requestId,
      })
    }

    const reporterIds = (reporterMatches || [])
      .map((row: { id?: string | null }) => String(row.id || '').trim())
      .filter(Boolean)

    const clauses = [
      `reason.ilike.%${escapedSearch}%`,
      `content_type.ilike.%${escapedSearch}%`,
    ]
    if (reporterIds.length) {
      clauses.push(`reporter_id.in.(${reporterIds.join(',')})`)
    }

    query = query.or(clauses.join(','))
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_REPORTS_FETCH_FAILED',
      title: 'Reports Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const reportRows = Array.isArray(data) ? data : []
  const reporterIds = Array.from(
    new Set(
      reportRows
        .map((row: { reporter_id?: string | null }) => String(row.reporter_id || ''))
        .filter(Boolean),
    ),
  )
  const targetUserIds = Array.from(
    new Set(
      reportRows
        .map((row: { target_user_id?: string | null }) => String(row.target_user_id || ''))
        .filter(Boolean),
    ),
  )

  const reporterMap = new Map<string, { full_name?: string | null; email?: string | null }>()
  const targetUserMap = new Map<string, { full_name?: string | null; email?: string | null; role?: string | null }>()

  if (reporterIds.length) {
    const { data: reporters, error: reportersError } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .in('id', reporterIds)

    if (!reportersError) {
      for (const reporter of reporters || []) {
        const reporterId = String(reporter.id || '')
        if (!reporterId) continue
        reporterMap.set(reporterId, {
          full_name: reporter.full_name,
          email: reporter.email,
        })
      }
    }
  }

  if (targetUserIds.length) {
    const { data: targets, error: targetsError } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email,role')
      .in('id', targetUserIds)

    if (!targetsError) {
      for (const target of targets || []) {
        const targetId = String(target.id || '')
        if (!targetId) continue
        targetUserMap.set(targetId, {
          full_name: target.full_name,
          email: target.email,
          role: target.role,
        })
      }
    }
  }

  const reports = reportRows.map((row: Record<string, unknown>) => ({
    ...row,
    reporter: reporterMap.get(String(row.reporter_id || '')) || null,
    target_user: targetUserMap.get(String(row.target_user_id || '')) || null,
  }))

  const total = Number(count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return dataResponse({
    requestId,
    data: {
      reports,
      total,
      page,
      pageSize,
      totalPages,
    },
  })
}
