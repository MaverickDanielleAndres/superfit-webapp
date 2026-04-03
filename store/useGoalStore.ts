/**
 * useGoalStore.ts
 * Manages fitness goals, milestones, and achievement tracking.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'
import { requestApi } from '@/lib/api/client'

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
                try {
                    const response = await requestApi<{ goals: GoalRow[] }>('/api/v1/goals')
                    const mapped = response.data.goals.map((row) => mapRowToGoal(row))
                    set({ goals: mapped, isLoading: false, error: null })
                } catch (error) {
                    set({ isLoading: false, error: getErrorMessage(error) })
                }
            },

            addGoal: async (goal) => {
                if (!isSupabaseAuthEnabled()) {
                    set((state) => ({
                        goals: [...state.goals, { ...goal, id: `goal_${Date.now()}`, createdAt: new Date().toISOString() }]
                    }))
                    return
                }

                const tempId = `goal_${Date.now()}`
                const optimistic: FitnessGoal = { ...goal, id: tempId, createdAt: new Date().toISOString() }

                set((state) => ({ goals: [optimistic, ...state.goals] }))

                try {
                    const response = await requestApi<{ goal: GoalRow }>('/api/v1/goals', {
                        method: 'POST',
                        body: JSON.stringify({
                            title: goal.title,
                            category: goal.category,
                            target: goal.target,
                            current: goal.current,
                            start: goal.start,
                            unit: goal.unit,
                            deadline: goal.deadline,
                            projectedComplete: goal.projectedComplete || null,
                            ahead: goal.ahead,
                            completed: goal.completed,
                        }),
                    })

                    set((state) => ({
                        goals: state.goals.map((g) => (g.id === tempId ? mapRowToGoal(response.data.goal) : g)),
                        error: null,
                    }))
                } catch (error) {
                    set((state) => ({
                        goals: state.goals.filter((g) => g.id !== tempId),
                        error: getErrorMessage(error),
                    }))
                }
            },

            updateGoal: async (id, partial) => {
                const previousGoals = get().goals
                set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...partial } : g)) }))

                if (!isSupabaseAuthEnabled()) return

                try {
                    const response = await requestApi<{ goal: GoalRow }>(`/api/v1/goals/${id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            title: partial.title,
                            category: partial.category,
                            target: partial.target,
                            current: partial.current,
                            start: partial.start,
                            unit: partial.unit,
                            deadline: partial.deadline,
                            projectedComplete: partial.projectedComplete,
                            ahead: partial.ahead,
                            completed: partial.completed,
                        }),
                    })

                    set((state) => ({
                        goals: state.goals.map((goal) => (goal.id === id ? mapRowToGoal(response.data.goal) : goal)),
                        error: null,
                    }))
                } catch (error) {
                    set({ goals: previousGoals, error: getErrorMessage(error) })
                }
            },

            deleteGoal: async (id) => {
                const previous = get().goals
                set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))

                if (!isSupabaseAuthEnabled()) return

                try {
                    await requestApi<{ deleted: boolean; id: string }>(`/api/v1/goals/${id}`, {
                        method: 'DELETE',
                    })
                } catch (error) {
                    set({ goals: previous, error: getErrorMessage(error) })
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

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }
    return 'Request failed.'
}
