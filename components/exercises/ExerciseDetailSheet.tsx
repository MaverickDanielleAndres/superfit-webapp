'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, TrendingUp, Activity, Dumbbell, History, Play } from 'lucide-react'
import { Exercise } from '@/types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import QuickLogModal from '@/components/workout/QuickLogModal'

const mockProgressionData = [
    { date: 'Jan 1', rm: 60 }, { date: 'Jan 8', rm: 62.5 }, 
    { date: 'Jan 15', rm: 62.5 }, { date: 'Jan 22', rm: 65 }, 
    { date: 'Jan 29', rm: 67.5 }, { date: 'Feb 5', rm: 70 },
    { date: 'Feb 12', rm: 70 }, { date: 'Feb 19', rm: 72.5 }
]

const mockVolumeData = [
    { week: 'W1', vol: 1200 }, { week: 'W2', vol: 1450 },
    { week: 'W3', vol: 1400 }, { week: 'W4', vol: 1600 }
]

export default function ExerciseDetailSheet({ exercise, isOpen, onClose }: { exercise: Exercise | null, isOpen: boolean, onClose: () => void }) {
    const [showQuickLog, setShowQuickLog] = useState(false)

    if (!isOpen || !exercise) return null

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={onClose} />
            <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                className="w-full sm:w-[500px] h-full bg-(--bg-base) sm:rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                {/* Header Image / Video */}
                <div className="relative h-[220px] bg-[var(--bg-elevated)] shrink-0 group">
                    {exercise.videoUrl ? (
                        <>
                            <img src={exercise.videoUrl} alt={exercise.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <div className="w-[48px] h-[48px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                    <Play className="w-[20px] h-[20px] ml-1" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-(--text-tertiary)">
                            <Dumbbell className="w-[48px] h-[48px] mb-2 opacity-50" />
                            <span className="font-body font-bold text-[14px] uppercase tracking-wider">Demo Video Pending</span>
                        </div>
                    )}
                    
                    {/* Close Button overlaying image */}
                    <button onClick={onClose} className="absolute top-4 right-4 w-[36px] h-[36px] rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                        <X className="w-[18px] h-[18px]" />
                    </button>

                    {/* Gradient Fade to Content */}
                    <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-(--bg-base) to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-24 -mt-6 relative z-10">
                    
                    {/* Title & Badges */}
                    <div className="mb-6">
                        <h2 className="font-display font-black text-[28px] text-(--text-primary) leading-tight mb-3">{exercise.name}</h2>
                        <div className="flex flex-wrap gap-2">
                            {exercise.muscleGroups.map(m => (
                                <span key={m} className="px-3 py-1 rounded-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-body text-[12px] font-bold capitalize">{m}</span>
                            ))}
                            {exercise.equipment.map(eq => (
                                <span key={eq} className="px-3 py-1 rounded-[8px] bg-[var(--bg-elevated)] border border-(--border-subtle) text-(--text-secondary) font-body text-[12px] font-bold capitalize">{eq.replace('_', ' ')}</span>
                            ))}
                            {exercise.isCustom && (
                                <span className="px-3 py-1 rounded-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-body text-[12px] font-bold uppercase tracking-wider">Custom</span>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-8">
                        <h3 className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-3">Instructions</h3>
                        {exercise.instructions && exercise.instructions.length > 0 ? (
                            <ol className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-[var(--bg-elevated)]">
                                {exercise.instructions.map((step, idx) => (
                                    <li key={idx} className="flex gap-4 relative">
                                        <div className="w-[24px] h-[24px] rounded-full bg-(--bg-surface) border-2 border-(--border-default) flex items-center justify-center shrink-0 z-10 font-display font-bold text-[11px] text-(--text-secondary) mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <p className="font-body text-[14px] text-(--text-primary) leading-relaxed">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="font-body text-[14px] text-(--text-tertiary) italic bg-[var(--bg-elevated)] p-4 rounded-[12px]">No instructions available for this exercise.</p>
                        )}
                    </div>

                    {/* My Stats Section (Mocked) */}
                    <div>
                        <h3 className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-[16px] h-[16px]" /> My Stats
                        </h3>
                        
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-[var(--bg-surface)] border border-(--border-subtle) p-4 rounded-[16px]">
                                <Trophy className="w-[20px] h-[20px] text-amber-500 mb-2" />
                                <div className="font-body text-[12px] text-(--text-secondary) mb-1">Estimated 1RM</div>
                                <div className="font-display font-bold text-[24px] text-(--text-primary)">72.5<span className="text-[14px] text-(--text-tertiary) ml-1">kg</span></div>
                            </div>
                            <div className="bg-[var(--bg-surface)] border border-(--border-subtle) p-4 rounded-[16px]">
                                <History className="w-[20px] h-[20px] text-blue-500 mb-2" />
                                <div className="font-body text-[12px] text-(--text-secondary) mb-1">Best Set</div>
                                <div className="font-display font-bold text-[20px] text-(--text-primary)">60<span className="text-[12px] text-(--text-tertiary) mx-0.5">kg</span> × 8<span className="text-[12px] text-(--text-tertiary) ml-0.5">reps</span></div>
                            </div>
                        </div>

                        {/* 1RM Chart */}
                        <div className="bg-[var(--bg-surface)] border border-(--border-subtle) p-4 rounded-[16px] mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-body text-[14px] font-bold text-(--text-primary)">1RM Progression</div>
                                <TrendingUp className="w-[16px] h-[16px] text-emerald-500" />
                            </div>
                            <div className="h-[140px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={120}>
                                    <LineChart data={mockProgressionData}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => [`${value} kg`, '1RM']}
                                            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                                        />
                                        <Line type="monotone" dataKey="rm" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-surface)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Volume Chart */}
                        <div className="bg-[var(--bg-surface)] border border-(--border-subtle) p-4 rounded-[16px]">
                            <div className="font-body text-[14px] font-bold text-(--text-primary) mb-4">Weekly Volume</div>
                            <div className="h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={100}>
                                    <BarChart data={mockVolumeData}>
                                        <Tooltip 
                                            cursor={{ fill: 'var(--bg-elevated)' }}
                                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                            formatter={(value) => [`${value} kg`, 'Volume']}
                                        />
                                        <Bar dataKey="vol" fill="var(--border-strong)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-(--bg-base) via-(--bg-base) to-transparent border-t border-(--border-subtle) flex items-center justify-center backdrop-blur-md z-20">
                    <button 
                        onClick={() => setShowQuickLog(true)}
                        className="w-full h-[56px] bg-(--accent) text-white font-display font-bold text-[16px] rounded-[16px] hover:bg-(--accent-hover) transition-transform active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    >
                        Log This Exercise Now
                    </button>
                </div>

                <QuickLogModal exercise={exercise} isOpen={showQuickLog} onClose={() => setShowQuickLog(false)} />
            </motion.div>
        </div>
    )
}
