'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Video, Users, Plus, CheckCircle2, Ban, TimerReset, Trash2, CalendarDays, ImagePlus, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ScheduleView = 'Day' | 'Week' | 'Month'

export default function SchedulePage() {
    const [view, setView] = useState<ScheduleView>('Week')
    const [dateFilter, setDateFilter] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newEventDate, setNewEventDate] = useState(defaultEventDate())
    const [newEventTime, setNewEventTime] = useState(defaultEventTime())
    const [newEventDurationMinutes, setNewEventDurationMinutes] = useState(45)
    const [newEventTitle, setNewEventTitle] = useState('')
    const [newEventLabel, setNewEventLabel] = useState('')
    const [newEventType, setNewEventType] = useState('1-on-1')
    const [newEventImageUrl, setNewEventImageUrl] = useState('')
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [activeActionId, setActiveActionId] = useState<string | null>(null)
    const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)
    const imageInputRef = React.useRef<HTMLInputElement>(null)
    const {
        events,
        fetchEvents,
        addScheduleEvent,
        rescheduleEvent,
        updateScheduleEventStatus,
        deleteScheduleEvent,
    } = useCoachPortalData()

    useEffect(() => {
        void fetchEvents()
    }, [fetchEvents])

    const uploadScheduleImage = async (file: File) => {
        setIsUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', 'schedule')

            const response = await requestApi<{ url: string }>('/api/v1/coach/media/upload', {
                method: 'POST',
                body: formData,
            })

            setNewEventImageUrl(String(response.data.url || ''))
            toast.success('Schedule image uploaded.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to upload image.')
        } finally {
            setIsUploadingImage(false)
        }
    }

    const openConfirmation = (
        dialog: { title: string; message: string; confirmText: string; tone?: 'default' | 'danger' },
        action: () => Promise<void>,
    ) => {
        setConfirmDialog({
            title: dialog.title,
            message: dialog.message,
            confirmText: dialog.confirmText,
            tone: dialog.tone || 'default',
        })
        setPendingConfirmationAction(() => action)
    }

    const closeConfirmation = () => {
        if (isConfirming) return
        setConfirmDialog(null)
        setPendingConfirmationAction(null)
    }

    const runConfirmedAction = async () => {
        if (!pendingConfirmationAction) return

        setIsConfirming(true)
        try {
            await pendingConfirmationAction()
            setConfirmDialog(null)
            setPendingConfirmationAction(null)
        } finally {
            setIsConfirming(false)
        }
    }

    const filteredEvents = useMemo(() => {
        const now = new Date()

        return events.filter((event) => {
            const start = new Date(event.startAt)

            if (dateFilter) {
                const selectedDate = new Date(`${dateFilter}T00:00:00`)
                const selectedDateKey = selectedDate.toDateString()
                if (start.toDateString() !== selectedDateKey) {
                    return false
                }
            }

            if (view === 'Day') {
                const targetDay = dateFilter ? new Date(`${dateFilter}T00:00:00`) : now
                return start.toDateString() === targetDay.toDateString()
            }

            if (view === 'Week') {
                const startBoundary = dateFilter ? new Date(`${dateFilter}T00:00:00`) : now
                const endBoundary = new Date(startBoundary)
                endBoundary.setDate(startBoundary.getDate() + 7)
                return start >= startBoundary && start <= endBoundary
            }

            if (!dateFilter) return true
            return start.getMonth() === new Date(`${dateFilter}T00:00:00`).getMonth()
        })
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    }, [dateFilter, events, view])

    const handleCreateEvent = async () => {
        const title = newEventTitle.trim()
        if (!title) {
            toast.error('Event title is required.')
            return
        }

        const start = new Date(`${newEventDate}T${newEventTime}:00`)
        if (!Number.isFinite(start.getTime())) {
            toast.error('Pick a valid date and time first.')
            return
        }

        const duration = Math.max(15, Math.min(180, Math.round(Number(newEventDurationMinutes) || 45)))
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + duration)

        await addScheduleEvent({
            title,
            label: newEventLabel.trim() || undefined,
            type: newEventType,
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            status: 'scheduled',
            imageUrl: newEventImageUrl || null,
        })

        toast.success('Event added to schedule.')
        setNewEventTitle('')
        setNewEventLabel('')
        setNewEventImageUrl('')
        setIsCreateModalOpen(false)
    }

    const handlePostpone = async (eventId: string, startAt: string, endAt: string) => {
        setActiveActionId(`${eventId}-postpone`)
        try {
            const nextStart = new Date(startAt)
            const nextEnd = new Date(endAt)
            nextStart.setDate(nextStart.getDate() + 1)
            nextEnd.setDate(nextEnd.getDate() + 1)

            await rescheduleEvent(eventId, {
                startAt: nextStart.toISOString(),
                endAt: nextEnd.toISOString(),
            })
            await updateScheduleEventStatus(eventId, 'postponed')
            toast.success(`Event postponed to ${nextStart.toLocaleDateString()}.`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to postpone event.')
        } finally {
            setActiveActionId(null)
        }
    }

    const handleStatusUpdate = async (eventId: string, status: 'completed' | 'cancelled') => {
        setActiveActionId(`${eventId}-${status}`)
        try {
            await updateScheduleEventStatus(eventId, status)
            toast.success(status === 'completed' ? 'Event marked completed.' : 'Event cancelled.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to update event status.')
        } finally {
            setActiveActionId(null)
        }
    }

    const handleDeleteEvent = async (eventId: string) => {
        setActiveActionId(`${eventId}-delete`)
        try {
            await deleteScheduleEvent(eventId)
            toast.success('Event deleted.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to delete event.')
        } finally {
            setActiveActionId(null)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Schedule</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your 1-on-1 calls, group sessions, and availability.</p>
                </div>
                <button
                    onClick={() => {
                        setNewEventType('Availability')
                        setNewEventTitle('Availability Window')
                        setNewEventLabel('Open Slots')
                        setNewEventDurationMinutes(480)
                        const availability = defaultAvailabilityDateTime()
                        setNewEventDate(availability.date)
                        setNewEventTime(availability.time)
                        setIsCreateModalOpen(true)
                    }}
                    className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] hover:bg-[var(--bg-surface-alt)] shadow-sm transition-colors"
                >
                    Set Availability
                </button>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-[40px] px-4 rounded-[12px] bg-emerald-500 text-white font-bold text-[13px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-[16px] h-[16px]" /> New Event
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Upcoming Events</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-(--bg-surface) border border-(--border-default) rounded-[12px] p-1">
                            {['Day', 'Week', 'Month'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v as ScheduleView)}
                                    className={cn('px-4 py-1.5 rounded-[8px] font-bold text-[13px] transition-colors', view === v ? 'bg-[var(--bg-elevated)] text-(--text-primary) shadow-sm border border-(--border-subtle)' : 'text-(--text-secondary) hover:text-(--text-primary)')}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-(--text-tertiary)" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(event) => setDateFilter(event.target.value)}
                                className="h-[36px] pl-7 pr-2 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[12px] text-(--text-primary) outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3 max-h-[560px] overflow-y-auto">
                    {filteredEvents.length === 0 && (
                        <div className="p-6 rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-secondary) text-[14px]">
                            No events scheduled for this view.
                        </div>
                    )}

                    {filteredEvents.map((event) => (
                        <div key={event.id} className="text-left p-4 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-emerald-500/50 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {event.imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setExpandedImageUrl(event.imageUrl || null)}
                                            className="w-[44px] h-[44px] rounded-[10px] overflow-hidden border border-(--border-default) shrink-0"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={event.imageUrl} alt={`${event.title} cover`} className="w-full h-full object-cover" />
                                        </button>
                                    )}
                                    <div className="min-w-0">
                                        <span className="font-display font-bold text-[15px] text-(--text-primary) block truncate">{event.title}</span>
                                        {event.label && <span className="text-[12px] text-(--text-secondary)">{event.label}</span>}
                                    </div>
                                </div>
                                <span className={cn('px-2 py-1 rounded-[8px] text-[11px] font-bold uppercase tracking-wider', event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : event.status === 'cancelled' ? 'bg-red-500/10 text-red-600' : event.status === 'postponed' ? 'bg-amber-500/10 text-amber-700' : 'bg-blue-500/10 text-blue-600')}>
                                    {event.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-[12px] text-(--text-secondary)">
                                <span className="flex items-center gap-1"><Clock className="w-[12px] h-[12px]" /> {event.time}</span>
                                <span className="flex items-center gap-1"><CalendarIcon className="w-[12px] h-[12px]" /> {new Date(event.startAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1">{event.type.toLowerCase().includes('video') ? <Video className="w-[12px] h-[12px]" /> : <Users className="w-[12px] h-[12px]" />} {event.type}</span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {event.status !== 'completed' && (
                                    <button
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Mark Event Complete?',
                                                    message: 'This will update the event status to completed.',
                                                    confirmText: 'Mark Complete',
                                                },
                                                async () => {
                                                    await handleStatusUpdate(event.id, 'completed')
                                                },
                                            )
                                        }}
                                        disabled={activeActionId === `${event.id}-completed`}
                                        className="h-[30px] px-3 rounded-[8px] text-[11px] font-bold border border-emerald-500/40 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-1"
                                    >
                                        <CheckCircle2 className="w-[12px] h-[12px]" /> Complete
                                    </button>
                                )}

                                {event.status !== 'cancelled' && (
                                    <button
                                        onClick={() => {
                                            openConfirmation(
                                                {
                                                    title: 'Cancel Event?',
                                                    message: 'This marks the event as cancelled. You can still edit or reschedule it later.',
                                                    confirmText: 'Cancel Event',
                                                    tone: 'danger',
                                                },
                                                async () => {
                                                    await handleStatusUpdate(event.id, 'cancelled')
                                                },
                                            )
                                        }}
                                        disabled={activeActionId === `${event.id}-cancelled`}
                                        className="h-[30px] px-3 rounded-[8px] text-[11px] font-bold border border-red-500/40 text-red-600 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1"
                                    >
                                        <Ban className="w-[12px] h-[12px]" /> Cancel
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        openConfirmation(
                                            {
                                                title: 'Postpone Event?',
                                                message: 'This will move the event to the next day and set status to postponed.',
                                                confirmText: 'Postpone',
                                            },
                                            async () => {
                                                await handlePostpone(event.id, event.startAt, event.endAt)
                                            },
                                        )
                                    }}
                                    disabled={activeActionId === `${event.id}-postpone`}
                                    className="h-[30px] px-3 rounded-[8px] text-[11px] font-bold border border-amber-500/40 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 flex items-center gap-1"
                                >
                                    <TimerReset className="w-[12px] h-[12px]" /> Postpone
                                </button>

                                <button
                                    onClick={() => {
                                        openConfirmation(
                                            {
                                                title: 'Delete Event?',
                                                message: 'This action is permanent and cannot be undone.',
                                                confirmText: 'Delete Event',
                                                tone: 'danger',
                                            },
                                            async () => {
                                                await handleDeleteEvent(event.id)
                                            },
                                        )
                                    }}
                                    disabled={activeActionId === `${event.id}-delete`}
                                    className="h-[30px] px-3 rounded-[8px] text-[11px] font-bold border border-(--border-default) text-(--text-primary) bg-(--bg-surface) hover:bg-[var(--bg-surface-alt)] flex items-center gap-1"
                                >
                                    <Trash2 className="w-[12px] h-[12px]" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-[20px] border border-(--border-subtle) bg-(--bg-surface) shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                            <div>
                                <h2 className="font-display font-bold text-[18px] text-(--text-primary)">Create Event</h2>
                                <p className="text-[12px] text-(--text-secondary)">Set title, label, date, time, type, and an optional cover image.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-[34px] h-[34px] rounded-[10px] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide md:col-span-2">
                                Title
                                <input
                                    value={newEventTitle}
                                    onChange={(event) => setNewEventTitle(event.target.value)}
                                    placeholder="Session title (required)"
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                Label
                                <input
                                    value={newEventLabel}
                                    onChange={(event) => setNewEventLabel(event.target.value)}
                                    placeholder="Leg day, Check-in, Strategy"
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                Type
                                <select
                                    value={newEventType}
                                    onChange={(event) => setNewEventType(event.target.value)}
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                >
                                    <option value="1-on-1">1-on-1</option>
                                    <option value="Group">Group</option>
                                    <option value="Video Call">Video Call</option>
                                    <option value="Content">Content</option>
                                    <option value="Availability">Availability</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                Date
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(event) => setNewEventDate(event.target.value)}
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide">
                                Time
                                <input
                                    type="time"
                                    value={newEventTime}
                                    onChange={(event) => setNewEventTime(event.target.value)}
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide md:col-span-2">
                                Duration (minutes)
                                <input
                                    type="number"
                                    min={15}
                                    max={720}
                                    step={15}
                                    value={newEventDurationMinutes}
                                    onChange={(event) => setNewEventDurationMinutes(Number(event.target.value || 45))}
                                    className="h-[42px] px-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                                />
                            </label>

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    if (!file) return
                                    void uploadScheduleImage(file)
                                    event.target.value = ''
                                }}
                            />

                            <div
                                className="md:col-span-2 rounded-[14px] border border-dashed border-(--border-subtle) bg-[var(--bg-elevated)] p-3 flex items-center justify-between gap-3"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    event.preventDefault()
                                    const file = event.dataTransfer.files?.[0]
                                    if (!file) return
                                    void uploadScheduleImage(file)
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-[36px] h-[36px] rounded-[10px] bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary)">
                                        <UploadCloud className="w-[18px] h-[18px]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[13px] text-(--text-primary)">Event image</p>
                                        <p className="text-[12px] text-(--text-secondary)">{isUploadingImage ? 'Uploading...' : 'Drag and drop, or browse image.'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="h-[34px] px-3 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[12px] font-bold text-(--text-primary)"
                                >
                                    Browse
                                </button>
                            </div>

                            {newEventImageUrl && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedImageUrl(newEventImageUrl)}
                                    className="md:col-span-2 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-2 text-left"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={newEventImageUrl} alt="Event preview" className="w-full h-[180px] object-cover rounded-[10px]" />
                                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-(--text-secondary)"><ImagePlus className="w-[13px] h-[13px]" /> Click to enlarge</span>
                                </button>
                            )}
                        </div>

                        <div className="p-4 border-t border-(--border-subtle) flex items-center justify-end gap-2">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="h-[38px] px-4 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary)"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    openConfirmation(
                                        {
                                            title: 'Create Event?',
                                            message: 'This will add the new schedule event and notify linked clients when applicable.',
                                            confirmText: 'Create Event',
                                        },
                                        async () => {
                                            await handleCreateEvent()
                                        },
                                    )
                                }}
                                className="h-[38px] px-4 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {expandedImageUrl && (
                <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => setExpandedImageUrl(null)}>
                    <button type="button" className="absolute top-4 right-4 w-[36px] h-[36px] rounded-[10px] bg-white/10 text-white flex items-center justify-center">
                        <X className="w-[16px] h-[16px]" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={expandedImageUrl} alt="Expanded schedule preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-[12px]" />
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                title={confirmDialog?.title || 'Confirm Action'}
                message={confirmDialog?.message || ''}
                confirmText={confirmDialog?.confirmText || 'Confirm'}
                tone={confirmDialog?.tone || 'default'}
                isLoading={isConfirming}
                onCancel={closeConfirmation}
                onConfirm={() => {
                    void runConfirmedAction()
                }}
            />
        </motion.div>
    )
}

function defaultEventDate(): string {
    const date = new Date()
    date.setMinutes(0, 0, 0)
    date.setHours(date.getHours() + 1)
    return toDateInputValue(date)
}

function defaultEventTime(): string {
    const date = new Date()
    date.setMinutes(0, 0, 0)
    date.setHours(date.getHours() + 1)
    return toTimeInputValue(date)
}

function defaultAvailabilityDateTime(): { date: string; time: string } {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setHours(8, 0, 0, 0)
    return {
        date: toDateInputValue(date),
        time: toTimeInputValue(date),
    }
}

function toDateInputValue(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeInputValue(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
