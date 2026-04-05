'use client'
import React, { useEffect } from 'react'
import { Plus, Copy, Send, LayoutGrid, X, ArrowLeft, Search, Trash2, ChevronUp, ChevronDown, ImagePlus, UploadCloud } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const DAY_NAME_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function nextDayName(index: number) {
    return DAY_NAME_OPTIONS[index] || `Day ${index + 1}`
}

interface ProgramExercise {
    id: string
    name: string
    sets: number
    reps: number
    imageUrl: string | null
}

interface ProgramDay {
    id: string
    name: string
    exercises: ProgramExercise[]
}

function createExercise(index: number): ProgramExercise {
    return {
        id: `ex-${Date.now()}-${index}`,
        name: '',
        sets: 3,
        reps: 10,
        imageUrl: null,
    }
}

export default function ProgramsPage() {
    const {
        programs,
        clients: roster,
        fetchPrograms,
        fetchClients,
        addProgram,
        updateProgram,
        duplicateProgram,
        deleteProgram,
        assignProgram,
    } = useCoachPortalData()

    const [builderState, setBuilderState] = React.useState<{
        isOpen: boolean
        name: string
        programId: string | null
        difficulty: string
        length: string
        cover: string
    }>({
        isOpen: false,
        name: '',
        programId: null,
        difficulty: 'Beginner',
        length: '4 Weeks',
        cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop',
    })
    const [builderDays, setBuilderDays] = React.useState<ProgramDay[]>([
        {
            id: 'd1',
            name: 'Monday',
            exercises: [
                { id: 'd1-ex1', name: 'Squat (Barbell)', sets: 4, reps: 6, imageUrl: null },
                { id: 'd1-ex2', name: 'Romanian Deadlift', sets: 3, reps: 8, imageUrl: null },
                { id: 'd1-ex3', name: 'Leg Press', sets: 3, reps: 12, imageUrl: null },
            ],
        },
        {
            id: 'd2',
            name: 'Tuesday',
            exercises: [
                { id: 'd2-ex1', name: 'Bench Press', sets: 4, reps: 6, imageUrl: null },
                { id: 'd2-ex2', name: 'Pull Up', sets: 4, reps: 8, imageUrl: null },
                { id: 'd2-ex3', name: 'Overhead Press', sets: 3, reps: 10, imageUrl: null },
            ],
        },
    ])

    const [assignModal, setAssignModal] = React.useState<{isOpen: boolean, programId: string | null}>({isOpen: false, programId: null})
    const [selectedClients, setSelectedClients] = React.useState<string[]>([])
    const [isPageLoading, setIsPageLoading] = React.useState(true)
    const [isUploadingExerciseKey, setIsUploadingExerciseKey] = React.useState<string | null>(null)
    const [expandedImageUrl, setExpandedImageUrl] = React.useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = React.useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [pendingConfirmationAction, setPendingConfirmationAction] = React.useState<null | (() => Promise<void>)>(null)
    const [isConfirming, setIsConfirming] = React.useState(false)

    useEffect(() => {
        let isMounted = true

        void (async () => {
            setIsPageLoading(true)
            await Promise.all([fetchPrograms(), fetchClients()])
            if (isMounted) setIsPageLoading(false)
        })()

        return () => {
            isMounted = false
        }
    }, [fetchClients, fetchPrograms])

    const clients = roster.map((client) => ({
        id: client.id,
        name: client.name,
        plan: client.status,
    }))

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

    const uploadExerciseImage = async (dayId: string, exerciseIndex: number, file: File) => {
        const uploadKey = `${dayId}:${exerciseIndex}`
        setIsUploadingExerciseKey(uploadKey)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', 'programs')

            const response = await requestApi<{ url: string }>('/api/v1/coach/media/upload', {
                method: 'POST',
                body: formData,
            })

            const uploadedUrl = String(response.data.url || '')
            if (!uploadedUrl) {
                toast.error('Upload failed: no media URL returned.')
                return
            }

            setBuilderDays((prev) => prev.map((entry) => {
                if (entry.id !== dayId) return entry
                return {
                    ...entry,
                    exercises: entry.exercises.map((exercise, currentExerciseIndex) =>
                        currentExerciseIndex === exerciseIndex
                            ? { ...exercise, imageUrl: uploadedUrl }
                            : exercise,
                    ),
                }
            }))

            toast.success('Exercise image uploaded.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to upload exercise image.')
        } finally {
            setIsUploadingExerciseKey(null)
        }
    }

    const moveExerciseWithinDay = (dayId: string, sourceIndex: number, delta: number) => {
        setBuilderDays((prev) => prev.map((day) => {
            if (day.id !== dayId) return day
            const targetIndex = sourceIndex + delta
            if (targetIndex < 0 || targetIndex >= day.exercises.length) return day

            const nextExercises = [...day.exercises]
            const [moved] = nextExercises.splice(sourceIndex, 1)
            nextExercises.splice(targetIndex, 0, moved)

            return {
                ...day,
                exercises: nextExercises,
            }
        }))
    }

    if (builderState.isOpen) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full bg-(--bg-base) rounded-[24px] overflow-hidden -mt-2 sm:-mt-4 border border-(--border-subtle)">
                <div className="min-h-[72px] shrink-0 border-b border-(--border-subtle) bg-(--bg-surface) flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3 z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button onClick={() => setBuilderState((prev) => ({ ...prev, isOpen: false, programId: null }))} className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </button>
                        <input 
                            value={builderState.name}
                            onChange={(e) => setBuilderState({...builderState, name: e.target.value})}
                            className="font-display font-black text-[16px] sm:text-[18px] lg:text-[20px] bg-transparent border-none outline-none text-(--text-primary) w-[170px] sm:w-[240px] md:w-[300px]"
                            placeholder="Program Name"
                        />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-[12px] sm:text-[13px] text-(--text-secondary) font-bold">Changes saved</span>
                        <button
                            onClick={() => {
                                void (async () => {
                                    const normalizedDays = builderDays.map((day, index) => ({
                                        ...day,
                                        name: (day.name || nextDayName(index)).trim(),
                                        exercises: day.exercises
                                            .map((exercise, exerciseIndex) => ({
                                                id: exercise.id || `${day.id}-ex-${exerciseIndex + 1}`,
                                                name: (exercise.name || '').trim(),
                                                sets: Math.max(1, Math.min(99, Math.round(Number(exercise.sets || 3)))),
                                                reps: Math.max(1, Math.min(99, Math.round(Number(exercise.reps || 10)))),
                                                imageUrl: exercise.imageUrl?.trim() ? exercise.imageUrl.trim() : null,
                                            }))
                                            .filter((exercise) => exercise.name.length > 0),
                                    }))

                                    const payload = {
                                        name: builderState.name || 'Untitled Program',
                                        difficulty: builderState.difficulty,
                                        length: builderState.length,
                                        cover: builderState.cover,
                                        builderDays: normalizedDays,
                                    }

                                    openConfirmation(
                                        {
                                            title: builderState.programId ? 'Update Program?' : 'Create Program?',
                                            message: builderState.programId
                                                ? 'This will save all changes to the program and exercises.'
                                                : 'This will create a new program with the current workout setup.',
                                            confirmText: builderState.programId ? 'Update Program' : 'Create Program',
                                        },
                                        async () => {
                                            if (builderState.programId) {
                                                await updateProgram(builderState.programId, payload)
                                                toast.success('Program updated.')
                                            } else {
                                                await addProgram(payload)
                                                toast.success('Program created.')
                                            }

                                            setBuilderState((prev) => ({ ...prev, isOpen: false, programId: null }))
                                        },
                                    )
                                })()
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-6 h-[40px] rounded-[12px] font-bold text-[13px] sm:text-[14px]"
                        >
                            Publish Program
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex gap-4 sm:gap-6 items-start overflow-x-auto">
                    {builderDays.map(day => (
                        <div key={day.id} className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm flex flex-col max-h-full">
                            <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between bg-[var(--bg-elevated)] rounded-t-[20px]">
                                <select
                                    value={day.name}
                                    onChange={(event) => {
                                        const nextName = event.target.value
                                        setBuilderDays((prev) => prev.map((entry) => entry.id === day.id ? { ...entry, name: nextName } : entry))
                                    }}
                                    className="h-[34px] px-2 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[13px] font-bold text-(--text-primary) outline-none"
                                >
                                    {DAY_NAME_OPTIONS.map((dayName) => (
                                        <option key={dayName} value={dayName}>{dayName}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (builderDays.length <= 1) {
                                                toast.info('At least one day is required.')
                                                return
                                            }

                                            setBuilderDays((prev) => prev.filter((entry) => entry.id !== day.id))
                                        }}
                                        className="w-[28px] h-[28px] rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-red-600 hover:border-red-500/30 flex items-center justify-center"
                                        title="Delete day"
                                    >
                                        <Trash2 className="w-[14px] h-[14px]" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[100px]">
                                {day.exercises.map((exercise, i) => (
                                    <div
                                        key={exercise.id}
                                        className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] p-3 flex flex-col gap-2 hover:border-emerald-500/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={exercise.name}
                                                onChange={(event) => {
                                                    const nextName = event.target.value
                                                    setBuilderDays((prev) => prev.map((entry) => {
                                                        if (entry.id !== day.id) return entry
                                                        return {
                                                            ...entry,
                                                            exercises: entry.exercises.map((entryExercise, exerciseIndex) =>
                                                                exerciseIndex === i
                                                                    ? { ...entryExercise, name: nextName }
                                                                    : entryExercise,
                                                            ),
                                                        }
                                                    }))
                                                }}
                                                placeholder="Exercise name"
                                                className="flex-1 h-[34px] px-2 rounded-[8px] bg-(--bg-surface) border border-(--border-default) font-bold text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                            />
                                            <button
                                                onClick={() => moveExerciseWithinDay(day.id, i, -1)}
                                                disabled={i === 0}
                                                className="w-[28px] h-[28px] rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) disabled:opacity-40"
                                                title="Move up"
                                            >
                                                <ChevronUp className="w-[14px] h-[14px] mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => moveExerciseWithinDay(day.id, i, 1)}
                                                disabled={i === day.exercises.length - 1}
                                                className="w-[28px] h-[28px] rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) disabled:opacity-40"
                                                title="Move down"
                                            >
                                                <ChevronDown className="w-[14px] h-[14px] mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setBuilderDays((prev) => prev.map((entry) => {
                                                        if (entry.id !== day.id) return entry
                                                        return {
                                                            ...entry,
                                                            exercises: entry.exercises.filter((_, exerciseIndex) => exerciseIndex !== i),
                                                        }
                                                    }))
                                                }}
                                                className="w-[28px] h-[28px] rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-red-600 hover:border-red-500/30"
                                                title="Delete exercise"
                                            >
                                                <Trash2 className="w-[14px] h-[14px] mx-auto" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                                Sets
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={99}
                                                    value={exercise.sets}
                                                    onChange={(event) => {
                                                        const nextSets = Math.max(1, Math.min(99, Number(event.target.value || 1)))
                                                        setBuilderDays((prev) => prev.map((entry) => {
                                                            if (entry.id !== day.id) return entry
                                                            return {
                                                                ...entry,
                                                                exercises: entry.exercises.map((entryExercise, exerciseIndex) =>
                                                                    exerciseIndex === i
                                                                        ? { ...entryExercise, sets: nextSets }
                                                                        : entryExercise,
                                                                ),
                                                            }
                                                        }))
                                                    }}
                                                    className="mt-1 w-full h-[32px] px-2 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                                />
                                            </label>
                                            <label className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                                Reps
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={99}
                                                    value={exercise.reps}
                                                    onChange={(event) => {
                                                        const nextReps = Math.max(1, Math.min(99, Number(event.target.value || 1)))
                                                        setBuilderDays((prev) => prev.map((entry) => {
                                                            if (entry.id !== day.id) return entry
                                                            return {
                                                                ...entry,
                                                                exercises: entry.exercises.map((entryExercise, exerciseIndex) =>
                                                                    exerciseIndex === i
                                                                        ? { ...entryExercise, reps: nextReps }
                                                                        : entryExercise,
                                                                ),
                                                            }
                                                        }))
                                                    }}
                                                    className="mt-1 w-full h-[32px] px-2 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-[13px] text-(--text-primary) outline-none focus:border-emerald-500"
                                                />
                                            </label>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <input
                                                id={`exercise-image-input-${day.id}-${exercise.id}`}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0]
                                                    if (!file) return
                                                    void uploadExerciseImage(day.id, i, file)
                                                    event.target.value = ''
                                                }}
                                            />
                                            <div
                                                onDragOver={(event) => event.preventDefault()}
                                                onDrop={(event) => {
                                                    event.preventDefault()
                                                    const file = event.dataTransfer.files?.[0]
                                                    if (!file) return
                                                    void uploadExerciseImage(day.id, i, file)
                                                }}
                                                className="rounded-[10px] border border-dashed border-(--border-subtle) bg-(--bg-surface) p-2 flex items-center justify-between gap-2"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <ImagePlus className="w-[14px] h-[14px] text-(--text-tertiary)" />
                                                    <span className="text-[11px] text-(--text-secondary) truncate">
                                                        {isUploadingExerciseKey === `${day.id}:${i}` ? 'Uploading image...' : 'Drag image or browse'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById(`exercise-image-input-${day.id}-${exercise.id}`) as HTMLInputElement | null
                                                        input?.click()
                                                    }}
                                                    className="h-[26px] px-2 rounded-[8px] border border-(--border-default) text-[11px] font-bold text-(--text-primary) flex items-center gap-1"
                                                >
                                                    <UploadCloud className="w-[11px] h-[11px]" /> Browse
                                                </button>
                                            </div>
                                            {exercise.imageUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedImageUrl(exercise.imageUrl)}
                                                    className="rounded-[10px] border border-(--border-subtle) overflow-hidden text-left"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={exercise.imageUrl}
                                                        alt={`${exercise.name || 'Exercise'} preview`}
                                                        className="w-full h-[100px] object-cover"
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        <span className="block text-[12px] text-(--text-secondary)">
                                            {exercise.sets} sets x {exercise.reps} reps
                                        </span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setBuilderDays((prev) => prev.map((entry) =>
                                            entry.id === day.id
                                                ? {
                                                    ...entry,
                                                    exercises: [...entry.exercises, createExercise(entry.exercises.length)],
                                                }
                                                : entry,
                                        ))
                                    }}
                                    className="w-full h-[44px] rounded-[12px] border border-dashed border-(--border-subtle) flex items-center justify-center gap-2 text-(--text-secondary) font-bold text-[13px] hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors mt-2"
                                >
                                    <Plus className="w-[16px] h-[16px]" /> Add Exercise
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            setBuilderDays([...builderDays, {id: 'd' + Date.now(), name: nextDayName(builderDays.length), exercises: []}])
                        }}
                        className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 h-[60px] bg-(--bg-surface) border border-dashed border-(--border-subtle) rounded-[20px] flex items-center justify-center gap-2 text-(--text-secondary) font-bold text-[14px] hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors"
                    >
                        <Plus className="w-[18px] h-[18px]" /> Add Day
                    </button>
                </div>
            </motion.div>
        )
    }

    if (isPageLoading && programs.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
                <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="h-72 rounded-[24px] bg-[var(--bg-elevated)]" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-subtle) pb-6">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Program Builder</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Create and manage your reusable workout templates and master programs.</p>
                </div>
                <button onClick={() => {
                    setBuilderDays([
                        {id: 'd1', name: 'Monday', exercises: [createExercise(0)]},
                    ])
                    setBuilderState({isOpen: true, name: 'Untitled Program', programId: null, difficulty: 'Beginner', length: '4 Weeks', cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'})
                }} className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2">
                    <Plus className="w-[18px] h-[18px]" /> Create Program
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
                {programs.map(p => (
                    <div key={p.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
                        <div className="h-[140px] relative overflow-hidden bg-[var(--bg-elevated)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.cover} alt={`${p.name} cover`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 bg-[var(--bg-surface)]/90 backdrop-blur-sm px-2.5 py-1 rounded-[8px] font-bold text-[11px] text-(--text-primary) shadow-sm border border-(--border-subtle)">
                                {p.enrolled} Enrolled
                            </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary) leading-tight mb-2 line-clamp-1">{p.name}</h3>
                            <div className="flex items-center gap-3 font-body text-[13px] font-medium text-(--text-secondary) mb-5">
                                <span className="bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[6px] border border-(--border-default)">{p.difficulty}</span>
                                <span>{p.length}</span>
                            </div>
                            
                            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    setBuilderDays(p.builderDays?.length ? p.builderDays : [
                                        {id: 'd1', name: 'Monday', exercises: [createExercise(0)]}
                                    ])
                                    setBuilderState({
                                        isOpen: true,
                                        name: p.name,
                                        programId: p.id,
                                        difficulty: p.difficulty,
                                        length: p.length,
                                        cover: p.cover,
                                    })
                                }} className="flex-1 py-2 rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) font-bold text-[13px] text-(--text-primary) transition-colors flex items-center justify-center gap-1.5">
                                    <LayoutGrid className="w-[14px] h-[14px]" /> Edit
                                </button>
                                <button onClick={() => { void duplicateProgram(p.id); toast.success(`Duplicated ${p.name}`) }} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer" title="Duplicate">
                                    <Copy className="w-[16px] h-[16px]" />
                                </button>
                                <button onClick={() => setAssignModal({isOpen: true, programId: p.id})} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer" title="Assign">
                                    <Send className="w-[16px] h-[16px]" />
                                </button>
                                <button
                                    onClick={() => {
                                        openConfirmation(
                                            {
                                                title: 'Delete Program?',
                                                message: `Delete \"${p.name}\"? This action cannot be undone.`,
                                                confirmText: 'Delete Program',
                                                tone: 'danger',
                                            },
                                            async () => {
                                                await deleteProgram(p.id)
                                                toast.success(`Deleted ${p.name}`)
                                            },
                                        )
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-red-500/10 border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-red-600 transition-colors cursor-pointer"
                                    title="Delete"
                                >
                                    <Trash2 className="w-[16px] h-[16px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div onClick={() => {
                setBuilderDays([
                    {id: 'd1', name: 'Monday', exercises: [createExercise(0)]},
                ])
                setBuilderState({isOpen: true, name: 'Untitled Program', programId: null, difficulty: 'Beginner', length: '4 Weeks', cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'})
            }} className="mt-8 bg-(--bg-surface) border border-dashed border-(--border-subtle) rounded-[24px] p-10 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-elevated)]/50 transition-colors cursor-pointer">
                <div className="w-[64px] h-[64px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                    <Plus className="w-[32px] h-[32px]" />
                </div>
                <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">Build a new program</h3>
                <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px]">Use our grid builder to map out mult-week training blocks with ease.</p>
            </div>

            <AnimatePresence>
                {assignModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setAssignModal({isOpen: false, programId: null}); setSelectedClients([]) }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-(--bg-surface) rounded-[24px] shadow-2xl relative z-10 flex flex-col border border-(--border-subtle)">
                            <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between pb-4 bg-[var(--bg-elevated)] rounded-t-[24px]">
                                <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Assign Program</h2>
                                <button onClick={() => { setAssignModal({isOpen: false, programId: null}); setSelectedClients([]) }} className="w-[32px] h-[32px] rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                    <input type="text" placeholder="Search clients..." className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-emerald-500" />
                                </div>
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {clients.map(client => (
                                        <label key={client.id} className="flex items-center justify-between p-3 rounded-[12px] hover:bg-[var(--bg-elevated)] cursor-pointer border border-transparent hover:border-(--border-subtle) transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedClients.includes(client.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedClients(prev => [...prev, client.id])
                                                        else setSelectedClients(prev => prev.filter(id => id !== client.id))
                                                    }}
                                                    className="w-[18px] h-[18px] rounded-[6px] border border-(--border-subtle) accent-emerald-500 cursor-pointer" 
                                                />
                                                <span className="font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                            </div>
                                            <span className="text-[12px] text-(--text-tertiary) uppercase tracking-wider font-bold">{client.plan}</span>
                                        </label>
                                    ))}
                                </div>
                                <button 
                                    disabled={selectedClients.length === 0}
                                    onClick={() => {
                                        if (!assignModal.programId) return
                                        openConfirmation(
                                            {
                                                title: 'Assign Program?',
                                                message: `Assign this program to ${selectedClients.length} selected client(s)?`,
                                                confirmText: 'Assign Program',
                                            },
                                            async () => {
                                                await assignProgram(assignModal.programId!, selectedClients)
                                                toast.success(`Program assigned to ${selectedClients.length} clients`)
                                                setAssignModal({isOpen: false, programId: null})
                                                setSelectedClients([])
                                            },
                                        )
                                    }} 
                                    className="w-full h-[48px] rounded-[12px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[15px] shadow-sm transition-colors mt-2"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {expandedImageUrl && (
                <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => setExpandedImageUrl(null)}>
                    <button
                        type="button"
                        onClick={() => setExpandedImageUrl(null)}
                        className="absolute top-4 right-4 w-[36px] h-[36px] rounded-[10px] bg-white/10 text-white flex items-center justify-center"
                    >
                        <X className="w-[16px] h-[16px]" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={expandedImageUrl} alt="Expanded exercise preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-[12px]" />
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
