import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database, Json } from '@/types/supabase'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const WorkoutUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  exercises: z.array(z.unknown()).optional(),
  totalVolume: z.number().min(0).optional(),
  calories: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isCompleted: z.boolean().optional(),
  routineId: z.string().optional().nullable(),
  isTemplate: z.boolean().optional(),
})

function asNullableUuid(value: string | null | undefined) {
  if (!value) return null
  return UUID_REGEX.test(value) ? value : null
}

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

  const parsed = WorkoutUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid workout update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updates: Database['public']['Tables']['workout_sessions']['Update'] = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.date !== undefined ? { date: parsed.data.date } : {}),
    ...(parsed.data.startTime !== undefined ? { start_time: parsed.data.startTime } : {}),
    ...(parsed.data.endTime !== undefined ? { end_time: parsed.data.endTime } : {}),
    ...(parsed.data.duration !== undefined ? { duration: parsed.data.duration } : {}),
    ...(parsed.data.exercises !== undefined ? { exercises: parsed.data.exercises as Json } : {}),
    ...(parsed.data.totalVolume !== undefined ? { total_volume: parsed.data.totalVolume } : {}),
    ...(parsed.data.calories !== undefined ? { calories: parsed.data.calories } : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    ...(parsed.data.isCompleted !== undefined ? { is_completed: parsed.data.isCompleted } : {}),
    ...(parsed.data.routineId !== undefined ? { routine_id: asNullableUuid(parsed.data.routineId) } : {}),
    ...(parsed.data.isTemplate !== undefined ? { is_template: parsed.data.isTemplate } : {}),
  }

  if (!Object.keys(updates).length) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'No workout updates were provided.',
      requestId,
      retriable: false,
    })
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'WORKOUT_UPDATE_FAILED',
      title: 'Workout Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data) {
    return problemResponse({
      status: 404,
      code: 'WORKOUT_NOT_FOUND',
      title: 'Workout Not Found',
      detail: 'Workout does not exist or cannot be updated.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      workout: data,
    },
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const { error } = await supabase.from('workout_sessions').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'WORKOUT_DELETE_FAILED',
      title: 'Workout Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id,
      deleted: true,
    },
  })
}
