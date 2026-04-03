'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, ScanLine, Utensils, Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, ArrowLeft, Camera, X, Check, Activity, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useNutritionStore } from '@/store/useNutritionStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MealSlot, FoodItem } from '@/types'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

export default function DiaryPage() {
    const { user } = useAuthStore()
    const { getDayLog, getDailyTotals, addEntry, fetchDayLog } = useNutritionStore()
    const { activeSession } = useWorkoutStore()
    const isSimulationMode = !isSupabaseAuthEnabled()

    const [activeTab, setActiveTab] = useState<'food'>('food')
    const [viewDate, setViewDate] = useState(new Date())
    const dateStr = viewDate.toISOString().split('T')[0]

    const dayLog = getDayLog(dateStr)
    const totals = getDailyTotals(dateStr)

    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
    const [activeTargetMeal, setActiveTargetMeal] = useState<MealSlot>('breakfast')
    const [foodSearchQuery, setFoodSearchQuery] = useState('')
    const [addFoodTab, setAddFoodTab] = useState<'search' | 'manual'>('search')
    const [manualFood, setManualFood] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' })

    // AI Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [scanState, setScanState] = useState<'idle' | 'uploading' | 'analyzing' | 'results'>('idle')
    const [scanImage, setScanImage] = useState<string | null>(null)
    const [scanResults, setScanResults] = useState<{ item: FoodItem, quantity: number, mealSlot: MealSlot } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)

    const changeDate = (days: number) => {
        const newDate = new Date(viewDate)
        newDate.setDate(newDate.getDate() + days)
        setViewDate(newDate)
    }

    const openScanner = async () => {
        setIsScannerOpen(true)
        setScanState('idle')
        setScanImage(null)
        setScanResults(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error('Camera access denied:', err)
            // Fallback to file upload immediately if no camera
            fileInputRef.current?.click()
        }
    }

    const closeScanner = () => {
        setIsScannerOpen(false)
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setScanState('idle')
        setScanImage(null)
    }

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    useEffect(() => {
        void fetchDayLog(dateStr)
    }, [dateStr, fetchDayLog])

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0)
                const dataUrl = canvas.toDataURL('image/jpeg')
                processImage(dataUrl)
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    processImage(event.target.result as string)
                }
            }
            reader.readAsDataURL(file)
            if (!isScannerOpen) setIsScannerOpen(true)
        }
    }

    const processImage = (imageData: string) => {
        setScanImage(imageData)
        setScanState('analyzing')

        // Mock AI Delay
        setTimeout(() => {
            setScanResults({
                item: {
                    id: 'ai_mock_1',
                    name: 'Grilled Salmon Bowl',
                    brand: 'AI Estimated',
                    calories: 520,
                    protein: 42,
                    carbs: 35,
                    fat: 22,
                    servingSize: 1,
                    servingUnit: 'bowl',
                    isVerified: false,
                    barcode: undefined,
                    category: 'Protein'
                },
                quantity: 1,
                mealSlot: 'lunch'
            })
            setScanState('results')
        }, 2500)
    }

    const addFoodEntry = async (foodItem: FoodItem, mealSlot: MealSlot, quantity = 1) => {
        await addEntry(dateStr, {
            foodItemId: foodItem.id,
            foodItem,
            quantity,
            mealSlot,
            loggedAt: new Date().toISOString(),
        })
    }

    const handleSaveScanResult = async () => {
        if (scanResults) {
            await addFoodEntry(scanResults.item, scanResults.mealSlot, scanResults.quantity)
            toast.success('Meal added to diary!')
            closeScanner()
        }
    }

    const calorieTarget = user?.dailyCalorieTarget || 2500
    const proteinTarget = user?.proteinTarget || 150
    const carbTarget = user?.carbTarget || 250
    const fatTarget = user?.fatTarget || 70

    const mealSlots: { id: MealSlot, label: string }[] = [
        { id: 'breakfast', label: 'Breakfast' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'dinner', label: 'Dinner' },
        { id: 'morning_snack', label: 'Snacks' }
    ]

    const MacroBar = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
        const percent = Math.min((current / target) * 100, 100)
        return (
            <div className="flex-1 bg-(--bg-elevated) p-3 rounded-[12px] border border-(--border-default)">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold">{label}</span>
                    <span className="font-body text-[11px] text-(--text-tertiary) font-medium">{Math.round(current)} / {target}g</span>
                </div>
                <div className="h-[6px] bg-(--bg-surface-alt) rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn("h-full rounded-full shadow-[inset_0_1px_rgba(255,255,255,0.2)]", color)}
                    />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto h-full flex flex-col gap-6 pb-20"
        >
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight tracking-tight mb-1">Daily Log</h1>
                    {isSimulationMode && (
                        <span className="mb-2 inline-flex items-center rounded-[8px] bg-amber-500/10 px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-amber-500">
                            Simulation Mode
                        </span>
                    )}
                    <div className="mt-2 relative overflow-hidden group w-max">
                        <input 
                            type="date" 
                            value={dateStr} 
                            onChange={(e) => { 
                                if (e.target.value) setViewDate(new Date(e.target.value + 'T12:00:00')) 
                            }} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <button className="font-body font-semibold text-[14px] text-(--text-primary) hover:text-(--accent) flex items-center gap-2 transition-colors cursor-pointer px-4 h-[36px] bg-(--bg-surface) border border-(--border-subtle) rounded-full shadow-sm group-hover:border-(--accent) group-hover:bg-(--bg-base)">
                            <CalendarIcon className="w-[14px] h-[14px] text-(--text-tertiary) group-hover:text-(--accent)" />
                            {viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            <ChevronDown className="w-[14px] h-[14px] text-(--text-tertiary) ml-1 group-hover:text-(--accent)" />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button
                        onClick={openScanner}
                        className="h-[44px] px-5 rounded-[12px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-body text-[14px] font-bold flex items-center gap-2 hover:shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer"
                    >
                        <Camera className="w-[18px] h-[18px]" /> AI Smart Scan
                    </button>
                </div>
            </div>

            {/* Tabs (Removed Exercise per prompt) */}
            <div className="flex bg-(--bg-surface) p-1 rounded-[16px] border border-(--border-subtle) w-max shadow-sm hidden">
                {/* Kept wrapper hidden, or just removed the whole tab bar since there's only one tab now */}
            </div>

            {activeTab === 'food' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Summary Card */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-(--accent) opacity-[0.03] rounded-bl-full blur-[40px] pointer-events-none" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-inner">
                                    <Flame className="w-[28px] h-[28px] text-white" />
                                </div>
                                <div>
                                    <span className="block font-body text-[13px] font-semibold tracking-wider uppercase text-(--text-secondary)">Calories Remaining</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="font-display font-black text-[36px] text-(--text-primary) leading-none tracking-tight">{Math.max(0, calorieTarget - totals.calories)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right hidden sm:block">
                                <span className="block font-body text-[13px] text-(--text-secondary) mb-1">Base Goal: <strong className="text-(--text-primary)">{calorieTarget}</strong></span>
                                <span className="block font-body text-[13px] text-(--text-secondary) mb-1">Food Consumed: <strong className="text-(--status-warning)">{totals.calories}</strong></span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">Earned from exercise: <Link href="/exercises" className="text-(--accent) font-bold hover:underline cursor-pointer">0</Link></span>
                            </div>
                        </div>

                        {/* Macro Breakdown */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-6 border-t border-(--border-subtle) relative z-10">
                            <MacroBar label="Protein" current={totals.protein} target={proteinTarget} color="bg-gradient-to-r from-blue-400 to-indigo-500" />
                            <MacroBar label="Carbs" current={totals.carbs} target={carbTarget} color="bg-gradient-to-r from-amber-400 to-orange-500" />
                            <MacroBar label="Fat" current={totals.fat} target={fatTarget} color="bg-gradient-to-r from-purple-400 to-pink-500" />
                        </div>
                    </div>

                    {/* Meal Slots */}
                    <div className="space-y-4">
                        {mealSlots.map(slot => {
                            const slotEntries = dayLog?.entries.filter(e => e.mealSlot === slot.id) || []
                            const slotCalories = slotEntries.reduce((sum, e) => sum + (e.foodItem.calories * e.quantity), 0)

                            return (
                                <div key={slot.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] overflow-hidden shadow-sm hover:border-(--border-default) transition-colors">
                                    {/* Slot Header */}
                                    <div className="p-4 flex items-center justify-between border-b border-(--border-subtle) bg-[var(--bg-elevated)]/50">
                                        <div className="flex items-center gap-3">
                                            <Utensils className="w-[20px] h-[20px] text-(--text-secondary)" />
                                            <h3 className="font-display font-bold text-[18px] text-(--text-primary)">{slot.label}</h3>
                                        </div>
                                        <span className="font-body font-bold text-[16px] text-(--text-primary)">{slotCalories} <span className="text-[12px] font-normal text-(--text-tertiary)">kcal</span></span>
                                    </div>

                                    {/* Slot Items */}
                                    <div className="p-3">
                                        {slotEntries.length === 0 ? (
                                            <p className="font-body text-[14px] text-(--text-tertiary) text-center py-6">No entries yet. Tap add food or use AI scan.</p>
                                        ) : (
                                            <div className="flex flex-col gap-2 mb-3">
                                                {slotEntries.map(entry => (
                                                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-[12px] bg-(--bg-base) border border-(--border-subtle) hover:border-(--border-default) transition-colors group">
                                                        <div>
                                                            <span className="block font-body text-[15px] text-(--text-primary) font-semibold">{entry.foodItem.name}</span>
                                                            <span className="block font-body text-[13px] text-(--text-secondary) mt-0.5">{entry.foodItem.brand ? `${entry.foodItem.brand} • ` : ''}{entry.quantity * entry.foodItem.servingSize}{entry.foodItem.servingUnit}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <span className="block font-body text-[15px] text-(--text-primary) font-bold">{entry.foodItem.calories * entry.quantity}</span>
                                                                <span className="block font-body text-[12px] text-(--text-tertiary) font-medium mt-0.5">P: {entry.foodItem.protein * entry.quantity}g</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Food Button */}
                                        <button 
                                            onClick={() => {
                                                setActiveTargetMeal(slot.id)
                                                setIsAddFoodOpen(true)
                                            }}
                                            className="w-full h-[44px] flex items-center justify-center gap-2 text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-bg-strong) rounded-[12px] border border-dashed border-(--border-default) hover:border-transparent transition-all cursor-pointer"
                                        >
                                            <Plus className="w-[18px] h-[18px]" />
                                            <span className="font-body font-semibold text-[14px]">Add Food</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}



            {/* Fullscreen AI Scanner UI */}
            <AnimatePresence>
                {isScannerOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20">
                            <button onClick={closeScanner} className="w-[40px] h-[40px] rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                <ArrowLeft className="w-[20px] h-[20px]" />
                            </button>
                            <span className="font-display font-bold text-[18px] text-white">AI Vision Scan</span>
                            <div className="w-[40px]"></div> {/* Spacer */}
                        </div>

                        {/* Scanner Viewport layer */}
                        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                            {scanState === 'idle' && !scanImage ? (
                                stream ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                        {/* Viewfinder overlay */}
                                        <div className="absolute inset-x-10 inset-y-[20%] border-2 border-dashed border-white/50 rounded-[32px] pointer-events-none flex flex-col items-center justify-center">
                                            <ScanLine className="w-[64px] h-[64px] text-white/50 animate-pulse" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-white text-center">
                                        <Loader2 className="w-[40px] h-[40px] animate-spin mx-auto mb-4 text-emerald-500" />
                                        <p className="font-body">Initializing Camera...</p>
                                    </div>
                                )
                            ) : scanImage ? (
                                <img src={scanImage} className="absolute inset-0 w-full h-full object-cover filter brightness-75 blur-[2px]" />
                            ) : null}

                            {/* Analysis Overlay */}
                            {scanState === 'analyzing' && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center z-30">
                                    <div className="w-[120px] h-[120px] rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                    <h2 className="font-display font-black text-[28px] text-white mb-2">Analyzing Meal...</h2>
                                    <p className="font-body text-emerald-400 font-medium">Detecting macro profile and ingredients</p>
                                </div>
                            )}

                            {/* Results Card Overlay */}
                            <AnimatePresence>
                                {scanState === 'results' && scanResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[32px] p-6 pb-12 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                                    >
                                        <div className="w-[40px] h-[4px] bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" />

                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-[48px] h-[48px] rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-[24px] h-[24px] text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-display font-black text-[24px] text-zinc-900 dark:text-white leading-tight">{scanResults.item.name}</h3>
                                                <p className="font-body text-[14px] text-zinc-500 dark:text-zinc-400">AI Confidence: 94%</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 mb-8">
                                            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-[16px] text-center">
                                                <span className="block font-body text-[11px] text-zinc-500 uppercase font-bold mb-1">Calories</span>
                                                <span className="font-display font-bold text-[20px] text-zinc-900 dark:text-white">{scanResults.item.calories}</span>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-[16px] text-center">
                                                <span className="block font-body text-[11px] text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Protein</span>
                                                <span className="font-display font-bold text-[20px] text-blue-900 dark:text-blue-300">{scanResults.item.protein}g</span>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-[16px] text-center">
                                                <span className="block font-body text-[11px] text-amber-600 dark:text-amber-500 uppercase font-bold mb-1">Carbs</span>
                                                <span className="font-display font-bold text-[20px] text-amber-900 dark:text-amber-300">{scanResults.item.carbs}g</span>
                                            </div>
                                            <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-[16px] text-center">
                                                <span className="block font-body text-[11px] text-pink-600 dark:text-pink-400 uppercase font-bold mb-1">Fat</span>
                                                <span className="font-display font-bold text-[20px] text-pink-900 dark:text-pink-300">{scanResults.item.fat}g</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setScanState('idle')} className="h-[56px] px-6 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 font-body font-bold text-[16px] text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-[0.5]">
                                                Retake
                                            </button>
                                            <button onClick={handleSaveScanResult} className="h-[56px] px-6 rounded-[16px] bg-emerald-500 text-white font-body font-bold text-[16px] hover:bg-emerald-600 transition-colors flex-[1] shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                                                Add to Diary
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Actions (Camera Controls) */}
                        {scanState === 'idle' && (
                            <div className="absolute bottom-0 left-0 right-0 h-[140px] bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center z-20 pb-6">
                                <button onClick={handleCapture} className="w-[80px] h-[80px] rounded-full border-[4px] border-white/50 flex items-center justify-center relative hover:scale-[1.05] transition-transform active:scale-95 group">
                                    <div className="w-[64px] h-[64px] rounded-full bg-white transition-transform group-active:scale-90" />
                                </button>
                                <button className="absolute bottom-10 right-10 text-white/80 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                                    <span className="font-body text-[13px] font-semibold tracking-wide uppercase">Upload</span>
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </AnimatePresence>

            {/* Add Food Modal Sheet */}
            <AnimatePresence>
                {isAddFoodOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg bg-(--bg-surface) sm:rounded-[24px] rounded-t-[24px] shadow-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-(--border-subtle)">
                                <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Target: <span className="text-(--accent)">{mealSlots.find(s => s.id === activeTargetMeal)?.label}</span></h2>
                                <div className="flex bg-[var(--bg-elevated)] p-1 rounded-lg border border-(--border-default)">
                                    <button onClick={() => setAddFoodTab('search')} className={cn("px-4 py-1.5 rounded-md font-body text-[13px] font-bold transition-all", addFoodTab === 'search' ? "bg-(--bg-surface) shadow-sm text-(--text-primary)" : "text-(--text-secondary) hover:text-(--text-primary)")}>Search</button>
                                    <button onClick={() => setAddFoodTab('manual')} className={cn("px-4 py-1.5 rounded-md font-body text-[13px] font-bold transition-all", addFoodTab === 'manual' ? "bg-(--bg-surface) shadow-sm text-(--text-primary)" : "text-(--text-secondary) hover:text-(--text-primary)")}>Manual</button>
                                </div>
                                <button onClick={() => setIsAddFoodOpen(false)} className="p-2 bg-[var(--bg-elevated)] hover:bg-(--border-subtle) rounded-full transition-colors cursor-pointer">
                                    <X className="w-[16px] h-[16px]" />
                                </button>
                            </div>
                            {addFoodTab === 'search' ? (
                                <>
                                    <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search for a food..."
                                                value={foodSearchQuery}
                                                onChange={e => setFoodSearchQuery(e.target.value)}
                                                className="w-full h-[44px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--bg-base)]">
                                        {/* Dummy Search Results */}
                                        {[
                                            { name: 'Oatmeal', brand: 'Quaker', cals: 150, p: 5, c: 27, f: 3, unit: 'cup' },
                                            { name: 'Chicken Breast', brand: '', cals: 165, p: 31, c: 0, f: 3.6, unit: 'oz' },
                                            { name: 'Greek Yogurt', brand: 'Chobani', cals: 100, p: 15, c: 6, f: 0, unit: 'container' },
                                            { name: 'Protein Shake', brand: 'Optimum Nutrition', cals: 120, p: 24, c: 3, f: 1, unit: 'scoop' },
                                        ].filter(f => f.name.toLowerCase().includes(foodSearchQuery.toLowerCase())).map((food, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-[12px] border border-(--border-subtle) hover:border-emerald-500 bg-[var(--bg-elevated)] cursor-pointer group"
                                                onClick={() => {
                                                    const item: FoodItem = {
                                                        id: `food_${Date.now()}_${i}`,
                                                        name: food.name,
                                                        brand: food.brand,
                                                        calories: food.cals,
                                                        protein: food.p,
                                                        carbs: food.c,
                                                        fat: food.f,
                                                        servingSize: 1,
                                                        servingUnit: food.unit,
                                                        isVerified: true,
                                                        barcode: undefined,
                                                        category: 'Snacks'
                                                    }
                                                    void (async () => {
                                                        await addFoodEntry(item, activeTargetMeal, 1)
                                                        toast.success(`${food.name} added!`)
                                                        setIsAddFoodOpen(false)
                                                    })()
                                                }}
                                            >
                                                <div>
                                                    <span className="block font-bold text-[14px] text-(--text-primary)">{food.name} {food.brand && <span className="text-(--text-tertiary) font-normal">({food.brand})</span>}</span>
                                                    <span className="text-[12px] text-(--text-secondary)">1 {food.unit} • {food.cals} kcal</span>
                                                </div>
                                                <button className="w-[32px] h-[32px] rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="w-[16px] h-[16px]" />
                                                </button>
                                            </div>
                                        ))}
                                        {foodSearchQuery && <div className="text-center py-6 text-(--text-tertiary) text-[13px]">Can&apos;t find it? <button onClick={() => setAddFoodTab('manual')} className="text-emerald-500 font-bold hover:underline">Add Custom Food</button></div>}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-base)]">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Food Name <span className="text-red-500">*</span></label>
                                            <input type="text" value={manualFood.name} onChange={e => setManualFood({...manualFood, name: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-body focus:border-(--accent) outline-none transition-colors" placeholder="e.g. Homemade Chicken Salad" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Brand Name <span className="text-(--text-tertiary) lowercase normal-case">(optional)</span></label>
                                            <input type="text" value={manualFood.brand} onChange={e => setManualFood({...manualFood, brand: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-body focus:border-(--accent) outline-none transition-colors" placeholder="e.g. Trader Joe's" />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Calories <span className="text-red-500">*</span></label>
                                                <input type="number" value={manualFood.calories} onChange={e => setManualFood({...manualFood, calories: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-bold font-display focus:border-(--accent) outline-none transition-colors" placeholder="kcal" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Protein</label>
                                                <input type="number" value={manualFood.protein} onChange={e => setManualFood({...manualFood, protein: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-bold font-display focus:border-(--accent) outline-none transition-colors" placeholder="g" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Carbs</label>
                                                <input type="number" value={manualFood.carbs} onChange={e => setManualFood({...manualFood, carbs: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-bold font-display focus:border-(--accent) outline-none transition-colors" placeholder="g" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Fat</label>
                                                <input type="number" value={manualFood.fat} onChange={e => setManualFood({...manualFood, fat: e.target.value})} className="w-full h-[48px] bg-(--bg-surface) border border-(--border-default) rounded-[12px] px-4 text-(--text-primary) font-bold font-display focus:border-(--accent) outline-none transition-colors" placeholder="g" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (!manualFood.name || !manualFood.calories) {
                                                    toast.error("Name and Calories are required.")
                                                    return
                                                }
                                                const item: FoodItem = {
                                                    id: `manual_${Date.now()}`,
                                                    name: manualFood.name,
                                                    brand: manualFood.brand,
                                                    calories: Number(manualFood.calories),
                                                    protein: Number(manualFood.protein) || 0,
                                                    carbs: Number(manualFood.carbs) || 0,
                                                    fat: Number(manualFood.fat) || 0,
                                                    servingSize: 1,
                                                    servingUnit: 'serving',
                                                    isVerified: false,
                                                    category: 'Other'
                                                }
                                                void (async () => {
                                                    await addFoodEntry(item, activeTargetMeal, 1)
                                                    toast.success(`${item.name} added manually!`)
                                                    setManualFood({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' })
                                                    setIsAddFoodOpen(false)
                                                })()
                                            }}
                                            className="w-full h-[54px] mt-8 bg-(--accent) text-white font-display font-bold text-[16px] rounded-[16px] hover:bg-(--accent-hover) transition-transform active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                                        >
                                            Save Custom Food
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    )
}
