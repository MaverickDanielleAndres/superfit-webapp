'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Calendar as CalendarIcon, FilePlus, MessageSquare, Plus, ChevronRight, Video, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CoachDashboardPage() {
    const [activeTab, setActiveTab] = useState<'roster' | 'content'>('roster')

    const clients = [
        { id: '1', name: 'Alex Thompson', plan: 'Hybrid Athlete', status: 'Active', nextCheckIn: 'Today', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop' },
        { id: '2', name: 'Sarah Jenkins', plan: 'Powerlifting Prep', status: 'Pending Review', nextCheckIn: 'Tomorrow', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop' },
        { id: '3', name: 'David Kim', plan: 'Fat Loss Phase I', status: 'Active', nextCheckIn: 'In 3 days', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&fit=crop' }
    ]

    const metrics = [
        { icon: Users, label: 'Active Clients', value: '18', trend: '+2 this month' },
        { icon: DollarSign, label: 'Monthly Revenue', value: '$4,250', trend: '+15% vs last month' },
        { icon: MessageSquare, label: 'Unread Messages', value: '5', trend: 'Requires attention' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary) leading-tight">Coach Portal</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your clients, content, and business metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-[40px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) transition-all flex items-center gap-2 font-body font-semibold text-[13px]">
                        <CalendarIcon className="w-[16px] h-[16px]" /> Schedule
                    </button>
                    <button className="h-[40px] px-4 rounded-[12px] bg-(--text-primary) text-(--bg-base) transition-all flex items-center gap-2 font-display font-bold text-[13px]">
                        <Plus className="w-[16px] h-[16px]" /> Invite Client
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {metrics.map((metric, i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 flex items-center gap-4 hover:border-(--border-default) transition-colors shadow-sm">
                        <div className="w-[48px] h-[48px] rounded-[14px] bg-[var(--bg-elevated)] flex items-center justify-center">
                            <metric.icon className="w-[24px] h-[24px] text-(--accent)" />
                        </div>
                        <div>
                            <span className="block font-body text-[13px] text-(--text-secondary) font-medium uppercase tracking-wider">{metric.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="block font-display font-bold text-[24px] text-(--text-primary)">{metric.value}</span>
                                <span className={cn("font-body text-[11px] font-semibold", i === 2 ? "text-(--status-warning)" : "text-(--status-success)")}>{metric.trend}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar / Tools */}
                <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-4">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('roster')}
                            className={cn("w-full h-[48px] rounded-[12px] flex items-center gap-3 px-4 transition-all font-body font-semibold text-[14px]", activeTab === 'roster' ? 'bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            <Users className="w-[18px] h-[18px]" /> Client Roster
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={cn("w-full h-[48px] rounded-[12px] flex items-center gap-3 px-4 transition-all font-body font-semibold text-[14px]", activeTab === 'content' ? 'bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            <FilePlus className="w-[18px] h-[18px]" /> Content Publisher
                        </button>
                    </div>

                    <div className="bg-(--accent-bg-strong) bg-opacity-30 border border-(--accent) border-opacity-30 rounded-[20px] p-5 text-center mt-auto">
                        <Video className="w-[24px] h-[24px] text-(--accent) mx-auto mb-3" />
                        <h3 className="font-display font-bold text-[16px] text-(--text-primary) mb-1">Form Checks</h3>
                        <p className="font-body text-[13px] text-(--text-secondary) mb-4">You have 3 new client videos to review.</p>
                        <button className="w-full py-2 bg-(--accent) text-white rounded-[10px] font-display font-bold text-[13px]">Review Now</button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1">
                    {activeTab === 'roster' ? (
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-(--border-subtle) flex items-center justify-between">
                                <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Active Clients</h2>
                                <button className="text-(--accent) font-body text-[13px] font-semibold">View All</button>
                            </div>

                            <div className="flex flex-col divide-y divide-(--border-subtle)">
                                {clients.map(client => (
                                    <div key={client.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <img src={client.avatar} alt={client.name} className="w-[48px] h-[48px] rounded-full object-cover border border-(--border-subtle)" />
                                            <div>
                                                <h3 className="font-display font-bold text-[16px] text-(--text-primary) leading-none mb-1">{client.name}</h3>
                                                <span className="font-body text-[13px] text-(--text-secondary)">{client.plan}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden sm:block">
                                                <span className="block font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold">Next Check-in</span>
                                                <span className="font-body text-[14px] text-(--text-primary) font-medium">{client.nextCheckIn}</span>
                                            </div>
                                            <span className={cn("px-3 py-1 rounded-full font-body text-[12px] font-bold", client.status === 'Active' ? 'bg-(--status-success) bg-opacity-20 text-(--status-success)' : 'bg-(--status-warning) bg-opacity-20 text-(--status-warning)')}>
                                                {client.status}
                                            </span>
                                            <ChevronRight className="w-[20px] h-[20px] text-(--text-tertiary) group-hover:text-(--text-primary) transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                            <div className="text-center py-10">
                                <div className="w-[64px] h-[64px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4 text-(--text-secondary)">
                                    <FilePlus className="w-[32px] h-[32px]" />
                                </div>
                                <h2 className="font-display font-bold text-[20px] text-(--text-primary) mb-2">Publish Content</h2>
                                <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px] mx-auto mb-6">Create workout programs, nutrition guides, or community posts for your roster.</p>

                                <div className="flex justify-center gap-4">
                                    <button className="px-6 py-2.5 rounded-[12px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[14px]">New Workout Plan</button>
                                    <button className="px-6 py-2.5 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) font-body font-bold text-[14px] hover:bg-(--border-subtle) transition-colors border border-(--border-default)">Post to Feed</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
