import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const CreateScheduleEventSchema = z.object({
  title: z.string().min(1).max(140),
  type: z.string().min(1).max(50),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  clientId: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
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
    .from('coach_schedule_events')
    .select('id,title,event_type,start_at,end_at,status,client_id')
    .eq('coach_id', user.id)
    .order('start_at', { ascending: true })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_FETCH_FAILED',
      title: 'Schedule Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      events: data ?? [],
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

  const parsed = CreateScheduleEventSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid schedule event payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data, error } = await (supabase as any)
    .from('coach_schedule_events')
    .insert({
      coach_id: user.id,
      client_id: parsed.data.clientId || null,
      title: parsed.data.title,
      event_type: parsed.data.type,
      status: parsed.data.status || 'scheduled',
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
    })
    .select('id')
    .single()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_CREATE_FAILED',
      title: 'Schedule Event Create Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      id: String(data?.id || ''),
      created: true,
    },
  })
}
