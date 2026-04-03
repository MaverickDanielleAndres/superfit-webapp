'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Users, Filter, CheckCircle2, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'
import { requestApi } from '@/lib/api/client'

type AudienceKey = 'all_active' | 'onboarding' | 'weight_loss' | 'muscle_gain'

interface BroadcastRecipient {
    id: string
    name: string
    goal: string | null
    onboardingComplete: boolean
}

interface BroadcastHistoryItem {
    id: string
    target: string
    snippet: string
    sentAt: string
    delivered: number
    read: number
}

const FALLBACK_RECIPIENTS: BroadcastRecipient[] = [
    { id: 'fallback-1', name: 'Jake Mitchell', goal: 'muscle_gain', onboardingComplete: true },
    { id: 'fallback-2', name: 'Samantha Lee', goal: 'weight_loss', onboardingComplete: true },
    { id: 'fallback-3', name: 'Chris Evans', goal: null, onboardingComplete: false },
    { id: 'fallback-4', name: 'Emma Wilson', goal: 'maintenance', onboardingComplete: true },
]

export default function BroadcastPage() {
    const [message, setMessage] = useState('')
    const [target, setTarget] = useState<AudienceKey>('all_active')
    const [recipients, setRecipients] = useState<BroadcastRecipient[]>(FALLBACK_RECIPIENTS)
    const [isSending, setIsSending] = useState(false)
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)
    const { broadcasts, fetchBroadcasts, logBroadcast } = useCoachPortalStore()

    useEffect(() => {
        void fetchBroadcasts()
    }, [fetchBroadcasts])

    useEffect(() => {
        let isMounted = true

        const loadRecipients = async () => {
            if (!isSupabaseAuthEnabled()) return

            try {
                const response = await requestApi<{ recipients: BroadcastRecipient[] }>('/api/v1/coach/broadcast')
                if (!isMounted) return

                const mapped = response.data.recipients

                if (mapped.length) {
                    setRecipients(mapped)
                }
            } catch {
                // Keep fallback recipients when backend lookup fails.
            }
        }

        void loadRecipients()

        return () => {
            isMounted = false
        }
    }, [])

    const audienceOptions = useMemo(() => {
        const allActive = recipients.filter((recipient) => recipient.onboardingComplete)
        const onboarding = recipients.filter((recipient) => !recipient.onboardingComplete)
        const weightLoss = recipients.filter((recipient) => recipient.goal === 'weight_loss')
        const muscleGain = recipients.filter((recipient) => recipient.goal === 'muscle_gain')

        return [
            { key: 'all_active' as const, label: 'All Active Clients', recipients: allActive },
            { key: 'onboarding' as const, label: 'Onboarding Clients', recipients: onboarding },
            { key: 'weight_loss' as const, label: 'Weight Loss Goal', recipients: weightLoss },
            { key: 'muscle_gain' as const, label: 'Muscle Gain Goal', recipients: muscleGain },
        ]
    }, [recipients])

    const selectedAudience = audienceOptions.find((option) => option.key === target) ?? audienceOptions[0]
    const visibleBroadcasts = useMemo(
        () => showUnreadOnly
            ? broadcasts.filter((item) => item.read < item.delivered)
            : broadcasts,
        [broadcasts, showUnreadOnly],
    )

    const handleSendBroadcast = async () => {
        const trimmed = message.trim()
        if (!trimmed) return

        const recipientIds = selectedAudience?.recipients.map((recipient) => recipient.id) || []
        if (!recipientIds.length) {
            toast.error('No recipients found for this segment yet.')
            return
        }

        const loadingToast = toast.loading('Sending broadcast...')
        setIsSending(true)

        try {
            let deliveredCount = recipientIds.length
            if (isSupabaseAuthEnabled()) {
                const response = await requestApi<{ delivered: number; read: number; target: string }>('/api/v1/coach/broadcast', {
                    method: 'POST',
                    body: JSON.stringify({
                        target,
                        message: trimmed,
                    }),
                })
                deliveredCount = response.data.delivered
                await fetchBroadcasts()
            } else {
                await logBroadcast({
                    target: selectedAudience.label,
                    message: trimmed,
                    delivered: deliveredCount,
                    read: 0,
                })
            }

            setMessage('')
            toast.success(`Broadcast sent to ${deliveredCount} clients.`, { id: loadingToast })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to send broadcast right now.'
            toast.error(message, { id: loadingToast })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-5xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Broadcast Center</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Send mass messages to specific client segments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Composer */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-fit">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4 flex items-center gap-2"><Send className="w-[18px] h-[18px] text-emerald-500" /> New Broadcast</h3>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Target Audience</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                <select 
                                    value={target}
                                    onChange={e => setTarget(e.target.value as AudienceKey)}
                                    className="w-full h-[44px] pl-10 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] text-(--text-primary) outline-none appearance-none cursor-pointer"
                                >
                                    {audienceOptions.map((option) => (
                                        <option key={option.key} value={option.key}>
                                            {option.label} ({option.recipients.length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Message</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Type your broadcast message here..."
                                className="w-full min-h-[200px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[14px] text-(--text-primary) outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="font-body text-[12px] text-(--text-tertiary)">{message.length}/1000 characters</span>
                            <button 
                                onClick={handleSendBroadcast}
                                className={cn("h-[44px] px-8 rounded-[12px] font-bold text-[14px] transition-all shadow-sm flex items-center gap-2", 
                                message.length > 0 && !isSending ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer" : "bg-(--border-subtle) text-(--text-tertiary) cursor-not-allowed")}
                                disabled={message.length === 0 || isSending}
                            >
                                {isSending ? 'Sending...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-6 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><History className="w-[18px] h-[18px] text-(--text-secondary)" /> History</h3>
                        <button
                            onClick={() => setShowUnreadOnly((value) => !value)}
                            className={cn(
                                'text-(--text-secondary) hover:text-(--text-primary) text-[12px] font-bold flex items-center gap-1.5',
                                showUnreadOnly ? 'text-emerald-500' : '',
                            )}
                        >
                            <Filter className="w-[16px] h-[16px]" /> {showUnreadOnly ? 'Unread only' : 'All'}
                        </button>
                    </div>
                    
                    <div className="flex flex-col divide-y divide-(--border-subtle)">
                        {visibleBroadcasts.map((item: BroadcastHistoryItem) => (
                            <div key={item.id} className="p-5 hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-body text-[12px] font-bold bg-(--bg-surface) border border-(--border-subtle) px-2 py-0.5 rounded-[6px] text-(--text-secondary)">{item.target}</span>
                                    <span className="font-body text-[11px] text-(--text-tertiary)">{item.sentAt}</span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-primary) line-clamp-2 mb-3">&quot;{item.snippet}&quot;</p>
                                <div className="flex items-center gap-4 text-[12px] font-body text-(--text-secondary)">
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-[var(--text-tertiary)]" /> Delivered to {item.delivered}</div>
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-emerald-500" /> Read by {item.read}</div>
                                </div>
                            </div>
                        ))}
                        {!visibleBroadcasts.length && (
                            <div className="p-5 text-[13px] text-(--text-secondary)">No broadcast history for this filter.</div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
