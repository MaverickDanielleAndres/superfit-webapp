'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Video, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function SchedulePage() {
    const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Week')
    const { events, fetchEvents, addScheduleEvent } = useCoachPortalStore()

    useEffect(() => {
        void fetchEvents()
    }, [fetchEvents])

    const filteredEvents = useMemo(() => {
        if (view === 'Day') {
            const today = new Date().toDateString()
            return events.filter((event) => new Date(event.startAt).toDateString() === today)
        }
        if (view === 'Week') {
            const now = new Date()
            const weekAhead = new Date(now)
            weekAhead.setDate(now.getDate() + 7)
            return events.filter((event) => {
                const start = new Date(event.startAt)
                return start >= now && start <= weekAhead
            })
        }
        return events
    }, [events, view])

    const handleEventClick = (e: React.MouseEvent, eventTitle: string) => {
        e.stopPropagation()
        toast.info(`Options for ${eventTitle}`, {
            action: {
                label: 'Join Call',
                onClick: () => toast.success(`Joined call for ${eventTitle}`),
            },
            cancel: {
                label: 'Reschedule',
                onClick: () => toast.success('Reschedule flow opened.'),
            },
        })
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Schedule</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your 1-on-1 calls, group sessions, and availability.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => toast.success('Availability settings saved.')} className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] shadow-sm transition-colors">
                        Set Availability
                    </button>
                    <button
                        onClick={() => {
                            void (async () => {
                                const start = new Date()
                                start.setMinutes(0, 0, 0)
                                start.setHours(start.getHours() + 1)
                                const end = new Date(start)
                                end.setMinutes(45)

                                await addScheduleEvent({
                                    title: 'New Coaching Session',
                                    type: '1-on-1',
                                    startAt: start.toISOString(),
                                    endAt: end.toISOString(),
                                })
                                toast.success('New event added to schedule.')
                            })()
                        }}
                        className="h-[40px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-[16px] h-[16px]" /> New Event
                    </button>
                </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-4">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Upcoming Events</h2>
                    <div className="flex bg-(--bg-surface) border border-(--border-default) rounded-[12px] p-1">
                        {['Day', 'Week', 'Month'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v as 'Day' | 'Week' | 'Month')}
                                className={cn("px-4 py-1.5 rounded-[8px] font-bold text-[13px] transition-colors", view === v ? "bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm border border-(--border-subtle)" : "text-(--text-secondary) hover:text-(--text-primary)")}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3 max-h-[520px] overflow-y-auto">
                    {filteredEvents.length === 0 && (
                        <div className="p-6 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-secondary) text-[14px]">
                            No events scheduled for this view.
                        </div>
                    )}

                    {filteredEvents.map((event) => (
                        <button
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event.title)}
                            className="text-left p-4 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-emerald-500 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-display font-bold text-[15px] text-(--text-primary)">{event.title}</span>
                                <span className={cn("px-2 py-1 rounded-[8px] text-[11px] font-bold uppercase tracking-wider", event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : event.status === 'cancelled' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600')}>{event.status}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[12px] text-(--text-secondary)">
                                <span className="flex items-center gap-1"><Clock className="w-[12px] h-[12px]" /> {event.time}</span>
                                <span className="flex items-center gap-1"><CalendarIcon className="w-[12px] h-[12px]" /> {new Date(event.startAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1">{event.type.toLowerCase().includes('video') ? <Video className="w-[12px] h-[12px]" /> : <Users className="w-[12px] h-[12px]" />} {event.type}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
