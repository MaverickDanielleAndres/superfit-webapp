/**
 * useGoalStore.ts
 * Manages fitness goals, milestones, and achievement tracking.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    addGoal: (goal: Omit<FitnessGoal, 'id' | 'createdAt'>) => void
    updateGoal: (id: string, partial: Partial<FitnessGoal>) => void
    deleteGoal: (id: string) => void
    markComplete: (id: string) => void
}

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
        (set) => ({
            goals: MOCK_GOALS,

            addGoal: (goal) => set(state => ({
                goals: [...state.goals, { ...goal, id: `goal_${Date.now()}`, createdAt: new Date().toISOString() }]
            })),

            updateGoal: (id, partial) => set(state => ({
                goals: state.goals.map(g => g.id === id ? { ...g, ...partial } : g)
            })),

            deleteGoal: (id) => set(state => ({
                goals: state.goals.filter(g => g.id !== id)
            })),

            markComplete: (id) => set(state => ({
                goals: state.goals.map(g => g.id === id ? { ...g, completed: true } : g)
            }))
        }),
        { name: 'superfit-goals-storage' }
    )
)
