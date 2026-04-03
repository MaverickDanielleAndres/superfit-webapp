import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const { data: friendship, error: friendshipError } = await (db as any)
    .from('user_friendships')
    .select('id,requester_id,addressee_id')
    .eq('id', id)
    .maybeSingle()

  if (friendshipError || !friendship) {
    return problemResponse({
      status: 404,
      code: 'FRIENDSHIP_NOT_FOUND',
      title: 'Friendship Not Found',
      detail: 'Friendship does not exist.',
      requestId,
      retriable: false,
    })
  }

  const isParticipant =
    String(friendship.requester_id || '') === user.id || String(friendship.addressee_id || '') === user.id

  if (!isParticipant) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You cannot modify this friendship.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await (db as any).from('user_friendships').delete().eq('id', id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'FRIENDSHIP_DELETE_FAILED',
      title: 'Friendship Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      deleted: true,
      friendshipId: id,
    },
  })
}
