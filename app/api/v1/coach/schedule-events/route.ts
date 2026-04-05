import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const CreateScheduleEventSchema = z.object({
  title: z.string().min(1).max(140),
  label: z.string().max(60).optional(),
  type: z.string().min(1).max(50),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  clientId: z.string().uuid().optional(),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  status: z.enum(['scheduled', 'postponed', 'completed', 'cancelled']).optional(),
})

const UpdateScheduleEventSchema = z
  .object({
    eventId: z.string().uuid(),
    title: z.string().min(1).max(140).optional(),
    label: z.string().max(60).optional(),
    type: z.string().min(1).max(50).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    clientId: z.string().uuid().nullable().optional(),
    imageUrl: z.string().url().max(2048).nullable().optional(),
    status: z.enum(['scheduled', 'postponed', 'completed', 'cancelled']).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.label !== undefined ||
      value.type !== undefined ||
      value.startAt !== undefined ||
      value.endAt !== undefined ||
      value.clientId !== undefined ||
      value.imageUrl !== undefined ||
      value.status !== undefined,
    {
      message: 'At least one update field is required.',
      path: ['eventId'],
    },
  )

export async function GET() {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const { data, error } = await db
    .from('coach_schedule_events')
    .select('id,title,label,event_type,start_at,end_at,status,image_url,client_id')
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
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const { data, error } = await db
    .from('coach_schedule_events')
    .insert({
      coach_id: user.id,
      client_id: parsed.data.clientId || null,
      title: parsed.data.title,
      label: parsed.data.label?.trim() || null,
      event_type: parsed.data.type,
      status: parsed.data.status || 'scheduled',
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      image_url: parsed.data.imageUrl || null,
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

  let notificationErrorMessage: string | undefined
  if (parsed.data.clientId) {
    const nowIso = new Date().toISOString()
    const { error: notificationError } = await db.from('notifications').insert({
      recipient_id: parsed.data.clientId,
      actor_id: user.id,
      type: 'coach_schedule_event',
      title: 'New coaching session scheduled',
      body: `${parsed.data.title} on ${new Date(parsed.data.startAt).toLocaleString()}`,
      action_url: '/coaching',
      payload: {
        eventId: String(data?.id || ''),
        status: parsed.data.status || 'scheduled',
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
      },
      delivered_at: nowIso,
    })

    if (notificationError) notificationErrorMessage = notificationError.message
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      id: String(data?.id || ''),
      created: true,
      notificationFailed: Boolean(notificationErrorMessage),
      notificationError: notificationErrorMessage,
    },
  })
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const parsed = UpdateScheduleEventSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid schedule event update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title
  if (parsed.data.label !== undefined) updatePayload.label = parsed.data.label
  if (parsed.data.type !== undefined) updatePayload.event_type = parsed.data.type
  if (parsed.data.startAt !== undefined) updatePayload.start_at = parsed.data.startAt
  if (parsed.data.endAt !== undefined) updatePayload.end_at = parsed.data.endAt
  if (parsed.data.status !== undefined) updatePayload.status = parsed.data.status
  if (parsed.data.imageUrl !== undefined) updatePayload.image_url = parsed.data.imageUrl
  if (parsed.data.clientId !== undefined) updatePayload.client_id = parsed.data.clientId

  const { data: existingEvent, error: existingEventError } = await db
    .from('coach_schedule_events')
    .select('id,coach_id')
    .eq('id', parsed.data.eventId)
    .maybeSingle()

  if (existingEventError) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_UPDATE_FAILED',
      title: 'Schedule Event Update Failed',
      detail: existingEventError.message,
      requestId,
    })
  }

  if (!existingEvent?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_SCHEDULE_EVENT_NOT_FOUND',
      title: 'Schedule Event Not Found',
      detail: 'Schedule event not found.',
      requestId,
      retriable: false,
    })
  }

  if (String(existingEvent.coach_id || '') !== user.id) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You can only update your own schedule events.',
      requestId,
      retriable: false,
    })
  }

  const { data, error } = await db
    .from('coach_schedule_events')
    .update(updatePayload)
    .eq('id', parsed.data.eventId)
    .select('id,client_id,title,start_at,status')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_UPDATE_FAILED',
      title: 'Schedule Event Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_SCHEDULE_EVENT_NOT_FOUND',
      title: 'Schedule Event Not Found',
      detail: 'Schedule event not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  let notificationErrorMessage: string | undefined
  const updatedClientId = String(data.client_id || '')
  if (updatedClientId) {
    const nowIso = new Date().toISOString()
    const eventStatus = String(data.status || updatePayload.status || 'scheduled')
    const eventTitle = String(data.title || updatePayload.title || 'Coaching Session')
    const eventStartAt = String(data.start_at || updatePayload.start_at || nowIso)

    const { error: notificationError } = await db.from('notifications').insert({
      recipient_id: updatedClientId,
      actor_id: user.id,
      type: 'coach_schedule_event_updated',
      title: 'Coaching session updated',
      body: `${eventTitle} is now ${eventStatus}.`,
      action_url: '/coaching',
      payload: {
        eventId: String(data.id),
        status: eventStatus,
        startAt: eventStartAt,
      },
      delivered_at: nowIso,
    })

    if (notificationError) notificationErrorMessage = notificationError.message
  }

  return dataResponse({
    requestId,
    data: {
      id: String(data.id),
      updated: true,
      notificationFailed: Boolean(notificationErrorMessage),
      notificationError: notificationErrorMessage,
    },
  })
}

export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const url = new URL(request.url)
  let eventId = String(url.searchParams.get('eventId') || url.searchParams.get('id') || '').trim()

  if (!eventId) {
    try {
      const body = (await request.json()) as { eventId?: string; id?: string }
      eventId = String(body?.eventId || body?.id || '').trim()
    } catch {
      // No body provided.
    }
  }

  if (!eventId) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'eventId is required.',
      requestId,
      retriable: false,
    })
  }

  const { data, error } = await db
    .from('coach_schedule_events')
    .select('id,coach_id')
    .eq('id', eventId)
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_DELETE_FAILED',
      title: 'Schedule Event Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_SCHEDULE_EVENT_NOT_FOUND',
      title: 'Schedule Event Not Found',
      detail: 'Schedule event not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  if (String(data.coach_id || '') !== user.id) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You can only delete your own schedule events.',
      requestId,
      retriable: false,
    })
  }

  const { error: deleteError } = await db
    .from('coach_schedule_events')
    .delete()
    .eq('id', eventId)

  if (deleteError) {
    return problemResponse({
      status: 500,
      code: 'COACH_SCHEDULE_DELETE_FAILED',
      title: 'Schedule Event Delete Failed',
      detail: deleteError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id: String(data.id),
      deleted: true,
    },
  })
}
