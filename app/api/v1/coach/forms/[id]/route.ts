import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface RouteContext {
  params: Promise<{ id: string }>
}

const UpdateFormSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    formSchema: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => value.name !== undefined || value.formSchema !== undefined, {
    message: 'At least one field to update is required.',
    path: ['name'],
  })

export async function GET(_request: Request, context: RouteContext) {
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

  const db = supabase as SupabaseServerClient

  const { data, error } = await db
    .from('coach_forms')
    .select('id,name,status,form_schema,updated_at')
    .eq('id', id)
    .eq('coach_id', user.id)
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_FETCH_FAILED',
      title: 'Form Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_FORM_NOT_FOUND',
      title: 'Form Not Found',
      detail: 'Form not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      form: {
        id: String(data.id),
        name: String(data.name || 'Untitled Form'),
        status: String(data.status || 'draft'),
        formSchema: data.form_schema && typeof data.form_schema === 'object' ? data.form_schema : { questions: [] },
        updatedAt: String(data.updated_at || new Date().toISOString()),
      },
    },
  })
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

  const parsed = UpdateFormSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid form update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) payload.name = parsed.data.name
  if (parsed.data.formSchema !== undefined) payload.form_schema = parsed.data.formSchema

  const db = supabase as SupabaseServerClient
  const { data, error } = await db
    .from('coach_forms')
    .update(payload)
    .eq('id', id)
    .eq('coach_id', user.id)
    .select('id,name,status,form_schema,updated_at')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_UPDATE_FAILED',
      title: 'Form Update Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_FORM_NOT_FOUND',
      title: 'Form Not Found',
      detail: 'Form not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      form: {
        id: String(data.id),
        name: String(data.name || 'Untitled Form'),
        status: String(data.status || 'draft'),
        formSchema: data.form_schema && typeof data.form_schema === 'object' ? data.form_schema : { questions: [] },
        updatedAt: String(data.updated_at || new Date().toISOString()),
      },
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

  const db = supabase as SupabaseServerClient

  const { error } = await db
    .from('coach_forms')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_FORM_DELETE_FAILED',
      title: 'Form Delete Failed',
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
