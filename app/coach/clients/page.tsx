'use client'

import React, { useEffect, useState } from 'react'
import { Search, MessageCircle, ChevronRight, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function ClientsPage() {
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('name-asc')

    const {
        clients,
        fetchClients,
        createOrGetDirectThread,
        updateClientStatus,
        addNextAvailableClient,
    } = useCoachPortalStore()

    useEffect(() => {
        void fetchClients()
    }, [fetchClients])

    const filtered = clients.filter(c => {
        if (filter !== 'All' && c.status !== filter) return false
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    }).sort((a, b) => {
        if (sort === 'name-asc') return a.name.localeCompare(b.name)
        if (sort === 'name-desc') return b.name.localeCompare(a.name)
        if (sort === 'compliance-desc') return b.compliance - a.compliance
        if (sort === 'compliance-asc') return a.compliance - b.compliance
        return 0
    })

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Client Roster</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your active clients, monitor compliance, and track progress.</p>
                </div>
                <button
                    onClick={() => {
                        void (async () => {
                            const created = await addNextAvailableClient()
                            if (created) toast.success('Client added to roster.')
                            else toast.info('No unassigned active users available.')
                        })()
                    }}
                    className="h-[40px] w-full sm:w-auto px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors"
                >
                    + Add Client
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 w-full sm:max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <select 
                            value={sort} 
                            onChange={e => setSort(e.target.value)}
                            className="h-[36px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) text-[13px] font-bold text-(--text-secondary) outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="compliance-desc">Compliance (High-Low)</option>
                            <option value="compliance-asc">Compliance (Low-High)</option>
                        </select>
                        <div className="flex gap-2 p-1 bg-(--bg-surface) border border-(--border-default) rounded-[14px]">
                            {['All', 'Active', 'Onboarding', 'Inactive'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn("px-4 py-1.5 rounded-[10px] font-bold text-[13px] transition-colors", filter === f ? "bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm border border-(--border-subtle)" : "text-(--text-secondary) hover:text-(--text-primary)")}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:hidden p-4 flex flex-col gap-3">
                    {filtered.map((client) => (
                        <div key={client.id} className="rounded-[16px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} alt={`${client.name} avatar`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" />
                                <div className="min-w-0">
                                    <p className="font-display font-bold text-[15px] text-(--text-primary) truncate">{client.name}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{client.goal}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                                <span className="px-2 py-1 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary)">Last active: {client.lastActive}</span>
                                <span className={cn("px-2 py-1 rounded-[8px] font-bold text-center", client.compliance >= 80 ? 'bg-emerald-500/10 text-emerald-600' : client.compliance >= 50 ? 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]' : 'bg-red-500/10 text-red-600')}>{client.compliance}% compliance</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        void (async () => {
                                            const threadId = await createOrGetDirectThread(client.id)
                                            if (threadId) toast.success(`Conversation ready with ${client.name}.`)
                                            else toast.error('Unable to open conversation.')
                                        })()
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors"
                                    title="Send Message"
                                >
                                    <MessageCircle className="w-[16px] h-[16px]" />
                                </button>
                                <button 
                                    onClick={() => {
                                        const nextStatus = client.status === 'Active' ? 'Inactive' : 'Active'
                                        void (async () => {
                                            await updateClientStatus(client.linkId, nextStatus)
                                            toast.success(`${client.name} marked as ${nextStatus}.`)
                                        })()
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors"
                                    title="Toggle Active Status"
                                >
                                    <MoreHorizontal className="w-[16px] h-[16px]" />
                                </button>
                                <Link href={`/coach/clients/${client.id}`} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="View Profile">
                                    <ChevronRight className="w-[18px] h-[18px]" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left font-body text-[14px]">
                        <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
                            <tr>
                                <th className="p-4 font-medium pl-6">Client</th>
                                <th className="p-4 font-medium">Goal</th>
                                <th className="p-4 font-medium">Last Active</th>
                                <th className="p-4 font-medium">Compliance %</th>
                                <th className="p-4 font-medium">Trend (7d)</th>
                                <th className="p-4 font-medium text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(client => (
                                <tr key={client.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="p-4 pl-6">
                                        <Link href={`/coach/clients/${client.id}`} className="flex items-center gap-3 w-fit">
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle) group-hover:border-emerald-500 transition-colors" />
                                            <span className="font-display font-bold text-[15px] text-(--text-primary) group-hover:text-emerald-500 transition-colors">{client.name}</span>
                                        </Link>
                                    </td>
                                    <td className="p-4"><span className="text-(--text-secondary) font-medium">{client.goal}</span></td>
                                    <td className="p-4"><span className="text-(--text-primary)">{client.lastActive}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className={cn("font-bold min-w-[36px]", client.compliance >= 80 ? 'text-emerald-500' : client.compliance >= 50 ? 'text-[var(--status-warning)]' : 'text-red-500')}>{client.compliance}%</span>
                                            <div className="h-[6px] w-[60px] bg-(--border-subtle) rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full", client.compliance >= 80 ? 'bg-emerald-500' : client.compliance >= 50 ? 'bg-[var(--status-warning)]' : 'bg-red-500')} style={{ width: `${client.compliance}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-end gap-[2px] h-[24px]">
                                            {client.weightTrend.map((w, i) => {
                                                const min = Math.min(...client.weightTrend)
                                                const max = Math.max(...client.weightTrend)
                                                const range = max - min || 1
                                                const heightPct = 20 + ((w - min) / range) * 80
                                                return <div key={i} className="w-[4px] bg-emerald-500/50 rounded-t-[2px]" style={{ height: `${heightPct}%` }} />
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    void (async () => {
                                                        const threadId = await createOrGetDirectThread(client.id)
                                                        if (threadId) toast.success(`Conversation ready with ${client.name}.`)
                                                        else toast.error('Unable to open conversation.')
                                                    })()
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-emerald-500/10 hover:text-emerald-500 border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer"
                                                title="Send Message"
                                            >
                                                <MessageCircle className="w-[16px] h-[16px]" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const nextStatus = client.status === 'Active' ? 'Inactive' : 'Active'
                                                    void (async () => {
                                                        await updateClientStatus(client.linkId, nextStatus)
                                                        toast.success(`${client.name} marked as ${nextStatus}.`)
                                                    })()
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-emerald-500/10 hover:text-emerald-500 border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer"
                                                title="Toggle Active Status"
                                            >
                                                <MoreHorizontal className="w-[16px] h-[16px]" />
                                            </button>
                                            <Link href={`/coach/clients/${client.id}`} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-emerald-500 hover:border-emerald-500 hover:text-white border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer ml-1" title="View Profile">
                                                <ChevronRight className="w-[18px] h-[18px]" />
                                            </Link>
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
