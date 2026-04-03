'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Plus, Check, Timer, History, MoreHorizontal, ChevronDown, X, Trash2, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { Exercise } from '@/types'
import CreateWorkoutSheet from '@/components/workout/CreateWorkoutSheet'
import ExercisePickerDrawer from '@/components/workout/ExercisePickerDrawer'
import RestTimerPill from '@/components/workout/RestTimerPill'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

export default function WorkoutPage() {
    const { activeSession, startSession, endSession, logSet, addExerciseToSession, addSetToExercise, removeSetFromExercise, removeExerciseFromSession, fetchSessions } = useWorkoutStore()
    const isSimulationMode = !isSupabaseAuthEnabled()
    const [sessionTimer, setSessionTimer] = useState(0)
    const [showExerciseModal, setShowExerciseModal] = useState(false)
    const [showCreateSheet, setShowCreateSheet] = useState(false)

    useEffect(() => {
        void fetchSessions()
    }, [fetchSessions])

    // Timer effect for active session
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeSession) {
            interval = setInterval(() => {
                const diff = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
                setSessionTimer(diff)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [activeSession])

    const formatTimer = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // If no active session, show the Start / Template screen
    if (!activeSession) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto flex flex-col items-center justify-center pt-24 text-center">
                <div className="w-[80px] h-[80px] rounded-full bg-(--accent-bg-strong) flex items-center justify-center mb-6">
                    <Play className="w-[32px] h-[32px] text-(--accent) ml-1" />
                </div>
                <h1 className="font-display font-bold text-[32px] text-(--text-primary) mb-2">Ready to lift?</h1>
                <p className="font-body text-[15px] text-(--text-secondary) max-w-[320px] mx-auto mb-8">
                    Start an empty workout or choose from your saved routines to begin tracking.
                </p>
                {isSimulationMode && (
                    <span className="mb-6 inline-flex items-center rounded-[8px] bg-amber-500/10 px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-amber-500">
                        Simulation Mode
                    </span>
                )}

                <div className="flex flex-col w-full max-w-[320px] gap-3">
                    <button
                        onClick={() => startSession()}
                        className="w-full h-[56px] rounded-[16px] bg-(--accent) hover:bg-(--accent-hover) text-white font-display font-bold text-[16px] transition-colors"
                    >
                        Start Active Session
                    </button>

                    <button
                        onClick={() => setShowCreateSheet(true)}
                        className="w-full h-[56px] rounded-[16px] bg-[var(--bg-surface)] border-2 border-dashed border-(--border-default) hover:border-(--accent) text-(--text-secondary) hover:text-(--accent) hover:bg-emerald-500/5 font-display font-bold text-[16px] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-[18px] h-[18px]" />
                        Log Workout Manually
                    </button>

                    <div className="relative mt-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-(--border-subtle)"></div></div>
                        <div className="relative flex justify-center"><span className="bg-(--bg-base) px-4 text-(--text-tertiary) text-[12px] uppercase font-bold tracking-wider">or templates</span></div>
                    </div>

                    <button
                        onClick={() => startSession('1')}
                        className="w-full h-[56px] rounded-[16px] bg-(--bg-surface) border border-(--border-default) hover:border-(--border-subtle) hover:bg-[var(--bg-elevated)] text-(--text-primary) font-body font-semibold text-[15px] transition-colors cursor-pointer"
                    >
                        Legs & Core (Hypertrophy)
                    </button>
                    <button
                        onClick={() => startSession('2')}
                        className="w-full h-[56px] rounded-[16px] bg-(--bg-surface) border border-(--border-default) hover:border-(--border-subtle) hover:bg-[var(--bg-elevated)] text-(--text-primary) font-body font-semibold text-[15px] transition-colors cursor-pointer"
                    >
                        Upper Body Power
                    </button>
                </div>
                <CreateWorkoutSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} />
            </motion.div>
        )
    }

    // Active Session View
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto h-full flex flex-col gap-6 pb-24">

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-(--bg-base) pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <input
                            type="text"
                            defaultValue={activeSession.name}
                            className="font-display font-bold text-[20px] text-(--text-primary) bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-(--accent) rounded px-1 -ml-1 w-full max-w-[200px]"
                        />
                        <div className="flex items-center gap-2 text-(--accent) mt-1">
                            <Timer className="w-[14px] h-[14px]" />
                            <span className="font-display font-bold text-[16px] tabular-nums tracking-wider">{formatTimer(sessionTimer)}</span>
                        </div>
                        {isSimulationMode && (
                            <span className="mt-2 inline-flex items-center rounded-[8px] bg-amber-500/10 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                Simulation Mode
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => endSession()}
                        className="h-[40px] px-6 rounded-[12px] bg-(--status-success) bg-opacity-10 text-(--status-success) font-display font-bold text-[14px] hover:bg-opacity-20 transition-all cursor-pointer flex items-center gap-2"
                    >
                        <Square className="w-[14px] h-[14px] fill-current" /> Finish
                    </button>
                </div>
            </div>

            {/* Exercises List */}
            <div className="flex flex-col gap-6">
                {activeSession.exercises.map((exLog, exIdx) => (
                    <div key={exLog.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden">
                        {/* Exercise Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {exLog.exercise.videoUrl ? (
                                    <img src={exLog.exercise.videoUrl} alt={exLog.exercise.name} className="w-[40px] h-[40px] rounded-[10px] object-cover" />
                                ) : (
                                    <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--bg-elevated)] flex items-center justify-center">
                                        <Dumbbell className="w-[20px] h-[20px] text-(--text-tertiary)" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) leading-none mb-1">{exLog.exercise.name}</h3>
                                    <span className="font-body text-[13px] text-(--text-secondary) capitalize">{exLog.exercise.muscleGroups.join(', ')} • {exLog.exercise.equipment.join(', ')}</span>
                                </div>
                            </div>
                            <button onClick={() => removeExerciseFromSession(exLog.exerciseId)} className="w-[32px] h-[32px] rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors text-(--text-tertiary)">
                                <Trash2 className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        {/* Sets Header */}
                        {exLog.sets.length > 0 && (
                            <div className="grid grid-cols-[40px_1fr_80px_80px_48px] gap-2 px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wider text-(--text-tertiary) text-center items-center">
                                <div>Set</div>
                                <div className="text-left pl-2">Previous</div>
                                <div>kg</div>
                                <div>Reps</div>
                                <div><Check className="w-[14px] h-[14px] mx-auto opacity-50" /></div>
                            </div>
                        )}

                        {/* Sets Rows */}
                        {exLog.sets.map((setInfo, setIdx) => (
                            <div key={setInfo.id} className={cn("grid grid-cols-[40px_1fr_80px_80px_48px] gap-2 px-4 py-2 items-center", setIdx % 2 === 0 ? "bg-[var(--bg-elevated)]" : "")}>
                                <div className="text-center font-display font-bold text-[14px] text-(--text-secondary) cursor-pointer" onDoubleClick={() => removeSetFromExercise(exLog.exerciseId, setIdx)}>
                                    {setInfo.setType === 'warmup' ? 'W' : setInfo.setNumber}
                                </div>
                                <div className="text-left pl-2 font-body text-[13px] text-(--text-tertiary) truncate">
                                    -
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        value={setInfo.weight || ''}
                                        onChange={(e) => logSet(exLog.exerciseId, setIdx, { weight: Number(e.target.value) })}
                                        className="w-full h-[36px] bg-[var(--bg-surface-alt)] rounded-[8px] border border-transparent text-center font-display font-bold text-[16px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        value={setInfo.reps || ''}
                                        onChange={(e) => logSet(exLog.exerciseId, setIdx, { reps: Number(e.target.value) })}
                                        className="w-full h-[36px] bg-[var(--bg-surface-alt)] rounded-[8px] border border-transparent text-center font-display font-bold text-[16px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => logSet(exLog.exerciseId, setIdx, { completed: !setInfo.completed })}
                                        className={cn("w-[32px] h-[32px] rounded-[8px] border-2 flex items-center justify-center transition-colors shadow-sm", setInfo.completed ? "bg-(--status-success) border-(--status-success) text-white" : "bg-(--bg-surface) border-(--border-default) text-transparent hover:border-(--status-success) hover:bg-emerald-500/5")}
                                    >
                                        <Check className="w-[16px] h-[16px] stroke-[3]" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button onClick={() => addSetToExercise(exLog.exerciseId)} className="w-full p-3 font-body font-semibold text-[13px] text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors flex items-center justify-center gap-1 border-t border-(--border-subtle)">
                            <Plus className="w-[16px] h-[16px]" /> Add Set
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Exercise Floating Button Area */}
            <div className="mt-4 pb-8">
                <button onClick={() => setShowExerciseModal(true)} className="w-full h-[56px] rounded-[16px] bg-[var(--bg-elevated)] border-2 border-dashed border-(--border-default) text-(--text-secondary) font-display font-bold text-[15px] flex items-center justify-center gap-2 hover:border-(--accent) hover:text-(--accent) hover:bg-emerald-500/5 transition-all cursor-pointer">
                    <Plus className="w-[18px] h-[18px]" /> Add Exercise
                </button>
            </div>

            <ExercisePickerDrawer 
                isOpen={showExerciseModal} 
                onClose={() => setShowExerciseModal(false)} 
                onSelect={(ex) => addExerciseToSession(ex)} 
            />

            <RestTimerPill />

        </motion.div>
    )
}
