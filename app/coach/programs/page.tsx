'use client'
import React, { useEffect } from 'react'
import { Plus, Copy, Send, MoreVertical, LayoutGrid, Image as ImageIcon, X, ArrowLeft, GripVertical, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function ProgramsPage() {
    const {
        programs,
        clients: roster,
        fetchPrograms,
        fetchClients,
        addProgram,
        updateProgram,
        duplicateProgram,
        assignProgram,
    } = useCoachPortalStore()

    const [builderState, setBuilderState] = React.useState<{
        isOpen: boolean
        name: string
        programId: string | null
        difficulty: string
        length: string
        cover: string
    }>({
        isOpen: false,
        name: '',
        programId: null,
        difficulty: 'Beginner',
        length: '4 Weeks',
        cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop',
    })
    const [builderDays, setBuilderDays] = React.useState<{id: string, name: string, exercises: string[]}[]>([
        {id: 'd1', name: 'Day 1: Lower Body', exercises: ['Squat (Barbell)', 'Romanian Deadlift', 'Leg Press']},
        {id: 'd2', name: 'Day 2: Upper Body', exercises: ['Bench Press', 'Pull Up', 'Overhead Press']}
    ])

    const [assignModal, setAssignModal] = React.useState<{isOpen: boolean, programId: string | null}>({isOpen: false, programId: null})
    const [selectedClients, setSelectedClients] = React.useState<string[]>([])

    useEffect(() => {
        void fetchPrograms()
        void fetchClients()
    }, [fetchClients, fetchPrograms])

    const clients = roster.map((client) => ({
        id: client.id,
        name: client.name,
        plan: client.status,
    }))

    const handleDragStart = (e: React.DragEvent, dayId: string, exIndex: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ dayId, exIndex }))
    }

    const handleDrop = (e: React.DragEvent, targetDayId: string, targetExIndex: number) => {
        e.preventDefault()
        const data = e.dataTransfer.getData('application/json')
        if (!data) return
        const { dayId: sourceDayId, exIndex: sourceIndex } = JSON.parse(data)
        
        setBuilderDays(prev => {
            const next = [...prev]
            const sourceDay = next.find(d => d.id === sourceDayId)
            const targetDay = next.find(d => d.id === targetDayId)
            if (!sourceDay || !targetDay) return next

            const [moved] = sourceDay.exercises.splice(sourceIndex, 1)
            targetDay.exercises.splice(targetExIndex, 0, moved)
            return next
        })
    }

    if (builderState.isOpen) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full bg-(--bg-base) rounded-[24px] overflow-hidden -mt-2 sm:-mt-4 border border-(--border-subtle)">
                <div className="min-h-[72px] shrink-0 border-b border-(--border-subtle) bg-(--bg-surface) flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3 z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button onClick={() => setBuilderState((prev) => ({ ...prev, isOpen: false, programId: null }))} className="w-[36px] h-[36px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </button>
                        <input 
                            value={builderState.name}
                            onChange={(e) => setBuilderState({...builderState, name: e.target.value})}
                            className="font-display font-black text-[16px] sm:text-[18px] lg:text-[20px] bg-transparent border-none outline-none text-(--text-primary) w-[170px] sm:w-[240px] md:w-[300px]"
                            placeholder="Program Name"
                            defaultValue={builderState.name}
                        />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-[12px] sm:text-[13px] text-(--text-secondary) font-bold">Changes saved</span>
                        <button
                            onClick={() => {
                                void (async () => {
                                    const payload = {
                                        name: builderState.name || 'Untitled Program',
                                        difficulty: builderState.difficulty,
                                        length: builderState.length,
                                        cover: builderState.cover,
                                        builderDays,
                                    }

                                    if (builderState.programId) {
                                        await updateProgram(builderState.programId, payload)
                                        toast.success('Program updated.')
                                    } else {
                                        await addProgram(payload)
                                        toast.success('Program created.')
                                    }

                                    setBuilderState((prev) => ({ ...prev, isOpen: false, programId: null }))
                                })()
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-6 h-[40px] rounded-[12px] font-bold text-[13px] sm:text-[14px]"
                        >
                            Publish Program
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex gap-4 sm:gap-6 items-start overflow-x-auto">
                    {builderDays.map(day => (
                        <div key={day.id} className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] shadow-sm flex flex-col max-h-full">
                            <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between bg-[var(--bg-elevated)] rounded-t-[20px]">
                                <h4 className="font-display font-bold text-[16px]">{day.name}</h4>
                                <MoreVertical className="w-[16px] h-[16px] text-(--text-tertiary)" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[100px]"
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    // Drop at the end if dropping on the container
                                    if (e.target === e.currentTarget) {
                                        handleDrop(e, day.id, day.exercises.length)
                                    }
                                }}
                            >
                                {day.exercises.map((ex, i) => (
                                    <div 
                                        key={i} 
                                        draggable
                                        onDragStart={e => handleDragStart(e, day.id, i)}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => { e.stopPropagation(); handleDrop(e, day.id, i) }}
                                        className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] p-3 flex items-center gap-3 cursor-grab hover:border-emerald-500/50 transition-colors"
                                    >
                                        <div className="text-(--text-tertiary) cursor-grab active:cursor-grabbing"><GripVertical className="w-[16px] h-[16px]" /></div>
                                        <div>
                                            <span className="block font-bold text-[14px]">{ex}</span>
                                            <span className="block text-[12px] text-(--text-secondary)">3 sets x 10 reps</span>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setBuilderDays(prev => prev.map(d => d.id === day.id ? {...d, exercises: [...d.exercises, 'New Exercise']} : d))
                                    }}
                                    className="w-full h-[44px] rounded-[12px] border border-dashed border-(--border-subtle) flex items-center justify-center gap-2 text-(--text-secondary) font-bold text-[13px] hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors mt-2"
                                >
                                    <Plus className="w-[16px] h-[16px]" /> Add Exercise
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            setBuilderDays([...builderDays, {id: 'd' + Date.now(), name: `Day ${builderDays.length + 1}`, exercises: []}])
                        }}
                        className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 h-[60px] bg-(--bg-surface) border border-dashed border-(--border-subtle) rounded-[20px] flex items-center justify-center gap-2 text-(--text-secondary) font-bold text-[14px] hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors"
                    >
                        <Plus className="w-[18px] h-[18px]" /> Add Day
                    </button>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-subtle) pb-6">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Program Builder</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Create and manage your reusable workout templates and master programs.</p>
                </div>
                <button onClick={() => setBuilderState({isOpen: true, name: 'Untitled Program', programId: null, difficulty: 'Beginner', length: '4 Weeks', cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'})} className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2">
                    <Plus className="w-[18px] h-[18px]" /> Create Program
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
                {programs.map(p => (
                    <div key={p.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
                        <div className="h-[140px] relative overflow-hidden bg-[var(--bg-elevated)]">
                            <img src={p.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 bg-[var(--bg-surface)]/90 backdrop-blur-sm px-2.5 py-1 rounded-[8px] font-bold text-[11px] text-(--text-primary) shadow-sm border border-(--border-subtle)">
                                {p.enrolled} Enrolled
                            </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary) leading-tight mb-2 line-clamp-1">{p.name}</h3>
                            <div className="flex items-center gap-3 font-body text-[13px] font-medium text-(--text-secondary) mb-5">
                                <span className="bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[6px] border border-(--border-default)">{p.difficulty}</span>
                                <span>{p.length}</span>
                            </div>
                            
                            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    setBuilderDays(p.builderDays?.length ? p.builderDays : [
                                        {id: 'd1', name: 'Day 1', exercises: []}
                                    ])
                                    setBuilderState({
                                        isOpen: true,
                                        name: p.name,
                                        programId: p.id,
                                        difficulty: p.difficulty,
                                        length: p.length,
                                        cover: p.cover,
                                    })
                                }} className="flex-1 py-2 rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) font-bold text-[13px] text-(--text-primary) transition-colors flex items-center justify-center gap-1.5">
                                    <LayoutGrid className="w-[14px] h-[14px]" /> Edit
                                </button>
                                <button onClick={() => { void duplicateProgram(p.id); toast.success(`Duplicated ${p.name}`) }} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer" title="Duplicate">
                                    <Copy className="w-[16px] h-[16px]" />
                                </button>
                                <button onClick={() => setAssignModal({isOpen: true, programId: p.id})} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors cursor-pointer" title="Assign">
                                    <Send className="w-[16px] h-[16px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div onClick={() => setBuilderState({isOpen: true, name: 'Untitled Program', programId: null, difficulty: 'Beginner', length: '4 Weeks', cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'})} className="mt-8 bg-(--bg-surface) border border-dashed border-(--border-subtle) rounded-[24px] p-10 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-elevated)]/50 transition-colors cursor-pointer">
                <div className="w-[64px] h-[64px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                    <Plus className="w-[32px] h-[32px]" />
                </div>
                <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">Build a new program</h3>
                <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px]">Use our grid builder to map out mult-week training blocks with ease.</p>
            </div>

            <AnimatePresence>
                {assignModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setAssignModal({isOpen: false, programId: null}); setSelectedClients([]) }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-(--bg-surface) rounded-[24px] shadow-2xl relative z-10 flex flex-col border border-(--border-subtle)">
                            <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between pb-4 bg-[var(--bg-elevated)] rounded-t-[24px]">
                                <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Assign Program</h2>
                                <button onClick={() => { setAssignModal({isOpen: false, programId: null}); setSelectedClients([]) }} className="w-[32px] h-[32px] rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                    <input type="text" placeholder="Search clients..." className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-emerald-500" />
                                </div>
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {clients.map(client => (
                                        <label key={client.id} className="flex items-center justify-between p-3 rounded-[12px] hover:bg-[var(--bg-elevated)] cursor-pointer border border-transparent hover:border-(--border-subtle) transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedClients.includes(client.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedClients(prev => [...prev, client.id])
                                                        else setSelectedClients(prev => prev.filter(id => id !== client.id))
                                                    }}
                                                    className="w-[18px] h-[18px] rounded-[6px] border border-(--border-subtle) accent-emerald-500 cursor-pointer" 
                                                />
                                                <span className="font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                            </div>
                                            <span className="text-[12px] text-(--text-tertiary) uppercase tracking-wider font-bold">{client.plan}</span>
                                        </label>
                                    ))}
                                </div>
                                <button 
                                    disabled={selectedClients.length === 0}
                                    onClick={() => {
                                        if (!assignModal.programId) return
                                        void (async () => {
                                            await assignProgram(assignModal.programId!, selectedClients)
                                            toast.success(`Program assigned to ${selectedClients.length} clients`)
                                            setAssignModal({isOpen: false, programId: null})
                                            setSelectedClients([])
                                        })()
                                    }} 
                                    className="w-full h-[48px] rounded-[12px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[15px] shadow-sm transition-colors mt-2"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
