import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface RouteContext {
  params: Promise<{ id: string }>
}

interface CoachFormRow {
  id: string
  name: string | null
}

interface SubmissionRow {
  id: string
  client_id: string
  response: unknown
  review_status: string | null
  coach_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

const UpdateSubmissionSchema = z
  .object({
    submissionId: z.string().uuid(),
    reviewStatus: z.enum(['pending', 'reviewed']).optional(),
    coachNotes: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => value.reviewStatus !== undefined || value.coachNotes !== undefined, {
    message: 'At least one field to update is required.',
    path: ['submissionId'],
  })

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const { data: rawFormRow, error: formError } = await db
    .from('coach_forms')
    .select('id,name')
    .eq('id', id)
    .eq('coach_id', user.id)
    .maybeSingle()
  const formRow = (rawFormRow ?? null) as CoachFormRow | null

  if (formError) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_SUBMISSIONS_FETCH_FAILED',
      title: 'Form Submissions Fetch Failed',
      detail: formError.message,
      requestId,
    })
  }

  if (!formRow?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_FORM_NOT_FOUND',
      title: 'Form Not Found',
      detail: 'The selected form was not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  const { data: rawSubmissionRows, error: submissionsError } = await db
    .from('coach_form_submissions')
    .select('id,client_id,response,review_status,coach_notes,submitted_at,reviewed_at')
    .eq('form_id', id)
    .eq('coach_id', user.id)
    .order('submitted_at', { ascending: false })
  const submissionRows = Array.isArray(rawSubmissionRows) ? (rawSubmissionRows as SubmissionRow[]) : []

  if (submissionsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_SUBMISSIONS_FETCH_FAILED',
      title: 'Form Submissions Fetch Failed',
      detail: submissionsError.message,
      requestId,
    })
  }

  const clientIds = Array.from(
    new Set(
      submissionRows
        .map((row) => String(row.client_id || ''))
        .filter(Boolean),
    ),
  )

  const profileById = new Map<string, { name: string; email: string; avatarUrl: string }>()
  if (clientIds.length) {
    const { data: rawProfileRows, error: profileError } = await db
      .from('profiles')
      .select('id,full_name,email,avatar_url')
      .in('id', clientIds)
    const profileRows = Array.isArray(rawProfileRows) ? (rawProfileRows as ProfileRow[]) : []

    if (profileError) {
      return problemResponse({
        status: 500,
        code: 'COACH_FORM_SUBMISSIONS_FETCH_FAILED',
        title: 'Form Submissions Fetch Failed',
        detail: profileError.message,
        requestId,
      })
    }

    for (const row of profileRows) {
      const idValue = String(row.id || '')
      if (!idValue) continue
      const email = String(row.email || '')
      profileById.set(idValue, {
        name: String(row.full_name || email.split('@')[0] || 'Client'),
        email,
        avatarUrl: String(row.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${idValue}`),
      })
    }
  }

  const submissions = submissionRows.map((row) => {
    const clientId = String(row.client_id || '')
    const profile = profileById.get(clientId)

    return {
      id: String(row.id || ''),
      clientId,
      clientName: profile?.name || 'Client',
      clientEmail: profile?.email || '',
      clientAvatar: profile?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${clientId}`,
      response: row.response && typeof row.response === 'object' ? row.response : {},
      reviewStatus: String(row.review_status || 'pending'),
      coachNotes: row.coach_notes ? String(row.coach_notes) : '',
      submittedAt: String(row.submitted_at || new Date().toISOString()),
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    }
  })

  return dataResponse({
    requestId,
    data: {
      form: {
        id: String(formRow.id),
        name: String(formRow.name || 'Untitled Form'),
      },
      submissions,
    },
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const parsed = UpdateSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid submission update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.reviewStatus !== undefined) {
    updatePayload.review_status = parsed.data.reviewStatus
    updatePayload.reviewed_at = parsed.data.reviewStatus === 'reviewed' ? new Date().toISOString() : null
  }
  if (parsed.data.coachNotes !== undefined) {
    updatePayload.coach_notes = parsed.data.coachNotes
  }

  const { data: rawUpdated, error } = await db
    .from('coach_form_submissions')
    .update(updatePayload)
    .eq('id', parsed.data.submissionId)
    .eq('form_id', id)
    .eq('coach_id', user.id)
    .select('id,client_id,response,review_status,coach_notes,submitted_at,reviewed_at')
    .maybeSingle()
  const updated = (rawUpdated ?? null) as SubmissionRow | null

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_SUBMISSION_UPDATE_FAILED',
      title: 'Submission Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!updated?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_FORM_SUBMISSION_NOT_FOUND',
      title: 'Submission Not Found',
      detail: 'Submission not found for this form and coach.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      submission: {
        id: String(updated.id || ''),
        clientId: String(updated.client_id || ''),
        response: updated.response && typeof updated.response === 'object' ? updated.response : {},
        reviewStatus: String(updated.review_status || 'pending'),
        coachNotes: updated.coach_notes ? String(updated.coach_notes) : '',
        submittedAt: String(updated.submitted_at || new Date().toISOString()),
        reviewedAt: updated.reviewed_at ? String(updated.reviewed_at) : null,
      },
    },
  })
}
