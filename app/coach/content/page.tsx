'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Video, Calendar, Edit3, Send, Utensils, Award, Users, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ContentPublisherPage() {
    const [composerTab, setComposerTab] = useState<'Post' | 'Video' | 'Meal' | 'Challenge'>('Post')
    const [postContent, setPostContent] = useState('')

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Content Publisher</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Publish to your subscribers' feed or public marketplace.</p>
            </div>

            {/* Composer */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                <div className="flex border-b border-(--border-subtle) bg-[var(--bg-elevated)] overflow-x-auto no-scrollbar">
                    {['Post', 'Video', 'Meal', 'Challenge'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setComposerTab(tab as any)}
                            className={cn("px-6 py-4 font-body font-bold text-[14px] transition-colors relative whitespace-nowrapflex items-center gap-2", composerTab === tab ? "text-(--text-primary) bg-(--bg-surface)" : "text-(--text-secondary) hover:text-(--text-primary)")}
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
                    {composerTab === 'Post' && (
                        <div className="flex flex-col gap-4">
                            <textarea 
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                placeholder="What's on your mind? Share tips, announcements, or motivation..."
                                className="w-full min-h-[120px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[15px] text-(--text-primary) outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            />
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const id = toast.loading('Uploading media...')
                                            setTimeout(() => toast.success('Media attached', { id }), 800)
                                        }}
                                        className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors"
                                    >
                                        <ImageIcon className="w-[20px] h-[20px]" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const id = toast.loading('Uploading video...')
                                            setTimeout(() => toast.success('Video attached', { id }), 1200)
                                        }}
                                        className="w-[40px] h-[40px] rounded-full hover:bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-emerald-500 flex items-center justify-center transition-colors"
                                    >
                                        <Video className="w-[20px] h-[20px]" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input type="checkbox" className="accent-emerald-500 w-[16px] h-[16px]" defaultChecked />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        disabled={!postContent.trim()}
                                        onClick={() => {
                                            const id = toast.loading('Publishing...')
                                            setTimeout(() => {
                                                toast.success('Successfully published to feed!', { id })
                                                setPostContent('')
                                            }, 800)
                                        }}
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
                                placeholder="Meal Plan Title (e.g. 7-Day High Protein Cut)"
                                className="w-full h-[52px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] px-4 font-display font-bold text-[16px] text-(--text-primary) outline-none focus:border-emerald-500"
                            />
                            <textarea 
                                placeholder="Description and macro goals..."
                                className="w-full h-[80px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[14px] text-(--text-primary) outline-none resize-none focus:border-emerald-500"
                            />
                            
                            <div className="border border-(--border-subtle) rounded-[16px] overflow-hidden">
                                <div className="bg-[var(--bg-elevated)] p-3 border-b border-(--border-subtle) font-bold text-[14px] text-(--text-primary)">
                                    Days Overview
                                </div>
                                <div className="p-4 flex flex-col gap-3 max-h-[240px] overflow-y-auto bg-(--bg-surface)">
                                    {[1, 2, 3].map(day => (
                                        <div key={day} className="p-3 border border-(--border-default) bg-[var(--bg-elevated)] rounded-[12px] hover:border-emerald-500 cursor-pointer transition-colors flex justify-between items-center group">
                                            <div>
                                                <span className="font-bold text-[14px] text-(--text-primary) block mb-0.5">Day {day}</span>
                                                <span className="text-[12px] text-(--text-secondary)">Breakfast, Lunch, Dinner • 2,400 kcal</span>
                                            </div>
                                            <button className="text-[12px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit Day</button>
                                        </div>
                                    ))}
                                    <button className="w-full py-2.5 rounded-[12px] border border-dashed border-(--border-subtle) font-bold text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] hover:border-emerald-500/50 transition-colors">
                                        + Add Day
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => toast('Previewing meal plan...')} className="h-[40px] px-6 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[13px] transition-colors cursor-pointer">
                                    Preview Plan
                                </button>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                                        <input type="checkbox" className="accent-emerald-500 w-[16px] h-[16px]" defaultChecked />
                                        <span className="font-body text-[13px] font-bold text-(--text-secondary)">Subscribers Only</span>
                                    </label>
                                    <button 
                                        onClick={() => {
                                            const id = toast.loading('Publishing Meal Plan...')
                                            setTimeout(() => toast.success('Meal plan published to feed!', { id }), 800)
                                        }}
                                        className="h-[40px] px-6 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm transition-colors cursor-pointer"
                                    >
                                        Publish Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UI parity for other tabs omitted for brevity */}
                    {(composerTab === 'Video' || composerTab === 'Challenge') && (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
                            <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">{composerTab} Builder</h3>
                            <p className="font-body text-[14px] text-(--text-secondary)">Switch to Post or Meal tab to test composer UI. Other tabs use similar layout.</p>
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
                            <input type="text" placeholder="Search posts..." className="h-[36px] pl-8 pr-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none w-[180px]" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {[
                            { title: 'The Truth About Carb Cycling', type: 'Post', views: '2.4k', likes: 342, date: 'Today' },
                            { title: 'Full Body Mobility Routine', type: 'Video', views: '5.1k', likes: 890, date: 'Yesterday' },
                            { title: 'High Protein Breakfast Recipes', type: 'Meal', views: '1.2k', likes: 156, date: 'Mar 4' },
                        ].map((post, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-(--border-subtle) rounded-[16px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-[48px] h-[48px] rounded-[10px] bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) group-hover:text-emerald-500 shadow-sm transition-colors">
                                        {post.type === 'Post' && <Edit3 className="w-[20px] h-[20px]" />}
                                        {post.type === 'Video' && <Video className="w-[20px] h-[20px]" />}
                                        {post.type === 'Meal' && <Utensils className="w-[20px] h-[20px]" />}
                                    </div>
                                    <div>
                                        <span className="block font-display font-bold text-[15px] text-(--text-primary)">{post.title}</span>
                                        <span className="block font-body text-[12px] text-(--text-secondary)">{post.date}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <span className="block font-body text-[12px] text-(--text-secondary)">Views</span>
                                        <span className="font-body text-[14px] font-bold text-(--text-primary)">{post.views}</span>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <span className="block font-body text-[12px] text-(--text-secondary)">Likes</span>
                                        <span className="font-body text-[14px] font-bold text-(--text-primary)">{post.likes}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="w-full lg:w-[320px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col">
                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-6 flex items-center gap-2"><Calendar className="w-[18px] h-[18px] text-emerald-500" /> Scheduled</h3>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500" />
                            <span className="font-body text-[12px] font-bold text-emerald-500 mb-1 block">Tomorrow • 9:00 AM</span>
                            <span className="font-display font-bold text-[15px] text-(--text-primary) leading-tight">Weekly Q&A Announcement</span>
                        </div>
                        <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) relative overflow-hidden opacity-70">
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-(--border-subtle)" />
                            <span className="font-body text-[12px] font-bold text-(--text-secondary) mb-1 block">Mar 10 • 12:00 PM</span>
                            <span className="font-display font-bold text-[15px] text-(--text-primary) leading-tight">Spring Cut Program Launch</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => toast('Opening date picker for scheduling...')}
                        className="w-full py-2.5 rounded-[12px] mt-4 border border-dashed border-(--border-subtle) text-(--text-secondary) font-bold text-[13px] hover:text-(--text-primary) hover:border-emerald-500 transition-colors"
                    >
                        + Schedule Content
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
