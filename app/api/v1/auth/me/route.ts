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

  const roleClaim = (user.user_metadata?.role as string | undefined) || (user.app_metadata?.role as string | undefined) || null
  const accountStatusClaim =
    (user.user_metadata?.account_status as string | undefined) ||
    (user.app_metadata?.account_status as string | undefined) ||
    null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,account_status')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ? String(profile.role) : roleClaim
  const accountStatus = profile?.account_status ? String(profile.account_status) : accountStatusClaim

  return dataResponse({
    requestId,
    data: {
      id: user.id,
      role,
      accountStatus,
      email: user.email || null,
    },
  })
}
