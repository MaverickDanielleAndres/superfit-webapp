import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const AssignSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1),
  deadline: z.string().datetime().optional().nullable(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

interface AssignmentIdRow {
  id: string | null
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = AssignSchema.safeParse(body)
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
    form_id: id,
    coach_id: user.id,
    client_id: clientId,
    deadline: parsed.data.deadline || null,
  }))

  const db = supabase as SupabaseServerClient

  const { data: rawAssignments, error } = await db
    .from('coach_form_assignments')
    .upsert(rows, { onConflict: 'form_id,coach_id,client_id' })
    .select('id')

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_ASSIGN_FAILED',
      title: 'Form Assignment Failed',
      detail: error.message,
      requestId,
    })
  }

  const assignments = Array.isArray(rawAssignments) ? (rawAssignments as AssignmentIdRow[]) : []
  const assignmentIds = assignments
    .map((row) => String(row.id || ''))
    .filter(Boolean)

  let notificationError: string | undefined
  if (assignmentIds.length) {
    const { error: invokeError } = await supabase.functions.invoke('on-form-assigned', {
      body: { assignmentIds },
    })
    if (invokeError) notificationError = invokeError.message
  }

  return dataResponse({
    requestId,
    data: {
      formId: id,
      assignmentIds,
      notificationFailed: Boolean(notificationError),
      notificationError,
    },
  })
}
