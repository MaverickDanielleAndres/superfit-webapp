import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DayLog, MealEntry, FoodItem, SavedMeal, WeeklyMealPlan } from '@/types'

interface NutritionState {
    dayLogs: DayLog[]
    foodDatabase: FoodItem[]
    savedMeals: SavedMeal[]
    mealPlans: WeeklyMealPlan[]

    addEntry: (date: string, entry: Omit<MealEntry, 'id'>) => void
    removeEntry: (date: string, entryId: string) => void
    getDayLog: (date: string) => DayLog | undefined
    getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number }
}

export const useNutritionStore = create<NutritionState>()(
    persist(
        (set, get) => ({
            dayLogs: [],
            foodDatabase: [],
            savedMeals: [],
            mealPlans: [],

            addEntry: (date, entry) => {
                set((state) => {
                    const existingDayLogIndex = state.dayLogs.findIndex((log) => log.date === date)
                    const newEntry: MealEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) }

                    if (existingDayLogIndex >= 0) {
                        const updatedLogs = [...state.dayLogs]
                        updatedLogs[existingDayLogIndex].entries.push(newEntry)
                        return { dayLogs: updatedLogs }
                    } else {
                        return { dayLogs: [...state.dayLogs, { date, entries: [newEntry] }] }
                    }
                })
            },

            removeEntry: (date, entryId) => {
                set((state) => {
                    const existingDayLogIndex = state.dayLogs.findIndex((log) => log.date === date)
                    if (existingDayLogIndex >= 0) {
                        const updatedLogs = [...state.dayLogs]
                        updatedLogs[existingDayLogIndex].entries = updatedLogs[existingDayLogIndex].entries.filter(e => e.id !== entryId)
                        return { dayLogs: updatedLogs }
                    }
                    return state
                })
            },

            getDayLog: (date) => {
                return get().dayLogs.find(log => log.date === date)
            },

            getDailyTotals: (date) => {
                const log = get().dayLogs.find(l => l.date === date)
                if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

                return log.entries.reduce(
                    (acc, entry) => {
                        const multiplier = entry.quantity
                        return {
                            calories: acc.calories + (entry.foodItem.calories * multiplier),
                            protein: acc.protein + (entry.foodItem.protein * multiplier),
                            carbs: acc.carbs + (entry.foodItem.carbs * multiplier),
                            fat: acc.fat + (entry.foodItem.fat * multiplier)
                        }
                    },
                    { calories: 0, protein: 0, carbs: 0, fat: 0 }
                )
            }
        }),
        { name: 'superfit-nutrition-storage' }
    )
)
