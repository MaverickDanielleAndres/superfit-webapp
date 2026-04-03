'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'

export default function AdminPage() {
    const router = useRouter()
    const {
        initialize,
        users,
        coaches,
        applications,
        reports,
        settings,
        error,
        updateReportStatus,
    } = useAdminPortalStore()

    useEffect(() => {
        void initialize()
    }, [initialize])

    const pendingApplications = useMemo(
        () => applications.filter((application) => application.status === 'Pending').length,
        [applications],
    )
    const pendingReports = useMemo(
        () => reports.filter((report) => report.status === 'Pending').length,
        [reports],
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Shield className="w-[26px] h-[26px] text-(--status-warning)" />
                        <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Admin Console</h1>
                    </div>
                    <p className="font-body text-[14px] text-(--text-secondary) mt-1">Live moderation, approvals, and account governance.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/admin/settings')}
                        className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] transition-colors"
                    >
                        System Settings
                    </button>
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="h-[40px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] hover:bg-emerald-600 transition-colors"
                    >
                        Manage Users
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Accounts', value: String(users.length), icon: Users },
                    { label: 'Coaches', value: String(coaches.length), icon: UserCheck },
                    { label: 'Pending Applications', value: String(pendingApplications), icon: Shield },
                    { label: 'Open Reports', value: String(pendingReports), icon: AlertTriangle },
                ].map((metric) => (
                    <div key={metric.label} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="block text-[12px] uppercase tracking-wider font-bold text-(--text-secondary)">{metric.label}</span>
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
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Coach Applications</h2>
                        <button onClick={() => router.push('/admin/applications')} className="text-[12px] font-bold text-emerald-500 hover:text-emerald-600">Review All</button>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {applications.slice(0, 4).map((application) => (
                            <div key={application.id} className="p-3 rounded-[12px] border border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{application.name}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{application.email}</p>
                                </div>
                                <span className="px-2 py-1 rounded-[6px] text-[11px] uppercase font-bold bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]">
                                    {application.status}
                                </span>
                            </div>
                        ))}
                        {!applications.length && (
                            <div className="p-4 text-[13px] text-(--text-secondary)">No coach applications yet.</div>
                        )}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Moderation Queue</h2>
                        <button onClick={() => router.push('/admin/content')} className="text-[12px] font-bold text-emerald-500 hover:text-emerald-600">Open Queue</button>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {reports.slice(0, 4).map((report) => (
                            <div key={report.id} className="p-3 rounded-[12px] border border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{report.reason}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{report.reporter} • {report.createdAt}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        void (async () => {
                                            await updateReportStatus(report.id, 'Dismissed')
                                            toast.success('Report dismissed')
                                        })()
                                    }}
                                    className="h-[30px] px-3 rounded-[8px] bg-[var(--bg-surface)] border border-(--border-default) text-[12px] font-bold text-(--text-primary) hover:bg-[var(--bg-surface-alt)]"
                                >
                                    Dismiss
                                </button>
                            </div>
                        ))}
                        {!reports.length && (
                            <div className="p-4 text-[13px] text-(--text-secondary)">No reports in queue.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm p-4 flex items-center justify-between">
                <div>
                    <p className="font-bold text-[14px] text-(--text-primary)">Platform Controls</p>
                    <p className="text-[12px] text-(--text-secondary)">Maintenance mode: {settings.maintenanceMode ? 'Enabled' : 'Disabled'} • Platform fee: {settings.platformFeePercent}%</p>
                </div>
                <button
                    onClick={() => router.push('/admin/settings')}
                    className="h-[36px] px-4 rounded-[10px] bg-(--text-primary) text-(--bg-base) font-bold text-[13px] flex items-center gap-2"
                >
                    Open Settings <ArrowRight className="w-[14px] h-[14px]" />
                </button>
            </div>
        </motion.div>
    )
}
