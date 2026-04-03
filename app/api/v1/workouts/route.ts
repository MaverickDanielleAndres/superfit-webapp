import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database, Json } from '@/types/supabase'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const WorkoutUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  date: z.string().regex(DATE_REGEX).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  exercises: z.array(z.unknown()).default([]),
  totalVolume: z.number().min(0).default(0),
  calories: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isCompleted: z.boolean().default(false),
  routineId: z.string().optional().nullable(),
  isTemplate: z.boolean().default(false),
})

function asNullableUuid(value: string | null | undefined) {
  if (!value) return null
  return UUID_REGEX.test(value) ? value : null
}

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

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'WORKOUTS_FETCH_FAILED',
      title: 'Workouts Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      workouts: data ?? [],
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

  const parsed = WorkoutUpsertSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid workout payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const now = new Date().toISOString()
  const resolvedStart = parsed.data.startTime || now
  const resolvedDate = parsed.data.date || resolvedStart.slice(0, 10)

  const payload: Database['public']['Tables']['workout_sessions']['Insert'] = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    user_id: user.id,
    name: parsed.data.name,
    date: resolvedDate,
    start_time: resolvedStart,
    end_time: parsed.data.endTime || null,
    duration: parsed.data.duration || null,
    exercises: parsed.data.exercises as Json,
    total_volume: parsed.data.totalVolume,
    calories: parsed.data.calories || null,
    notes: parsed.data.notes || null,
    is_completed: parsed.data.isCompleted,
    routine_id: asNullableUuid(parsed.data.routineId),
    is_template: parsed.data.isTemplate,
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'WORKOUT_UPSERT_FAILED',
      title: 'Workout Save Failed',
      detail: error?.message || 'Unable to save workout session.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      workout: data,
    },
  })
}
