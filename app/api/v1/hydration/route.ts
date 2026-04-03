import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const HydrationCreateSchema = z.object({
  type: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  amountMl: z.number().positive().max(5000),
  hydrationFactor: z.number().min(0).max(2),
  caffeinesMg: z.number().min(0).max(2000).optional().default(0),
  loggedAt: z.string().datetime().optional(),
})

export async function GET(request: Request) {
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

  const date = new URL(request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10)
  if (!DATE_REGEX.test(date)) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Query param date must be in YYYY-MM-DD format.',
      requestId,
      retriable: false,
    })
  }

  const from = `${date}T00:00:00.000Z`
  const to = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', from)
    .lte('logged_at', to)
    .order('logged_at', { ascending: true })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'HYDRATION_FETCH_FAILED',
      title: 'Hydration Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      date,
      entries: data ?? [],
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

  const parsed = HydrationCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid hydration payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: Database['public']['Tables']['hydration_logs']['Insert'] = {
    user_id: user.id,
    drink_type: parsed.data.type,
    label: parsed.data.label,
    amount_ml: parsed.data.amountMl,
    hydration_factor: parsed.data.hydrationFactor,
    caffeine_mg: parsed.data.caffeinesMg,
    logged_at: parsed.data.loggedAt || new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('hydration_logs')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'HYDRATION_CREATE_FAILED',
      title: 'Hydration Create Failed',
      detail: error?.message || 'Unable to add hydration entry.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      entry: data,
    },
  })
}
