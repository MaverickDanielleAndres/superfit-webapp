/**
 * useMessageStore.ts
 * Manages direct messages conversations and unread state (Messenger Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatThread, ChatMessage, MessageAttachment } from '@/types'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { requestApi } from '@/lib/api/client'

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
                try {
                    const response = await requestApi<{ threads: ChatThread[]; messagesByThread: Record<string, ChatMessage[]> }>('/api/v1/messages')
                    set({
                        threads: response.data.threads,
                        messages: response.data.messagesByThread,
                        isLoading: false,
                        error: null,
                    })
                } catch (error) {
                    set({ isLoading: false, error: getErrorMessage(error) })
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
                    const participantIds = thread.participants.map((participant) => participant.id).filter((id) => isUuid(id))

                    try {
                        await requestApi<{ threadId: string }>('/api/v1/messages/threads', {
                            method: 'POST',
                            body: JSON.stringify({
                                participantIds,
                                isGroup: thread.isGroup,
                                groupName: thread.groupName || null,
                                groupAvatar: thread.groupAvatar || null,
                            }),
                        })
                        await get().initialize()
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
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
                    if (!isUuid(senderId)) return

                    try {
                        const response = await requestApi<{ message: ChatMessage }>('/api/v1/messages/send', {
                            method: 'POST',
                            body: JSON.stringify({
                                threadId,
                                text: content,
                                attachments,
                                replyToId: isUuid(replyToId || '') ? replyToId : null,
                            }),
                        })

                        const persistedMessage = response.data.message
                        if (persistedMessage?.id) {
                            set((state) => ({
                                messages: {
                                    ...state.messages,
                                    [threadId]: (state.messages[threadId] || []).map((m) =>
                                        m.id === newMessage.id
                                            ? {
                                                ...m,
                                                id: persistedMessage.id,
                                                createdAt: persistedMessage.createdAt || m.createdAt,
                                                status: persistedMessage.status || 'delivered',
                                            }
                                            : m
                                    )
                                }
                            }))
                        }
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                        return
                    }
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
                    try {
                        await requestApi<{ added: boolean; messageId: string; emoji: string }>('/api/v1/messages/reactions', {
                            method: 'POST',
                            body: JSON.stringify({ messageId, emoji }),
                        })
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
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
                    try {
                        await requestApi<{ removed: boolean; messageId: string; emoji: string }>('/api/v1/messages/reactions', {
                            method: 'DELETE',
                            body: JSON.stringify({ messageId, emoji }),
                        })
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
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
                    try {
                        await requestApi<{ threadId: string; read: boolean }>('/api/v1/messages/mark-read', {
                            method: 'POST',
                            body: JSON.stringify({ threadId }),
                        })
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
                })()
            },

            getMessages: (threadId) => get().messages[threadId] || [],

            getTotalUnread: () => get().threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
        }),
        { name: 'superfit-messages-storage-v3' }
    )
)

function isUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }
    return 'Request failed.'
}
