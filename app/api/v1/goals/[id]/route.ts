import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

const GoalUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(80).optional(),
  current: z.number().optional(),
  target: z.number().optional(),
  start: z.number().optional(),
  unit: z.string().min(1).max(24).optional(),
  deadline: z.string().min(1).max(32).optional(),
  projectedComplete: z.string().optional().nullable(),
  ahead: z.boolean().optional(),
  completed: z.boolean().optional(),
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

  const parsed = GoalUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid goal update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updates: Database['public']['Tables']['goals']['Update'] = {
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
    ...(parsed.data.current !== undefined ? { current_value: parsed.data.current } : {}),
    ...(parsed.data.target !== undefined ? { target_value: parsed.data.target } : {}),
    ...(parsed.data.start !== undefined ? { start_value: parsed.data.start } : {}),
    ...(parsed.data.unit !== undefined ? { unit: parsed.data.unit } : {}),
    ...(parsed.data.deadline !== undefined ? { deadline: parsed.data.deadline } : {}),
    ...(parsed.data.projectedComplete !== undefined ? { projected_complete: parsed.data.projectedComplete } : {}),
    ...(parsed.data.ahead !== undefined ? { ahead: parsed.data.ahead } : {}),
    ...(parsed.data.completed !== undefined
      ? {
          completed: parsed.data.completed,
          completed_at: parsed.data.completed ? new Date().toISOString() : null,
        }
      : {}),
    updated_at: new Date().toISOString(),
  }

  if (!Object.keys(updates).length) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'No goal updates were provided.',
      requestId,
      retriable: false,
    })
  }

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'GOAL_UPDATE_FAILED',
      title: 'Goal Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data) {
    return problemResponse({
      status: 404,
      code: 'GOAL_NOT_FOUND',
      title: 'Goal Not Found',
      detail: 'Goal does not exist or cannot be updated.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      goal: data,
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

  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'GOAL_DELETE_FAILED',
      title: 'Goal Delete Failed',
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
