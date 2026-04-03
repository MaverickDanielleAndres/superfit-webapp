import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface MessageReaction {
  userId: string
  emoji: string
}

interface MessageAttachment {
  id: string
  type: 'image' | 'video' | 'file'
  url: string
  thumbnailUrl?: string
  name?: string
}

interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  text: string
  createdAt: string
  status: 'sent' | 'delivered' | 'read'
  reactions: MessageReaction[]
  attachments: MessageAttachment[]
  replyToId?: string
}

interface ChatThread {
  id: string
  participants: { id: string; name: string; avatar: string }[]
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
}

export async function GET() {
  const requestId = crypto.randomUUID()
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

  const { data: membershipRows, error: membershipError } = await (db as any)
    .from('message_thread_participants')
    .select('thread_id,last_read_at')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (membershipError) {
    return problemResponse({
      status: 500,
      code: 'MESSAGES_FETCH_FAILED',
      title: 'Messages Fetch Failed',
      detail: membershipError.message,
      requestId,
    })
  }

  const memberships = Array.isArray(membershipRows) ? membershipRows : []
  const threadIds = memberships.map((row) => String(row.thread_id || '')).filter(Boolean)

  if (!threadIds.length) {
    return dataResponse({
      requestId,
      data: {
        threads: [] as ChatThread[],
        messagesByThread: {} as Record<string, ChatMessage[]>,
      },
    })
  }

  const { data: threadRows, error: threadError } = await (db as any)
    .from('message_threads')
    .select('id,is_group,group_name,group_avatar,updated_at,created_at')
    .in('id', threadIds)

  if (threadError) {
    return problemResponse({
      status: 500,
      code: 'MESSAGES_FETCH_FAILED',
      title: 'Messages Fetch Failed',
      detail: threadError.message,
      requestId,
    })
  }

  const { data: participantRows, error: participantError } = await (db as any)
    .from('message_thread_participants')
    .select('thread_id,user_id')
    .in('thread_id', threadIds)

  if (participantError) {
    return problemResponse({
      status: 500,
      code: 'MESSAGES_FETCH_FAILED',
      title: 'Messages Fetch Failed',
      detail: participantError.message,
      requestId,
    })
  }

  const participantIds = Array.from(
    new Set((participantRows || []).map((row: any) => String(row.user_id || '')).filter(Boolean)),
  )

  const profileById = new Map<string, { full_name?: string | null; avatar_url?: string | null }>()
  if (participantIds.length) {
    const { data: profileRows, error: profileError } = await (db as any)
      .from('profiles')
      .select('id,full_name,avatar_url')
      .in('id', participantIds)

    if (profileError) {
      return problemResponse({
        status: 500,
        code: 'MESSAGES_FETCH_FAILED',
        title: 'Messages Fetch Failed',
        detail: profileError.message,
        requestId,
      })
    }

    for (const row of profileRows || []) {
      const id = String(row.id || '')
      if (!id) continue
      profileById.set(id, {
        full_name: row.full_name || null,
        avatar_url: row.avatar_url || null,
      })
    }
  }

  const { data: messageRows, error: messageError } = await (db as any)
    .from('messages')
    .select('id,thread_id,sender_id,text,attachments,status,reply_to_id,created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true })

  if (messageError) {
    return problemResponse({
      status: 500,
      code: 'MESSAGES_FETCH_FAILED',
      title: 'Messages Fetch Failed',
      detail: messageError.message,
      requestId,
    })
  }

  const messages = Array.isArray(messageRows) ? messageRows : []
  const messageIds = messages.map((row) => String(row.id || '')).filter(Boolean)

  const reactionsByMessage = new Map<string, MessageReaction[]>()
  if (messageIds.length) {
    const { data: reactionRows, error: reactionError } = await (db as any)
      .from('message_reactions')
      .select('message_id,user_id,emoji')
      .in('message_id', messageIds)

    if (reactionError) {
      return problemResponse({
        status: 500,
        code: 'MESSAGES_FETCH_FAILED',
        title: 'Messages Fetch Failed',
        detail: reactionError.message,
        requestId,
      })
    }

    for (const reactionRow of reactionRows || []) {
      const messageId = String(reactionRow.message_id || '')
      const userId = String(reactionRow.user_id || '')
      const emoji = String(reactionRow.emoji || '')
      if (!messageId || !userId || !emoji) continue

      const existing = reactionsByMessage.get(messageId) || []
      reactionsByMessage.set(messageId, [...existing, { userId, emoji }])
    }
  }

  const participantsByThread = new Map<string, ChatThread['participants']>()
  for (const row of participantRows || []) {
    const threadId = String(row.thread_id || '')
    if (!threadId) continue

    const profile = profileById.get(String(row.user_id || '')) || {}
    const participant = {
      id: String(row.user_id || ''),
      name: profile.full_name || (String(row.user_id || '') === user.id ? 'You' : 'User'),
      avatar: profile.avatar_url || '',
    }

    const existing = participantsByThread.get(threadId) || []
    participantsByThread.set(threadId, [...existing, participant])
  }

  const messagesByThread: Record<string, ChatMessage[]> = {}
  for (const row of messages) {
    const threadId = String(row.thread_id || '')
    if (!threadId) continue

    if (!messagesByThread[threadId]) messagesByThread[threadId] = []

    const reactions = reactionsByMessage.get(String(row.id || '')) || []

    const attachments: MessageAttachment[] = Array.isArray(row.attachments)
      ? row.attachments
          .map((attachment: any) => ({
            id: String(attachment.id || `att_${Date.now()}`),
            type: normalizeAttachmentType(attachment.type),
            url: String(attachment.url || ''),
            thumbnailUrl: attachment.thumbnailUrl ? String(attachment.thumbnailUrl) : undefined,
            name: attachment.name ? String(attachment.name) : undefined,
          }))
          .filter((attachment: MessageAttachment) => !!attachment.url || !!attachment.name)
      : []

    messagesByThread[threadId].push({
      id: String(row.id || ''),
      threadId,
      senderId: String(row.sender_id || ''),
      text: String(row.text || ''),
      createdAt: String(row.created_at || new Date().toISOString()),
      status: normalizeMessageStatus(row.status),
      reactions,
      attachments,
      replyToId: row.reply_to_id ? String(row.reply_to_id) : undefined,
    })
  }

  const membershipsByThread = new Map<string, string>()
  for (const row of memberships) {
    membershipsByThread.set(String(row.thread_id || ''), String(row.last_read_at || '1970-01-01T00:00:00.000Z'))
  }

  const threads: ChatThread[] = []
  for (const row of memberships) {
    const thread = (threadRows || []).find((item: any) => String(item.id || '') === String(row.thread_id || '')) as {
      id: string
      is_group: boolean
      group_name: string | null
      group_avatar: string | null
      updated_at: string | null
      created_at: string | null
    } | undefined

    if (!thread || !thread.id) continue

    const threadMessages = messagesByThread[thread.id] || []
    const lastMessage = threadMessages[threadMessages.length - 1]
    const lastReadAt = membershipsByThread.get(thread.id) || '1970-01-01T00:00:00.000Z'

    const unreadCount = threadMessages.filter((message) => {
      if (message.senderId === user.id) return false
      return Date.parse(message.createdAt) > Date.parse(lastReadAt)
    }).length

    threads.push({
      id: thread.id,
      participants: participantsByThread.get(thread.id) || [],
      isGroup: Boolean(thread.is_group),
      groupName: thread.group_name || undefined,
      groupAvatar: thread.group_avatar || undefined,
      lastMessage,
      unreadCount,
      updatedAt: thread.updated_at || lastMessage?.createdAt || thread.created_at || new Date().toISOString(),
    })
  }

  threads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

  return dataResponse({
    requestId,
    data: {
      threads,
      messagesByThread,
    },
  })
}

function normalizeMessageStatus(status: unknown): ChatMessage['status'] {
  if (status === 'sent' || status === 'delivered' || status === 'read') return status
  return 'sent'
}

function normalizeAttachmentType(type: unknown): MessageAttachment['type'] {
  if (type === 'image' || type === 'video' || type === 'file') return type
  return 'file'
}
