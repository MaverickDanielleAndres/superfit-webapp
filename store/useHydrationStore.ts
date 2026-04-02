import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HydrationDay, DrinkEntry } from '@/types'
import { getMockHydrationEntries } from '@/lib/mockData'

interface HydrationState {
    days: HydrationDay[]

    addDrink: (date: string, entry: Omit<DrinkEntry, 'id'>) => void
    removeDrink: (date: string, entryId: string) => void
    getHydrationDay: (date: string) => HydrationDay | undefined
    initializeMockData: () => void
}

export const useHydrationStore = create<HydrationState>()(
    persist(
        (set, get) => ({
            days: [],

            addDrink: (date, entry) => {
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

            removeDrink: (date, entryId) => {
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
