'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    MessageCircle, PlayCircle, Plus, Target,
    Heart, MessageSquare, Bookmark, Share2, FileText,
    Video, CheckCircle2, MoreHorizontal, Download, X, Utensils, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoachingStore } from '@/store/useCoachingStore'
import { useMessageStore } from '@/store/useMessageStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { requestApi } from '@/lib/api/client'
import { StructuredFormSubmissionModal, type StructuredFormQuestion } from '@/components/coaching/StructuredFormSubmissionModal'

const DEFAULT_COACH_AVATAR = 'https://api.dicebear.com/7.x/notionists/svg?seed=CO'

function getSafeImageSrc(value: string | null | undefined, fallback: string | null = DEFAULT_COACH_AVATAR): string | null {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    return trimmed.length > 0 ? trimmed : fallback
}

interface HubCoach {
    id: string
    name: string
    avatar: string
    bio: string
}

interface HubProgramAssignment {
    id: string
    status: string
    progressPct: number
    assignedAt: string
    program: {
        id: string
        name: string
        difficulty: string
        lengthLabel: string
    }
}

interface HubFormAssignment {
    id: string
    assignedAt: string
    deadline: string | null
    completedAt: string | null
    form: {
        id: string
        name: string
        status: string
        questions: StructuredFormQuestion[]
    }
    submission: {
        id: string
        reviewStatus: string
        submittedAt: string
        reviewedAt: string | null
        coachNotes: string
        response: Record<string, unknown>
    } | null
}

interface HubFormSubmission {
    id: string
    formId: string
    formName: string
    reviewStatus: string
    submittedAt: string
    reviewedAt: string | null
    coachNotes: string
    response: Record<string, unknown>
}

interface HubScheduleEvent {
    id: string
    title: string
    eventType: string
    status: string
    startAt: string
    endAt: string
    notes: string
    isUpcoming: boolean
}

interface HubAnnouncement {
    id: string
    message: string
    createdAt: string
    mediaUrl: string | null
    audienceLabel: string | null
    broadcastLogId: string | null
}

interface HubDataResponse {
    coach: HubCoach | null
    link: {
        id: string
        coachId: string
        status: string
        goalName: string
    } | null
    programAssignments: HubProgramAssignment[]
    formAssignments: HubFormAssignment[]
    formSubmissions: HubFormSubmission[]
    scheduleEvents: HubScheduleEvent[]
    announcements: HubAnnouncement[]
    stats: {
        activePrograms: number
        pendingForms: number
        upcomingSessions: number
    }
    sharing: {
        weight: boolean
        nutrition: boolean
        progressPhotos: boolean
    }
}

export function ClientHub() {
    const store = useCoachingStore()
    const router = useRouter()
    const { addConversation } = useMessageStore()
    const { startSession } = useWorkoutStore()

    const [hubData, setHubData] = useState<HubDataResponse | null>(null)
    const [isHubLoading, setIsHubLoading] = useState(true)
    const [hubLoadError, setHubLoadError] = useState<string | null>(null)
    
    // Local UI states
    const [isDragActive, setIsDragActive] = useState(false)
    const [isFormCheckModalOpen, setFormCheckModalOpen] = useState(false)
    const [isCheckInModalOpen, setCheckInModalOpen] = useState<string | null>(null)
    const [formCheckData, setFormCheckData] = useState({ exerciseName: '', notes: '', file: null as File | null })
    const [checkInAnswers, setCheckInAnswers] = useState<Record<string, string | number>>({})
    const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null)
    const [commentText, setCommentText] = useState('')
    
    // Daily Tasks mock
    const [tasks, setTasks] = useState([
        { id: 't1', title: 'Log Workout', desc: 'Upper Body Power', type: 'workout', done: false },
        { id: 't2', title: 'Log Meals', desc: 'Hit 2000 kcal', type: 'meal', done: false }
    ])

    const loadHubData = async () => {
        setIsHubLoading(true)
        setHubLoadError(null)

        try {
            const response = await requestApi<HubDataResponse>('/api/v1/coaching/hub')
            if (response.data?.coach) {
                setHubData(response.data)
            } else {
                setHubData(null)
            }
        } catch (error) {
            setHubLoadError(error instanceof Error ? error.message : 'Unable to load coaching hub.')
            setHubData(null)
        } finally {
            setIsHubLoading(false)
        }
    }

    useEffect(() => {
        void loadHubData()
    }, [])

    const fallbackCoach = useMemo(() => store.coaches.find(c => c.id === store.activeCoachId), [store.coaches, store.activeCoachId])

    if (isHubLoading && !fallbackCoach) {
        return (
            <div className="flex items-center justify-center gap-3 py-16 bg-(--bg-surface) rounded-[24px] border border-(--border-subtle)">
                <Loader2 className="w-[18px] h-[18px] animate-spin text-(--text-secondary)" />
                <span className="text-[14px] text-(--text-secondary)">Loading your coaching hub...</span>
            </div>
        )
    }

    if (hubData?.coach) {
        return <ServerBackedClientHub hubData={hubData} onRefresh={loadHubData} />
    }

    const coach = fallbackCoach

    if (!coach) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-(--bg-surface) rounded-[24px] border border-(--border-subtle)">
                <Target className="w-12 h-12 text-(--text-tertiary) mb-4" />
                <h3 className="font-display font-bold text-xl mb-2">No Active Coach</h3>
                <p className="text-(--text-secondary) mb-2">Find a coach in the Marketplace to get started.</p>
                {hubLoadError && (
                    <p className="text-[12px] text-red-500">{hubLoadError}</p>
                )}
            </div>
        )
    }

    const coachAvatarSrc = getSafeImageSrc(coach.avatar)

    const handleMessageCoach = () => {
        // Create conversation if it doesn't exist
        addConversation({
            id: `conv_${coach.id}`,
            participants: [
                { id: coach.id, name: coach.name, avatar: coachAvatarSrc || DEFAULT_COACH_AVATAR }
            ],
            isGroup: false,
            updatedAt: new Date().toISOString(),
            unreadCount: 0
        })
        router.push('/messages')
    }

    const handleFormCheckSubmit = async () => {
        if (!formCheckData.exerciseName) return toast.error('Exercise name is required')
        
        const toastId = toast.loading('Uploading video...')
        await new Promise(r => setTimeout(r, 800)) // simulate upload
        
        store.submitFormCheck({
            exerciseName: formCheckData.exerciseName,
            notes: formCheckData.notes,
            videoUrl: formCheckData.file ? URL.createObjectURL(formCheckData.file) : 'mock_video.mp4'
        })
        
        setFormCheckModalOpen(false)
        setFormCheckData({ exerciseName: '', notes: '', file: null })
        toast.success('Form check submitted! Your coach will review it soon.', { id: toastId })
    }

    const handleCheckInSubmit = async (chkId: string) => {
        const toastId = toast.loading('Submitting check-in...')
        await new Promise(r => setTimeout(r, 600))
        store.submitCheckIn(chkId, checkInAnswers)
        setCheckInModalOpen(null)
        setCheckInAnswers({})
        toast.success('Check-in submitted! Your coach will review it.', { id: toastId })
    }

    const handleStartWorkout = async () => {
        const toastId = toast.loading('Loading workout...')
        await new Promise(r => setTimeout(r, 500))
        
        // Mock loading a workout
        startSession('mock_wkt_1')
        toast.success('Workout loaded! Let\'s get it 💪', { id: toastId })
        router.push('/workout')
    }

    const handleSubmitComment = (postId: string) => {
        if (!commentText.trim()) return
        store.addComment(postId, commentText, { id: 'u1', name: 'You' })
        setCommentText('')
        setCommentingOnPost(null)
        toast.success('Comment posted!')
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full">
            
            {/* LEFT COLUMN */}
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                
                {/* Coach Card */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[60px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coachAvatarSrc || DEFAULT_COACH_AVATAR} alt={`${coach.name} avatar`} className="relative z-10 w-[80px] h-[80px] rounded-full object-cover border-4 border-(--bg-surface) shadow-sm mb-3 mt-4" />
                    <h3 className="font-display font-black text-[20px] text-(--text-primary)">{coach.name}</h3>
                    <p className="font-body text-[13px] text-(--text-secondary) mb-5">Lead Coach</p>
                    <button 
                        onClick={handleMessageCoach}
                        className="w-full h-[40px] rounded-[10px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <MessageCircle className="w-[16px] h-[16px]" /> Message Coach
                    </button>
                </div>

                {/* Assigned Programs */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[16px] text-(--text-primary) mb-4">Assigned Programs</h3>
                    {store.assignedPrograms.map(prog => (
                        <div key={prog.id} className="flex flex-col gap-3 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4">
                            <div>
                                <h4 className="font-display font-bold text-[15px] text-(--text-primary)">{prog.name}</h4>
                                <span className="font-body text-[12px] text-(--text-secondary)">Week {prog.week} of {prog.totalWeeks}</span>
                            </div>
                            <div className="h-[6px] w-full bg-(--bg-base) rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.progressPercentage}%` }} />
                            </div>
                            <button 
                                onClick={handleStartWorkout}
                                className="mt-2 w-full h-[36px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[10px] font-bold text-[13px] flex items-center justify-center transition-colors"
                            >
                                Start Today&apos;s Workout
                            </button>
                            <button 
                                onClick={() => {
                                    router.push('/coaching')
                                    toast.success('Opening your full coaching workspace...')
                                }}
                                className="w-full h-[36px] bg-transparent text-(--text-secondary) hover:bg-(--bg-base) rounded-[10px] font-bold text-[13px] flex items-center justify-center transition-colors"
                            >
                                View Full Program
                            </button>
                        </div>
                    ))}
                    {store.assignedPrograms.length === 0 && (
                        <p className="text-[13px] text-(--text-secondary) text-center py-4">No active programs.</p>
                    )}
                </div>
            </div>

            {/* CENTER COLUMN: FEED + ACTION ITEMS */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                
                {/* Weekly Check-In Card (if pending) */}
                {store.pendingCheckIns.filter(c => c.status === 'pending').map(chk => (
                    <div key={chk.id} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-500/20 rounded-[24px] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h4 className="font-display font-black text-[16px] text-emerald-600 dark:text-emerald-400 mb-1">Weekly Check-In Due</h4>
                            <p className="font-body text-[13px] text-(--text-secondary)">Your coach {coach.name} is waiting for your update.</p>
                        </div>
                        <button 
                            onClick={() => setCheckInModalOpen(chk.id)}
                            className="shrink-0 px-5 h-[40px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] rounded-[10px] transition-colors"
                        >
                            Fill Out Check-In
                        </button>
                    </div>
                ))}
                
                {/* Daily Tasks */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Today&apos;s Tasks</h3>
                    <div className="flex flex-col gap-3">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] transition-all hover:bg-[var(--bg-surface)]">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            if (!task.done) {
                                                const id = toast.loading('Completing task...')
                                                setTimeout(() => {
                                                    setTasks(current => current.map(t => t.id === task.id ? { ...t, done: true } : t))
                                                    toast.success('Task marked as complete! 🎉', { id })
                                                }, 800)
                                            }
                                        }}
                                        disabled={task.done}
                                        className={cn("w-[24px] h-[24px] rounded-full flex items-center justify-center transition-colors shrink-0", task.done ? "bg-emerald-500 text-white" : "border-2 border-(--border-subtle) hover:border-emerald-500 cursor-pointer text-transparent")}
                                    >
                                        <CheckCircle2 className="w-[14px] h-[14px]" />
                                    </button>
                                    <div className={cn("flex items-center justify-center w-[40px] h-[40px] rounded-[10px] shrink-0", task.type === 'workout' ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600")}>
                                        {task.type === 'workout' ? <Target className="w-[20px] h-[20px]" /> : <Utensils className="w-[20px] h-[20px]" />}
                                    </div>
                                    <div className={cn("transition-opacity", task.done ? "opacity-50" : "opacity-100")}>
                                        <span className={cn("block font-bold text-[14px]", task.done && "line-through")}>{task.title}</span>
                                        <span className="text-[12px] text-(--text-secondary)">{task.desc}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        toast.success(`Navigating to ${task.type === 'workout' ? 'Workout' : 'Diary'}...`)
                                        router.push(task.type === 'workout' ? '/workout' : '/diary')
                                    }} 
                                    className="px-4 h-[32px] bg-(--text-primary) text-(--bg-base) rounded-[8px] font-bold text-[12px]"
                                >
                                    Log
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Form Checks */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Form Checks</h3>
                        <button 
                            onClick={() => setFormCheckModalOpen(true)}
                            className="text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full font-body font-bold text-[12px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                            <Plus className="w-[14px] h-[14px]" /> Submit Form Check
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {store.formCheckSubmissions.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary) text-center py-4 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-default)">No form checks submitted yet.</p>
                        )}
                        {store.formCheckSubmissions.map(fc => (
                            <div key={fc.id} className="flex flex-col p-4 border border-(--border-subtle) rounded-[16px] bg-[var(--bg-elevated)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[48px] h-[40px] bg-black/5 dark:bg-black/20 rounded-[8px] flex items-center justify-center border border-(--border-subtle)">
                                            <Video className="w-[18px] h-[18px] text-(--text-tertiary)" />
                                        </div>
                                        <div>
                                            <span className="block font-display font-bold text-[15px]">{fc.exerciseName}</span>
                                            <span className="block font-body text-[12px] text-(--text-secondary)">{new Date(fc.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div>
                                        {fc.status === 'reviewed' ? 
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-[6px] text-[11px] font-bold uppercase">Reviewed</span>
                                        : 
                                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-[6px] text-[11px] font-bold uppercase">Pending Review</span>
                                        }
                                    </div>
                                </div>
                                
                                {fc.status === 'reviewed' && fc.coachFeedback && (
                                    <div className="mt-2 p-3 bg-(--bg-surface) border border-emerald-500/20 rounded-[12px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={coachAvatarSrc || DEFAULT_COACH_AVATAR} alt={`${coach.name} avatar`} className="w-[20px] h-[20px] rounded-full object-cover" />
                                            <span className="text-[12px] font-bold text-emerald-600">Coach Feedback</span>
                                        </div>
                                        <p className="text-[13px] text-(--text-secondary) leading-relaxed">&ldquo;{fc.coachFeedback}&rdquo;</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coach Feed */}
                <h3 className="font-display font-bold text-[20px] text-(--text-primary) mt-4">Coach Announcements</h3>
                
                <div className="flex flex-col gap-6">
                    {store.feedPosts.map(post => {
                        const postImageSrc = getSafeImageSrc(post.mediaUrl, null)

                        return (
                        <div key={post.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                            {/* Post Header */}
                            <div className="p-5 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={coachAvatarSrc || DEFAULT_COACH_AVATAR} alt={`${post.coachName} avatar`} className="w-[88px] h-[88px] rounded-[20px] object-cover border-4 border-(--bg-surface) shadow-sm" />
                                    <div>
                                        <h4 className="font-display font-bold text-[15px] text-(--text-primary)">{post.coachName}</h4>
                                        <span className="text-[12px] text-(--text-tertiary)">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-(--text-tertiary)">
                                    <MoreHorizontal className="w-[18px] h-[18px]" />
                                </button>
                            </div>
                            
                            {/* Content */}
                            <div className="px-5 pb-4">
                                <p className="text-[14px] text-(--text-secondary) leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                
                                {/* Rich Media Rendering */}
                                {post.type === 'video' && post.mediaUrl && (
                                    <div className="mt-4 relative w-full aspect-video bg-black rounded-[16px] overflow-hidden group cursor-pointer border border-(--border-subtle)">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
                                            <PlayCircle className="w-[48px] h-[48px] text-white opacity-90 group-hover:scale-110 transition-transform" />
                                        </div>
                                    </div>
                                )}
                                
                                {post.type === 'image' && postImageSrc && (
                                    <div className="mt-4 rounded-[16px] overflow-hidden border border-(--border-subtle)">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={postImageSrc} alt={`${post.coachName} shared image`} className="w-full h-auto max-h-[400px] object-cover" />
                                    </div>
                                )}

                                {post.type === 'workout' && (
                                    <div className="mt-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] bg-emerald-500/10 text-emerald-600 rounded-[10px] flex items-center justify-center">
                                                <Target className="w-[20px] h-[20px]" />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-[14px]">Shared Workout</span>
                                                <span className="text-[12px] text-(--text-secondary)">Tap to view details</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleStartWorkout}
                                            className="px-4 h-[32px] bg-(--text-primary) text-(--bg-base) rounded-[8px] font-bold text-[12px]"
                                        >
                                            Start Now
                                        </button>
                                    </div>
                                )}

                                {/* Rich Media Rendering */}
                                {post.type === 'meal_plan' && (
                                    <div className="mt-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] bg-orange-500/10 text-orange-600 rounded-[10px] flex items-center justify-center shrink-0">
                                                <Utensils className="w-[20px] h-[20px]" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex justify-between items-center">
                                                <div className="truncate pr-2">
                                                    <span className="block font-bold text-[14px] truncate">Shared Meal Plan</span>
                                                    <span className="text-[12px] text-(--text-secondary) truncate">2,200 Calories - High Protein</span>
                                                </div>
                                                <button 
                                                    onClick={() => {toast.success('Importing rules to Diary...'); router.push('/diary')}}
                                                    className="px-3 h-[28px] shrink-0 border border-orange-500/50 text-orange-600 rounded-[8px] font-bold text-[12px] hover:bg-orange-500/10 transition-colors"
                                                >
                                                    Import
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {post.type === 'pdf' && (
                                    <div className="mt-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-[40px] h-[40px] bg-blue-500/10 text-blue-600 rounded-[10px] flex items-center justify-center">
                                                    <FileText className="w-[20px] h-[20px]" />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-[14px]">Resource Document</span>
                                                    <span className="text-[12px] text-(--text-secondary)">PDF File</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const id = toast.loading('Downloading...')
                                                    setTimeout(() => toast.success('Downloaded!', { id }), 800)
                                                }}
                                                className="w-[32px] h-[32px] hover:bg-(--bg-surface) rounded-[8px] flex items-center justify-center text-(--text-secondary)"
                                            >
                                                <Download className="w-[18px] h-[18px]" />
                                            </button>
                                        </div>
                                        <div className="w-full aspect-[1/1.4] bg-neutral-200/50 dark:bg-neutral-800/50 flex flex-col items-center justify-center rounded-[8px] border border-(--border-subtle) cursor-pointer group hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" onClick={() => toast.success('Opening PDF previewer...')}>
                                            <FileText className="w-12 h-12 text-(--text-tertiary) mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[13px] font-bold text-(--text-secondary)">Preview Document</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Bar */}
                            <div className="px-5 py-3 border-t border-(--border-subtle) flex items-center gap-4">
                                <button 
                                    onClick={() => store.likePost(post.id)}
                                    className={cn("flex items-center gap-1.5 font-bold text-[13px] transition-colors", post.isLiked ? "text-emerald-500" : "text-(--text-tertiary) hover:text-(--text-secondary)")}
                                >
                                    <Heart className={cn("w-[18px] h-[18px]", post.isLiked && "fill-emerald-500")} /> 
                                    {post.likes > 0 ? post.likes : 'Like'}
                                </button>
                                <button 
                                    onClick={() => setCommentingOnPost(commentingOnPost === post.id ? null : post.id)}
                                    className="flex items-center gap-1.5 font-bold text-[13px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
                                >
                                    <MessageSquare className="w-[18px] h-[18px]" /> 
                                    {post.comments.length > 0 ? post.comments.length : 'Comment'}
                                </button>
                                <div className="flex-1" />
                                <button 
                                    onClick={() => {
                                        store.savePost(post.id)
                                        toast.success(post.isSaved ? 'Removed from saved' : 'Saved to your library')
                                    }}
                                    className={cn("w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors", post.isSaved ? "text-emerald-500" : "text-(--text-tertiary) hover:bg-[var(--bg-elevated)]")}
                                >
                                    <Bookmark className={cn("w-[18px] h-[18px]", post.isSaved && "fill-emerald-500")} />
                                </button>
                                <button 
                                    onClick={() => toast.success('Link copied to clipboard')}
                                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-(--text-tertiary) hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                    <Share2 className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            {/* Comments Section */}
                            <AnimatePresence>
                                {(commentingOnPost === post.id || post.comments.length > 0) && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-[var(--bg-elevated)] border-t border-(--border-subtle) px-5 py-4 overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-4 mb-4">
                                            {post.comments.map(c => (
                                                <div key={c.id} className="flex gap-3">
                                                    <div className="w-[28px] h-[28px] rounded-full bg-emerald-500/20 flex shrink-0 items-center justify-center font-bold text-[10px] text-emerald-600">
                                                        {c.authorName[0]}
                                                    </div>
                                                    <div className="bg-(--bg-surface) p-3 rounded-[12px] rounded-tl-none border border-(--border-subtle) flex-1">
                                                        <span className="font-bold text-[13px] text-(--text-primary) block mb-1">{c.authorName}</span>
                                                        <p className="text-[13px] text-(--text-secondary)">{c.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {commentingOnPost === post.id && (
                                            <div className="flex gap-3 items-end">
                                                <textarea 
                                                    autoFocus
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    placeholder="Write a comment..."
                                                    className="flex-1 bg-(--bg-surface) border border-(--border-default) rounded-[12px] p-3 text-[13px] resize-none focus:outline-none focus:border-emerald-500 h-[80px]"
                                                />
                                                <button 
                                                    onClick={() => handleSubmitComment(post.id)}
                                                    disabled={!commentText.trim()}
                                                    className="shrink-0 h-[40px] px-4 bg-emerald-500 text-white rounded-[10px] font-bold text-[13px] disabled:opacity-50 transition-opacity"
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )})}
                    {store.feedPosts.length === 0 && (
                        <p className="text-[14px] text-(--text-tertiary) text-center py-6 border border-dashed border-(--border-default) rounded-[16px]">No announcements from your coach yet.</p>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">
                
                {/* Progress Shared With Coach Panel */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-display font-bold text-[16px] text-(--text-primary)">Sharing with Coach</h3>
                        <p className="font-body text-[12px] text-(--text-secondary) mt-1">Control what progress data your coach can see.</p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Weight Data</span>
                            <button 
                                onClick={() => {
                                    store.updateSharingPermissions({ weight: !store.sharingPermissions.weight });
                                    toast('Sharing preference updated')
                                }}
                                className={cn("w-[44px] h-[24px] rounded-full relative transition-colors", store.sharingPermissions.weight ? "bg-emerald-500" : "bg-(--border-default)")}
                            >
                                <span className={cn("absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all", store.sharingPermissions.weight ? "left-[22px]" : "left-[2px]")} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Nutrition Diary</span>
                            <button 
                                onClick={() => {
                                    store.updateSharingPermissions({ nutrition: !store.sharingPermissions.nutrition });
                                    toast('Sharing preference updated')
                                }}
                                className={cn("w-[44px] h-[24px] rounded-full relative transition-colors", store.sharingPermissions.nutrition ? "bg-emerald-500" : "bg-(--border-default)")}
                            >
                                <span className={cn("absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all", store.sharingPermissions.nutrition ? "left-[22px]" : "left-[2px]")} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Progress Photos</span>
                            <button 
                                onClick={() => {
                                    store.updateSharingPermissions({ progressPhotos: !store.sharingPermissions.progressPhotos });
                                    toast('Sharing preference updated')
                                }}
                                className={cn("w-[44px] h-[24px] rounded-full relative transition-colors", store.sharingPermissions.progressPhotos ? "bg-emerald-500" : "bg-(--border-default)")}
                            >
                                <span className={cn("absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all", store.sharingPermissions.progressPhotos ? "left-[22px]" : "left-[2px]")} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Form Check Modal */}
            <AnimatePresence>
                {isFormCheckModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setFormCheckModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="relative w-full max-w-[500px] bg-(--bg-surface) rounded-[24px] p-6 shadow-xl z-10"
                        >
                            <button 
                                onClick={() => setFormCheckModalOpen(false)}
                                className="absolute right-4 top-4 w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                            <h2 className="font-display font-bold text-[24px] mb-2">Submit a Form Check</h2>
                            <p className="text-(--text-secondary) text-[14px] mb-6">Upload a video of your set for technique feedback from your coach.</p>
                            
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-1.5">Exercise Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Back Squat, Deadlift" 
                                        value={formCheckData.exerciseName}
                                        onChange={e => setFormCheckData({ ...formCheckData, exerciseName: e.target.value })}
                                        className="w-full h-[44px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-3 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-1.5">Notes for Coach</label>
                                    <textarea 
                                        placeholder="What should I focus on? Any specific pain or issues?" 
                                        value={formCheckData.notes}
                                        onChange={e => setFormCheckData({ ...formCheckData, notes: e.target.value })}
                                        className="w-full h-[100px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] p-3 resize-none focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-1.5">Upload Video</label>
                                    <label
                                        onDragOver={e => { e.preventDefault(); setIsDragActive(true) }}
                                        onDragLeave={e => { e.preventDefault(); setIsDragActive(false) }}
                                        onDrop={e => {
                                            e.preventDefault()
                                            setIsDragActive(false)
                                            if (e.dataTransfer.files?.length) {
                                                setFormCheckData({ ...formCheckData, file: e.dataTransfer.files[0] })
                                            }
                                        }}
                                        className={cn(
                                            "w-full h-[120px] rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
                                            isDragActive ? "border-emerald-500 bg-emerald-500/5 text-emerald-600" : "border-(--border-default) bg-[var(--bg-elevated)] text-(--text-tertiary) hover:border-emerald-500/50 hover:bg-emerald-500/5",
                                            formCheckData.file ? "border-emerald-500 bg-emerald-500/5 text-emerald-600" : ""
                                        )}>
                                        <input 
                                            type="file" 
                                            accept="video/*" 
                                            className="hidden" 
                                            onChange={e => {
                                                if (e.target.files?.length) {
                                                    setFormCheckData({ ...formCheckData, file: e.target.files[0] })
                                                }
                                            }}
                                        />
                                        {formCheckData.file ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <CheckCircle2 className="w-[32px] h-[32px]" />
                                                <span className="text-[13px] font-bold">{formCheckData.file.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Video className="w-[32px] h-[32px] mb-2 opacity-50" />
                                                <span className="text-[13px] font-bold">Drop your video here or click to browse</span>
                                                <span className="text-[11px] opacity-70">MP4, MOV (Max 50MB)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                
                                <button 
                                    onClick={handleFormCheckSubmit}
                                    disabled={!formCheckData.exerciseName || !formCheckData.file}
                                    className="w-full h-[48px] bg-emerald-500 text-white rounded-[12px] font-bold text-[15px] mt-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
                                >
                                    Submit to Coach
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Weekly Check-In Modal */}
            <AnimatePresence>
                {isCheckInModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setCheckInModalOpen(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="relative w-full max-w-[500px] bg-(--bg-surface) rounded-[24px] p-6 shadow-xl z-10 max-h-[80vh] flex flex-col"
                        >
                            <button 
                                onClick={() => setCheckInModalOpen(null)}
                                className="absolute right-4 top-4 w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                            <h2 className="font-display font-bold text-[24px] mb-2 shrink-0">Weekly Check-In</h2>
                            <p className="text-(--text-secondary) text-[14px] mb-6 shrink-0">Please fill out this quick update so I can adjust your program appropriately.</p>
                            
                            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-4">
                                {/* Mock questions */}
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">How would you rate your energy this week? (1-10)</label>
                                    <input 
                                        type="range" min="1" max="10" 
                                        value={checkInAnswers['q1'] || 5}
                                        onChange={e => setCheckInAnswers({ ...checkInAnswers, q1: e.target.value })}
                                        className="w-full accent-emerald-500" 
                                    />
                                    <div className="flex justify-between text-[11px] text-(--text-tertiary) mt-1 font-bold">
                                        <span>Exhausted</span>
                                        <span>{checkInAnswers['q1'] || 5}</span>
                                        <span>Energetic</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Did you hit your nutrition goals?</label>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setCheckInAnswers({ ...checkInAnswers, q2: 'Yes' })}
                                            className={cn("flex-1 h-[40px] rounded-[10px] font-bold text-[13px] border", checkInAnswers['q2'] === 'Yes' ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary)")}
                                        >
                                            Yes
                                        </button>
                                        <button 
                                            onClick={() => setCheckInAnswers({ ...checkInAnswers, q2: 'No' })}
                                            className={cn("flex-1 h-[40px] rounded-[10px] font-bold text-[13px] border", checkInAnswers['q2'] === 'No' ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary)")}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Any nagging injuries or stiffness?</label>
                                    <textarea 
                                        value={checkInAnswers['q3'] || ''}
                                        onChange={e => setCheckInAnswers({ ...checkInAnswers, q3: e.target.value })}
                                        className="w-full h-[80px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] p-3 resize-none focus:outline-none focus:border-emerald-500 text-[13px]"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => handleCheckInSubmit(isCheckInModalOpen as string)}
                                className="w-full h-[48px] bg-emerald-500 text-white rounded-[12px] font-bold text-[15px] mt-2 shrink-0 hover:bg-emerald-600 transition-colors"
                            >
                                Submit Check-In
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function ServerBackedClientHub({ hubData, onRefresh }: { hubData: HubDataResponse; onRefresh: () => Promise<void> }) {
    const router = useRouter()
    const { addConversation } = useMessageStore()
    const { startSession } = useWorkoutStore()

    const [sharing, setSharing] = useState(hubData.sharing)
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null)
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null)
    const [isStructuredModalOpen, setStructuredModalOpen] = useState(false)

    useEffect(() => {
        setSharing(hubData.sharing)
    }, [hubData.sharing])

    const coachAvatarSrc = getSafeImageSrc(hubData.coach?.avatar)
    const pendingAssignments = hubData.formAssignments.filter((assignment) => !assignment.completedAt)
    const upcomingSessions = hubData.scheduleEvents.filter((event) => event.isUpcoming).slice(0, 5)
    const activeAssignment = pendingAssignments.find((assignment) => assignment.id === activeAssignmentId) || null

    const handleMessageCoach = () => {
        const coachId = String(hubData.coach?.id || '')
        if (!coachId) return

        addConversation({
            id: `conv_${coachId}`,
            participants: [{ id: coachId, name: hubData.coach?.name || 'Coach', avatar: coachAvatarSrc || DEFAULT_COACH_AVATAR }],
            isGroup: false,
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
        })

        router.push('/messages')
    }

    const handleStartWorkout = async () => {
        const toastId = toast.loading('Loading workout...')
        await new Promise((resolve) => setTimeout(resolve, 350))
        startSession('coach_assigned_workout')
        toast.success('Workout loaded! Let\'s get it.', { id: toastId })
        router.push('/workout')
    }

    const handleSubmitAssignedForm = async (response: Record<string, unknown>) => {
        if (!activeAssignment) return

        setSubmittingAssignmentId(activeAssignment.id)
        const toastId = toast.loading('Submitting form...')

        try {
            await requestApi('/api/v1/coaching/forms/submissions', {
                method: 'POST',
                body: JSON.stringify({
                    assignmentId: activeAssignment.id,
                    response,
                }),
            })

            toast.success('Submitted to your coach for review.', { id: toastId })
            setStructuredModalOpen(false)
            setActiveAssignmentId(null)
            await onRefresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to submit form right now.', { id: toastId })
        } finally {
            setSubmittingAssignmentId(null)
        }
    }

    const openStructuredForm = (assignmentId: string) => {
        setActiveAssignmentId(assignmentId)
        setStructuredModalOpen(true)
    }

    const closeStructuredForm = () => {
        if (submittingAssignmentId) return
        setStructuredModalOpen(false)
        setActiveAssignmentId(null)
    }

    const updateSharing = async (next: Partial<HubDataResponse['sharing']>) => {
        const previous = sharing
        const optimistic = { ...sharing, ...next }
        setSharing(optimistic)

        try {
            const response = await requestApi<{ sharing: HubDataResponse['sharing'] }>('/api/v1/coaching/hub', {
                method: 'PATCH',
                body: JSON.stringify(next),
            })
            setSharing(response.data.sharing)
            toast.success('Sharing preference updated.')
        } catch (error) {
            setSharing(previous)
            toast.error(error instanceof Error ? error.message : 'Unable to update sharing preference.')
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full">
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[60px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20" />
                    <img src={coachAvatarSrc || DEFAULT_COACH_AVATAR} alt={`${hubData.coach?.name || 'Coach'} avatar`} className="relative z-10 w-[80px] h-[80px] rounded-full object-cover border-4 border-(--bg-surface) shadow-sm mb-3 mt-4" />
                    <h3 className="font-display font-black text-[20px] text-(--text-primary)">{hubData.coach?.name || 'Coach'}</h3>
                    <p className="font-body text-[13px] text-(--text-secondary) mb-1">{hubData.link?.goalName || 'Coaching Program'}</p>
                    <p className="font-body text-[12px] text-(--text-tertiary) mb-5">{hubData.coach?.bio || 'Personalized support and accountability.'}</p>
                    <button
                        onClick={handleMessageCoach}
                        className="w-full h-[40px] rounded-[10px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <MessageCircle className="w-[16px] h-[16px]" /> Message Coach
                    </button>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[16px] text-(--text-primary) mb-4">Assigned Programs</h3>
                    {hubData.programAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col gap-3 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 mb-3">
                            <div>
                                <h4 className="font-display font-bold text-[15px] text-(--text-primary)">{assignment.program.name}</h4>
                                <span className="font-body text-[12px] text-(--text-secondary)">{assignment.program.lengthLabel} • {assignment.program.difficulty}</span>
                            </div>
                            <div className="h-[6px] w-full bg-(--bg-base) rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, assignment.progressPct))}%` }} />
                            </div>
                            <button
                                onClick={handleStartWorkout}
                                className="mt-2 w-full h-[36px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[10px] font-bold text-[13px] flex items-center justify-center transition-colors"
                            >
                                Start Today&apos;s Workout
                            </button>
                        </div>
                    ))}
                    {hubData.programAssignments.length === 0 && (
                        <p className="text-[13px] text-(--text-secondary) text-center py-4">No active programs yet.</p>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {pendingAssignments.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-500/20 rounded-[24px] p-5">
                        <h4 className="font-display font-black text-[16px] text-emerald-600 dark:text-emerald-400 mb-2">Pending Coach Forms</h4>
                        <div className="flex flex-col gap-2">
                            {pendingAssignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between gap-3 bg-white/60 dark:bg-black/20 border border-emerald-500/10 rounded-[12px] px-4 py-3">
                                    <div>
                                        <p className="font-bold text-[14px] text-(--text-primary)">{assignment.form.name}</p>
                                        <p className="text-[12px] text-(--text-secondary)">
                                            {assignment.deadline ? `Due ${new Date(assignment.deadline).toLocaleDateString()}` : 'No deadline'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openStructuredForm(assignment.id)}
                                        disabled={submittingAssignmentId === assignment.id}
                                        className="h-[34px] px-4 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold disabled:opacity-60"
                                    >
                                        {submittingAssignmentId === assignment.id ? 'Submitting...' : 'Fill Form'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Coach Announcements</h3>
                    <div className="flex flex-col gap-3">
                        {hubData.announcements.map((announcement) => (
                            <div key={announcement.id} className="border border-(--border-subtle) rounded-[14px] p-4 bg-[var(--bg-elevated)]">
                                <p className="text-[14px] text-(--text-primary) whitespace-pre-wrap">{announcement.message}</p>
                                {announcement.mediaUrl && (
                                    <a href={announcement.mediaUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[12px] font-bold text-emerald-600 hover:underline">
                                        Open attachment
                                    </a>
                                )}
                                <p className="mt-2 text-[11px] text-(--text-tertiary)">{new Date(announcement.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                        {hubData.announcements.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No announcements yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-4">Recent Form Submissions</h3>
                    <div className="flex flex-col gap-3">
                        {hubData.formSubmissions.map((submission) => (
                            <div key={submission.id} className="flex items-center justify-between gap-3 border border-(--border-subtle) rounded-[14px] px-4 py-3 bg-[var(--bg-elevated)]">
                                <div>
                                    <p className="font-bold text-[14px] text-(--text-primary)">{submission.formName}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <span className={cn('px-2 py-1 rounded-[6px] text-[11px] font-bold uppercase', submission.reviewStatus === 'reviewed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
                                    {submission.reviewStatus === 'reviewed' ? 'Reviewed' : 'Pending'}
                                </span>
                            </div>
                        ))}
                        {hubData.formSubmissions.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No submissions yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <h3 className="font-display font-bold text-[16px] text-(--text-primary)">Upcoming Sessions</h3>
                    <div className="mt-4 flex flex-col gap-3">
                        {upcomingSessions.map((event) => (
                            <div key={event.id} className="border border-(--border-subtle) rounded-[12px] p-3 bg-[var(--bg-elevated)]">
                                <p className="font-bold text-[13px] text-(--text-primary)">{event.title}</p>
                                <p className="text-[12px] text-(--text-secondary)">{new Date(event.startAt).toLocaleString()}</p>
                            </div>
                        ))}
                        {upcomingSessions.length === 0 && (
                            <p className="text-[13px] text-(--text-secondary)">No upcoming sessions scheduled.</p>
                        )}
                    </div>
                </div>

                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-display font-bold text-[16px] text-(--text-primary)">Sharing with Coach</h3>
                        <p className="font-body text-[12px] text-(--text-secondary) mt-1">Control what progress data your coach can see.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Weight Data</span>
                            <button
                                onClick={() => { void updateSharing({ weight: !sharing.weight }) }}
                                className={cn('w-[44px] h-[24px] rounded-full relative transition-colors', sharing.weight ? 'bg-emerald-500' : 'bg-(--border-default)')}
                            >
                                <span className={cn('absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all', sharing.weight ? 'left-[22px]' : 'left-[2px]')} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Nutrition Diary</span>
                            <button
                                onClick={() => { void updateSharing({ nutrition: !sharing.nutrition }) }}
                                className={cn('w-[44px] h-[24px] rounded-full relative transition-colors', sharing.nutrition ? 'bg-emerald-500' : 'bg-(--border-default)')}
                            >
                                <span className={cn('absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all', sharing.nutrition ? 'left-[22px]' : 'left-[2px]')} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-(--text-primary)">Progress Photos</span>
                            <button
                                onClick={() => { void updateSharing({ progressPhotos: !sharing.progressPhotos }) }}
                                className={cn('w-[44px] h-[24px] rounded-full relative transition-colors', sharing.progressPhotos ? 'bg-emerald-500' : 'bg-(--border-default)')}
                            >
                                <span className={cn('absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all', sharing.progressPhotos ? 'left-[22px]' : 'left-[2px]')} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <StructuredFormSubmissionModal
                open={isStructuredModalOpen}
                assignment={
                    activeAssignment
                        ? {
                            id: activeAssignment.id,
                            deadline: activeAssignment.deadline,
                            form: {
                                id: activeAssignment.form.id,
                                name: activeAssignment.form.name,
                                questions: activeAssignment.form.questions,
                            },
                        }
                        : null
                }
                isSubmitting={Boolean(submittingAssignmentId)}
                onClose={closeStructuredForm}
                onSubmit={handleSubmitAssignedForm}
            />
        </div>
    )
}
