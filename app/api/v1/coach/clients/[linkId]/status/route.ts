import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateClientStatusSchema = z.object({
  status: z.enum(['Active', 'Paused']),
})

interface RouteContext {
  params: Promise<{ linkId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { linkId } = await context.params
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

  const { error } = await (supabase as any)
    .from('coach_client_links')
    .update({ status: parsed.data.status.toLowerCase() })
    .eq('id', linkId)
    .eq('coach_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_STATUS_UPDATE_FAILED',
      title: 'Client Status Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      linkId,
      status: parsed.data.status,
    },
  })
}
