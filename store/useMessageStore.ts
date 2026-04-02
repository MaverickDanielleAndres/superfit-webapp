/**
 * useMessageStore.ts
 * Manages direct messages conversations and unread state (Messenger Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatThread, ChatMessage, MessageReaction, MessageAttachment } from '@/types'

interface MessageState {
    threads: ChatThread[]
    messages: Record<string, ChatMessage[]>  // threadId -> messages

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
    'conv_1': [
        { id: 'm1', threadId: 'conv_1', senderId: 'coach_1', text: 'Hey! I reviewed your check-in photos. Phenomenal progress this week.', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read', reactions: [{ userId: 'me', emoji: '🔥' }], attachments: [] },
        { id: 'm2', threadId: 'conv_1', senderId: 'coach_1', text: 'We are going to bump your carbs up to 300g starting tomorrow. Check the plan updates.', createdAt: new Date(Date.now() - 3200000).toISOString(), status: 'read', reactions: [], attachments: [] },
        { id: 'm3', threadId: 'conv_1', senderId: 'me', text: 'Thanks Marcus! Feeling much stronger in the gym. I saw the update, will do.', createdAt: new Date(Date.now() - 1800000).toISOString(), status: 'read', reactions: [], attachments: [] },
        { id: 'm4', threadId: 'conv_1', senderId: 'coach_1', text: 'Perfect. Also dropped a video regarding your deadlift form, let me know if it helps.', createdAt: new Date(Date.now() - 900000).toISOString(), status: 'delivered', reactions: [], attachments: [{ id: 'att_1', type: 'video', url: '/videos/deadlift-form.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&fit=crop' }] },
    ],
    'conv_2': [
        { id: 'm5', threadId: 'conv_2', senderId: 'user_2', text: 'Are we still on for 6am tomorrow?', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read', reactions: [{ userId: 'me', emoji: '👍' }], attachments: [] },
    ]
}

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            threads: MOCK_THREADS,
            messages: MOCK_MESSAGES,

            addConversation: (thread) => set(state => {
                if (state.threads.some(t => t.id === thread.id)) return state
                return {
                    threads: [thread, ...state.threads],
                    messages: { ...state.messages, [thread.id]: [] }
                }
            }),

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

                set(state => ({
                    messages: {
                        ...state.messages,
                        [threadId]: [...(state.messages[threadId] || []), newMessage]
                    },
                    threads: state.threads.map(t =>
                        t.id === threadId
                            ? { ...t, lastMessage: newMessage, updatedAt: newMessage.createdAt }
                            : t
                    )
                }))

                // Simulate delivery
                setTimeout(() => {
                    set(state => ({
                        messages: {
                            ...state.messages,
                            [threadId]: (state.messages[threadId] || []).map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)
                        }
                    }))
                }, 1000)
            },

            addReaction: (threadId, messageId, userId, emoji) => set(state => {
                const updatedMessages = (state.messages[threadId] || []).map(m => {
                    if (m.id === messageId) {
                        const existing = m.reactions.find(r => r.userId === userId && r.emoji === emoji);
                        if (!existing) {
                            return { ...m, reactions: [...m.reactions, { userId, emoji }] };
                        }
                    }
                    return m;
                });
                return { messages: { ...state.messages, [threadId]: updatedMessages } };
            }),

            removeReaction: (threadId, messageId, userId, emoji) => set(state => {
                const updatedMessages = (state.messages[threadId] || []).map(m => {
                    if (m.id === messageId) {
                        return { ...m, reactions: m.reactions.filter(r => !(r.userId === userId && r.emoji === emoji)) };
                    }
                    return m;
                });
                return { messages: { ...state.messages, [threadId]: updatedMessages } };
            }),

            markAsRead: (threadId) => set(state => ({
                threads: state.threads.map(c =>
                    c.id === threadId ? { ...c, unreadCount: 0 } : c
                ),
                messages: {
                    ...state.messages,
                    [threadId]: (state.messages[threadId] || []).map(m => ({ ...m, status: 'read' as const }))
                }
            })),

            getMessages: (threadId) => get().messages[threadId] || [],

            getTotalUnread: () => get().threads.reduce((sum, c) => sum + c.unreadCount, 0)
        }),
        { name: 'superfit-messages-storage-v2' }
    )
)
