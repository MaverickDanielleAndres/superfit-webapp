'use client'

import React from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealSlot } from '@/types'
import type { EditableAnalyzedFood } from '@/lib/hooks/useFoodImageAnalyzer'

interface MacroResultsProps {
  foods: EditableAnalyzedFood[]
  onFoodsChange: (foods: EditableAnalyzedFood[]) => void
  selectedMealSlot: MealSlot
  mealSlots: Array<{ id: MealSlot; label: string }>
  onMealSlotChange: (slot: MealSlot) => void
  onRetake: () => void
  onSave: () => void
  isSaving?: boolean
  imagePreview?: string | null
}

export function MacroResults({
  foods,
  onFoodsChange,
  selectedMealSlot,
  mealSlots,
  onMealSlotChange,
  onRetake,
  onSave,
  isSaving,
  imagePreview,
}: MacroResultsProps) {
  const updateFood = (id: string, patch: Partial<EditableAnalyzedFood>) => {
    onFoodsChange(foods.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[32px] p-5 pb-8 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[75vh] overflow-y-auto">
      <div className="w-[40px] h-[4px] bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" />

      {imagePreview ? (
        <div className="relative w-full h-[120px] rounded-[14px] border border-zinc-200 dark:border-zinc-700 mb-4 overflow-hidden">
          <Image src={imagePreview} alt="Meal preview" fill unoptimized sizes="100vw" className="object-cover" />
        </div>
      ) : null}

      <div className="flex items-center gap-3 mb-5">
        <div className="w-[48px] h-[48px] rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <Check className="w-[24px] h-[24px] text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-display font-black text-[22px] text-zinc-900 dark:text-white leading-tight">Detected Foods</h3>
          <p className="font-body text-[13px] text-zinc-500 dark:text-zinc-400">Review and edit values before saving.</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        {foods.map((food) => (
          <div key={food.id} className="rounded-[16px] border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-body font-bold text-[15px] text-zinc-900 dark:text-zinc-100">{food.name}</p>
                <p className="font-body text-[12px] text-zinc-500 dark:text-zinc-400">{food.portionDescription}</p>
              </div>
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold',
                  food.confidence === 'high'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : food.confidence === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100',
                )}
              >
                {food.confidence}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <NumberField
                label="Grams"
                value={food.draftGrams}
                onChange={(value) => updateFood(food.id, { draftGrams: value })}
              />
              <NumberField
                label="Calories"
                value={food.draftMacros.calories}
                onChange={(value) => updateFood(food.id, { draftMacros: { ...food.draftMacros, calories: value } })}
              />
              <NumberField
                label="Protein"
                value={food.draftMacros.protein}
                onChange={(value) => updateFood(food.id, { draftMacros: { ...food.draftMacros, protein: value } })}
              />
              <NumberField
                label="Carbs"
                value={food.draftMacros.carbs}
                onChange={(value) => updateFood(food.id, { draftMacros: { ...food.draftMacros, carbs: value } })}
              />
              <NumberField
                label="Fat"
                value={food.draftMacros.fat}
                onChange={(value) => updateFood(food.id, { draftMacros: { ...food.draftMacros, fat: value } })}
              />
              <NumberField
                label="Fiber"
                value={food.draftMacros.fiber}
                onChange={(value) => updateFood(food.id, { draftMacros: { ...food.draftMacros, fiber: value } })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="font-body text-[12px] uppercase tracking-wide font-bold text-zinc-500 dark:text-zinc-400 mb-2">Log To Meal Slot</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mealSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onMealSlotChange(slot.id)}
              className={cn(
                'h-[38px] rounded-[12px] border font-body text-[12px] font-bold transition-colors',
                selectedMealSlot === slot.id
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRetake}
          className="h-[56px] px-6 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 font-body font-bold text-[16px] text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-[0.5]"
        >
          Retake
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-[56px] px-6 rounded-[16px] bg-emerald-500 text-white font-body font-bold text-[16px] hover:bg-emerald-600 transition-colors flex-[1] shadow-[0_8px_20px_rgba(16,185,129,0.3)] disabled:opacity-70"
        >
          {isSaving ? 'Saving...' : 'Add to Diary'}
        </button>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="h-[38px] rounded-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-[13px] text-zinc-900 dark:text-zinc-100"
      />
    </label>
  )
}
