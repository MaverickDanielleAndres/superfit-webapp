'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Users, Filter, CheckCircle2, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function BroadcastPage() {
    const [message, setMessage] = useState('')
    const [target, setTarget] = useState('All Active Clients')

    const [history, setHistory] = useState([
        { id: '1', target: 'All Active Clients', snippet: 'Reminder: Update your macros for the new training block starting Monday. Let me know if you have questions!', sentAt: 'Yesterday, 4:30 PM', delivered: 24, read: 22 },
        { id: '2', target: 'Powerlifting Prep Group', snippet: 'Meet day info packet has been uploaded to the resources tab. Please review ASAP.', sentAt: 'Mar 2, 10:00 AM', delivered: 8, read: 8 },
        { id: '3', target: 'Onboarding Clients', snippet: 'Welcome to the team! Make sure to fill out your initial assessment forms.', sentAt: 'Feb 28, 9:00 AM', delivered: 3, read: 2 },
    ])

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Broadcast Center</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Send mass messages to specific client segments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Composer */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-fit">
                    <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4 flex items-center gap-2"><Send className="w-[18px] h-[18px] text-emerald-500" /> New Broadcast</h3>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Target Audience</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                <select 
                                    value={target}
                                    onChange={e => setTarget(e.target.value)}
                                    className="w-full h-[44px] pl-10 pr-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] text-(--text-primary) outline-none appearance-none cursor-pointer"
                                >
                                    <option>All Active Clients (24)</option>
                                    <option>Powerlifting Prep Group (8)</option>
                                    <option>Hypertrophy V2 (12)</option>
                                    <option>Onboarding Clients (3)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">Message</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Type your broadcast message here..."
                                className="w-full min-h-[200px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 text-[14px] text-(--text-primary) outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="font-body text-[12px] text-(--text-tertiary)">{message.length}/1000 characters</span>
                            <button 
                                onClick={() => {
                                    const id = toast.loading('Sending broadcast...')
                                    setTimeout(() => {
                                        toast.success('Broadcast sent successfully!', { id })
                                        setHistory(prev => [{
                                            id: Date.now().toString(),
                                            target: target.split(' (')[0], // Remove the count from the target name
                                            snippet: message,
                                            sentAt: 'Just now',
                                            delivered: 0,
                                            read: 0
                                        }, ...prev])
                                        setMessage('')
                                    }, 800)
                                }}
                                className={cn("h-[44px] px-8 rounded-[12px] font-bold text-[14px] transition-all shadow-sm flex items-center gap-2", 
                                message.length > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer" : "bg-(--border-subtle) text-(--text-tertiary) cursor-not-allowed")}
                                disabled={message.length === 0}
                            >
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-6 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><History className="w-[18px] h-[18px] text-(--text-secondary)" /> History</h3>
                        <button onClick={() => toast('Filters coming soon')} className="text-(--text-secondary) hover:text-(--text-primary)"><Filter className="w-[16px] h-[16px]" /></button>
                    </div>
                    
                    <div className="flex flex-col divide-y divide-(--border-subtle)">
                        {history.map(item => (
                            <div key={item.id} className="p-5 hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-body text-[12px] font-bold bg-(--bg-surface) border border-(--border-subtle) px-2 py-0.5 rounded-[6px] text-(--text-secondary)">{item.target}</span>
                                    <span className="font-body text-[11px] text-(--text-tertiary)">{item.sentAt}</span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-primary) line-clamp-2 mb-3">"{item.snippet}"</p>
                                <div className="flex items-center gap-4 text-[12px] font-body text-(--text-secondary)">
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-[var(--text-tertiary)]" /> Delivered to {item.delivered}</div>
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-[14px] h-[14px] text-emerald-500" /> Read by {item.read}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
