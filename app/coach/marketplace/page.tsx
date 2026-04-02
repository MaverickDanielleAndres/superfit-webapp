'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Globe, CheckCircle2, AlertCircle, TrendingUp, Tags, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function MarketplacePage() {
    const [isActive, setIsActive] = useState(true)

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Marketplace Listing</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage your public profile and subscription tiers to attract new clients.</p>
                </div>
                <div className="flex items-center gap-3 bg-(--bg-surface) border border-(--border-subtle) px-4 py-2 rounded-[16px] shadow-sm">
                    <span className="font-body text-[13px] font-bold text-(--text-secondary)">Status:</span>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={cn("relative w-[44px] h-[24px] rounded-full transition-colors", isActive ? "bg-emerald-500" : "bg-(--border-subtle)")}
                    >
                        <div className={cn("absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all shadow-md", isActive ? "left-[22px]" : "left-[2px]")} />
                    </button>
                    <span className={cn("font-display font-bold text-[14px]", isActive ? "text-emerald-500" : "text-(--text-tertiary)")}>{isActive ? 'Public' : 'Hidden'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Settings */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--border-subtle)">
                            <div className="w-[40px] h-[40px] rounded-[10px] bg-blue-500/10 text-blue-500 flex items-center justify-center"><Globe className="w-[20px] h-[20px]" /></div>
                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary)">Profile Information</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">This is what potential clients see in the discovery tab.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Header Image</label>
                                <div onClick={() => toast('Opening file picker for header image...')} className="h-[160px] rounded-[16px] border-2 border-dashed border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col items-center justify-center text-(--text-tertiary) hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer group">
                                    <ImageIcon className="w-[32px] h-[32px] mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-body font-bold text-[14px]">Click to upload new cover</span>
                                    <span className="font-body text-[12px] opacity-70">1200x400px recommended</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Experience (Years)</label>
                                    <input type="number" defaultValue={8} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Client Cap</label>
                                    <input type="number" defaultValue={30} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Specialties <span className="font-normal text-(--text-tertiary)">(Comma separated)</span></label>
                                <input type="text" defaultValue="Muscle Gain, Powerlifting, Strength Matrix" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Public Bio</label>
                                <textarea rows={4} defaultValue="Strength architect. I build competitive powerlifters and serious bodybuilders..." className="p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full resize-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats & Tiers */}
                <div className="flex flex-col gap-6">
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4 flex items-center gap-2"><TrendingUp className="w-[18px] h-[18px] text-emerald-500" /> Marketplace Stats</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
                                <span className="font-body text-[14px] text-(--text-secondary)">Profile Views (30d)</span>
                                <span className="font-display font-bold text-[18px] text-(--text-primary)">1,248</span>
                            </div>
                            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
                                <span className="font-body text-[14px] text-(--text-secondary)">Conversion Rate</span>
                                <span className="font-display font-bold text-[18px] text-emerald-500">4.2%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body text-[14px] text-(--text-secondary)">Active Subs</span>
                                <span className="font-display font-bold text-[18px] text-(--text-primary)">24 <span className="text-[12px] text-(--text-tertiary)">/ 30</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary) flex items-center gap-2"><Tags className="w-[18px] h-[18px] text-purple-500" /> Pricing Tiers</h3>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors">
                                <div>
                                    <span className="block font-display font-bold text-[14px] text-(--text-primary)">Basic Tier</span>
                                    <span className="block font-body text-[12px] text-(--text-secondary)">14 active</span>
                                </div>
                                <span className="font-display font-black text-[16px] text-(--text-primary)">$49/mo</span>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors">
                                <div>
                                    <span className="block font-display font-bold text-[14px] text-(--text-primary)">Premium Tier</span>
                                    <span className="block font-body text-[12px] text-(--text-secondary)">8 active</span>
                                </div>
                                <span className="font-display font-black text-[16px] text-(--text-primary)">$99/mo</span>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors">
                                <div>
                                    <span className="block font-display font-bold text-[14px] text-(--text-primary)">Elite Tier</span>
                                    <span className="block font-body text-[12px] text-(--text-secondary)">2 active</span>
                                </div>
                                <span className="font-display font-black text-[16px] text-(--text-primary)">$199/mo</span>
                            </div>
                        </div>
                        <button onClick={() => toast('Opening Add Product / Tier modal...')} className="w-full h-[40px] mt-4 rounded-[10px] border border-dashed border-(--border-subtle) text-(--text-secondary) font-bold text-[13px] hover:text-(--text-primary) hover:border-emerald-500 transition-colors">
                            + Add New Tier
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                <button 
                    onClick={() => {
                        const id = toast.loading('Saving changes...')
                        setTimeout(() => toast.success('Profile updated successfully!', { id }), 800)
                    }}
                    className="h-[48px] px-8 rounded-[14px] bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-[16px] transition-all shadow-md flex items-center justify-center gap-2"
                >
                    Save Changes
                </button>
            </div>
        </motion.div>
    )
}
