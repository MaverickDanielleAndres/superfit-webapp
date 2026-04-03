import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

const GoalCreateSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  current: z.number(),
  target: z.number(),
  start: z.number(),
  unit: z.string().min(1).max(24),
  deadline: z.string().min(1).max(32),
  projectedComplete: z.string().optional().nullable(),
  ahead: z.boolean().default(true),
  completed: z.boolean().default(false),
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

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'GOALS_FETCH_FAILED',
      title: 'Goals Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      goals: data ?? [],
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

  const parsed = GoalCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid goal payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: Database['public']['Tables']['goals']['Insert'] = {
    user_id: user.id,
    title: parsed.data.title,
    category: parsed.data.category,
    target_value: parsed.data.target,
    current_value: parsed.data.current,
    start_value: parsed.data.start,
    unit: parsed.data.unit,
    deadline: parsed.data.deadline,
    projected_complete: parsed.data.projectedComplete || null,
    ahead: parsed.data.ahead,
    completed: parsed.data.completed,
    completed_at: parsed.data.completed ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase.from('goals').insert(payload).select('*').single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'GOAL_CREATE_FAILED',
      title: 'Goal Create Failed',
      detail: error?.message || 'Unable to create goal.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      goal: data,
    },
  })
}
