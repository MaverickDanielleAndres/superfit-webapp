'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Video, Calendar, Edit3, Utensils, Award, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'
import { requestApi } from '@/lib/api/client'

type ComposerTab = 'Post' | 'Video' | 'Meal' | 'Challenge'
type PublicationType = 'Post' | 'Video' | 'Meal' | 'Challenge'

interface PublicationItem {
    id: string
    title: string
    type: PublicationType
    date: string
    likes: number
    tags: string[]
}

interface MealDay {
    id: string
    title: string
    detail: string
}

export default function ContentPublisherPage() {
    const [composerTab, setComposerTab] = useState<ComposerTab>('Post')
    const [title, setTitle] = useState('')
    const [postContent, setPostContent] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [subscribersOnly, setSubscribersOnly] = useState(true)
    const [publications, setPublications] = useState<PublicationItem[]>([])
    const [scheduleTitle, setScheduleTitle] = useState('')
    const [search, setSearch] = useState('')
    const [mealDays, setMealDays] = useState<MealDay[]>([
        { id: 'd1', title: 'Day 1', detail: 'Breakfast, Lunch, Dinner • 2400 kcal' },
        { id: 'd2', title: 'Day 2', detail: 'Breakfast, Lunch, Dinner • 2300 kcal' },
    ])
    const sequenceRef = useRef(0)
    const { events, fetchEvents, addScheduleEvent } = useCoachPortalStore()

    const loadPublications = useCallback(async () => {
        try {
            const response = await requestApi<{
                publications: Array<{
                    id: string
                    title: string
                    type: PublicationType
                    createdAt: string
                    likes: number
                    tags?: string[]
                }>
            }>('/api/v1/coach/content?limit=20')

            setPublications(
                response.data.publications.map((publication) => ({
                    id: publication.id,
                    title: publication.title,
                    type: publication.type,
                    date: formatDateLabel(publication.createdAt),
                    likes: publication.likes,
                    tags: Array.isArray(publication.tags) ? publication.tags.map((tag) => String(tag)) : [],
                })),
            )
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }, [])

    useEffect(() => {
        void fetchEvents()
    }, [fetchEvents])

    useEffect(() => {
        void (async () => {
            if (!isSupabaseAuthEnabled()) return

            await loadPublications()
        })()
    }, [loadPublications])

    const filteredPublications = useMemo(
        () => publications.filter((post) => post.title.toLowerCase().includes(search.toLowerCase())),
        [publications, search],
    )

    const scheduledItems = useMemo(
        () => [...events]
            .filter((event) => event.type.toLowerCase().includes('content') || event.title.toLowerCase().includes('content'))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .slice(0, 4),
        [events],
    )

    const handlePublish = async () => {
        if (!title.trim() || !postContent.trim()) {
            toast.error('Title and description are required.')
            return
        }

        if (!isSupabaseAuthEnabled()) {
            sequenceRef.current += 1
            const mockItem: PublicationItem = {
                id: `local-${sequenceRef.current}`,
                title: title.trim(),
                type: composerTab,
                date: 'Just now',
                likes: 0,
                tags: tagInput
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
            }
            setPublications((current) => [mockItem, ...current])
            toast.success('Published locally (Supabase disabled).')
            resetComposer()
            return
        }

        try {
            const tags = tagInput
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)

            await requestApi<{ publication: { id: string } }>('/api/v1/coach/content', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description: postContent,
                    type: composerTab,
                    mediaUrl: mediaUrl || null,
                    subscribersOnly,
                    tags,
                    mealDays: mealDays.map((day) => ({ title: day.title, detail: day.detail })),
                }),
            })

            await loadPublications()
            toast.success('Content published successfully.')
            resetComposer()
        } catch (error) {
            toast.error(getErrorMessage(error))
            return
        }
    }

    const handleSchedule = async () => {
        const resolvedTitle = scheduleTitle.trim() || title.trim()
        if (!resolvedTitle) {
            toast.error('Add a title before scheduling content.')
            return
        }

        const start = new Date()
        start.setDate(start.getDate() + 1)
        start.setHours(9, 0, 0, 0)
        const end = new Date(start)
        end.setMinutes(30)

        await addScheduleEvent({
            title: `Content: ${resolvedTitle}`,
            type: 'Content',
            startAt: start.toISOString(),
            endAt: end.toISOString(),
        })

        setScheduleTitle('')
        toast.success('Content slot added to your schedule.')
    }

    const resetComposer = () => {
        setTitle('')
        setPostContent('')
        setMediaUrl('')
        setTagInput('')
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Content Publisher</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Publish to your subscribers&apos; feed or public marketplace.</p>
            </div>

            {/* Composer */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                <div className="flex border-b border-(--border-subtle) bg-[var(--bg-elevated)] overflow-x-auto no-scrollbar">
                    {['Post', 'Video', 'Meal', 'Challenge'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setComposerTab(tab as ComposerTab)}
                            className={cn(
                                'px-6 py-4 font-body font-bold text-[14px] transition-colors relative whitespace-nowrap flex items-center gap-2',
                                composerTab === tab ? 'text-(--text-primary) bg-(--bg-surface)' : 'text-(--text-secondary) hover:text-(--text-primary)',
                            )}
                        >
                            {tab === 'Post' && <Edit3 className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Video' && <Video className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Meal' && <Utensils className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab === 'Challenge' && <Award className="w-[16px] h-[16px] inline-block mr-2" />}
                            {tab}
                            {composerTab === tab && <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {(composerTab === 'Post' || composerTab === 'Video' || composerTab === 'Challenge') && (
                        <div className="flex flex-col gap-4">
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder={`${composerTab} title`}
                                className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[14px] px-4 font-display font-bold text-[15px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <textarea 
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                placeholder="Write your publication details, key takeaways, and call to action..."
                                className="w-full min-h-[120px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[15px] text-(--text-primary) outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            />
                            {!!mediaUrl && (
                                <div className="text-[13px] text-(--text-secondary)">
                                    Attached media: <span className="font-bold text-(--text-primary)">{mediaUrl}</span>
                                </div>
                            )}
                            <input
                                value={tagInput}
                                onChange={(event) => setTagInput(event.target.value)}
                                placeholder="Tags (comma separated): hypertrophy, mobility"
                                className="w-full h-[44px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[14px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const nextUrl = window.prompt('Paste image URL')
                                            if (nextUrl) setMediaUrl(nextUrl)
                                        }}
                                        className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors"
                                    >
                                        <ImageIcon className="w-[20px] h-[20px]" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const nextUrl = window.prompt('Paste video URL')
                                            if (nextUrl) setMediaUrl(nextUrl)
                                        }}
                                        className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors"
                                    >
                                        <Video className="w-[20px] h-[20px]" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input
                                            type="checkbox"
                                            className="accent-emerald-500 w-[16px] h-[16px]"
                                            checked={subscribersOnly}
                                            onChange={(event) => setSubscribersOnly(event.target.checked)}
                                        />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        disabled={!title.trim() || !postContent.trim()}
                                        onClick={() => { void handlePublish() }}
                                        className="h-[40px] px-6 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[14px] flex items-center gap-2 shadow-sm transition-colors"
                                    >
                                        Post Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {composerTab === 'Meal' && (
                        <div className="flex flex-col gap-4">
                            <input 
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Meal Plan Title (e.g. 7-Day High Protein Cut)"
                                className="w-full h-[52px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] px-4 font-display font-bold text-[16px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <textarea 
                                value={postContent}
                                onChange={(event) => setPostContent(event.target.value)}
                                placeholder="Description and macro goals..."
                                className="w-full h-[80px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[14px] text-(--text-primary) outline-none resize-none focus:border-emerald-500"
                            />
                            
                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden">
                                <div className="bg-[var(--bg-elevated)] p-3 border-b border-(--border-subtle) font-bold text-[14px] text-(--text-primary)">
                                    Days Overview
                                </div>
                                <div className="p-4 flex flex-col gap-3 max-h-[240px] overflow-y-auto bg-(--bg-surface)">
                                    {mealDays.map((day) => (
                                        <div key={day.id} className="p-3 border border-(--border-default) bg-[var(--bg-elevated)] rounded-[12px] hover:border-emerald-500 transition-colors flex justify-between items-center group">
                                            <div>
                                                <span className="font-bold text-[14px] text-(--text-primary) block mb-0.5">{day.title}</span>
                                                <span className="text-[12px] text-(--text-secondary)">{day.detail}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setMealDays((current) => current.filter((item) => item.id !== day.id))
                                                }}
                                                className="text-[12px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const nextIndex = mealDays.length + 1
                                            sequenceRef.current += 1
                                            setMealDays((current) => [
                                                ...current,
                                                {
                                                    id: `d-${sequenceRef.current}`,
                                                    title: `Day ${nextIndex}`,
                                                    detail: 'Breakfast, Lunch, Dinner • 2200 kcal',
                                                },
                                            ])
                                        }}
                                        className="w-full py-2.5 rounded-[12px] border border-dashed border-(--border-subtle) font-bold text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] hover:border-emerald-500/50 transition-colors"
                                    >
                                        + Add Day
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => toast.info('Meal plan preview available in the feed after publish.')} className="h-[40px] px-6 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[13px] transition-colors cursor-pointer">
                                    Preview Plan
                                </button>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input
                                            type="checkbox"
                                            className="accent-emerald-500 w-[16px] h-[16px]"
                                            checked={subscribersOnly}
                                            onChange={(event) => setSubscribersOnly(event.target.checked)}
                                        />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        onClick={() => { void handlePublish() }}
                                        className="h-[40px] px-6 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm transition-colors cursor-pointer"
                                    >
                                        Publish Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Calendar / Recent Posts */}
            <div className="flex flex-col lg:flex-row gap-6 mt-4">
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Recent Publications</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-(--text-tertiary)" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                type="text"
                                placeholder="Search posts..."
                                className="h-[36px] pl-8 pr-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none w-[180px]"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {filteredPublications.map((post) => (
                            <div key={post.id} className="flex items-center justify-between p-4 border border-(--border-subtle) rounded-[16px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-[48px] h-[48px] rounded-[10px] bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) group-hover:text-emerald-500 shadow-sm transition-colors">
                                        {post.type === 'Post' && <Edit3 className="w-[20px] h-[20px]" />}
                                        {post.type === 'Video' && <Video className="w-[20px] h-[20px]" />}
                                        {post.type === 'Meal' && <Utensils className="w-[20px] h-[20px]" />}
                                        {post.type === 'Challenge' && <Award className="w-[20px] h-[20px]" />}
                                    </div>
                                    <div>
                                        <span className="block font-display font-bold text-[15px] text-(--text-primary)">{post.title}</span>
                                        <span className="block font-body text-[12px] text-(--text-secondary)">{post.date}</span>
                                        {post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {post.tags.slice(0, 4).map((tag) => (
                                                    <span
                                                        key={`${post.id}-${tag}`}
                                                        className="px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-600"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <span className="block font-body text-[12px] text-(--text-secondary)">Likes</span>
                                        <span className="font-body text-[14px] font-bold text-(--text-primary)">{post.likes}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredPublications.length === 0 && (
                            <div className="p-4 border border-dashed border-(--border-subtle) rounded-[16px] text-[13px] text-(--text-secondary)">
                                No published content found.
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="w-full lg:w-[320px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-6 flex items-center gap-2"><Calendar className="w-[18px] h-[18px] text-emerald-500" /> Scheduled</h3>
                    <div className="flex flex-col gap-4 flex-1">
                        {scheduledItems.map((item) => (
                            <div key={item.id} className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500" />
                                <span className="font-body text-[12px] font-bold text-emerald-500 mb-1 block">{formatDateLabel(item.startAt)}</span>
                                <span className="font-display font-bold text-[15px] text-(--text-primary) leading-tight">{item.title}</span>
                            </div>
                        ))}
                        {scheduledItems.length === 0 && (
                            <div className="p-4 rounded-[16px] border border-dashed border-(--border-subtle) text-[13px] text-(--text-secondary)">
                                No scheduled content events yet.
                            </div>
                        )}
                    </div>
                    <input
                        value={scheduleTitle}
                        onChange={(event) => setScheduleTitle(event.target.value)}
                        placeholder="Content title for tomorrow"
                        className="w-full h-[38px] mt-4 px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                    />
                    <button 
                        onClick={() => { void handleSchedule() }}
                        className="w-full py-2.5 rounded-[12px] mt-4 border border-dashed border-(--border-subtle) text-(--text-secondary) font-bold text-[13px] hover:text-(--text-primary) hover:border-emerald-500 transition-colors"
                    >
                        + Schedule Content
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

function formatDateLabel(isoDate: string): string {
    const date = new Date(isoDate)
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}
