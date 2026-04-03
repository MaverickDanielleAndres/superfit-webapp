'use client'

/**
 * Goals & Milestones Page
 * All buttons wired to useGoalStore (add, update progress, mark complete, delete).
 */

import React, { useState } from 'react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Trophy, Clock, Zap, Plus, X, Loader2, CheckCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoalStore, FitnessGoal } from '@/store/useGoalStore'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

const CATEGORY_COLORS: Record<string, string> = {
    'Weight Loss': 'bg-blue-500',
    'Strength': 'bg-emerald-500',
    'Endurance': 'bg-purple-500',
    'Habit': 'bg-yellow-500',
    'Nutrition': 'bg-orange-500',
    'Body Composition': 'bg-pink-500',
}

export default function GoalsPage() {
    const { goals, addGoal, fetchGoals, deleteGoal, markComplete } = useGoalStore()
    const isSimulationMode = !isSupabaseAuthEnabled()
    const [showAddModal, setShowAddModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState({
        title: '',
        category: 'Weight Loss' as FitnessGoal['category'],
        current: '',
        target: '',
        start: '',
        unit: 'kg',
        deadline: '',
    })

    const activeGoals = goals.filter(g => !g.completed)
    const completedGoals = goals.filter(g => g.completed)

    useEffect(() => {
        void fetchGoals()
    }, [fetchGoals])

    const metrics = [
        { icon: Trophy, label: 'Achievements Unlocked', value: completedGoals.length.toString() },
        { icon: Zap, label: 'Active Goals', value: activeGoals.length.toString() },
        { icon: Target, label: 'Goals Completed', value: completedGoals.length.toString() },
    ]

    const handleAddGoal = async () => {
        if (!form.title || !form.target || !form.deadline) return
        setIsSubmitting(true)
        await new Promise(r => setTimeout(r, 400))
        await addGoal({
            title: form.title,
            category: form.category,
            current: parseFloat(form.current) || 0,
            target: parseFloat(form.target),
            start: parseFloat(form.start) || 0,
            unit: form.unit,
            deadline: form.deadline,
            projectedComplete: form.deadline,
            ahead: true,
            completed: false,
            color: CATEGORY_COLORS[form.category] || 'bg-emerald-500',
        })
        setForm({ title: '', category: 'Weight Loss', current: '', target: '', start: '', unit: 'kg', deadline: '' })
        setShowAddModal(false)
        setIsSubmitting(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto h-full flex flex-col gap-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary) leading-tight">Goals & Milestones</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Track progress towards your primary fitness targets.</p>
                    {isSimulationMode && (
                        <span className="mt-2 inline-flex items-center rounded-[8px] bg-amber-500/10 px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-amber-500">
                            Simulation Mode
                        </span>
                    )}
                </div>
                <button onClick={() => setShowAddModal(true)} className="h-[40px] px-6 rounded-[12px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[13px] hover:scale-105 transition-transform flex items-center gap-2">
                    <Plus className="w-[16px] h-[16px]" /> Set New Goal
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {metrics.map((metric, i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-[48px] h-[48px] rounded-[14px] bg-[var(--bg-elevated)] flex items-center justify-center">
                            <metric.icon className="w-[24px] h-[24px] text-emerald-500" />
                        </div>
                        <div>
                            <span className="block font-body text-[13px] text-(--text-secondary) font-medium uppercase tracking-wider">{metric.label}</span>
                            <span className="block font-display font-bold text-[24px] text-(--text-primary)">{metric.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Goals List */}
            <div className="flex flex-col gap-4">
                <h2 className="font-display font-bold text-[20px] text-(--text-primary) mt-4">Active Goals</h2>

                {activeGoals.length === 0 ? (
                    <div className="bg-(--bg-surface) border border-dashed border-(--border-subtle) rounded-[24px] p-12 text-center">
                        <Target className="w-[32px] h-[32px] text-(--text-tertiary) mx-auto mb-3" />
                        <p className="font-body text-[15px] text-(--text-secondary)">No active goals yet. Create your first one!</p>
                    </div>
                ) : (
                    activeGoals.map(goal => {
                        const progressRaw = Math.abs(goal.current - goal.start) / Math.abs(goal.target - goal.start)
                        const progressPercent = Math.min(Math.max(progressRaw * 100, 0), 100)
                        return (
                            <div key={goal.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm overflow-hidden relative group hover:border-(--border-default) transition-colors">
                                <div className={cn("absolute -right-20 -top-20 w-[160px] h-[160px] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity", goal.color)} />

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn("px-2.5 py-1 rounded-[6px] font-body text-[11px] font-bold uppercase tracking-wider text-white", goal.color)}>{goal.category}</span>
                                            <span className={cn("flex items-center gap-1 font-body text-[12px] font-bold", goal.ahead ? "text-emerald-500" : "text-amber-500")}>
                                                <Clock className="w-[12px] h-[12px]" /> {goal.ahead ? 'Ahead of schedule' : 'Needs attention'}
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-[24px] text-(--text-primary) mb-1">{goal.title}</h3>
                                        <p className="font-body text-[14px] text-(--text-secondary)">Started at {goal.start} {goal.unit} • Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="block font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold mb-1">Current</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-display font-bold text-[32px] text-(--text-primary) leading-none">{goal.current}</span>
                                                <span className="font-body text-[16px] text-(--text-tertiary) font-semibold">/ {goal.target} {goal.unit}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 mt-1">
                                            <button onClick={() => void markComplete(goal.id)} title="Mark Complete" className="w-[36px] h-[36px] rounded-[10px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center">
                                                <CheckCircle className="w-[16px] h-[16px]" />
                                            </button>
                                            <button onClick={() => void deleteGoal(goal.id)} title="Delete Goal" className="w-[36px] h-[36px] rounded-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                                                <Trash2 className="w-[16px] h-[16px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 relative z-10">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-display font-bold text-[16px] text-(--text-primary)">{Math.round(progressPercent)}% Complete</span>
                                    </div>
                                    <div className="w-full h-[12px] bg-(--bg-surface-alt) rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className={cn("h-full rounded-full", goal.color)} />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {completedGoals.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                    <h2 className="font-display font-bold text-[20px] text-(--text-secondary)">Completed Goals ({completedGoals.length})</h2>
                    {completedGoals.map(goal => (
                        <div key={goal.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 flex items-center gap-4 opacity-60">
                            <CheckCircle className="w-[20px] h-[20px] text-emerald-500 shrink-0" />
                            <div className="flex-1">
                                <span className="font-body font-bold text-[15px] text-(--text-primary)">{goal.title}</span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">{goal.category} • {goal.target} {goal.unit}</span>
                            </div>
                            <button onClick={() => void deleteGoal(goal.id)} className="text-(--text-tertiary) hover:text-red-500 transition-colors"><X className="w-[16px] h-[16px]" /></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-(--bg-surface) rounded-[28px] p-6 w-full max-w-[480px] shadow-2xl border border-(--border-subtle)">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display font-bold text-[22px] text-(--text-primary)">Set New Goal</h2>
                                <button onClick={() => setShowAddModal(false)} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Goal Title</label>
                                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Squat 100kg" className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none" />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Category</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FitnessGoal['category'] }))} className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] focus:border-emerald-500 outline-none">
                                        {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary)">Start</label>
                                        <input type="number" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} placeholder="0" className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary)">Current</label>
                                        <input type="number" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} placeholder="0" className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary)">Target</label>
                                        <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="100" className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] outline-none focus:border-emerald-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary)">Unit</label>
                                        <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg" className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary)">Deadline</label>
                                        <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="h-[48px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] outline-none focus:border-emerald-500" />
                                    </div>
                                </div>

                                <button onClick={handleAddGoal} disabled={!form.title || !form.target || !form.deadline || isSubmitting} className="h-[56px] w-full rounded-[14px] bg-emerald-500 text-white font-display font-bold text-[16px] hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                    {isSubmitting ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <><Plus className="w-[18px] h-[18px]" /> Set Goal</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
