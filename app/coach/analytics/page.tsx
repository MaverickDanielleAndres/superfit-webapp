'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Activity, Target, Download, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function AnalyticsPage() {
    const { initialize, clients, programs, events } = useCoachPortalStore()

    useEffect(() => {
        void initialize()
    }, [initialize])

    const totalRevenue = useMemo(() => programs.length * 79, [programs.length])
    const avgCompliance = useMemo(() => {
        if (!clients.length) return 0
        return Math.round(clients.reduce((sum, client) => sum + client.compliance, 0) / clients.length)
    }, [clients])
    const onboardingCount = useMemo(
        () => clients.filter((client) => client.status === 'Onboarding').length,
        [clients],
    )

    const complianceBars = useMemo(() => {
        const recentClients = clients.slice(0, 7)
        if (!recentClients.length) return [35, 48, 52, 61, 57, 70, 76]
        return recentClients.map((client) => Math.max(10, Math.min(100, client.compliance)))
    }, [clients])

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-subtle) pb-6">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Analytics & Reports</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Monitor client quality, retention signals, and operational throughput.</p>
                </div>
                <button
                    onClick={() => {
                        const id = toast.loading('Exporting analytics snapshot...')
                        setTimeout(() => toast.success('Snapshot exported', { id }), 800)
                    }}
                    className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) font-bold text-[14px] border border-(--border-default) shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center gap-2"
                >
                    <Download className="w-[18px] h-[18px]" /> Export
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Est. Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, trend: `${programs.length} active programs`, icon: DollarSign },
                    { title: 'Active Clients', value: String(clients.length), trend: `${onboardingCount} onboarding`, icon: Users },
                    { title: 'Avg Compliance', value: `${avgCompliance}%`, trend: 'Based on linked clients', icon: Activity },
                    { title: 'Upcoming Events', value: String(events.length), trend: 'Schedule load', icon: Target },
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
                    <div className="flex-1 border-b border-l border-(--border-subtle) relative flex items-end px-4 gap-4 pb-4">
                        {complianceBars.map((value, index) => (
                            <div key={`${value}-${index}`} className="flex-1 flex flex-col items-center justify-end gap-2 group h-full">
                                <div className="w-full bg-emerald-500/80 rounded-t-[6px] group-hover:bg-emerald-500 transition-colors shadow-sm relative" style={{ height: `${value}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-(--bg-surface) border border-(--border-subtle) shadow-md px-2 py-1 rounded-[6px] font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {value}%
                                    </div>
                                </div>
                                <span className="absolute -bottom-6 font-body text-[12px] text-(--text-secondary) font-bold">C{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-6">Top Clients</h3>
                    <div className="flex flex-col gap-4">
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
            </div>
        </motion.div>
    )
}
