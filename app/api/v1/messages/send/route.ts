import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Json } from '@/types/supabase'

const AttachmentSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(['image', 'video', 'file']).optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough()

const SendMessageSchema = z.object({
  threadId: z.string().uuid(),
  text: z.string().max(4000).optional().default(''),
  attachments: z.array(AttachmentSchema).optional().default([]),
  replyToId: z.string().uuid().optional().nullable(),
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

  const parsed = SendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid message payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  if (!parsed.data.text.trim() && parsed.data.attachments.length === 0) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Message must contain text or attachments.',
      requestId,
      retriable: false,
    })
  }

  const { data: membership, error: membershipError } = await (supabase as any)
    .from('message_thread_participants')
    .select('thread_id')
    .eq('thread_id', parsed.data.threadId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'You are not a participant of this thread.',
      requestId,
      retriable: false,
    })
  }

  const { data: message, error } = await (supabase as any)
    .from('messages')
    .insert({
      thread_id: parsed.data.threadId,
      sender_id: user.id,
      text: parsed.data.text,
      attachments: parsed.data.attachments as unknown as Json,
      reply_to_id: parsed.data.replyToId || null,
      status: 'delivered',
    })
    .select('id,thread_id,sender_id,text,attachments,status,reply_to_id,created_at')
    .single()

  if (error || !message) {
    return problemResponse({
      status: 500,
      code: 'MESSAGE_SEND_FAILED',
      title: 'Message Send Failed',
      detail: error?.message || 'Unable to send message.',
      requestId,
    })
  }

  await (supabase as any)
    .from('message_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', parsed.data.threadId)

  return dataResponse({
    requestId,
    status: 201,
    data: {
      message: {
        id: String(message.id),
        threadId: String(message.thread_id),
        senderId: String(message.sender_id),
        text: String(message.text || ''),
        createdAt: String(message.created_at || new Date().toISOString()),
        status: (message.status as 'sent' | 'delivered' | 'read') || 'sent',
        reactions: [],
        attachments: Array.isArray(message.attachments) ? (message.attachments as any[]) : [],
        replyToId: message.reply_to_id ? String(message.reply_to_id) : undefined,
      },
    },
  })
}
