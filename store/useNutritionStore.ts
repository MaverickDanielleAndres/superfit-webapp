import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DayLog, MealEntry, FoodItem, SavedMeal, WeeklyMealPlan } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database, Json } from '@/types/supabase'

interface NutritionState {
    dayLogs: DayLog[]
    foodDatabase: FoodItem[]
    savedMeals: SavedMeal[]
    mealPlans: WeeklyMealPlan[]
    isLoading: boolean
    error: string | null

    fetchDayLog: (date: string) => Promise<void>
    addEntry: (date: string, entry: Omit<MealEntry, 'id'>) => Promise<void>
    removeEntry: (date: string, entryId: string) => Promise<void>
    getDayLog: (date: string) => DayLog | undefined
    getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number }
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
                const supabase = createClient()
                const { data: authData } = await supabase.auth.getUser()
                const userId = authData.user?.id

                if (!userId) {
                    set({ isLoading: false, error: 'User not authenticated.' })
                    return
                }

                const from = `${date}T00:00:00.000Z`
                const to = `${date}T23:59:59.999Z`

                const { data, error } = await supabase
                    .from('nutrition_entries')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('logged_at', from)
                    .lte('logged_at', to)
                    .order('logged_at', { ascending: true })

                if (error) {
                    set({ isLoading: false, error: error.message })
                    return
                }

                const entries = (data || []).map(mapRowToEntry)
                set((state) => ({
                    dayLogs: [...state.dayLogs.filter((log) => log.date !== date), { date, entries }],
                    isLoading: false,
                    error: null,
                }))
            },

            addEntry: async (date, entry) => {
                if (isSupabaseAuthEnabled()) {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id

                    if (userId) {
                        const payload: Database['public']['Tables']['nutrition_entries']['Insert'] = {
                            user_id: userId,
                            logged_at: entry.loggedAt,
                            meal_slot: entry.mealSlot,
                            quantity: entry.quantity,
                            food_item_id: entry.foodItemId,
                            food_item: entry.foodItem as unknown as Json,
                            notes: entry.notes || null,
                        }

                        const { error } = await supabase.from('nutrition_entries').insert(payload)
                        if (error) {
                            set({ error: error.message })
                            return
                        }

                        await get().fetchDayLog(date)
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
                    const supabase = createClient()
                    const { error } = await supabase.from('nutrition_entries').delete().eq('id', entryId)
                    if (error) {
                        set({ error: error.message })
                        return
                    }
                    await get().fetchDayLog(date)
                    return
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
    return {
        id: row.id,
        foodItemId: row.food_item_id,
        foodItem: row.food_item as unknown as FoodItem,
        quantity: Number(row.quantity),
        mealSlot: row.meal_slot as MealEntry['mealSlot'],
        loggedAt: row.logged_at,
        notes: row.notes || undefined,
    }
}
