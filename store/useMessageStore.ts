/**
 * useMessageStore.ts
 * Manages direct messages conversations and unread state (Messenger Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatThread, ChatMessage, MessageAttachment, MessageReaction } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

interface MessageState {
    threads: ChatThread[]
    messages: Record<string, ChatMessage[]>
    isLoading: boolean
    error: string | null

    initialize: () => Promise<void>
    sendMessage: (threadId: string, senderId: string, content: string, attachments?: MessageAttachment[], replyToId?: string) => void
    addReaction: (threadId: string, messageId: string, userId: string, emoji: string) => void
    removeReaction: (threadId: string, messageId: string, userId: string, emoji: string) => void
    markAsRead: (threadId: string) => void
    getMessages: (threadId: string) => ChatMessage[]
    getTotalUnread: () => number
    addConversation: (thread: ChatThread) => void
}

const MOCK_THREADS: ChatThread[] = [
    {
        id: 'conv_1',
        participants: [
            { id: 'me', name: 'Me', avatar: '' },
            { id: 'coach_1', name: 'Coach Marcus', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&fit=crop' }
        ],
        isGroup: false,
        lastMessage: {
            id: 'm4', threadId: 'conv_1', senderId: 'coach_1', text: 'Perfect. Also dropped a video regarding your deadlift form, let me know if it helps.',
            createdAt: new Date(Date.now() - 900000).toISOString(), status: 'delivered', reactions: [], attachments: []
        },
        unreadCount: 1,
        updatedAt: new Date(Date.now() - 900000).toISOString()
    },
    {
        id: 'conv_2',
        participants: [
            { id: 'me', name: 'Me', avatar: '' },
            { id: 'user_2', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop' }
        ],
        isGroup: false,
        lastMessage: {
            id: 'm5', threadId: 'conv_2', senderId: 'user_2', text: 'Are we still on for 6am tomorrow?',
            createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read', reactions: [], attachments: []
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
]

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
    conv_1: [
        { id: 'm1', threadId: 'conv_1', senderId: 'coach_1', text: 'Hey! I reviewed your check-in photos. Phenomenal progress this week.', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read', reactions: [{ userId: 'me', emoji: '🔥' }], attachments: [] },
        { id: 'm2', threadId: 'conv_1', senderId: 'coach_1', text: 'We are going to bump your carbs up to 300g starting tomorrow. Check the plan updates.', createdAt: new Date(Date.now() - 3200000).toISOString(), status: 'read', reactions: [], attachments: [] },
        { id: 'm3', threadId: 'conv_1', senderId: 'me', text: 'Thanks Marcus! Feeling much stronger in the gym. I saw the update, will do.', createdAt: new Date(Date.now() - 1800000).toISOString(), status: 'read', reactions: [], attachments: [] },
        { id: 'm4', threadId: 'conv_1', senderId: 'coach_1', text: 'Perfect. Also dropped a video regarding your deadlift form, let me know if it helps.', createdAt: new Date(Date.now() - 900000).toISOString(), status: 'delivered', reactions: [], attachments: [{ id: 'att_1', type: 'video', url: '/videos/deadlift-form.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&fit=crop' }] },
    ],
    conv_2: [
        { id: 'm5', threadId: 'conv_2', senderId: 'user_2', text: 'Are we still on for 6am tomorrow?', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read', reactions: [{ userId: 'me', emoji: '👍' }], attachments: [] },
    ]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            threads: MOCK_THREADS,
            messages: MOCK_MESSAGES,
            isLoading: false,
            error: null,

            initialize: async () => {
                if (!isSupabaseAuthEnabled()) return

                set({ isLoading: true, error: null })
                const supabase = createClient()
                const { data: authData, error: authError } = await supabase.auth.getUser()
                const userId = authData.user?.id

                if (authError || !userId) {
                    set({ isLoading: false, error: authError?.message || 'User not authenticated.' })
                    return
                }

                try {
                    const { threads, messagesByThread } = await fetchMessageGraph(userId)
                    set({ threads, messages: messagesByThread, isLoading: false, error: null })
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unable to load messages.'
                    set({ isLoading: false, error: message })
                }
            },

            addConversation: (thread) => {
                set((state) => {
                    if (state.threads.some((t) => t.id === thread.id)) return state
                    return {
                        threads: [thread, ...state.threads],
                        messages: { ...state.messages, [thread.id]: [] }
                    }
                })

                if (!isSupabaseAuthEnabled()) return

                void (async () => {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id

                    if (!userId) return

                    const otherParticipant = thread.participants.find((p) => p.id !== userId)
                    if (!otherParticipant || !isUuid(userId) || !isUuid(otherParticipant.id)) return

                    const { data: createdThread, error: threadError } = await (supabase as any)
                        .from('message_threads')
                        .insert({
                            created_by: userId,
                            is_group: thread.isGroup,
                            group_name: thread.groupName || null,
                            group_avatar: thread.groupAvatar || null,
                        })
                        .select('id')
                        .single()

                    if (threadError || !createdThread?.id) {
                        set({ error: threadError?.message || 'Unable to create conversation.' })
                        return
                    }

                    const participantRows = [
                        { thread_id: createdThread.id, user_id: userId },
                        { thread_id: createdThread.id, user_id: otherParticipant.id },
                    ]

                    const { error: participantError } = await (supabase as any)
                        .from('message_thread_participants')
                        .insert(participantRows)

                    if (participantError) {
                        set({ error: participantError.message })
                        return
                    }

                    await get().initialize()
                })()
            },

            sendMessage: (threadId, senderId, content, attachments = [], replyToId) => {
                const newMessage: ChatMessage = {
                    id: `m_${Date.now()}`,
                    threadId,
                    senderId,
                    text: content,
                    createdAt: new Date().toISOString(),
                    status: 'sent',
                    reactions: [],
                    attachments,
                    replyToId
                }

                set((state) => ({
                    messages: {
                        ...state.messages,
                        [threadId]: [...(state.messages[threadId] || []), newMessage]
                    },
                    threads: state.threads.map((t) =>
                        t.id === threadId
                            ? { ...t, lastMessage: newMessage, updatedAt: newMessage.createdAt }
                            : t
                    )
                }))

                setTimeout(() => {
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [threadId]: (state.messages[threadId] || []).map((m) =>
                                m.id === newMessage.id ? { ...m, status: 'delivered' } : m
                            )
                        }
                    }))
                }, 1000)

                if (!isSupabaseAuthEnabled() || !isUuid(threadId)) return

                void (async () => {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id
                    if (!userId || userId !== senderId) return

                    const payload = {
                        thread_id: threadId,
                        sender_id: userId,
                        text: content,
                        attachments,
                        reply_to_id: isUuid(replyToId || '') ? replyToId : null,
                        status: 'delivered',
                    }

                    const { data, error } = await (supabase as any)
                        .from('messages')
                        .insert(payload)
                        .select('id, created_at')
                        .single()

                    if (error) {
                        set({ error: error.message })
                        return
                    }

                    if (data?.id) {
                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [threadId]: (state.messages[threadId] || []).map((m) =>
                                    m.id === newMessage.id
                                        ? { ...m, id: data.id as string, createdAt: (data.created_at as string) || m.createdAt }
                                        : m
                                )
                            }
                        }))
                    }

                    await (supabase as any)
                        .from('message_threads')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', threadId)
                })()
            },

            addReaction: (threadId, messageId, userId, emoji) => {
                set((state) => {
                    const updatedMessages = (state.messages[threadId] || []).map((m) => {
                        if (m.id !== messageId) return m

                        const exists = m.reactions.some((r) => r.userId === userId && r.emoji === emoji)
                        if (exists) return m

                        return { ...m, reactions: [...m.reactions, { userId, emoji }] }
                    })

                    return { messages: { ...state.messages, [threadId]: updatedMessages } }
                })

                if (!isSupabaseAuthEnabled() || !isUuid(messageId) || !isUuid(userId)) return

                void (async () => {
                    const supabase = createClient()
                    const { error } = await (supabase as any)
                        .from('message_reactions')
                        .insert({ message_id: messageId, user_id: userId, emoji })

                    if (error) set({ error: error.message })
                })()
            },

            removeReaction: (threadId, messageId, userId, emoji) => {
                set((state) => {
                    const updatedMessages = (state.messages[threadId] || []).map((m) => {
                        if (m.id !== messageId) return m
                        return {
                            ...m,
                            reactions: m.reactions.filter((r) => !(r.userId === userId && r.emoji === emoji))
                        }
                    })

                    return { messages: { ...state.messages, [threadId]: updatedMessages } }
                })

                if (!isSupabaseAuthEnabled() || !isUuid(messageId) || !isUuid(userId)) return

                void (async () => {
                    const supabase = createClient()
                    const { error } = await (supabase as any)
                        .from('message_reactions')
                        .delete()
                        .eq('message_id', messageId)
                        .eq('user_id', userId)
                        .eq('emoji', emoji)

                    if (error) set({ error: error.message })
                })()
            },

            markAsRead: (threadId) => {
                set((state) => ({
                    threads: state.threads.map((thread) =>
                        thread.id === threadId ? { ...thread, unreadCount: 0 } : thread
                    ),
                    messages: {
                        ...state.messages,
                        [threadId]: (state.messages[threadId] || []).map((m) => ({ ...m, status: 'read' as const }))
                    }
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(threadId)) return

                void (async () => {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id
                    if (!userId) return

                    const { error } = await (supabase as any)
                        .from('message_thread_participants')
                        .update({ last_read_at: new Date().toISOString() })
                        .eq('thread_id', threadId)
                        .eq('user_id', userId)

                    if (error) set({ error: error.message })
                })()
            },

            getMessages: (threadId) => get().messages[threadId] || [],

            getTotalUnread: () => get().threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
        }),
        { name: 'superfit-messages-storage-v3' }
    )
)

async function fetchMessageGraph(userId: string): Promise<{ threads: ChatThread[]; messagesByThread: Record<string, ChatMessage[]> }> {
    const supabase = createClient()

    const { data: membershipRows, error: membershipError } = await (supabase as any)
        .from('message_thread_participants')
        .select('thread_id,last_read_at,thread:message_threads(id,is_group,group_name,group_avatar,updated_at,created_at)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })

    if (membershipError) throw new Error(membershipError.message)

    const memberships = Array.isArray(membershipRows) ? membershipRows : []
    const threadIds = memberships.map((row) => row.thread_id as string).filter(Boolean)

    if (!threadIds.length) {
        return { threads: [], messagesByThread: {} }
    }

    const { data: participantRows, error: participantError } = await (supabase as any)
        .from('message_thread_participants')
        .select('thread_id,user_id,profile:profiles(full_name,avatar_url)')
        .in('thread_id', threadIds)

    if (participantError) throw new Error(participantError.message)

    const { data: messageRows, error: messageError } = await (supabase as any)
        .from('messages')
        .select('id,thread_id,sender_id,text,attachments,status,reply_to_id,created_at,reactions:message_reactions(user_id,emoji)')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true })

    if (messageError) throw new Error(messageError.message)

    const participantsByThread = new Map<string, ChatThread['participants']>()
    for (const row of participantRows || []) {
        const threadId = row.thread_id as string
        const profile = (row.profile || {}) as { full_name?: string | null; avatar_url?: string | null }
        const nextParticipant = {
            id: row.user_id as string,
            name: profile.full_name || (row.user_id === userId ? 'You' : 'User'),
            avatar: profile.avatar_url || ''
        }

        const existing = participantsByThread.get(threadId) || []
        participantsByThread.set(threadId, [...existing, nextParticipant])
    }

    const messagesByThread: Record<string, ChatMessage[]> = {}
    for (const row of messageRows || []) {
        const threadId = row.thread_id as string
        if (!messagesByThread[threadId]) messagesByThread[threadId] = []

        const reactions: MessageReaction[] = Array.isArray(row.reactions)
            ? row.reactions.map((reaction: any) => ({
                userId: String(reaction.user_id || ''),
                emoji: String(reaction.emoji || '')
            })).filter((reaction: MessageReaction) => !!reaction.userId && !!reaction.emoji)
            : []

        const attachments: MessageAttachment[] = Array.isArray(row.attachments)
            ? row.attachments.map((attachment: any) => ({
                id: String(attachment.id || `att_${Date.now()}`),
                type: normalizeAttachmentType(attachment.type),
                url: String(attachment.url || ''),
                thumbnailUrl: attachment.thumbnailUrl ? String(attachment.thumbnailUrl) : undefined,
                name: attachment.name ? String(attachment.name) : undefined,
            })).filter((attachment: MessageAttachment) => !!attachment.url || !!attachment.name)
            : []

        messagesByThread[threadId].push({
            id: row.id as string,
            threadId,
            senderId: row.sender_id as string,
            text: String(row.text || ''),
            createdAt: row.created_at as string,
            status: normalizeMessageStatus(row.status),
            reactions,
            attachments,
            replyToId: row.reply_to_id ? String(row.reply_to_id) : undefined,
        })
    }

    const membershipsByThread = new Map<string, string>()
    for (const row of memberships) {
        membershipsByThread.set(row.thread_id as string, String(row.last_read_at || '1970-01-01T00:00:00.000Z'))
    }

    const threads: ChatThread[] = []
    for (const row of memberships) {
        const thread = row.thread as {
            id: string
            is_group: boolean
            group_name: string | null
            group_avatar: string | null
            updated_at: string | null
            created_at: string | null
        }

        if (!thread?.id) continue

        const threadMessages = messagesByThread[thread.id] || []
        const lastMessage = threadMessages[threadMessages.length - 1]
        const lastReadAt = membershipsByThread.get(thread.id) || '1970-01-01T00:00:00.000Z'

        const unreadCount = threadMessages.filter((message) => {
            if (message.senderId === userId) return false
            return Date.parse(message.createdAt) > Date.parse(lastReadAt)
        }).length

        threads.push({
            id: thread.id,
            participants: participantsByThread.get(thread.id) || [],
            isGroup: !!thread.is_group,
            groupName: thread.group_name || undefined,
            groupAvatar: thread.group_avatar || undefined,
            lastMessage,
            unreadCount,
            updatedAt: (thread.updated_at || lastMessage?.createdAt || thread.created_at || new Date().toISOString()) as string,
        })
    }

    threads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

    return { threads, messagesByThread }
}

function normalizeMessageStatus(status: unknown): ChatMessage['status'] {
    if (status === 'sent' || status === 'delivered' || status === 'read') return status
    return 'sent'
}

function normalizeAttachmentType(type: unknown): MessageAttachment['type'] {
    if (type === 'image' || type === 'video' || type === 'file') return type
    return 'file'
}

function isUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}
