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

  const { data, error } = await (supabase as any)
    .from('payment_transactions')
    .select('id,user_id,coach_id,amount_cents,status,currency,created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_PAYMENTS_FETCH_FAILED',
      title: 'Payments Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const rows = data || []
  const userIds = new Set<string>()
  for (const row of rows) {
    if (row.user_id) userIds.add(String(row.user_id))
    if (row.coach_id) userIds.add(String(row.coach_id))
  }

  const { data: profilesData } = await (supabase as any)
    .from('profiles')
    .select('id,full_name,email')
    .in('id', Array.from(userIds))

  const profiles = (profilesData || []).map((profile: any) => ({
    id: String(profile.id || ''),
    name: String(profile.full_name || profile.email || 'User'),
  }))

  return dataResponse({
    requestId,
    data: {
      payments: rows,
      profiles,
    },
  })
}
