'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Dumbbell, Calendar, Plus, Trash2 } from 'lucide-react'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { Exercise, WorkoutSession, ExerciseLog, SetLog } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function QuickLogModal({ exercise, isOpen, onClose }: { exercise: Exercise | null, isOpen: boolean, onClose: () => void }) {
    const saveWorkoutSession = useWorkoutStore(s => s.saveWorkoutSession)
    const createInitialSet = (): SetLog => ({
        id: `set_${Date.now()}_1`,
        setNumber: 1,
        weight: 0,
        reps: 0,
        setType: 'working',
        completed: false,
    })
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [sets, setSets] = useState<SetLog[]>(() => [createInitialSet()])
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen || !exercise) return null

    const updateSet = (setId: string, update: Partial<SetLog>) => {
        setSets(sets.map(s => s.id === setId ? { ...s, ...update } : s))
    }

    const addSet = () => {
        const last = sets[sets.length - 1]
        setSets([...sets, {
            id: `set_${Date.now()}`,
            setNumber: sets.length + 1,
            weight: last ? last.weight : 0,
            reps: last ? last.reps : 0,
            setType: 'working',
            completed: false
        }])
    }

    const removeSet = (setId: string) => {
        if (sets.length <= 1) return
        setSets(sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 })))
    }

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            const completedSets = sets.filter(s => s.completed)
            if (completedSets.length === 0) {
                toast.error("Please complete at least one set")
                setIsSaving(false)
                return
            }

            const volume = completedSets.reduce((acc, s) => acc + (s.weight * s.reps), 0)

            const exLog: ExerciseLog = {
                id: `exlog_${Date.now()}`,
                exerciseId: exercise.id,
                exercise: exercise,
                sets: sets,
                isSuperset: false
            }

            const session: WorkoutSession = {
                id: `session_qlog_${Date.now()}`,
                name: `Quick Log: ${exercise.name}`,
                date: date,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                duration: completedSets.length * 2, // fake
                exercises: [exLog],
                totalVolume: volume,
                isCompleted: true,
                isTemplate: false
            }

            saveWorkoutSession(session)
            toast.success(`Logged ${completedSets.length} sets of ${exercise.name}! (${volume}kg volume)`)
            
            setIsSaving(false)
            onClose()
            // Reset state for next open
            setSets([createInitialSet()])
        }, 600)
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-(--bg-surface) rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
                
                <div className="p-5 border-b border-(--border-subtle) flex items-center justify-between bg-(--bg-base)">
                    <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Dumbbell className="w-[20px] h-[20px]" />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-[18px] text-(--text-primary) leading-none mb-1">Quick Log</h2>
                            <p className="font-body text-[13px] text-(--text-secondary)">{exercise.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                        <X className="w-[16px] h-[16px]" />
                    </button>
                </div>

                <div className="p-5">
                    <div className="relative mb-6">
                        <Calendar className="w-[18px] h-[18px] text-(--text-tertiary) absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] pl-12 pr-4 font-body text-[15px] font-bold text-(--text-primary) focus:ring-2 focus:ring-(--accent) focus:outline-none"
                        />
                    </div>

                    <div className="bg-(--bg-base) border border-(--border-subtle) rounded-[16px] overflow-hidden">
                        <div className="grid grid-cols-[40px_1fr_1fr_48px_40px] gap-2 px-3 py-2 bg-[var(--bg-elevated)] border-b border-(--border-subtle) font-display text-[11px] font-bold text-(--text-tertiary) uppercase tracking-wider text-center items-center">
                            <div>Set</div>
                            <div>kg</div>
                            <div>Reps</div>
                            <div title="Rate of Perceived Exertion">RPE</div>
                            <div><Check className="w-[14px] h-[14px] mx-auto opacity-50" /></div>
                        </div>

                        <div className="p-2 space-y-2">
                            {sets.map((s, i) => (
                                <div key={s.id} className={cn("grid grid-cols-[40px_1fr_1fr_48px_40px] gap-2 items-center p-1 rounded-[10px] transition-colors", s.completed ? "bg-emerald-500/10" : "")}>
                                    <div className="text-center font-display font-black text-[14px] text-(--text-tertiary) flex items-center justify-center group relative cursor-pointer" onClick={() => removeSet(s.id)}>
                                        <span className="group-hover:opacity-0">{s.setNumber}</span>
                                        <Trash2 className="w-[14px] h-[14px] text-red-500 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input 
                                        type="number" value={s.weight || ''} onChange={e => updateSet(s.id, { weight: Number(e.target.value) })}
                                        className="w-full h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) text-center font-display font-bold text-[14px] rounded-[8px] focus:outline-none" placeholder="-"
                                    />
                                    <input 
                                        type="number" value={s.reps || ''} onChange={e => updateSet(s.id, { reps: Number(e.target.value) })}
                                        className="w-full h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) text-center font-display font-bold text-[14px] rounded-[8px] focus:outline-none" placeholder="-"
                                    />
                                    <input 
                                        type="number" value={s.rpe || ''} onChange={e => updateSet(s.id, { rpe: Number(e.target.value) })}
                                        className="w-full h-[36px] bg-[var(--bg-surface)] border border-transparent focus:border-(--border-subtle) text-center font-display font-bold text-[13px] rounded-[8px] focus:outline-none text-(--text-secondary)" placeholder="-"
                                    />
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={() => updateSet(s.id, { completed: !s.completed })}
                                            className={cn("w-[32px] h-[32px] rounded-[8px] border-2 flex items-center justify-center transition-colors", s.completed ? "bg-(--status-success) border-(--status-success) text-white" : "bg-(--bg-surface) border-(--border-default) text-transparent hover:border-emerald-500/50")}
                                        >
                                            <Check className="w-[16px] h-[16px] stroke-[3]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-2 border-t border-(--border-subtle) bg-[var(--bg-elevated)]">
                            <button onClick={addSet} className="w-full h-[36px] bg-(--bg-surface) hover:bg-(--bg-base) border border-(--border-default) rounded-[8px] font-body text-[13px] font-bold text-(--text-secondary) flex items-center justify-center gap-2 transition-colors">
                                <Plus className="w-[14px] h-[14px]" /> Add Set
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-(--border-subtle) bg-(--bg-base)">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full h-[50px] bg-(--accent) text-white font-display font-bold text-[15px] rounded-[14px] hover:bg-(--accent-hover) transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        {isSaving ? <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Exercise Log"}
                    </button>
                </div>

            </motion.div>
        </div>
    )
}
