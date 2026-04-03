import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const StatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
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
      detail: 'Invalid application status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const normalizedStatus = parsed.data.status.toLowerCase()

  const { data: application, error: selectError } = await (supabase as any)
    .from('admin_coach_applications')
    .select('id,applicant_id')
    .eq('id', id)
    .single()

  if (selectError || !application) {
    return problemResponse({
      status: 404,
      code: 'APPLICATION_NOT_FOUND',
      title: 'Application Not Found',
      detail: selectError?.message || 'Application does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { error: updateError } = await (supabase as any)
    .from('admin_coach_applications')
    .update({
      status: normalizedStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)

  if (updateError) {
    return problemResponse({
      status: 500,
      code: 'APPLICATION_STATUS_UPDATE_FAILED',
      title: 'Application Update Failed',
      detail: updateError.message,
      requestId,
    })
  }

  if (application.applicant_id && normalizedStatus === 'approved') {
    await (supabase as any)
      .from('profiles')
      .update({ role: 'coach', account_status: 'active' })
      .eq('id', application.applicant_id)
  }

  const { error: invokeError } = await supabase.functions.invoke('on-application-status-updated', {
    body: { applicationId: id },
  })

  return dataResponse({
    requestId,
    data: {
      id,
      status: parsed.data.status,
      notificationFailed: Boolean(invokeError),
      notificationError: invokeError?.message,
    },
  })
}
