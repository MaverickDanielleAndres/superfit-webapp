import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ProgramDaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  exercises: z.array(z.string()),
})

const UpdateProgramSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    difficulty: z.string().min(1).max(50).optional(),
    length: z.string().min(1).max(50).optional(),
    cover: z.string().url().optional(),
    builderDays: z.array(ProgramDaySchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.')

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

  const parsed = UpdateProgramSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid program update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty
  if (parsed.data.length !== undefined) updates.length_label = parsed.data.length
  if (parsed.data.cover !== undefined) updates.cover_url = parsed.data.cover
  if (parsed.data.builderDays !== undefined) updates.builder_days = parsed.data.builderDays

  const { error } = await (supabase as any)
    .from('coach_programs')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_UPDATE_FAILED',
      title: 'Program Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id,
      updated: true,
    },
  })
}
