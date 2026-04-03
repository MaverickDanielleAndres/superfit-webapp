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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || String(profile.role || '').toLowerCase() !== 'admin') {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admin access required.',
      requestId,
      retriable: false,
    })
  }

  const { data: coachesData, error: coachesError } = await (supabase as any)
    .from('profiles')
    .select('id,full_name,email,account_status')
    .eq('role', 'coach')
    .order('created_at', { ascending: false })

  if (coachesError) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_COACHES_FETCH_FAILED',
      title: 'Coaches Fetch Failed',
      detail: coachesError.message,
      requestId,
    })
  }

  const coachIds = (coachesData || []).map((row: any) => row.id)

  const [clientLinksResult, paymentResult] = await Promise.all([
    (supabase as any)
      .from('coach_client_links')
      .select('coach_id')
      .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000']),
    (supabase as any)
      .from('payment_transactions')
      .select('coach_id,amount_cents,status')
      .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000']),
  ])

  return dataResponse({
    requestId,
    data: {
      coaches: coachesData ?? [],
      clientLinks: clientLinksResult.data ?? [],
      payments: paymentResult.data ?? [],
    },
  })
}
