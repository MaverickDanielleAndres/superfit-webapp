import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const CALCULATOR_TYPES = ['bmi', 'protein', 'creatine', 'deficit', 'water'] as const

const SaveCalculatorResponseSchema = z.object({
  calculatorType: z.enum(CALCULATOR_TYPES),
  wizardStep: z.number().int().min(0),
  responses: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).optional().nullable(),
})

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const params = new URL(request.url).searchParams
  const type = params.get('type')

  if (type && !CALCULATOR_TYPES.includes(type as (typeof CALCULATOR_TYPES)[number])) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid calculator type.',
      requestId,
      retriable: false,
    })
  }

  let query = (db as any)
    .from('user_calculator_responses')
    .select('calculator_type,wizard_step,responses,result,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (type) {
    query = query.eq('calculator_type', type)
  }

  const { data, error } = await query

  if (error) {
    return problemResponse({
      status: 500,
      code: 'CALCULATOR_RESPONSES_FETCH_FAILED',
      title: 'Calculator Responses Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const responses = (Array.isArray(data) ? data : []).map((row) => ({
    calculatorType: String(row.calculator_type || ''),
    wizardStep: Number(row.wizard_step || 0),
    responses: row.responses && typeof row.responses === 'object' ? row.responses : {},
    result: row.result && typeof row.result === 'object' ? row.result : null,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }))

  return dataResponse({
    requestId,
    data: {
      responses,
    },
  })
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const parsed = SaveCalculatorResponseSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid calculator response payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload = parsed.data

  const { data, error } = await (db as any)
    .from('user_calculator_responses')
    .upsert(
      {
        user_id: user.id,
        calculator_type: payload.calculatorType,
        wizard_step: payload.wizardStep,
        responses: payload.responses,
        result: payload.result || null,
      },
      { onConflict: 'user_id,calculator_type' },
    )
    .select('calculator_type,wizard_step,responses,result,updated_at')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'CALCULATOR_RESPONSES_SAVE_FAILED',
      title: 'Calculator Responses Save Failed',
      detail: error?.message || 'Unable to save calculator response.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      response: {
        calculatorType: String(data.calculator_type || ''),
        wizardStep: Number(data.wizard_step || 0),
        responses: data.responses && typeof data.responses === 'object' ? data.responses : {},
        result: data.result && typeof data.result === 'object' ? data.result : null,
        updatedAt: String(data.updated_at || new Date().toISOString()),
      },
    },
  })
}

export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const params = new URL(request.url).searchParams
  const type = params.get('type')

  if (type && !CALCULATOR_TYPES.includes(type as (typeof CALCULATOR_TYPES)[number])) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid calculator type.',
      requestId,
      retriable: false,
    })
  }

  const query = (db as any)
    .from('user_calculator_responses')
    .delete()
    .eq('user_id', user.id)

  if (type) {
    query.eq('calculator_type', type)
  }

  const { error } = await query

  if (error) {
    return problemResponse({
      status: 500,
      code: 'CALCULATOR_RESPONSES_DELETE_FAILED',
      title: 'Calculator Responses Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      deleted: true,
      calculatorType: type || null,
    },
  })
}
