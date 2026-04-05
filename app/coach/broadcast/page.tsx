'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Users, Filter, CheckCircle2, History, UploadCloud, Image as ImageIcon, X, Clock3, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
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
    status?: 'scheduled' | 'sent' | 'cancelled' | 'failed'
    scheduleId?: string | null
    scheduledFor?: string | null
}

export default function BroadcastPage() {
    const [message, setMessage] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [scheduleAt, setScheduleAt] = useState('')
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)
    const [target, setTarget] = useState<AudienceKey>('all_active')
    const [recipients, setRecipients] = useState<BroadcastRecipient[]>([])
    const [isSending, setIsSending] = useState(false)
    const [isDispatching, setIsDispatching] = useState(false)
    const [activeScheduleActionId, setActiveScheduleActionId] = useState<string | null>(null)
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)
    const { broadcasts, fetchBroadcasts } = useCoachPortalData()
    const mediaInputRef = React.useRef<HTMLInputElement>(null)

    useEffect(() => {
        void fetchBroadcasts()
    }, [fetchBroadcasts])

    useEffect(() => {
        let isMounted = true

        const loadRecipients = async () => {
            try {
                const response = await requestApi<{ recipients: BroadcastRecipient[] }>('/api/v1/coach/broadcast')
                if (!isMounted) return

                const mapped = response.data.recipients

                if (mapped.length) {
                    setRecipients(mapped)
                }
            } catch {
                // Keep the current list if recipient lookup fails.
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

    const hasFutureSchedule = Boolean(scheduleAt && new Date(scheduleAt).getTime() > Date.now())

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
            const response = await requestApi<{ delivered?: number; read?: number; target: string; scheduled?: boolean; scheduleId?: string }>('/api/v1/coach/broadcast', {
                method: 'POST',
                body: JSON.stringify({
                    target,
                    message: trimmed,
                    mediaUrl: mediaUrl || null,
                    scheduleAt: hasFutureSchedule ? new Date(scheduleAt).toISOString() : null,
                }),
            })
            await fetchBroadcasts()

            setMessage('')
            setMediaUrl('')
            setScheduleAt('')
            if (response.data.scheduled) {
                toast.success('Broadcast scheduled successfully.', { id: loadingToast })
            } else {
                toast.success(`Broadcast sent to ${Number(response.data.delivered || 0)} clients.`, { id: loadingToast })
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to send broadcast right now.'
            toast.error(message, { id: loadingToast })
        } finally {
            setIsSending(false)
        }
    }

    const handleDispatchDue = async () => {
        const loadingToast = toast.loading('Dispatching due broadcasts...')
        setIsDispatching(true)
        try {
            const response = await requestApi<{ processed: number; sent: number; failed: number }>('/api/v1/coach/broadcast', {
                method: 'PATCH',
                body: JSON.stringify({ action: 'dispatch_due' }),
            })

            await fetchBroadcasts({ force: true })
            toast.success(
                `Processed ${response.data.processed} scheduled broadcasts (${response.data.sent} sent, ${response.data.failed} failed).`,
                { id: loadingToast },
            )
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to dispatch due broadcasts.', { id: loadingToast })
        } finally {
            setIsDispatching(false)
        }
    }

    const handleScheduledAction = async (action: 'send_now' | 'cancel', scheduleId: string) => {
        setActiveScheduleActionId(scheduleId)
        const loadingToast = toast.loading(action === 'send_now' ? 'Sending scheduled broadcast...' : 'Cancelling scheduled broadcast...')
        try {
            await requestApi('/api/v1/coach/broadcast', {
                method: 'PATCH',
                body: JSON.stringify({ action, scheduleId }),
            })

            await fetchBroadcasts({ force: true })
            toast.success(action === 'send_now' ? 'Scheduled broadcast sent.' : 'Scheduled broadcast cancelled.', { id: loadingToast })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to process scheduled action.', { id: loadingToast })
        } finally {
            setActiveScheduleActionId(null)
        }
    }

    const uploadMediaFile = async (file: File) => {
        setIsUploadingMedia(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', 'broadcast')

            const response = await requestApi<{ url: string }>('/api/v1/coach/media/upload', {
                method: 'POST',
                body: formData,
            })

            setMediaUrl(String(response.data.url || ''))
            toast.success('Broadcast media uploaded.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Media upload failed.')
        } finally {
            setIsUploadingMedia(false)
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

                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Schedule (Optional)</label>
                            <div className="relative">
                                <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                <input
                                    type="datetime-local"
                                    value={scheduleAt}
                                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                                    onChange={(event) => setScheduleAt(event.target.value)}
                                    className="w-full h-[44px] pl-10 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] text-(--text-primary) outline-none"
                                />
                            </div>
                            <p className="text-[11px] text-(--text-tertiary)">
                                {hasFutureSchedule ? 'This message will be queued until the selected time.' : 'Leave empty to send immediately.'}
                            </p>
                        </div>

                        <input
                            ref={mediaInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (!file) return
                                void uploadMediaFile(file)
                                event.target.value = ''
                            }}
                        />

                        <div
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault()
                                const file = event.dataTransfer.files?.[0]
                                if (!file) return
                                void uploadMediaFile(file)
                            }}
                            className="rounded-[14px] border border-dashed border-(--border-subtle) bg-[var(--bg-elevated)] p-4 flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <UploadCloud className="w-[16px] h-[16px] text-(--text-secondary)" />
                                <span className="text-[12px] text-(--text-secondary)">Drop image/video or upload file</span>
                            </div>
                            <button
                                onClick={() => mediaInputRef.current?.click()}
                                className="h-[30px] px-3 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                            >
                                Browse
                            </button>
                        </div>

                        {mediaUrl && (
                            <div className="rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] p-3 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <ImageIcon className="w-[14px] h-[14px] text-emerald-500" />
                                        <span className="text-[12px] text-(--text-primary) truncate">{mediaUrl}</span>
                                    </div>
                                    <button
                                        onClick={() => setMediaUrl('')}
                                        className="w-[24px] h-[24px] rounded-[6px] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                                    >
                                        <X className="w-[12px] h-[12px]" />
                                    </button>
                                </div>
                                {/(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl) ? (
                                    <video src={mediaUrl} controls className="w-full max-h-[220px] rounded-[10px] bg-black" />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={mediaUrl} alt="Broadcast media preview" className="w-full max-h-[220px] object-cover rounded-[10px]" />
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                            <span className="font-body text-[12px] text-(--text-tertiary)">{isUploadingMedia ? 'Uploading media...' : `${message.length}/1000 characters`}</span>
                            <button 
                                onClick={handleSendBroadcast}
                                className={cn("h-[44px] px-8 rounded-[12px] font-bold text-[14px] transition-all shadow-sm flex items-center gap-2", 
                                message.length > 0 && !isSending ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer" : "bg-(--border-subtle) text-(--text-tertiary) cursor-not-allowed")}
                                disabled={message.length === 0 || isSending}
                            >
                                {isSending ? 'Processing...' : hasFutureSchedule ? 'Schedule Broadcast' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-6 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><History className="w-[18px] h-[18px] text-(--text-secondary)" /> History</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDispatchDue}
                                disabled={isDispatching}
                                className={cn(
                                    'text-(--text-secondary) hover:text-(--text-primary) text-[12px] font-bold flex items-center gap-1.5',
                                    isDispatching ? 'opacity-60 cursor-not-allowed' : '',
                                )}
                            >
                                <PlayCircle className="w-[16px] h-[16px]" /> {isDispatching ? 'Dispatching...' : 'Dispatch due'}
                            </button>
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
                    </div>
                    
                    <div className="flex flex-col divide-y divide-(--border-subtle)">
                        {visibleBroadcasts.map((item: BroadcastHistoryItem) => (
                            <div key={item.id} className="p-5 hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-body text-[12px] font-bold bg-(--bg-surface) border border-(--border-subtle) px-2 py-0.5 rounded-[6px] text-(--text-secondary)">{item.target}</span>
                                        {item.status && (
                                            <span
                                                className={cn(
                                                    'font-body text-[11px] font-bold px-2 py-0.5 rounded-[6px] border',
                                                    item.status === 'sent' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '',
                                                    item.status === 'scheduled' ? 'border-blue-200 text-blue-600 bg-blue-50' : '',
                                                    item.status === 'cancelled' ? 'border-slate-200 text-slate-500 bg-slate-50' : '',
                                                    item.status === 'failed' ? 'border-rose-200 text-rose-600 bg-rose-50' : '',
                                                )}
                                            >
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-body text-[11px] text-(--text-tertiary)">{item.sentAt}</span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-primary) line-clamp-2 mb-3">&quot;{item.snippet}&quot;</p>
                                <div className="flex items-center gap-4 text-[12px] font-body text-(--text-secondary)">
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-[var(--text-tertiary)]" /> Delivered to {item.delivered}</div>
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-emerald-500" /> Read by {item.read}</div>
                                </div>
                                {item.status === 'scheduled' && item.scheduleId && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            onClick={() => void handleScheduledAction('send_now', item.scheduleId || '')}
                                            disabled={activeScheduleActionId === item.scheduleId}
                                            className="h-[30px] px-3 rounded-[8px] bg-emerald-500 text-white text-[12px] font-bold disabled:opacity-60"
                                        >
                                            Send now
                                        </button>
                                        <button
                                            onClick={() => void handleScheduledAction('cancel', item.scheduleId || '')}
                                            disabled={activeScheduleActionId === item.scheduleId}
                                            className="h-[30px] px-3 rounded-[8px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary) disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
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
