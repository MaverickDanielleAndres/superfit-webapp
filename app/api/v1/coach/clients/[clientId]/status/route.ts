import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateClientStatusSchema = z.object({
  status: z.enum(['Active', 'Onboarding', 'Inactive']),
})

interface RouteContext {
  params: Promise<{ clientId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { clientId } = await context.params
  const linkId = clientId
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as any
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

  const parsed = UpdateClientStatusSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid client status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: existingLink, error: existingLinkError } = await db
    .from('coach_client_links')
    .select('id,coach_id,client_id')
    .eq('id', linkId)
    .maybeSingle()

  if (existingLinkError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_STATUS_UPDATE_FAILED',
      title: 'Client Status Update Failed',
      detail: existingLinkError.message,
      requestId,
    })
  }

  if (!existingLink?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_CLIENT_LINK_NOT_FOUND',
      title: 'Client Link Not Found',
      detail: 'Client link not found.',
      requestId,
      retriable: false,
    })
  }

  if (String(existingLink.coach_id || '') !== user.id) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You can only update your own client links.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await db
    .from('coach_client_links')
    .update({ status: parsed.data.status.toLowerCase() })
    .eq('id', linkId)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_STATUS_UPDATE_FAILED',
      title: 'Client Status Update Failed',
      detail: error.message,
      requestId,
    })
  }

  await createNotification(db, {
    recipientId: String(existingLink.client_id || ''),
    actorId: user.id,
    type: 'coach_client_status',
    title: 'Coach roster status updated',
    body: `Your coach updated your roster status to ${parsed.data.status}.`,
    actionUrl: '/coaching',
    payload: {
      linkId,
      status: parsed.data.status,
    },
  })

  return dataResponse({
    requestId,
    data: {
      linkId,
      status: parsed.data.status,
    },
  })
}
