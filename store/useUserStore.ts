import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserProfile } from '@/types'
import { calculateBMR, calculateTDEE, calculateProteinTarget, calculateWaterGoal } from '@/lib/calculations'
import { getMockUser } from '@/lib/mockData'

interface UserState {
    user: UserProfile | null
    isAuthenticated: boolean
    setUser: (user: UserProfile) => void
    updateUser: (partial: Partial<UserProfile>) => void
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    completeOnboarding: (data: Partial<UserProfile>) => void
    recalculateTargets: () => void
    initializeMockUser: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partial } : null
                })),

            login: async (email, password) => {
                // MVP: mock login — accept any credentials
                const mockUser = getMockUser()
                set({ user: mockUser, isAuthenticated: true })
            },

            logout: () => set({ user: null, isAuthenticated: false }),

            completeOnboarding: (data: any) => {
                const { weight, height, age, sex, goal, activityLevel } = data as any
                const bmr = calculateBMR(weight, height, age, sex)
                const tdee = calculateTDEE(bmr, activityLevel)
                const deficitSurplus = goal === 'weight_loss' ? -500 : goal === 'muscle_gain' ? 300 : 0
                const calorieTarget = Math.max(1200, tdee + deficitSurplus)
                const protein = calculateProteinTarget(weight, goal, activityLevel)
                const fat = Math.round((calorieTarget * 0.28) / 9)
                const carbs = Math.round((calorieTarget - (protein * 4) - (fat * 9)) / 4)
                const water = calculateWaterGoal(weight, activityLevel)

                set((state) => ({
                    user: state.user ? {
                        ...state.user,
                        ...data,
                        bmr,
                        tdee,
                        dailyCalorieTarget: calorieTarget,
                        proteinTarget: protein,
                        carbTarget: carbs,
                        fatTarget: fat,
                        fiberTarget: sex === 'male' ? 38 : 25,
                        waterTargetMl: water,
                        onboardingComplete: true,
                    } : null
                }))
            },

            recalculateTargets: () => {
                const { user } = get()
                if (!user) return
                const bmr = calculateBMR(user.currentWeight, user.height, user.age, user.sex)
                const tdee = calculateTDEE(bmr, user.activityLevel)
                const deficitSurplus = user.goal === 'weight_loss' ? -500 : user.goal === 'muscle_gain' ? 300 : 0
                const calorieTarget = Math.max(1200, tdee + deficitSurplus)
                const protein = calculateProteinTarget(user.currentWeight, user.goal, user.activityLevel)
                const fat = Math.round((calorieTarget * 0.28) / 9)
                const carbs = Math.round((calorieTarget - (protein * 4) - (fat * 9)) / 4)
                const water = calculateWaterGoal(user.currentWeight, user.activityLevel)

                set({
                    user: {
                        ...user,
                        bmr,
                        tdee,
                        dailyCalorieTarget: calorieTarget,
                        proteinTarget: protein,
                        carbTarget: carbs,
                        fatTarget: fat,
                        waterTargetMl: water
                    }
                })
            },

            initializeMockUser: () => {
                set({ user: getMockUser(), isAuthenticated: true })
            }
        }),
        {
            name: 'superfit-user-storage',
        }
    )
)
