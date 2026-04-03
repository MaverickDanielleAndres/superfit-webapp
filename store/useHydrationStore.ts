import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HydrationDay, DrinkEntry } from '@/types'
import { getMockHydrationEntries } from '@/lib/mockData'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'

interface HydrationState {
    days: HydrationDay[]
    isLoading: boolean
    error: string | null

    fetchHydrationDay: (date: string) => Promise<void>
    addDrink: (date: string, entry: Omit<DrinkEntry, 'id'>) => Promise<void>
    removeDrink: (date: string, entryId: string) => Promise<void>
    getHydrationDay: (date: string) => HydrationDay | undefined
    initializeMockData: () => void
}

type HydrationRow = Database['public']['Tables']['hydration_logs']['Row']

export const useHydrationStore = create<HydrationState>()(
    persist(
        (set, get) => ({
            days: [],
            isLoading: false,
            error: null,

            fetchHydrationDay: async (date) => {
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
                    .from('hydration_logs')
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
                const totalHydrationMl = entries.reduce((acc, entry) => acc + (entry.amountMl * entry.hydrationFactor), 0)
                const totalCaffeineMg = entries.reduce((acc, entry) => acc + (entry.caffeinesMg || 0), 0)

                set((state) => {
                    const filtered = state.days.filter((d) => d.date !== date)
                    return {
                        days: [
                            ...filtered,
                            {
                                date,
                                entries,
                                goalMl: 3000,
                                totalHydrationMl,
                                totalCaffeineMg,
                            },
                        ],
                        isLoading: false,
                        error: null,
                    }
                })
            },

            addDrink: async (date, entry) => {
                if (isSupabaseAuthEnabled()) {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id

                    if (userId) {
                        const payload: Database['public']['Tables']['hydration_logs']['Insert'] = {
                            user_id: userId,
                            logged_at: entry.loggedAt,
                            amount_ml: entry.amountMl,
                            drink_type: entry.type,
                            label: entry.label,
                            hydration_factor: entry.hydrationFactor,
                            caffeine_mg: entry.caffeinesMg || 0,
                        }

                        const { error } = await supabase.from('hydration_logs').insert(payload)
                        if (error) {
                            set({ error: error.message })
                            return
                        }
                        await get().fetchHydrationDay(date)
                        return
                    }
                }

                set((state) => {
                    const existingDayIndex = state.days.findIndex(d => d.date === date)
                    const newEntry: DrinkEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) }

                    if (existingDayIndex >= 0) {
                        const updatedDays = [...state.days]
                        const day = { ...updatedDays[existingDayIndex] }
                        day.entries = [...day.entries, newEntry]
                        day.totalHydrationMl += (newEntry.amountMl * newEntry.hydrationFactor)
                        day.totalCaffeineMg += (newEntry.caffeinesMg || 0)

                        updatedDays[existingDayIndex] = day;
                        return { days: updatedDays }
                    } else {
                        return {
                            days: [...state.days, {
                                date,
                                entries: [newEntry],
                                goalMl: 3000, // This should normally come from user profile calculations
                                totalHydrationMl: newEntry.amountMl * newEntry.hydrationFactor,
                                totalCaffeineMg: newEntry.caffeinesMg || 0
                            }]
                        }
                    }
                })
            },

            removeDrink: async (date, entryId) => {
                if (isSupabaseAuthEnabled()) {
                    const supabase = createClient()
                    const { error } = await supabase.from('hydration_logs').delete().eq('id', entryId)
                    if (error) {
                        set({ error: error.message })
                        return
                    }
                    await get().fetchHydrationDay(date)
                    return
                }

                set((state) => {
                    const existingDayIndex = state.days.findIndex(d => d.date === date)
                    if (existingDayIndex >= 0) {
                        const updatedDays = [...state.days]
                        const day = { ...updatedDays[existingDayIndex] }
                        const entryToRemove = day.entries.find(e => e.id === entryId)

                        if (entryToRemove) {
                            day.entries = day.entries.filter(e => e.id !== entryId)
                            day.totalHydrationMl -= (entryToRemove.amountMl * entryToRemove.hydrationFactor)
                            day.totalCaffeineMg -= (entryToRemove.caffeinesMg || 0)
                        }

                        updatedDays[existingDayIndex] = day;
                        return { days: updatedDays }
                    }
                    return state
                })
            },

            getHydrationDay: (date) => {
                const day = get().days.find(d => d.date === date)
                if (!day) return { date, entries: [], goalMl: 3000, totalHydrationMl: 0, totalCaffeineMg: 0 }
                return day;
            },

            initializeMockData: () => {
                const today = new Date().toISOString().split('T')[0]
                const mockEntries = getMockHydrationEntries()
                const totalHydrationMl = mockEntries.reduce((acc, entry) => acc + (entry.amountMl * entry.hydrationFactor), 0)
                const totalCaffeineMg = mockEntries.reduce((acc, entry) => acc + (entry.caffeinesMg || 0), 0)

                set({
                    days: [{
                        date: today,
                        entries: mockEntries,
                        goalMl: 3000,
                        totalHydrationMl,
                        totalCaffeineMg
                    }]
                })
            }
        }),
        { name: 'superfit-hydration-storage-v2' }
    )
)

function mapRowToEntry(row: HydrationRow): DrinkEntry {
    return {
        id: row.id,
        type: row.drink_type as DrinkEntry['type'],
        label: row.label || 'Drink',
        amountMl: row.amount_ml,
        caffeinesMg: row.caffeine_mg,
        hydrationFactor: Number(row.hydration_factor || 1),
        loggedAt: row.logged_at,
    }
}
