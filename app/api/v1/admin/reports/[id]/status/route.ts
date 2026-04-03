import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const StatusSchema = z.object({
  status: z.enum(['Pending', 'Dismissed', 'Removed', 'Warned', 'Banned']),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || String(profile.role || '').toLowerCase() !== 'admin') {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admin access required.',
      requestId,
      retriable: false,
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problemResponse({
      status: 400,
      code: 'INVALID_JSON',
      title: 'Invalid JSON',
      detail: 'Request body must be valid JSON.',
      requestId,
      retriable: false,
    })
  }

  const parsed = StatusSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid report status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: report, error: reportLookupError } = await (supabase as any)
    .from('admin_moderation_reports')
    .select('id,target_user_id,target_post_id')
    .eq('id', id)
    .single()

  if (reportLookupError || !report) {
    return problemResponse({
      status: 404,
      code: 'REPORT_NOT_FOUND',
      title: 'Report Not Found',
      detail: reportLookupError?.message || 'Report does not exist.',
      requestId,
      retriable: false,
    })
  }

  const normalizedStatus = parsed.data.status.toLowerCase()

  const { error: updateError } = await (supabase as any)
    .from('admin_moderation_reports')
    .update({ status: normalizedStatus, reviewed_by: user.id })
    .eq('id', id)

  if (updateError) {
    return problemResponse({
      status: 500,
      code: 'REPORT_STATUS_UPDATE_FAILED',
      title: 'Report Update Failed',
      detail: updateError.message,
      requestId,
    })
  }

  if (normalizedStatus === 'removed' && report.target_post_id) {
    await (supabase as any)
      .from('community_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', report.target_post_id)
  }

  if (normalizedStatus === 'banned' && report.target_user_id) {
    await (supabase as any)
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', report.target_user_id)
  }

  return dataResponse({
    requestId,
    data: {
      id,
      status: parsed.data.status,
    },
  })
}
