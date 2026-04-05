import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const CreateFormSchema = z.object({
  name: z.string().min(1).max(120),
})

interface FormRow {
  id: string | null
  name: string | null
  status: string | null
  updated_at: string | null
}

interface SubmissionCountRow {
  form_id: string | null
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

  const db = supabase as SupabaseServerClient

  const { data: rawFormsData, error: formsError } = await db
    .from('coach_forms')
    .select('id,name,status,updated_at')
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false })

  if (formsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORMS_FETCH_FAILED',
      title: 'Forms Fetch Failed',
      detail: formsError.message,
      requestId,
    })
  }

  const formsData = Array.isArray(rawFormsData) ? (rawFormsData as FormRow[]) : []
  const formIds = formsData.map((row) => row.id).filter((id): id is string => Boolean(id))
  let submissions: SubmissionCountRow[] = []

  if (formIds.length) {
    const { data: submissionData, error: submissionError } = await db
      .from('coach_form_submissions')
      .select('form_id')
      .eq('coach_id', user.id)
      .in('form_id', formIds)

    if (submissionError) {
      return problemResponse({
        status: 500,
        code: 'COACH_FORMS_FETCH_FAILED',
        title: 'Forms Fetch Failed',
        detail: submissionError.message,
        requestId,
      })
    }

    submissions = Array.isArray(submissionData) ? (submissionData as SubmissionCountRow[]) : []
  }

  const submissionMap = new Map<string, number>()
  for (const row of submissions) {
    const formId = String(row.form_id || '')
    submissionMap.set(formId, (submissionMap.get(formId) || 0) + 1)
  }

  const forms = formsData.map((row) => ({
    id: String(row.id),
    name: String(row.name || 'Untitled Form'),
    submissions: submissionMap.get(String(row.id)) || 0,
    status: String(row.status || 'draft'),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }))

  return dataResponse({
    requestId,
    data: {
      forms,
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

  const parsed = CreateFormSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid form payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const db = supabase as SupabaseServerClient

  const { data, error } = await db
    .from('coach_forms')
    .insert({
      coach_id: user.id,
      name: parsed.data.name,
      status: 'draft',
      form_schema: { questions: [] },
    })
    .select('id,name,status,updated_at')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_CREATE_FAILED',
      title: 'Form Create Failed',
      detail: error?.message || 'Unable to create form.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      form: {
        id: String(data.id),
        name: String(data.name || 'Untitled Form'),
        submissions: 0,
        status: String(data.status || 'draft'),
        updatedAt: String(data.updated_at || new Date().toISOString()),
      },
    },
  })
}
