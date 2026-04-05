'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, ScanLine, Utensils, Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, ArrowLeft, Camera, X, Check, Activity, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useNutritionStore } from '@/store/useNutritionStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MealSlot, FoodItem } from '@/types'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ScanResultPayload = {
    item: FoodItem
    quantity: number
    mealSlot: MealSlot
    hints?: string[]
    confidenceScore?: number
    scanLogId?: string | null
    imageUrl?: string | null
    sourceType?: 'upload' | 'camera'
}

type NutritionUploadResponse = {
    path: string
    url: string
    sourceType: 'upload' | 'camera'
}

export default function DiaryPage() {
    const { user } = useAuthStore()
    const { getDayLog, getDailyTotals, addEntry, removeEntry, fetchDayLog } = useNutritionStore()
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
    const [foodSearchResults, setFoodSearchResults] = useState<FoodItem[]>([])
    const [isFoodSearchLoading, setIsFoodSearchLoading] = useState(false)
    const [foodSearchError, setFoodSearchError] = useState<string | null>(null)
    const [addFoodTab, setAddFoodTab] = useState<'search' | 'manual'>('search')
    const [manualFood, setManualFood] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', imageUrl: '', imagePath: '' })
    const [isManualImageUploading, setIsManualImageUploading] = useState(false)

    // AI Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [scanState, setScanState] = useState<'idle' | 'uploading' | 'analyzing' | 'results'>('idle')
    const [scanImage, setScanImage] = useState<string | null>(null)
    const [scanResults, setScanResults] = useState<ScanResultPayload | null>(null)
    const [selectedScanMealSlot, setSelectedScanMealSlot] = useState<MealSlot>('breakfast')
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const manualImageInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                if (!event.target?.result || typeof event.target.result !== 'string') {
                    reject(new Error('Unable to read file.'))
                    return
                }
                resolve(event.target.result)
            }
            reader.onerror = () => reject(new Error('Unable to read file.'))
            reader.readAsDataURL(file)
        })

    const uploadNutritionImage = async (file: File, sourceType: 'upload' | 'camera'): Promise<NutritionUploadResponse> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('sourceType', sourceType)

        const response = await requestApi<NutritionUploadResponse>('/api/v1/nutrition/upload', {
            method: 'POST',
            body: formData,
        })

        return response.data
    }

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
        setSelectedScanMealSlot('breakfast')
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
        setSelectedScanMealSlot('breakfast')
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

    useEffect(() => {
        if (addFoodTab !== 'search') return

        const query = foodSearchQuery.trim()
        if (query.length < 2) {
            setFoodSearchResults([])
            setFoodSearchError(null)
            setIsFoodSearchLoading(false)
            return
        }

        let isCancelled = false
        setIsFoodSearchLoading(true)

        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const response = await requestApi<{ foods: FoodItem[] }>(`/api/v1/nutrition/foods/search?q=${encodeURIComponent(query)}&limit=12`)
                    if (isCancelled) return
                    setFoodSearchResults(response.data.foods)
                    setFoodSearchError(null)
                } catch (error) {
                    if (isCancelled) return
                    setFoodSearchResults([])
                    setFoodSearchError(error instanceof Error ? error.message : 'Food search failed.')
                } finally {
                    if (!isCancelled) {
                        setIsFoodSearchLoading(false)
                    }
                }
            })()
        }, 300)

        return () => {
            isCancelled = true
            clearTimeout(timer)
        }
    }, [addFoodTab, foodSearchQuery])

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0)
                canvas.toBlob((blob) => {
                    if (!blob) {
                        toast.error('Unable to capture this frame.')
                        return
                    }
                    const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
                    void processImageFile(capturedFile, 'camera')
                }, 'image/jpeg', 0.9)
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            void processImageFile(file, 'upload')
            if (!isScannerOpen) setIsScannerOpen(true)
        }

        e.target.value = ''
    }

    const processImageFile = async (file: File, sourceType: 'upload' | 'camera') => {
        setScanState('uploading')

        try {
            const imageData = await readFileAsDataUrl(file)
            setScanImage(imageData)

            let uploadedImage: NutritionUploadResponse | null = null
            try {
                uploadedImage = await uploadNutritionImage(file, sourceType)
            } catch (error) {
                console.error('Nutrition image upload failed:', error)
                toast.error('Image upload failed. Continuing scan without cloud image.')
            }

            setScanState('analyzing')

            const response = await requestApi<ScanResultPayload>('/api/v1/nutrition/ai-scan', {
                method: 'POST',
                body: JSON.stringify({
                    imageData,
                    imageUrl: uploadedImage?.url,
                    sourceType,
                }),
            })

            const payload = {
                ...response.data,
                imageUrl: response.data.imageUrl || uploadedImage?.url || null,
                sourceType,
            }

            setScanResults(payload)
            setSelectedScanMealSlot(payload.mealSlot)
            setScanState('results')
        } catch (error) {
            setScanState('idle')
            toast.error(error instanceof Error ? error.message : 'Unable to analyze this image right now.')
        }
    }

    const defaultFoodSuggestions: FoodItem[] = [
        { id: 'suggest-oatmeal', name: 'Oatmeal', brand: 'Quaker', calories: 150, protein: 5, carbs: 27, fat: 3, servingSize: 1, servingUnit: 'cup', isVerified: true, category: 'Grains' },
        { id: 'suggest-chicken', name: 'Chicken Breast', brand: 'Generic', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: 'g', isVerified: true, category: 'Protein' },
        { id: 'suggest-yogurt', name: 'Greek Yogurt', brand: 'Chobani', calories: 100, protein: 15, carbs: 6, fat: 0, servingSize: 1, servingUnit: 'container', isVerified: true, category: 'Dairy' },
        { id: 'suggest-shake', name: 'Protein Shake', brand: 'Optimum Nutrition', calories: 120, protein: 24, carbs: 3, fat: 1, servingSize: 1, servingUnit: 'scoop', isVerified: true, category: 'Supplements' },
    ]

    const displayedSearchFoods = foodSearchQuery.trim().length >= 2 ? foodSearchResults : defaultFoodSuggestions

    const handleManualFoodImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsManualImageUploading(true)
        try {
            const uploaded = await uploadNutritionImage(file, 'upload')
            setManualFood((previous) => ({ ...previous, imageUrl: uploaded.url, imagePath: uploaded.path }))
            toast.success('Image uploaded for this food item.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Image upload failed.')
        } finally {
            setIsManualImageUploading(false)
            event.target.value = ''
        }
    }

    const addFoodEntry = async (
        foodItem: FoodItem,
        mealSlot: MealSlot,
        quantity = 1,
        options?: {
            imageUrl?: string
            imageSource?: 'manual_upload' | 'ai_scan' | 'food_api'
            isAiGenerated?: boolean
            scanMetadata?: Record<string, unknown>
        },
    ) => {
        await addEntry(dateStr, {
            foodItemId: foodItem.id,
            foodItem,
            quantity,
            mealSlot,
            loggedAt: new Date().toISOString(),
        }, options)
    }

    const handleSaveScanResult = async () => {
        if (scanResults) {
            await addFoodEntry(
                { ...scanResults.item, imageUrl: scanResults.imageUrl || scanResults.item.imageUrl },
                selectedScanMealSlot,
                scanResults.quantity,
                {
                    imageUrl: scanResults.imageUrl || undefined,
                    imageSource: scanResults.imageUrl ? 'ai_scan' : undefined,
                    isAiGenerated: true,
                    scanMetadata: {
                        scanLogId: scanResults.scanLogId || null,
                        confidenceScore: scanResults.confidenceScore || null,
                        hints: scanResults.hints || [],
                        sourceType: scanResults.sourceType || 'upload',
                    },
                },
            )
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
        { id: 'morning_snack', label: 'Morning Snack' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'afternoon_snack', label: 'Afternoon Snack' },
        { id: 'dinner', label: 'Dinner' },
        { id: 'evening_snack', label: 'Evening Snack' },
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
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {entry.foodItem.imageUrl ? (
                                                                <img
                                                                    src={entry.foodItem.imageUrl}
                                                                    alt={entry.foodItem.name}
                                                                    className="w-[44px] h-[44px] rounded-[10px] object-cover border border-(--border-subtle)"
                                                                />
                                                            ) : (
                                                                <div className="w-[44px] h-[44px] rounded-[10px] bg-(--bg-elevated) border border-(--border-subtle) flex items-center justify-center">
                                                                    <Utensils className="w-[16px] h-[16px] text-(--text-tertiary)" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <span className="block truncate font-body text-[15px] text-(--text-primary) font-semibold">{entry.foodItem.name}</span>
                                                                <span className="block font-body text-[13px] text-(--text-secondary) mt-0.5">{entry.foodItem.brand ? `${entry.foodItem.brand} • ` : ''}{entry.quantity * entry.foodItem.servingSize}{entry.foodItem.servingUnit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <span className="block font-body text-[15px] text-(--text-primary) font-bold">{entry.foodItem.calories * entry.quantity}</span>
                                                                <span className="block font-body text-[12px] text-(--text-tertiary) font-medium mt-0.5">P: {entry.foodItem.protein * entry.quantity}g</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    openConfirmation(
                                                                        {
                                                                            title: 'Remove Diary Item?',
                                                                            message: `${entry.foodItem.name} will be removed from ${slot.label}.`,
                                                                            confirmText: 'Remove Item',
                                                                            tone: 'danger',
                                                                        },
                                                                        async () => {
                                                                            await removeEntry(dateStr, entry.id)
                                                                            toast.success('Diary item removed.')
                                                                        },
                                                                    )
                                                                }}
                                                                className="p-2 rounded-[10px] text-(--status-danger) hover:bg-red-500/10 transition-colors"
                                                                title="Remove item"
                                                            >
                                                                <Trash2 className="w-[16px] h-[16px]" />
                                                            </button>
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

                            {/* Upload/Analysis Overlay */}
                            {scanState === 'uploading' && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(56,189,248,0.25)] flex flex-col items-center justify-center z-30">
                                    <div className="w-[120px] h-[120px] rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin mb-6" />
                                    <h2 className="font-display font-black text-[22px] sm:text-[24px] lg:text-[28px] text-white mb-2">Uploading Image...</h2>
                                    <p className="font-body text-sky-300 font-medium">Saving a secure copy for your diary log</p>
                                </div>
                            )}

                            {scanState === 'analyzing' && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center z-30">
                                    <div className="w-[120px] h-[120px] rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                    <h2 className="font-display font-black text-[22px] sm:text-[24px] lg:text-[28px] text-white mb-2">Analyzing Meal...</h2>
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
                                                <p className="font-body text-[14px] text-zinc-500 dark:text-zinc-400">AI Confidence: {Math.round((scanResults.confidenceScore || 0.8) * 100)}%</p>
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

                                        <div className="mb-4">
                                            <p className="font-body text-[12px] uppercase tracking-wide font-bold text-zinc-500 dark:text-zinc-400 mb-2">Log To Meal Slot</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {mealSlots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => setSelectedScanMealSlot(slot.id)}
                                                        className={cn(
                                                            'h-[38px] rounded-[12px] border font-body text-[12px] font-bold transition-colors',
                                                            selectedScanMealSlot === slot.id
                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
                                                        )}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => {
                                                setScanState('idle')
                                                setScanImage(null)
                                                setScanResults(null)
                                            }} className="h-[56px] px-6 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 font-body font-bold text-[16px] text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-[0.5]">
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
                                        {isFoodSearchLoading && (
                                            <div className="py-10 flex flex-col items-center text-(--text-secondary)">
                                                <Loader2 className="w-[24px] h-[24px] animate-spin" />
                                                <span className="mt-2 text-[13px]">Searching foods...</span>
                                            </div>
                                        )}

                                        {!isFoodSearchLoading && foodSearchError && (
                                            <div className="text-center py-8 text-[13px] text-red-600">{foodSearchError}</div>
                                        )}

                                        {!isFoodSearchLoading && !foodSearchError && displayedSearchFoods.map((food) => (
                                            <div key={food.id} className="flex justify-between items-center p-3 rounded-[12px] border border-(--border-subtle) hover:border-emerald-500 bg-[var(--bg-elevated)] cursor-pointer group"
                                                onClick={() => {
                                                    void (async () => {
                                                        await addFoodEntry(food, activeTargetMeal, 1, {
                                                            imageUrl: food.imageUrl,
                                                            imageSource: food.imageUrl ? 'food_api' : undefined,
                                                        })
                                                        toast.success(`${food.name} added!`)
                                                        setIsAddFoodOpen(false)
                                                    })()
                                                }}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {food.imageUrl ? (
                                                        <img
                                                            src={food.imageUrl}
                                                            alt={food.name}
                                                            className="w-[40px] h-[40px] rounded-[10px] object-cover border border-(--border-subtle)"
                                                        />
                                                    ) : (
                                                        <div className="w-[40px] h-[40px] rounded-[10px] bg-(--bg-base) border border-(--border-subtle) flex items-center justify-center">
                                                            <Utensils className="w-[14px] h-[14px] text-(--text-tertiary)" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="block truncate font-bold text-[14px] text-(--text-primary)">{food.name} {food.brand && <span className="text-(--text-tertiary) font-normal">({food.brand})</span>}</span>
                                                        <span className="block text-[12px] text-(--text-secondary)">1 {food.servingUnit} • {food.calories} kcal</span>
                                                    </div>
                                                </div>
                                                <button className="w-[32px] h-[32px] rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="w-[16px] h-[16px]" />
                                                </button>
                                            </div>
                                        ))}

                                        {!isFoodSearchLoading && !foodSearchError && foodSearchQuery.trim().length >= 2 && displayedSearchFoods.length === 0 && (
                                            <div className="text-center py-6 text-(--text-tertiary) text-[13px]">No results found. <button onClick={() => setAddFoodTab('manual')} className="text-emerald-500 font-bold hover:underline">Add Custom Food</button></div>
                                        )}

                                        {foodSearchQuery && (
                                            <div className="text-center py-3 text-(--text-tertiary) text-[13px]">Can&apos;t find it? <button onClick={() => setAddFoodTab('manual')} className="text-emerald-500 font-bold hover:underline">Add Custom Food</button></div>
                                        )}
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
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Food Image <span className="text-(--text-tertiary) lowercase normal-case">(optional)</span></label>
                                            <input type="file" accept="image/*" className="hidden" ref={manualImageInputRef} onChange={handleManualFoodImageChange} />
                                            {manualFood.imageUrl ? (
                                                <div className="rounded-[12px] border border-(--border-default) bg-(--bg-surface) p-3">
                                                    <img src={manualFood.imageUrl} alt="Manual food" className="w-full h-[140px] rounded-[10px] object-cover" />
                                                    <button
                                                        onClick={() => setManualFood((previous) => ({ ...previous, imageUrl: '', imagePath: '' }))}
                                                        className="mt-3 h-[36px] px-4 rounded-[10px] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)"
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => manualImageInputRef.current?.click()}
                                                    disabled={isManualImageUploading}
                                                    className="w-full h-[44px] rounded-[12px] border border-dashed border-(--border-default) text-(--text-secondary) hover:text-(--accent) hover:border-(--accent) transition-colors disabled:opacity-60"
                                                >
                                                    {isManualImageUploading ? 'Uploading image...' : 'Upload Food Image'}
                                                </button>
                                            )}
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
                                                    imageUrl: manualFood.imageUrl || undefined,
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
                                                    await addFoodEntry(item, activeTargetMeal, 1, {
                                                        imageUrl: manualFood.imageUrl || undefined,
                                                        imageSource: manualFood.imageUrl ? 'manual_upload' : undefined,
                                                    })
                                                    toast.success(`${item.name} added manually!`)
                                                    setManualFood({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', imageUrl: '', imagePath: '' })
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
