'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Activity, MessageCircle, Calendar, Plus, Search, Video, FileText, Settings, ArrowRight, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CoachDashboard() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'programs' | 'schedule'>('overview')
    const [isCallModalOpen, setCallModalOpen] = useState(false)
    const [reviewModal, setReviewModal] = useState<{name: string, type: 'video' | 'checkin'} | null>(null)
    const [feedbackText, setFeedbackText] = useState('')

    // Dummy Client Roster
    const clients = [
        { id: '1', name: 'Jake Mitchell', status: 'Active', plan: '12-Week Prep', nextCheckIn: 'Today', unreadMsg: true },
        { id: '2', name: 'Samantha Lee', status: 'Active', plan: 'Hypertrophy V2', nextCheckIn: 'Tomorrow', unreadMsg: false },
        { id: '3', name: 'Chris Evans', status: 'Onboarding', plan: 'Custom Diet', nextCheckIn: 'Friday', unreadMsg: true },
        { id: '4', name: 'Emma Wilson', status: 'Active', plan: 'Marathon Core', nextCheckIn: 'Monday', unreadMsg: false },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-20 pt-2 h-full"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="font-display font-black text-[32px] text-(--text-primary) tracking-tight leading-none">
                        Coach HQ
                    </h1>
                    <p className="font-body font-medium text-[15px] text-(--text-secondary)">
                        Welcome back, Coach Marcus. You have 3 pending actions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="h-[44px] px-4 rounded-[12px] border border-(--border-subtle) bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-alt)] font-bold text-[14px] flex items-center gap-2 transition-colors">
                        <FileText className="w-[16px] h-[16px]" /> Templates
                    </button>
                    <button className="h-[44px] px-4 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="w-[18px] h-[18px]" /> New Client
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-(--border-subtle) gap-6 overflow-x-auto no-scrollbar">
                {['overview', 'clients', 'programs', 'schedule'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn("pb-3 font-display font-black text-[16px] transition-colors relative whitespace-nowrap capitalize", activeTab === tab ? "text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)")}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-full" />}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-(--bg-surface) p-6 rounded-[24px] border border-(--border-subtle) shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-body text-[14px] font-bold text-(--text-secondary) uppercase tracking-wider">Active Clients</h3>
                                <div className="w-[32px] h-[32px] rounded-full bg-emerald-500/10 flex items-center justify-center"><Users className="w-[16px] h-[16px] text-emerald-500" /></div>
                            </div>
                            <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">24</p>
                            <span className="font-body text-[13px] text-emerald-500 font-bold mt-1">+2 this week</span>
                        </div>
                        <div className="bg-(--bg-surface) p-6 rounded-[24px] border border-(--border-subtle) shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-body text-[14px] font-bold text-(--text-secondary) uppercase tracking-wider">Form Checks</h3>
                                <div className="w-[32px] h-[32px] rounded-full bg-[var(--status-warning-bg)]/30 flex items-center justify-center"><Video className="w-[16px] h-[16px] text-[var(--status-warning)]" /></div>
                            </div>
                            <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">5</p>
                            <span className="font-body text-[13px] text-[var(--status-warning)] font-bold mt-1">Pending review</span>
                        </div>
                        <div className="bg-(--bg-surface) p-6 rounded-[24px] border border-(--border-subtle) shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-body text-[14px] font-bold text-(--text-secondary) uppercase tracking-wider">Messages</h3>
                                <div className="w-[32px] h-[32px] rounded-full bg-blue-500/10 flex items-center justify-center"><MessageCircle className="w-[16px] h-[16px] text-blue-500" /></div>
                            </div>
                            <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">12</p>
                            <span className="font-body text-[13px] text-blue-500 font-bold mt-1">Unread threads</span>
                        </div>
                        <div className="bg-(--bg-surface) p-6 rounded-[24px] border border-(--border-subtle) shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-body text-[14px] font-bold text-(--text-secondary) uppercase tracking-wider">Revenue (MRR)</h3>
                                <div className="w-[32px] h-[32px] rounded-full bg-purple-500/10 flex items-center justify-center"><Activity className="w-[16px] h-[16px] text-purple-500" /></div>
                            </div>
                            <p className="font-display font-black text-[36px] text-(--text-primary) leading-none">$4.8K</p>
                            <span className="font-body text-[13px] text-(--text-secondary) font-bold mt-1">On track</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Action List */}
                        <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between bg-[var(--bg-elevated)]">
                                <h3 className="font-display font-black text-[20px] text-(--text-primary)">Priority Actions</h3>
                            </div>
                            <div className="flex flex-col">
                                <div 
                                    onClick={() => setReviewModal({name: 'Jake Mitchell', type: 'video'})}
                                    className="p-4 border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-[48px] h-[48px] rounded-[12px] bg-[var(--status-warning-bg)]/30 border border-[var(--status-warning-bg)] flex items-center justify-center text-[var(--status-warning)] shrink-0">
                                            <Video className="w-[20px] h-[20px]" />
                                        </div>
                                        <div>
                                            <span className="block font-display font-bold text-[16px] text-(--text-primary)">Jake's Squat Video</span>
                                            <span className="block font-body text-[13px] text-(--text-secondary)">Submitted 2 hrs ago • Needs feedback</span>
                                        </div>
                                    </div>
                                    <div className="w-[36px] h-[36px] rounded-full bg-(--border-subtle) group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                                        <ArrowRight className="w-[16px] h-[16px]" />
                                    </div>
                                </div>
                                <div 
                                    onClick={() => setReviewModal({name: 'Chris Evans', type: 'checkin'})}
                                    className="p-4 border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-[48px] h-[48px] rounded-[12px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                                            <MessageCircle className="w-[20px] h-[20px]" />
                                        </div>
                                        <div>
                                            <span className="block font-display font-bold text-[16px] text-(--text-primary)">Chris Evans Check-in</span>
                                            <span className="block font-body text-[13px] text-(--text-secondary)">Waiting on reply to protocol update</span>
                                        </div>
                                    </div>
                                    <div className="w-[36px] h-[36px] rounded-full bg-(--border-subtle) group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                                        <ArrowRight className="w-[16px] h-[16px]" />
                                    </div>
                                </div>
                                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent border-t border-(--border-subtle) flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                                            <Video className="w-[18px] h-[18px] text-white" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-[14px]">Consultation with Emma W.</span>
                                            <span className="block text-[12px] text-purple-600 dark:text-purple-400 font-medium tracking-wide">Starts in 5 mins</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setCallModalOpen(true)}
                                        className="h-[36px] px-4 rounded-[10px] bg-purple-500 hover:bg-purple-600 text-white font-bold text-[13px] transition-colors shadow-sm"
                                    >
                                        Join Call
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Clients mini-roster */}
                        <div className="w-full lg:w-[400px] shrink-0 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm flex flex-col">
                            <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between">
                                <h3 className="font-display font-black text-[20px] text-(--text-primary)">Quick Roster</h3>
                                <button onClick={() => setActiveTab('clients')} className="font-body text-[13px] font-bold text-emerald-500 hover:text-emerald-600">View All</button>
                            </div>
                            <div className="flex flex-col p-2">
                                {clients.slice(0, 3).map(client => (
                                    <div key={client.id} className="p-3 hover:bg-[var(--bg-elevated)] rounded-[16px] transition-colors flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} className="w-[44px] h-[44px] rounded-full border border-(--border-subtle)" />
                                            <div>
                                                <span className="block font-display font-bold text-[15px] text-(--text-primary)">{client.name}</span>
                                                <span className="block font-body text-[12px] text-(--text-secondary)">{client.plan}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {client.unreadMsg && <div className="w-[8px] h-[8px] bg-blue-500 rounded-full" />}
                                            <button className="p-2 text-(--text-tertiary) hover:text-(--text-primary)"><MoreVertical className="w-[18px] h-[18px]" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative max-w-[300px] w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="h-[40px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer">
                                <option>Status: All</option>
                                <option>Active</option>
                                <option>Onboarding</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left font-body text-[14px]">
                            <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
                                <tr>
                                    <th className="p-5 font-medium">Client</th>
                                    <th className="p-5 font-medium">Status</th>
                                    <th className="p-5 font-medium">Current Plan</th>
                                    <th className="p-5 font-medium">Next Check-in</th>
                                    <th className="p-5 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                        <td className="p-5 flex items-center gap-3">
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" />
                                            <span className="font-display font-bold text-[15px] text-(--text-primary)">{client.name}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className={cn("px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider", client.status === 'Active' ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600")}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-(--text-secondary) font-medium">{client.plan}</td>
                                        <td className="p-5 font-bold text-(--text-primary)">{client.nextCheckIn}</td>
                                        <td className="p-5 text-right flex items-center justify-end gap-2">
                                            <button className="w-[36px] h-[36px] rounded-full hover:bg-[var(--bg-surface)] flex items-center justify-center text-(--text-secondary) transition-colors border border-transparent hover:border-(--border-subtle)">
                                                <MessageCircle className="w-[18px] h-[18px]" />
                                            </button>
                                            <button className="w-[36px] h-[36px] rounded-full hover:bg-[var(--bg-surface)] flex items-center justify-center text-(--text-secondary) transition-colors border border-transparent hover:border-(--border-subtle)">
                                                <Settings className="w-[18px] h-[18px]" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Placeholder for other tabs */}
            {(activeTab === 'programs' || activeTab === 'schedule') && (
                <div className="flex flex-col items-center justify-center py-20 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px]">
                    <div className="w-[64px] h-[64px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 border border-(--border-subtle)">
                        {activeTab === 'programs' ? <FileText className="w-[24px] h-[24px] text-(--text-tertiary)" /> : <Calendar className="w-[24px] h-[24px] text-(--text-tertiary)" />}
                    </div>
                    <h2 className="font-display font-black text-[20px] text-(--text-primary) mb-2 capitalize">{activeTab} Planner</h2>
                    <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px] text-center mb-6">Build bespoke templates or manage your live calendar events with clients.</p>
                    <button onClick={() => toast('Planner creation coming soon')} className="bg-emerald-500 text-white px-6 py-2.5 rounded-[12px] font-bold text-[14px] shadow-sm">
                        Create {activeTab === 'programs' ? 'Program' : 'Event'}
                    </button>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isCallModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-neutral-900 rounded-[24px] border border-neutral-800 p-6 w-full max-w-[800px] aspect-video relative overflow-hidden shadow-2xl flex flex-col justify-end">
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                                <div className="w-[100px] h-[100px] rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Emma`} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-white font-display font-black text-[24px]">Waiting for Emma W...</h3>
                                <p className="text-neutral-400 font-body">00:00:00</p>
                            </div>
                            <div className="relative flex justify-center gap-4 py-4 from-black/50 to-transparent bg-gradient-to-t -mx-6 -mb-6">
                                <button className="w-[48px] h-[48px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"><Search className="w-5 h-5" /></button>
                                <button className="w-[48px] h-[48px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"><Video className="w-5 h-5" /></button>
                                <button onClick={() => setCallModalOpen(false)} className="px-6 h-[48px] rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors shadow-lg">Leave Call</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {reviewModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setReviewModal(null); setFeedbackText('') }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) p-6 w-full max-w-[500px] shadow-2xl"
                        >
                            <h3 className="font-display font-black text-[20px] mb-4">
                                Review {reviewModal.name}'s {reviewModal.type === 'video' ? 'Form Check' : 'Check-In'}
                            </h3>
                            {reviewModal.type === 'video' ? (
                                <div className="w-full aspect-video bg-black rounded-[12px] mb-4 flex items-center justify-center relative overflow-hidden">
                                     <Video className="w-[32px] h-[32px] text-white/50" />
                                     <span className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-0.5 rounded text-[11px] font-bold">0:15</span>
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-elevated)] p-4 rounded-[12px] mb-4 border border-(--border-subtle)">
                                    <p className="text-[13px] text-(--text-secondary) italic mb-2">"Energy is low, didn't hit macros perfectly yesterday. Need advice."</p>
                                </div>
                            )}
                            <textarea 
                                value={feedbackText}
                                onChange={e => setFeedbackText(e.target.value)}
                                placeholder="Type your feedback here..."
                                className="w-full h-[100px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] p-3 text-[14px] resize-none focus:outline-none focus:border-emerald-500 mb-4"
                            />
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => { setReviewModal(null); setFeedbackText('') }} className="px-5 py-2.5 rounded-[12px] text-(--text-secondary) font-bold hover:bg-[var(--bg-elevated)]">Cancel</button>
                                <button 
                                    onClick={() => {
                                        toast.success('Feedback sent to client!')
                                        setReviewModal(null)
                                        setFeedbackText('')
                                    }}
                                    className="px-5 py-2.5 rounded-[12px] bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-sm"
                                >
                                    Send Feedback
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
