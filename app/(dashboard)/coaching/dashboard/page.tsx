'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, FileText, Loader2, MessageCircle, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { StructuredFormSubmissionModal, type StructuredFormQuestion } from '@/components/coaching/StructuredFormSubmissionModal'

interface CoachingHubDashboardResponse {
    coach: {
        id: string
        name: string
        avatar: string
        bio: string
    } | null
    programAssignments: Array<{
        id: string
        status: string
        progressPct: number
        program: {
            id: string
            name: string
            difficulty: string
            lengthLabel: string
        }
    }>
    formAssignments: Array<{
        id: string
        assignedAt: string
        deadline: string | null
        completedAt: string | null
        form: {
            id: string
            name: string
            status: string
            questions: StructuredFormQuestion[]
        }
    }>
    scheduleEvents: Array<{
        id: string
        title: string
        eventType: string
        status: string
        startAt: string
        endAt: string
        isUpcoming: boolean
    }>
    announcements: Array<{
        id: string
        message: string
        createdAt: string
    }>
    stats: {
        activePrograms: number
        pendingForms: number
        upcomingSessions: number
    }
}

export default function CoachDashboardPage() {
    const router = useRouter()
    const [hubData, setHubData] = useState<CoachingHubDashboardResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null)
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null)
    const [isStructuredModalOpen, setStructuredModalOpen] = useState(false)

    const loadDashboard = async () => {
        setLoadError(null)
        setIsLoading(true)

        try {
            const response = await requestApi<CoachingHubDashboardResponse>('/api/v1/coaching/hub')
            setHubData(response.data)
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Unable to load coaching dashboard.')
            setHubData(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadDashboard()
    }, [])

    const pendingForms = useMemo(() => hubData?.formAssignments.filter((item) => !item.completedAt) || [], [hubData])
    const upcomingSessions = useMemo(() => hubData?.scheduleEvents.filter((event) => event.isUpcoming).slice(0, 6) || [], [hubData])
    const activeAssignment = pendingForms.find((item) => item.id === activeAssignmentId) || null

    const handleSubmitQuick = async (response: Record<string, unknown>) => {
        if (!activeAssignment) return

        setSubmittingAssignmentId(activeAssignment.id)
        const toastId = toast.loading('Submitting form...')

        try {
            await requestApi('/api/v1/coaching/forms/submissions', {
                method: 'POST',
                body: JSON.stringify({
                    assignmentId: activeAssignment.id,
                    response,
                }),
            })
            toast.success('Submitted for coach review.', { id: toastId })
            setStructuredModalOpen(false)
            setActiveAssignmentId(null)
            await loadDashboard()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to submit right now.', { id: toastId })
        } finally {
            setSubmittingAssignmentId(null)
        }
    }

    const openStructuredForm = (assignmentId: string) => {
        setActiveAssignmentId(assignmentId)
        setStructuredModalOpen(true)
    }

    const closeStructuredForm = () => {
        if (submittingAssignmentId) return
        setStructuredModalOpen(false)
        setActiveAssignmentId(null)
    }

    if (isLoading) {
        return (
            <div className="w-full max-w-5xl mx-auto py-20 flex items-center justify-center gap-3 text-(--text-secondary)">
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span className="font-body text-[14px]">Loading coaching dashboard...</span>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="w-full max-w-5xl mx-auto py-20 text-center">
                <p className="font-display font-bold text-[20px] text-red-600">Unable to load coaching dashboard</p>
                <p className="mt-2 text-[14px] text-(--text-secondary)">{loadError}</p>
                <button onClick={() => { void loadDashboard() }} className="mt-4 px-4 py-2 rounded-[10px] border border-(--border-default) font-semibold text-[13px] hover:bg-[var(--bg-elevated)]">
                    Retry
                </button>
            </div>
        )
    }

    if (!hubData?.coach) {
        return (
            <div className="w-full max-w-5xl mx-auto py-20 text-center">
                <p className="font-display font-bold text-[22px] text-(--text-primary)">No Active Coaching Subscription</p>
                <p className="mt-2 text-[14px] text-(--text-secondary)">Subscribe to a coach to unlock programs, assignments, and announcements.</p>
                <button onClick={() => router.push('/coaching')} className="mt-6 px-5 py-2.5 rounded-[12px] bg-(--text-primary) text-(--bg-base) font-bold text-[13px]">
                    Browse Coaches
                </button>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) leading-tight">Coaching Dashboard</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">You are currently coached by {hubData.coach.name}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/coaching')} className="h-[40px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) transition-all flex items-center gap-2 font-body font-semibold text-[13px]">
                        <MessageCircle className="w-[16px] h-[16px]" /> Open Hub
                    </button>
                    <button onClick={() => router.push('/workout')} className="h-[40px] px-4 rounded-[12px] bg-(--text-primary) text-(--bg-base) transition-all flex items-center gap-2 font-display font-bold text-[13px]">
                        <Target className="w-[16px] h-[16px]" /> Start Workout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[
                    { icon: Target, label: 'Active Programs', value: String(hubData.stats.activePrograms), detail: 'From coach assignments' },
                    { icon: FileText, label: 'Pending Forms', value: String(hubData.stats.pendingForms), detail: 'Need your response' },
                    { icon: CalendarClock, label: 'Upcoming Sessions', value: String(hubData.stats.upcomingSessions), detail: 'Scheduled with coach' },
                ].map((metric) => (
                    <div key={metric.label} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 flex items-center gap-4 hover:border-(--border-default) transition-colors shadow-sm">
                        <div className="w-[48px] h-[48px] rounded-[14px] bg-[var(--bg-elevated)] flex items-center justify-center">
                            <metric.icon className="w-[24px] h-[24px] text-(--accent)" />
                        </div>
                        <div>
                            <span className="block font-body text-[13px] text-(--text-secondary) font-medium uppercase tracking-wider">{metric.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="block font-display font-bold text-[24px] text-(--text-primary)">{metric.value}</span>
                                <span className="font-body text-[11px] font-semibold text-(--text-secondary)">{metric.detail}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Pending Forms</h2>
                    <div className="flex flex-col gap-3">
                        {pendingForms.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between gap-3 border border-(--border-subtle) rounded-[14px] px-4 py-3 bg-[var(--bg-elevated)]">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{assignment.form.name}</p>
                                    <p className="text-[12px] text-(--text-secondary)">
                                        {assignment.deadline ? `Due ${new Date(assignment.deadline).toLocaleDateString()}` : 'No deadline'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => openStructuredForm(assignment.id)}
                                    disabled={submittingAssignmentId === assignment.id}
                                    className="h-[34px] px-4 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold disabled:opacity-60"
                                >
                                    {submittingAssignmentId === assignment.id ? 'Submitting...' : 'Fill Form'}
                                </button>
                            </div>
                        ))}
                        {pendingForms.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No pending forms. You are all caught up.</p>
                        )}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Upcoming Sessions</h2>
                    <div className="flex flex-col gap-3">
                        {upcomingSessions.map((event) => (
                            <div key={event.id} className="border border-(--border-subtle) rounded-[12px] p-3 bg-[var(--bg-elevated)]">
                                <p className="font-bold text-[13px] text-(--text-primary)">{event.title}</p>
                                <p className="text-[12px] text-(--text-secondary)">{new Date(event.startAt).toLocaleString()}</p>
                            </div>
                        ))}
                        {upcomingSessions.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No sessions scheduled.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Assigned Programs</h2>
                    <div className="flex flex-col gap-3">
                        {hubData.programAssignments.map((assignment) => (
                            <div key={assignment.id} className="border border-(--border-subtle) rounded-[14px] p-4 bg-[var(--bg-elevated)]">
                                <p className="font-bold text-[14px] text-(--text-primary)">{assignment.program.name}</p>
                                <p className="text-[12px] text-(--text-secondary)">{assignment.program.lengthLabel} • {assignment.program.difficulty}</p>
                                <div className="mt-3 h-[6px] w-full bg-(--bg-base) rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, assignment.progressPct))}%` }} />
                                </div>
                            </div>
                        ))}
                        {hubData.programAssignments.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No programs assigned yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Latest Announcements</h2>
                    <div className="flex flex-col gap-3">
                        {hubData.announcements.slice(0, 6).map((announcement) => (
                            <div key={announcement.id} className="border border-(--border-subtle) rounded-[14px] p-4 bg-[var(--bg-elevated)]">
                                <p className="text-[14px] text-(--text-primary) whitespace-pre-wrap">{announcement.message}</p>
                                <p className="mt-2 text-[11px] text-(--text-tertiary)">{new Date(announcement.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                        {hubData.announcements.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No announcements yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <StructuredFormSubmissionModal
                open={isStructuredModalOpen}
                assignment={
                    activeAssignment
                        ? {
                            id: activeAssignment.id,
                            deadline: activeAssignment.deadline,
                            form: {
                                id: activeAssignment.form.id,
                                name: activeAssignment.form.name,
                                questions: activeAssignment.form.questions,
                            },
                        }
                        : null
                }
                isSubmitting={Boolean(submittingAssignmentId)}
                onClose={closeStructuredForm}
                onSubmit={handleSubmitQuick}
            />
        </motion.div>
    )
}
