import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const NotificationPatchSchema = z.object({
  action: z.enum(['read', 'seen', 'unread']),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const parsed = NotificationPatchSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid notification action payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const nowIso = new Date().toISOString()
  const patch =
    parsed.data.action === 'read'
      ? { read_at: nowIso, seen_at: nowIso }
      : parsed.data.action === 'seen'
        ? { seen_at: nowIso }
        : { read_at: null }

  const { data, error } = await (db as any)
    .from('notifications')
    .update(patch)
    .eq('id', id)
    .eq('recipient_id', user.id)
    .select('id,read_at,seen_at')
    .maybeSingle()

  if (error || !data) {
    return problemResponse({
      status: 404,
      code: 'NOTIFICATION_NOT_FOUND',
      title: 'Notification Not Found',
      detail: error?.message || 'Notification does not exist.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id: String(data.id),
      readAt: data.read_at ? String(data.read_at) : null,
      seenAt: data.seen_at ? String(data.seen_at) : null,
    },
  })
}
