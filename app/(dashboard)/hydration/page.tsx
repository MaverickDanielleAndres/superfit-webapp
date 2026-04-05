'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Coffee, CupSoda, Plus, Trash2, History, Zap, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, BarChart3, AlertCircle, UploadCloud, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHydrationStore } from '@/store/useHydrationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { DrinkType } from '@/types'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Explicit interface for QuickDrink to satisfy TS strictly
interface QuickDrink {
    type: string;
    label: string;
    amount: number;
    factor: number;
    caffeine?: number;
    icon: React.ElementType;
    color: string;
    bg: string;
}

export default function HydrationPage() {
    const { user } = useAuthStore()
    const { addDrink, removeDrink, getHydrationDay, initializeMockData, fetchHydrationDay } = useHydrationStore()
    const isSimulationMode = !isSupabaseAuthEnabled()

    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day')
    const [viewDate, setViewDate] = useState(new Date())
    const dateStr = viewDate.toISOString().split('T')[0]

    const dayData = getHydrationDay(dateStr)
    const goalMl = user?.waterTargetMl || dayData?.goalMl || 2500
    const currentMl = dayData?.totalHydrationMl || 0
    const currentCaffeine = dayData?.totalCaffeineMg || 0

    // Typical recommended caffeine limit is ~400mg
    const caffeineLimit = 400
    const caffeinePercent = Math.min((currentCaffeine / caffeineLimit) * 100, 100)

    const fillPercentage = Math.min((currentMl / goalMl) * 100, 100)

    const [showCustom, setShowCustom] = useState(false)
    const [customDrink, setCustomDrink] = useState({ label: '', amount: 250, caffeine: 0, color: 'text-cyan-500', image: null as string | null })
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)

    const changeDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(viewDate)
        const modifier = direction === 'next' ? 1 : -1

        switch (viewMode) {
            case 'day': newDate.setDate(newDate.getDate() + modifier); break
            case 'week': newDate.setDate(newDate.getDate() + (modifier * 7)); break
            case 'month': newDate.setMonth(newDate.getMonth() + modifier); break
            case 'year': newDate.setFullYear(newDate.getFullYear() + modifier); break
        }
        setViewDate(newDate)
    }

    // Setup mock data on mount if empty
    useEffect(() => {
        if (!dayData?.entries?.length) {
            initializeMockData()
        }
        void fetchHydrationDay(dateStr)
    }, [dateStr, dayData, fetchHydrationDay, initializeMockData])

    const quickDrinks: QuickDrink[] = [
        { type: 'water', label: 'Glass of Water', amount: 250, factor: 1.0, icon: Droplets, color: 'text-(--chart-blue)', bg: 'bg-(--chart-blue)' },
        { type: 'water', label: 'Bottle of Water', amount: 500, factor: 1.0, icon: Droplets, color: 'text-(--chart-blue)', bg: 'bg-(--chart-blue)' },
        { type: 'coffee', label: 'Black Coffee', amount: 300, factor: 0.8, caffeine: 95, icon: Coffee, color: 'text-(--chart-amber)', bg: 'bg-(--chart-amber)' },
        { type: 'sports_drink', label: 'Sports Drink', amount: 400, factor: 1.0, icon: Zap, color: 'text-(--accent)', bg: 'bg-(--accent)' },
    ]

    const handleAdd = async (drink: QuickDrink | { type: string, label: string, amount: number, factor: number, caffeine: number }) => {
        await addDrink(dateStr, {
            type: drink.type as DrinkType,
            label: drink.label,
            amountMl: drink.amount,
            hydrationFactor: drink.factor,
            caffeinesMg: drink.caffeine || 0,
            loggedAt: new Date().toISOString()
        })
        toast.success(`Added ${drink.amount}ml of ${drink.label}`)
    }

    const submitCustomDrink = async () => {
        if (!customDrink.label || customDrink.amount <= 0) return
        await handleAdd({ type: 'custom', label: customDrink.label, amount: customDrink.amount, factor: 1.0, caffeine: customDrink.caffeine })
        setShowCustom(false)
        setCustomDrink({ label: '', amount: 250, caffeine: 0, color: 'text-cyan-500', image: null })
    }

    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (ev) => setCustomDrink({ ...customDrink, image: ev.target?.result as string })
            reader.readAsDataURL(file)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => setCustomDrink({ ...customDrink, image: ev.target?.result as string })
            reader.readAsDataURL(file)
        }
    }

    const formatViewDate = () => {
        if (viewMode === 'day') return viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        if (viewMode === 'week') {
            const end = new Date(viewDate)
            end.setDate(end.getDate() + 6)
            return `${viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
        if (viewMode === 'month') return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        if (viewMode === 'year') return viewDate.getFullYear().toString()
    }

    const aggregateSeries = useMemo(() => {
        const length = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 12
        const seedInput = `${viewMode}-${viewDate.toISOString().slice(0, 10)}`
        const seed = seedInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

        return Array.from({ length }).map((_, index) => {
            const base = Math.sin((seed + index * 17) * 0.19)
            const wave = Math.cos((seed + index * 7) * 0.13)
            const value = 62 + base * 18 + wave * 12
            return Math.max(20, Math.min(100, Math.round(value)))
        })
    }, [viewDate, viewMode])

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            {/* Header with Advanced Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight tracking-tight mb-2">Hydration</h1>
                    {isSimulationMode && (
                        <span className="inline-flex items-center rounded-[8px] bg-amber-500/10 px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-amber-500">
                            Simulation Mode
                        </span>
                    )}

                    {/* View Modes */}
                    <div className="flex bg-(--bg-surface) p-1 rounded-[12px] border border-(--border-subtle) w-max shadow-sm">
                        {['day', 'week', 'month', 'year'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => { setViewMode(mode as any); setViewDate(new Date()) }}
                                className={cn("px-4 py-1.5 rounded-[8px] font-body text-[13px] font-bold capitalize transition-all", viewMode === mode ? "bg-[var(--bg-elevated)] text-(--accent) shadow-sm" : "text-(--text-secondary) hover:text-(--text-primary)")}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-(--bg-surface) border border-(--border-subtle) rounded-full px-2 py-1 w-max shadow-sm">
                    <button onClick={() => changeDate('prev')} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-full text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer"><ChevronLeft className="w-[18px] h-[18px]" /></button>
                    <button onClick={() => setViewDate(new Date())} className="font-body font-semibold text-[14px] text-(--text-primary) hover:text-(--accent) flex items-center gap-2 transition-colors cursor-pointer px-2 min-w-[140px] justify-center">
                        <CalendarIcon className="w-[14px] h-[14px] text-(--text-tertiary)" />
                        {formatViewDate()}
                    </button>
                    <button onClick={() => changeDate('next')} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-full text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer"><ChevronRight className="w-[18px] h-[18px]" /></button>
                </div>
            </div>

            {viewMode === 'day' ? (
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Visual Ring Card & Caffeine Monitor */}
                    <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                            <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Today&apos;s Progress</h2>
                        </div>

                        <div className="relative w-[280px] h-[280px] mt-4 z-10">
                            {/* Background Ring */}
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                                <circle cx="140" cy="140" r="120" stroke="var(--bg-elevated)" strokeWidth="24" fill="none" />
                                <motion.circle
                                    cx="140" cy="140" r="120"
                                    stroke="var(--chart-blue)"
                                    strokeWidth="24"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 120}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - fillPercentage / 100) }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="drop-shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <Droplets className="w-[32px] h-[32px] text-(--chart-blue) mb-1 opacity-80" />
                                <span className="font-display font-bold text-[48px] text-(--text-primary) leading-none tracking-tight">{Math.round(currentMl)}</span>
                                <span className="font-body text-[14px] text-(--text-secondary) mt-1 font-medium">/ {goalMl} ml</span>
                            </div>
                        </div>

                        {/* Caffeine Monitor Widget */}
                        <div className="mt-8 w-full max-w-[320px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 flex flex-col gap-2 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coffee className="w-[16px] h-[16px] text-(--chart-amber)" />
                                    <span className="font-body text-[13px] font-semibold text-(--text-primary)">Caffeine Monitor</span>
                                </div>
                                <span className={cn("font-display font-bold text-[15px]", currentCaffeine >= caffeineLimit ? "text-red-500" : "text-(--chart-amber)")}>{currentCaffeine} <span className="text-[12px] text-(--text-tertiary)">/ {caffeineLimit}mg</span></span>
                            </div>
                            <div className="h-[6px] bg-(--bg-surface-alt) rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${caffeinePercent}%` }}
                                    className={cn("h-full rounded-full transition-all", currentCaffeine >= caffeineLimit ? "bg-red-500" : "bg-(--chart-amber)")}
                                />
                            </div>
                            {currentCaffeine >= caffeineLimit && (
                                <div className="flex items-center gap-1.5 text-red-500 mt-1">
                                    <AlertCircle className="w-[12px] h-[12px]" />
                                    <span className="font-body text-[11px] font-medium tracking-wide">Daily caffeine limit reached.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Add Grid */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {quickDrinks.map((drink, i) => (
                                <button
                                    key={i}
                                    onClick={() => { void handleAdd(drink) }}
                                    className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 flex flex-col items-center justify-center gap-3 hover:border-(--border-default) hover:bg-[var(--bg-elevated)] transition-all group cursor-pointer shadow-sm"
                                >
                                    <div className={cn("w-[56px] h-[56px] rounded-full flex items-center justify-center bg-opacity-10 transition-transform group-hover:scale-110", drink.bg)}>
                                        <drink.icon className={cn("w-[28px] h-[28px]", drink.color)} />
                                    </div>
                                    <div className="flex flex-col items-center flex-1 text-center">
                                        <span className="font-body font-bold text-[14px] text-(--text-primary)">{drink.label}</span>
                                        <span className="font-body text-[12px] text-(--text-secondary) mt-0.5">{drink.amount} ml</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCustom(true)}
                            className="flex-1 w-full bg-(--bg-elevated) border border-dashed border-(--border-default) rounded-[20px] p-5 flex items-center justify-center gap-2 hover:border-(--accent) transition-all text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
                        >
                            <CupSoda className="w-[20px] h-[20px]" />
                            <span className="font-body font-semibold text-[15px]">Create Custom Drink</span>
                        </button>
                    </div>

                </div>
            ) : (
                /* Aggregate View Placeholder (Week/Month/Year) */
                /* Aggregate View Mock (Week/Month/Year) */
                <div className="flex-1 flex flex-col items-stretch justify-start bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-8 animate-in fade-in zoom-in-95 duration-300 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-display font-bold text-[24px] text-(--text-primary) capitalize mb-1">{viewMode}ly Overview</h3>
                            <p className="font-body text-[14px] text-(--text-secondary)">Average hydration: <strong className="text-(--chart-blue)">2,150 ml</strong>/day</p>
                        </div>
                        <div className="w-[48px] h-[48px] rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center shadow-sm">
                            <BarChart3 className="w-[24px] h-[24px] text-(--chart-blue)" />
                        </div>
                    </div>

                    <div className="flex-1 min-h-[240px] flex items-end justify-between gap-1 sm:gap-2 mt-auto border-b border-(--border-subtle) pb-2 relative z-10">
                        {aggregateSeries.map((val, i) => {
                            return (
                                <div key={i} className="flex-1 relative group flex flex-col justify-end items-center h-[200px] sm:h-[240px]">
                                    {/* Mock chart bar */}
                                    <div 
                                        className="w-full max-w-[32px] bg-(--chart-blue) rounded-t-[6px] sm:rounded-t-[8px] transition-all duration-300 group-hover:bg-blue-400 opacity-[0.85] group-hover:opacity-100 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                                        style={{ height: `${val}%` }} 
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white border border-(--border-default) rounded-[8px] px-2 py-1 text-[11px] font-bold text-white dark:text-black whitespace-nowrap shadow-xl pointer-events-none z-20 hidden sm:block">
                                        {Math.round(val * 35)}ml
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between items-center mt-3 px-2">
                        <span className="font-body text-[12px] sm:text-[13px] text-(--text-tertiary) font-bold">{viewMode === 'week' ? 'Mon' : viewMode === 'month' ? '1st' : 'Jan'}</span>
                        <span className="font-body text-[12px] sm:text-[13px] text-(--text-tertiary) font-bold">{viewMode === 'week' ? 'Sun' : viewMode === 'month' ? '30th' : 'Dec'}</span>
                    </div>
                </div>
            )}

            {/* History Log (Only visible in Day view ideally, or aggregated as a list) */}
            {viewMode === 'day' && (
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 flex-1 shadow-sm mt-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-(--text-primary)">
                            <History className="w-[18px] h-[18px]" />
                            <h3 className="font-display font-bold text-[18px]">Log History</h3>
                        </div>
                        <span className="font-body text-[13px] text-(--text-secondary)">{dayData?.entries?.length || 0} entries</span>
                    </div>

                    <div className="space-y-2">
                        {dayData?.entries?.slice().reverse().map(entry => (
                            <div key={entry.id} className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-transparent hover:border-(--border-default) transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-[10px] h-[10px] rounded-full", entry.type === 'coffee' ? "bg-(--chart-amber)" : "bg-(--chart-blue)")} />
                                    <div>
                                        <span className="block font-body text-[14px] text-(--text-primary) font-semibold">{entry.label}</span>
                                        {(entry.caffeinesMg ?? 0) > 0 && <span className="block font-body text-[11px] text-(--chart-amber) mt-0.5">{entry.caffeinesMg}mg Caffeine</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block font-body text-[14px] font-bold text-(--text-primary)">{entry.amountMl} ml</span>
                                        <span className="block font-body text-[11px] text-(--text-secondary)">{new Date(entry.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Remove Drink Entry?',
                                                    message: `${entry.label} will be removed from your hydration log.`,
                                                    confirmText: 'Remove Entry',
                                                    tone: 'danger',
                                                },
                                                async () => {
                                                    await removeDrink(dateStr, entry.id)
                                                    toast.success('Entry removed')
                                                },
                                            )
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-(--status-danger) hover:bg-red-500/10 rounded-[8px] transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-[16px] h-[16px]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!dayData?.entries?.length && (
                            <div className="py-12 text-center flex flex-col items-center">
                                <Droplets className="w-[32px] h-[32px] text-(--text-tertiary) mb-3" />
                                <span className="font-body text-[14px] text-(--text-secondary)">No drinks logged today.<br />Start hydrating!</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Drink Modal */}
            <AnimatePresence>
                {showCustom && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustom(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="w-full max-w-sm bg-(--bg-surface) rounded-[24px] shadow-2xl relative z-10 flex flex-col p-8 border border-(--border-subtle)"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-display font-bold text-[22px] text-(--text-primary)">Create Drink</h2>
                                <button onClick={() => setShowCustom(false)} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                            </div>

                            <div className="space-y-4 font-body flex-1 overflow-y-auto pr-1">
                                {/* Image Dropzone */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-(--text-secondary) mb-1.5 ml-1">Photo (Optional)</label>
                                    <div 
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleImageDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "w-full h-[120px] rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                                            customDrink.image 
                                                ? "border-transparent bg-[var(--bg-elevated)]" 
                                                : "border-(--border-default) hover:border-(--accent) bg-[var(--bg-surface-alt)] hover:bg-emerald-500/5 text-(--text-tertiary) hover:text-(--accent)"
                                        )}
                                    >
                                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                                        
                                        {customDrink.image ? (
                                            <>
                                                <img src={customDrink.image} alt="Drink" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                    <UploadCloud className="w-[24px] h-[24px] text-white mb-1" />
                                                    <span className="font-body font-bold text-[12px] text-white">Change Photo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-[28px] h-[28px] mb-2" />
                                                <span className="font-body font-semibold text-[13px]">Tap to upload or drag photo</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-(--text-secondary) mb-1.5 ml-1">Drink Name</label>
                                    <input autoFocus type="text" value={customDrink.label} onChange={e => setCustomDrink({ ...customDrink, label: e.target.value })} className="w-full h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" placeholder="e.g. Pre-workout Splash" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-(--text-secondary) mb-1.5 ml-1">Amount (ml)</label>
                                        <input type="number" value={customDrink.amount || ''} onChange={e => setCustomDrink({ ...customDrink, amount: Number(e.target.value) })} className="w-full h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-(--text-secondary) mb-1.5 ml-1">Caffeine (mg)</label>
                                        <input type="number" value={customDrink.caffeine || ''} onChange={e => setCustomDrink({ ...customDrink, caffeine: Number(e.target.value) })} className="w-full h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" placeholder="Optional" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => { void submitCustomDrink() }}
                                    className="w-full h-[56px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[16px] rounded-[16px] hover:opacity-90 transition-opacity mt-4 shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2"
                                >
                                    Log Custom Drink
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
