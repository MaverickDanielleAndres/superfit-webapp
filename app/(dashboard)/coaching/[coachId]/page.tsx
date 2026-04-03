'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MapPin, CheckCircle2, MessageCircle, Activity, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { requestApi } from '@/lib/api/client'
import { useAuthStore } from '@/store/useAuthStore'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CoachOverviewResponse {
    coach: {
        id: string
        name: string
        avatar: string
        bio: string
        specialties: string[]
    }
    rating: {
        average: number
        count: number
    }
    publications: Array<{
        id: string
        type: string
        title: string
        excerpt: string
        createdAt: string
        likes: number
        tags: string[]
        subscribersOnly: boolean
    }>
    reviews: Array<{
        id: string
        rating: number
        title: string
        comment: string
        createdAt: string
        reviewer: {
            id: string
            name: string
            avatar: string
        }
        reply: {
            id: string
            body: string
            createdAt: string
        } | null
        canReply: boolean
        canEdit: boolean
    }>
    viewerCanReview: boolean
}

const PLAN_TIERS = [
    { name: 'Basic Tier', price: 49, features: ['1 Custom Program', 'Monthly Check-in', 'App Access'] },
    { name: 'Premium Tier', price: 99, features: ['Weekly Check-ins', 'Macro Adjustments', 'Form Reviews', 'Priority Chat'] },
    { name: 'Elite Tier', price: 199, features: ['Daily Chat Support', '1-on-1 Zoom Calls', 'Vip Meetups', 'Custom Nutrition'] },
]

function getFallbackOverview(coachId: string): CoachOverviewResponse {
    return {
        coach: {
            id: coachId,
            name: 'Coach Profile',
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${coachId}`,
            bio: 'Personalized training, accountability, and expert programming to help you progress faster.',
            specialties: ['Strength', 'Hypertrophy', 'Nutrition'],
        },
        rating: {
            average: 0,
            count: 0,
        },
        publications: [],
        reviews: [],
        viewerCanReview: true,
    }
}

function formatDate(isoDate: string): string {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return 'Just now'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CoachProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuthStore()

    const coachIdParam = Array.isArray(params.coachId) ? params.coachId[0] : params.coachId
    const coachId = coachIdParam && UUID_REGEX.test(coachIdParam) ? coachIdParam : null

    const [activeTab, setActiveTab] = useState<'programs' | 'posts' | 'reviews'>('programs')
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [overview, setOverview] = useState<CoachOverviewResponse | null>(null)
    const [isLoadingOverview, setIsLoadingOverview] = useState(true)
    const [overviewError, setOverviewError] = useState<string | null>(null)

    const [reviewRating, setReviewRating] = useState(5)
    const [reviewTitle, setReviewTitle] = useState('')
    const [reviewComment, setReviewComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    const [replyDraftByReview, setReplyDraftByReview] = useState<Record<string, string>>({})
    const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null)

    const tabs: Array<'programs' | 'posts' | 'reviews'> = ['programs', 'posts', 'reviews']

    const loadOverview = useCallback(async () => {
        if (!coachId) {
            setOverviewError('Invalid coach identifier.')
            setIsLoadingOverview(false)
            return
        }

        if (!isSupabaseAuthEnabled()) {
            setOverview(getFallbackOverview(coachId))
            setOverviewError(null)
            setIsLoadingOverview(false)
            return
        }

        setIsLoadingOverview(true)
        setOverviewError(null)

        try {
            const response = await requestApi<CoachOverviewResponse>(`/api/v1/coaching/${coachId}/overview`)
            setOverview(response.data)
        } catch (error) {
            setOverviewError(getErrorMessage(error))
        } finally {
            setIsLoadingOverview(false)
        }
    }, [coachId])

    useEffect(() => {
        void loadOverview()
    }, [loadOverview])

    const coach = useMemo(() => overview?.coach ?? (coachId ? getFallbackOverview(coachId).coach : null), [coachId, overview])

    const handleSubscribe = async (planName = 'Premium Tier', amountCents = 9900) => {
        if (!coachId) {
            toast.error('Invalid coach profile.')
            return
        }

        const idempotencyKey = `checkout_${Date.now()}_${crypto.randomUUID()}`

        setIsSubscribing(true)
        try {
            let response: Response | null = null
            for (let attempt = 1; attempt <= 2; attempt += 1) {
                response = await fetch('/api/v1/simulated-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Idempotency-Key': idempotencyKey,
                    },
                    body: JSON.stringify({
                        coachId,
                        planName,
                        amountCents,
                        currency: 'usd',
                    }),
                })

                if (response.ok || response.status < 500 || attempt === 2) {
                    break
                }

                await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
            }

            if (!response) {
                toast.error('Unable to process subscription right now.')
                return
            }

            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                toast.error(payload?.detail || 'Unable to process subscription right now.')
                if (response.status === 401) {
                    router.push('/auth')
                }
                return
            }

            toast.success(`Subscription active: ${planName}`)
            await loadOverview()
        } catch {
            toast.error('Unable to process subscription right now.')
        } finally {
            setIsSubscribing(false)
        }
    }

    const handleMessageCoach = async () => {
        if (!coachId) return

        if (!isSupabaseAuthEnabled()) {
            router.push('/messages')
            return
        }

        try {
            const response = await requestApi<{ threadId: string }>('/api/v1/messages/direct-thread', {
                method: 'POST',
                body: JSON.stringify({ participantId: coachId }),
            })
            router.push(`/messages?thread=${encodeURIComponent(response.data.threadId)}`)
        } catch (error: unknown) {
            const status = typeof error === 'object' && error !== null && 'status' in error
                ? Number((error as { status?: unknown }).status)
                : 0

            if (status === 403) {
                toast.info('Subscribe first, or connect as coach-client before messaging.')
                return
            }

            toast.error('Unable to open chat right now.')
        }
    }

    const handleSubmitReview = async () => {
        if (!coachId) return
        if (!reviewComment.trim()) {
            toast.error('Please write a review comment.')
            return
        }

        setIsSubmittingReview(true)
        try {
            await requestApi<{ review: { id: string } }>(`/api/v1/coaching/${coachId}/reviews`, {
                method: 'POST',
                body: JSON.stringify({
                    rating: reviewRating,
                    title: reviewTitle,
                    comment: reviewComment,
                    isPublic: true,
                }),
            })
            toast.success('Review saved.')
            setReviewTitle('')
            setReviewComment('')
            await loadOverview()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSubmittingReview(false)
        }
    }

    const handleReply = async (reviewId: string) => {
        const body = (replyDraftByReview[reviewId] || '').trim()
        if (!body) return

        setIsReplyingTo(reviewId)
        try {
            await requestApi<{ reply: { id: string } }>(`/api/v1/coaching/reviews/${reviewId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ body }),
            })
            toast.success('Reply posted.')
            setReplyDraftByReview((current) => ({ ...current, [reviewId]: '' }))
            await loadOverview()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsReplyingTo(null)
        }
    }

    if (!coachId) {
        return (
            <div className="w-full max-w-5xl mx-auto py-20 text-center">
                <p className="font-display font-bold text-[24px] text-(--text-primary)">Invalid coach profile</p>
                <p className="mt-2 text-(--text-secondary)">The selected coach page cannot be opened.</p>
            </div>
        )
    }

    if (isLoadingOverview && !overview) {
        return (
            <div className="w-full max-w-5xl mx-auto py-20 flex items-center justify-center gap-3 text-(--text-secondary)">
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span className="font-body text-[14px]">Loading coach profile...</span>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto h-full pb-20 pt-2"
        >
            <Link href="/coaching" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-4 transition-colors">
                <ArrowLeft className="w-[16px] h-[16px]" /> Back to Coaches
            </Link>

            {overviewError && (
                <div className="mb-4 p-3 rounded-[12px] border border-red-500/30 bg-red-500/10 text-red-600 text-[13px]">
                    {overviewError}
                </div>
            )}

            {coach && (
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm mb-6 relative">
                    <div className="h-[200px] w-full bg-[#1c1c1c] relative overflow-hidden">
                        <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover opacity-30 blur-[1px]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>

                    <div className="px-6 sm:px-10 pb-8 relative pt-20">
                        <div className="absolute -top-[60px] left-6 sm:left-10 p-2 bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) shadow-md">
                            <img src={coach.avatar} alt={coach.name} className="w-[100px] h-[100px] rounded-[16px] object-cover" />
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="font-display font-black text-[32px] text-(--text-primary) leading-none">{coach.name}</h1>
                                    <span className="bg-blue-500/10 text-blue-500 font-bold text-[11px] px-2 py-1 rounded-[6px] flex items-center gap-1 uppercase tracking-wider">
                                        <CheckCircle2 className="w-[12px] h-[12px]" /> Verified
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 font-body text-[14px] text-(--text-secondary) font-medium mb-4">
                                    <span className="flex items-center gap-1.5"><Star className="w-[16px] h-[16px] fill-[var(--status-warning)] text-[var(--status-warning)]" /> {overview?.rating.average.toFixed(1) || '0.0'} ({overview?.rating.count || 0} reviews)</span>
                                    <span className="flex items-center gap-1.5"><MapPin className="w-[16px] h-[16px]" /> Online Coaching</span>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {coach.specialties.map((spec) => (
                                        <span key={spec} className="bg-[var(--bg-elevated)] border border-(--border-default) px-3 py-1 rounded-full font-body text-[12px] font-bold text-(--text-primary)">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[220px]">
                                <button
                                    onClick={() => { void handleSubscribe() }}
                                    disabled={isSubscribing}
                                    className="h-[48px] px-8 rounded-[14px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-display font-bold text-[16px] transition-all shadow-md flex items-center justify-center gap-2 w-full cursor-pointer"
                                >
                                    {isSubscribing ? 'Processing...' : 'Subscribe Now'}
                                </button>
                                <button
                                    onClick={() => { void handleMessageCoach() }}
                                    className="h-[48px] px-8 rounded-[14px] border border-(--border-subtle) bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-alt)] text-(--text-primary) font-display font-bold text-[16px] transition-all flex items-center justify-center gap-2 w-full cursor-pointer"
                                >
                                    <MessageCircle className="w-[16px] h-[16px]" /> Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex border-b border-(--border-subtle) gap-6 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn('pb-3 font-display font-black text-[16px] transition-colors relative whitespace-nowrap capitalize', activeTab === tab ? 'text-(--text-primary)' : 'text-(--text-tertiary) hover:text-(--text-secondary)')}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'programs' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PLAN_TIERS.map((plan) => (
                                <div key={plan.name} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col cursor-pointer hover:border-emerald-500 transition-colors group">
                                    <h3 className="font-display font-black text-[20px] text-(--text-primary) mb-1">{plan.name}</h3>
                                    <div className="font-display font-black text-[32px] text-(--text-primary) mb-6">${plan.price}<span className="text-[14px] font-body text-(--text-secondary) font-medium">/mo</span></div>
                                    <ul className="flex flex-col gap-3 mb-6 flex-1">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2 font-body text-[14px] font-medium text-(--text-secondary)">
                                                <CheckCircle2 className="w-[16px] h-[16px] text-emerald-500 shrink-0" /> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => { void handleSubscribe(plan.name, plan.price * 100) }}
                                        disabled={isSubscribing}
                                        className="w-full h-[44px] rounded-[12px] bg-[var(--bg-elevated)] group-hover:bg-emerald-500 group-hover:text-white border border-(--border-default) group-hover:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-[14px] transition-colors cursor-pointer"
                                    >
                                        Select Plan
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="flex flex-col gap-4">
                            {(overview?.publications || []).length === 0 && (
                                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center py-20">
                                    <Activity className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">No Public Posts Yet</h3>
                                    <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px] text-center">This coach has not published content yet.</p>
                                </div>
                            )}

                            {(overview?.publications || []).map((post) => (
                                <div key={post.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="font-display font-bold text-[18px] text-(--text-primary)">{post.title}</h3>
                                        <span className="text-[12px] text-(--text-tertiary)">{formatDate(post.createdAt)}</span>
                                    </div>
                                    <p className="font-body text-[14px] text-(--text-secondary)">{post.excerpt}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {post.tags.map((tag) => (
                                            <span key={`${post.id}-${tag}`} className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold">
                                                {tag}
                                            </span>
                                        ))}
                                        {post.subscribersOnly && (
                                            <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[11px] font-bold">
                                                Subscribers
                                            </span>
                                        )}
                                        <span className="ml-auto text-[12px] text-(--text-tertiary)">{post.likes} likes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                                <h3 className="font-display font-black text-[20px] text-(--text-primary)">{overview?.rating.average.toFixed(1) || '0.0'} Average Rating</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">{overview?.rating.count || 0} verified client reviews</p>
                            </div>

                            {overview?.viewerCanReview && user && user.id !== coachId && (
                                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                                    <h4 className="font-display font-bold text-[16px] text-(--text-primary) mb-3">Leave a Review</h4>
                                    <div className="flex items-center gap-2 mb-3">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setReviewRating(value)}
                                                className="p-1"
                                            >
                                                <Star className={cn('w-[20px] h-[20px]', value <= reviewRating ? 'fill-[var(--status-warning)] text-[var(--status-warning)]' : 'text-(--text-tertiary)')} />
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        value={reviewTitle}
                                        onChange={(event) => setReviewTitle(event.target.value)}
                                        placeholder="Review title (optional)"
                                        className="w-full h-[42px] px-3 rounded-[10px] border border-(--border-default) bg-[var(--bg-elevated)] text-[14px] mb-3 outline-none"
                                    />
                                    <textarea
                                        value={reviewComment}
                                        onChange={(event) => setReviewComment(event.target.value)}
                                        placeholder="Share your experience with this coach"
                                        rows={4}
                                        className="w-full p-3 rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] text-[14px] mb-3 outline-none resize-none"
                                    />
                                    <button
                                        onClick={() => { void handleSubmitReview() }}
                                        disabled={isSubmittingReview}
                                        className="h-[40px] px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-[13px]"
                                    >
                                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            )}

                            {(overview?.reviews || []).map((review) => (
                                <div key={review.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <img src={review.reviewer.avatar} alt={review.reviewer.name} className="w-[38px] h-[38px] rounded-full object-cover border border-(--border-subtle)" />
                                            <div>
                                                <p className="font-display font-bold text-[14px] text-(--text-primary)">{review.reviewer.name}</p>
                                                <p className="text-[12px] text-(--text-tertiary)">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <Star key={value} className={cn('w-[14px] h-[14px]', value <= review.rating ? 'fill-[var(--status-warning)] text-[var(--status-warning)]' : 'text-(--text-tertiary)')} />
                                            ))}
                                        </div>
                                    </div>
                                    {review.title && <p className="font-display font-bold text-[15px] text-(--text-primary) mb-1">{review.title}</p>}
                                    <p className="font-body text-[14px] text-(--text-secondary)">{review.comment}</p>

                                    {review.reply && (
                                        <div className="mt-3 p-3 rounded-[12px] border border-emerald-500/30 bg-emerald-500/5">
                                            <p className="text-[12px] font-bold text-emerald-600 mb-1">Coach reply</p>
                                            <p className="text-[13px] text-(--text-secondary)">{review.reply.body}</p>
                                        </div>
                                    )}

                                    {review.canReply && !review.reply && (
                                        <div className="mt-3">
                                            <textarea
                                                value={replyDraftByReview[review.id] || ''}
                                                onChange={(event) => setReplyDraftByReview((current) => ({ ...current, [review.id]: event.target.value }))}
                                                placeholder="Reply to this review"
                                                rows={3}
                                                className="w-full p-3 rounded-[10px] border border-(--border-default) bg-[var(--bg-elevated)] text-[13px] outline-none resize-none"
                                            />
                                            <button
                                                onClick={() => { void handleReply(review.id) }}
                                                disabled={isReplyingTo === review.id}
                                                className="mt-2 h-[36px] px-4 rounded-[10px] bg-(--text-primary) text-(--bg-base) disabled:opacity-60 text-[12px] font-bold"
                                            >
                                                {isReplyingTo === review.id ? 'Replying...' : 'Post Reply'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-3">About Coach</h3>
                        <p className="font-body text-[14px] text-(--text-secondary) leading-relaxed">
                            {coach?.bio}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}
