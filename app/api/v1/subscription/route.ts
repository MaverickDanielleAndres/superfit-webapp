import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

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

  const { data: latestTransaction, error } = await supabase
    .from('payment_transactions')
    .select('id,status,amount_cents,currency,created_at,coach_id')
    .eq('user_id', user.id)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'SUBSCRIPTION_FETCH_FAILED',
      title: 'Subscription Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      active: Boolean(latestTransaction),
      mode: 'simulation',
      latestTransaction: latestTransaction
        ? {
            id: latestTransaction.id,
            amountCents: latestTransaction.amount_cents,
            currency: latestTransaction.currency,
            createdAt: latestTransaction.created_at,
            status: latestTransaction.status,
            coachId: latestTransaction.coach_id,
          }
        : null,
    },
  })
}
