'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Dumbbell, Grid, List as ListIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { Exercise } from '@/types'
import ExerciseDetailSheet from '@/components/exercises/ExerciseDetailSheet'
import CustomExerciseModal from '@/components/workout/CustomExerciseModal'
import QuickLogModal from '@/components/workout/QuickLogModal'

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio']
const EQUIPMENT_FILTERS = ['All Equipment', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Bands', 'Kettlebell']

export default function ExercisesPage() {
    const { exerciseLibrary, customExercises } = useWorkoutStore()
    
    // States
    const [searchQuery, setSearchQuery] = useState('')
    const [activeMuscle, setActiveMuscle] = useState('All')
    const [activeEquipment, setActiveEquipment] = useState('All Equipment')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [showDetailSheet, setShowDetailSheet] = useState(false)
    const [showCustomModal, setShowCustomModal] = useState(false)
    const [showQuickLog, setShowQuickLog] = useState(false)
    
    const allExercises = useMemo(() => {
        return [...customExercises, ...exerciseLibrary]
    }, [exerciseLibrary, customExercises])

    const filteredExercises = useMemo(() => {
        return allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesMuscle = activeMuscle === 'All' || 
                ex.muscleGroups.includes(activeMuscle.toLowerCase() as any) || 
                (activeMuscle === 'Arms' && (ex.muscleGroups.includes('biceps') || ex.muscleGroups.includes('triceps') || ex.muscleGroups.includes('forearms'))) || 
                (activeMuscle === 'Legs' && (ex.muscleGroups.includes('quads') || ex.muscleGroups.includes('hamstrings') || ex.muscleGroups.includes('glutes') || ex.muscleGroups.includes('calves')))
            const matchesEquip = activeEquipment === 'All Equipment' || ex.equipment.includes(activeEquipment.toLowerCase().replace(' ', '_') as any)
            return matchesSearch && matchesMuscle && matchesEquip
        })
    }, [allExercises, searchQuery, activeMuscle, activeEquipment])

    const handleViewDetail = (ex: Exercise) => {
        setSelectedExercise(ex)
        setShowDetailSheet(true)
    }

    const handleQuickLog = (ex: Exercise, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedExercise(ex)
        setShowQuickLog(true)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto h-full flex flex-col gap-6 pb-20">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary) leading-tight">Exercise Library</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Browse, create, and log individual exercises here.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowCustomModal(true)} className="h-[44px] px-4 rounded-[14px] bg-[var(--bg-surface)] border-2 border-dashed border-(--border-default) text-(--text-secondary) font-body font-bold text-[13px] transition-all hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) flex items-center gap-2 shadow-sm">
                        <Plus className="w-[16px] h-[16px]" /> Create Exercise
                    </button>
                    <button onClick={() => { setSelectedExercise(filteredExercises[0] || null); setShowQuickLog(true); }} className="h-[44px] px-5 rounded-[14px] bg-(--accent) text-white font-body font-bold text-[14px] hover:bg-(--accent-hover) transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Plus className="w-[18px] h-[18px]" /> Log Exercise
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-3 sticky top-0 bg-(--bg-base) pt-2 pb-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search exercises..."
                            className="w-full h-[48px] pl-11 pr-4 rounded-[16px] bg-(--bg-surface) border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) text-[14px] font-body transition-all outline-none text-(--text-primary) placeholder:text-(--text-tertiary)"
                        />
                    </div>
                    <div className="flex border border-(--border-default) rounded-[16px] overflow-hidden bg-(--bg-surface) p-1 shrink-0">
                        <button onClick={() => setViewMode('grid')} className={cn("w-[40px] h-[38px] flex justify-center items-center rounded-[12px] transition-colors", viewMode === 'grid' ? "bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm" : "text-(--text-tertiary) hover:text-(--text-secondary)")}>
                            <Grid className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={cn("w-[40px] h-[38px] flex justify-center items-center rounded-[12px] transition-colors", viewMode === 'list' ? "bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm" : "text-(--text-tertiary) hover:text-(--text-secondary)")}>
                            <ListIcon className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {MUSCLE_FILTERS.map(m => (
                        <button key={m} onClick={() => setActiveMuscle(m)} className={cn("whitespace-nowrap px-4 py-2 rounded-full font-body text-[13px] font-bold transition-colors border", activeMuscle === m ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-[var(--bg-surface)] border-transparent text-(--text-secondary) hover:text-(--text-primary)")}>
                            {m}
                        </button>
                    ))}
                    <div className="w-[1px] h-[20px] bg-(--border-default) mx-1 shrink-0" />
                    {EQUIPMENT_FILTERS.map(eq => (
                        <button key={eq} onClick={() => setActiveEquipment(eq)} className={cn("whitespace-nowrap px-3 py-1.5 rounded-[10px] font-body text-[12px] font-semibold transition-colors border", activeEquipment === eq ? "bg-[var(--bg-elevated)] border-(--text-secondary) text-(--text-primary)" : "bg-transparent border border-(--border-subtle) text-(--text-tertiary) hover:text-(--text-secondary)")}>
                            {eq}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid/List View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredExercises.map(ex => (
                        <div key={ex.id} onClick={() => handleViewDetail(ex)} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] overflow-hidden hover:border-(--border-default) transition-all cursor-pointer group flex flex-col h-full shadow-sm hover:shadow-md">
                            <div className="h-[140px] overflow-hidden bg-[var(--bg-elevated)] flex items-center justify-center relative">
                                {ex.videoUrl ? (
                                    <img src={ex.videoUrl} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Dumbbell className="w-[32px] h-[32px] text-(--text-tertiary) opacity-50" />
                                )}
                                {ex.isCustom && <div className="absolute top-2 left-2 bg-amber-500 rounded-[6px] px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">Custom</div>}
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-display font-bold text-[16px] text-(--text-primary) leading-snug mb-2">{ex.name}</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Math.min(2, ex.muscleGroups.length) && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-body font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[6px]">{ex.muscleGroups[0]}</span>}
                                        {Math.min(1, ex.equipment.length) && <span className="bg-[var(--bg-base)] border border-(--border-default) text-(--text-secondary) font-body font-bold text-[10px] uppercase px-2 py-0.5 rounded-[6px]">{ex.equipment[0].replace('_', ' ')}</span>}
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <button className="flex-1 h-[32px] font-body text-[12px] font-bold text-(--text-secondary) bg-[var(--bg-elevated)] rounded-[8px] hover:text-(--text-primary) hover:bg-[var(--bg-base)] border border-transparent hover:border-(--border-subtle) transition-all">Details</button>
                                    <button onClick={(e) => handleQuickLog(ex, e)} className="w-[32px] h-[32px] flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[8px] hover:bg-emerald-500 hover:text-white transition-all">
                                        <Plus className="w-[16px] h-[16px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredExercises.map(ex => (
                        <div key={ex.id} onClick={() => handleViewDetail(ex)} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] p-3 flex items-center gap-4 hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group shadow-sm">
                            <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden bg-[var(--bg-elevated)] flex shrink-0 items-center justify-center">
                                {ex.videoUrl ? <img src={ex.videoUrl} alt={ex.name} className="w-full h-full object-cover" /> : <Dumbbell className="w-[24px] h-[24px] text-(--text-tertiary)" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {ex.isCustom && <span className="text-[10px] text-amber-500 font-bold uppercase border border-amber-500/30 px-1.5 py-0.5 rounded-[4px] leading-none shrink-0">Custom</span>}
                                    <h3 className="font-display font-bold text-[16px] text-(--text-primary) truncate">{ex.name}</h3>
                                </div>
                                <p className="font-body text-[13px] text-(--text-secondary) capitalize truncate">{ex.muscleGroups.join(', ')} • {ex.equipment.join(', ')}</p>
                            </div>
                            <div className="flex shrink-0 gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pr-2">
                                <button onClick={(e) => handleQuickLog(ex, e)} className="h-[36px] px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[13px] font-bold rounded-[10px] flex items-center gap-2 transition-colors hover:bg-emerald-500 hover:text-white">
                                    <Plus className="w-[14px] h-[14px]" /> Log
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredExercises.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                    <Dumbbell className="w-[48px] h-[48px] text-(--text-tertiary) mb-4 opacity-50" />
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">No exercises found</h3>
                    <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px]">We couldn't find anything matching your filters. Try adjusting them or create a custom exercise.</p>
                </div>
            )}

            <ExerciseDetailSheet 
                isOpen={showDetailSheet} 
                onClose={() => setShowDetailSheet(false)} 
                exercise={selectedExercise} 
            />
            
            <CustomExerciseModal 
                isOpen={showCustomModal} 
                onClose={() => setShowCustomModal(false)}
            />

            <QuickLogModal
                isOpen={showQuickLog}
                onClose={() => setShowQuickLog(false)}
                exercise={selectedExercise}
            />
        </motion.div>
    )
}
