import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotifications } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { canUsersDirectMessage, hasActiveCoachClientLink } from '@/lib/social'
import type { Json } from '@/types/supabase'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface ThreadMembershipRow {
  thread_id: string | null
}

interface ThreadRow {
  id: string | null
  is_group: boolean | null
}

interface ThreadParticipantRow {
  user_id: string | null
}

interface ProfileRoleRow {
  id: string | null
  role: string | null
}

interface SentMessageRow {
  id: string
  thread_id: string
  sender_id: string
  text: string | null
  attachments: Json | null
  status: string | null
  reply_to_id: string | null
  created_at: string | null
}

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
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const { data: rawMembership, error: membershipError } = await db
    .from('message_thread_participants')
    .select('thread_id')
    .eq('thread_id', parsed.data.threadId)
    .eq('user_id', user.id)
    .maybeSingle()
  const membership = (rawMembership ?? null) as ThreadMembershipRow | null

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

  const { data: rawThreadRow, error: threadError } = await db
    .from('message_threads')
    .select('id,is_group')
    .eq('id', parsed.data.threadId)
    .maybeSingle()
  const threadRow = (rawThreadRow ?? null) as ThreadRow | null

  if (threadError || !threadRow?.id) {
    return problemResponse({
      status: 404,
      code: 'THREAD_NOT_FOUND',
      title: 'Thread Not Found',
      detail: threadError?.message || 'Thread does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { data: rawParticipantRows, error: participantRowsError } = await db
    .from('message_thread_participants')
    .select('user_id')
    .eq('thread_id', parsed.data.threadId)
  const participantRows = Array.isArray(rawParticipantRows) ? (rawParticipantRows as ThreadParticipantRow[]) : []

  if (participantRowsError) {
    return problemResponse({
      status: 500,
      code: 'MESSAGE_SEND_FAILED',
      title: 'Message Send Failed',
      detail: participantRowsError.message,
      requestId,
    })
  }

  if (threadRow.is_group === false) {
    const participantIds = participantRows
      .map((row) => String(row.user_id || ''))
      .filter(Boolean)

    const otherParticipantIds = participantIds.filter((participantId: string) => participantId !== user.id)

    if (otherParticipantIds.length !== 1) {
      return problemResponse({
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'Direct thread membership is invalid for sending messages.',
        requestId,
        retriable: false,
      })
    }

    const targetParticipantId = otherParticipantIds[0]
    const rolesByUserId = await getProfileRolesByUserId(db, [user.id, targetParticipantId])
    const requesterIsCoach = rolesByUserId.get(user.id) === 'coach'
    const participantIsCoach = rolesByUserId.get(targetParticipantId) === 'coach'

    const isAllowed = requesterIsCoach || participantIsCoach
      ? await hasActiveCoachClientLink(db, user.id, targetParticipantId)
      : await canUsersDirectMessage(db, user.id, targetParticipantId)

    if (!isAllowed) {
      return problemResponse({
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail:
          requesterIsCoach || participantIsCoach
            ? 'Messaging in coach-related direct threads requires an active coach-client relationship.'
            : 'Direct messaging requires an accepted friendship.',
        requestId,
        retriable: false,
      })
    }
  }

  const { data: rawMessage, error } = await db
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
  const message = (rawMessage ?? null) as SentMessageRow | null

  if (error || !message) {
    return problemResponse({
      status: 500,
      code: 'MESSAGE_SEND_FAILED',
      title: 'Message Send Failed',
      detail: error?.message || 'Unable to send message.',
      requestId,
    })
  }

  await db
    .from('message_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', parsed.data.threadId)

  const recipientIds = participantRows
    .map((row) => String(row.user_id || ''))
    .filter((participantId: string) => !!participantId && participantId !== user.id)

  if (recipientIds.length) {
    const recipientRolesById = await getProfileRolesByUserId(db, recipientIds)

    await createNotifications(
      db,
      recipientIds.map((recipientId: string) => {
        const recipientRole = recipientRolesById.get(recipientId)
        const actionUrl = recipientRole === 'coach'
          ? '/coach/messages'
          : recipientRole === 'admin'
            ? '/admin/messages'
            : '/messages'

        return {
          recipientId,
          actorId: user.id,
          type: 'message',
          title: 'New message',
          body: parsed.data.text.trim() || 'You received an attachment.',
          actionUrl,
          payload: {
            threadId: parsed.data.threadId,
            messageId: String(message.id),
          },
        }
      }),
    )
  }

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
        attachments: Array.isArray(message.attachments) ? (message.attachments as unknown[]) : [],
        replyToId: message.reply_to_id ? String(message.reply_to_id) : undefined,
      },
    },
  })
}

async function getProfileRolesByUserId(supabase: SupabaseServerClient, userIds: string[]): Promise<Map<string, string>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (!uniqueUserIds.length) return new Map<string, string>()

  const { data, error } = await supabase
    .from('profiles')
    .select('id,role')
    .in('id', uniqueUserIds)

  if (error) return new Map<string, string>()

  const rows = Array.isArray(data) ? (data as ProfileRoleRow[]) : []
  const roleMap = new Map<string, string>()
  for (const row of rows) {
    const id = String(row.id || '')
    if (!id) continue
    roleMap.set(id, String(row.role || '').trim().toLowerCase())
  }

  return roleMap
}
