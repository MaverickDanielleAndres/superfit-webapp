import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const BroadcastHistoryLogSchema = z.object({
  target: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  delivered: z.number().int().min(0),
  read: z.number().int().min(0),
})

export async function GET() {
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

  const { data, error } = await (supabase as any)
    .from('coach_broadcast_logs')
    .select('id,audience_label,message,delivered_count,read_count,created_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_BROADCAST_HISTORY_FETCH_FAILED',
      title: 'Broadcast History Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      broadcasts: data ?? [],
    },
  })
}

export async function POST(request: Request) {
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

  const parsed = BroadcastHistoryLogSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid broadcast history payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { error } = await (supabase as any)
    .from('coach_broadcast_logs')
    .insert({
      coach_id: user.id,
      audience_label: parsed.data.target,
      message: parsed.data.message,
      delivered_count: parsed.data.delivered,
      read_count: parsed.data.read,
    })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_BROADCAST_HISTORY_LOG_FAILED',
      title: 'Broadcast History Log Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      logged: true,
    },
  })
}
