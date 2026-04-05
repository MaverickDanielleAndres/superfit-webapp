import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotification } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revokeAllUserSessions } from '@/lib/auth/adminSessions'
import { createAuditLog } from '@/lib/audit'
import { syncAuthUserMetadata } from '@/lib/auth/userMetadata'

const UpdateUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().max(320).optional(),
    role: z.enum(['User', 'Coach', 'Admin']).optional(),
    status: z.enum(['Active', 'Suspended', 'Inactive', 'Pending Review']).optional(),
    isPremium: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.email !== undefined ||
      value.role !== undefined ||
      value.status !== undefined ||
      value.isPremium !== undefined,
    {
      message: 'At least one user field must be provided.',
      path: ['fullName'],
    },
  )

const SoftDeleteSchema = z.object({
  reason: z.string().trim().max(500).optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

function normalizeRole(role: 'User' | 'Coach' | 'Admin'): 'user' | 'coach' | 'admin' {
  if (role === 'Coach') return 'coach'
  if (role === 'Admin') return 'admin'
  return 'user'
}

function normalizeStatus(status: 'Active' | 'Suspended' | 'Inactive' | 'Pending Review'): 'active' | 'suspended' | 'inactive' | 'pending_review' {
  if (status === 'Suspended') return 'suspended'
  if (status === 'Inactive') return 'inactive'
  if (status === 'Pending Review') return 'pending_review'
  return 'active'
}

async function requireAdmin(requestId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      errorResponse: problemResponse({
        status: 401,
        code: 'UNAUTHORIZED',
        title: 'Unauthorized',
        detail: 'Authentication required.',
        requestId,
        retriable: false,
      }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || String(profile.role || '').toLowerCase() !== 'admin') {
    return {
      supabase,
      user: null,
      errorResponse: problemResponse({
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'Admin access required.',
        requestId,
        retriable: false,
      }),
    }
  }

  return { supabase, user, errorResponse: null }
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const { supabase, user, errorResponse } = await requireAdmin(requestId)

  if (errorResponse || !user) {
    return errorResponse
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

  const parsed = UpdateUserSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid user update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: Record<string, unknown> = {}
  let nextStatus: 'active' | 'suspended' | 'inactive' | 'pending_review' | null = null

  if (parsed.data.fullName !== undefined) {
    payload.full_name = parsed.data.fullName
  }

  if (parsed.data.email !== undefined) {
    payload.email = parsed.data.email
  }

  if (parsed.data.role !== undefined) {
    payload.role = normalizeRole(parsed.data.role)
  }

  if (parsed.data.status !== undefined) {
    const status = normalizeStatus(parsed.data.status)
    payload.account_status = status
    nextStatus = status
    if (status === 'suspended') {
      payload.suspended_at = new Date().toISOString()
      payload.suspended_by = user.id
    } else {
      payload.suspended_at = null
      payload.suspended_by = null
    }
  }

  if (parsed.data.isPremium !== undefined) {
    payload.is_premium = parsed.data.isPremium
  }

  const { data: updated, error } = await (supabase as any)
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id,full_name,email,role,account_status,is_premium,created_at')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_USER_UPDATE_FAILED',
      title: 'User Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!updated?.id) {
    return problemResponse({
      status: 404,
      code: 'USER_NOT_FOUND',
      title: 'User Not Found',
      detail: 'User not found or already deleted.',
      requestId,
      retriable: false,
    })
  }

  if (nextStatus && nextStatus !== 'active') {
    await revokeAllUserSessions(id)
  }

  await syncAuthUserMetadata(id, {
    role: String(updated.role || ''),
    account_status: String(updated.account_status || 'active'),
    is_premium: Boolean(updated.is_premium),
    full_name: updated.full_name ? String(updated.full_name) : null,
  })

  await createNotification(supabaseAdmin as any, {
    recipientId: id,
    actorId: user.id,
    type: 'admin_user_updated',
    title: 'Account details updated',
    body: 'Your account details were updated by an administrator.',
    actionUrl: '/settings',
    payload: {
      userId: id,
    },
  })

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.user.updated',
    resource: 'profiles',
    resourceId: id,
    metadata: {
      fields: Object.keys(payload),
      nextStatus,
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      user: updated,
      updated: true,
    },
  })
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const { supabase, user, errorResponse } = await requireAdmin(requestId)

  if (errorResponse || !user) {
    return errorResponse
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const parsed = SoftDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid delete payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  if (id === user.id) {
    return problemResponse({
      status: 409,
      code: 'ADMIN_SELF_DELETE_BLOCKED',
      title: 'Conflict',
      detail: 'Admins cannot soft-delete their own account.',
      requestId,
      retriable: false,
    })
  }

  const { data: existingProfile, error: existingProfileError } = await (supabase as any)
    .from('profiles')
    .select('id,email,full_name')
    .eq('id', id)
    .maybeSingle()

  if (existingProfileError) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_USER_DELETE_FAILED',
      title: 'User Delete Failed',
      detail: existingProfileError.message,
      requestId,
    })
  }

  if (!existingProfile?.id) {
    return problemResponse({
      status: 404,
      code: 'USER_NOT_FOUND',
      title: 'User Not Found',
      detail: 'User not found.',
      requestId,
      retriable: false,
    })
  }

  const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (deleteAuthUserError) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_USER_DELETE_FAILED',
      title: 'User Delete Failed',
      detail: deleteAuthUserError.message,
      requestId,
    })
  }

  await revokeAllUserSessions(id)

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.user.permanently_deleted',
    resource: 'auth.users',
    resourceId: id,
    metadata: {
      reason: parsed.data.reason || null,
      email: existingProfile.email,
      fullName: existingProfile.full_name,
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      id,
      deleted: true,
      deletedAt: new Date().toISOString(),
    },
  })
}
