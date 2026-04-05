'use client'

import React, { useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Layers, Plus, ChevronRight, ChevronLeft, Download, Trash2, X, Weight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function ProgressPage() {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState<'gallery' | 'compare' | 'chart'>('gallery')
    const [chartFilter, setChartFilter] = useState<'1M' | '3M' | '6M' | 'All'>('All')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [photos, setPhotos] = useState([
        { id: 1, date: '2024-05-01', weight: 82.5, image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&fit=crop', label: 'Week 12' },
        { id: 2, date: '2024-04-01', weight: 83.8, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&fit=crop', label: 'Week 8' },
        { id: 3, date: '2024-03-01', weight: 85.0, image: 'https://images.unsplash.com/photo-1526506159807-1c6204c3286f?w=400&fit=crop', label: 'Day 1' },
    ])

    const [compareLeft, setCompareLeft] = useState(() => Math.max(0, photos.length - 1))
    const [compareRight, setCompareRight] = useState(0)

    const [selectedPhoto, setSelectedPhoto] = useState<typeof photos[0] | null>(null)

    // Upload Modal State
    const [stagedPhoto, setStagedPhoto] = useState<{ url: string; file: File } | null>(null)
    const [stagedWeight, setStagedWeight] = useState(user?.currentWeight?.toString() || '82.0')
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)

    const trendData = useMemo(() => {
        const sorted = [...photos]
            .filter((photo) => Number.isFinite(photo.weight))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (chartFilter === 'All' || sorted.length <= 1) {
            return sorted
        }

        const latestDate = new Date(sorted[sorted.length - 1].date)
        const daysByFilter: Record<'1M' | '3M' | '6M', number> = {
            '1M': 30,
            '3M': 90,
            '6M': 180,
        }
        const cutoff = new Date(latestDate)
        cutoff.setDate(cutoff.getDate() - daysByFilter[chartFilter])

        return sorted.filter((photo) => new Date(photo.date) >= cutoff)
    }, [chartFilter, photos])

    const trendCoordinates = useMemo(() => {
        if (!trendData.length) return []

        const minWeight = Math.min(...trendData.map((point) => point.weight))
        const maxWeight = Math.max(...trendData.map((point) => point.weight))
        const range = Math.max(0.5, maxWeight - minWeight)

        return trendData.map((point, index) => {
            const x = trendData.length === 1 ? 50 : (index / (trendData.length - 1)) * 100
            const normalizedY = (point.weight - minWeight) / range
            const y = 90 - normalizedY * 70
            return {
                ...point,
                x,
                y,
            }
        })
    }, [trendData])

    const xTickIndices = useMemo(() => {
        if (trendCoordinates.length <= 3) return trendCoordinates.map((_, index) => index)
        const middle = Math.floor((trendCoordinates.length - 1) / 2)
        return Array.from(new Set([0, middle, trendCoordinates.length - 1]))
    }, [trendCoordinates])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setStagedPhoto({ url: reader.result as string, file })
            setStagedWeight(user?.currentWeight?.toString() || '82.0')
        }
        reader.readAsDataURL(file)
    }

    const confirmUpload = () => {
        if (!stagedPhoto) return

        const numWeight = parseFloat(stagedWeight) || 0

        const newPhoto = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            weight: numWeight,
            image: stagedPhoto.url,
            label: 'Today'
        }

        const newPhotos = [newPhoto, ...photos]
        setPhotos(newPhotos)

        // Ensure "After" is always the latest (index 0) upon upload
        setCompareRight(0)
        // Ensure "Before" points to the oldest (which is now at end of array)
        setCompareLeft(newPhotos.length - 1)

        setStagedPhoto(null)
    }

    const deletePhoto = (id: number) => {
        const newPhotos = photos.filter(p => p.id !== id)
        setPhotos(newPhotos)
        // Reset indices safely
        if (newPhotos.length > 0) {
            setCompareRight(0) // Default 'After' to latest remaining
            setCompareLeft(newPhotos.length - 1) // Default 'Before' to oldest remaining
        } else {
            setCompareRight(0)
            setCompareLeft(0)
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

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl mx-auto h-full flex flex-col gap-6 pb-20 pt-2"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) leading-tight">Progress</h1>
                        <p className="font-body text-[14px] text-(--text-secondary)">Track your transformation. We auto-link your current weight.</p>
                    </div>
                    <div className="flex border border-(--border-default) rounded-[14px] overflow-hidden bg-[var(--bg-elevated)] p-1 shrink-0">
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className={cn("px-6 py-2 rounded-[10px] font-body text-[13px] font-bold transition-all flex items-center gap-2", activeTab === 'gallery' ? 'bg-(--text-primary) text-(--bg-base)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            <Camera className="w-[14px] h-[14px]" /> Gallery
                        </button>
                        <button
                            onClick={() => setActiveTab('compare')}
                            className={cn("px-6 py-2 rounded-[10px] font-body text-[13px] font-bold transition-all flex items-center gap-2", activeTab === 'compare' ? 'bg-(--text-primary) text-(--bg-base)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            <Layers className="w-[14px] h-[14px]" /> Compare
                        </button>
                        <button
                            onClick={() => setActiveTab('chart')}
                            className={cn("px-6 py-2 rounded-[10px] font-body text-[13px] font-bold transition-all flex items-center gap-2", activeTab === 'chart' ? 'bg-(--text-primary) text-(--bg-base)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                        >
                            <TrendingUp className="w-[14px] h-[14px]" /> Trends
                        </button>
                    </div>
                </div>

                {activeTab === 'gallery' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

                        {/* Add New Photo Card */}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[3/4] rounded-[24px] border border-dashed border-(--border-subtle) flex flex-col items-center justify-center gap-3 text-(--text-secondary) hover:border-emerald-500 hover:text-emerald-500 transition-all bg-[var(--bg-elevated)] group hover:bg-emerald-500/5"
                        >
                            <div className="w-[48px] h-[48px] rounded-full bg-(--bg-surface) shadow-sm flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-(--border-subtle)">
                                <Plus className="w-[24px] h-[24px]" />
                            </div>
                            <span className="font-display font-bold text-[15px]">Add Progress</span>
                        </button>

                        {photos.map(photo => (
                            <div key={photo.id} onClick={() => setSelectedPhoto(photo)} className="aspect-[3/4] relative rounded-[24px] overflow-hidden border border-(--border-subtle) group cursor-pointer shadow-sm hover:shadow-md transition-all">
                                <img src={photo.image} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                    <div className="flex items-center justify-between text-white mb-1">
                                        <span className="font-display font-bold text-[16px]">{photo.label}</span>
                                        <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-[6px] backdrop-blur-md">
                                            <Weight className="w-[12px] h-[12px] opacity-80" />
                                            <span className="font-body text-[13px] font-bold">{photo.weight} kg</span>
                                        </div>
                                    </div>
                                    <span className="font-body text-[12px] text-white/80">{new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>

                                {/* Actions overlay */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-[32px] h-[32px] rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                                        <Download className="w-[14px] h-[14px]" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openConfirmation(
                                                {
                                                    title: 'Delete Progress Photo?',
                                                    message: `${photo.label} will be removed from your progress gallery.`,
                                                    confirmText: 'Delete Photo',
                                                    tone: 'danger',
                                                },
                                                async () => {
                                                    deletePhoto(photo.id)
                                                },
                                            )
                                        }}
                                        className="w-[32px] h-[32px] rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-[14px] h-[14px]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'compare' ? (
                    /* Comparison View */
                    <div className="flex flex-col gap-6">
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                            {/* Subtle Background */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl -z-10" />

                            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 min-h-[500px]">

                                {/* Left Photo (Before) */}
                                <div className="w-full lg:w-[45%] flex flex-col items-center">
                                    <div className="flex items-center justify-between w-full mb-4 px-2">
                                        <button
                                            onClick={() => setCompareLeft(Math.min(photos.length - 1, compareLeft + 1))}
                                            disabled={compareLeft === photos.length - 1}
                                            className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeft className="w-[18px] h-[18px]" />
                                        </button>
                                        <div className="text-center">
                                            <span className="block font-display font-black text-[18px] text-(--text-primary) uppercase tracking-wide">Before</span>
                                            <span className="block font-body text-[13px] text-(--text-secondary) font-medium">{photos[compareLeft]?.date}</span>
                                        </div>
                                        <button
                                            onClick={() => setCompareLeft(Math.max(0, compareLeft - 1))}
                                            disabled={compareLeft === 0}
                                            className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronRight className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                    <div className="aspect-[3/4] w-full max-w-[400px] rounded-[24px] overflow-hidden border border-(--border-subtle) shadow-md relative">
                                        {photos[compareLeft] ? (
                                            <img src={photos[compareLeft].image} alt="Before" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-(--text-tertiary)">No Photo</div>
                                        )}
                                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-[12px] text-white flex gap-1.5 items-center">
                                            <Weight className="w-[14px] h-[14px] opacity-80" />
                                            <span className="font-display font-bold text-[18px]">{photos[compareLeft]?.weight || 0} kg</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center shrink-0">
                                    <div className="w-[48px] h-[48px] bg-emerald-500 text-white rounded-full flex items-center justify-center font-display font-black text-[16px] shadow-lg z-10">
                                        VS
                                    </div>
                                </div>

                                {/* Right Photo (After - Defaults to Latest) */}
                                <div className="w-full lg:w-[45%] flex flex-col items-center">
                                    <div className="flex items-center justify-between w-full mb-4 px-2">
                                        <button
                                            onClick={() => setCompareRight(Math.min(photos.length - 1, compareRight + 1))}
                                            disabled={compareRight === photos.length - 1}
                                            className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeft className="w-[18px] h-[18px]" />
                                        </button>
                                        <div className="text-center">
                                            <span className="block font-display font-black text-[18px] text-(--text-primary) uppercase tracking-wide">After</span>
                                            <span className="block font-body text-[13px] text-emerald-500 font-bold">Latest ({photos[compareRight]?.date})</span>
                                        </div>
                                        <button
                                            onClick={() => setCompareRight(Math.max(0, compareRight - 1))}
                                            disabled={compareRight === 0}
                                            className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronRight className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                    <div className="aspect-[3/4] w-full max-w-[400px] rounded-[24px] overflow-hidden border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative">
                                        {photos[compareRight] ? (
                                            <img src={photos[compareRight].image} alt="After" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-(--text-tertiary)">No Photo</div>
                                        )}
                                        <div className="absolute bottom-4 right-4 bg-emerald-500 text-white shadow-xl px-3 py-1.5 rounded-[12px] flex gap-1.5 items-center">
                                            <Weight className="w-[14px] h-[14px] opacity-90" />
                                            <span className="font-display font-bold text-[18px]">{photos[compareRight]?.weight || 0} kg</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Comparison Result Banner */}
                            {photos.length >= 2 ? (
                                <div className="mt-10 mx-auto max-w-[500px]">
                                    <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[20px] p-5 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="font-body text-[13px] text-(--text-secondary) font-bold uppercase tracking-wider mb-1">Net Change</span>
                                            <span className="font-body text-[14px] text-(--text-primary)">From {photos[compareLeft]?.date} to {photos[compareRight]?.date}</span>
                                        </div>
                                        <div className={cn("px-4 py-2 rounded-[12px] flex items-center gap-2",
                                            (photos[compareRight]?.weight - photos[compareLeft]?.weight) <= 0
                                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                                : "bg-red-500/10 text-red-600 border border-red-500/20"
                                        )}>
                                            <span className="font-display font-black text-[24px]">
                                                {((photos[compareRight]?.weight || 0) - (photos[compareLeft]?.weight || 0)) > 0 ? '+' : ''}
                                                {((photos[compareRight]?.weight || 0) - (photos[compareLeft]?.weight || 0)).toFixed(1)} kg
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : activeTab === 'chart' ? (
                    <div className="flex flex-col gap-6">
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-display font-bold text-[20px] text-(--text-primary)">Weight Trend</h3>
                                    <p className="font-body text-[14px] text-(--text-secondary)">Tracking your progress over time.</p>
                                </div>
                                <div className="flex bg-[var(--bg-elevated)] p-1 rounded-[12px] border border-(--border-default)">
                                    {['1M', '3M', '6M', 'All'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setChartFilter(filter as any)}
                                            className={cn("px-4 py-1.5 rounded-[8px] font-body text-[13px] font-bold transition-all", chartFilter === filter ? "bg-(--text-primary) text-(--bg-base) shadow-sm" : "text-(--text-secondary) hover:text-(--text-primary)")}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full h-[320px] relative border-b border-(--border-subtle) pb-8 mb-2">
                                {trendCoordinates.length ? (
                                    <>
                                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            <polyline
                                                points={trendCoordinates.map((point) => `${point.x},${point.y}`).join(' ')}
                                                fill="none"
                                                stroke="var(--chart-blue)"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                                            />
                                            {trendCoordinates.map((point, index) => (
                                                <circle
                                                    key={point.id}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r={index === trendCoordinates.length - 1 ? 4.5 : 4}
                                                    fill="var(--bg-surface)"
                                                    stroke="var(--chart-blue)"
                                                    strokeWidth="3"
                                                />
                                            ))}
                                        </svg>

                                        {xTickIndices.map((index) => {
                                            const point = trendCoordinates[index]
                                            return (
                                                <div key={point.id} className="absolute bottom-[-24px] text-center font-body text-[12px] font-bold text-(--text-tertiary)" style={{ left: `${point.x}%`, transform: 'translateX(-50%)' }}>
                                                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )
                                        })}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center font-body text-[14px] text-(--text-secondary)">
                                        No trend data available for this filter.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </motion.div>

            {/* Upload Modal Settings */}
            <AnimatePresence>
                {stagedPhoto && (
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-(--bg-surface) w-full max-w-[400px] rounded-[24px] border border-(--border-subtle) shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between">
                                <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Save Progress Photo</h3>
                                <button onClick={() => setStagedPhoto(null)} className="w-[32px] h-[32px] rounded-full hover:bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                            </div>

                            <div className="p-4 flex flex-col gap-4">
                                <div className="aspect-[3/4] w-full max-w-[200px] mx-auto rounded-[16px] overflow-hidden border border-(--border-subtle) shadow-sm">
                                    <img src={stagedPhoto.url} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Current Body Weight (kg)</label>
                                    <div className="relative">
                                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                        <input
                                            type="number"
                                            value={stagedWeight}
                                            onChange={e => setStagedWeight(e.target.value)}
                                            step="0.1"
                                            className="w-full h-[48px] pl-10 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-body text-[15px] outline-none"
                                        />
                                    </div>
                                    <p className="font-body text-[12px] text-(--text-tertiary) mt-1">
                                        We auto-filled this based on your last logged weight. Update if needed.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-(--border-subtle) bg-[var(--bg-elevated)]">
                                <button
                                    onClick={confirmUpload}
                                    className="w-full h-[48px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] font-bold text-[15px] transition-colors shadow-sm"
                                >
                                    Save Progress
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Photo Modal Full Size */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8" onClick={() => setSelectedPhoto(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-3xl h-[85vh] flex items-center justify-center p-8 bg-(--bg-surface) rounded-[32px] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Blur Background behind photo */}
                            <div className="absolute inset-0 z-0">
                                <img src={selectedPhoto.image} alt="blurred bg" className="w-full h-full object-cover opacity-20 blur-3xl" />
                                <div className="absolute inset-0 bg-black/40" />
                            </div>

                            <button onClick={() => setSelectedPhoto(null)} className="absolute top-6 right-6 w-[40px] h-[40px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20 cursor-pointer backdrop-blur-md">
                                <X className="w-[20px] h-[20px]" />
                            </button>
                            
                            <img src={selectedPhoto.image} alt={selectedPhoto.label} className="w-full h-full object-contain rounded-[16px] z-10 drop-shadow-2xl" />
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 border border-white/20 backdrop-blur-md px-6 py-3 rounded-[20px] text-white flex items-center gap-6 z-20 shadow-xl">
                                <div className="text-center">
                                    <span className="block font-display font-bold text-[18px] text-emerald-400">{selectedPhoto.label}</span>
                                    <span className="block font-body text-[13px] font-medium opacity-80 mt-0.5">{new Date(selectedPhoto.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="w-[1px] h-[32px] bg-white/20" />
                                <div className="flex items-center gap-2 font-display font-black text-[24px]">
                                    <Weight className="w-[20px] h-[20px] opacity-90" />
                                    {selectedPhoto.weight} kg
                                </div>
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
        </React.Fragment>
    )
}
