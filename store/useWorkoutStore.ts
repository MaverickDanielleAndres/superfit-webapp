import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WorkoutSession, WorkoutRoutine, Exercise, SetLog, ExerciseLog } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database, Json } from '@/types/supabase'

interface WorkoutState {
    sessions: WorkoutSession[]
    routines: WorkoutRoutine[]
    exerciseLibrary: Exercise[]
    activeSession: WorkoutSession | null
    isLoading: boolean
    error: string | null

    customExercises: Exercise[]
    fetchSessions: () => Promise<void>

    startSession: (routineId?: string) => void
    endSession: () => void
    saveWorkoutSession: (session: WorkoutSession) => void
    logSet: (exerciseId: string, setIndex: number, setLog: Partial<SetLog>) => void
    addExerciseToSession: (exercise: Exercise) => void
    addSetToExercise: (exerciseId: string) => void
    removeSetFromExercise: (exerciseId: string, setIndex: number) => void
    removeExerciseFromSession: (exerciseId: string) => void
    reorderSessionExercises: (startIndex: number, endIndex: number) => void
    addCustomExercise: (exercise: Exercise) => void
}

type WorkoutSessionRow = Database['public']['Tables']['workout_sessions']['Row']

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            sessions: [],
            isLoading: false,
            error: null,
            routines: [],
            exerciseLibrary: [
                {
                    id: 'ex1',
                    name: 'Barbell Back Squat',
                    muscleGroups: ['quads', 'glutes', 'core'],
                    equipment: ['barbell'],
                    movementPattern: 'squat',
                    difficulty: 'intermediate',
                    instructions: ['Keep chest up', 'Break parallel'],
                    videoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=100&fit=crop&q=80'
                },
                {
                    id: 'ex2',
                    name: 'Bench Press',
                    muscleGroups: ['chest', 'triceps', 'shoulders'],
                    equipment: ['barbell', 'bench'],
                    movementPattern: 'push',
                    difficulty: 'beginner',
                    instructions: ['Retract scapula', 'Push from chest'],
                    videoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop&q=80'
                },
                {
                    id: 'ex3',
                    name: 'Deadlift',
                    muscleGroups: ['hamstrings', 'glutes', 'back', 'core'],
                    equipment: ['barbell'],
                    movementPattern: 'hinge',
                    difficulty: 'advanced',
                    instructions: ['Keep back straight', 'Drive through heels'],
                    videoUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=100&h=100&fit=crop&q=80'
                }
            ],
            customExercises: [],
            activeSession: null,

            fetchSessions: async () => {
                if (!isSupabaseAuthEnabled()) return

                set({ isLoading: true, error: null })
                const supabase = createClient()
                const { data: authData } = await supabase.auth.getUser()
                const userId = authData.user?.id

                if (!userId) {
                    set({ isLoading: false, error: 'User not authenticated.' })
                    return
                }

                const { data, error } = await supabase
                    .from('workout_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('start_time', { ascending: false })

                if (error) {
                    set({ isLoading: false, error: error.message })
                    return
                }

                const mapped = (data || []).map(mapRowToWorkoutSession)
                set({ sessions: mapped, isLoading: false, error: null })
            },

            startSession: (routineId) => {
                // mock logic for starting session
                const newSession: WorkoutSession = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Workout',
                    date: new Date().toISOString().split('T')[0],
                    startTime: new Date().toISOString(),
                    exercises: [],
                    totalVolume: 0,
                    isCompleted: false,
                    isTemplate: false,
                    routineId
                }
                set({ activeSession: newSession })
            },

            endSession: () => {
                set((state) => {
                    if (!state.activeSession) return state
                    const completedSession = {
                        ...state.activeSession,
                        endTime: new Date().toISOString(),
                        isCompleted: true
                    }

                    if (isSupabaseAuthEnabled()) {
                        void persistWorkoutSession(completedSession, (message) => set({ error: message }))
                    }

                    return {
                        sessions: [...state.sessions, completedSession],
                        activeSession: null
                    }
                })
            },

            saveWorkoutSession: (session) => {
                if (isSupabaseAuthEnabled()) {
                    void persistWorkoutSession(session, (message) => set({ error: message }))
                }

                set((state) => ({
                    sessions: [session, ...state.sessions]
                }))
            },

            logSet: (exerciseId, setIndex, setLogUpdate) => {
                set((state) => {
                    if (!state.activeSession) return state

                    const updatedExercises = state.activeSession.exercises.map(ex => {
                        if (ex.exerciseId === exerciseId) {
                            const updatedSets = [...ex.sets]
                            if (updatedSets[setIndex]) {
                                updatedSets[setIndex] = { ...updatedSets[setIndex], ...setLogUpdate }
                            }
                            return { ...ex, sets: updatedSets }
                        }
                        return ex
                    })

                    return {
                        activeSession: {
                            ...state.activeSession,
                            exercises: updatedExercises
                        }
                    }
                })
            },

            addExerciseToSession: (exercise) => {
                set((state) => {
                    if (!state.activeSession) return state

                    const newExerciseLog: ExerciseLog = {
                        id: Math.random().toString(36).substr(2, 9),
                        exerciseId: exercise.id,
                        exercise,
                        sets: [
                            {
                                id: Math.random().toString(36).substr(2, 9),
                                setNumber: 1,
                                weight: 0,
                                reps: 0,
                                setType: 'working' as const,
                                completed: false
                            }
                        ],
                        isSuperset: false
                    }

                    return {
                        activeSession: {
                            ...state.activeSession,
                            exercises: [...state.activeSession.exercises, newExerciseLog]
                        }
                    }
                })
            },

            addSetToExercise: (exerciseId) => {
                set((state) => {
                    if (!state.activeSession) return state
                    const updatedExercises = state.activeSession.exercises.map(ex => {
                        if (ex.exerciseId === exerciseId) {
                            const lastSet = ex.sets[ex.sets.length - 1]
                            return {
                                ...ex,
                                sets: [...ex.sets, {
                                    id: Math.random().toString(36).substr(2, 9),
                                    setNumber: ex.sets.length + 1,
                                    weight: lastSet ? lastSet.weight : 0,
                                    reps: lastSet ? lastSet.reps : 0,
                                    setType: 'working' as const,
                                    completed: false
                                }]
                            }
                        }
                        return ex
                    })
                    return { activeSession: { ...state.activeSession, exercises: updatedExercises } }
                })
            },

            removeSetFromExercise: (exerciseId, setIndex) => {
                set((state) => {
                    if (!state.activeSession) return state
                    const updatedExercises = state.activeSession.exercises.map(ex => {
                        if (ex.exerciseId === exerciseId) {
                            const newSets = ex.sets.filter((_, idx) => idx !== setIndex).map((s, idx) => ({ ...s, setNumber: idx + 1 }))
                            return { ...ex, sets: newSets }
                        }
                        return ex
                    })
                    return { activeSession: { ...state.activeSession, exercises: updatedExercises } }
                })
            },

            removeExerciseFromSession: (exerciseId) => {
                set((state) => {
                    if (!state.activeSession) return state
                    return {
                        activeSession: {
                            ...state.activeSession,
                            exercises: state.activeSession.exercises.filter(ex => ex.exerciseId !== exerciseId)
                        }
                    }
                })
            },

            reorderSessionExercises: (startIndex, endIndex) => {
                set((state) => {
                    if (!state.activeSession) return state
                    const result = Array.from(state.activeSession.exercises)
                    const [removed] = result.splice(startIndex, 1)
                    result.splice(endIndex, 0, removed)
                    return {
                        activeSession: {
                            ...state.activeSession,
                            exercises: result
                        }
                    }
                })
            },

            addCustomExercise: (exercise) => {
                set((state) => ({
                    customExercises: [exercise, ...state.customExercises]
                }))
            }
        }),
        { name: 'superfit-workout-storage' }
    )
)

async function persistWorkoutSession(session: WorkoutSession, onError: (message: string) => void) {
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id

    if (!userId) {
        onError('User not authenticated.')
        return
    }

    const payload: Database['public']['Tables']['workout_sessions']['Insert'] = {
        id: session.id,
        user_id: userId,
        name: session.name,
        date: session.date,
        start_time: session.startTime,
        end_time: session.endTime || null,
        duration: session.duration || null,
        exercises: session.exercises as unknown as Json,
        total_volume: session.totalVolume,
        calories: session.calories || null,
        notes: session.notes || null,
        is_completed: session.isCompleted,
        routine_id: session.routineId || null,
        is_template: session.isTemplate,
    }

    const { error } = await supabase
        .from('workout_sessions')
        .upsert(payload, { onConflict: 'id' })

    if (error) onError(error.message)
}

function mapRowToWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
    const fallbackStart = row.start_time || row.started_at || new Date().toISOString()

    return {
        id: row.id,
        name: row.name,
        date: row.date || fallbackStart.slice(0, 10),
        startTime: fallbackStart,
        endTime: row.end_time || row.ended_at || undefined,
        duration: row.duration || row.duration_seconds || undefined,
        exercises: row.exercises as unknown as ExerciseLog[],
        totalVolume: Number(row.total_volume || 0),
        calories: row.calories || undefined,
        notes: row.notes || undefined,
        isCompleted: row.is_completed,
        routineId: row.routine_id || row.template_id || undefined,
        isTemplate: row.is_template,
    }
}
