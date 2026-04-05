'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Video, Calendar, Edit3, Utensils, Award, Search, X, UploadCloud, CheckCircle2, Trash2, Plus, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ComposerTab = 'Post' | 'Video' | 'Meal' | 'Challenge'
type PublicationType = 'Post' | 'Video' | 'Meal' | 'Challenge'

interface PublicationItem {
    id: string
    title: string
    type: PublicationType
    date: string
    likes: number
    tags: string[]
}

interface MealDay {
    id: string
    title: string
    detail: string
    notes: string
    foods: Array<{
        id: string
        name: string
        source: 'manual' | 'api'
        mealSlot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
        serving: string
        calories: number
        protein: number
        carbs: number
        fat: number
        category?: string
        imageUrl?: string | null
    }>
    drinks: Array<{
        id: string
        name: string
        amount: string
        calories: number
    }>
    macroTarget: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
}

interface NutritionFoodResult {
    id: string
    name: string
    brand?: string
    servingSize: number
    servingUnit: string
    calories: number
    protein: number
    carbs: number
    fat: number
    category: string
    imageUrl?: string
}

export default function ContentPublisherPage() {
    const [composerTab, setComposerTab] = useState<ComposerTab>('Post')
    const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null)
    const [title, setTitle] = useState('')
    const [postContent, setPostContent] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [subscribersOnly, setSubscribersOnly] = useState(true)
    const [publications, setPublications] = useState<PublicationItem[]>([])
    const [scheduleTitle, setScheduleTitle] = useState('')
    const [search, setSearch] = useState('')
    const [isMealPreviewOpen, setIsMealPreviewOpen] = useState(false)
    const [expandedMediaUrl, setExpandedMediaUrl] = useState<string | null>(null)
    const [expandedMediaType, setExpandedMediaType] = useState<'image' | 'video'>('image')
    const [mealClientIds, setMealClientIds] = useState<string[]>([])
    const [mealSearchQuery, setMealSearchQuery] = useState('')
    const [mealSearchResults, setMealSearchResults] = useState<NutritionFoodResult[]>([])
    const [mealSearchSource, setMealSearchSource] = useState('')
    const [mealSearchTargetDayId, setMealSearchTargetDayId] = useState('d1')
    const [isMealSearching, setIsMealSearching] = useState(false)
    const [activeScheduleActionId, setActiveScheduleActionId] = useState<string | null>(null)
    const [scheduleAt, setScheduleAt] = useState(getDefaultScheduleAt())
    const [uploadingFoodImageId, setUploadingFoodImageId] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [mealDays, setMealDays] = useState<MealDay[]>([
        {
            id: 'd1',
            title: 'Day 1',
            detail: 'Breakfast, Lunch, Dinner focus',
            notes: '',
            foods: [],
            drinks: [],
            macroTarget: { calories: 2400, protein: 180, carbs: 260, fat: 70 },
        },
        {
            id: 'd2',
            title: 'Day 2',
            detail: 'Higher carb training day',
            notes: '',
            foods: [],
            drinks: [],
            macroTarget: { calories: 2300, protein: 175, carbs: 240, fat: 68 },
        },
    ])
    const mediaInputRef = useRef<HTMLInputElement>(null)
    const sequenceRef = useRef(0)
    const { events, fetchEvents, addScheduleEvent, updateScheduleEventStatus, deleteScheduleEvent, clients, fetchClients } = useCoachPortalData()

    const loadPublications = useCallback(async () => {
        try {
            const response = await requestApi<{
                publications: Array<{
                    id: string
                    title: string
                    type: PublicationType
                    createdAt: string
                    likes: number
                    tags?: string[]
                }>
            }>('/api/v1/coach/content?limit=20')

            setPublications(
                response.data.publications.map((publication) => ({
                    id: publication.id,
                    title: publication.title,
                    type: publication.type,
                    date: formatDateLabel(publication.createdAt),
                    likes: publication.likes,
                    tags: Array.isArray(publication.tags) ? publication.tags.map((tag) => String(tag)) : [],
                })),
            )
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }, [])

    useEffect(() => {
        void fetchEvents()
        void fetchClients()
    }, [fetchClients, fetchEvents])

    useEffect(() => {
        if (!mealDays.length) return
        if (mealDays.some((day) => day.id === mealSearchTargetDayId)) return
        setMealSearchTargetDayId(mealDays[0].id)
    }, [mealDays, mealSearchTargetDayId])

    const updateMealDay = useCallback((dayId: string, updater: (day: MealDay) => MealDay) => {
        setMealDays((current) => current.map((day) => (day.id === dayId ? updater(day) : day)))
    }, [])

    const searchNutritionFoods = useCallback(async () => {
        const query = mealSearchQuery.trim()
        if (query.length < 2) {
            toast.info('Search for at least 2 characters.')
            return
        }

        setIsMealSearching(true)
        try {
            const response = await requestApi<{ foods: NutritionFoodResult[]; source: string }>(
                `/api/v1/nutrition/foods/search?q=${encodeURIComponent(query)}&limit=8`,
            )

            setMealSearchResults(Array.isArray(response.data.foods) ? response.data.foods : [])
            setMealSearchSource(String(response.data.source || ''))
        } catch (error) {
            toast.error(getErrorMessage(error))
            setMealSearchResults([])
            setMealSearchSource('')
        } finally {
            setIsMealSearching(false)
        }
    }, [mealSearchQuery])

    const addFoodToMealDay = useCallback((dayId: string, food: NutritionFoodResult) => {
        updateMealDay(dayId, (day) => ({
            ...day,
            foods: [
                ...day.foods,
                {
                    id: `${food.id}-${Date.now()}`,
                    name: food.name,
                    source: 'api',
                    mealSlot: inferMealSlot(food.category),
                    serving: `${food.servingSize}${food.servingUnit}`,
                    calories: Number(food.calories || 0),
                    protein: Number(food.protein || 0),
                    carbs: Number(food.carbs || 0),
                    fat: Number(food.fat || 0),
                    category: food.category,
                    imageUrl: food.imageUrl || null,
                },
            ],
        }))
    }, [updateMealDay])

    const addManualFood = useCallback((dayId: string) => {
        updateMealDay(dayId, (day) => ({
            ...day,
            foods: [
                ...day.foods,
                {
                    id: `manual-food-${Date.now()}`,
                    name: 'Custom food',
                    source: 'manual',
                    mealSlot: 'Breakfast',
                    serving: '100g',
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    category: 'Other',
                    imageUrl: null,
                },
            ],
        }))
    }, [updateMealDay])

    const addManualDrink = useCallback((dayId: string) => {
        updateMealDay(dayId, (day) => ({
            ...day,
            drinks: [
                ...day.drinks,
                {
                    id: `manual-drink-${Date.now()}`,
                    name: 'Electrolyte drink',
                    amount: '500ml',
                    calories: 0,
                },
            ],
        }))
    }, [updateMealDay])

    const uploadMediaFile = useCallback(async (file: File) => {
        setIsUploadingMedia(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', 'content')

            const response = await requestApi<{ url: string; mediaKind: 'image' | 'video' }>('/api/v1/coach/media/upload', {
                method: 'POST',
                body: formData,
            })

            setMediaUrl(String(response.data.url || ''))
            setMediaKind(response.data.mediaKind || (file.type.startsWith('video/') ? 'video' : 'image'))
            toast.success('Media uploaded.')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsUploadingMedia(false)
        }
    }, [])

    const uploadFoodImage = useCallback(async (dayId: string, foodId: string, file: File) => {
        setUploadingFoodImageId(foodId)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', 'meal-food')

            const response = await requestApi<{ url: string }>('/api/v1/coach/media/upload', {
                method: 'POST',
                body: formData,
            })

            const uploadedUrl = String(response.data.url || '')
            if (!uploadedUrl) {
                toast.error('Upload failed: media URL missing.')
                return
            }

            updateMealDay(dayId, (day) => ({
                ...day,
                foods: day.foods.map((food) =>
                    food.id === foodId
                        ? {
                            ...food,
                            imageUrl: uploadedUrl,
                        }
                        : food,
                ),
            }))

            toast.success('Food image uploaded.')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setUploadingFoodImageId(null)
        }
    }, [updateMealDay])

    const openConfirmation = useCallback(
        (
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
        },
        [],
    )

    const closeConfirmation = useCallback(() => {
        if (isConfirming) return
        setConfirmDialog(null)
        setPendingConfirmationAction(null)
    }, [isConfirming])

    const runConfirmedAction = useCallback(async () => {
        if (!pendingConfirmationAction) return

        setIsConfirming(true)
        try {
            await pendingConfirmationAction()
            setConfirmDialog(null)
            setPendingConfirmationAction(null)
        } finally {
            setIsConfirming(false)
        }
    }, [pendingConfirmationAction])

    const handleDropMedia = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0]
        if (!file) return
        void uploadMediaFile(file)
    }, [uploadMediaFile])

    const handlePickMedia = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        void uploadMediaFile(file)
        event.target.value = ''
    }, [uploadMediaFile])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPublications()
        }, 0)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [loadPublications])

    const filteredPublications = useMemo(
        () => publications.filter((post) => post.title.toLowerCase().includes(search.toLowerCase())),
        [publications, search],
    )

    const scheduledItems = useMemo(
        () => [...events]
            .filter((event) => event.type.toLowerCase().includes('content') || event.title.toLowerCase().includes('content'))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .slice(0, 4),
        [events],
    )

    const handlePublish = async () => {
        if (!title.trim() || !postContent.trim()) {
            toast.error('Title and description are required.')
            return
        }

        if (composerTab === 'Video' && !mediaUrl) {
            toast.error('Upload a video before publishing.')
            return
        }

        if (composerTab === 'Meal' && mealClientIds.length === 0) {
            toast.error('Select at least one client for this meal plan.')
            return
        }

        try {
            const tags = tagInput
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)

            await requestApi<{ publication: { id: string } }>('/api/v1/coach/content', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description: postContent,
                    type: composerTab,
                    mediaUrl: mediaUrl || null,
                    subscribersOnly,
                    tags,
                    mealDays: mealDays.map((day) => ({
                        title: day.title,
                        detail: day.detail,
                        notes: day.notes,
                        foods: day.foods,
                        drinks: day.drinks,
                        macroTarget: day.macroTarget,
                    })),
                    clientIds: composerTab === 'Meal' ? mealClientIds : [],
                }),
            })

            await loadPublications()
            toast.success('Content published successfully.')
            resetComposer()
        } catch (error) {
            toast.error(getErrorMessage(error))
            return
        }
    }

    const handleSchedule = async () => {
        const resolvedTitle = scheduleTitle.trim() || title.trim()
        if (!resolvedTitle) {
            toast.error('Add a title before scheduling content.')
            return
        }

        const start = new Date(scheduleAt)
        if (!Number.isFinite(start.getTime())) {
            toast.error('Choose a valid schedule date and time.')
            return
        }
        const end = new Date(start)
        end.setMinutes(30)

        await addScheduleEvent({
            title: `Content: ${resolvedTitle}`,
            type: 'Content',
            startAt: start.toISOString(),
            endAt: end.toISOString(),
        })

        setScheduleTitle('')
        toast.success('Content slot added to your schedule.')
    }

    const handleScheduledEventAction = async (eventId: string, action: 'complete' | 'delete') => {
        setActiveScheduleActionId(`${eventId}-${action}`)
        try {
            if (action === 'complete') {
                await updateScheduleEventStatus(eventId, 'completed')
                toast.success('Scheduled item marked as complete.')
            } else {
                await deleteScheduleEvent(eventId)
                toast.success('Scheduled item deleted.')
            }
            await fetchEvents({ force: true })
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setActiveScheduleActionId(null)
        }
    }

    const resetComposer = () => {
        setTitle('')
        setPostContent('')
        setMediaUrl('')
        setMediaKind(null)
        setTagInput('')
        setMealClientIds([])
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Content Publisher</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Publish to your subscribers&apos; feed or public marketplace.</p>
            </div>

            {/* Composer */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                <div className="flex border-b border-(--border-subtle) bg-[var(--bg-elevated)] overflow-x-auto no-scrollbar">
                    {['Post', 'Video', 'Meal', 'Challenge'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setComposerTab(tab as ComposerTab)}
                            className={cn(
                                'px-6 py-4 font-body font-bold text-[14px] transition-colors relative whitespace-nowrap flex items-center gap-2',
                                composerTab === tab ? 'text-(--text-primary) bg-(--bg-surface)' : 'text-(--text-secondary) hover:text-(--text-primary)',
                            )}
                        >
                            {tab === 'Post' && <Edit3 className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Video' && <Video className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Meal' && <Utensils className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Challenge' && <Award className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab}
                            {composerTab === tab && <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {(composerTab === 'Post' || composerTab === 'Video' || composerTab === 'Challenge') && (
                        <div className="flex flex-col gap-4">
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder={`${composerTab} title`}
                                className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[14px] px-4 font-display font-bold text-[15px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <textarea 
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                placeholder="Write your publication details, key takeaways, and call to action..."
                                className="w-full min-h-[120px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[15px] text-(--text-primary) outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            />
                            <input
                                ref={mediaInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime"
                                className="hidden"
                                onChange={handlePickMedia}
                            />
                            <div
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={handleDropMedia}
                                className="rounded-[14px] border border-dashed border-(--border-subtle) bg-[var(--bg-elevated)] p-4 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-[36px] h-[36px] rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) flex items-center justify-center">
                                        <UploadCloud className="w-[18px] h-[18px]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[13px] text-(--text-primary)">Drag and drop media</p>
                                        <p className="text-[12px] text-(--text-secondary)">Images or video files, up to 25MB.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => mediaInputRef.current?.click()}
                                    className="h-[34px] px-3 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                                >
                                    Browse
                                </button>
                            </div>
                            {mediaUrl && (
                                <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-(--text-secondary) mb-2">Media Preview</p>
                                    {mediaKind === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl) ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExpandedMediaType('video')
                                                setExpandedMediaUrl(mediaUrl)
                                            }}
                                            className="w-full"
                                        >
                                            <video src={mediaUrl} controls className="w-full max-h-[260px] rounded-[10px] bg-black" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExpandedMediaType('image')
                                                setExpandedMediaUrl(mediaUrl)
                                            }}
                                            className="w-full"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={mediaUrl} alt="Content media preview" className="w-full max-h-[260px] object-cover rounded-[10px]" />
                                        </button>
                                    )}
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-(--text-secondary) font-bold">Upload-only media mode</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaUrl('')
                                                setMediaKind(null)
                                            }}
                                            className="h-[28px] px-2 rounded-[8px] border border-(--border-default) text-[11px] font-bold text-(--text-secondary)"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                            <input
                                value={tagInput}
                                onChange={(event) => setTagInput(event.target.value)}
                                placeholder="Tags (comma separated): hypertrophy, mobility"
                                className="w-full h-[44px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setMediaKind('image')}
                                        className={cn(
                                            'w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors',
                                            mediaKind === 'image' && 'bg-emerald-500/10 text-emerald-600',
                                        )}
                                    >
                                        <ImageIcon className="w-[20px] h-[20px]" />
                                    </button>
                                    <button 
                                        onClick={() => setMediaKind('video')}
                                        className={cn(
                                            'w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors',
                                            mediaKind === 'video' && 'bg-emerald-500/10 text-emerald-600',
                                        )}
                                    >
                                        <Video className="w-[20px] h-[20px]" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input
                                            type="checkbox"
                                            className="accent-emerald-500 w-[16px] h-[16px]"
                                            checked={subscribersOnly}
                                            onChange={(event) => setSubscribersOnly(event.target.checked)}
                                        />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        disabled={!title.trim() || !postContent.trim()}
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Publish Content?',
                                                    message: 'This will publish the content to your selected audience.',
                                                    confirmText: 'Publish',
                                                },
                                                async () => {
                                                    await handlePublish()
                                                },
                                            )
                                        }}
                                        className="h-[40px] px-6 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[14px] flex items-center gap-2 shadow-sm transition-colors"
                                    >
                                        Post Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {composerTab === 'Meal' && (
                        <div className="flex flex-col gap-4">
                            <input 
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Meal Plan Title (e.g. 7-Day High Protein Cut)"
                                className="w-full h-[52px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] px-4 font-display font-bold text-[16px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <textarea 
                                value={postContent}
                                onChange={(event) => setPostContent(event.target.value)}
                                placeholder="Description and macro goals..."
                                className="w-full h-[80px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[14px] text-(--text-primary) outline-none resize-none focus:border-emerald-500"
                            />

                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden">
                                <div className="bg-[var(--bg-elevated)] p-3 border-b border-(--border-subtle) font-bold text-[14px] text-(--text-primary)">
                                    Assign To Clients
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto bg-(--bg-surface)">
                                    {clients.map((client) => {
                                        const isChecked = mealClientIds.includes(client.id)
                                        return (
                                            <label key={client.id} className="flex items-center gap-2 text-[13px] text-(--text-primary)">
                                                <input
                                                    type="checkbox"
                                                    className="accent-emerald-500 w-[15px] h-[15px]"
                                                    checked={isChecked}
                                                    onChange={(event) => {
                                                        const checked = event.target.checked
                                                        setMealClientIds((current) =>
                                                            checked
                                                                ? Array.from(new Set([...current, client.id]))
                                                                : current.filter((id) => id !== client.id),
                                                        )
                                                    }}
                                                />
                                                <span className="truncate">{client.name}</span>
                                            </label>
                                        )
                                    })}
                                    {!clients.length && (
                                        <span className="text-[12px] text-(--text-secondary)">No coach clients loaded yet.</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden">
                                <div className="bg-[var(--bg-elevated)] p-3 border-b border-(--border-subtle) flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-bold text-[14px] text-(--text-primary)">Rich Meal Configuration</p>
                                        <p className="text-[12px] text-(--text-secondary)">Add foods and drinks manually or from the nutrition API.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={mealSearchTargetDayId}
                                            onChange={(event) => setMealSearchTargetDayId(event.target.value)}
                                            className="h-[34px] px-2 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                                        >
                                            {mealDays.map((day) => (
                                                <option key={day.id} value={day.id}>{day.title}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => addManualFood(mealSearchTargetDayId)}
                                            className="h-[34px] px-3 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                                        >
                                            + Manual Food
                                        </button>
                                        <button
                                            onClick={() => addManualDrink(mealSearchTargetDayId)}
                                            className="h-[34px] px-3 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                                        >
                                            + Drink
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 border-b border-(--border-subtle) bg-(--bg-surface)">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            value={mealSearchQuery}
                                            onChange={(event) => setMealSearchQuery(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault()
                                                    void searchNutritionFoods()
                                                }
                                            }}
                                            placeholder="Search foods (e.g., chicken breast, oats)"
                                            className="flex-1 h-[38px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                        />
                                        <button
                                            onClick={() => { void searchNutritionFoods() }}
                                            className="h-[38px] px-4 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600"
                                        >
                                            {isMealSearching ? 'Searching...' : 'Search API'}
                                        </button>
                                    </div>

                                    {mealSearchResults.length > 0 && (
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {mealSearchResults.map((food) => (
                                                <div key={food.id} className="rounded-[10px] border border-(--border-default) bg-[var(--bg-elevated)] p-2.5 flex items-center gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-[12px] text-(--text-primary) truncate">{food.name}</p>
                                                        <p className="text-[11px] text-(--text-secondary)">{Math.round(food.calories)} kcal • P {Math.round(food.protein)} • C {Math.round(food.carbs)} • F {Math.round(food.fat)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => addFoodToMealDay(mealSearchTargetDayId, food)}
                                                        className="h-[28px] px-2 rounded-[8px] bg-emerald-500 text-white text-[11px] font-bold"
                                                    >
                                                        <Plus className="inline w-[10px] h-[10px] mr-1" /> Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!!mealSearchSource && (
                                        <p className="mt-2 text-[11px] text-(--text-tertiary)">Source: {mealSearchSource}</p>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col gap-3 max-h-[420px] overflow-y-auto bg-(--bg-surface)">
                                    {mealDays.map((day) => {
                                        const foodTotals = day.foods.reduce(
                                            (acc, item) => ({
                                                calories: acc.calories + Number(item.calories || 0),
                                                protein: acc.protein + Number(item.protein || 0),
                                                carbs: acc.carbs + Number(item.carbs || 0),
                                                fat: acc.fat + Number(item.fat || 0),
                                            }),
                                            { calories: 0, protein: 0, carbs: 0, fat: 0 },
                                        )
                                        const drinkCalories = day.drinks.reduce((acc, item) => acc + Number(item.calories || 0), 0)

                                        return (
                                            <div key={day.id} className="p-3 border border-(--border-default) bg-[var(--bg-elevated)] rounded-[12px] flex flex-col gap-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <input
                                                        value={day.title}
                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({ ...currentDay, title: event.target.value }))}
                                                        className="h-[34px] px-2 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-[13px] font-bold text-(--text-primary) outline-none"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setMealDays((current) => current.filter((item) => item.id !== day.id))
                                                        }}
                                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) text-[11px] font-bold text-(--text-secondary) hover:text-red-600"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <textarea
                                                    value={day.detail}
                                                    onChange={(event) => updateMealDay(day.id, (currentDay) => ({ ...currentDay, detail: event.target.value }))}
                                                    placeholder="Day summary"
                                                    className="w-full h-[56px] resize-none rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-2 text-[12px] outline-none"
                                                />

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {(['calories', 'protein', 'carbs', 'fat'] as const).map((macro) => (
                                                        <label key={macro} className="text-[10px] font-bold uppercase tracking-wide text-(--text-secondary)">
                                                            Target {macro}
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={day.macroTarget[macro]}
                                                                onChange={(event) => {
                                                                    const nextValue = Math.max(0, Number(event.target.value || 0))
                                                                    updateMealDay(day.id, (currentDay) => ({
                                                                        ...currentDay,
                                                                        macroTarget: {
                                                                            ...currentDay.macroTarget,
                                                                            [macro]: nextValue,
                                                                        },
                                                                    }))
                                                                }}
                                                                className="mt-1 w-full h-[30px] px-2 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-[12px]"
                                                            />
                                                        </label>
                                                    ))}
                                                </div>

                                                <div className="rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) p-2">
                                                    <p className="text-[11px] font-bold text-(--text-secondary) mb-2">Food Items ({day.foods.length})</p>
                                                    <div className="flex flex-col gap-2">
                                                        {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((mealSlot) => {
                                                            const slotFoods = day.foods.filter((food) => food.mealSlot === mealSlot)

                                                            return (
                                                                <div key={`${day.id}-${mealSlot}`} className="rounded-[10px] border border-(--border-default) bg-[var(--bg-elevated)] p-2">
                                                                    <p className="text-[11px] font-bold uppercase tracking-wide text-(--text-secondary) mb-2">{mealSlot}</p>
                                                                    <div className="flex flex-col gap-2">
                                                                        {slotFoods.map((food) => (
                                                                            <div key={food.id} className="rounded-[8px] border border-(--border-default) bg-(--bg-surface) p-2 flex flex-col gap-2">
                                                                                <div className="grid grid-cols-12 gap-1 items-center">
                                                                                    <input
                                                                                        value={food.name}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, name: event.target.value } : entry),
                                                                                        }))}
                                                                                        className="col-span-5 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                    <input
                                                                                        value={food.serving}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, serving: event.target.value } : entry),
                                                                                        }))}
                                                                                        className="col-span-2 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                    <select
                                                                                        value={food.mealSlot}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, mealSlot: event.target.value as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' } : entry),
                                                                                        }))}
                                                                                        className="col-span-4 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    >
                                                                                        <option value="Breakfast">Breakfast</option>
                                                                                        <option value="Lunch">Lunch</option>
                                                                                        <option value="Dinner">Dinner</option>
                                                                                        <option value="Snack">Snack</option>
                                                                                    </select>
                                                                                    <button
                                                                                        onClick={() => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.filter((entry) => entry.id !== food.id),
                                                                                        }))}
                                                                                        className="col-span-1 h-[30px] rounded-[8px] border border-(--border-default) text-(--text-secondary) hover:text-red-600"
                                                                                    >
                                                                                        <Trash2 className="w-[12px] h-[12px] mx-auto" />
                                                                                    </button>
                                                                                </div>

                                                                                <div className="grid grid-cols-4 gap-1">
                                                                                    <input
                                                                                        type="number"
                                                                                        value={food.calories}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, calories: Math.max(0, Number(event.target.value || 0)) } : entry),
                                                                                        }))}
                                                                                        placeholder="kcal"
                                                                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={food.protein}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, protein: Math.max(0, Number(event.target.value || 0)) } : entry),
                                                                                        }))}
                                                                                        placeholder="protein"
                                                                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={food.carbs}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, carbs: Math.max(0, Number(event.target.value || 0)) } : entry),
                                                                                        }))}
                                                                                        placeholder="carbs"
                                                                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={food.fat}
                                                                                        onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                                            ...currentDay,
                                                                                            foods: currentDay.foods.map((entry) => entry.id === food.id ? { ...entry, fat: Math.max(0, Number(event.target.value || 0)) } : entry),
                                                                                        }))}
                                                                                        placeholder="fat"
                                                                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                                    />
                                                                                </div>

                                                                                <input
                                                                                    id={`food-image-input-${day.id}-${food.id}`}
                                                                                    type="file"
                                                                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                                                                    className="hidden"
                                                                                    onChange={(event) => {
                                                                                        const file = event.target.files?.[0]
                                                                                        if (!file) return
                                                                                        void uploadFoodImage(day.id, food.id, file)
                                                                                        event.target.value = ''
                                                                                    }}
                                                                                />

                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const input = document.getElementById(`food-image-input-${day.id}-${food.id}`) as HTMLInputElement | null
                                                                                            input?.click()
                                                                                        }}
                                                                                        className="h-[26px] px-2 rounded-[8px] border border-(--border-default) text-[11px] font-bold text-(--text-primary) flex items-center gap-1"
                                                                                    >
                                                                                        <ImagePlus className="w-[11px] h-[11px]" />
                                                                                        {uploadingFoodImageId === food.id ? 'Uploading...' : 'Food Image'}
                                                                                    </button>
                                                                                    {!!food.imageUrl && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setExpandedMediaType('image')
                                                                                                setExpandedMediaUrl(food.imageUrl || null)
                                                                                            }}
                                                                                            className="text-[11px] font-bold text-emerald-600"
                                                                                        >
                                                                                            Enlarge
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {!!food.imageUrl && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setExpandedMediaType('image')
                                                                                            setExpandedMediaUrl(food.imageUrl || null)
                                                                                        }}
                                                                                        className="rounded-[8px] border border-(--border-default) overflow-hidden"
                                                                                    >
                                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                        <img src={food.imageUrl} alt={`${food.name} preview`} className="w-full h-[96px] object-cover" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        {slotFoods.length === 0 && <p className="text-[11px] text-(--text-tertiary)">No items in this slot.</p>}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        {!day.foods.length && <p className="text-[11px] text-(--text-tertiary)">No foods added.</p>}
                                                    </div>
                                                </div>

                                                <div className="rounded-[10px] border border-(--border-subtle) bg-(--bg-surface) p-2">
                                                    <p className="text-[11px] font-bold text-(--text-secondary) mb-2">Drinks ({day.drinks.length})</p>
                                                    <div className="flex flex-col gap-2">
                                                        {day.drinks.map((drink) => (
                                                            <div key={drink.id} className="grid grid-cols-12 gap-1 items-center">
                                                                <input
                                                                    value={drink.name}
                                                                    onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                        ...currentDay,
                                                                        drinks: currentDay.drinks.map((entry) => entry.id === drink.id ? { ...entry, name: event.target.value } : entry),
                                                                    }))}
                                                                    className="col-span-5 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                />
                                                                <input
                                                                    value={drink.amount}
                                                                    onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                        ...currentDay,
                                                                        drinks: currentDay.drinks.map((entry) => entry.id === drink.id ? { ...entry, amount: event.target.value } : entry),
                                                                    }))}
                                                                    className="col-span-3 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={drink.calories}
                                                                    onChange={(event) => updateMealDay(day.id, (currentDay) => ({
                                                                        ...currentDay,
                                                                        drinks: currentDay.drinks.map((entry) => entry.id === drink.id ? { ...entry, calories: Math.max(0, Number(event.target.value || 0)) } : entry),
                                                                    }))}
                                                                    className="col-span-3 h-[30px] px-2 rounded-[8px] border border-(--border-default) bg-[var(--bg-elevated)] text-[11px]"
                                                                />
                                                                <button
                                                                    onClick={() => updateMealDay(day.id, (currentDay) => ({
                                                                        ...currentDay,
                                                                        drinks: currentDay.drinks.filter((entry) => entry.id !== drink.id),
                                                                    }))}
                                                                    className="col-span-1 h-[30px] rounded-[8px] border border-(--border-default) text-(--text-secondary) hover:text-red-600"
                                                                >
                                                                    <Trash2 className="w-[12px] h-[12px] mx-auto" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {!day.drinks.length && <p className="text-[11px] text-(--text-tertiary)">No drinks added.</p>}
                                                    </div>
                                                </div>

                                                <div className="text-[11px] text-(--text-secondary)">
                                                    <p className="font-bold text-(--text-primary)">Current Totals</p>
                                                    <p>{Math.round(foodTotals.calories + drinkCalories)} kcal • P {Math.round(foodTotals.protein)} • C {Math.round(foodTotals.carbs)} • F {Math.round(foodTotals.fat)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <button
                                        onClick={() => {
                                            const nextIndex = mealDays.length + 1
                                            sequenceRef.current += 1
                                            setMealDays((current) => [
                                                ...current,
                                                {
                                                    id: `d-${sequenceRef.current}`,
                                                    title: `Day ${nextIndex}`,
                                                    detail: 'Nutrition focus for the day',
                                                    notes: '',
                                                    foods: [],
                                                    drinks: [],
                                                    macroTarget: { calories: 2200, protein: 170, carbs: 220, fat: 65 },
                                                },
                                            ])
                                        }}
                                        className="w-full py-2.5 rounded-[12px] border border-dashed border-(--border-subtle) font-bold text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] hover:border-emerald-500/50 transition-colors"
                                    >
                                        + Add Day
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => setIsMealPreviewOpen(true)} className="h-[40px] px-6 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[13px] transition-colors cursor-pointer">
                                    Preview Plan
                                </button>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input
                                            type="checkbox"
                                            className="accent-emerald-500 w-[16px] h-[16px]"
                                            checked={subscribersOnly}
                                            onChange={(event) => setSubscribersOnly(event.target.checked)}
                                        />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Publish Meal Plan?',
                                                    message: 'This meal plan will be published and assigned to selected clients.',
                                                    confirmText: 'Publish Plan',
                                                },
                                                async () => {
                                                    await handlePublish()
                                                },
                                            )
                                        }}
                                        className="h-[40px] px-6 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm transition-colors cursor-pointer"
                                    >
                                        Publish Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Calendar / Recent Posts */}
            <div className="flex flex-col lg:flex-row gap-6 mt-4">
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Recent Publications</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-(--text-tertiary)" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                type="text"
                                placeholder="Search posts..."
                                className="h-[36px] pl-8 pr-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none w-[180px]"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {filteredPublications.map((post) => (
                            <div key={post.id} className="flex items-center justify-between p-4 border border-(--border-subtle) rounded-[16px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-[48px] h-[48px] rounded-[10px] bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) group-hover:text-emerald-500 shadow-sm transition-colors">
                                        {post.type === 'Post' && <Edit3 className="w-[20px] h-[20px]" />}
                                        {post.type === 'Video' && <Video className="w-[20px] h-[20px]" />}
                                        {post.type === 'Meal' && <Utensils className="w-[20px] h-[20px]" />}
                                        {post.type === 'Challenge' && <Award className="w-[20px] h-[20px]" />}
                                    </div>
                                    <div>
                                        <span className="block font-display font-bold text-[15px] text-(--text-primary)">{post.title}</span>
                                        <span className="block font-body text-[12px] text-(--text-secondary)">{post.date}</span>
                                        {post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {post.tags.slice(0, 4).map((tag) => (
                                                    <span
                                                        key={`${post.id}-${tag}`}
                                                        className="px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-600"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <span className="block font-body text-[12px] text-(--text-secondary)">Likes</span>
                                        <span className="font-body text-[14px] font-bold text-(--text-primary)">{post.likes}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredPublications.length === 0 && (
                            <div className="p-4 border border-dashed border-(--border-subtle) rounded-[16px] text-[13px] text-(--text-secondary)">
                                No published content found.
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="w-full lg:w-[320px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-6 flex items-center gap-2"><Calendar className="w-[18px] h-[18px] text-emerald-500" /> Scheduled</h3>
                    <div className="flex flex-col gap-4 flex-1">
                        {scheduledItems.map((item) => (
                            <div key={item.id} className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500" />
                                <span className="font-body text-[12px] font-bold text-emerald-500 mb-1 block">{formatDateLabel(item.startAt)}</span>
                                <span className="font-display font-bold text-[15px] text-(--text-primary) leading-tight">{item.title}</span>
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Mark Scheduled Content Complete?',
                                                    message: 'This will mark the scheduled content item as completed.',
                                                    confirmText: 'Mark Complete',
                                                },
                                                async () => {
                                                    await handleScheduledEventAction(item.id, 'complete')
                                                },
                                            )
                                        }}
                                        disabled={activeScheduleActionId === `${item.id}-complete`}
                                        className="h-[28px] px-2 rounded-[8px] border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 text-[11px] font-bold flex items-center gap-1 disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="w-[12px] h-[12px]" /> Complete
                                    </button>
                                    <button
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Delete Scheduled Content?',
                                                    message: 'This scheduled content slot will be permanently removed.',
                                                    confirmText: 'Delete Slot',
                                                    tone: 'danger',
                                                },
                                                async () => {
                                                    await handleScheduledEventAction(item.id, 'delete')
                                                },
                                            )
                                        }}
                                        disabled={activeScheduleActionId === `${item.id}-delete`}
                                        className="h-[28px] px-2 rounded-[8px] border border-(--border-default) bg-(--bg-surface) text-(--text-primary) text-[11px] font-bold flex items-center gap-1 disabled:opacity-60"
                                    >
                                        <Trash2 className="w-[12px] h-[12px]" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {scheduledItems.length === 0 && (
                            <div className="p-4 rounded-[16px] border border-dashed border-(--border-subtle) text-[13px] text-(--text-secondary)">
                                No scheduled content events yet.
                            </div>
                        )}
                    </div>
                    <input
                        value={scheduleTitle}
                        onChange={(event) => setScheduleTitle(event.target.value)}
                        placeholder="Content title for tomorrow"
                        className="w-full h-[38px] mt-4 px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                    />
                    <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(event) => setScheduleAt(event.target.value)}
                        className="w-full h-[38px] mt-2 px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                    />
                    <button 
                        onClick={() => {
                            openConfirmation(
                                {
                                    title: 'Schedule Content?',
                                    message: 'Create this content schedule event?',
                                    confirmText: 'Schedule',
                                },
                                async () => {
                                    await handleSchedule()
                                },
                            )
                        }}
                        className="w-full py-2.5 rounded-[12px] mt-4 border border-dashed border-(--border-subtle) text-(--text-secondary) font-bold text-[13px] hover:text-(--text-primary) hover:border-emerald-500 transition-colors"
                    >
                        + Schedule Content
                    </button>
                </div>
            </div>

            {isMealPreviewOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-[620px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-bold text-[20px] text-(--text-primary)">{title.trim() || 'Meal Plan Preview'}</h3>
                                <p className="text-[13px] text-(--text-secondary)">{postContent.trim() || 'No description yet.'}</p>
                            </div>
                            <button
                                onClick={() => setIsMealPreviewOpen(false)}
                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] divide-y divide-(--border-subtle)">
                            {mealDays.map((day) => (
                                <div key={day.id} className="px-4 py-3">
                                    <p className="font-bold text-[14px] text-(--text-primary)">{day.title}</p>
                                    <p className="text-[13px] text-(--text-secondary)">{day.detail}</p>
                                    <p className="text-[11px] text-(--text-tertiary) mt-1">
                                        Target: {Math.round(day.macroTarget.calories)} kcal • P {Math.round(day.macroTarget.protein)} • C {Math.round(day.macroTarget.carbs)} • F {Math.round(day.macroTarget.fat)}
                                    </p>
                                    {day.foods.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wide">Foods</p>
                                            <ul className="text-[12px] text-(--text-primary)">
                                                {day.foods.slice(0, 5).map((food) => (
                                                    <li key={food.id}>• {food.name} ({food.serving || 'serving'})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {day.drinks.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wide">Drinks</p>
                                            <ul className="text-[12px] text-(--text-primary)">
                                                {day.drinks.slice(0, 5).map((drink) => (
                                                    <li key={drink.id}>• {drink.name} ({drink.amount || 'serving'})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!mealDays.length && (
                                <div className="px-4 py-3 text-[13px] text-(--text-secondary)">No meal days added yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {expandedMediaUrl && (
                <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => setExpandedMediaUrl(null)}>
                    <button
                        type="button"
                        onClick={() => setExpandedMediaUrl(null)}
                        className="absolute top-4 right-4 w-[36px] h-[36px] rounded-[10px] bg-white/10 text-white flex items-center justify-center"
                    >
                        <X className="w-[16px] h-[16px]" />
                    </button>
                    {expandedMediaType === 'video' ? (
                        <video src={expandedMediaUrl} controls className="max-w-[95vw] max-h-[90vh] rounded-[12px] bg-black" />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={expandedMediaUrl} alt="Expanded media preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-[12px]" />
                    )}
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

function formatDateLabel(isoDate: string): string {
    const date = new Date(isoDate)
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}

function getDefaultScheduleAt(): string {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setHours(9, 0, 0, 0)

    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function inferMealSlot(category: string | undefined): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
    const normalized = String(category || '').toLowerCase()
    if (normalized.includes('breakfast')) return 'Breakfast'
    if (normalized.includes('dinner') || normalized.includes('supper')) return 'Dinner'
    if (normalized.includes('snack') || normalized.includes('dessert')) return 'Snack'
    return 'Lunch'
}
