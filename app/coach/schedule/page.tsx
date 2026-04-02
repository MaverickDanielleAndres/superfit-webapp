'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Video, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SchedulePage() {
    const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Week')

    const events = [
        { id: '1', title: 'Check-in: Jake Mitchell', time: '09:00 AM - 09:30 AM', type: '1-on-1', color: 'bg-emerald-500' },
        { id: '2', title: 'Group Demo: Deadlift Mechanics', time: '11:00 AM - 12:00 PM', type: 'Group', color: 'bg-blue-500' },
        { id: '3', title: 'Client Onboarding: Sarah T.', time: '02:00 PM - 02:45 PM', type: 'Video', color: 'bg-purple-500' },
        { id: '4', title: 'Weekly Q&A Live', time: '05:00 PM - 06:00 PM', type: 'Group', color: 'bg-[var(--status-warning)]' },
    ]

    const handleEventClick = (e: React.MouseEvent, eventTitle: string) => {
        e.stopPropagation();
        toast.info(`Options for ${eventTitle}`, {
            action: {
                label: 'Join Call',
                onClick: () => toast.success(`Joined call for ${eventTitle}`)
            },
            cancel: {
                label: 'Reschedule',
                onClick: () => toast('Opening rescheduling options...')
            }
        });
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Schedule</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your 1-on-1 calls, group sessions, and availability.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => toast('Opening availability settings...')} className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] shadow-sm transition-colors">
                        Set Availability
                    </button>
                    <button onClick={() => toast('Opening New Event modal...')} className="h-[40px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2">
                        <Plus className="w-[16px] h-[16px]" /> New Event
                    </button>
                </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm flex flex-col h-[600px] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <button className="w-[32px] h-[32px] rounded-[8px] hover:bg-(--border-subtle) flex items-center justify-center text-(--text-secondary) transition-colors"><ChevronLeft className="w-[18px] h-[18px]" /></button>
                            <button className="w-[32px] h-[32px] rounded-[8px] hover:bg-(--border-subtle) flex items-center justify-center text-(--text-secondary) transition-colors"><ChevronRight className="w-[18px] h-[18px]" /></button>
                        </div>
                        <h2 className="font-display font-bold text-[18px] text-(--text-primary)">March 2024</h2>
                    </div>

                    <div className="flex bg-(--bg-surface) border border-(--border-default) rounded-[12px] p-1">
                        {['Day', 'Week', 'Month'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={cn("px-4 py-1.5 rounded-[8px] font-bold text-[13px] transition-colors", view === v ? "bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm border border-(--border-subtle)" : "text-(--text-secondary) hover:text-(--text-primary)")}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calendar Body (Mocked Week View) */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Time Gutter */}
                    <div className="w-[60px] border-r border-(--border-subtle) flex flex-col items-center py-4 gap-[40px] bg-[var(--bg-elevated)]/30 font-body text-[11px] text-(--text-tertiary) font-bold">
                        <span>8 AM</span>
                        <span>9 AM</span>
                        <span>10 AM</span>
                        <span>11 AM</span>
                        <span>12 PM</span>
                        <span>1 PM</span>
                        <span>2 PM</span>
                        <span>3 PM</span>
                        <span>4 PM</span>
                        <span>5 PM</span>
                        <span>6 PM</span>
                    </div>

                    {/* Day Columns */}
                    <div className="flex-1 grid grid-cols-7 divide-x divide-(--border-subtle) overflow-y-auto relative py-4">
                        {/* Mock Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-4 opacity-30">
                            {[...Array(11)].map((_, i) => <div key={i} className="w-full h-[1px] bg-(--border-subtle)" />)}
                        </div>

                        {['Mon 4', 'Tue 5', 'Wed 6', 'Thu 7', 'Fri 8', 'Sat 9', 'Sun 10'].map((day, i) => (
                            <div key={day} className="flex flex-col relative h-[500px]">
                                <div className="text-center pb-4 border-b border-(--border-subtle)">
                                    <span className={cn("font-body text-[13px] font-bold block", i === 1 ? 'text-emerald-500' : 'text-(--text-secondary)')}>{day.split(' ')[0]}</span>
                                    <span className={cn("font-display text-[20px] font-black block mt-1", i === 1 ? 'text-emerald-500' : 'text-(--text-primary)')}>{day.split(' ')[1]}</span>
                                </div>
                                
                                {/* Mock Events mapped to arbitrary positions for visual */}
                                {i === 1 && (
                                    <>
                                        <div onClick={(e) => handleEventClick(e, events[0].title)} className="absolute top-[80px] left-2 right-2 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 p-2 border-l-4 border-l-emerald-500 hover:scale-[1.02] cursor-pointer transition-transform">
                                            <span className="font-display font-bold text-[11px] text-emerald-600 block leading-tight">{events[0].title}</span>
                                            <span className="font-body text-[10px] text-emerald-600/70 block mt-1">{events[0].time}</span>
                                        </div>
                                        <div onClick={(e) => handleEventClick(e, events[1].title)} className="absolute top-[160px] left-2 right-2 h-[80px] rounded-[8px] bg-blue-500/10 border border-blue-500/20 p-2 border-l-4 border-l-blue-500 hover:scale-[1.02] cursor-pointer transition-transform">
                                            <span className="font-display font-bold text-[11px] text-blue-600 block leading-tight">{events[1].title}</span>
                                            <span className="font-body text-[10px] text-blue-600/70 block mt-1">{events[1].time}</span>
                                        </div>
                                    </>
                                )}
                                {i === 3 && (
                                    <div onClick={(e) => handleEventClick(e, events[2].title)} className="absolute top-[280px] left-2 right-2 rounded-[8px] bg-purple-500/10 border border-purple-500/20 p-2 border-l-4 border-l-purple-500 hover:scale-[1.02] cursor-pointer transition-transform">
                                        <span className="font-display font-bold text-[11px] text-purple-600 block leading-tight">{events[2].title}</span>
                                        <span className="font-body text-[10px] text-purple-600/70 block mt-1 flex items-center gap-1"><Video className="w-[10px] h-[10px]" /> {events[2].time}</span>
                                    </div>
                                )}
                                {i === 4 && (
                                    <div onClick={(e) => handleEventClick(e, events[3].title)} className="absolute top-[400px] left-2 right-2 h-[60px] rounded-[8px] bg-[var(--status-warning-bg)]/30 border border-[var(--status-warning-bg)] p-2 border-l-4 border-l-[var(--status-warning)] hover:scale-[1.02] cursor-pointer transition-transform">
                                        <span className="font-display font-bold text-[11px] text-[var(--status-warning)] block leading-tight">{events[3].title}</span>
                                        <span className="font-body text-[10px] text-[var(--status-warning)]/70 block mt-1 flex items-center gap-1"><Users className="w-[10px] h-[10px]" /> {events[3].time}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
