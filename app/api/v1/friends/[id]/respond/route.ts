import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline', 'block']),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = RespondSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid friend response payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: friendship, error: friendshipError } = await (db as any)
    .from('user_friendships')
    .select('id,requester_id,addressee_id,status')
    .eq('id', id)
    .maybeSingle()

  if (friendshipError || !friendship) {
    return problemResponse({
      status: 404,
      code: 'FRIENDSHIP_NOT_FOUND',
      title: 'Friendship Not Found',
      detail: 'Friend request could not be found.',
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

  if (parsed.data.action === 'accept' && String(friendship.addressee_id || '') !== user.id) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Only the recipient can accept a request.',
      requestId,
      retriable: false,
    })
  }

  const nextStatus =
    parsed.data.action === 'accept'
      ? 'accepted'
      : parsed.data.action === 'decline'
        ? 'declined'
        : 'blocked'

  const { data: updated, error: updateError } = await (db as any)
    .from('user_friendships')
    .update({
      status: nextStatus,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id,status,requester_id,addressee_id')
    .single()

  if (updateError || !updated) {
    return problemResponse({
      status: 500,
      code: 'FRIENDSHIP_UPDATE_FAILED',
      title: 'Friendship Update Failed',
      detail: updateError?.message || 'Unable to update friendship.',
      requestId,
    })
  }

  if (nextStatus === 'accepted') {
    await createNotification(db as any, {
      recipientId: String(updated.requester_id),
      actorId: user.id,
      type: 'friend_request_accepted',
      title: 'Friend request accepted',
      body: `${user.email?.split('@')[0] || 'A user'} accepted your request.`,
      actionUrl: '/community',
      payload: { friendshipId: String(updated.id) },
    })
  }

  return dataResponse({
    requestId,
    data: {
      friendshipId: String(updated.id),
      status: String(updated.status || nextStatus),
      action: parsed.data.action,
    },
  })
}
