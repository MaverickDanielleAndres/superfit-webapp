import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HydrationDay, DrinkEntry } from '@/types'
import { getMockHydrationEntries } from '@/lib/mockData'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'
import { requestApi } from '@/lib/api/client'

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

                try {
                    const response = await requestApi<{ date: string; entries: HydrationRow[] }>(`/api/v1/hydration?date=${date}`)
                    const entries = response.data.entries.map(mapRowToEntry)
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
                } catch (error) {
                    set({ isLoading: false, error: getErrorMessage(error) })
                }
            },

            addDrink: async (date, entry) => {
                if (isSupabaseAuthEnabled()) {
                    try {
                        await requestApi<{ entry: HydrationRow }>('/api/v1/hydration', {
                            method: 'POST',
                            body: JSON.stringify({
                                type: entry.type,
                                label: entry.label,
                                amountMl: entry.amountMl,
                                hydrationFactor: entry.hydrationFactor,
                                caffeinesMg: entry.caffeinesMg || 0,
                                loggedAt: entry.loggedAt,
                            }),
                        })
                        await get().fetchHydrationDay(date)
                        return
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
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
                    try {
                        await requestApi<{ deleted: boolean; id: string }>(`/api/v1/hydration/${entryId}`, {
                            method: 'DELETE',
                        })
                        await get().fetchHydrationDay(date)
                        return
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                        return
                    }
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

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }
    return 'Request failed.'
}
