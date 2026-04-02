'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Activity, Target, Download, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function AnalyticsPage() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-subtle) pb-6">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Analytics & Reports</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Monitor your business health, client performance, and revenue growth.</p>
                </div>
                <div className="flex gap-3">
                    <select className="h-[44px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[14px] font-bold text-(--text-primary) outline-none cursor-pointer shadow-sm">
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>Year to Date</option>
                        <option>All Time</option>
                    </select>
                    <button 
                        onClick={() => {
                            const id = toast.loading('Exporting data CSV...')
                            setTimeout(() => toast.success('Report downloaded', { id }), 1000)
                        }}
                        className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) font-bold text-[14px] border border-(--border-default) shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center gap-2"
                    >
                        <Download className="w-[18px] h-[18px]" /> Export
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Total Revenue', value: '$4,850', trend: '+12.5%', isUp: true, icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { title: 'Active Clients', value: '24', trend: '+2', isUp: true, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Avg Compliance', value: '88%', trend: '+4.2%', isUp: true, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Churn Rate', value: '4.1%', trend: '-1.5%', isUp: true, icon: Target, color: 'text-[var(--status-warning)]', bg: 'bg-[var(--status-warning-bg)]/30' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">{kpi.title}</h3>
                            <div className={`w-[32px] h-[32px] rounded-[10px] ${kpi.bg} ${kpi.color} flex items-center justify-center`}><kpi.icon className="w-[16px] h-[16px]" /></div>
                        </div>
                        <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">{kpi.value}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className={`w-[14px] h-[14px] ${kpi.isUp ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
                            <span className={`font-body text-[13px] font-bold ${kpi.isUp ? 'text-emerald-500' : 'text-red-500'}`}>{kpi.trend} vs last period</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart Placeholder */}
                <div className="lg:col-span-2 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-[400px]">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-6">Revenue Growth</h3>
                    <div className="flex-1 border-b border-l border-(--border-subtle) relative flex items-end px-4 gap-4 pb-4">
                        {/* Mock Bars */}
                        {[40, 55, 45, 70, 65, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group h-full">
                                <div className="w-full bg-emerald-500/80 rounded-t-[6px] group-hover:bg-emerald-500 transition-colors shadow-sm relative" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-(--bg-surface) border border-(--border-subtle) shadow-md px-2 py-1 rounded-[6px] font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        ${h * 50}
                                    </div>
                                </div>
                                <span className="absolute -bottom-6 font-body text-[12px] text-(--text-secondary) font-bold">Week {i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-6">Top Performing Clients</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { name: 'Emma Wilson', score: 98, metric: 'Compliance' },
                            { name: 'Jake Mitchell', score: 92, metric: 'Compliance' },
                            { name: 'Marcus L.', score: 89, metric: 'Compliance' },
                            { name: 'Sarah Connor', score: 85, metric: 'Compliance' },
                        ].map((client, i) => (
                            <div key={client.name} className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default)">
                                <div className="flex items-center gap-3">
                                    <div className="w-[28px] h-[28px] rounded-full bg-(--border-subtle) flex items-center justify-center font-bold text-[11px] text-(--text-secondary)">#{i+1}</div>
                                    <span className="font-display font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-display font-bold text-[15px] text-emerald-500">{client.score}%</span>
                                    <span className="block font-body text-[10px] text-(--text-secondary) uppercase tracking-wider">{client.metric}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => toast('Opening detailed client performance report...')}
                        className="w-full mt-auto pt-4 text-emerald-500 font-bold text-[13px] hover:text-emerald-600 transition-colors"
                    >
                        View Detailed Report →
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
