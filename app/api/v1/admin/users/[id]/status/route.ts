import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotification } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revokeAllUserSessions } from '@/lib/auth/adminSessions'
import { createAuditLog } from '@/lib/audit'
import { syncAuthUserMetadata } from '@/lib/auth/userMetadata'

const StatusSchema = z.object({
  status: z.enum(['Active', 'Suspended', 'Inactive', 'Pending Review']),
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
      detail: 'Invalid user status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const normalizedStatus = parsed.data.status === 'Pending Review'
    ? 'pending_review'
    : parsed.data.status.toLowerCase()
  const updatePayload: Record<string, unknown> = {
    account_status: normalizedStatus,
  }

  if (normalizedStatus === 'suspended') {
    updatePayload.suspended_at = new Date().toISOString()
    updatePayload.suspended_by = user.id
    updatePayload.suspension_reason = 'Updated by admin'
  } else {
    updatePayload.suspended_at = null
    updatePayload.suspended_by = null
    updatePayload.suspension_reason = null
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_USER_STATUS_UPDATE_FAILED',
      title: 'User Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (normalizedStatus !== 'active') {
    await revokeAllUserSessions(id)
  }

  await syncAuthUserMetadata(id, {
    account_status: normalizedStatus,
  })

  await createNotification(supabaseAdmin as any, {
    recipientId: id,
    actorId: user.id,
    type: 'admin_user_status',
    title: 'Account status updated',
    body: `Your account status is now ${parsed.data.status}.`,
    actionUrl: '/settings',
    payload: {
      status: parsed.data.status.toLowerCase(),
    },
  })

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.user.status.updated',
    resource: 'profiles',
    resourceId: id,
    metadata: {
      status: normalizedStatus,
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      id,
      status: parsed.data.status,
    },
  })
}
