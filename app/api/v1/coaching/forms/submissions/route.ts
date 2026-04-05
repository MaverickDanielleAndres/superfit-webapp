import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Json } from '@/types/supabase'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const SubmitAssignedFormSchema = z.object({
  assignmentId: z.string().uuid(),
  response: z.record(z.string(), z.unknown()).default({}),
})

interface AssignmentRow {
  id: string | null
  form_id: string | null
  coach_id: string | null
  client_id: string | null
  completed_at: string | null
  form: {
    id: string | null
    name: string | null
    status: string | null
  } | null
}

interface ProfileRow {
  full_name: string | null
  email: string | null
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabase as SupabaseServerClient

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

  const parsed = SubmitAssignedFormSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid form submission payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: rawAssignment, error: assignmentError } = await db
    .from('coach_form_assignments')
    .select('id,form_id,coach_id,client_id,completed_at,form:coach_forms(id,name,status)')
    .eq('id', parsed.data.assignmentId)
    .eq('client_id', user.id)
    .maybeSingle()

  if (assignmentError) {
    return problemResponse({
      status: 500,
      code: 'FORM_SUBMIT_FAILED',
      title: 'Form Submit Failed',
      detail: assignmentError.message,
      requestId,
    })
  }

  const assignment = (rawAssignment ?? null) as AssignmentRow | null
  if (!assignment?.id || !assignment.form_id || !assignment.coach_id) {
    return problemResponse({
      status: 404,
      code: 'FORM_ASSIGNMENT_NOT_FOUND',
      title: 'Assigned Form Not Found',
      detail: 'This form assignment was not found for your account.',
      requestId,
      retriable: false,
    })
  }

  if (String(assignment.form?.status || 'active') === 'archived') {
    return problemResponse({
      status: 409,
      code: 'FORM_ARCHIVED',
      title: 'Form Archived',
      detail: 'This form is no longer accepting responses.',
      requestId,
      retriable: false,
    })
  }

  const nowIso = new Date().toISOString()
  const { data: submittedRow, error: submitError } = await db
    .from('coach_form_submissions')
    .insert({
      form_id: assignment.form_id,
      coach_id: assignment.coach_id,
      client_id: user.id,
      response: parsed.data.response as Json,
      review_status: 'pending',
      submitted_at: nowIso,
    })
    .select('id,form_id,response,review_status,coach_notes,submitted_at,reviewed_at')
    .single()

  if (submitError || !submittedRow?.id) {
    return problemResponse({
      status: 500,
      code: 'FORM_SUBMIT_FAILED',
      title: 'Form Submit Failed',
      detail: submitError?.message || 'Unable to submit this form.',
      requestId,
    })
  }

  const { error: assignmentUpdateError } = await db
    .from('coach_form_assignments')
    .update({ completed_at: nowIso })
    .eq('id', assignment.id)
    .eq('client_id', user.id)

  if (assignmentUpdateError) {
    return problemResponse({
      status: 500,
      code: 'FORM_SUBMIT_FAILED',
      title: 'Form Submit Failed',
      detail: assignmentUpdateError.message,
      requestId,
    })
  }

  const { data: profileData } = await db
    .from('profiles')
    .select('full_name,email')
    .eq('id', user.id)
    .maybeSingle()

  const profile = (profileData ?? null) as ProfileRow | null
  const clientName = String(profile?.full_name || profile?.email?.split('@')?.[0] || 'Client')
  const formName = String(assignment.form?.name || 'Assigned Form')

  const { error: notificationError } = await db.from('notifications').insert({
    recipient_id: assignment.coach_id,
    actor_id: user.id,
    type: 'coach_form_submitted',
    title: `New form submission from ${clientName}`,
    body: `${clientName} submitted ${formName}.`,
    action_url: '/coach/forms',
    payload: {
      formId: assignment.form_id,
      assignmentId: assignment.id,
      submissionId: submittedRow.id,
      clientId: user.id,
    },
    delivered_at: nowIso,
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      submission: {
        id: String(submittedRow.id),
        formId: String(submittedRow.form_id || assignment.form_id),
        reviewStatus: String(submittedRow.review_status || 'pending'),
        coachNotes: submittedRow.coach_notes ? String(submittedRow.coach_notes) : '',
        submittedAt: String(submittedRow.submitted_at || nowIso),
        reviewedAt: submittedRow.reviewed_at ? String(submittedRow.reviewed_at) : null,
        response:
          submittedRow.response && typeof submittedRow.response === 'object'
            ? submittedRow.response
            : {},
      },
      assignment: {
        id: String(assignment.id),
        completedAt: nowIso,
      },
      notificationFailed: Boolean(notificationError),
      notificationError: notificationError?.message,
    },
  })
}
