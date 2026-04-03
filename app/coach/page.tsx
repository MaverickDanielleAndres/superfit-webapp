'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Calendar, Megaphone, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function CoachDashboard() {
    const router = useRouter()
    const {
        initialize,
        clients,
        programs,
        forms,
        events,
        broadcasts,
        addNextAvailableClient,
        isLoading,
        error,
    } = useCoachPortalStore()

    useEffect(() => {
        void initialize()
    }, [initialize])

    const nowTs = useMemo(() => Date.now(), [events])

    const avgCompliance = useMemo(() => {
        if (!clients.length) return 0
        return Math.round(clients.reduce((sum, client) => sum + client.compliance, 0) / clients.length)
    }, [clients])

    const upcomingEvents = useMemo(
        () => [...events]
            .filter((event) => new Date(event.startAt).getTime() >= nowTs)
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .slice(0, 4),
        [events, nowTs],
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Coach HQ</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">A live overview of your clients, programs, forms, and schedule.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/coach/programs')}
                        className="h-[42px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] transition-colors"
                    >
                        Manage Programs
                    </button>
                    <button
                        onClick={() => {
                            void (async () => {
                                const added = await addNextAvailableClient()
                                if (added) {
                                    toast.success('Client added to your roster.')
                                } else {
                                    toast.info('No available unassigned clients found.')
                                }
                            })()
                        }}
                        className="h-[42px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-[16px] h-[16px]" /> Add Client
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Clients', value: String(clients.length), icon: Users },
                    { label: 'Programs', value: String(programs.length), icon: FileText },
                    { label: 'Forms', value: String(forms.length), icon: FileText },
                    { label: 'Avg Compliance', value: `${avgCompliance}%`, icon: Users },
                ].map((metric) => (
                    <div key={metric.label} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] uppercase tracking-wider font-bold text-(--text-secondary)">{metric.label}</span>
                            <div className="w-[30px] h-[30px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)">
                                <metric.icon className="w-[14px] h-[14px]" />
                            </div>
                        </div>
                        <p className="font-display font-black text-[30px] text-(--text-primary) leading-none">{metric.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Upcoming Sessions</h2>
                        <button onClick={() => router.push('/coach/schedule')} className="text-[12px] font-bold text-emerald-500 hover:text-emerald-600">Open Calendar</button>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {upcomingEvents.length === 0 && (
                            <div className="p-4 text-[13px] text-(--text-secondary)">No upcoming sessions scheduled.</div>
                        )}
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="p-3 rounded-[12px] border border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{event.title}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{event.time} • {event.type}</p>
                                </div>
                                <Calendar className="w-[16px] h-[16px] text-(--text-tertiary)" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Recent Broadcasts</h2>
                        <button onClick={() => router.push('/coach/broadcast')} className="text-[12px] font-bold text-emerald-500 hover:text-emerald-600">Open Broadcast</button>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {broadcasts.slice(0, 4).map((broadcast) => (
                            <div key={broadcast.id} className="p-3 rounded-[12px] border border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{broadcast.target}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{broadcast.snippet || 'No message preview'}</p>
                                </div>
                                <div className="text-right text-[11px] text-(--text-secondary)">
                                    <p>{broadcast.delivered} delivered</p>
                                    <p>{broadcast.read} read</p>
                                </div>
                            </div>
                        ))}
                        {!isLoading && broadcasts.length === 0 && (
                            <div className="p-4 text-[13px] text-(--text-secondary)">No broadcasts sent yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                    { label: 'Clients', href: '/coach/clients', icon: Users },
                    { label: 'Forms', href: '/coach/forms', icon: FileText },
                    { label: 'Broadcast', href: '/coach/broadcast', icon: Megaphone },
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={() => router.push(item.href)}
                        className="h-[56px] rounded-[14px] bg-(--bg-surface) border border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors font-bold text-[14px] text-(--text-primary) flex items-center justify-center gap-2"
                    >
                        <item.icon className="w-[16px] h-[16px]" /> {item.label}
                    </button>
                ))}
            </div>
        </motion.div>
    )
}
