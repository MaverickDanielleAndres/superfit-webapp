'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, Scale, Ruler, Calendar, Share, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'

const volumeData6m = [
    { month: 'Jan', volume: 12000 },
    { month: 'Feb', volume: 14500 },
    { month: 'Mar', volume: 13800 },
    { month: 'Apr', volume: 16200 },
    { month: 'May', volume: 18500 },
    { month: 'Jun', volume: 21000 },
]

const volumeDataMap: Record<string, any[]> = {
    '1m': [{ date: 'W1', volume: 4500 }, { date: 'W2', volume: 4800 }, { date: 'W3', volume: 5100 }, { date: 'W4', volume: 5400 }],
    '3m': [{ date: 'Apr', volume: 16200 }, { date: 'May', volume: 18500 }, { date: 'Jun', volume: 21000 }],
    '6m': volumeData6m,
    '1y': [{ date: 'Q1', volume: 40300 }, { date: 'Q2', volume: 55700 }, { date: 'Q3', volume: 61200 }, { date: 'Q4', volume: 68000 }]
}

const weightData1m = [
    { date: 'Week 1', weight: 85.2 },
    { date: 'Week 2', weight: 84.8 },
    { date: 'Week 3', weight: 84.1 },
    { date: 'Week 4', weight: 83.5 },
    { date: 'Week 5', weight: 82.9 },
]

const weightDataMap: Record<string, any[]> = {
    '1m': weightData1m,
    '3m': [{ date: 'Apr', weight: 86.1 }, { date: 'May', weight: 84.5 }, { date: 'Jun', weight: 82.9 }],
    '6m': [{ date: 'Jan', weight: 88.0 }, { date: 'Feb', weight: 87.2 }, { date: 'Mar', weight: 86.5 }, { date: 'Apr', weight: 85.1 }, { date: 'May', weight: 84.0 }, { date: 'Jun', weight: 82.9 }],
    '1y': [{ date: 'Jul', weight: 92.0 }, { date: 'Oct', weight: 89.5 }, { date: 'Jan', weight: 88.0 }, { date: 'Apr', weight: 85.1 }, { date: 'Jul', weight: 82.9 }]
}

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<'workouts' | 'body'>('workouts')
    const [timeRange, setTimeRange] = useState('6m')

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary) leading-tight">Analytics</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Track your strength gains, volume, and body transformations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => alert("Report exported successfully!")}
                        className="h-[40px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) transition-all flex items-center gap-2 font-body font-semibold text-[13px] cursor-pointer"
                    >
                        <Download className="w-[16px] h-[16px]" /> Export
                    </button>
                    <button
                        onClick={() => alert("Share dialog opened!")}
                        className="h-[40px] px-4 rounded-[12px] bg-(--accent) text-white hover:bg-(--accent-hover) transition-all flex items-center gap-2 font-display font-bold text-[13px] cursor-pointer"
                    >
                        <Share className="w-[16px] h-[16px]" /> Share Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-(--border-subtle) mb-4">
                <button
                    onClick={() => setActiveTab('workouts')}
                    className={cn("pb-4 px-2 mr-6 font-display font-bold text-[16px] transition-all relative", activeTab === 'workouts' ? 'text-(--text-primary)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                >
                    Workout Performance
                    {activeTab === 'workouts' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-(--accent) rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('body')}
                    className={cn("pb-4 px-2 font-display font-bold text-[16px] transition-all relative", activeTab === 'body' ? 'text-(--text-primary)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                >
                    Body Metrics
                    {activeTab === 'body' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-(--accent) rounded-t-full" />}
                </button>
            </div>

            {activeTab === 'workouts' ? (
                <div className="flex flex-col gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Total Volume', value: '21,000 kg', trend: '+12%', icon: Activity },
                            { title: 'Workouts Completed', value: '18', trend: '+2', icon: Calendar },
                            { title: 'Estimated 1RM (Squat)', value: '145 kg', trend: '+5 kg', icon: TrendingUp },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm flex items-center justify-between hover:border-(--border-default) transition-colors">
                                <div>
                                    <span className="block font-body text-[13px] text-(--text-secondary) mb-1">{kpi.title}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display font-bold text-[24px] text-(--text-primary)">{kpi.value}</span>
                                        <span className="font-body text-[13px] font-semibold text-(--status-success)">{kpi.trend}</span>
                                    </div>
                                </div>
                                <div className="w-[48px] h-[48px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <kpi.icon className="w-[24px] h-[24px] text-(--accent)" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Volume Chart */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Training Volume Over Time</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">Total weight lifted across all exercises (kg)</p>
                            </div>
                            <div className="flex bg-[var(--bg-elevated)] p-1 rounded-[10px]">
                                {['1m', '3m', '6m', '1y'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={cn("px-3 py-1.5 rounded-[6px] font-body text-[12px] font-bold transition-all", timeRange === r ? 'bg-(--bg-surface) shadow-sm text-(--text-primary)' : 'text-(--text-secondary)')}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={volumeDataMap[timeRange]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis dataKey={timeRange === '6m' ? 'month' : 'date'} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} tickFormatter={(val) => `${val / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-elevated)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'var(--text-primary)' }}
                                        itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="volume" fill="var(--chart-blue)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Body Metrics KPI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { title: 'Body Weight', value: '82.9 kg', trend: '-2.3 kg', icon: Scale, type: 'loss' },
                            { title: 'Body Fat %', value: '14.5%', trend: '-1.2%', icon: Activity, type: 'loss' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm flex items-center justify-between hover:border-(--border-default) transition-colors">
                                <div>
                                    <span className="block font-body text-[13px] text-(--text-secondary) mb-1">{kpi.title}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display font-bold text-[24px] text-(--text-primary)">{kpi.value}</span>
                                        <span className={cn("font-body text-[13px] font-semibold", kpi.type === 'loss' ? 'text-(--status-success)' : 'text-(--status-danger)')}>{kpi.trend}</span>
                                    </div>
                                </div>
                                <div className="w-[48px] h-[48px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <kpi.icon className="w-[24px] h-[24px] text-(--accent)" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Weight Chart */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Weight Trend</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">Daily moving average</p>
                            </div>
                            <div className="flex bg-[var(--bg-elevated)] p-1 rounded-[10px]">
                                {['1m', '3m', '6m', '1y'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={cn("px-3 py-1.5 rounded-[6px] font-body text-[12px] font-bold transition-all", timeRange === r ? 'bg-(--bg-surface) shadow-sm text-(--text-primary)' : 'text-(--text-secondary)')}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weightDataMap[timeRange]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="weightColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} dy={10} />
                                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'var(--text-primary)' }}
                                        itemStyle={{ color: 'var(--status-success)', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="weight" stroke="var(--status-success)" strokeWidth={3} fillOpacity={1} fill="url(#weightColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

        </motion.div>
    )
}
