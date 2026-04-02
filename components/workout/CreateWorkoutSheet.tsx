'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Calendar, AlignLeft, Check, Trash2, Dumbbell, ArrowUp, ArrowDown } from 'lucide-react'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { WorkoutSession, Exercise, ExerciseLog, SetLog } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ExercisePickerDrawer from './ExercisePickerDrawer'

export default function CreateWorkoutSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const saveWorkoutSession = useWorkoutStore(s => s.saveWorkoutSession)
    
    const [name, setName] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')
    const [exercises, setExercises] = useState<ExerciseLog[]>([])
    
    const [showPicker, setShowPicker] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Derived stats
    const totalVolume = useMemo(() => {
        let vol = 0
        exercises.forEach(ex => {
            ex.sets.forEach(s => {
                if (s.completed && s.weight && s.reps) vol += (s.weight * s.reps)
            })
        })
        return vol
    }, [exercises])

    const totalSets = useMemo(() => exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0), [exercises])
    const estimatedDuration = totalSets * 3 // Roughly 3 mins per completed set

    if (!isOpen) return null

    const handleAddExercise = (selectedEx: Exercise) => {
        const newExLog: ExerciseLog = {
            id: `exlog_${Date.now()}`,
            exerciseId: selectedEx.id,
            exercise: selectedEx,
            sets: [
                {
                    id: `set_${Date.now()}_1`,
                    setNumber: 1,
                    weight: 0,
                    reps: 0,
                    setType: 'working',
                    completed: false
                }
            ],
            isSuperset: false
        }
        setExercises([...exercises, newExLog])
    }

    const removeExercise = (id: string) => {
        setExercises(exercises.filter(ex => ex.id !== id))
    }

    const moveExercise = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === exercises.length - 1) return
        const newArr = [...exercises]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        ;[newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]]
        setExercises(newArr)
    }

    const updateSet = (exId: string, setId: string, update: Partial<SetLog>) => {
        setExercises(exercises.map(ex => {
            if (ex.id !== exId) return ex
            return {
                ...ex,
                sets: ex.sets.map(s => s.id === setId ? { ...s, ...update } : s)
            }
        }))
    }

    const addSet = (exId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id !== exId) return ex
            const lastSet = ex.sets[ex.sets.length - 1]
            return {
                ...ex,
                sets: [...ex.sets, {
                    id: `set_${Date.now()}`,
                    setNumber: ex.sets.length + 1,
                    weight: lastSet ? lastSet.weight : 0,
                    reps: lastSet ? lastSet.reps : 0,
                    rpe: lastSet ? lastSet.rpe : undefined,
                    setType: 'working',
                    completed: false
                }]
            }
        }))
    }

    const removeLastSet = (exId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id !== exId) return ex
            if (ex.sets.length <= 1) return ex
            const newSets = ex.sets.slice(0, -1)
            return { ...ex, sets: newSets }
        }))
    }

    const handleSave = () => {
        if (!name.trim()) return toast.error("Please enter a workout name")
        if (exercises.length === 0) return toast.error("Please add at least one exercise")

        setIsSaving(true)
        setTimeout(() => {
            const newSession: WorkoutSession = {
                id: `session_${Date.now()}`,
                name: name.trim(),
                date: date,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(), // Since it's a manual log, start=end roughly
                duration: estimatedDuration,
                exercises: exercises,
                totalVolume: totalVolume,
                notes: notes,
                isCompleted: true,
                isTemplate: false
            }

            saveWorkoutSession(newSession)
            toast.success(`Workout saved! 🏋️ ${name} — ${exercises.length} exercises, ${totalVolume}kg total volume`)
            setIsSaving(false)
            onClose()
        }, 600)
    }

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-(--bg-base) sm:items-center sm:justify-end sm:bg-black/40 sm:p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-(--bg-base) sm:rounded-[24px] flex flex-col shadow-2xl relative overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-surface)">
                    <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Create New Workout</h2>
                    <button onClick={onClose} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                        <X className="w-[16px] h-[16px]" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    
                    {/* Top Forms */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <input 
                                type="text" 
                                placeholder="e.g. Push Day, Leg Day, HIIT Session" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full h-[52px] bg-[var(--bg-surface)] border border-(--border-default) rounded-[16px] px-4 font-display font-bold text-[18px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <Calendar className="w-[18px] h-[18px] text-(--text-tertiary) absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full h-[48px] bg-[var(--bg-elevated)] border-none rounded-[12px] pl-12 pr-4 font-body text-[15px] font-bold text-(--text-secondary) focus:ring-2 focus:ring-(--accent) focus:outline-none"
                                />
                            </div>

                            <div className="relative">
                                <AlignLeft className="w-[18px] h-[18px] text-(--text-tertiary) absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    placeholder="Add notes... (optional)" 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full h-[48px] bg-[var(--bg-elevated)] border-none rounded-[12px] pl-12 pr-4 font-body text-[14px] text-(--text-secondary) focus:ring-2 focus:ring-(--accent) focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-6">
                        {exercises.map((exLog, index) => (
                            <div key={exLog.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] overflow-hidden group">
                                
                                {/* Exercise Header */}
                                <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) flex justify-center items-center">
                                            <Dumbbell className="w-[20px] h-[20px] text-(--text-tertiary)" />
                                        </div>
                                        <div>
                                            <h3 className="font-display font-bold text-[16px] text-(--text-primary) leading-none mb-1">{exLog.exercise.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-[8px] h-[8px] rounded-full bg-emerald-500" />
                                                <span className="font-body text-[12px] text-(--text-secondary) capitalize">{exLog.exercise.muscleGroups.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button disabled={index === 0} onClick={() => moveExercise(index, 'up')} className="w-[32px] h-[32px] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] rounded-md disabled:opacity-30"><ArrowUp className="w-[16px] h-[16px]" /></button>
                                        <button disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 'down')} className="w-[32px] h-[32px] flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] rounded-md disabled:opacity-30"><ArrowDown className="w-[16px] h-[16px]" /></button>
                                        <span className="w-[1px] h-[16px] bg-(--border-subtle) mx-1" />
                                        <button onClick={() => removeExercise(exLog.id)} className="w-[32px] h-[32px] flex items-center justify-center text-(--text-tertiary) hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-[16px] h-[16px]" /></button>
                                    </div>
                                </div>

                                {/* Sets Info */}
                                <div className="p-1">
                                    <div className="grid grid-cols-[30px_1fr_1fr_50px_40px] gap-2 px-3 py-2 font-display text-[11px] font-bold text-(--text-tertiary) uppercase tracking-wider text-center items-center">
                                        <div>Set</div>
                                        <div>kg</div>
                                        <div>Reps</div>
                                        <div>RPE</div>
                                        <div><Check className="w-[14px] h-[14px] mx-auto opacity-50" /></div>
                                    </div>

                                    {exLog.sets.map((setInfo, setIndex) => (
                                        <div key={setInfo.id} className={cn("grid grid-cols-[30px_1fr_1fr_50px_40px] gap-2 px-3 py-1.5 items-center rounded-[8px] transition-colors", setInfo.completed ? "bg-emerald-500/5" : "")}>
                                            <div className="text-center font-display font-black text-[14px] text-(--text-tertiary)">
                                                {setInfo.setNumber}
                                            </div>
                                            <div>
                                                <input 
                                                    type="number" 
                                                    value={setInfo.weight || ''} 
                                                    onChange={e => updateSet(exLog.id, setInfo.id, { weight: Number(e.target.value) })}
                                                    className="w-full h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:bg-[var(--bg-surface)] text-center font-display font-bold text-[15px] rounded-[8px] focus:outline-none"
                                                    placeholder="-"
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    type="number" 
                                                    value={setInfo.reps || ''} 
                                                    onChange={e => updateSet(exLog.id, setInfo.id, { reps: Number(e.target.value) })}
                                                    className="w-full h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:bg-[var(--bg-surface)] text-center font-display font-bold text-[15px] rounded-[8px] focus:outline-none"
                                                    placeholder="-"
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    type="number" 
                                                    value={setInfo.rpe || ''} 
                                                    onChange={e => updateSet(exLog.id, setInfo.id, { rpe: Number(e.target.value) })}
                                                    className="w-full h-[36px] bg-[var(--bg-elevated)] border border-transparent focus:border-(--border-subtle) focus:bg-[var(--bg-surface)] text-center font-display font-bold text-[13px] rounded-[8px] focus:outline-none text-(--text-secondary)"
                                                    placeholder="-"
                                                />
                                            </div>
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => updateSet(exLog.id, setInfo.id, { completed: !setInfo.completed })}
                                                    className={cn("w-[32px] h-[32px] rounded-[8px] shadow-sm border-2 flex items-center justify-center transition-all", setInfo.completed ? "bg-(--status-success) border-(--status-success) text-white" : "bg-(--bg-surface) border-(--border-default) hover:border-emerald-500/40 hover:bg-emerald-500/5 text-transparent")}
                                                >
                                                    <Check className="w-[16px] h-[16px] stroke-[3]" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-1 p-2 pt-1 border-(--border-subtle) mt-1">
                                        <button onClick={() => addSet(exLog.id)} className="h-[32px] px-3 font-body font-bold text-[12px] bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-surface-alt)] rounded-[6px] transition-colors">+ Add Set</button>
                                        <button onClick={() => removeLastSet(exLog.id)} className="h-[32px] px-3 font-body font-bold text-[12px] bg-transparent text-(--text-tertiary) hover:text-red-500 rounded-[6px] transition-colors">Remove Set</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={() => setShowPicker(true)}
                            className="w-full h-[64px] border-2 border-dashed border-(--border-default) rounded-[20px] bg-[var(--bg-elevated)] hover:border-(--accent) hover:bg-emerald-500/5 transition-all flex items-center justify-center font-display font-bold text-[16px] text-(--accent) gap-2"
                        >
                            <Plus className="w-[18px] h-[18px]" /> Add Exercise
                        </button>
                    </div>

                </div>

                {/* Footer fixed at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-(--bg-base) border-t border-(--border-subtle) p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-body text-[12px] font-bold text-(--text-tertiary) uppercase tracking-wider">Summary</span>
                        <div className="flex items-center gap-2 font-display font-bold text-[14px]">
                            <span className="text-(--text-secondary)">{exercises.length} Ex</span>
                            <span className="text-(--border-subtle)">•</span>
                            <span className="text-(--text-secondary)">~{estimatedDuration}m</span>
                            <span className="text-(--border-subtle)">•</span>
                            <span className="text-(--accent)">{totalVolume.toLocaleString()} kg</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 h-[44px] rounded-[12px] font-display font-bold text-[15px] text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors">Cancel</button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="px-6 h-[44px] rounded-[12px] bg-(--accent) text-white font-display font-bold text-[15px] hover:bg-(--accent-hover) transition-colors flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isSaving ? <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Workout"}
                        </button>
                    </div>
                </div>

                <ExercisePickerDrawer isOpen={showPicker} onClose={() => setShowPicker(false)} onSelect={handleAddExercise} />
            </motion.div>
        </div>
    )
}
