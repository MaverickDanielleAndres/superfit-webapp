'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, X, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_RESTS = [45, 60, 90, 120] // seconds

export default function RestTimerPill() {
    const [isOpen, setIsOpen] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [totalTime, setTotalTime] = useState<number>(60)
    const [customTime, setCustomTime] = useState('60')

    const isRunning = timeLeft !== null && timeLeft > 0

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRunning) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev && prev > 1) return prev - 1
                    // Finished
                    return 0
                })
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isRunning])

    const startTimer = (seconds: number) => {
        setTotalTime(seconds)
        setTimeLeft(seconds)
        setIsOpen(false)
    }

    const stopTimer = () => {
        setTimeLeft(null)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const fillPercentage = timeLeft !== null ? ((totalTime - timeLeft) / totalTime) * 100 : 0

    return (
        <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-2">
            
            {/* Popover Menu */}
            <AnimatePresence>
                {isOpen && !isRunning && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 shadow-2xl w-[220px] flex flex-col gap-3"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-(--border-subtle)">
                            <span className="font-display font-bold text-[14px] text-(--text-primary)">Rest Timer</span>
                            <button onClick={() => setIsOpen(false)} className="text-(--text-tertiary) hover:text-(--text-primary)">
                                <X className="w-[14px] h-[14px]" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_RESTS.map(t => (
                                <button 
                                    key={t}
                                    onClick={() => startTimer(t)}
                                    className="h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[10px] font-body text-[13px] font-bold text-(--text-secondary) hover:text-(--accent) hover:border-(--accent) transition-colors"
                                >
                                    {t}s
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="number" 
                                value={customTime}
                                onChange={(e) => setCustomTime(e.target.value)}
                                className="w-full h-[36px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[10px] px-3 font-body text-[13px] text-center focus:outline-none focus:border-(--accent) text-(--text-primary)"
                                placeholder="Secs"
                            />
                            <button 
                                onClick={() => startTimer(Number(customTime) || 60)}
                                className="h-[36px] px-3 bg-(--accent) text-white rounded-[10px] flex items-center justify-center hover:bg-(--accent-hover)"
                            >
                                <Play className="w-[14px] h-[14px]" fill="currentColor" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Pill itself */}
            <button
                onClick={() => {
                    if (isRunning || timeLeft === 0) stopTimer()
                    else setIsOpen(!isOpen)
                }}
                className={cn(
                    "h-[48px] rounded-full flex items-center shadow-lg transition-all border overflow-hidden relative group",
                    isRunning ? "bg-(--bg-surface) border-(--border-default)" : "bg-[var(--bg-elevated)] border-(--border-default) hover:border-(--accent)",
                    timeLeft === 0 ? "bg-(--accent) border-(--accent)" : ""
                )}
            >
                {/* Background Progress Fill */}
                {isRunning && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all duration-1000 ease-linear z-0" 
                        style={{ width: `${fillPercentage}%` }} 
                    />
                )}

                <div className="relative z-10 flex items-center px-5 gap-2 h-full">
                    {timeLeft === 0 ? (
                        <>
                            <Timer className="w-[18px] h-[18px] text-white animate-pulse" />
                            <span className="font-display font-bold text-[15px] text-white tracking-wider">REST DONE</span>
                            <X className="w-[14px] h-[14px] text-emerald-100 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    ) : isRunning ? (
                        <>
                            <Timer className="w-[18px] h-[18px] text-blue-500" />
                            <span className="font-display font-bold text-[18px] text-(--text-primary) tabular-nums tracking-wider w-[48px] text-center">{formatTime(timeLeft!)}</span>
                            <X className="w-[14px] h-[14px] text-(--text-tertiary) ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    ) : (
                        <>
                            <Timer className="w-[18px] h-[18px] text-(--text-secondary) group-hover:text-(--accent) transition-colors" />
                            <span className="font-body font-bold text-[14px] text-(--text-secondary) group-hover:text-(--accent) transition-colors">Timer</span>
                        </>
                    )}
                </div>
            </button>
        </div>
    )
}
