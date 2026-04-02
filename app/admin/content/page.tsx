'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Flag, Trash2, Check, Video, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState('All Reports')

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Content Moderation</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Review flagged content, posts, and form check videos.</p>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 mb-6 flex items-center gap-4 bg-[var(--status-warning-bg)]/10 border-[var(--status-warning-bg)]">
                <div className="w-[48px] h-[48px] rounded-full bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)] flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-[24px] h-[24px]" />
                </div>
                <div>
                    <h3 className="font-display font-bold text-[16px] text-(--text-primary)">12 Items Require Review</h3>
                    <p className="font-body text-[13px] text-(--text-secondary)">Content flagged by users or automated filters needs your attention.</p>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                {['All Reports', 'Images', 'Videos', 'Text Posts'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={cn("whitespace-nowrap px-4 py-2 rounded-full font-bold text-[13px] transition-colors border", 
                        activeTab === tab ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)")}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                        <div className="h-[200px] bg-[var(--bg-elevated)] relative flex items-center justify-center">
                            {i === 1 && <img src="https://images.unsplash.com/photo-1534438327276-[14e6300c3a26?w=400&fit=crop](https://images.unsplash.com/photo-1534438327276-(14e6300c3a26?w=400&fit=crop))" className="w-full h-full object-cover" />}
                            {i === 2 && <Video className="w-[48px] h-[48px] text-(--text-tertiary)" />}
                            {i === 3 && <div className="p-6 font-body text-[14px] text-(--text-primary) italic">"This is heavily flagged text content from a community post..."</div>}
                            
                            <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[11px] px-2 py-1 rounded-[6px] shadow-sm flex items-center gap-1 uppercase tracking-wider">
                                <Flag className="w-[12px] h-[12px]" /> Flagged
                            </div>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4 flex-1">
                            <div>
                                <h4 className="font-display font-bold text-[15px] text-(--text-primary)">
                                    {i === 1 ? 'Inappropriate Image' : i === 2 ? 'Video Guidelines Violation' : 'Hate Speech Detection'}
                                </h4>
                                <span className="text-[12px] text-(--text-secondary)">Posted by <span className="font-bold">User_{Math.random().toString(36).substr(2, 5)}</span> • 2 hours ago</span>
                            </div>
                            
                            <p className="font-body text-[13px] text-(--text-secondary) bg-[var(--bg-elevated)] p-3 rounded-[12px] border border-(--border-default) mt-auto">
                                <span className="font-bold block mb-1">Reason:</span>
                                Multiple users reported this content for violating community standards.
                            </p>

                            <div className="flex flex-col gap-2 pt-2 mt-auto">
                                <div className="flex gap-2">
                                    <button onClick={() => toast.error('Content removed')} className="flex-1 h-[36px] rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-red-500/30">
                                        <Trash2 className="w-[14px] h-[14px]" /> Remove
                                    </button>
                                    <button onClick={() => toast.success('Report dismissed')} className="flex-1 h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5">
                                        <Check className="w-[14px] h-[14px]" /> Dismiss
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.warning('Warning sent')} className="flex-1 h-[32px] rounded-[8px] bg-[var(--status-warning-bg)]/10 hover:bg-[var(--status-warning-bg)]/30 border border-transparent hover:border-[var(--status-warning)]/30 text-[var(--status-warning)] font-bold text-[12px] transition-colors">
                                        Warn User
                                    </button>
                                    <button onClick={() => toast.error('User banned')} className="flex-1 h-[32px] rounded-[8px] bg-(--bg-surface) hover:bg-red-500/10 border border-(--border-default) hover:border-red-500/30 text-(--text-secondary) hover:text-red-600 font-bold text-[12px] transition-colors">
                                        Ban User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
