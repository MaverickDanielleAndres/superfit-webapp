'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Bell, Timer, Music, Activity, PlaySquare, Move, SkipForward, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TimerMode = 'tabata' | 'hiit' | 'emom' | 'amrap' | 'circuit' | 'yoga' | 'boxing' | 'custom'

interface TimerConfig {
    name: string
    description: string
    work: number // seconds
    rest: number // seconds
    rounds: number
    prep?: number // seconds, optional
    customIntervals?: { id: string, name: string, type: 'work' | 'rest' | 'prep', duration: number }[]
}

import CustomTimerBuilderModal, { CustomInterval } from '@/components/timer/CustomTimerBuilderModal'

const DEFAULT_CONFIGS: Record<TimerMode, TimerConfig> = {
    tabata: { name: 'Tabata', description: '20s work / 10s rest for 8 rounds.', work: 20, rest: 10, rounds: 8, prep: 10 },
    hiit: { name: 'HIIT', description: '45s work / 15s rest for 10 rounds.', work: 45, rest: 15, rounds: 10, prep: 10 },
    emom: { name: 'EMOM', description: 'Every Minute on the Minute.', work: 60, rest: 0, rounds: 10, prep: 10 },
    amrap: { name: 'AMRAP', description: 'As Many Rounds As Possible within a set time.', work: 300, rest: 0, rounds: 1, prep: 10 },
    circuit: { name: 'Circuit', description: '60s work / 30s rest across 5 stations.', work: 60, rest: 30, rounds: 5, prep: 10 },
    yoga: { name: 'Yoga Flow', description: 'Long sustained 90s holds for deep stretching.', work: 90, rest: 10, rounds: 15, prep: 10 },
    boxing: { name: 'Boxing', description: '3 min rounds / 1 min rest. Championship format.', work: 180, rest: 60, rounds: 12, prep: 10 },
    custom: { name: 'Custom Builder', description: 'Build your own specific interval protocol.', work: 30, rest: 30, rounds: 5, prep: 10 }
}

type Phase = 'prep' | 'work' | 'rest' | 'finished'

export default function TimerPage() {
    const [activeMode, setActiveMode] = useState<TimerMode>('tabata')

    // Config states
    const [configs, setConfigs] = useState<Record<TimerMode, TimerConfig>>(DEFAULT_CONFIGS)

    // Global Advanced Settings
    const [advancedSettings, setAdvancedSettings] = useState({
        soundEnabled: true,
        halfwayAlert: false,
        warningBeeps: true, // 3-2-1 countdown beeps
        autoStartNextRest: true // auto starts the next round after rest
    })

    // Active Timer Engine State
    const [isRunning, setIsRunning] = useState(false)
    const [currentPhase, setCurrentPhase] = useState<Phase>('prep')
    const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIGS['tabata'].prep || 10)
    const [currentRound, setCurrentRound] = useState(1)
    const [activeIntervalIndex, setActiveIntervalIndex] = useState(0)

    // UI State
    const [showSettings, setShowSettings] = useState(false)
    const [showCustomBuilder, setShowCustomBuilder] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Fullscreen Listener
    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', onFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
    }, [])

    // Audio Refs (Mocked via console for now, normally Audio objects)
    const playBeep = (type: 'short' | 'long' | 'halfway') => {
        if (!advancedSettings.soundEnabled) return
        // console.log(`[AUDIO BEEP]: ${type}`)
        // In a real app, you'd trigger an HTMLAudioElement here based on advancedSettings
    }

    const startTimerForMode = (mode: TimerMode) => {
        const config = configs[mode]
        setActiveMode(mode)
        setIsRunning(false)
        setCurrentRound(1)
        setActiveIntervalIndex(0)

        if (config.customIntervals && config.customIntervals.length > 0) {
            const first = config.customIntervals[0]
            setCurrentPhase(first.type as Phase)
            setTimeLeft(first.duration)
        } else {
            if (config.prep && config.prep > 0) {
                setCurrentPhase('prep')
                setTimeLeft(config.prep)
            } else {
                setCurrentPhase('work')
                setTimeLeft(config.work)
            }
        }
    }

    // Effect for changing mode
    useEffect(() => {
        startTimerForMode(activeMode)
    }, [activeMode, configs[activeMode].work, configs[activeMode].rest, configs[activeMode].rounds, configs[activeMode].prep])

    const currentConfig = configs[activeMode]

    function advanceRound() {
        if (currentRound < currentConfig.rounds) {
            setCurrentRound(r => r + 1)
            setCurrentPhase('work')
            setTimeLeft(currentConfig.work)
        } else {
            setCurrentPhase('finished')
            setIsRunning(false)
        }
    }

    function handlePhaseTransition() {
        if (currentConfig.customIntervals && currentConfig.customIntervals.length > 0) {
            const nextIdx = activeIntervalIndex + 1
            if (nextIdx < currentConfig.customIntervals.length) {
                setActiveIntervalIndex(nextIdx)
                const nextInterval = currentConfig.customIntervals[nextIdx]
                setCurrentPhase(nextInterval.type as Phase)
                setTimeLeft(nextInterval.duration)
            } else {
                setCurrentPhase('finished')
                setIsRunning(false)
            }
            return
        }

        // Classic Loop Logic
        if (currentPhase === 'prep') {
            setCurrentPhase('work')
            setTimeLeft(currentConfig.work)
        }
        else if (currentPhase === 'work') {
            if (currentConfig.rest > 0) {
                setCurrentPhase('rest')
                setTimeLeft(currentConfig.rest)
            } else {
                advanceRound()
            }
        }
        else if (currentPhase === 'rest') {
            advanceRound()
        }
    }

    // Timer Tick Engine
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isRunning && currentPhase !== 'finished') {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    const nextTime = prev - 1

                    // Alert Triggers
                    if (advancedSettings.warningBeeps && nextTime > 0 && nextTime <= 3) {
                        playBeep('short')
                    }
                    if (advancedSettings.halfwayAlert && currentPhase === 'work' && nextTime === Math.floor(currentConfig.work / 2)) {
                        playBeep('halfway')
                    }

                    if (nextTime <= 0) {
                        // Phase Transition Logic!
                        playBeep('long')
                        handlePhaseTransition()
                        return 0 // temporarily return 0, handlePhaseTransition sets the real next time
                    }
                    return nextTime
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isRunning, currentPhase, currentRound, currentConfig, advancedSettings])

    const toggleTimer = () => {
        if (currentPhase === 'finished') {
            startTimerForMode(activeMode) // restart
            setIsRunning(true)
        } else {
            setIsRunning(!isRunning)
        }
    }

    const handleSkip = () => {
        if (currentPhase !== 'finished') {
            handlePhaseTransition()
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                toast.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    const resetTimer = () => startTimerForMode(activeMode)

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Ring Calculation
    let totalDuration = 1
    if (currentPhase === 'finished') {
        totalDuration = 1
    } else if (currentConfig.customIntervals && currentConfig.customIntervals.length > 0) {
        totalDuration = currentConfig.customIntervals[activeIntervalIndex]?.duration || 1
    } else {
        if (currentPhase === 'prep') totalDuration = currentConfig.prep || 10
        else if (currentPhase === 'work') totalDuration = currentConfig.work
        else if (currentPhase === 'rest') totalDuration = currentConfig.rest
    }

    // Ensure we don't divide by zero visual bugs if settings hit 0
    totalDuration = totalDuration > 0 ? totalDuration : 1

    const fillPercentage = currentPhase === 'finished' ? 100 : ((totalDuration - timeLeft) / totalDuration) * 100

    const getRingColor = () => {
        if (currentPhase === 'prep') return 'var(--chart-amber)'
        if (currentPhase === 'work') return 'var(--status-success)'
        if (currentPhase === 'rest') return 'var(--chart-blue)'
        return 'var(--text-tertiary)'
    }

    const PhaseLabel = () => {
        if (currentPhase === 'finished') return <span className="text-(--text-primary)">Workout Complete</span>
        
        if (currentConfig.customIntervals && currentConfig.customIntervals.length > 0) {
            const name = currentConfig.customIntervals[activeIntervalIndex]?.name
            if (currentPhase === 'prep') return <span className="text-(--chart-amber)">{name || 'Get Ready'}</span>
            if (currentPhase === 'work') return <span className="text-(--status-success)">{name || 'Work'}</span>
            if (currentPhase === 'rest') return <span className="text-(--chart-blue)">{name || 'Rest'}</span>
        }

        if (currentPhase === 'prep') return <span className="text-(--chart-amber)">Get Ready</span>
        if (currentPhase === 'work') return <span className="text-(--status-success)">Work</span>
        if (currentPhase === 'rest') return <span className="text-(--chart-blue)">Rest</span>
        return null
    }

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto h-full flex flex-col gap-6 pb-[100px] xl:pb-8"
            >
                {/* Header Navbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display font-black text-[32px] text-(--text-primary) leading-tight tracking-tight">Pro Timer Hub</h1>
                        <p className="font-body text-[14px] text-(--text-secondary)">Select your protocol, customize logic, and crush it.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAdvancedSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                            className={cn("w-[44px] h-[44px] rounded-[12px] flex items-center justify-center transition-all cursor-pointer",
                                advancedSettings.soundEnabled ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)"
                            )}
                        >
                            {advancedSettings.soundEnabled ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="h-[44px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) font-body text-[14px] font-bold flex items-center gap-2 transition-all cursor-pointer hover:bg-[var(--bg-elevated)] leading-none"
                        >
                            <Settings className="w-[16px] h-[16px]" /> Advanced Settings
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1">

                    {/* Left Panel: Mode Selector */}
                    <div className="w-full lg:w-[320px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-4 flex flex-col gap-2 shrink-0 shadow-sm max-h-min">
                        <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider ml-2 mb-2">Timer Protocols</span>

                        {(Object.keys(DEFAULT_CONFIGS) as TimerMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setActiveMode(mode)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-[16px] transition-all cursor-pointer group text-left border border-transparent",
                                    activeMode === mode
                                        ? "bg-(--accent-bg-strong) border-(--accent) text-(--text-primary) shadow-sm"
                                        : "text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:border-(--border-default)"
                                )}
                            >
                                <div>
                                    <span className={cn("block font-display font-bold text-[16px]", activeMode === mode ? "text-(--text-primary)" : "group-hover:text-(--text-primary)")}>{configs[mode].name}</span>
                                    {configs[mode].customIntervals ? (
                                        <span className={cn("block font-body text-[12px] leading-snug mt-0.5", activeMode === mode ? "text-(--text-secondary)" : "text-(--text-tertiary)")}>
                                            {configs[mode].customIntervals?.length} custom intervals setup
                                        </span>
                                    ) : (
                                        <span className={cn("block font-body text-[12px] leading-snug mt-0.5", activeMode === mode ? "text-(--text-secondary)" : "text-(--text-tertiary)")}>
                                            {configs[mode].work}s work {configs[mode].rest > 0 ? `/ ${configs[mode].rest}s rest` : ''} • {configs[mode].rounds} rnds
                                        </span>
                                    )}
                                </div>
                                {activeMode === mode && <PlaySquare className="w-[18px] h-[18px] text-(--accent)" />}
                            </button>
                        ))}
                    </div>

                    {/* Right Panel: The Engine View */}
                    <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 lg:p-12 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">

                        <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                            <div>
                                <h2 className="font-display font-black text-[28px] text-(--text-primary) leading-none tracking-tight">{currentConfig.name}</h2>
                                <p className="font-body text-[14px] text-(--text-secondary) mt-2 max-w-[280px] leading-relaxed">{currentConfig.description}</p>
                            </div>

                            {activeMode === 'custom' ? (
                                <button
                                    onClick={() => setShowCustomBuilder(true)}
                                    className="px-4 py-2 rounded-[10px] bg-[var(--bg-elevated)] border border-(--accent) text-(--accent) font-body text-[13px] font-bold hover:bg-(--accent-bg-strong) transition-colors cursor-pointer"
                                >
                                    Build Custom Protocol
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-4 py-2 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) font-body text-[13px] font-bold text-(--text-primary) hover:border-(--border-subtle) transition-colors cursor-pointer"
                                >
                                    Edit Setup
                                </button>
                            )}
                        </div>

                        {/* Huge Main Timer Dial */}
                        <div className="relative w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] flex items-center justify-center mt-12 mb-8">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-2xl">
                                <circle cx="50%" cy="50%" r="46%" stroke="var(--bg-elevated)" strokeWidth="12" fill="none" />
                                <motion.circle
                                    cx="50%" cy="50%" r="46%"
                                    stroke={getRingColor()}
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="289%" // CSS approx for percentage
                                    strokeDashoffset={`${289 * (1 - fillPercentage / 100)}%`}
                                    className="transition-all duration-1000 ease-linear"
                                    style={{
                                        filter: currentPhase === 'work' ? 'drop-shadow(0 0 16px rgba(16,185,129,0.4))' :
                                            currentPhase === 'rest' ? 'drop-shadow(0 0 16px rgba(59,130,246,0.4))' :
                                                'drop-shadow(0 0 16px rgba(245,158,11,0.4))'
                                    }}
                                />
                            </svg>

                            {/* Readout */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-4">
                                <span className="font-body text-[15px] font-bold uppercase tracking-[0.2em] mb-2 transition-colors">
                                    <PhaseLabel />
                                </span>
                                <span className="font-display font-black text-[80px] sm:text-[110px] text-(--text-primary) leading-none tabular-nums tracking-tighter drop-shadow-md">
                                    {formatTime(timeLeft)}
                                </span>
                                <div className="mt-6 flex items-center gap-4 px-6 py-2 bg-[var(--bg-elevated)] border border-(--border-default) rounded-full shadow-inner">
                                    <span className="font-body text-[15px] text-(--text-secondary) font-bold uppercase tracking-wider">
                                        {currentConfig.customIntervals && currentConfig.customIntervals.length > 0 ? (
                                            <>Block {activeIntervalIndex + 1} <span className="text-(--text-tertiary) mx-1">/</span> {currentConfig.customIntervals.length}</>
                                        ) : (
                                            <>Round {currentRound} <span className="text-(--text-tertiary) mx-1">/</span> {currentConfig.rounds}</>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls Bottom Bar */}
                        <div className="flex items-center gap-4 sm:gap-6 z-10">
                            <button
                                onClick={resetTimer}
                                className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[16px] xl:rounded-[20px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-surface-alt)] hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer shadow-sm"
                            >
                                <RotateCcw className="w-[24px] h-[24px]" />
                            </button>

                            <button
                                onClick={toggleTimer}
                                className={cn(
                                    "w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] rounded-[24px] xl:rounded-[28px] flex items-center justify-center text-white transition-all transform hover:scale-[1.05] active:scale-[0.95] shadow-2xl cursor-pointer",
                                    isRunning ? "bg-(--status-danger) hover:bg-red-500 shadow-red-500/20" : "bg-(--accent) hover:bg-(--accent-hover) shadow-emerald-500/20"
                                )}
                            >
                                {isRunning ? <Pause className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px]" /> : <Play className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] ml-2" />}
                            </button>

                            <button 
                                onClick={handleSkip}
                                className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[16px] xl:rounded-[20px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-surface-alt)] hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer shadow-sm"
                            >
                                <SkipForward className="w-[24px] h-[24px]" />
                            </button>

                            <button 
                                onClick={toggleFullscreen}
                                className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[16px] xl:rounded-[20px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-surface-alt)] hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer shadow-sm hidden sm:flex"
                            >
                                {isFullscreen ? <Minimize2 className="w-[24px] h-[24px]" /> : <Maximize2 className="w-[24px] h-[24px]" />}
                            </button>
                        </div>
                    </div>
                </div>

            </motion.div>

            {/* Advanced Settings Modal */}
            <AnimatePresence>
                {/* Custom Builder Model */}
                <CustomTimerBuilderModal 
                    isOpen={showCustomBuilder}
                    onClose={() => setShowCustomBuilder(false)}
                    initialIntervals={configs['custom'].customIntervals || []}
                    onSave={(intervals) => {
                        setConfigs({ ...configs, custom: { ...configs.custom, customIntervals: intervals } })
                    }}
                />

                {showSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="w-full max-w-2xl bg-(--bg-surface) rounded-[32px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh] border border-(--border-subtle)"
                        >
                            <div className="p-6 sm:p-8 flex-1 overflow-y-auto w-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="font-display font-black text-[28px] text-(--text-primary) leading-tight mb-2">Timer Settings</h2>
                                        <span className="font-body text-[14px] text-(--text-secondary) font-bold bg-(--text-primary) text-(--bg-base) px-3 py-1 rounded-[8px] uppercase tracking-wider">{configs[activeMode].name} Mode</span>
                                    </div>
                                    <button onClick={() => setShowSettings(false)} className="w-[40px] h-[40px] rounded-full bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-surface-alt)] transition-colors"><RotateCcw className="w-[18px] h-[18px] rotate-45" /></button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                                    {/* Protocol Setups */}
                                    <div className="flex flex-col gap-5">
                                        <h3 className="font-display font-bold text-[18px] text-(--text-primary) border-b border-(--border-subtle) pb-3 flex items-center gap-2"><Move className="w-[18px] h-[18px]" /> Intervals</h3>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Work Phase (sec)</label>
                                            <input
                                                type="number"
                                                className="h-[52px] px-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none font-display font-bold text-[18px] text-(--text-primary) transition-all"
                                                value={configs[activeMode].work}
                                                onChange={(e) => {
                                                    setConfigs({ ...configs, [activeMode]: { ...configs[activeMode], work: Number(e.target.value) } })
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Rest Phase (sec)</label>
                                            <input
                                                type="number"
                                                className="h-[52px] px-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none font-display font-bold text-[18px] text-(--text-primary) transition-all"
                                                value={configs[activeMode].rest}
                                                onChange={(e) => {
                                                    setConfigs({ ...configs, [activeMode]: { ...configs[activeMode], rest: Number(e.target.value) } })
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Total Rounds</label>
                                            <input
                                                type="number"
                                                className="h-[52px] px-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none font-display font-bold text-[18px] text-(--text-primary) transition-all"
                                                value={configs[activeMode].rounds}
                                                onChange={(e) => {
                                                    setConfigs({ ...configs, [activeMode]: { ...configs[activeMode], rounds: Number(e.target.value) } })
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Prep Time (sec)</label>
                                            <input
                                                type="number"
                                                className="h-[52px] px-4 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none font-display font-bold text-[18px] text-(--text-primary) transition-all"
                                                value={configs[activeMode].prep || 0}
                                                onChange={(e) => {
                                                    setConfigs({ ...configs, [activeMode]: { ...configs[activeMode], prep: Number(e.target.value) } })
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Global Logic */}
                                    <div className="flex flex-col gap-5">
                                        <h3 className="font-display font-bold text-[18px] text-(--text-primary) border-b border-(--border-subtle) pb-3 flex items-center gap-2"><Settings className="w-[18px] h-[18px]" /> Global Options</h3>

                                        <label className="flex items-center justify-between p-4 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-(--border-subtle) cursor-pointer group transition-colors">
                                            <div>
                                                <span className="block font-display font-bold text-[15px] text-(--text-primary)">Audible Beeps</span>
                                                <span className="block font-body text-[13px] text-(--text-secondary)">Enable sound effects for phases</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer pt-1">
                                                <input type="checkbox" checked={advancedSettings.soundEnabled} onChange={e => setAdvancedSettings({ ...advancedSettings, soundEnabled: e.target.checked })} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                                            </div>
                                        </label>

                                        <label className="flex items-center justify-between p-4 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-(--border-subtle) cursor-pointer group transition-colors">
                                            <div>
                                                <span className="block font-display font-bold text-[15px] text-(--text-primary)">Halfway Alert</span>
                                                <span className="block font-body text-[13px] text-(--text-secondary)">Dings halfway thru work phase</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer pt-1">
                                                <input type="checkbox" checked={advancedSettings.halfwayAlert} onChange={e => setAdvancedSettings({ ...advancedSettings, halfwayAlert: e.target.checked })} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                                            </div>
                                        </label>

                                        <label className="flex items-center justify-between p-4 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-(--border-subtle) cursor-pointer group transition-colors">
                                            <div>
                                                <span className="block font-display font-bold text-[15px] text-(--text-primary)">Warning Countdown</span>
                                                <span className="block font-body text-[13px] text-(--text-secondary)">3-2-1 beeps before end</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer pt-1">
                                                <input type="checkbox" checked={advancedSettings.warningBeeps} onChange={e => setAdvancedSettings({ ...advancedSettings, warningBeeps: e.target.checked })} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                                            </div>
                                        </label>

                                        <label className="flex items-center justify-between p-4 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-(--border-subtle) cursor-pointer group transition-colors">
                                            <div>
                                                <span className="block font-display font-bold text-[15px] text-(--text-primary)">Auto-Continue</span>
                                                <span className="block font-body text-[13px] text-(--text-secondary)">Proceed immediately to next</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer pt-1">
                                                <input type="checkbox" checked={advancedSettings.autoStartNextRest} onChange={e => setAdvancedSettings({ ...advancedSettings, autoStartNextRest: e.target.checked })} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t border-(--border-subtle) pt-6 flex gap-4">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="h-[56px] px-8 rounded-[16px] bg-(--text-primary) text-(--bg-base) font-body font-bold text-[16px] hover:opacity-90 transition-opacity ml-auto shadow-md"
                                    >
                                        Apply & Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </React.Fragment>
    )
}
