'use client'

import React, { useEffect, useState } from 'react'
import { Search, MessageCircle, ChevronRight, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { useRouter, useSearchParams } from 'next/navigation'
import { requestApi } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface AvailableClientCandidate {
    id: string
    name: string
    email: string
    goal: string
    hasConnection: boolean
    connectionType?: 'none' | 'friend' | 'follow' | 'friend_follow'
    hasValidInteraction: boolean
    eligibilityStatus: 'eligible' | 'needs_override'
}

export default function ClientsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('name-asc')
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [candidateSearch, setCandidateSearch] = useState('')
    const [availableCandidates, setAvailableCandidates] = useState<AvailableClientCandidate[]>([])
    const [isCandidatesLoading, setIsCandidatesLoading] = useState(false)
    const [overrideReasonByClientId, setOverrideReasonByClientId] = useState<Record<string, string>>({})
    const [isAddingClientId, setIsAddingClientId] = useState<string | null>(null)
    const [isQuickAdding, setIsQuickAdding] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)
    const [isConfirming, setIsConfirming] = useState(false)

    const {
        clients,
        fetchClients,
        createOrGetDirectThread,
        updateClientStatus,
        addNextAvailableClient,
    } = useCoachPortalData()

    useEffect(() => {
        let isMounted = true

        void (async () => {
            setIsPageLoading(true)
            await fetchClients()
            if (isMounted) setIsPageLoading(false)
        })()

        return () => {
            isMounted = false
        }
    }, [fetchClients])

    useEffect(() => {
        if (!isPickerOpen) return

        const timer = window.setTimeout(() => {
            void loadAvailableCandidates(candidateSearch)
        }, 180)

        return () => {
            window.clearTimeout(timer)
        }
    }, [candidateSearch, isPickerOpen])

    useEffect(() => {
        const shouldOpenPicker = searchParams.get('openPicker') === '1'
        if (!shouldOpenPicker) return

        setIsPickerOpen(true)
        void loadAvailableCandidates('')
    }, [searchParams])

    const loadAvailableCandidates = async (searchText: string) => {
        setIsCandidatesLoading(true)
        try {
            const query = new URLSearchParams()
            if (searchText.trim().length > 0) {
                query.set('search', searchText.trim())
            }

            const response = await requestApi<{ candidates: AvailableClientCandidate[] }>(`/api/v1/coach/clients/available?${query.toString()}`)
            setAvailableCandidates(Array.isArray(response.data.candidates) ? response.data.candidates : [])
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to load available clients.')
            setAvailableCandidates([])
        } finally {
            setIsCandidatesLoading(false)
        }
    }

    const addClientFromPicker = async (candidate: AvailableClientCandidate) => {
        const overrideReason = (overrideReasonByClientId[candidate.id] || '').trim()

        if (!candidate.hasValidInteraction && overrideReason.length < 10) {
            toast.info('Add a short override reason (at least 10 characters) to add this client.')
            return
        }

        setIsAddingClientId(candidate.id)
        try {
            const response = await requestApi<{
                added: boolean
                reason?: string
                manualOverride?: boolean
            }>('/api/v1/coach/clients', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'manual',
                    clientId: candidate.id,
                    overrideReason: candidate.hasValidInteraction ? undefined : overrideReason,
                }),
            })

            if (!response.data.added) {
                if (response.data.reason === 'NO_CLIENT_WITH_VALID_INTERACTION') {
                    toast.info('This client needs a valid prior interaction, or an override reason.')
                    return
                }

                if (response.data.reason === 'CLIENT_CAP_REACHED') {
                    toast.info('Client cap reached. Increase your marketplace cap or archive an inactive client first.')
                    return
                }

                if (response.data.reason === 'ALREADY_LINKED') {
                    toast.info('This client is already linked to your roster.')
                    return
                }

                toast.error('Unable to add client right now.')
                return
            }

            await fetchClients({ force: true })
            setAvailableCandidates((current) => current.filter((entry) => entry.id !== candidate.id))
            toast.success(response.data.manualOverride ? 'Client added with manual override.' : 'Client added to roster.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to add client right now.')
        } finally {
            setIsAddingClientId(null)
        }
    }

    const openConfirmation = (
        dialog: { title: string; message: string; confirmText: string; tone?: 'default' | 'danger' },
        action: () => Promise<void>,
    ) => {
        setConfirmDialog({
            title: dialog.title,
            message: dialog.message,
            confirmText: dialog.confirmText,
            tone: dialog.tone || 'default',
        })
        setPendingConfirmationAction(() => action)
    }

    const closeConfirmation = () => {
        if (isConfirming) return
        setConfirmDialog(null)
        setPendingConfirmationAction(null)
    }

    const runConfirmedAction = async () => {
        if (!pendingConfirmationAction) return

        setIsConfirming(true)
        try {
            await pendingConfirmationAction()
            setConfirmDialog(null)
            setPendingConfirmationAction(null)
        } finally {
            setIsConfirming(false)
        }
    }

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

    if (isPageLoading && clients.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
                <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
                <div className="h-[520px] rounded-[24px] bg-[var(--bg-elevated)]" />
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Client Roster</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your active clients, monitor compliance, and track progress.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setIsPickerOpen(true)
                            void loadAvailableCandidates(candidateSearch)
                        }}
                        className="h-[40px] w-full sm:w-auto px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                        + Add Client
                    </button>
                    <button
                        onClick={() => {
                            openConfirmation(
                                {
                                    title: 'Auto Assign Best Match?',
                                    message: 'This will assign the best available friend/connection candidate to your roster.',
                                    confirmText: 'Auto Assign',
                                },
                                async () => {
                                    if (isQuickAdding) return
                                    setIsQuickAdding(true)
                                                    try {
                                                        const result = await addNextAvailableClient()
                                                        if (result.added) {
                                                            toast.success(result.manualOverride ? 'Client added using hybrid fallback.' : 'Client added to roster.')
                                                            return
                                                        }

                                                        if (result.reason === 'CLIENT_CAP_REACHED') {
                                                            toast.info('Client cap reached. Increase your marketplace cap or archive an inactive client first.')
                                                            return
                                                        }

                                                        if (result.reason === 'NO_CLIENT_WITH_VALID_INTERACTION') {
                                                            toast.info('No eligible friends, connections, or prior interactions found. Opening user picker...')
                                                            setIsPickerOpen(true)
                                                            await loadAvailableCandidates('')
                                                            return
                                                        }

                                                        if (result.reason === 'NO_AVAILABLE_CLIENTS') {
                                                            toast.info('No unassigned active users available.')
                                                            return
                                                        }

                                                        toast.error('Unable to add client right now.')
                                                    } finally {
                                                        setIsQuickAdding(false)
                                                    }
                                },
                            )
                        }}
                        disabled={isQuickAdding}
                        className="h-[40px] w-full sm:w-auto px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors"
                    >
                        {isQuickAdding ? 'Adding...' : 'Auto Assign'}
                    </button>
                </div>
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                            if (threadId) {
                                                router.push(`/coach/messages?thread=${threadId}`)
                                                return
                                            }

                                            toast.error('Unable to open conversation.')
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
                                        openConfirmation(
                                            {
                                                title: `Mark ${client.name} as ${nextStatus}?`,
                                                message: 'This updates the roster status and affects active client metrics.',
                                                confirmText: 'Update Status',
                                            },
                                            async () => {
                                                await updateClientStatus(client.linkId, nextStatus)
                                                toast.success(`${client.name} marked as ${nextStatus}.`)
                                            },
                                        )
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
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} alt={`${client.name} avatar`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle) group-hover:border-emerald-500 transition-colors" />
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
                                                        if (threadId) {
                                                            router.push(`/coach/messages?thread=${threadId}`)
                                                            return
                                                        }

                                                        toast.error('Unable to open conversation.')
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
                                                    openConfirmation(
                                                        {
                                                            title: `Mark ${client.name} as ${nextStatus}?`,
                                                            message: 'This updates the roster status and affects active client metrics.',
                                                            confirmText: 'Update Status',
                                                        },
                                                        async () => {
                                                            await updateClientStatus(client.linkId, nextStatus)
                                                            toast.success(`${client.name} marked as ${nextStatus}.`)
                                                        },
                                                    )
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

            {isPickerOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="w-full max-w-[820px] max-h-[85vh] overflow-hidden rounded-[20px] bg-(--bg-surface) border border-(--border-subtle) shadow-lg flex flex-col">
                        <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Add Client from Active Users</h2>
                                <p className="text-[12px] text-(--text-secondary)">Friends or social connections are prioritized. Others require a short override reason.</p>
                            </div>
                            <button
                                onClick={() => setIsPickerOpen(false)}
                                className="h-[32px] px-3 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary) hover:text-(--text-primary)"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-4 border-b border-(--border-subtle) flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                <input
                                    type="text"
                                    value={candidateSearch}
                                    onChange={(event) => setCandidateSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            void loadAvailableCandidates(candidateSearch)
                                        }
                                    }}
                                    placeholder="Search active users by name or email"
                                    className="w-full h-[40px] pl-9 pr-3 rounded-[10px] border border-(--border-default) bg-(--bg-surface) text-[13px] outline-none focus:border-emerald-500"
                                />
                            </div>
                            <button
                                onClick={() => { void loadAvailableCandidates(candidateSearch) }}
                                className="h-[40px] px-4 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600"
                            >
                                Search
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
                            {isCandidatesLoading && (
                                <div className="text-[13px] text-(--text-secondary)">Loading candidates...</div>
                            )}

                            {!isCandidatesLoading && availableCandidates.length === 0 && (
                                <div className="text-[13px] text-(--text-secondary)">No available users matched your query.</div>
                            )}

                            {!isCandidatesLoading && availableCandidates.map((candidate) => {
                                const overrideReason = overrideReasonByClientId[candidate.id] || ''
                                const isNeedsOverride = !candidate.hasValidInteraction

                                return (
                                    <div key={candidate.id} className="rounded-[14px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-3 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-display font-bold text-[14px] text-(--text-primary)">{candidate.name}</p>
                                                <p className="text-[12px] text-(--text-secondary)">{candidate.email || 'No email available'}</p>
                                                <p className="text-[12px] text-(--text-tertiary)">Goal: {candidate.goal}</p>
                                                {candidate.hasConnection && (
                                                    <p className="text-[12px] text-emerald-600 font-bold">
                                                        {candidate.connectionType === 'friend_follow'
                                                            ? 'Friend + follow connection'
                                                            : candidate.connectionType === 'friend'
                                                                ? 'Friend connection'
                                                                : 'Follow connection'}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={cn(
                                                'px-2 py-1 rounded-[8px] text-[11px] font-bold uppercase tracking-wide',
                                                candidate.hasValidInteraction
                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                    : 'bg-amber-500/10 text-amber-600',
                                            )}>
                                                {candidate.hasValidInteraction ? 'Eligible' : 'Needs override'}
                                            </span>
                                        </div>

                                        {isNeedsOverride && (
                                            <textarea
                                                value={overrideReason}
                                                onChange={(event) => {
                                                    const nextValue = event.target.value
                                                    setOverrideReasonByClientId((current) => ({
                                                        ...current,
                                                        [candidate.id]: nextValue,
                                                    }))
                                                }}
                                                placeholder="Required override reason (minimum 10 characters)"
                                                className="w-full h-[72px] resize-none rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-2 text-[12px] outline-none focus:border-amber-500"
                                            />
                                        )}

                                        <div className="flex items-center justify-end">
                                            <button
                                                onClick={() => {
                                                    openConfirmation(
                                                        {
                                                            title: isNeedsOverride ? 'Override and Add Client?' : 'Add Client?',
                                                            message: isNeedsOverride
                                                                ? 'This client has no strong interaction signal. Your override reason will be recorded.'
                                                                : 'This client will be added to your active roster.',
                                                            confirmText: isNeedsOverride ? 'Override & Add' : 'Add Client',
                                                        },
                                                        async () => {
                                                            await addClientFromPicker(candidate)
                                                        },
                                                    )
                                                }}
                                                disabled={isAddingClientId === candidate.id}
                                                className={cn(
                                                    'h-[34px] px-4 rounded-[10px] text-[12px] font-bold transition-colors',
                                                    isNeedsOverride
                                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                        : 'bg-emerald-500 text-white hover:bg-emerald-600',
                                                )}
                                            >
                                                {isAddingClientId === candidate.id
                                                    ? 'Adding...'
                                                    : isNeedsOverride
                                                        ? 'Override & Add'
                                                        : 'Add Client'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                title={confirmDialog?.title || 'Confirm Action'}
                message={confirmDialog?.message || ''}
                confirmText={confirmDialog?.confirmText || 'Confirm'}
                tone={confirmDialog?.tone || 'default'}
                isLoading={isConfirming}
                onCancel={closeConfirmation}
                onConfirm={() => {
                    void runConfirmedAction()
                }}
            />
        </motion.div>
    )
}
