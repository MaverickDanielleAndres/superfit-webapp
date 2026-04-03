/**
 * useGoalStore.ts
 * Manages fitness goals, milestones, and achievement tracking.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'

export interface FitnessGoal {
    id: string
    title: string
    category: 'Weight Loss' | 'Strength' | 'Endurance' | 'Habit' | 'Nutrition' | 'Body Composition'
    current: number
    target: number
    start: number
    unit: string
    deadline: string
    projectedComplete?: string
    ahead: boolean
    completed: boolean
    color: string
    createdAt: string
}

interface GoalState {
    goals: FitnessGoal[]
    isLoading: boolean
    error: string | null
    fetchGoals: () => Promise<void>
    addGoal: (goal: Omit<FitnessGoal, 'id' | 'createdAt'>) => Promise<void>
    updateGoal: (id: string, partial: Partial<FitnessGoal>) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
    markComplete: (id: string) => Promise<void>
}

type GoalRow = Database['public']['Tables']['goals']['Row']

const MOCK_GOALS: FitnessGoal[] = [
    {
        id: 'goal_1',
        title: 'Lose 5 kg',
        category: 'Weight Loss',
        current: 82.5, target: 80.0, start: 85.0,
        unit: 'kg',
        deadline: '2024-06-01',
        projectedComplete: '2024-05-15',
        ahead: true, completed: false,
        color: 'bg-blue-500',
        createdAt: new Date().toISOString()
    },
    {
        id: 'goal_2',
        title: 'Squat 150 kg',
        category: 'Strength',
        current: 135, target: 150, start: 100,
        unit: 'kg',
        deadline: '2024-08-01',
        projectedComplete: '2024-08-10',
        ahead: false, completed: false,
        color: 'bg-emerald-500',
        createdAt: new Date().toISOString()
    },
    {
        id: 'goal_3',
        title: 'Run 10km under 50m',
        category: 'Endurance',
        current: 55, target: 50, start: 65,
        unit: 'm',
        deadline: '2024-07-01',
        projectedComplete: '2024-06-25',
        ahead: true, completed: false,
        color: 'bg-purple-500',
        createdAt: new Date().toISOString()
    }
]

export const useGoalStore = create<GoalState>()(
    persist(
        (set, get) => ({
            goals: MOCK_GOALS,
            isLoading: false,
            error: null,

            fetchGoals: async () => {
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
                    .from('goals')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })

                if (error) {
                    set({ isLoading: false, error: error.message })
                    return
                }

                const mapped = (data || []).map((row) => mapRowToGoal(row))
                set({ goals: mapped, isLoading: false, error: null })
            },

            addGoal: async (goal) => {
                if (!isSupabaseAuthEnabled()) {
                    set((state) => ({
                        goals: [...state.goals, { ...goal, id: `goal_${Date.now()}`, createdAt: new Date().toISOString() }]
                    }))
                    return
                }

                const supabase = createClient()
                const { data: authData } = await supabase.auth.getUser()
                const userId = authData.user?.id
                if (!userId) return

                const tempId = `goal_${Date.now()}`
                const optimistic: FitnessGoal = { ...goal, id: tempId, createdAt: new Date().toISOString() }

                set((state) => ({ goals: [optimistic, ...state.goals] }))

                const payload: Database['public']['Tables']['goals']['Insert'] = {
                    user_id: userId,
                    title: goal.title,
                    category: goal.category,
                    target_value: goal.target,
                    current_value: goal.current,
                    start_value: goal.start,
                    unit: goal.unit,
                    deadline: goal.deadline,
                    projected_complete: goal.projectedComplete || null,
                    ahead: goal.ahead,
                    completed: goal.completed,
                    completed_at: null,
                }

                const { data, error } = await supabase.from('goals').insert(payload).select('*').single()

                if (error || !data) {
                    set((state) => ({ goals: state.goals.filter((g) => g.id !== tempId), error: error?.message || 'Unable to create goal.' }))
                    return
                }

                set((state) => ({
                    goals: state.goals.map((g) => (g.id === tempId ? mapRowToGoal(data) : g)),
                    error: null
                }))
            },

            updateGoal: async (id, partial) => {
                set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...partial } : g)) }))

                if (!isSupabaseAuthEnabled()) return

                const supabase = createClient()
                const payload: Database['public']['Tables']['goals']['Update'] = {
                    title: partial.title,
                    category: partial.category,
                    target_value: partial.target,
                    current_value: partial.current,
                    start_value: partial.start,
                    unit: partial.unit,
                    deadline: partial.deadline,
                    projected_complete: partial.projectedComplete,
                    ahead: partial.ahead,
                    completed: partial.completed,
                    completed_at: partial.completed ? new Date().toISOString() : null,
                }

                const { error } = await supabase.from('goals').update(payload).eq('id', id)
                if (error) set({ error: error.message })
            },

            deleteGoal: async (id) => {
                const previous = get().goals
                set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))

                if (!isSupabaseAuthEnabled()) return

                const supabase = createClient()
                const { error } = await supabase.from('goals').delete().eq('id', id)
                if (error) {
                    set({ goals: previous, error: error.message })
                }
            },

            markComplete: async (id) => {
                await get().updateGoal(id, { completed: true })
            }
        }),
        { name: 'superfit-goals-storage' }
    )
)

function mapRowToGoal(row: GoalRow): FitnessGoal {
    return {
        id: row.id,
        title: row.title,
        category: (row.category as FitnessGoal['category']) || 'Weight Loss',
        current: Number(row.current_value || 0),
        target: Number(row.target_value || 0),
        start: Number(row.start_value || 0),
        unit: row.unit || 'unit',
        deadline: row.deadline || new Date().toISOString().split('T')[0],
        projectedComplete: row.projected_complete || undefined,
        ahead: row.ahead,
        completed: row.completed,
        color: categoryToColor(row.category),
        createdAt: row.created_at,
    }
}

function categoryToColor(category: string | null): string {
    if (category === 'Weight Loss') return 'bg-blue-500'
    if (category === 'Strength') return 'bg-emerald-500'
    if (category === 'Endurance') return 'bg-purple-500'
    if (category === 'Habit') return 'bg-yellow-500'
    if (category === 'Nutrition') return 'bg-orange-500'
    if (category === 'Body Composition') return 'bg-pink-500'
    return 'bg-emerald-500'
}
