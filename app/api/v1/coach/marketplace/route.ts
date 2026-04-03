import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateMarketplaceSchema = z.object({
  displayName: z.string().min(1).max(160),
  headline: z.string().min(1).max(240),
  specialties: z.array(z.string().min(1).max(80)).default([]),
  coverUrl: z.string().url().optional().nullable(),
  clientCap: z.number().int().min(1).max(500),
  isActive: z.boolean(),
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

  const [{ data: profile, error: profileError }, { data: transactions, error: txError }] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('full_name,goal,avatar_url,account_status,exercise_preferences,session_duration')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('payment_transactions')
      .select('amount_cents,created_at,status')
      .eq('coach_id', user.id),
  ])

  if (profileError) {
    return problemResponse({
      status: 500,
      code: 'COACH_MARKETPLACE_FETCH_FAILED',
      title: 'Marketplace Fetch Failed',
      detail: profileError.message,
      requestId,
    })
  }

  if (txError) {
    return problemResponse({
      status: 500,
      code: 'COACH_MARKETPLACE_FETCH_FAILED',
      title: 'Marketplace Fetch Failed',
      detail: txError.message,
      requestId,
    })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyTransactions = (transactions || []).filter((entry: any) => {
    if (String(entry.status || '') !== 'succeeded') return false
    return new Date(String(entry.created_at || now.toISOString())).getTime() >= monthStart.getTime()
  })

  const monthlyRevenueCents = monthlyTransactions.reduce((sum: number, entry: any) => sum + Number(entry.amount_cents || 0), 0)

  return dataResponse({
    requestId,
    data: {
      displayName: String(profile?.full_name || 'Coach Profile'),
      headline: String(profile?.goal || 'Strength and body composition coaching'),
      specialties: Array.isArray(profile?.exercise_preferences)
        ? profile.exercise_preferences.map((entry: unknown) => String(entry))
        : [],
      coverUrl: String(profile?.avatar_url || ''),
      clientCap: Number(profile?.session_duration || 30),
      isActive: String(profile?.account_status || 'active') === 'active',
      monthlyRevenueCents,
      transactionCount: monthlyTransactions.length,
    },
  })
}

export async function PATCH(request: Request) {
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

  const parsed = UpdateMarketplaceSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid marketplace payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      full_name: parsed.data.displayName.trim(),
      goal: parsed.data.headline.trim(),
      avatar_url: parsed.data.coverUrl?.trim() || null,
      exercise_preferences: parsed.data.specialties,
      session_duration: parsed.data.clientCap,
      account_status: parsed.data.isActive ? 'active' : 'inactive',
    })
    .eq('id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_MARKETPLACE_UPDATE_FAILED',
      title: 'Marketplace Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      saved: true,
    },
  })
}
