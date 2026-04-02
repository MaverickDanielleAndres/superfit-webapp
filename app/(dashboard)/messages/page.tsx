'use client'

/**
 * Direct Messages Page — Messenger Parity UX
 * Implements rich text, attachments, reactions, read receipts, and threads.
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Info, Phone, Video, Send, Paperclip, Image as ImageIcon,
    Smile, MoreHorizontal, Check, CheckCheck, X, Reply, Heart, ThumbsUp, Flame, ThumbsDown,
    Trash2, Pin, Forward, Mic, Copy, Edit2, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useMessageStore } from '@/store/useMessageStore'
import { useAuthStore } from '@/store/useAuthStore'
import { MessageAttachment } from '@/types'

export default function MessagesPage() {
    const { threads, messages, sendMessage, markAsRead, getMessages, addReaction, removeReaction } = useMessageStore()
    const { user } = useAuthStore()

    const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || '')
    const [inputText, setInputText] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // UI State for composed message
    const [attachments, setAttachments] = useState<MessageAttachment[]>([])
    const [replyingTo, setReplyingTo] = useState<string | null>(null)

    // UI State for message actions
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
    const [showReactionMenuFor, setShowReactionMenuFor] = useState<string | null>(null)
    const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const activeThread = threads.find(t => t.id === activeThreadId)
    const activeMessages = getMessages(activeThreadId)

    // Filter threads
    const filteredThreads = threads.filter(t => {
        const title = t.isGroup ? t.groupName : t.participants.find(p => p.id !== 'me')?.name || 'User';
        return title?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    useEffect(() => {
        if (activeThreadId) markAsRead(activeThreadId)
    }, [activeThreadId, activeMessages.length, markAsRead])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeMessages, attachments, replyingTo])

    const handleSend = () => {
        if ((!inputText.trim() && attachments.length === 0) || !activeThreadId || !user) return

        // Mock upload logic -> just pass attachments array directly
        sendMessage(activeThreadId, 'me', inputText.trim(), attachments, replyingTo || undefined)

        setInputText('')
        setAttachments([])
        setReplyingTo(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const selectThread = (threadId: string) => {
        setActiveThreadId(threadId)
        setAttachments([])
        setReplyingTo(null)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Mocking an image attachment
            const newAtt: MessageAttachment = {
                id: `att_${Date.now()}`,
                type: 'image',
                url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&fit=crop', // Mock visual
                name: e.target.files[0].name
            }
            setAttachments([...attachments, newAtt])
        }
    }

    const toggleReaction = (msgId: string, emoji: string) => {
        const msg = activeMessages.find(m => m.id === msgId)
        if (!msg) return
        const existing = msg.reactions.find(r => r.userId === 'me' && r.emoji === emoji)
        if (existing) {
            removeReaction(activeThreadId, msgId, 'me', emoji)
        } else {
            addReaction(activeThreadId, msgId, 'me', emoji)
        }
        setShowReactionMenuFor(null)
    }

    const getParticipant = (id: string, thread = activeThread) => {
        return thread?.participants.find(p => p.id === id)
    }

    const getThreadTitle = (thread: any) => {
        if (thread.isGroup) return thread.groupName
        return thread.participants.find((p: any) => p.id !== 'me')?.name || 'User'
    }

    const getThreadAvatar = (thread: any) => {
        if (thread.isGroup) return thread.groupAvatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${thread.id}`
        return thread.participants.find((p: any) => p.id !== 'me')?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${thread.id}`
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto h-[calc(100vh-120px)] min-h-[600px] flex gap-6 pb-6 pt-2">

            {/* Sidebar List */}
            <div className="w-[340px] shrink-0 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden flex flex-col shadow-sm">
                <div className="p-5 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-black text-[24px] text-(--text-primary) leading-none tracking-tight">Chats</h2>
                        {/* New chat button mockup */}
                        <button className="w-[36px] h-[36px] rounded-full bg-(--text-primary) text-(--bg-base) flex items-center justify-center hover:opacity-90 transition-opacity"><Smile className="w-[18px] h-[18px]" /></button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search Messenger"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-[44px] pl-10 pr-4 rounded-[16px] bg-(--bg-surface) border border-(--border-default) focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-[14px] font-body outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
                    {filteredThreads.map(thread => {
                        const title = getThreadTitle(thread)
                        const avatar = getThreadAvatar(thread)
                        const isActive = activeThreadId === thread.id
                        const isUnread = thread.unreadCount > 0

                        return (
                            <button
                                key={thread.id}
                                onClick={() => selectThread(thread.id)}
                                className={cn("w-full p-3 flex items-center gap-3 text-left rounded-[16px] transition-colors mb-1", isActive ? 'bg-[var(--bg-elevated)] border border-(--border-default) shadow-sm' : 'border border-transparent hover:bg-[var(--bg-elevated)]')}
                            >
                                <div className="relative shrink-0">
                                    <img src={avatar} alt={title} className="w-[52px] h-[52px] rounded-full object-cover border border-(--border-subtle)" />
                                    {/* Mock active status indicator */}
                                    <div className="absolute bottom-0 right-0 w-[14px] h-[14px] rounded-full bg-emerald-500 border-2 border-(--bg-surface)" />
                                </div>
                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={cn("font-display font-bold text-[15px] truncate", isUnread ? "text-(--text-primary)" : "text-(--text-primary)")}>{title}</span>
                                        {thread.lastMessage && (
                                            <span className={cn("font-body text-[12px] shrink-0 ml-2", isUnread ? "text-emerald-500 font-bold" : "text-(--text-tertiary)")}>
                                                {new Date(thread.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={cn("font-body text-[14px] truncate leading-tight", isUnread ? "font-bold text-(--text-primary)" : "text-(--text-secondary)")}>
                                            {thread.lastMessage?.senderId === 'me' ? 'You: ' : ''}{thread.lastMessage?.text || (thread.lastMessage?.attachments.length ? 'Sent an attachment' : 'No messages yet')}
                                        </p>
                                        {isUnread && <div className="w-[10px] h-[10px] bg-emerald-500 rounded-full shrink-0" />}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Chat Area Right Panel */}
            {activeThread ? (
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden flex flex-col shadow-sm relative">

                    {/* Header */}
                    <div className="h-[72px] px-6 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between shrink-0 z-20">
                        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                            <img src={getThreadAvatar(activeThread)} className="w-[44px] h-[44px] rounded-full object-cover border border-(--border-subtle)" />
                            <div className="flex flex-col">
                                <h2 className="font-display font-bold text-[17px] text-(--text-primary) leading-tight">{getThreadTitle(activeThread)}</h2>
                                <span className="font-body text-[12px] text-(--text-secondary) font-medium">Active now</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-surface-alt)] flex items-center justify-center text-emerald-500 transition-colors bg-(--bg-surface) border border-(--border-subtle)"><Phone className="w-[18px] h-[18px]" /></button>
                            <button className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-surface-alt)] flex items-center justify-center text-emerald-500 transition-colors bg-(--bg-surface) border border-(--border-subtle)"><Video className="w-[18px] h-[18px]" /></button>
                            <div className="w-[1px] h-[24px] bg-(--border-subtle) mx-1" />
                            <button className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-surface-alt)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><Info className="w-[20px] h-[20px]" /></button>
                        </div>
                    </div>

                    {/* Messages Window */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 relative isolate">
                        {/* Background subtle pattern mockup */}
                        <div className="absolute inset-0 z-[-1] opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        {/* Pinned Message Banner */}
                        {pinnedMessageId && activeMessages.find(m => m.id === pinnedMessageId) && (
                            <div className="sticky top-0 z-30 bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-(--border-subtle) rounded-[12px] p-3 shadow-sm flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Pin className="w-[16px] h-[16px] shrink-0 text-emerald-500 fill-emerald-500/20" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-display font-bold text-[13px] text-emerald-500">Pinned Message</span>
                                        <span className="font-body text-[13px] text-(--text-secondary) truncate max-w-[400px]">
                                            {activeMessages.find(m => m.id === pinnedMessageId)?.text || 'Attachment'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setPinnedMessageId(null)} className="shrink-0 w-[24px] h-[24px] rounded-full hover:bg-(--border-subtle) flex items-center justify-center text-(--text-secondary)"><X className="w-[14px] h-[14px]" /></button>
                            </div>
                        )}

                        {activeMessages.map((msg, idx) => {
                            const isMe = msg.senderId === 'me'
                            const sender = getParticipant(msg.senderId)
                            const showAvatar = !isMe && (idx === activeMessages.length - 1 || activeMessages[idx + 1].senderId !== msg.senderId)
                            const replyMsg = msg.replyToId ? activeMessages.find(m => m.id === msg.replyToId) : null

                            return (
                                <div
                                    key={msg.id}
                                    className={cn("flex flex-col group/message relative", isMe ? "items-end" : "items-start")}
                                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                                    onMouseLeave={() => { setHoveredMessageId(null); setShowReactionMenuFor(null) }}
                                >

                                    {/* Sender Name above group (if not consecutive) */}
                                    {!isMe && (idx === 0 || activeMessages[idx - 1].senderId !== msg.senderId) && (
                                        <span className="font-body text-[12px] text-(--text-secondary) font-bold ml-12 mb-1">{sender?.name}</span>
                                    )}

                                    {/* Replied Message Wrapper */}
                                    {replyMsg && (
                                        <div className={cn("flex items-center gap-2 mb-1 opacity-70 cursor-pointer hover:opacity-100 transition-opacity", isMe ? "mr-[10px]" : "ml-[42px]")}>
                                            <Reply className="w-[12px] h-[12px] text-(--text-tertiary) rotate-180" />
                                            <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[8px] px-3 py-1.5 max-w-[200px] truncate">
                                                <span className="font-body text-[11px] font-bold text-(--text-primary)">{replyMsg.senderId === 'me' ? 'You' : getParticipant(replyMsg.senderId)?.name}: </span>
                                                <span className="font-body text-[11px] text-(--text-secondary)">{replyMsg.text || 'Attachment'}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-end gap-2 max-w-[75%] relative">

                                        {/* Avatar (Left side, only bottom message of cluster) */}
                                        {!isMe && (
                                            <div className="w-[28px] shrink-0 flex items-end pb-1">
                                                {showAvatar && <img src={sender?.avatar} className="w-[28px] h-[28px] rounded-full object-cover" alt="" />}
                                            </div>
                                        )}

                                        {/* Action Bar (Left of mine) */}
                                        {isMe && hoveredMessageId === msg.id && (
                                            <div className="flex items-center gap-0.5 mr-2 opacity-0 group-hover/message:opacity-100 transition-opacity bg-(--bg-surface) shadow-sm border border-(--border-subtle) rounded-full px-1 py-0.5">
                                                <button onClick={() => setReplyingTo(msg.id)} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Reply"><Reply className="w-[14px] h-[14px] -scale-x-100" /></button>
                                                <button onClick={() => setShowReactionMenuFor(msg.id)} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="React"><Smile className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Copied')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Copy"><Copy className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => { setPinnedMessageId(msg.id); toast.success('Message pinned') }} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Pin"><Pin className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Starred')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-yellow-500 transition-colors" title="Star"><Star className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Edit mode')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Edit"><Edit2 className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Forwarding...')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Forward"><Forward className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.error('Message deleted')} className="w-[28px] h-[28px] rounded-full hover:bg-red-500/10 flex items-center justify-center text-(--text-tertiary) hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-[14px] h-[14px]" /></button>
                                            </div>
                                        )}

                                        {/* Message Bubbles Container */}
                                        <div className="flex flex-col gap-1 relative">

                                            {/* Media Attachments */}
                                            {msg.attachments?.map(att => (
                                                <div key={att.id} className="rounded-[16px] overflow-hidden border border-(--border-subtle) max-w-[260px]">
                                                    {att.type === 'image' || att.type === 'video' ? (
                                                        <img src={att.url || att.thumbnailUrl} alt="Attachment" className="w-full h-auto object-cover" />
                                                    ) : (
                                                        <div className="p-4 bg-[var(--bg-elevated)] flex items-center gap-3">
                                                            <div className="p-2 bg-(--bg-surface) rounded-lg"><Paperclip className="w-[16px] h-[16px]" /></div>
                                                            <span className="font-body text-[13px] font-bold truncate">{att.name || 'document.pdf'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Text Bubble */}
                                            {msg.text && (
                                                <div className={cn(
                                                    "px-4 py-3 font-body text-[15px] leading-relaxed relative",
                                                    isMe
                                                        ? "bg-emerald-500 text-white rounded-[20px] rounded-br-[4px] shadow-sm ml-auto"
                                                        : "bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) rounded-[20px] rounded-bl-[4px] shadow-sm"
                                                )}>
                                                    {msg.text}
                                                </div>
                                            )}

                                            {/* Reactions Display (Floating bottom right/left of bubble) */}
                                            {msg.reactions.length > 0 && (
                                                <div className={cn("absolute -bottom-3 flex flex-wrap gap-1 z-10", isMe ? "right-2" : "left-2")}>
                                                    {/* Group reactions by emoji */}
                                                    {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                                                        const count = msg.reactions.filter(r => r.emoji === emoji).length
                                                        const meReacted = msg.reactions.some(r => r.emoji === emoji && r.userId === 'me')
                                                        return (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                                className={cn("px-1.5 py-0.5 rounded-full border shadow-sm text-[12px] flex items-center gap-1 cursor-pointer transition-transform hover:scale-110",
                                                                    meReacted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-(--bg-surface) border-(--border-subtle) text-(--text-primary)"
                                                                )}
                                                            >
                                                                {emoji} {count > 1 && <span className="font-bold text-[10px]">{count}</span>}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* Reaction Picker Popover */}
                                            {showReactionMenuFor === msg.id && (
                                                <div className={cn("absolute -top-10 flex items-center gap-1 bg-(--bg-surface) border border-(--border-subtle) rounded-full px-2 py-1 shadow-xl z-50", isMe ? "right-0" : "left-0")}>
                                                    {['❤️', '👍', '🔥', '😂', '👎', '😮'].map(e => (
                                                        <button key={e} onClick={() => toggleReaction(msg.id, e)} className="w-[32px] h-[32px] flex items-center justify-center hover:bg-[var(--bg-elevated)] rounded-full text-[16px] transition-transform hover:scale-125 cursor-pointer">
                                                            {e}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                        </div>

                                        {/* Action Bar (Right side for them) */}
                                        {!isMe && hoveredMessageId === msg.id && (
                                            <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover/message:opacity-100 transition-opacity bg-(--bg-surface) shadow-sm border border-(--border-subtle) rounded-full px-1 py-0.5">
                                                <button onClick={() => setShowReactionMenuFor(msg.id)} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="React"><Smile className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => setReplyingTo(msg.id)} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Reply"><Reply className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Copied')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Copy"><Copy className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => { setPinnedMessageId(msg.id); toast.success('Message pinned') }} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Pin"><Pin className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Starred')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-yellow-500 transition-colors" title="Star"><Star className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.success('Forwarding...')} className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition-colors" title="Forward"><Forward className="w-[14px] h-[14px]" /></button>
                                                <button onClick={() => toast.error('Message from user deleted')} className="w-[28px] h-[28px] rounded-full hover:bg-red-500/10 flex items-center justify-center text-(--text-tertiary) hover:text-red-500 transition-colors" title="Delete for me"><Trash2 className="w-[14px] h-[14px]" /></button>
                                            </div>
                                        )}

                                    </div>

                                    {/* Read Receipts & Time */}
                                    {isMe && idx === activeMessages.length - 1 && (
                                        <div className="mt-1.5 flex items-center gap-1.5 font-body text-[11px] font-semibold text-(--text-tertiary) mr-1">
                                            {msg.status === 'read' ? (
                                                <>
                                                    <span className="text-blue-500 tracking-wide uppercase text-[10px]">Seen</span>
                                                    <img src={getThreadAvatar(activeThread)} className="w-[14px] h-[14px] rounded-full border border-(--border-subtle) ml-0.5 object-cover" alt="Seen by" />
                                                </>
                                            ) : msg.status === 'delivered' ? (
                                                <>
                                                    <span className="uppercase text-[10px] tracking-wide">Delivered</span>
                                                    <CheckCheck className="w-[14px] h-[14px]" />
                                                </>
                                            ) : (
                                                <>
                                                    <span className="uppercase text-[10px] tracking-wide">Sent</span>
                                                    <Check className="w-[14px] h-[14px]" />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Dummy Typing Indicator */}
                        {inputText.length > 5 && (
                            <div className="flex items-end gap-2 max-w-[75%] ml-[36px]">
                                <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[20px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1.5 shadow-sm h-[42px]">
                                    <div className="w-[6px] h-[6px] bg-(--text-tertiary) rounded-full animate-bounce" />
                                    <div className="w-[6px] h-[6px] bg-(--text-tertiary) rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                    <div className="w-[6px] h-[6px] bg-(--text-tertiary) rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 sm:p-5 border-t border-(--border-subtle) bg-(--bg-surface) shrink-0 flex flex-col gap-2 relative z-20">

                        {/* Reply Banner */}
                        {replyingTo && (
                            <div className="flex items-center justify-between bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 py-2 mb-2">
                                <div className="flex flex-col min-w-0">
                                    <span className="font-display font-bold text-[13px] text-emerald-500">Replying to {activeMessages.find(m => m.id === replyingTo)?.senderId === 'me' ? 'Yourself' : getParticipant(activeMessages.find(m => m.id === replyingTo)?.senderId || '')?.name}</span>
                                    <span className="font-body text-[13px] text-(--text-secondary) truncate max-w-[400px]">{activeMessages.find(m => m.id === replyingTo)?.text || 'Attachment'}</span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="w-[28px] h-[28px] rounded-full hover:bg-(--border-subtle) flex items-center justify-center text-(--text-secondary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                            </div>
                        )}

                        {/* Staged Attachments */}
                        {attachments.length > 0 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="relative w-[80px] h-[80px] rounded-[12px] border border-(--border-subtle) overflow-hidden shrink-0 group">
                                        <img src={att.url || att.thumbnailUrl} className="w-full h-full object-cover" alt="Staged" />
                                        <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-[20px] h-[20px] rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-[12px] h-[12px]" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Main Input Box */}
                        <div className="flex items-end gap-2">
                            <div className="flex items-center gap-1 shrink-0 pb-1.5">
                                <button className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"><MoreHorizontal className="w-[20px] h-[20px]" /></button>
                                <button onClick={() => fileInputRef.current?.click()} className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"><ImageIcon className="w-[20px] h-[20px]" /></button>
                                <button onClick={() => {
                                    const id = toast.loading('Recording voice note...')
                                    setTimeout(() => toast.success('Voice note attached', { id }), 2000)
                                }} className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"><Mic className="w-[20px] h-[20px]" /></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </div>

                            <div className="flex-1 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[24px] rounded-br-[8px] flex items-end px-3 py-[6px] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all shadow-sm">
                                <textarea
                                    placeholder="Aa"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 bg-transparent border-none resize-none min-h-[36px] max-h-[160px] font-body text-[15px] focus:ring-0 py-[8px] px-2 text-(--text-primary) placeholder:text-(--text-tertiary) outline-none"
                                    rows={1}
                                />
                                <button className="w-[36px] h-[36px] shrink-0 rounded-full hover:bg-[var(--bg-surface)] flex items-center justify-center text-blue-500 transition-colors mb-px"><Smile className="w-[22px] h-[22px]" /></button>
                            </div>

                            {(inputText.trim().length > 0 || attachments.length > 0) ? (
                                <button
                                    onClick={handleSend}
                                    className="w-[48px] h-[48px] shrink-0 rounded-[24px] rounded-bl-[8px] bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md mb-0.5 cursor-pointer"
                                    style={{ transformOrigin: 'center right' }}
                                >
                                    <Send className="w-[20px] h-[20px] ml-1" />
                                </button>
                            ) : (
                                <button className="w-[48px] h-[48px] shrink-0 rounded-[24px] rounded-bl-[8px] bg-[var(--bg-elevated)] border border-(--border-subtle) text-blue-500 hover:bg-blue-500/10 flex items-center justify-center transition-colors mb-0.5 cursor-pointer">
                                    <ThumbsUp className="w-[24px] h-[24px]" />
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] flex flex-col items-center justify-center text-(--text-secondary) shadow-sm">
                    <div className="w-[80px] h-[80px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6">
                        <Send className="w-[40px] h-[40px] text-(--text-tertiary)" />
                    </div>
                    <h3 className="font-display font-bold text-[24px] text-(--text-primary) mb-2">Your Messages</h3>
                    <p className="font-body text-[15px] max-w-[300px] text-center">Chat with athletes, coaches, and friends. Send photos and videos.</p>
                    <button className="mt-6 bg-emerald-500 text-white px-6 py-2.5 rounded-full font-bold text-[15px] hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">Start a conversation</button>
                </div>
            )}
        </motion.div>
    )
}
