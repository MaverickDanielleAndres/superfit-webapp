import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotification } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createAuditLog } from '@/lib/audit'
import { syncAuthUserMetadata } from '@/lib/auth/userMetadata'

const PremiumSchema = z.object({
  enabled: z.boolean(),
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

  const parsed = PremiumSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid premium payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_premium: parsed.data.enabled })
    .eq('id', id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_USER_PREMIUM_UPDATE_FAILED',
      title: 'Premium Update Failed',
      detail: error.message,
      requestId,
    })
  }

  await syncAuthUserMetadata(id, {
    is_premium: parsed.data.enabled,
  })

  await createNotification(supabaseAdmin as any, {
    recipientId: id,
    actorId: user.id,
    type: 'admin_premium_update',
    title: parsed.data.enabled ? 'Premium activated' : 'Premium updated',
    body: parsed.data.enabled
      ? 'Your account now has premium access.'
      : 'Your premium access has been disabled.',
    actionUrl: '/subscription',
    payload: {
      enabled: parsed.data.enabled,
    },
  })

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.user.premium.updated',
    resource: 'profiles',
    resourceId: id,
    metadata: {
      enabled: parsed.data.enabled,
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      id,
      enabled: parsed.data.enabled,
    },
  })
}
