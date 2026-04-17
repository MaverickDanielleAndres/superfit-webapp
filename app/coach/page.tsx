'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Calendar, Megaphone, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function CoachDashboard() {
    const router = useRouter()
    const {
        clients,
        programs,
        forms,
        events,
        broadcasts,
        addNextAvailableClient,
        isLoading,
        error,
    } = useCoachPortalData()
    const [isAddingClient, setIsAddingClient] = React.useState(false)

    const avgCompliance = useMemo(() => {
        if (!clients.length) return 0
        return Math.round(clients.reduce((sum, client) => sum + client.compliance, 0) / clients.length)
    }, [clients])

    const upcomingEvents = useMemo(
        () => [...events]
            .filter((event) => event.status !== 'completed' && event.status !== 'cancelled')
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .slice(0, 4),
        [events],
    )

    const complianceChartData = useMemo(
        () => clients
            .slice(0, 10)
            .map((client) => ({
                name: client.name.split(' ')[0],
                compliance: client.compliance,
            })),
        [clients],
    )

    const scheduleStatusData = useMemo(() => {
        const statusCount = {
            scheduled: 0,
            postponed: 0,
            completed: 0,
            cancelled: 0,
        }

        for (const event of events) {
            if (event.status === 'scheduled') statusCount.scheduled += 1
            if (event.status === 'postponed') statusCount.postponed += 1
            if (event.status === 'completed') statusCount.completed += 1
            if (event.status === 'cancelled') statusCount.cancelled += 1
        }

        return [
            { name: 'Scheduled', value: statusCount.scheduled, color: '#3b82f6' },
            { name: 'Postponed', value: statusCount.postponed, color: '#f59e0b' },
            { name: 'Completed', value: statusCount.completed, color: '#10b981' },
            { name: 'Cancelled', value: statusCount.cancelled, color: '#ef4444' },
        ]
    }, [events])

    const deliveryChartData = useMemo(
        () => broadcasts
            .slice(0, 6)
            .reverse()
            .map((broadcast, index) => ({
                name: `B${index + 1}`,
                delivered: broadcast.delivered,
                read: broadcast.read,
            })),
        [broadcasts],
    )

    if (isLoading && clients.length === 0 && programs.length === 0 && forms.length === 0 && events.length === 0 && broadcasts.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
                <div className="h-7 w-48 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-32 rounded-[20px] bg-[var(--bg-elevated)]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 rounded-[20px] bg-[var(--bg-elevated)]" />
                    <div className="h-64 rounded-[20px] bg-[var(--bg-elevated)]" />
                </div>
            </div>
        )
    }

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
                                if (isAddingClient) return
                                setIsAddingClient(true)
                                const result = await addNextAvailableClient()
                                if (result.added) {
                                    toast.success(result.manualOverride ? 'Client added using hybrid fallback.' : 'Client added to your roster.')
                                    setIsAddingClient(false)
                                    return
                                }

                                if (result.reason === 'CLIENT_CAP_REACHED') {
                                    toast.info('Client cap reached. Increase your marketplace cap or archive an inactive client first.')
                                    setIsAddingClient(false)
                                    return
                                }

                                if (result.reason === 'NO_CLIENT_WITH_VALID_INTERACTION') {
                                    toast.info('No eligible clients found with prior coach interaction. Opening client picker...')
                                    router.push('/coach/clients?openPicker=1')
                                    setIsAddingClient(false)
                                    return
                                }

                                if (result.reason === 'NO_AVAILABLE_CLIENTS') {
                                    toast.info('No unassigned active users available.')
                                    setIsAddingClient(false)
                                    return
                                }

                                toast.info('No available unassigned clients found.')
                                setIsAddingClient(false)
                            })()
                        }}
                        disabled={isAddingClient}
                        className="h-[42px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-[16px] h-[16px]" /> {isAddingClient ? 'Adding...' : 'Add Client'}
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Client Compliance Trend</h2>
                    </div>
                    <div className="h-[260px] p-4">
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={120}>
                            <AreaChart data={complianceChartData}>
                                <defs>
                                    <linearGradient id="complianceFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2.5} fill="url(#complianceFill)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Schedule Status</h2>
                    </div>
                    <div className="h-[260px] p-4">
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={120}>
                            <BarChart data={scheduleStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {scheduleStatusData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Broadcast Delivery vs Reads</h2>
                </div>
                <div className="h-[220px] p-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={120}>
                        <BarChart data={deliveryChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="delivered" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="read" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
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
