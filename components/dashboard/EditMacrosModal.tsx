'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Activity, Target, Weight, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store/useUserStore'
import { FitnessGoal, ActivityLevel } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { calculateBMR, calculateTDEE, calculateProteinTarget } from '@/lib/calculations'

type FormValues = {
    currentWeight: number;
    goal: string;
    activityLevel: string;
}

export default function EditMacrosModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { user, updateUser, recalculateTargets } = useUserStore()

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            currentWeight: user?.currentWeight || 70,
            goal: user?.goal || 'maintenance',
            activityLevel: user?.activityLevel || 'moderate'
        }
    })

    // Reset values when user changes or modal opens
    useEffect(() => {
        if (user && isOpen) {
            setValue('currentWeight', user.currentWeight)
            setValue('goal', user.goal)
            setValue('activityLevel', user.activityLevel)
        }
    }, [user, isOpen, setValue])

    const wWeight = watch('currentWeight')
    const wGoal = watch('goal')
    const wActivity = watch('activityLevel')

    // Live preview calculations
    const previewCalculations = () => {
        if (!user || !wWeight) return null
        const bmr = calculateBMR(wWeight, user.height, user.age, user.sex)
        const tdee = calculateTDEE(bmr, wActivity as ActivityLevel)
        const deficitSurplus = wGoal === 'weight_loss' ? -500 : wGoal === 'muscle_gain' ? 300 : 0
        const calories = Math.max(1200, Math.round(tdee + deficitSurplus))
        const protein = Math.round(calculateProteinTarget(wWeight, wGoal as FitnessGoal, wActivity as ActivityLevel))
        const fat = Math.round((calories * 0.28) / 9)
        const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4)

        return { calories, protein, carbs, fat }
    }

    const preview = previewCalculations()

    if (!isOpen || !user) return null

    const onSubmit = (data: FormValues) => {
        updateUser({
            currentWeight: data.currentWeight,
            goal: data.goal as FitnessGoal,
            activityLevel: data.activityLevel as ActivityLevel
        })
        recalculateTargets()
        toast.success("Macro targets successfully recalculated and updated!")
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md bg-(--bg-surface) rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
                
                <div className="p-5 border-b border-(--border-subtle) flex items-center justify-between bg-(--bg-base)">
                    <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Target className="w-[20px] h-[20px]" />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-[18px] text-(--text-primary) leading-none mb-1">Edit Macros</h2>
                            <p className="font-body text-[13px] text-(--text-secondary)">Recalculate your daily targets</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                        <X className="w-[16px] h-[16px]" />
                    </button>
                </div>

                <div className="p-6">
                    <form id="macro-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* Current Weight */}
                        <div>
                            <label className="flex items-center gap-2 font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">
                                <Weight className="w-[14px] h-[14px]" /> Current Weight (kg)
                            </label>
                            <input 
                                type="number" 
                                step="0.1"
                                {...register('currentWeight', { valueAsNumber: true })}
                                className="w-full h-[50px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) text-(--text-primary) font-body text-[15px] font-bold rounded-[12px] px-4 transition-all outline-none"
                            />
                            {errors.currentWeight && <span className="text-red-500 text-[12px] mt-1 block">{errors.currentWeight.message}</span>}
                        </div>

                        {/* Goal */}
                        <div>
                            <label className="flex items-center gap-2 font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">
                                <Target className="w-[14px] h-[14px]" /> Fitness Goal
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['weight_loss', 'maintenance', 'muscle_gain', 'recomposition'].map(g => (
                                    <button 
                                        key={g} type="button" 
                                        onClick={() => setValue('goal', g as any)}
                                        className={cn("h-[44px] rounded-[10px] font-body text-[13px] font-bold capitalize transition-colors border", wGoal === g ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                                    >
                                        {g.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity Level */}
                        <div>
                            <label className="flex items-center gap-2 font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">
                                <Activity className="w-[14px] h-[14px]" /> Activity Level
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['sedentary', 'light', 'moderate', 'very_active'].map(a => (
                                    <button 
                                        key={a} type="button" 
                                        onClick={() => setValue('activityLevel', a as any)}
                                        className={cn("h-[44px] rounded-[10px] font-body text-[13px] font-bold capitalize transition-colors border", wActivity === a ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                                    >
                                        {a.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {preview && (
                            <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[16px] p-4 mt-6">
                                <h4 className="font-body text-[12px] font-bold text-(--text-tertiary) uppercase tracking-wider mb-3 text-center">Calculated Targets</h4>
                                <div className="flex justify-between items-end mb-4">
                                    <div className="flex flex-col">
                                        <span className="font-display font-black text-[24px] text-(--accent) leading-none">{preview.calories}</span>
                                        <span className="font-body text-[12px] text-(--text-secondary)">kcal</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className="font-display font-bold text-[16px] text-(--text-primary) leading-none">{preview.protein}g</span>
                                            <span className="font-body text-[11px] text-(--text-secondary) uppercase">Pro</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-display font-bold text-[16px] text-(--text-primary) leading-none">{preview.carbs}g</span>
                                            <span className="font-body text-[11px] text-(--text-secondary) uppercase">Carb</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-display font-bold text-[16px] text-(--text-primary) leading-none">{preview.fat}g</span>
                                            <span className="font-body text-[11px] text-(--text-secondary) uppercase">Fat</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </form>
                </div>

                <div className="p-5 border-t border-(--border-subtle) bg-(--bg-base)">
                    <button 
                        type="submit" form="macro-form"
                        className="w-full h-[50px] bg-(--accent) text-white font-display font-bold text-[15px] rounded-[14px] hover:bg-(--accent-hover) transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Check className="w-[18px] h-[18px]" /> Save & Recalculate
                    </button>
                </div>

            </motion.div>
        </div>
    )
}
