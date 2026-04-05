import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const AssignProgramSchema = z.object({
  programId: z.string().uuid(),
  clientIds: z.array(z.string().uuid()).min(1),
})

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

  const parsed = AssignProgramSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid assignment payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const rows = parsed.data.clientIds.map((clientId) => ({
    program_id: parsed.data.programId,
    coach_id: user.id,
    client_id: clientId,
    status: 'active',
    progress_pct: 0,
  }))

  const db = supabase as SupabaseServerClient

  const { error } = await db
    .from('coach_program_assignments')
    .upsert(rows, { onConflict: 'program_id,client_id' })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_ASSIGN_FAILED',
      title: 'Program Assignment Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      assigned: rows.length,
      programId: parsed.data.programId,
    },
  })
}
