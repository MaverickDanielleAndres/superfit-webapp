'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Target, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'

interface ClientProgramAssignment {
    id: string
    status: string
    progressPct: number
    assignedAt: string
    completedAt: string | null
    program: {
        id: string
        name: string
        difficulty: string
        lengthLabel: string
    }
}

interface ClientFormAssignment {
    id: string
    assignedAt: string
    deadline: string | null
    completedAt: string | null
    form: {
        id: string
        name: string
        status: string
    }
}

interface ClientFormSubmission {
    id: string
    submittedAt: string
    reviewedAt: string | null
    reviewStatus: string
    coachNotes: string
    response: Record<string, unknown>
    form: {
        id: string
        name: string
    }
}

interface ClientScheduleEvent {
    id: string
    title: string
    eventType: string
    status: string
    startAt: string
    endAt: string
    notes: string
}

interface ClientSummaryPayload {
    client: {
        id: string
        name: string
        email: string
        avatarUrl: string
    }
    link: {
        id: string
        status: string
        goalName: string
        compliance: number
        lastActiveAt: string
        weightTrend: number[]
        notes: string
    }
    programAssignments: ClientProgramAssignment[]
    formAssignments: ClientFormAssignment[]
    formSubmissions: ClientFormSubmission[]
    scheduleEvents: ClientScheduleEvent[]
}

export default function ClientDetailPage() {
    const params = useParams<{ clientId: string }>()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'Overview' | 'Programs' | 'Schedule' | 'History'>('Overview')
    const [summary, setSummary] = useState<ClientSummaryPayload | null>(null)
    const [isSummaryLoading, setIsSummaryLoading] = useState(false)

    const {
        createOrGetDirectThread,
    } = useCoachPortalData()

    useEffect(() => {
        if (!params.clientId) return

        setIsSummaryLoading(true)
        void (async () => {
            try {
                const response = await requestApi<ClientSummaryPayload>(`/api/v1/coach/clients/${params.clientId}/summary`)
                setSummary(response.data)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to fetch client summary.')
                setSummary(null)
            } finally {
                setIsSummaryLoading(false)
            }
        })()
    }, [params.clientId])

    const derivedClient = useMemo(() => {
        if (summary?.client) {
            return {
                id: summary.client.id,
                name: summary.client.name,
                email: summary.client.email,
                goal: summary.link.goalName,
                lastActive: formatRelativeTime(summary.link.lastActiveAt),
                compliance: summary.link.compliance,
                status: normalizeClientStatus(summary.link.status),
                weightTrend: Array.isArray(summary.link.weightTrend)
                    ? summary.link.weightTrend.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
                    : [],
            }
        }

        return null
    }, [summary])

    const clientEvents = useMemo(() => summary?.scheduleEvents || [], [summary])
    const programAssignments = useMemo(() => summary?.programAssignments || [], [summary])
    const formAssignments = useMemo(() => summary?.formAssignments || [], [summary])
    const formSubmissions = useMemo(() => summary?.formSubmissions || [], [summary])

    if (!isSummaryLoading && !derivedClient) {
        return (
            <div className="max-w-4xl mx-auto py-20">
                <Link href="/coach/clients" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-6">
                    <ArrowLeft className="w-[16px] h-[16px]" /> Back to Roster
                </Link>
                <div className="rounded-[20px] border border-(--border-subtle) bg-(--bg-surface) p-8">
                    <h1 className="font-display font-bold text-[24px] text-(--text-primary)">Client Not Found</h1>
                    <p className="text-[14px] text-(--text-secondary) mt-2">The requested client is not linked to your coach account.</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full pb-20 pt-2">
            <Link href="/coach/clients" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-2 transition-colors w-fit">
                <ArrowLeft className="w-[16px] h-[16px]" /> Back to Roster
            </Link>

            {derivedClient && (
                <>
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={summary?.client.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${derivedClient.name}`} alt={derivedClient.name} className="w-[72px] h-[72px] rounded-[18px] bg-[var(--bg-elevated)] border border-(--border-subtle)" />
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="font-display font-black text-[24px] text-(--text-primary)">{derivedClient.name}</h1>
                                    <span className={cn(
                                        'px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider',
                                        derivedClient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : derivedClient.status === 'Onboarding' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600',
                                    )}>
                                        {derivedClient.status}
                                    </span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-secondary)">{derivedClient.goal}</p>
                                <p className="font-body text-[13px] text-(--text-tertiary) mt-1">{derivedClient.email} • Last active {derivedClient.lastActive}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                void (async () => {
                                    const threadId = await createOrGetDirectThread(derivedClient.id)
                                    if (!threadId) {
                                        toast.error('Unable to open direct thread for this client.')
                                        return
                                    }
                                    router.push(`/coach/messages?thread=${threadId}`)
                                })()
                            }}
                            className="h-[42px] px-5 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[14px] flex items-center gap-2"
                        >
                            <MessageCircle className="w-[16px] h-[16px]" /> Message Client
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-4">
                            <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Current Metrics</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                    <span className="block text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Compliance</span>
                                    <span className="font-display font-black text-[24px] text-emerald-500">{derivedClient.compliance}%</span>
                                </div>
                                <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                    <span className="block text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Trend Points</span>
                                    <span className="font-display font-black text-[24px] text-(--text-primary)">{derivedClient.weightTrend.length}</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <span className="block text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Weight Trend</span>
                                <div className="h-[6px] w-full bg-(--border-subtle) rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(Math.max(derivedClient.compliance, 5), 100)}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="flex border-b border-(--border-subtle) gap-6 overflow-x-auto no-scrollbar">
                                {['Overview', 'Programs', 'Schedule', 'History'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as typeof activeTab)}
                                        className={cn('pb-3 font-display font-black text-[16px] transition-colors relative whitespace-nowrap', activeTab === tab ? 'text-(--text-primary)' : 'text-(--text-tertiary) hover:text-(--text-secondary)')}
                                    >
                                        {tab}
                                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-full" />}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 min-h-[360px]">
                                {activeTab === 'Overview' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center gap-3">
                                            <Target className="w-[18px] h-[18px] text-emerald-500" />
                                            <div>
                                                <p className="font-bold text-[14px] text-(--text-primary)">Primary Goal</p>
                                                <p className="text-[13px] text-(--text-secondary)">{derivedClient.goal}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Linked Schedule Events</p>
                                            <p className="text-[13px] text-(--text-secondary)">{clientEvents.length} event(s) tied to this client</p>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Assigned Forms</p>
                                            <p className="text-[13px] text-(--text-secondary)">{formAssignments.length} form assignment(s) tracked</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Programs' && (
                                    <div className="flex flex-col gap-3">
                                        {programAssignments.map((assignment) => (
                                            <div key={assignment.id} className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                                <p className="font-bold text-[15px] text-(--text-primary)">{assignment.program.name}</p>
                                                <p className="text-[13px] text-(--text-secondary)">{assignment.program.lengthLabel} • {assignment.program.difficulty}</p>
                                                <p className="text-[12px] text-(--text-tertiary) mt-1">Status: {assignment.status} • Progress {assignment.progressPct}%</p>
                                            </div>
                                        ))}
                                        {!programAssignments.length && <p className="text-[13px] text-(--text-secondary)">No program assignments for this client yet.</p>}
                                    </div>
                                )}

                                {activeTab === 'Schedule' && (
                                    <div className="flex flex-col gap-3">
                                        {clientEvents.map((event) => (
                                            <div key={event.id} className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[14px] text-(--text-primary)">{event.title}</p>
                                                    <p className="text-[12px] text-(--text-secondary)">{new Date(event.startAt).toLocaleString()} • {event.eventType}</p>
                                                </div>
                                                <Calendar className="w-[16px] h-[16px] text-(--text-tertiary)" />
                                            </div>
                                        ))}
                                        {!clientEvents.length && <p className="text-[13px] text-(--text-secondary)">No scheduled events for this client yet.</p>}
                                    </div>
                                )}

                                {activeTab === 'History' && (
                                    <div className="flex flex-col gap-3">
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Activity Snapshot</p>
                                            <p className="text-[13px] text-(--text-secondary)">Last active {derivedClient.lastActive}</p>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Compliance Score</p>
                                            <p className="text-[13px] text-(--text-secondary)">{derivedClient.compliance}% adherence to assigned plan.</p>
                                        </div>
                                        {formSubmissions.map((submission) => (
                                            <div key={submission.id} className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                                <p className="font-bold text-[14px] text-(--text-primary)">{submission.form.name}</p>
                                                <p className="text-[12px] text-(--text-secondary)">
                                                    Submitted {new Date(submission.submittedAt).toLocaleString()} • {submission.reviewStatus}
                                                </p>
                                                {submission.coachNotes ? (
                                                    <p className="text-[13px] text-(--text-secondary) mt-2">{submission.coachNotes}</p>
                                                ) : null}
                                            </div>
                                        ))}
                                        {!formSubmissions.length && (
                                            <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                                <p className="text-[13px] text-(--text-secondary)">No form submission history for this client yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    )
}

function normalizeClientStatus(status: string): 'Active' | 'Onboarding' | 'Inactive' {
    const normalized = status.toLowerCase()
    if (normalized === 'onboarding') return 'Onboarding'
    if (normalized === 'inactive' || normalized === 'paused') return 'Inactive'
    return 'Active'
}

function formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate)
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (!Number.isFinite(minutes) || minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}
