import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { requestApi } from '@/lib/api/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

type CalculatorType = 'bmi' | 'protein' | 'creatine' | 'deficit' | 'water'

interface CalculatorDraft {
  calculatorType: CalculatorType
  wizardStep: number
  responses: Record<string, unknown>
  result: Record<string, unknown> | null
  updatedAt?: string
}

interface CalculatorState {
  drafts: Partial<Record<CalculatorType, CalculatorDraft>>
  isLoading: boolean
  error: string | null

  hydrateDrafts: (type?: CalculatorType) => Promise<void>
  saveDraft: (draft: CalculatorDraft) => Promise<void>
  resetDraft: (type: CalculatorType) => Promise<void>
  getDraft: (type: CalculatorType) => CalculatorDraft | undefined
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      drafts: {},
      isLoading: false,
      error: null,

      hydrateDrafts: async (type) => {
        if (!isSupabaseAuthEnabled()) return

        set({ isLoading: true, error: null })

        try {
          const query = type ? `?type=${type}` : ''
          const response = await requestApi<{
            responses: Array<{
              calculatorType: CalculatorType
              wizardStep: number
              responses: Record<string, unknown>
              result: Record<string, unknown> | null
              updatedAt: string
            }>
          }>(`/api/v1/calculators/responses${query}`)

          const nextDrafts: Partial<Record<CalculatorType, CalculatorDraft>> = { ...get().drafts }
          for (const item of response.data.responses || []) {
            nextDrafts[item.calculatorType] = {
              calculatorType: item.calculatorType,
              wizardStep: item.wizardStep,
              responses: item.responses || {},
              result: item.result || null,
              updatedAt: item.updatedAt,
            }
          }

          set({ drafts: nextDrafts, isLoading: false, error: null })
        } catch (error) {
          set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to hydrate calculator drafts.' })
        }
      },

      saveDraft: async (draft) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [draft.calculatorType]: {
              ...draft,
              updatedAt: new Date().toISOString(),
            },
          },
        }))

        if (!isSupabaseAuthEnabled()) return

        try {
          await requestApi('/api/v1/calculators/responses', {
            method: 'POST',
            body: JSON.stringify({
              calculatorType: draft.calculatorType,
              wizardStep: draft.wizardStep,
              responses: draft.responses,
              result: draft.result,
            }),
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unable to save calculator draft.' })
        }
      },

      resetDraft: async (type) => {
        set((state) => {
          const nextDrafts = { ...state.drafts }
          delete nextDrafts[type]
          return { drafts: nextDrafts }
        })

        if (!isSupabaseAuthEnabled()) return

        try {
          await requestApi(`/api/v1/calculators/responses?type=${type}`, {
            method: 'DELETE',
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unable to reset calculator draft.' })
        }
      },

      getDraft: (type) => get().drafts[type],
    }),
    { name: 'superfit-calculator-storage-v1' },
  ),
)
