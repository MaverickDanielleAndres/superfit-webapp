'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, TrendingUp, Tags, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'
import { useRouter } from 'next/navigation'
import { requestApi } from '@/lib/api/client'

export default function MarketplacePage() {
    const router = useRouter()
    const [isActive, setIsActive] = useState(true)
    const [displayName, setDisplayName] = useState('')
    const [headline, setHeadline] = useState('')
    const [specialties, setSpecialties] = useState('')
    const [coverUrl, setCoverUrl] = useState('')
    const [clientCap, setClientCap] = useState('30')
    const [monthlyRevenue, setMonthlyRevenue] = useState(0)
    const [transactionCount, setTransactionCount] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const { initialize, programs, clients } = useCoachPortalStore()

    useEffect(() => {
        void initialize()
    }, [initialize])

    useEffect(() => {
        void (async () => {
            if (!isSupabaseAuthEnabled()) return

            try {
                const response = await requestApi<{
                    displayName: string
                    headline: string
                    specialties: string[]
                    coverUrl: string
                    clientCap: number
                    isActive: boolean
                    monthlyRevenueCents: number
                    transactionCount: number
                }>('/api/v1/coach/marketplace')

                setDisplayName(String(response.data.displayName || 'Coach Profile'))
                setHeadline(String(response.data.headline || 'Strength and body composition coaching'))
                setSpecialties(Array.isArray(response.data.specialties) ? response.data.specialties.join(', ') : '')
                setCoverUrl(String(response.data.coverUrl || ''))
                setClientCap(String(response.data.clientCap || 30))
                setIsActive(Boolean(response.data.isActive))
                setTransactionCount(Number(response.data.transactionCount || 0))
                setMonthlyRevenue(Number(response.data.monthlyRevenueCents || 0) / 100)
            } catch (error) {
                toast.error(getErrorMessage(error))
            }
        })()
    }, [])

    const activeClients = useMemo(
        () => clients.filter((client) => client.status === 'Active').length,
        [clients],
    )

    const conversionRate = useMemo(() => {
        const cap = Number(clientCap) || 1
        return Math.min(100, (activeClients / cap) * 100)
    }, [activeClients, clientCap])

    const handleSave = async () => {
        if (!isSupabaseAuthEnabled()) {
            toast.success('Simulation mode: marketplace profile updated locally.')
            return
        }

        setIsSaving(true)

        try {
            await requestApi<{ saved: boolean }>('/api/v1/coach/marketplace', {
                method: 'PATCH',
                body: JSON.stringify({
                    displayName: displayName.trim(),
                    headline: headline.trim(),
                    specialties: specialties
                        .split(',')
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    coverUrl: coverUrl.trim() || null,
                    clientCap: Number(clientCap) || 30,
                    isActive,
                }),
            })

            toast.success('Marketplace profile updated.')
        } catch (error) {
            toast.error(getErrorMessage(error))
        }

        setIsSaving(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Marketplace Listing</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your public profile and subscription tiers to attract new clients.</p>
                </div>
                <div className="flex items-center gap-3 bg-(--bg-surface) border border-(--border-subtle) px-4 py-2 rounded-[16px] shadow-sm">
                    <span className="font-body text-[13px] font-bold text-(--text-secondary)">Status:</span>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={cn("relative w-[44px] h-[24px] rounded-full transition-colors", isActive ? "bg-emerald-500" : "bg-(--border-subtle)")}
                    >
                        <div className={cn("absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all shadow-md", isActive ? "left-[22px]" : "left-[2px]")} />
                    </button>
                    <span className={cn("font-display font-bold text-[14px]", isActive ? "text-emerald-500" : "text-(--text-tertiary)")}>{isActive ? 'Public' : 'Hidden'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Settings */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--border-subtle)">
                            <div className="w-[40px] h-[40px] rounded-[10px] bg-blue-500/10 text-blue-500 flex items-center justify-center"><Globe className="w-[20px] h-[20px]" /></div>
                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary)">Profile Information</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">This is what potential clients see in the discovery tab.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Header Image</label>
                                <div className="h-[160px] rounded-[16px] border-2 border-dashed border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col items-center justify-center text-(--text-tertiary) hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors group">
                                    <ImageIcon className="w-[32px] h-[32px] mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-body font-bold text-[14px]">Paste your cover image URL</span>
                                    <span className="font-body text-[12px] opacity-70">Use any publicly accessible image URL</span>
                                </div>
                                <input
                                    value={coverUrl}
                                    onChange={(event) => setCoverUrl(event.target.value)}
                                    placeholder="https://..."
                                    className="h-[42px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Display Name</label>
                                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} type="text" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Client Cap</label>
                                    <input value={clientCap} onChange={(event) => setClientCap(event.target.value)} type="number" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Public Headline</label>
                                <input value={headline} onChange={(event) => setHeadline(event.target.value)} type="text" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Specialties <span className="font-normal text-(--text-tertiary)">(Comma separated)</span></label>
                                <input value={specialties} onChange={(event) => setSpecialties(event.target.value)} type="text" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Marketplace Notes</label>
                                <textarea rows={4} value={headline} onChange={(event) => setHeadline(event.target.value)} className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full resize-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats & Tiers */}
                <div className="flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4 flex items-center gap-2"><TrendingUp className="w-[18px] h-[18px] text-emerald-500" /> Marketplace Stats</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
                                <span className="font-body text-[14px] text-(--text-secondary)">Active Clients</span>
                                <span className="font-display font-bold text-[18px] text-(--text-primary)">{activeClients}</span>
                            </div>
                            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
                                <span className="font-body text-[14px] text-(--text-secondary)">Roster Utilization</span>
                                <span className="font-display font-bold text-[18px] text-emerald-500">{conversionRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body text-[14px] text-(--text-secondary)">Monthly Revenue</span>
                                <span className="font-display font-bold text-[18px] text-(--text-primary)">${monthlyRevenue.toFixed(2)} <span className="text-[12px] text-(--text-tertiary)">{transactionCount} txns</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><Tags className="w-[18px] h-[18px] text-purple-500" /> Pricing Tiers</h3>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            {programs.slice(0, 3).map((program) => (
                                <div key={program.id} className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between hover:border-emerald-500 transition-colors">
                                    <div>
                                        <span className="block font-display font-bold text-[14px] text-(--text-primary)">{program.name}</span>
                                        <span className="block font-body text-[12px] text-(--text-secondary)">{program.enrolled} enrolled • {program.difficulty}</span>
                                    </div>
                                    <span className="font-display font-black text-[16px] text-(--text-primary)">{program.length}</span>
                                </div>
                            ))}
                            {!programs.length && (
                                <div className="p-3 rounded-[12px] border border-dashed border-(--border-subtle) text-[12px] text-(--text-secondary)">
                                    No program tiers yet. Add one from Program Builder.
                                </div>
                            )}
                        </div>
                        <button onClick={() => router.push('/coach/programs')} className="w-full h-[40px] mt-4 rounded-[10px] border border-dashed border-(--border-subtle) text-(--text-secondary) font-bold text-[13px] hover:text-(--text-primary) hover:border-emerald-500 transition-colors">
                            + Add New Tier
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                <button 
                    onClick={() => { void handleSave() }}
                    disabled={isSaving}
                    className="h-[48px] px-8 rounded-[14px] bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-[16px] transition-all shadow-md flex items-center justify-center gap-2"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </motion.div>
    )
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}
