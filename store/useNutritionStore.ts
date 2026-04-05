import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DayLog, MealEntry, FoodItem, SavedMeal, WeeklyMealPlan } from '@/types'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'
import { requestApi } from '@/lib/api/client'

interface NutritionState {
    dayLogs: DayLog[]
    foodDatabase: FoodItem[]
    savedMeals: SavedMeal[]
    mealPlans: WeeklyMealPlan[]
    isLoading: boolean
    error: string | null

    fetchDayLog: (date: string) => Promise<void>
    addEntry: (date: string, entry: Omit<MealEntry, 'id'>, options?: AddEntryOptions) => Promise<void>
    removeEntry: (date: string, entryId: string) => Promise<void>
    getDayLog: (date: string) => DayLog | undefined
    getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number }
}

interface AddEntryOptions {
    imageUrl?: string
    imageSource?: 'manual_upload' | 'ai_scan' | 'food_api'
    isAiGenerated?: boolean
    scanMetadata?: Record<string, unknown>
}

type NutritionRow = Database['public']['Tables']['nutrition_entries']['Row']

export const useNutritionStore = create<NutritionState>()(
    persist(
        (set, get) => ({
            dayLogs: [],
            foodDatabase: [],
            savedMeals: [],
            mealPlans: [],
            isLoading: false,
            error: null,

            fetchDayLog: async (date) => {
                if (!isSupabaseAuthEnabled()) return

                set({ isLoading: true, error: null })
                try {
                    const response = await requestApi<{ date: string; entries: NutritionRow[] }>(`/api/v1/nutrition?date=${date}`)
                    const entries = response.data.entries.map(mapRowToEntry)
                    set((state) => ({
                        dayLogs: [...state.dayLogs.filter((log) => log.date !== date), { date, entries }],
                        isLoading: false,
                        error: null,
                    }))
                } catch (error) {
                    set({ isLoading: false, error: getErrorMessage(error) })
                }
            },

            addEntry: async (date, entry, options) => {
                if (isSupabaseAuthEnabled()) {
                    try {
                        const payload: {
                            foodItemId: string
                            foodItem: FoodItem
                            quantity: number
                            mealSlot: MealEntry['mealSlot']
                            loggedAt: string
                            notes?: string
                            imageUrl?: string
                            imageSource?: 'manual_upload' | 'ai_scan' | 'food_api'
                            isAiGenerated?: boolean
                            scanMetadata?: Record<string, unknown>
                        } = {
                            foodItemId: entry.foodItemId,
                            foodItem: entry.foodItem,
                            quantity: entry.quantity,
                            mealSlot: entry.mealSlot,
                            loggedAt: entry.loggedAt,
                        }

                        const normalizedNotes = entry.notes?.trim()
                        if (normalizedNotes) {
                            payload.notes = normalizedNotes
                        }

                        if (options?.imageUrl) {
                            payload.imageUrl = options.imageUrl
                        }

                        if (options?.imageSource) {
                            payload.imageSource = options.imageSource
                        }

                        if (typeof options?.isAiGenerated === 'boolean') {
                            payload.isAiGenerated = options.isAiGenerated
                        }

                        if (options?.scanMetadata) {
                            payload.scanMetadata = options.scanMetadata
                        }

                        await requestApi<{ entry: NutritionRow }>('/api/v1/nutrition', {
                            method: 'POST',
                            body: JSON.stringify(payload),
                        })

                        await get().fetchDayLog(date)
                        return
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                        return
                    }
                }

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

            removeEntry: async (date, entryId) => {
                if (isSupabaseAuthEnabled()) {
                    try {
                        await requestApi<{ deleted: boolean; id: string }>(`/api/v1/nutrition/${entryId}`, {
                            method: 'DELETE',
                        })
                        await get().fetchDayLog(date)
                        return
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                        return
                    }
                }

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

function mapRowToEntry(row: NutritionRow): MealEntry {
    const foodItem = row.food_item as unknown as FoodItem
    const rowWithImage = row as NutritionRow & { image_url?: string | null }

    return {
        id: row.id,
        foodItemId: row.food_item_id,
        foodItem: foodItem.imageUrl ? foodItem : { ...foodItem, imageUrl: rowWithImage.image_url || undefined },
        quantity: Number(row.quantity),
        mealSlot: row.meal_slot as MealEntry['mealSlot'],
        loggedAt: row.logged_at,
        notes: row.notes || undefined,
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }
    return 'Request failed.'
}
