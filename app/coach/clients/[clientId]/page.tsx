'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, MessageCircle, FileText, Activity, Video, Award, Target, ChevronDown, Plus, Image as ImageIcon, ClipboardList, CheckSquare, Camera, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ClientDetailPage() {
    const params = useParams()
    const [activeTab, setActiveTab] = useState<'Overview' | 'Programs' | 'Check-ins' | 'Nutrition' | 'Timeline'>('Overview')

    // Mock Client Data
    const client = {
        name: 'Jake Mitchell',
        status: 'Active',
        plan: '12-Week Powerlifting Prep',
        email: 'jake@example.com',
        phone: '+1 (555) 019-2834',
        joined: 'Jan 15, 2024',
        compliance: 92,
        weight: '84 kg',
        goalWeight: '82.5 kg',
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full pb-20 pt-2">
            <Link href="/coach/clients" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-2 transition-colors w-fit">
                <ArrowLeft className="w-[16px] h-[16px]" /> Back to Roster
            </Link>

            {/* Header Profile Card */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${client.name}`} className="w-[80px] h-[80px] rounded-[20px] bg-[var(--bg-elevated)] border border-(--border-subtle) shadow-sm" />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="font-display font-black text-[24px] text-(--text-primary)">{client.name}</h1>
                            <span className="px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                                {client.status}
                            </span>
                        </div>
                        <p className="font-body text-[14px] font-medium text-(--text-secondary) mb-2">{client.plan}</p>
                        <div className="flex flex-wrap items-center gap-4 text-(--text-tertiary) font-body text-[13px]">
                            <span>{client.email}</span>
                            <span>•</span>
                            <span>{client.phone}</span>
                            <span>•</span>
                            <span>Joined {client.joined}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => toast.success('Sent message to ' + client.name)}
                        className="h-[44px] px-6 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <MessageCircle className="w-[18px] h-[18px]" /> Message
                    </button>
                    <button 
                        onClick={() => toast('Client notes sidebar coming soon')}
                        className="h-[44px] px-6 rounded-[12px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <FileText className="w-[18px] h-[18px]" /> Notes
                    </button>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                {[
                    { icon: MessageCircle, label: 'Message', action: () => toast.success('Message opening...') },
                    { icon: ClipboardList, label: 'Program', action: () => toast.success('Assigning program...') },
                    { icon: CheckSquare, label: 'Habit', action: () => toast.success('Assigning habit...') },
                    { icon: Target, label: 'Goal', action: () => toast.success('Setting goal...') },
                    { icon: Activity, label: 'Check-In', action: () => toast.success('Requesting check-in...') },
                    { icon: Camera, label: 'Photo', action: () => toast.success('Requesting update photo...') },
                ].map(action => (
                    <button key={action.label} onClick={action.action} className="h-[40px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-subtle) hover:bg-[var(--bg-elevated)] hover:border-(--border-default) text-(--text-primary) font-bold text-[13px] flex items-center gap-2 whitespace-nowrap shadow-sm transition-all cursor-pointer">
                        <action.icon className="w-[16px] h-[16px] text-(--text-secondary)" /> {action.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats */}
                <div className="flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-4">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><Target className="w-[18px] h-[18px] text-emerald-500" /> Current Metrics</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex flex-col gap-1">
                                <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider">Compliance</span>
                                <span className="font-display font-black text-[24px] text-emerald-500 leading-none">{client.compliance}%</span>
                            </div>
                            <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex flex-col gap-1">
                                <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider">Bodyweight</span>
                                <span className="font-display font-black text-[24px] text-(--text-primary) leading-none">{client.weight}</span>
                            </div>
                            <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex flex-col gap-1 col-span-2 relative overflow-hidden">
                                <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider block mb-2">Goal Target</span>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-display font-bold text-[16px] text-(--text-primary)">{client.weight}</span>
                                    <span className="font-display font-bold text-[16px] text-emerald-500">{client.goalWeight}</span>
                                </div>
                                <div className="h-[6px] w-full bg-(--border-subtle) rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle) mb-4">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><Award className="w-[18px] h-[18px] text-[var(--status-warning)]" /> PRs & Milestones</h3>
                            <button className="text-emerald-500 text-[13px] font-bold hover:text-emerald-600">Add</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between font-body text-[14px]">
                                <span className="text-(--text-primary) font-bold">Squat</span>
                                <span className="text-emerald-500 font-bold">220 kg</span>
                            </div>
                            <div className="flex items-center justify-between font-body text-[14px]">
                                <span className="text-(--text-primary) font-bold">Bench Press</span>
                                <span className="text-emerald-500 font-bold">145 kg</span>
                            </div>
                            <div className="flex items-center justify-between font-body text-[14px]">
                                <span className="text-(--text-primary) font-bold">Deadlift</span>
                                <span className="text-emerald-500 font-bold">260 kg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex border-b border-(--border-subtle) gap-6 overflow-x-auto no-scrollbar pb-[1px]">
                        {['Overview', 'Programs', 'Check-ins', 'Nutrition', 'Timeline'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn("pb-3 font-display font-black text-[16px] transition-colors relative whitespace-nowrap cursor-pointer", activeTab === tab ? "text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)")}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 h-[500px] flex flex-col">
                        {activeTab === 'Overview' && (
                            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
                                <div className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-[14px] text-emerald-700 flex items-center gap-2"><FileText className="w-[14px] h-[14px]" /> Coach's Notes</h4>
                                        <button className="text-[12px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">Save</button>
                                    </div>
                                    <textarea className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-emerald-700/50 resize-none h-[40px] text-emerald-900" placeholder="Write a note about this client... Only visible to you." defaultValue="Client has been struggling with sleep this week. Keep workouts lighter if needed." />
                                </div>
                                
                                <div className="flex flex-col gap-3 shrink-0">
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Today's Summary</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="p-3 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-subtle) flex items-center gap-3">
                                            <div className="w-[8px] h-[8px] rounded-full bg-emerald-500" />
                                            <span className="font-bold text-[13px]">Lower Body Power</span>
                                        </div>
                                        <div className="p-3 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-subtle) flex items-center gap-3">
                                            <div className="w-[8px] h-[8px] rounded-full bg-[var(--status-warning)]" />
                                            <span className="font-bold text-[13px]">Hit 150g Protein</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Recent Activity</h3>
                                </div>
                                <div className="flex flex-col gap-0 relative flex-1">
                                    <div className="absolute left-[15px] top-2 bottom-0 w-[2px] bg-(--border-subtle)" />
                                    {[
                                        { type: 'Check-in', title: 'Submitted Weekly Check-in', time: '2 hours ago', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { type: 'Form Check', title: 'Uploaded Squat Video', time: 'Yesterday', icon: Video, color: 'text-[var(--status-warning)]', bg: 'bg-[var(--status-warning-bg)]/30' },
                                        { type: 'Message', title: 'Sent a message', time: 'Mar 2, 2024', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    ].map((act, i) => (
                                        <div key={i} className="flex gap-4 relative pb-6 group">
                                            <div className={cn("w-[32px] h-[32px] rounded-full border-[3px] border-(--bg-surface) flex items-center justify-center shrink-0 z-10 relative", act.bg, act.color)}>
                                                <act.icon className="w-[14px] h-[14px]" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) group-hover:border-(--border-subtle) transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-display font-bold text-[15px] text-(--text-primary)">{act.title}</span>
                                                        <span className="font-body text-[12px] text-(--text-tertiary)">{act.time}</span>
                                                    </div>
                                                    <span className="font-body text-[13px] text-(--text-secondary) font-bold">{act.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'Programs' && (
                            <div className="flex flex-col gap-6 h-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Assigned Programs</h3>
                                    <button onClick={() => toast.success('Opened program builder')} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 font-bold text-[14px]">
                                        <Plus className="w-[16px] h-[16px]" /> Assign New
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex justify-between items-center group cursor-pointer hover:border-emerald-500 transition-colors">
                                        <div>
                                            <span className="block font-bold text-[15px]">{client.plan}</span>
                                            <span className="text-[13px] text-(--text-secondary)">Week 4 of 12 • 3 workouts/week</span>
                                        </div>
                                        <div className="w-[36px] h-[36px] rounded-full bg-(--border-subtle) group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                                            <ChevronDown className="w-[16px] h-[16px] -rotate-90" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex justify-between items-center opacity-60">
                                        <div>
                                            <span className="block font-bold text-[15px]">Hypertrophy Base (Completed)</span>
                                            <span className="text-[13px] text-(--text-secondary)">Finished Dec 12, 2023</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Check-ins' && (
                            <div className="flex flex-col gap-6 h-full">
                                <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Recent Check-ins</h3>
                                <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                                    <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-start gap-4 cursor-pointer hover:border-emerald-500 transition-colors">
                                        <div className="w-[40px] h-[40px] rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Activity className="w-[18px] h-[18px]" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-[15px]">Week 4 Update</span>
                                            <span className="block text-[13px] text-(--text-secondary) mt-1">Energy: 7/10 • Sleep: 8/10 • Nutrition: On track</span>
                                            <p className="text-[13px] mt-2 italic text-(--text-tertiary)">"Feeling really good about this week's progress. Squats felt much better."</p>
                                        </div>
                                        <button onClick={() => toast('Opening check-in review')} className="ml-auto text-emerald-500 font-bold text-[13px] hover:underline">Review</button>
                                    </div>
                                    <div className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-start gap-4 opacity-70">
                                        <div className="w-[40px] h-[40px] rounded-full bg-(--border-subtle) text-(--text-secondary) flex items-center justify-center shrink-0">
                                            <Activity className="w-[18px] h-[18px]" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-[15px]">Week 3 Update</span>
                                            <span className="block text-[13px] text-(--text-secondary) mt-1">Energy: 5/10 • Sleep: 6/10 • Nutrition: Struggled</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Nutrition' && (
                            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Nutrition & Progress</h3>
                                    <button onClick={() => toast.success('Macro targets updated')} className="h-[32px] px-4 rounded-[8px] bg-(--text-primary) text-(--bg-base) font-bold text-[12px]">Update Targets</button>
                                </div>
                                <div className="grid grid-cols-4 gap-3 mb-2">
                                    <div className="bg-[var(--bg-elevated)] p-3 rounded-[12px] border border-(--border-default) text-center">
                                        <span className="block text-[11px] font-bold text-(--text-tertiary) uppercase">Calories</span>
                                        <span className="font-display font-black text-[18px] text-(--text-primary)">2800</span>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-[12px] border border-red-500/20 text-center">
                                        <span className="block text-[11px] font-bold text-red-500 uppercase">Protein</span>
                                        <span className="font-display font-black text-[18px] text-red-600">180g</span>
                                    </div>
                                    <div className="bg-blue-500/10 p-3 rounded-[12px] border border-blue-500/20 text-center">
                                        <span className="block text-[11px] font-bold text-blue-500 uppercase">Carbs</span>
                                        <span className="font-display font-black text-[18px] text-blue-600">320g</span>
                                    </div>
                                    <div className="bg-amber-500/10 p-3 rounded-[12px] border border-amber-500/20 text-center">
                                        <span className="block text-[11px] font-bold text-amber-500 uppercase">Fats</span>
                                        <span className="font-display font-black text-[18px] text-amber-600">88g</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-[15px] mb-3 flex items-center gap-2"><ImageIcon className="w-[16px] h-[16px]" /> Recent Progress Photos</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="aspect-[3/4] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] flex items-center justify-center overflow-hidden cursor-pointer group">
                                            <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                        <div className="aspect-[3/4] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] flex items-center justify-center overflow-hidden cursor-pointer group">
                                            <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                        <div className="aspect-[3/4] bg-[var(--bg-elevated)] border border-(--border-default) border-dashed rounded-[12px] flex flex-col gap-2 items-center justify-center text-(--text-tertiary) cursor-pointer hover:bg-(--bg-surface) hover:text-(--text-secondary) transition-colors">
                                            <Plus className="w-[24px] h-[24px]" />
                                            <span className="text-[12px] font-bold">Request Photos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Timeline' && (
                            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Progress Timeline</h3>
                                    <button onClick={() => toast.success('Add event modal...')} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 font-bold text-[14px]">
                                        <Plus className="w-[16px] h-[16px]" /> Add Event
                                    </button>
                                </div>
                                <div className="relative pl-6 border-l-2 border-(--border-subtle) space-y-8 mt-2">
                                    {[
                                        { date: 'Oct 2026', title: 'Hit 260kg Deadlift PR', type: 'award' },
                                        { date: 'Sep 2026', title: 'Started Hypertrophy Base', type: 'program' },
                                        { date: 'Jul 2026', title: 'Reached 85kg Bodyweight', type: 'goal' },
                                        { date: 'Jan 2024', title: 'Joined Coaching', type: 'milestone' },
                                    ].map((event, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[31px] top-1 w-[14px] h-[14px] rounded-full border-4 border-(--bg-surface) bg-emerald-500 shadow-sm" />
                                            <div className="flex flex-col gap-1 -mt-1">
                                                <span className="font-bold text-[12px] text-(--text-tertiary) uppercase tracking-wider">{event.date}</span>
                                                <span className="font-bold text-[15px] text-(--text-primary)">{event.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
