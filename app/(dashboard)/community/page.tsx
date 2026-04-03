'use client'

/**
 * Community Page — Twitter Parity UX
 * Implements "For You", "Following", rich media posts, polls, verified badges,
 * reposts, likes, and deep engagement buttons.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart, MessageCircle, Share2, Trophy, Flame, Search,
    Plus, X, Loader2, Image as ImageIcon, BarChart2, Repeat2,
    MoreHorizontal, BadgeCheck, CheckCircle2, Users, Bookmark, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { useCommunityStore } from '@/store/useCommunityStore'
import { useAuthStore } from '@/store/useAuthStore'
import { CommunityPost } from '@/types'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'

export default function CommunityPage() {
    const router = useRouter()
    const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou')
    const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed')

    // Post composer state
    const [showComposer, setShowComposer] = useState(false)
    const [newPostContent, setNewPostContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [composerMediaUrls, setComposerMediaUrls] = useState<string[]>([])
    const [showPollComposer, setShowPollComposer] = useState(false)
    const [pollQuestion, setPollQuestion] = useState('')
    const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

    // Interaction state (UI mocks for threads)
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
    const [replyDraftByPost, setReplyDraftByPost] = useState<Record<string, string>>({})
    const [repliesByPost, setRepliesByPost] = useState<Record<string, Array<{ id: string; userName: string; userHandle: string; userAvatar: string; content: string; createdAt: string }>>>({})
    const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null)

    const [pollVotes, setPollVotes] = useState<Record<string, string>>({})
    const [followingIds, setFollowingIds] = useState<string[]>([])
    const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([])
    const [mutedUserIds, setMutedUserIds] = useState<string[]>([])
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([])
    const [reportedPostIds, setReportedPostIds] = useState<string[]>([])
    const [editedPostContent, setEditedPostContent] = useState<Record<string, string>>({})
    const [editingPostId, setEditingPostId] = useState<string | null>(null)

    const { posts, addPost, likePost, repostPost, addComment, deletePost, fetchPosts, isLoading, error } = useCommunityStore()
    const { user } = useAuthStore()
    const isSimulationMode = !isSupabaseAuthEnabled()
    const composerFileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!user?.id) return
        void fetchPosts()
    }, [fetchPosts, user?.id])

    const visiblePosts = posts.filter((post) => !hiddenPostIds.includes(post.id) && !mutedUserIds.includes(post.userId) && !blockedUserIds.includes(post.userId))
    const displayPosts = feedTab === 'foryou'
        ? visiblePosts
        : visiblePosts.filter((post) => post.userId === user?.id || followingIds.includes(post.userId))

    const suggestions = useMemo(() => {
        const byUser = new Map<string, { id: string; name: string; handle: string; avatar: string; verified: boolean }>()

        for (const post of posts) {
            if (!post.userId || post.userId === user?.id || byUser.has(post.userId)) continue
            byUser.set(post.userId, {
                id: post.userId,
                name: post.userName,
                handle: post.userHandle,
                avatar: post.userAvatar,
                verified: !!post.isVerified,
            })
        }

        return Array.from(byUser.values()).slice(0, 6)
    }, [posts, user?.id])

    useEffect(() => {
        if (followingIds.length > 0) return
        if (!suggestions.length) return
        setFollowingIds(suggestions.slice(0, 3).map((item) => item.id))
    }, [followingIds.length, suggestions])

    const leaderboard = useMemo(() => {
        const byUser = new Map<string, { userId: string; name: string; handle: string; avatar: string; score: number; posts: number; likes: number; comments: number; reposts: number }>()

        for (const post of posts) {
            const existing = byUser.get(post.userId) || {
                userId: post.userId,
                name: post.userName,
                handle: post.userHandle,
                avatar: post.userAvatar,
                score: 0,
                posts: 0,
                likes: 0,
                comments: 0,
                reposts: 0,
            }

            existing.posts += 1
            existing.likes += post.likes || 0
            existing.comments += post.comments || 0
            existing.reposts += post.reposts || 0
            existing.score = existing.posts * 10 + existing.likes * 3 + existing.comments * 2 + existing.reposts * 4
            byUser.set(post.userId, existing)
        }

        const rows = Array.from(byUser.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((row, index) => ({
                rank: index + 1,
                name: row.name,
                handle: row.handle,
                score: row.score,
                isYou: row.userId === user?.id,
                trend: row.score >= 100 ? 'up' : row.score >= 40 ? 'same' : 'down',
                avatar: row.avatar,
            }))

        if (rows.length) return rows

        return [
            { rank: 1, name: user?.name || 'You', handle: `@${user?.email?.split('@')[0] || 'you'}`, score: 120, isYou: true, trend: 'up', avatar: user?.avatar || '' },
            { rank: 2, name: 'SuperFit User', handle: '@superfit_member', score: 80, isYou: false, trend: 'same', avatar: '' },
            { rank: 3, name: 'Coach Marcus', handle: '@coach_marcus', score: 65, isYou: false, trend: 'up', avatar: '' },
        ]
    }, [posts, user?.id])

    const handlePost = async () => {
        if (!newPostContent.trim() || !user) return

        if (editingPostId) {
            handleSavePostEdit(editingPostId)
            return
        }

        setIsPosting(true)
        await new Promise(r => setTimeout(r, 600))

        const normalizedOptions = pollOptions.map((option) => option.trim()).filter(Boolean)
        const pollPayload = showPollComposer && pollQuestion.trim().length > 0 && normalizedOptions.length >= 2
            ? {
                question: pollQuestion.trim(),
                options: normalizedOptions.map((option, index) => ({
                    id: `opt_${index + 1}`,
                    text: option,
                    votes: 0,
                })),
                totalVotes: 0,
            }
            : undefined

        addPost({
            userId: user.id || 'usr_x',
            userName: user.name || 'Current User',
            userHandle: `@${user.email?.split('@')[0] || 'user'}`,
            userAvatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=new_${user.id}`,
            isCoach: false,
            content: newPostContent,
            type: pollPayload ? 'challenge' : 'text',
            mediaUrls: composerMediaUrls,
            poll: pollPayload,
            postedAt: new Date().toISOString(),
        })
        setNewPostContent('')
        setComposerMediaUrls([])
        setShowPollComposer(false)
        setPollQuestion('')
        setPollOptions(['', ''])
        setShowComposer(false)
        setIsPosting(false)
    }

    const handleComposerFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const objectUrl = URL.createObjectURL(file)
        setComposerMediaUrls((current) => [...current, objectUrl])
        event.target.value = ''
        toast.success(`${file.name} added to post.`)
    }

    const handleBookmarkToggle = (postId: string) => {
        setBookmarkedPostIds((current) =>
            current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
        )
    }

    const handleShare = async (postId: string) => {
        const shareUrl = `${window.location.origin}/community?post=${postId}`
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'SuperFit Community Post',
                    text: 'Check out this post on SuperFit',
                    url: shareUrl,
                })
                toast.success('Post shared.')
                return
            }
            await navigator.clipboard.writeText(shareUrl)
            toast.success('Post link copied to clipboard.')
        } catch {
            toast.error('Unable to copy post link.')
        }
    }

    const handleMessageUser = async (targetUserId: string, targetName: string) => {
        if (!user?.id || !targetUserId || targetUserId === user.id) return

        if (!isSupabaseAuthEnabled()) {
            toast.info('Messaging in simulation mode is available in the Messages page.')
            router.push('/messages')
            return
        }

        try {
            const response = await requestApi<{ threadId: string }>('/api/v1/messages/direct-thread', {
                method: 'POST',
                body: JSON.stringify({ participantId: targetUserId }),
            })

            router.push(`/messages?thread=${encodeURIComponent(response.data.threadId)}`)
            return
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'status' in error && Number((error as { status?: unknown }).status) === 403) {
                try {
                    await requestApi<{ friendshipId: string; status: string }>('/api/v1/friends', {
                        method: 'POST',
                        body: JSON.stringify({ targetUserId }),
                    })
                    toast.success(`Friend request sent to ${targetName}. You can message once accepted.`)
                    return
                } catch {
                    toast.error('Unable to send friend request right now.')
                    return
                }
            }

            toast.error('Unable to open conversation right now.')
        }
    }

    const handleReplyPost = (postId: string) => {
        const replyText = (replyDraftByPost[postId] || '').trim()
        if (!replyText || !user) return

        addComment(postId, {
            authorId: user.id,
            authorName: user.name || 'Current User',
            authorHandle: `@${user.email?.split('@')[0] || 'user'}`,
            authorAvatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=reply_${user.id}`,
            content: replyText,
            timestamp: new Date().toISOString(),
        })

        setRepliesByPost((current) => ({
            ...current,
            [postId]: [
                ...(current[postId] || []),
                {
                    id: `reply_${Date.now()}`,
                    userName: user.name || 'Current User',
                    userHandle: `@${user.email?.split('@')[0] || 'user'}`,
                    userAvatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=reply_${user.id}`,
                    content: replyText,
                    createdAt: new Date().toISOString(),
                },
            ],
        }))

        toast.success('Reply posted.')
        setReplyDraftByPost((current) => ({ ...current, [postId]: '' }))
    }

    const handleEditStart = (post: CommunityPost) => {
        setEditingPostId(post.id)
        setNewPostContent(editedPostContent[post.id] || post.content)
        setShowComposer(true)
        setPostMenuOpenId(null)
    }

    const handleSavePostEdit = (postId: string) => {
        if (!newPostContent.trim()) return
        setEditedPostContent((current) => ({ ...current, [postId]: newPostContent.trim() }))
        setEditingPostId(null)
        setShowComposer(false)
        setNewPostContent('')
        toast.success('Post updated.')
    }

    const formatTimestamp = (iso: string) => {
        const date = new Date(iso)
        const now = new Date()
        const diffHrs = Math.abs(now.getTime() - date.getTime()) / 3600000
        if (diffHrs < 24) return `${Math.floor(diffHrs)}h`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getSafeAvatar = (src: string | null | undefined, seed: string) => {
        const normalized = (src || '').trim()
        if (normalized.length > 0) return normalized
        return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`
    }

    const renderPost = (post: CommunityPost) => {
        const isLiked = !!(user && post.isLiked)
        const isReposted = !!post.isReposted
        const isOwn = user && post.userId === user.id
        const isBookmarked = bookmarkedPostIds.includes(post.id)
        const postContent = editedPostContent[post.id] || post.content
        const isReported = reportedPostIds.includes(post.id)

        return (
            <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-(--bg-surface) border-b border-(--border-subtle) p-4 sm:p-5 hover:bg-[var(--bg-elevated)] transition-colors relative"
            >
                {/* Repost Header */}
                {post.repostedFrom && (
                    <div className="flex items-center gap-2 text-(--text-tertiary) font-body text-[13px] font-bold mb-2 ml-10">
                        <Repeat2 className="w-[14px] h-[14px]" />
                        <span>{user?.name === post.repostedFrom.userName ? 'You' : post.repostedFrom.userName} reposted</span>
                    </div>
                )}

                <div className="flex gap-3 sm:gap-4">
                    {/* Avatar Column */}
                    <div className="flex flex-col items-center shrink-0 w-[40px] sm:w-[48px]">
                        <img src={getSafeAvatar(post.userAvatar, `post-${post.userId}`)} alt="Avatar" className="w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-full object-cover border border-(--border-subtle)" />
                        {expandedPostId === post.id && <div className="w-[2px] h-full bg-(--border-subtle) mt-2" />}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                        {/* Header: Name, Handle, Time, Badge */}
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-display font-bold text-[15px] sm:text-[16px] text-(--text-primary) hover:underline cursor-pointer truncate max-w-[150px] sm:max-w-none">
                                    {post.userName}
                                </span>
                                {post.isVerified && <BadgeCheck className="w-[16px] h-[16px] text-blue-500 shrink-0" />}
                                {post.isCoach && <span className="bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded-[4px] shrink-0">Coach</span>}
                                <span className="font-body text-[14px] text-(--text-tertiary) truncate">
                                    {post.userHandle}
                                </span>
                                <span className="font-body text-[14px] text-(--text-tertiary)">·</span>
                                <span className="font-body text-[14px] text-(--text-tertiary)">{formatTimestamp(post.postedAt)}</span>
                            </div>
                            <div className="relative">
                                <button onClick={() => setPostMenuOpenId(postMenuOpenId === post.id ? null : post.id)} className="text-(--text-tertiary) hover:text-(--accent) transition-colors p-1 rounded-full hover:bg-[var(--bg-elevated)] shrink-0">
                                    <MoreHorizontal className="w-[16px] h-[16px]" />
                                </button>
                                <AnimatePresence>
                                    {postMenuOpenId === post.id && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[12px] shadow-lg w-[160px] py-1 z-50">
                                            {isOwn && <button onClick={() => handleEditStart(post)} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-(--text-primary)">Edit</button>}
                                            {isOwn && <button onClick={() => {deletePost(post.id); toast.success('Post deleted'); setPostMenuOpenId(null) }} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-red-500">Delete</button>}
                                            {!isOwn && (
                                                <>
                                                    <button onClick={() => { setHiddenPostIds((current) => current.includes(post.id) ? current : [...current, post.id]); setPostMenuOpenId(null); toast.success('Post hidden from your feed.') }} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-(--text-primary)">Hide</button>
                                                    <button onClick={() => { setMutedUserIds((current) => current.includes(post.userId) ? current : [...current, post.userId]); setPostMenuOpenId(null); toast.success(`Muted ${post.userName}.`) }} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-(--text-primary)">Mute</button>
                                                    <button onClick={() => { setBlockedUserIds((current) => current.includes(post.userId) ? current : [...current, post.userId]); setPostMenuOpenId(null); toast.success(`Blocked ${post.userName}.`) }} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-(--text-primary)">Block</button>
                                                    <button onClick={() => { setReportedPostIds((current) => current.includes(post.id) ? current : [...current, post.id]); setPostMenuOpenId(null); toast.success('Post reported.') }} className="w-full text-left px-4 py-2 hover:bg-(--bg-surface) text-[14px] text-red-500">{isReported ? 'Reported' : 'Report'}</button>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Text Content */}
                        <p className="font-body text-[15px] sm:text-[16px] text-(--text-primary) leading-relaxed whitespace-pre-wrap mb-3">
                            {postContent}
                        </p>

                        {/* Media Attachment */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="rounded-[16px] overflow-hidden mb-3 border border-(--border-subtle)">
                                <img src={post.mediaUrls[0]} alt="Post Media" className="w-full h-auto max-h-[400px] object-cover" />
                            </div>
                        )}

                        {/* Poll Attachment */}
                        {(() => {
                            const poll = post.poll
                            if (!poll) return null

                            return (
                                <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 mb-3">
                                    <h4 className="font-display font-bold text-[15px] text-(--text-primary) mb-3">{poll.question}</h4>
                                    <div className="space-y-2">
                                        {poll.options.map((opt: { id: string; text: string; votes: number }) => {
                                            const userVoted = pollVotes[post.id]
                                            const extraVotes = userVoted ? (opt.id === userVoted ? 1 : 0) : 0
                                            const actualTotal = poll.totalVotes + (userVoted ? 1 : 0)
                                            const actualVotes = opt.votes + extraVotes
                                            const pct = ((actualVotes / actualTotal) * 100).toFixed(0) || '0';
                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => {
                                                        if (!userVoted) {
                                                            setPollVotes(prev => ({ ...prev, [post.id]: opt.id }))
                                                        }
                                                    }}
                                                    className={cn("relative h-[36px] bg-(--bg-surface) border rounded-[8px] overflow-hidden flex items-center px-3 transition-colors", userVoted ? (userVoted === opt.id ? "border-emerald-500 font-bold" : "border-(--border-subtle)") : "border-(--border-subtle) cursor-pointer hover:border-emerald-500")}
                                                >
                                                    <div className={cn("absolute left-0 top-0 bottom-0", userVoted === opt.id ? "bg-emerald-500/30" : "bg-emerald-500/10")} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
                                                    <span className="relative z-10 font-body text-[14px] text-(--text-primary) flex-1">{opt.text} {userVoted === opt.id && <CheckCircle2 className="w-[14px] h-[14px] inline-block ml-1 text-emerald-500" />}</span>
                                                    <span className="relative z-10 font-body text-[14px] text-(--text-secondary) font-bold">{pct}%</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <span className="block mt-3 font-body text-[13px] text-(--text-tertiary)">{poll.totalVotes + (pollVotes[post.id] ? 1 : 0)} votes {pollVotes[post.id] && '· Final results'}</span>
                                </div>
                            )
                        })()}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between max-w-[425px] mt-1 text-(--text-tertiary)">
                            <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="flex items-center gap-1.5 font-body text-[13px] hover:text-blue-500 transition-colors group">
                                <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors"><MessageCircle className="w-[18px] h-[18px]" /></div>
                                <span>{post.comments || 0}</span>
                            </button>

                            <button
                                onClick={() => user && repostPost(post.id, user.id, user.name, `@${user.email.split('@')[0]}`)}
                                className={cn("flex items-center gap-1.5 font-body text-[13px] transition-colors group", isReposted ? "text-green-500" : "hover:text-green-500")}
                            >
                                <div className={cn("p-2 rounded-full transition-colors", isReposted ? "" : "group-hover:bg-green-500/10")}><Repeat2 className="w-[18px] h-[18px]" /></div>
                                <span>{post.reposts || 0}</span>
                            </button>

                            <button
                                onClick={() => { if (user) likePost(post.id, user.id) }}
                                className={cn("flex items-center gap-1.5 font-body text-[13px] transition-colors group", isLiked ? "text-pink-500" : "hover:text-pink-500")}
                            >
                                <div className={cn("p-2 rounded-full transition-colors", isLiked ? "" : "group-hover:bg-pink-500/10")}>
                                    <motion.div animate={isLiked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                                        <Heart className={cn("w-[18px] h-[18px]", isLiked ? "fill-current" : "")} />
                                    </motion.div>
                                </div>
                                <span>{post.likes || 0}</span>
                            </button>

                            <button className="flex items-center gap-1.5 font-body text-[13px] hover:text-emerald-500 transition-colors group">
                                <div className="p-2 rounded-full group-hover:bg-emerald-500/10 transition-colors"><BarChart2 className="w-[18px] h-[18px]" /></div>
                                <span>{(post.views || 0).toLocaleString()}</span>
                            </button>

                            <button onClick={() => handleBookmarkToggle(post.id)} className={cn("flex items-center gap-1.5 font-body text-[13px] transition-colors group cursor-pointer", isBookmarked ? 'text-emerald-500' : 'hover:text-emerald-500')}>
                                <div className={cn("p-2 rounded-full transition-colors", isBookmarked ? 'bg-emerald-500/10' : 'group-hover:bg-emerald-500/10')}><Bookmark className={cn("w-[18px] h-[18px]", isBookmarked ? 'fill-current' : '')} /></div>
                            </button>

                            <button onClick={() => { void handleShare(post.id) }} className="flex items-center gap-1.5 font-body text-[13px] hover:text-emerald-500 transition-colors group cursor-pointer">
                                <div className="p-2 rounded-full group-hover:bg-emerald-500/10 transition-colors"><Share2 className="w-[18px] h-[18px]" /></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expanded Thread View (Dummy implementation for UI parity) */}
                <AnimatePresence>
                    {expandedPostId === post.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pl-[52px] sm:pl-[64px] mt-2 overflow-hidden">
                            {(repliesByPost[post.id] || []).map((reply) => (
                                <div key={reply.id} className="flex gap-3 mb-4">
                                    <img src={getSafeAvatar(reply.userAvatar, reply.id)} className="w-[36px] h-[36px] rounded-full border border-(--border-subtle)" alt={`${reply.userName} avatar`} loading="lazy" />
                                    <div>
                                        <div className="flex gap-1 items-center">
                                            <span className="font-display font-bold text-[14px] text-(--text-primary)">{reply.userName}</span>
                                            <span className="font-body text-[13px] text-(--text-tertiary)">{reply.userHandle} · {formatTimestamp(reply.createdAt)}</span>
                                        </div>
                                        <p className="font-body text-[14px] text-(--text-primary) mt-0.5">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3 items-center">
                                <img src={getSafeAvatar(user?.avatar, 'you')} className="w-[36px] h-[36px] rounded-full border border-(--border-subtle)" alt="Your avatar" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Post your reply"
                                    value={replyDraftByPost[post.id] || ''}
                                    onChange={(e) => setReplyDraftByPost((current) => ({ ...current, [post.id]: e.target.value }))}
                                    className="flex-1 bg-transparent border-none text-[15px] font-body text-(--text-primary) placeholder:text-(--text-tertiary) focus:ring-0 outline-none"
                                />
                                <button 
                                    onClick={() => handleReplyPost(post.id)}
                                    className="px-4 py-1.5 bg-emerald-500 text-white font-bold text-[13px] rounded-full disabled:opacity-50 hover:bg-emerald-600 transition-colors cursor-pointer" 
                                    disabled={!(replyDraftByPost[post.id] || '').trim()}
                                >
                                    Reply
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        )
    }

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-6 lg:gap-8 pb-20 pt-2"
            >
                {/* Main Feed Column */}
                <div className="flex-1 flex flex-col max-w-[600px] w-full mx-auto md:mx-0 border-x border-(--border-subtle) bg-(--bg-surface) min-h-screen">

                    {/* Header Sticky */}
                    <div className="sticky top-0 z-30 bg-(--bg-surface)/80 backdrop-blur-md border-b border-(--border-subtle)">
                        <div className="flex justify-between items-center px-4 h-[56px]">
                            <div className="flex items-center gap-2">
                                <h1 className="font-display font-bold text-[20px] text-(--text-primary)">Home</h1>
                                {isSimulationMode && (
                                    <span className="inline-flex items-center rounded-[8px] bg-amber-500/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                        Simulation Mode
                                    </span>
                                )}
                            </div>
                            <div className="flex border border-(--border-default) rounded-full overflow-hidden bg-[var(--bg-elevated)] p-0.5">
                                <button onClick={() => setActiveTab('feed')} className={cn("px-4 py-1.5 rounded-full font-body text-[13px] font-bold transition-all", activeTab === 'feed' ? 'bg-(--text-primary) text-(--bg-base)' : 'text-(--text-secondary) hover:text-(--text-primary)')}>Feed</button>
                                <button onClick={() => setActiveTab('leaderboard')} className={cn("px-4 py-1.5 rounded-full font-body text-[13px] font-bold transition-all flex items-center gap-1.5", activeTab === 'leaderboard' ? 'bg-(--text-primary) text-(--bg-base)' : 'text-(--text-secondary) hover:text-(--text-primary)')}><Trophy className="w-[14px] h-[14px]" /> Ranks</button>
                            </div>
                        </div>

                        {activeTab === 'feed' && (
                            <div className="flex w-full">
                                <button onClick={() => setFeedTab('foryou')} className="flex-1 hover:bg-[var(--bg-elevated)] transition-colors h-[48px] relative flex justify-center items-center font-body text-[15px] font-bold text-(--text-primary)">
                                    <span className={cn("relative h-full flex items-center", feedTab === 'foryou' ? "text-(--text-primary)" : "text-(--text-secondary) font-medium")}>
                                        For you
                                        {feedTab === 'foryou' && <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-emerald-500 rounded-t-full" />}
                                    </span>
                                </button>
                                <button onClick={() => setFeedTab('following')} className="flex-1 hover:bg-[var(--bg-elevated)] transition-colors h-[48px] relative flex justify-center items-center font-body text-[15px] font-bold text-(--text-primary)">
                                    <span className={cn("relative h-full flex items-center", feedTab === 'following' ? "text-(--text-primary)" : "text-(--text-secondary) font-medium")}>
                                        Following
                                        {feedTab === 'following' && <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-emerald-500 rounded-t-full" />}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mx-4 mt-4 p-3 rounded-[12px] border border-red-500/30 bg-red-500/10 text-[13px] text-red-600 flex items-center justify-between gap-2">
                            <span className="truncate">{error}</span>
                            <button onClick={() => { void fetchPosts() }} className="shrink-0 px-3 py-1 rounded-[8px] border border-red-500/30 font-bold text-red-700">Retry</button>
                        </div>
                    )}

                    {activeTab === 'feed' ? (
                        <>
                            {/* Tweet Composer Box (Desktop) */}
                            <div className="hidden sm:flex border-b border-(--border-subtle) p-4 gap-4 bg-(--bg-surface)">
                                <img src={getSafeAvatar(user?.avatar, 'you')} className="w-[48px] h-[48px] rounded-full border border-(--border-subtle) object-cover" alt="Your avatar" />
                                <div className="flex-1 flex flex-col">
                                    {editingPostId && (
                                        <div className="mb-2 flex items-center justify-between gap-2 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-700">
                                            <span>Editing post</span>
                                            <button onClick={() => { setEditingPostId(null); setNewPostContent('') }} className="font-bold">Cancel</button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-(--border-subtle)">
                                        <button className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full font-body font-bold text-[12px] hover:bg-blue-500/20 transition-colors border border-blue-500/20 shadow-sm">
                                            <span>Everyone</span> <ChevronDown className="w-[12px] h-[12px]" />
                                        </button>
                                    </div>
                                    <textarea
                                        value={newPostContent}
                                        onChange={e => setNewPostContent(e.target.value)}
                                        placeholder="What's happening in your fitness journey?!"
                                        className="w-full bg-transparent border-none text-[20px] font-body text-(--text-primary) placeholder:text-(--text-tertiary) resize-none min-h-[60px] focus:ring-0 outline-none overflow-hidden"
                                    />

                                    {composerMediaUrls.length > 0 && (
                                        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                            {composerMediaUrls.map((mediaUrl, index) => (
                                                <div key={`${mediaUrl}-${index}`} className="relative w-[96px] h-[96px] rounded-[12px] overflow-hidden border border-(--border-subtle)">
                                                    <img src={mediaUrl} alt="Post media preview" className="w-full h-full object-cover" loading="lazy" />
                                                    <button onClick={() => setComposerMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-1 right-1 w-[20px] h-[20px] rounded-full bg-black/60 text-white flex items-center justify-center">
                                                        <X className="w-[12px] h-[12px]" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showPollComposer && (
                                        <div className="mt-3 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-3 space-y-2">
                                            <input
                                                value={pollQuestion}
                                                onChange={(event) => setPollQuestion(event.target.value)}
                                                placeholder="Poll question"
                                                className="w-full h-[40px] rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                            />
                                            {pollOptions.map((option, index) => (
                                                <input
                                                    key={index}
                                                    value={option}
                                                    onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="w-full h-[36px] rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                                />
                                            ))}
                                            <div className="flex items-center justify-between">
                                                <button onClick={() => setPollOptions((current) => current.length >= 4 ? current : [...current, ''])} className="text-[12px] font-bold text-emerald-600 hover:underline">Add option</button>
                                                <button onClick={() => { setShowPollComposer(false); setPollQuestion(''); setPollOptions(['', '']) }} className="text-[12px] font-bold text-(--text-secondary) hover:underline">Remove poll</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-(--border-subtle)">
                                        <div className="flex items-center gap-1 text-emerald-500">
                                            <button onClick={() => composerFileInputRef.current?.click()} className="p-2 hover:bg-emerald-500/10 rounded-full transition-colors cursor-pointer"><ImageIcon className="w-[20px] h-[20px]" /></button>
                                            <button onClick={() => setShowPollComposer((current) => !current)} className={cn("p-2 rounded-full transition-colors cursor-pointer", showPollComposer ? 'bg-emerald-500/10 text-emerald-600' : 'hover:bg-emerald-500/10')}><BarChart2 className="w-[20px] h-[20px]" /></button>
                                            <input ref={composerFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleComposerFileSelect} />
                                        </div>
                                        <button
                                            onClick={handlePost}
                                            disabled={!newPostContent.trim() || isPosting}
                                            className="bg-emerald-500 text-white font-bold text-[15px] px-6 py-2 rounded-full disabled:opacity-50 flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                                        >
                                            {isPosting ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null} {editingPostId ? 'Save' : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Floating Action Button */}
                            <div className="sm:hidden fixed bottom-20 right-4 z-40">
                                <button onClick={() => setShowComposer(true)} className="w-[56px] h-[56px] rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                                    <Plus className="w-[24px] h-[24px]" />
                                </button>
                            </div>

                            {/* Feed List */}
                            <div className="flex flex-col">
                                {isLoading ? (
                                    <div className="py-20 text-center flex flex-col items-center">
                                        <Loader2 className="w-[32px] h-[32px] animate-spin text-emerald-500" />
                                        <p className="mt-3 font-body text-(--text-secondary)">Loading community feed...</p>
                                    </div>
                                ) : displayPosts.length > 0 ? displayPosts.map(post => renderPost(post)) : (
                                    <div className="py-20 text-center flex flex-col items-center">
                                        <div className="w-[80px] h-[80px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                                            <Users className="w-[40px] h-[40px] text-(--text-tertiary)" />
                                        </div>
                                        <h3 className="font-display font-bold text-[24px] text-(--text-primary)">{feedTab === 'following' ? 'No posts from people you follow' : 'No posts yet'}</h3>
                                        <p className="font-body text-(--text-secondary) max-w-[320px] mt-2">{feedTab === 'following' ? 'Follow more athletes or switch to For you.' : 'Publish your first post to start the conversation.'}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Leaderboards UI */
                        <div className="flex flex-col">
                            <div className="p-6 border-b border-(--border-subtle) flex flex-col gap-2">
                                <h2 className="font-display font-black text-[24px] text-(--text-primary)">Weekly Leaderboard</h2>
                                <p className="font-body text-[14px] text-(--text-secondary)">Compete with athletes globally. Points are awarded for PRs, completed routines, and consistency streaks.</p>
                            </div>

                            {leaderboard.map((u) => (
                                <div key={u.rank} className={cn("flex items-center px-6 py-4 border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors", u.isYou && "bg-emerald-500/5")}>
                                    <div className="w-[40px] font-display font-black text-[18px] text-(--text-tertiary) text-center">
                                        {u.rank}
                                    </div>
                                    <div className="flex-1 flex items-center gap-3 px-4">
                                        <img src={getSafeAvatar(u.avatar, `leader-${u.rank}`)} className="w-[44px] h-[44px] rounded-full border border-(--border-subtle)" alt={u.name} loading="lazy" />
                                        <div className="flex flex-col">
                                            <span className="font-display font-bold text-[16px] text-(--text-primary) flex items-center gap-1">
                                                {u.name} {u.rank <= 3 && <BadgeCheck className="w-[14px] h-[14px] text-blue-500" />}
                                            </span>
                                            <span className="font-body text-[13px] text-(--text-secondary)">{u.handle}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-display font-black text-[18px] text-(--text-primary)">{u.score.toLocaleString()}</span>
                                        {u.trend === 'up' && <Flame className="w-[16px] h-[16px] text-emerald-500" />}
                                        {u.trend === 'down' && <Flame className="w-[16px] h-[16px] text-red-500 rotate-180" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column (Trending / Suggestions) */}
                <div className="hidden lg:flex flex-col w-[350px] gap-6 shrink-0 py-2">
                    {/* Search Component */}
                    <div className="sticky top-2 z-10 bg-(--bg-base) pt-2 pb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-(--text-tertiary)" />
                            <input
                                type="text"
                                placeholder="Search SuperFit"
                                className="w-full h-[48px] pl-12 pr-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-full font-body text-[15px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-(--text-primary) transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] p-5 flex flex-col gap-4">
                        <h3 className="font-display font-black text-[20px] text-(--text-primary)">Trending Workouts</h3>
                        {[
                            { tag: '#HypertrophyMonth', posts: '14.2K' },
                            { tag: 'EMOM Challenges', posts: '8.4K' },
                            { tag: 'Marathon Prep', posts: '5.1K' }
                        ].map((trend, i) => (
                            <div key={i} className="flex flex-col hover:bg-[var(--bg-elevated)] -mx-5 px-5 py-2 cursor-pointer transition-colors">
                                <span className="font-body text-[13px] text-(--text-tertiary)">Trending in Fitness</span>
                                <span className="font-body font-bold text-[15px] text-(--text-primary)">{trend.tag}</span>
                                <span className="font-body text-[13px] text-(--text-secondary)">{trend.posts} posts</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] p-5 flex flex-col gap-4">
                        <h3 className="font-display font-black text-[20px] text-(--text-primary)">Who to follow</h3>
                        {(suggestions.length ? suggestions : [
                            { id: 'coach_1', name: 'Coach Marcus', handle: '@marcus_strength', verified: true, avatar: '' },
                            { id: 'user_2', name: 'Sarah Jenkins', handle: '@sarahj_lifts', verified: true, avatar: '' },
                            { id: 'user_3', name: 'Mike Chen', handle: '@mike_runs', verified: false, avatar: '' },
                        ]).map((u, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)] -mx-5 px-5 py-2 cursor-pointer transition-colors">
                                <img src={getSafeAvatar(u.avatar, u.handle)} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" alt={u.name} loading="lazy" />
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="font-body font-bold text-[15px] text-(--text-primary) truncate flex items-center gap-1">
                                        {u.name} {u.verified && <BadgeCheck className="w-[14px] h-[14px] text-blue-500 shrink-0" />}
                                    </span>
                                    <span className="font-body text-[14px] text-(--text-tertiary) truncate">{u.handle}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (followingIds.includes(u.id)) {
                                            setFollowingIds(prev => prev.filter(id => id !== u.id))
                                        } else {
                                            setFollowingIds(prev => [...prev, u.id])
                                            toast.success(`Following ${u.name}`)
                                        }
                                    }} 
                                    className={cn("px-4 py-1.5 rounded-full font-bold text-[14px] transition-opacity cursor-pointer border", followingIds.includes(u.id) ? "bg-transparent text-(--text-primary) border-(--border-subtle) hover:border-red-500 hover:text-red-500" : "bg-(--text-primary) text-(--bg-base) border-transparent hover:opacity-90")}
                                >
                                    {followingIds.includes(u.id) ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={() => {
                                        void handleMessageUser(u.id, u.name)
                                    }}
                                    className="px-3 py-1.5 rounded-full font-bold text-[13px] border border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                    Message
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </motion.div>

            {/* Mobile Full Screen Composer */}
            <AnimatePresence>
                {showComposer && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-[100] bg-(--bg-surface) sm:hidden flex flex-col"
                    >
                        <div className="flex justify-between items-center px-4 h-[56px] border-b border-(--border-subtle)">
                            <button onClick={() => { setShowComposer(false); setEditingPostId(null); setNewPostContent(''); setComposerMediaUrls([]); setShowPollComposer(false); setPollQuestion(''); setPollOptions(['', '']) }} className="text-(--text-primary)"><X className="w-[24px] h-[24px]" /></button>
                            <button
                                onClick={handlePost}
                                disabled={!newPostContent.trim() || isPosting}
                                className="bg-emerald-500 text-white font-bold text-[14px] px-5 py-1.5 rounded-full disabled:opacity-50"
                            >
                                {isPosting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : editingPostId ? 'Save' : 'Post'}
                            </button>
                        </div>
                        <div className="flex-1 p-4 flex gap-3">
                            <img src={getSafeAvatar(user?.avatar, 'you')} className="w-[40px] h-[40px] rounded-full" alt="Your avatar" />
                            <div className="flex-1 flex flex-col gap-3">
                                <textarea
                                    autoFocus
                                    value={newPostContent}
                                    onChange={e => setNewPostContent(e.target.value)}
                                    placeholder="What's happening?"
                                    className="flex-1 bg-transparent border-none text-[18px] font-body text-(--text-primary) placeholder:text-(--text-tertiary) resize-none outline-none mt-2"
                                />

                                {composerMediaUrls.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {composerMediaUrls.map((mediaUrl, index) => (
                                            <div key={`${mediaUrl}-${index}`} className="relative w-[84px] h-[84px] rounded-[12px] overflow-hidden border border-(--border-subtle)">
                                                <img src={mediaUrl} alt="Post media preview" className="w-full h-full object-cover" loading="lazy" />
                                                <button onClick={() => setComposerMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/60 text-white flex items-center justify-center">
                                                    <X className="w-[10px] h-[10px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pb-2">
                                    <button onClick={() => composerFileInputRef.current?.click()} className="p-2 rounded-full text-emerald-500 hover:bg-emerald-500/10">
                                        <ImageIcon className="w-[20px] h-[20px]" />
                                    </button>
                                    <button onClick={() => setShowPollComposer((current) => !current)} className={cn("p-2 rounded-full", showPollComposer ? 'bg-emerald-500/10 text-emerald-600' : 'text-emerald-500 hover:bg-emerald-500/10')}>
                                        <BarChart2 className="w-[20px] h-[20px]" />
                                    </button>
                                    <input ref={composerFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleComposerFileSelect} />
                                </div>

                                {showPollComposer && (
                                    <div className="rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] p-3 space-y-2">
                                        <input
                                            value={pollQuestion}
                                            onChange={(event) => setPollQuestion(event.target.value)}
                                            placeholder="Poll question"
                                            className="w-full h-[38px] rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                        />
                                        {pollOptions.map((option, index) => (
                                            <input
                                                key={index}
                                                value={option}
                                                onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                                                placeholder={`Option ${index + 1}`}
                                                className="w-full h-[34px] rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </React.Fragment>
    )
}
