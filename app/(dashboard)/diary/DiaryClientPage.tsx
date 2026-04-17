'use client'

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Search, Plus, Utensils, Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Camera, X, Activity, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useNutritionStore } from '@/store/useNutritionStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MealSlot, FoodItem } from '@/types'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { useFoodImageAnalyzer } from '@/lib/hooks/useFoodImageAnalyzer'

const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog').then((module) => module.ConfirmDialog), {
    ssr: false,
    loading: () => null,
})

const CameraScanner = dynamic(() => import('@/components/diary/CameraScanner').then((module) => module.CameraScanner), {
    ssr: false,
    loading: () => null,
})

const MacroResults = dynamic(() => import('@/components/diary/MacroResults').then((module) => module.MacroResults), {
    ssr: false,
    loading: () => null,
})

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

    const [selectedScanMealSlot, setSelectedScanMealSlot] = useState<MealSlot>('breakfast')
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)
    const manualImageInputRef = useRef<HTMLInputElement>(null)

    const {
        isScannerOpen,
        state: scanState,
        error: scannerError,
        foods: scanFoods,
        selectedMealSlot: analyzerMealSlot,
        scanImageDataUrl,
        isSaving: isSavingScan,
        videoRef,
        fileInputRef,
        setFoods: setScanFoods,
        setSelectedMealSlot,
        openScanner,
        closeScanner,
        captureFrame,
        handleFileChange,
        retake,
        saveAnalyzedFoods,
    } = useFoodImageAnalyzer({ initialMealSlot: 'breakfast', debounceMs: 2_000 })

    useEffect(() => {
        setSelectedScanMealSlot(analyzerMealSlot)
    }, [analyzerMealSlot])

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
        await saveAnalyzedFoods({ addFoodEntry })
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
                    <div
                        className={cn("h-full rounded-full shadow-[inset_0_1px_rgba(255,255,255,0.2)]", color)}
                        style={{ width: `${percent}%`, transition: 'width 800ms ease-out' }}
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
        <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 pb-20">
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



            <CameraScanner
                isOpen={isScannerOpen}
                state={scanState}
                error={scannerError}
                scanImageDataUrl={scanImageDataUrl}
                videoRef={videoRef}
                fileInputRef={fileInputRef}
                onClose={closeScanner}
                onCapture={() => {
                    void captureFrame()
                }}
                onRetake={() => {
                    void retake()
                }}
                onFileChange={(event) => {
                    void handleFileChange(event)
                }}
            >
                {scanState === 'results' && scanFoods.length > 0 ? (
                    <MacroResults
                        foods={scanFoods}
                        onFoodsChange={setScanFoods}
                        selectedMealSlot={selectedScanMealSlot}
                        mealSlots={mealSlots}
                        onMealSlotChange={(slot) => {
                            setSelectedMealSlot(slot)
                            setSelectedScanMealSlot(slot)
                        }}
                        onRetake={() => {
                            void retake()
                        }}
                        onSave={() => {
                            void handleSaveScanResult()
                        }}
                        isSaving={isSavingScan}
                        imagePreview={scanImageDataUrl}
                    />
                ) : null}
            </CameraScanner>

            {/* Add Food Modal Sheet */}
            {isAddFoodOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="w-full max-w-lg bg-(--bg-surface) sm:rounded-[24px] rounded-t-[24px] shadow-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden">
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

        </div>
    )
}
