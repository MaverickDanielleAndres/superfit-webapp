'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Check, ChevronDown } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { Exercise, MuscleGroup, Equipment, MovementPattern, Difficulty } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useWorkoutStore } from '@/store/useWorkoutStore'

const MUSCLE_GROUPS: { value: MuscleGroup, label: string }[] = [
    { value: 'chest', label: 'Chest' }, { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' }, { value: 'biceps', label: 'Biceps' },
    { value: 'triceps', label: 'Triceps' }, { value: 'forearms', label: 'Forearms' },
    { value: 'quads', label: 'Quads' }, { value: 'hamstrings', label: 'Hamstrings' },
    { value: 'glutes', label: 'Glutes' }, { value: 'calves', label: 'Calves' },
    { value: 'core', label: 'Core' }, { value: 'cardio', label: 'Cardio' }
]

const EQUIPMENT_OPTIONS: { value: Equipment, label: string }[] = [
    { value: 'barbell', label: 'Barbell' }, { value: 'dumbbell', label: 'Dumbbell' },
    { value: 'cable', label: 'Cable' }, { value: 'machine', label: 'Machine' },
    { value: 'bodyweight', label: 'Bodyweight' }, { value: 'resistance_band', label: 'Resistance Band' },
    { value: 'kettlebell', label: 'Kettlebell' }
]

const MOVEMENT_TYPES: { value: MovementPattern, label: string }[] = [
    { value: 'push', label: 'Push' }, { value: 'pull', label: 'Pull' },
    { value: 'squat', label: 'Squat' }, { value: 'hinge', label: 'Hinge' },
    { value: 'carry', label: 'Carry' }, { value: 'rotation', label: 'Rotation' },
    { value: 'core', label: 'Core' }, { value: 'cardio', label: 'Cardio' }, { value: 'isolation', label: 'Isolation' }
]

type FormValues = {
    name: string;
    muscleGroups: string[];
    equipment: string[];
    movementPattern: string;
    difficulty: Difficulty;
    instructions: string;
    notes: string;
}

export default function CustomExerciseModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const addCustomExercise = useWorkoutStore(s => s.addCustomExercise)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, control, formState: { errors }, watch, setValue, setError, clearErrors } = useForm<FormValues>({
        defaultValues: {
            name: '',
            muscleGroups: [],
            equipment: [],
            movementPattern: '',
            difficulty: 'beginner',
            instructions: '',
            notes: ''
        }
    })

    const selectedMuscles = watch('muscleGroups')
    const selectedEquipment = watch('equipment')
    const selectedMovement = watch('movementPattern')
    const selectedDifficulty = watch('difficulty')

    if (!isOpen) return null

    const toggleArrayItem = (field: 'muscleGroups' | 'equipment', value: string) => {
        const current = watch(field)
        if (current.includes(value)) {
            setValue(field, current.filter(v => v !== value), { shouldValidate: true })
        } else {
            setValue(field, [...current, value], { shouldValidate: true })
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const onSubmit = (data: FormValues) => {
        // Manual Validation
        if (!data.name || data.name.length < 2) {
            setError('name', { type: 'manual', message: 'Exercise name is required' })
            return
        }
        if (!data.muscleGroups || data.muscleGroups.length === 0) {
            setError('muscleGroups', { type: 'manual', message: 'Select at least one muscle group' })
            return
        }
        if (!data.equipment || data.equipment.length === 0) {
            setError('equipment', { type: 'manual', message: 'Select at least one equipment type' })
            return
        }
        if (!data.movementPattern) {
            setError('movementPattern', { type: 'manual', message: 'Select a movement type' })
            return
        }

        setIsSubmitting(true)
        setTimeout(() => {
            const newEx: Exercise = {
                id: `custom_${Date.now()}`,
                name: data.name,
                muscleGroups: data.muscleGroups as MuscleGroup[],
                equipment: data.equipment as Equipment[],
                movementPattern: data.movementPattern as MovementPattern,
                difficulty: data.difficulty,
                instructions: data.instructions ? data.instructions.split('\n').filter(Boolean) : [],
                videoUrl: previewUrl || undefined,
                isCustom: true
            }
            addCustomExercise(newEx)
            toast.success(`Exercise created! '${newEx.name}' added to your library`)
            setIsSubmitting(false)
            onClose()
        }, 600)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-2xl bg-(--bg-surface) rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-5 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-base)">
                    <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Create Custom Exercise</h2>
                    <button onClick={onClose} className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-(--text-primary)">
                        <X className="w-[16px] h-[16px]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <form id="custom-ex-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        
                        {/* Name */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Exercise Name *</label>
                            <input 
                                {...register('name')} 
                                className={cn("w-full h-[50px] bg-[var(--bg-elevated)] rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:ring-2 border", errors.name ? "border-red-500/50 focus:ring-red-500/20" : "border-(--border-default) focus:border-(--accent) focus:ring-(--accent)/20")} 
                                placeholder="e.g. Incline Dumbbell Curl"
                            />
                            {errors.name && <p className="text-red-500 text-[12px] mt-1 font-body">{errors.name.message}</p>}
                        </div>

                        {/* Muscle Groups */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Primary Muscle Groups *</label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(m => (
                                    <button type="button" key={m.value} onClick={() => toggleArrayItem('muscleGroups', m.value)} 
                                        className={cn("px-4 py-2 rounded-full font-body text-[13px] font-semibold transition-colors border", selectedMuscles.includes(m.value) ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                            {errors.muscleGroups && <p className="text-red-500 text-[12px] mt-1 font-body">{errors.muscleGroups.message}</p>}
                        </div>

                        {/* Equipment */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Equipment *</label>
                            <div className="flex flex-wrap gap-2">
                                {EQUIPMENT_OPTIONS.map(eq => (
                                    <button type="button" key={eq.value} onClick={() => toggleArrayItem('equipment', eq.value)} 
                                        className={cn("px-4 py-2 rounded-[10px] font-body text-[13px] font-semibold transition-colors border", selectedEquipment.includes(eq.value) ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                                    >
                                        {eq.label}
                                    </button>
                                ))}
                            </div>
                            {errors.equipment && <p className="text-red-500 text-[12px] mt-1 font-body">{errors.equipment.message}</p>}
                        </div>

                        {/* Movement Type */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Movement Type *</label>
                            <div className="flex flex-wrap gap-2">
                                {MOVEMENT_TYPES.map(mt => (
                                    <button type="button" key={mt.value} onClick={() => setValue('movementPattern', mt.value, { shouldValidate: true })} 
                                        className={cn("px-4 py-2 rounded-[10px] font-body text-[13px] font-semibold transition-colors border", selectedMovement === mt.value ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                                    >
                                        {mt.label}
                                    </button>
                                ))}
                            </div>
                            {errors.movementPattern && <p className="text-red-500 text-[12px] mt-1 font-body">{errors.movementPattern.message}</p>}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Difficulty</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['beginner', 'intermediate', 'advanced'].map(diff => (
                                    <button type="button" key={diff} onClick={() => setValue('difficulty', diff as Difficulty)} 
                                        className={cn("h-[60px] rounded-[12px] font-body text-[14px] font-bold transition-all border-2 flex items-center justify-center capitalize", selectedDifficulty === diff ? "bg-emerald-500/5 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:border-(--border-subtle)")}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Instructions</label>
                            <textarea 
                                {...register('instructions')} 
                                className="w-full h-[100px] bg-[var(--bg-elevated)] rounded-[12px] p-4 font-body text-[15px] focus:outline-none focus:ring-2 border border-(--border-default) focus:border-(--accent) focus:ring-(--accent)/20 resize-none" 
                                placeholder="Step by step how to perform this exercise. Put each step on a new line."
                            />
                        </div>

                        {/* Image/GIF Upload Placeholder */}
                        <div>
                            <label className="block font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-2">Cover Image / GIF</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-[120px] rounded-[16px] border-2 border-dashed border-(--border-default) bg-[var(--bg-elevated)] flex flex-col items-center justify-center cursor-pointer hover:border-(--accent) hover:bg-emerald-500/5 transition-colors overflow-hidden relative"
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Upload className="w-[24px] h-[24px] text-(--text-tertiary) mb-2" />
                                        <span className="font-body text-[14px] text-(--text-secondary) font-bold">Tap to upload image/gif</span>
                                    </>
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>

                    </form>
                </div>

                <div className="p-5 border-t border-(--border-subtle) shrink-0 bg-(--bg-base) flex items-center gap-3">
                    <button type="button" onClick={onClose} className="flex-1 h-[50px] rounded-[12px] bg-[var(--bg-elevated)] font-body text-[15px] font-bold text-(--text-primary) hover:bg-[var(--bg-surface-alt)] transition-colors">
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="custom-ex-form"
                        disabled={isSubmitting}
                        className="flex-[2] h-[50px] rounded-[12px] bg-(--accent) text-white font-body text-[15px] font-bold hover:bg-(--accent-hover) transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Save Exercise"
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
