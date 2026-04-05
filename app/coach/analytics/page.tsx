'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Activity, Target, Download, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function AnalyticsPage() {
    const { clients, programs, events, fetchClients, fetchPrograms, fetchEvents } = useCoachPortalData()
    const [clientCap, setClientCap] = React.useState(30)
    const [monthlyRevenueCents, setMonthlyRevenueCents] = React.useState(0)
    const [transactionCount, setTransactionCount] = React.useState(0)

    useEffect(() => {
        void Promise.all([fetchClients(), fetchPrograms(), fetchEvents()])
    }, [fetchClients, fetchPrograms, fetchEvents])

    useEffect(() => {
        void (async () => {
            try {
                const response = await requestApi<{
                    clientCap: number
                    monthlyRevenueCents: number
                    transactionCount: number
                }>('/api/v1/coach/marketplace')

                setClientCap(Math.max(1, Number(response.data.clientCap || 30)))
                setMonthlyRevenueCents(Number(response.data.monthlyRevenueCents || 0))
                setTransactionCount(Number(response.data.transactionCount || 0))
            } catch {
                setClientCap(30)
                setMonthlyRevenueCents(0)
                setTransactionCount(0)
            }
        })()
    }, [])

    const activeClients = useMemo(
        () => clients.filter((client) => client.status === 'Active').length,
        [clients],
    )
    const totalRevenue = useMemo(() => {
        if (monthlyRevenueCents > 0) return monthlyRevenueCents / 100
        return programs.length * 79
    }, [monthlyRevenueCents, programs.length])
    const avgCompliance = useMemo(() => {
        if (!clients.length) return 0
        return Math.round(clients.reduce((sum, client) => sum + client.compliance, 0) / clients.length)
    }, [clients])
    const onboardingCount = useMemo(
        () => clients.filter((client) => client.status === 'Onboarding').length,
        [clients],
    )
    const inactiveCount = useMemo(
        () => clients.filter((client) => client.status === 'Inactive').length,
        [clients],
    )
    const atRiskClients = useMemo(
        () => [...clients].filter((client) => client.compliance < 50).sort((a, b) => a.compliance - b.compliance),
        [clients],
    )
    const rosterUtilization = useMemo(() => {
        return Math.min(100, Math.round((activeClients / Math.max(1, clientCap)) * 100))
    }, [activeClients, clientCap])

    const scheduledEvents = useMemo(
        () => events.filter((event) => event.status === 'scheduled').length,
        [events],
    )
    const completedEvents = useMemo(
        () => events.filter((event) => event.status === 'completed').length,
        [events],
    )
    const cancelledEvents = useMemo(
        () => events.filter((event) => event.status === 'cancelled').length,
        [events],
    )
    const completionRate = useMemo(() => {
        const tracked = completedEvents + cancelledEvents
        if (!tracked) return 100
        return Math.round((completedEvents / tracked) * 100)
    }, [cancelledEvents, completedEvents])

    const complianceTrendData = useMemo(() => {
        const recentClients = clients.slice(0, 10)
        if (!recentClients.length) {
            return [35, 48, 52, 61, 57, 70, 76].map((value, index) => ({
                name: `C${index + 1}`,
                compliance: value,
            }))
        }

        return recentClients.map((client, index) => ({
            name: client.name.split(' ')[0] || `C${index + 1}`,
            compliance: Math.max(10, Math.min(100, client.compliance)),
        }))
    }, [clients])

    const eventStatusData = useMemo(() => ([
        { name: 'Scheduled', value: scheduledEvents, color: '#2563eb' },
        { name: 'Completed', value: completedEvents, color: '#10b981' },
        { name: 'Cancelled', value: cancelledEvents, color: '#ef4444' },
    ]), [cancelledEvents, completedEvents, scheduledEvents])

    const handleExport = () => {
        const toastId = toast.loading('Exporting analytics snapshot...')
        try {
            const now = new Date()
            const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

            const rows: string[] = [
                ['Section', 'Metric', 'Value'].map(escapeCsv).join(','),
                ['KPI', 'Estimated Monthly Revenue', `$${totalRevenue.toLocaleString()}`].map(escapeCsv).join(','),
                ['KPI', 'Active Clients', activeClients].map(escapeCsv).join(','),
                ['KPI', 'Average Compliance', `${avgCompliance}%`].map(escapeCsv).join(','),
                ['KPI', 'Upcoming Events', events.length].map(escapeCsv).join(','),
                ['KPI', 'Schedule Completion Rate', `${completionRate}%`].map(escapeCsv).join(','),
                ['KPI', 'Roster Utilization', `${rosterUtilization}%`].map(escapeCsv).join(','),
                '',
                ['Top Clients', 'Name', 'Compliance'].map(escapeCsv).join(','),
            ]

            ;[...clients]
                .sort((a, b) => b.compliance - a.compliance)
                .slice(0, 10)
                .forEach((client) => {
                    rows.push(['Top Clients', client.name, `${client.compliance}%`].map(escapeCsv).join(','))
                })

            rows.push('')
            rows.push(['Compliance Trend', 'Client Label', 'Compliance'].map(escapeCsv).join(','))
            complianceTrendData.forEach((entry) => {
                rows.push(['Compliance Trend', entry.name, `${entry.compliance}%`].map(escapeCsv).join(','))
            })

            rows.push('')
            rows.push(['At Risk Clients', 'Name', 'Compliance'].map(escapeCsv).join(','))
            atRiskClients.slice(0, 10).forEach((client) => {
                rows.push(['At Risk Clients', client.name, `${client.compliance}%`].map(escapeCsv).join(','))
            })

            const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `coach-analytics-${now.toISOString().slice(0, 10)}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(downloadUrl)

            toast.success('Analytics snapshot exported.', { id: toastId })
        } catch {
            toast.error('Unable to export analytics snapshot.', { id: toastId })
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-subtle) pb-6">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Analytics & Reports</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Monitor client quality, retention signals, and operational throughput.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) font-bold text-[14px] border border-(--border-default) shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center gap-2"
                >
                    <Download className="w-[18px] h-[18px]" /> Export
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Est. Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, trend: transactionCount > 0 ? `${transactionCount} successful txns` : `${programs.length} active programs`, icon: DollarSign },
                    { title: 'Active Clients', value: String(activeClients), trend: `${onboardingCount} onboarding • ${inactiveCount} inactive`, icon: Users },
                    { title: 'Avg Compliance', value: `${avgCompliance}%`, trend: 'Based on linked clients', icon: Activity },
                    { title: 'Upcoming Events', value: String(events.length), trend: `${activeClients}/${clientCap} roster`, icon: Target },
                ].map((kpi) => (
                    <div key={kpi.title} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">{kpi.title}</h3>
                            <div className="w-[32px] h-[32px] rounded-[10px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><kpi.icon className="w-[16px] h-[16px]" /></div>
                        </div>
                        <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">{kpi.value}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className="w-[14px] h-[14px] text-emerald-500" />
                            <span className="font-body text-[13px] font-bold text-emerald-500">{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-[380px]">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-6">Client Compliance Trend</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={complianceTrendData}>
                                <defs>
                                    <linearGradient id="coachComplianceFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2.5} fill="url(#coachComplianceFill)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">Operational Pulse</h3>
                        <div className="h-[160px] rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] p-2 mb-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventStatusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <p className="text-[11px] uppercase tracking-wider text-(--text-secondary) font-bold">Completion</p>
                                <p className="text-[18px] font-display font-black text-emerald-500">{completionRate}%</p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <p className="text-[11px] uppercase tracking-wider text-(--text-secondary) font-bold">Utilization</p>
                                <p className="text-[18px] font-display font-black text-(--text-primary)">{rosterUtilization}%</p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <p className="text-[11px] uppercase tracking-wider text-(--text-secondary) font-bold">Scheduled</p>
                                <p className="text-[18px] font-display font-black text-(--text-primary)">{scheduledEvents}</p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <p className="text-[11px] uppercase tracking-wider text-(--text-secondary) font-bold">Cancelled</p>
                                <p className="text-[18px] font-display font-black text-red-500">{cancelledEvents}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">Top Clients</h3>
                        <div className="flex flex-col gap-3">
                        {[...clients]
                            .sort((a, b) => b.compliance - a.compliance)
                            .slice(0, 4)
                            .map((client, index) => (
                                <div key={client.id} className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[28px] h-[28px] rounded-full bg-(--border-subtle) flex items-center justify-center font-bold text-[11px] text-(--text-secondary)">#{index + 1}</div>
                                        <span className="font-display font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-display font-bold text-[15px] text-emerald-500">{client.compliance}%</span>
                                        <span className="block font-body text-[10px] text-(--text-secondary) uppercase tracking-wider">Compliance</span>
                                    </div>
                                </div>
                            ))}
                        {!clients.length && (
                            <div className="text-[13px] text-(--text-secondary)">No client records available yet.</div>
                        )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">At-Risk Clients</h3>
                        <div className="flex flex-col gap-3">
                            {atRiskClients.slice(0, 3).map((client) => (
                                <div key={`risk-${client.id}`} className="flex items-center justify-between p-3 rounded-[12px] bg-red-500/5 border border-red-500/20">
                                    <span className="font-display font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                    <span className="font-display font-black text-[14px] text-red-500">{client.compliance}%</span>
                                </div>
                            ))}
                            {!atRiskClients.length && (
                                <div className="text-[13px] text-(--text-secondary)">No risk signals right now.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
