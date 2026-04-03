'use client'

import React, { useEffect, useState } from 'react'
import { Search, ShieldCheck, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { useRouter } from 'next/navigation'

export default function AdminCoachesPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const { coaches, fetchCoaches, updateUserStatus } = useAdminPortalStore()

    useEffect(() => {
        void fetchCoaches()
    }, [fetchCoaches])

    const filteredCoaches = coaches.filter(coach => 
        coach.name.toLowerCase().includes(search.toLowerCase()) || 
        coach.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Coach Directory</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage certified coaches, verify credentials, and monitor performance.</p>
                </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search coaches..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left font-body text-[14px]">
                        <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
                            <tr>
                                <th className="p-4 font-medium pl-6">Coach</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Active Clients</th>
                                <th className="p-4 font-medium">MRR</th>
                                <th className="p-4 font-medium text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCoaches.map(coach => (
                                <tr key={coach.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="p-4 pl-6 flex items-center gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${coach.name}`} alt={`${coach.name} avatar`} className="w-[40px] h-[40px] rounded-[10px] border border-(--border-subtle)" />
                                        <div>
                                            <span className="font-display font-bold text-[15px] text-(--text-primary) block">{coach.name}</span>
                                            <span className="font-body text-[12px] text-(--text-secondary) block">{coach.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn("px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider", coach.status === 'Verified' ? 'bg-blue-500/10 text-blue-600' : 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]')}>{coach.status}</span>
                                    </td>
                                    <td className="p-4 font-medium text-(--text-primary)">{coach.clients}</td>
                                    <td className="p-4 font-medium text-(--text-primary)">{coach.revenue}</td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-(--text-secondary)">
                                            <button
                                                onClick={() => {
                                                    router.push(`/admin/applications?email=${encodeURIComponent(coach.email)}`)
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                                title="View Verification Details"
                                            >
                                                <ShieldCheck className="w-[16px] h-[16px]" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    void (async () => {
                                                        const nextStatus = coach.status === 'Suspended' ? 'Active' : 'Suspended'
                                                        await updateUserStatus(coach.id, nextStatus)
                                                        toast.success(`${coach.name} marked as ${nextStatus}.`)
                                                    })()
                                                }} 
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors" title="More Actions">
                                                <MoreVertical className="w-[16px] h-[16px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    )
}
