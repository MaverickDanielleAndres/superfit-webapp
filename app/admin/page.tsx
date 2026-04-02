'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, AlertTriangle, Activity, Search, MoreVertical, Ban, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'system'>('users')

    const reportedUsers = [
        { id: 1, name: 'BannedUser99', reason: 'Spam in Community Feed', date: '2 hours ago', status: 'Pending Review' },
        { id: 2, name: 'FakeCoach', reason: 'Unverified credentials', date: '5 hours ago', status: 'Pending Review' },
    ]

    const metrics = [
        { icon: Users, label: 'Total Users', value: '14,204' },
        { icon: Shield, label: 'Active Coaches', value: '342' },
        { icon: AlertTriangle, label: 'Pending Reports', value: '12', alert: true },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <div className="flex items-center gap-3">
                        <Shield className="w-[28px] h-[28px] text-(--status-warning)" />
                        <h1 className="font-display font-bold text-[28px] text-(--text-primary) leading-tight">Admin Console</h1>
                    </div>
                    <p className="font-body text-[14px] text-(--text-secondary) mt-1">Platform moderation, user management, and system health.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => toast('Opening System Settings...')} className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] shadow-sm transition-colors">
                        System Settings
                    </button>
                    <button onClick={() => toast('Opening Add User modal...')} className="h-[40px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors">
                        + Add User
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {metrics.map((metric, i) => (
                    <div key={i} className={cn("bg-(--bg-surface) border rounded-[20px] p-5 flex items-center gap-4 shadow-sm", metric.alert ? "border-(--status-warning)" : "border-(--border-subtle)")}>
                        <div className="w-[48px] h-[48px] rounded-[14px] bg-[var(--bg-elevated)] flex items-center justify-center">
                            <metric.icon className={cn("w-[24px] h-[24px]", metric.alert ? "text-(--status-warning)" : "text-(--text-secondary)")} />
                        </div>
                        <div>
                            <span className="block font-body text-[13px] text-(--text-secondary) font-medium uppercase tracking-wider">{metric.label}</span>
                            <span className="block font-display font-bold text-[24px] text-(--text-primary)">{metric.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm flex flex-col min-h-[500px]">

                <div className="border-b border-(--border-subtle) bg-[var(--bg-elevated)] px-2 pt-2 flex overflow-x-auto no-scrollbar">
                    {[
                        { id: 'users', label: 'Users' },
                        { id: 'coaches', label: 'Coaches' },
                        { id: 'analytics', label: 'Analytics' },
                        { id: 'reports', label: 'Reports' },
                        { id: 'system', label: 'Settings' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn("px-5 sm:px-6 py-4 font-body text-[14px] font-bold border-b-2 transition-all shrink-0", activeTab === tab.id ? 'border-(--text-primary) text-(--text-primary)' : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 sm:p-6 flex-1 bg-(--bg-surface)">
                    {activeTab === 'users' && (
                        <div>
                            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-(--text-tertiary)" />
                                    <input type="text" placeholder="Search users by name or email..." className="w-full h-[40px] pl-11 pr-4 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) text-[14px] font-body outline-none transition-all" />
                                </div>
                                <button onClick={() => {
                                    const id = toast.loading('Exporting CSV...')
                                    setTimeout(() => toast.success('users_export.csv downloaded', { id }), 800)
                                }} className="h-[40px] px-4 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) font-bold text-[13px] hover:bg-(--bg-surface-alt)">
                                    Export CSV
                                </button>
                            </div>

                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden overflow-x-auto">
                                <table className="w-full text-left font-body text-[14px] min-w-[600px]">
                                    <thead className="bg-[var(--bg-elevated)] border-b border-(--border-subtle) text-(--text-secondary) uppercase text-[11px] tracking-wider font-semibold">
                                        <tr>
                                            <th className="p-4 py-3">User</th>
                                            <th className="p-4 py-3">Role</th>
                                            <th className="p-4 py-3">Status</th>
                                            <th className="p-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--border-subtle)">
                                        {[1, 2, 3, 4, 5].map((_, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--bg-elevated)] transition-colors">
                                                <td className="p-4">
                                                    <div className="font-semibold text-(--text-primary)">TestAthlete_{idx}</div>
                                                    <div className="text-[12px] text-(--text-secondary)">user{idx}@example.com</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 rounded-[6px] bg-[var(--bg-base)] text-[11px] font-bold border border-(--border-default)">Client</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5 text-emerald-500 text-[12px] font-bold">
                                                        <div className="w-[6px] h-[6px] rounded-full bg-emerald-500" /> Active
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => {
                                                        if (confirm(`Are you sure you want to ban TestAthlete_${idx}?`)) {
                                                            toast.error(`TestAthlete_${idx} banned`)
                                                        }
                                                    }} className="px-3 py-1.5 rounded-[8px] bg-red-500/10 text-red-500 font-bold text-[12px] hover:bg-red-500/20">Ban</button>
                                                    <button onClick={() => {
                                                        if (confirm(`Are you sure you want to delete TestAthlete_${idx}?`)) {
                                                            toast.success(`User deleted`)
                                                        }
                                                    }} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-(--border-subtle) font-bold text-[12px] hover:bg-[var(--bg-surface)]">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'coaches' as any && (
                        <div>
                            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-(--text-tertiary)" />
                                    <input type="text" placeholder="Search coaches by name..." className="w-full h-[40px] pl-11 pr-4 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) text-[14px] font-body outline-none transition-all" />
                                </div>
                            </div>
                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden overflow-x-auto">
                                <table className="w-full text-left font-body text-[14px] min-w-[600px]">
                                    <thead className="bg-[var(--bg-elevated)] border-b border-(--border-subtle) text-(--text-secondary) uppercase text-[11px] tracking-wider font-semibold">
                                        <tr>
                                            <th className="p-4 py-3">Coach</th>
                                            <th className="p-4 py-3">Clients</th>
                                            <th className="p-4 py-3">Status</th>
                                            <th className="p-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--border-subtle)">
                                        {[1, 2].map((_, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--bg-elevated)] transition-colors">
                                                <td className="p-4 flex items-center gap-3">
                                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=coach${idx}`} className="w-[32px] h-[32px] rounded-full bg-(--bg-base)" />
                                                    <div>
                                                        <div className="font-semibold text-(--text-primary)">ProCoach_{idx}</div>
                                                        <div className="text-[12px] text-(--text-secondary)">coach{idx}@example.com</div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold">
                                                    {Math.floor(Math.random() * 50) + 10}
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 rounded-[6px] bg-blue-500/10 text-blue-600 text-[11px] font-bold uppercase">Verified</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => toast.success('Onboarding flow triggered')} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-(--border-subtle) font-bold text-[12px] hover:bg-[var(--bg-surface)]">Edit Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' as any && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display font-bold text-[18px]">Platform Activity</h3>
                                <select className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[8px] px-3 py-1.5 text-[13px] font-bold outline-none cursor-pointer">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>All Time</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'New Signups', val: '+420' },
                                    { label: 'Workouts Logged', val: '8,432' },
                                    { label: 'Meals Tracked', val: '24,198' },
                                    { label: 'Active Subscriptions', val: '1,204' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[16px] p-5">
                                        <span className="block text-[13px] text-(--text-secondary) font-bold uppercase tracking-wide mb-1">{stat.label}</span>
                                        <span className="block font-display font-black text-[24px] text-emerald-500">{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full h-[250px] bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[16px] flex items-center justify-center">
                                <Activity className="w-[32px] h-[32px] text-(--border-default)" />
                                <span className="ml-2 font-bold text-[14px] text-(--text-tertiary)">Chart Simulator</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Content Moderation Queue</h3>
                                <span className="px-3 py-1 rounded-[6px] bg-amber-500/10 text-amber-600 font-body text-[12px] font-bold uppercase tracking-wider">2 pending</span>
                            </div>

                            {reportedUsers.map(report => (
                                <div key={report.id} className="border border-(--border-subtle) rounded-[16px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-display font-bold text-[16px] text-(--text-primary)">{report.name}</span>
                                            <span className="text-[12px] text-(--text-tertiary)">• {report.date}</span>
                                        </div>
                                        <p className="font-body text-[14px] text-red-500">Reason: {report.reason}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => toast.success('Report dismissed.')} className="h-[36px] px-4 rounded-[8px] bg-[var(--bg-elevated)] border border-(--border-subtle) font-bold text-[13px] flex items-center gap-1.5 hover:bg-[var(--bg-surface)]">
                                            <CheckCircle className="w-[14px] h-[14px]" /> Dismiss
                                        </button>
                                        <button onClick={() => {
                                            if (confirm(`Ban user ${report.name}?`)) toast.error(`User banned`)
                                        }} className="h-[36px] px-4 rounded-[8px] bg-red-500 text-white font-bold text-[13px] flex items-center gap-1.5 hover:bg-red-600">
                                            <Ban className="w-[14px] h-[14px]" /> Ban
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'system' as any && (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <h3 className="font-display font-bold text-[18px]">Platform Settings</h3>
                            <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[16px] p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block font-bold text-[15px]">Maintenance Mode</span>
                                        <span className="text-[13px] text-(--text-secondary)">Disables login and shows maintenance page</span>
                                    </div>
                                    <button onClick={() => toast.success('Toggled Maintenance Mode')} className="w-[44px] h-[24px] rounded-full bg-(--border-default) relative transition-colors"><span className="absolute left-[2px] top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all" /></button>
                                </div>
                                <div className="h-[1px] bg-(--border-subtle) w-full" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block font-bold text-[15px]">New Registrations</span>
                                        <span className="text-[13px] text-(--text-secondary)">Allow new users to sign up</span>
                                    </div>
                                    <button onClick={() => toast.success('Toggled Registrations')} className="w-[44px] h-[24px] rounded-full bg-emerald-500 relative transition-colors"><span className="absolute left-[22px] top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all" /></button>
                                </div>
                                <div className="h-[1px] bg-(--border-subtle) w-full" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block font-bold text-[15px]">Force App Update</span>
                                        <span className="text-[13px] text-(--text-secondary)">Require clients to update their PWA</span>
                                    </div>
                                    <button onClick={() => toast.success('Force update ping sent')} className="font-bold text-[13px] text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-[8px] hover:bg-blue-500/20">Trigger</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </motion.div>
    )
}
