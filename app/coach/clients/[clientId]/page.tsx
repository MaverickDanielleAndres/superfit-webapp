'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Target, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function ClientDetailPage() {
    const params = useParams<{ clientId: string }>()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'Overview' | 'Programs' | 'Schedule' | 'History'>('Overview')

    const {
        initialize,
        clients,
        programs,
        events,
        createOrGetDirectThread,
        isLoading,
    } = useCoachPortalStore()

    useEffect(() => {
        void initialize()
    }, [initialize])

    const client = useMemo(
        () => clients.find((entry) => entry.id === params.clientId),
        [clients, params.clientId],
    )

    const clientEvents = useMemo(
        () => events.filter((event) => event.clientId === params.clientId),
        [events, params.clientId],
    )

    if (!isLoading && !client) {
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full pb-20 pt-2">
            <Link href="/coach/clients" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-2 transition-colors w-fit">
                <ArrowLeft className="w-[16px] h-[16px]" /> Back to Roster
            </Link>

            {client && (
                <>
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} className="w-[72px] h-[72px] rounded-[18px] bg-[var(--bg-elevated)] border border-(--border-subtle)" />
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="font-display font-black text-[24px] text-(--text-primary)">{client.name}</h1>
                                    <span className={cn(
                                        'px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider',
                                        client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : client.status === 'Onboarding' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600',
                                    )}>
                                        {client.status}
                                    </span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-secondary)">{client.goal}</p>
                                <p className="font-body text-[13px] text-(--text-tertiary) mt-1">{client.email} • Last active {client.lastActive}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                void (async () => {
                                    const threadId = await createOrGetDirectThread(client.id)
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
                                    <span className="font-display font-black text-[24px] text-emerald-500">{client.compliance}%</span>
                                </div>
                                <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                    <span className="block text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Trend Points</span>
                                    <span className="font-display font-black text-[24px] text-(--text-primary)">{client.weightTrend.length}</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <span className="block text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Weight Trend</span>
                                <div className="h-[6px] w-full bg-(--border-subtle) rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(Math.max(client.compliance, 5), 100)}%` }} />
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
                                                <p className="text-[13px] text-(--text-secondary)">{client.goal}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Linked Schedule Events</p>
                                            <p className="text-[13px] text-(--text-secondary)">{clientEvents.length} event(s) tied to this client</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Programs' && (
                                    <div className="flex flex-col gap-3">
                                        {programs.map((program) => (
                                            <div key={program.id} className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                                <p className="font-bold text-[15px] text-(--text-primary)">{program.name}</p>
                                                <p className="text-[13px] text-(--text-secondary)">{program.length} • {program.difficulty}</p>
                                            </div>
                                        ))}
                                        {!programs.length && <p className="text-[13px] text-(--text-secondary)">No coach programs available yet.</p>}
                                    </div>
                                )}

                                {activeTab === 'Schedule' && (
                                    <div className="flex flex-col gap-3">
                                        {clientEvents.map((event) => (
                                            <div key={event.id} className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[14px] text-(--text-primary)">{event.title}</p>
                                                    <p className="text-[12px] text-(--text-secondary)">{event.time} • {event.type}</p>
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
                                            <p className="text-[13px] text-(--text-secondary)">Last active {client.lastActive}</p>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Compliance Score</p>
                                            <p className="text-[13px] text-(--text-secondary)">{client.compliance}% adherence to assigned plan.</p>
                                        </div>
                                        <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                            <p className="font-bold text-[14px] text-(--text-primary)">Coach Notes</p>
                                            <p className="text-[13px] text-(--text-secondary)">Use the forms and messages modules for deeper client history tracking.</p>
                                        </div>
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
