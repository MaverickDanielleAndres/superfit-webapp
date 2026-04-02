'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, GripVertical, Check, Timer as TimerIcon, Activity, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export type CustomInterval = {
    id: string
    name: string
    type: 'work' | 'rest' | 'prep'
    duration: number
}

interface CustomTimerBuilderModalProps {
    isOpen: boolean
    onClose: () => void
    initialIntervals: CustomInterval[]
    onSave: (intervals: CustomInterval[]) => void
}

export default function CustomTimerBuilderModal({ isOpen, onClose, initialIntervals, onSave }: CustomTimerBuilderModalProps) {
    const [intervals, setIntervals] = useState<CustomInterval[]>(initialIntervals?.length ? initialIntervals : [
        { id: '1', name: 'Get Ready', type: 'prep', duration: 10 },
        { id: '2', name: 'Work', type: 'work', duration: 45 },
        { id: '3', name: 'Rest', type: 'rest', duration: 15 }
    ])

    if (!isOpen) return null

    const addInterval = (type: 'work' | 'rest' | 'prep') => {
        const defaults = {
            work: { name: 'Work', duration: 30 },
            rest: { name: 'Rest', duration: 15 },
            prep: { name: 'Get Ready', duration: 10 }
        }
        setIntervals([...intervals, { 
            id: Math.random().toString(36).substr(2, 9), 
            type, 
            name: defaults[type].name, 
            duration: defaults[type].duration 
        }])
    }

    const removeInterval = (id: string) => {
        setIntervals(intervals.filter(i => i.id !== id))
    }

    const updateInterval = (id: string, field: keyof CustomInterval, value: any) => {
        setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    const handleSave = () => {
        if (intervals.length === 0) {
            toast.error("Please add at least one interval.")
            return
        }
        onSave(intervals)
        onClose()
    }

    const getTypeIcon = (type: string) => {
        if (type === 'work') return <Activity className="w-[14px] h-[14px]" />
        if (type === 'rest') return <Coffee className="w-[14px] h-[14px]" />
        return <TimerIcon className="w-[14px] h-[14px]" />
    }

    const getTypeColor = (type: string) => {
        if (type === 'work') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        if (type === 'rest') return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-(--bg-surface) rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
                
                <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between bg-(--bg-base)">
                    <div>
                        <h2 className="font-display font-black text-[22px] text-(--text-primary) leading-none mb-1">Custom Timer Builder</h2>
                        <p className="font-body text-[13px] text-(--text-secondary)">Build a complex sequence of intervals.</p>
                    </div>
                    <button onClick={onClose} className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                        <X className="w-[18px] h-[18px]" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-[var(--bg-base)]">
                    <div className="flex flex-col gap-3">
                        {intervals.map((interval, index) => (
                            <div key={interval.id} className="bg-(--bg-surface) border border-(--border-default) rounded-[16px] p-3 flex items-center gap-3 relative group">
                                <div className="text-(--border-subtle) cursor-move hover:text-(--text-secondary) transition-colors px-1">
                                    <GripVertical className="w-[16px] h-[16px]" />
                                </div>
                                
                                <div className={cn("w-[36px] h-[36px] rounded-[10px] flex items-center justify-center border shrink-0", getTypeColor(interval.type))}>
                                    {getTypeIcon(interval.type)}
                                </div>

                                <div className="flex-1 grid grid-cols-[1fr_80px] gap-3">
                                    <input 
                                        type="text" 
                                        value={interval.name}
                                        onChange={(e) => updateInterval(interval.id, 'name', e.target.value)}
                                        placeholder="Phase name"
                                        className="w-full bg-transparent font-display font-bold text-[15px] text-(--text-primary) outline-none border-b border-transparent focus:border-(--accent) transition-colors"
                                    />
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            value={interval.duration}
                                            onChange={(e) => updateInterval(interval.id, 'duration', Number(e.target.value))}
                                            className="w-full bg-[var(--bg-elevated)] rounded-[8px] h-[32px] px-2 text-center font-body text-[14px] font-bold text-(--text-primary) outline-none focus:ring-1 focus:ring-(--accent)"
                                        />
                                        <span className="font-body text-[12px] text-(--text-secondary)">s</span>
                                    </div>
                                </div>

                                <button onClick={() => removeInterval(interval.id)} className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-(--text-tertiary) hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0">
                                    <Trash2 className="w-[16px] h-[16px]" />
                                </button>

                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-[24px] h-[24px] bg-(--bg-surface) border border-(--border-subtle) rounded-full flex items-center justify-center font-display text-[10px] font-bold text-(--text-secondary) shadow-sm translate-x-[-50%]">
                                    {index + 1}
                                </div>
                            </div>
                        ))}

                        {intervals.length === 0 && (
                            <div className="text-center py-8 text-(--text-secondary) font-body text-[14px]">
                                No intervals added yet.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-6 justify-center">
                        <button onClick={() => addInterval('prep')} className="h-[36px] px-4 rounded-[10px] border border-amber-500/20 bg-amber-500/10 text-amber-600 font-body text-[12px] font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-2">
                            <Plus className="w-[14px] h-[14px]" /> Prep
                        </button>
                        <button onClick={() => addInterval('work')} className="h-[36px] px-4 rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 font-body text-[12px] font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
                            <Plus className="w-[14px] h-[14px]" /> Work
                        </button>
                        <button onClick={() => addInterval('rest')} className="h-[36px] px-4 rounded-[10px] border border-blue-500/20 bg-blue-500/10 text-blue-600 font-body text-[12px] font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-2">
                            <Plus className="w-[14px] h-[14px]" /> Rest
                        </button>
                    </div>
                </div>

                <div className="p-5 border-t border-(--border-subtle) bg-(--bg-surface)">
                    <button 
                        onClick={handleSave}
                        className="w-full h-[54px] bg-(--accent) text-white font-display font-bold text-[16px] rounded-[16px] hover:bg-(--accent-hover) transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Check className="w-[20px] h-[20px]" /> Apply Custom Sequence
                    </button>
                </div>

            </motion.div>
        </div>
    )
}
