'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Dumbbell, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { Exercise } from '@/types'
import { cn } from '@/lib/utils'
import CustomExerciseModal from './CustomExerciseModal'

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio']
const EQUIPMENT_FILTERS = ['All Equipment', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Bands', 'Kettlebell']

export default function ExercisePickerDrawer({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (ex: Exercise) => void }) {
    const { exerciseLibrary, customExercises } = useWorkoutStore()
    const [search, setSearch] = useState('')
    const [activeMuscle, setActiveMuscle] = useState('All')
    const [activeEquipment, setActiveEquipment] = useState('All Equipment')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [showCustomModal, setShowCustomModal] = useState(false)

    const allExercises = useMemo(() => {
        return [...customExercises, ...exerciseLibrary]
    }, [exerciseLibrary, customExercises])

    const filteredExercises = useMemo(() => {
        return allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
            const matchesMuscle = activeMuscle === 'All' || ex.muscleGroups.includes(activeMuscle.toLowerCase() as any) || (activeMuscle === 'Arms' && (ex.muscleGroups.includes('biceps') || ex.muscleGroups.includes('triceps') || ex.muscleGroups.includes('forearms'))) || (activeMuscle === 'Legs' && (ex.muscleGroups.includes('quads') || ex.muscleGroups.includes('hamstrings') || ex.muscleGroups.includes('glutes') || ex.muscleGroups.includes('calves')))
            const matchesEquip = activeEquipment === 'All Equipment' || ex.equipment.includes(activeEquipment.toLowerCase().replace(' ', '_') as any)
            return matchesSearch && matchesMuscle && matchesEquip
        })
    }, [allExercises, search, activeMuscle, activeEquipment])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-(--bg-base)">
            {/* Header */}
            <div className="px-4 py-3 shrink-0 bg-(--bg-surface) border-b border-(--border-subtle) flex items-center justify-between">
                <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Exercise Library</h2>
                <button onClick={onClose} className="w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                    <X className="w-[16px] h-[16px]" />
                </button>
            </div>

            {/* Search & Filters */}
            <div className="px-4 py-3 shrink-0 bg-(--bg-surface) border-b border-(--border-subtle) flex flex-col gap-3">
                <div className="relative">
                    <Search className="w-[16px] h-[16px] text-(--text-tertiary) absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search exercises..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-[40px] bg-[var(--bg-elevated)] rounded-[12px] pl-10 pr-4 font-body text-[14px] focus:outline-none focus:ring-1 focus:ring-(--accent) text-(--text-primary)"
                    />
                </div>

                {/* Muscle Chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {MUSCLE_FILTERS.map(m => (
                        <button 
                            key={m} 
                            onClick={() => setActiveMuscle(m)}
                            className={cn("whitespace-nowrap px-4 h-[32px] rounded-full font-body text-[13px] font-bold transition-colors border", activeMuscle === m ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-elevated)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Equipment Chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {EQUIPMENT_FILTERS.map(eq => (
                        <button 
                            key={eq} 
                            onClick={() => setActiveEquipment(eq)}
                            className={cn("whitespace-nowrap px-3 h-[28px] rounded-[8px] font-body text-[12px] font-semibold transition-colors border", activeEquipment === eq ? "bg-[var(--bg-elevated)] border-(--text-secondary) text-(--text-primary)" : "bg-transparent border border-(--border-subtle) text-(--text-tertiary) hover:text-(--text-secondary)")}
                        >
                            {eq}
                        </button>
                    ))}
                </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-32">
                {filteredExercises.map(ex => {
                    const isExpanded = expandedId === ex.id
                    return (
                        <div key={ex.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] overflow-hidden transition-all">
                            {/* Row Header */}
                            <div 
                                onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-[12px] h-[40px] rounded-full bg-emerald-500/20 flex-shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {ex.isCustom && <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">Custom</span>}
                                            <h3 className="font-display font-bold text-[15px] text-(--text-primary)">{ex.name}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {ex.muscleGroups.map(m => <span key={m} className="text-[11px] text-(--text-secondary) capitalize bg-[var(--bg-base)] px-1.5 py-0.5 rounded-sm">{m}</span>)}
                                            {ex.equipment.map(eq => <span key={eq} className="text-[11px] text-(--text-tertiary) capitalize bg-[var(--bg-base)] border border-(--border-subtle) px-1.5 py-0.5 rounded-sm">{eq.replace('_', ' ')}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onSelect(ex); onClose(); }} 
                                        className="h-[32px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full font-body text-[13px] font-bold transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-[14px] h-[14px]" /> Add
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-[16px] h-[16px] text-(--text-tertiary)" /> : <ChevronDown className="w-[16px] h-[16px] text-(--text-tertiary)" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="p-4 pt-0 border-t border-(--border-subtle)">
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                
                                                {/* Instructions */}
                                                <div>
                                                    <h4 className="font-body text-[11px] font-bold text-(--text-tertiary) uppercase tracking-wider mb-2">Instructions</h4>
                                                    {ex.instructions.length > 0 ? (
                                                        <ol className="list-decimal list-inside space-y-1">
                                                            {ex.instructions.map((inst, i) => (
                                                                <li key={i} className="font-body text-[13px] text-(--text-secondary) leading-relaxed">{inst}</li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <p className="font-body text-[13px] text-(--text-tertiary) italic">No instructions provided.</p>
                                                    )}
                                                </div>

                                                {/* Demo Placeholder */}
                                                <div>
                                                    <h4 className="font-body text-[11px] font-bold text-(--text-tertiary) uppercase tracking-wider mb-2">Demo</h4>
                                                    {ex.videoUrl ? (
                                                        <img src={ex.videoUrl} alt="Demo" className="w-full h-[120px] object-cover rounded-[12px]" />
                                                    ) : (
                                                        <div className="w-full h-[120px] bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-subtle) flex items-center justify-center text-(--text-tertiary)">
                                                            <div className="flex flex-col items-center">
                                                                <Dumbbell className="w-[24px] h-[24px] mb-2 opacity-50" />
                                                                <span className="font-body font-bold text-[12px] uppercase">Demo Pending</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                            <div className="mt-4">
                                                <button onClick={() => { onSelect(ex); onClose(); }} className="w-full h-[44px] bg-(--accent) text-white font-body font-bold text-[14px] rounded-[12px] hover:bg-(--accent-hover) transition-colors flex items-center justify-center gap-2">
                                                    <Plus className="w-[16px] h-[16px]" /> Add to Workout
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
                {filteredExercises.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <Dumbbell className="w-[40px] h-[40px] text-(--text-tertiary) mb-4 opacity-50" />
                        <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">No exercises found</h3>
                        <p className="font-body text-[14px] text-(--text-secondary) max-w-sm">We couldn't find any exercises matching your current filters. Try adjusting them or create your own custom exercise below.</p>
                    </div>
                )}
            </div>

            {/* Bottom Create Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-(--bg-base) via-(--bg-base) to-transparent border-t border-(--border-subtle) flex items-center justify-center backdrop-blur-md">
                <button 
                    onClick={() => setShowCustomModal(true)}
                    className="w-full max-w-md h-[56px] rounded-[16px] bg-[var(--bg-surface-alt)] border border-(--border-default) text-(--text-primary) font-body font-bold text-[15px] hover:bg-[var(--bg-elevated)] hover:border-(--border-subtle) transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="w-[18px] h-[18px] text-(--text-secondary)" /> Create Custom Exercise
                </button>
            </div>

            <CustomExerciseModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} />
        </div>
    )
}
