import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ReactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(16),
})

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

  const parsed = ReactionSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid reaction payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: message, error: messageError } = await (supabase as any)
    .from('messages')
    .select('thread_id')
    .eq('id', parsed.data.messageId)
    .maybeSingle()

  if (messageError || !message?.thread_id) {
    return problemResponse({
      status: 404,
      code: 'MESSAGE_NOT_FOUND',
      title: 'Message Not Found',
      detail: 'Message does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { data: membership, error: membershipError } = await (supabase as any)
    .from('message_thread_participants')
    .select('thread_id')
    .eq('thread_id', String(message.thread_id))
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You are not allowed to react in this thread.',
      requestId,
      retriable: false,
    })
  }

  await (supabase as any)
    .from('message_reactions')
    .delete()
    .eq('message_id', parsed.data.messageId)
    .eq('user_id', user.id)
    .eq('emoji', parsed.data.emoji)

  const { error } = await (supabase as any)
    .from('message_reactions')
    .insert({
      message_id: parsed.data.messageId,
      user_id: user.id,
      emoji: parsed.data.emoji,
    })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'REACTION_ADD_FAILED',
      title: 'Reaction Add Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      added: true,
      messageId: parsed.data.messageId,
      emoji: parsed.data.emoji,
    },
  })
}

export async function DELETE(request: Request) {
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

  const parsed = ReactionSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid reaction payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { error } = await (supabase as any)
    .from('message_reactions')
    .delete()
    .eq('message_id', parsed.data.messageId)
    .eq('user_id', user.id)
    .eq('emoji', parsed.data.emoji)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'REACTION_REMOVE_FAILED',
      title: 'Reaction Remove Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      removed: true,
      messageId: parsed.data.messageId,
      emoji: parsed.data.emoji,
    },
  })
}
