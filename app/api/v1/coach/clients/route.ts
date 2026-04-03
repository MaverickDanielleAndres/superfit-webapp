import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const AddClientSchema = z.object({
  mode: z.literal('next-available').default('next-available'),
})

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

  const { data, error } = await (supabase as any)
    .from('coach_client_links')
    .select('id,client_id,status,goal_name,compliance,weight_trend,last_active_at,client:profiles(full_name,email)')
    .eq('coach_id', user.id)
    .order('last_active_at', { ascending: false })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENTS_FETCH_FAILED',
      title: 'Clients Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      clients: data ?? [],
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

  let body: unknown = { mode: 'next-available' }
  try {
    body = await request.json()
  } catch {
    // Allow empty body and default mode.
  }

  const parsed = AddClientSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid add-client payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: linkedRows, error: linkedError } = await (supabase as any)
    .from('coach_client_links')
    .select('client_id')
    .eq('coach_id', user.id)

  if (linkedError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: linkedError.message,
      requestId,
    })
  }

  const linkedIds = new Set((linkedRows || []).map((row: any) => String(row.client_id || '')))

  const { data: profiles, error: profilesError } = await (supabase as any)
    .from('profiles')
    .select('id,goal')
    .eq('role', 'user')
    .eq('account_status', 'active')
    .order('created_at', { ascending: true })
    .limit(50)

  if (profilesError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: profilesError.message,
      requestId,
    })
  }

  const nextClient = (profiles || []).find((profile: any) => !linkedIds.has(String(profile.id || '')))
  if (!nextClient?.id) {
    return dataResponse({
      requestId,
      data: {
        added: false,
        reason: 'NO_AVAILABLE_CLIENT',
      },
    })
  }

  const { error: insertError } = await (supabase as any)
    .from('coach_client_links')
    .insert({
      coach_id: user.id,
      client_id: nextClient.id,
      status: 'active',
      goal_name: String(nextClient.goal || 'General Fitness'),
      compliance: 0,
      weight_trend: [],
      last_active_at: new Date().toISOString(),
    })

  if (insertError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: insertError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      added: true,
      clientId: String(nextClient.id),
    },
  })
}
