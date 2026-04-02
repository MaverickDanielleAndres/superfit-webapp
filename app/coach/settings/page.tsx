'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('Account')

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Settings</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Manage your account preferences, billing, and notifications.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Vertical Tabs */}
                <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-2">
                    {[
                        { id: 'Account', icon: User },
                        { id: 'Notifications', icon: Bell },
                        { id: 'Billing', icon: CreditCard },
                        { id: 'Security', icon: Shield },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all", activeTab === tab.id ? "bg-emerald-500 text-white shadow-sm" : "bg-transparent text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:text-(--text-primary)")}
                        >
                            <tab.icon className="w-[18px] h-[18px]" /> {tab.id}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 sm:p-8">
                    {activeTab === 'Account' && (
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-6 pb-6 border-b border-(--border-subtle)">
                                <div className="relative">
                                    <div className="w-[80px] h-[80px] rounded-full bg-[var(--bg-elevated)] border-2 border-(--border-subtle) flex items-center justify-center overflow-hidden">
                                        <User className="w-[32px] h-[32px] text-(--text-tertiary)" />
                                    </div>
                                    <button onClick={() => toast('Opening file picker...')} className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-emerald-500 text-white border-2 border-(--bg-surface) flex items-center justify-center hover:bg-emerald-600 transition-colors">
                                        +
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-display font-black text-[18px] text-(--text-primary)">Profile Picture</h3>
                                    <p className="font-body text-[13px] text-(--text-secondary)">JPG, GIF or PNG. 1MB max.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">First Name</label>
                                    <input type="text" defaultValue="Marcus" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Last Name</label>
                                    <input type="text" defaultValue="Thorne" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Email Address</label>
                                    <input type="email" defaultValue="coach@superfit.app" className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Timezone</label>
                                    <select className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option>GMT (London)</option>
                                        <option>EST (New York)</option>
                                        <option>PST (Los Angeles)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button 
                                    onClick={() => {
                                        const id = toast.loading('Saving preferences...')
                                        setTimeout(() => toast.success('Account settings saved!', { id }), 800)
                                    }}
                                    className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-[18px] h-[18px]" /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Billing' && (
                        <div className="flex flex-col gap-6 w-full text-left">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary)">Payouts & Billing</h3>
                            <div className="p-8 rounded-[24px] border border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-[56px] h-[56px] rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                                    <CreditCard className="w-[28px] h-[28px]" />
                                </div>
                                <div>
                                    <span className="block font-display font-bold text-[20px] text-(--text-primary)">Connect with Stripe</span>
                                    <span className="block font-body text-[14px] text-(--text-secondary) mt-2 max-w-[360px] mx-auto">Link your Stripe account to receive payouts from your subscriptions and product sales.</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        const id = toast.loading('Redirecting to Stripe secure connection...')
                                        setTimeout(() => toast.success('Stripe connected successfully! (Mock)', { id }), 1500)
                                    }}
                                    className="h-[48px] px-8 rounded-[12px] bg-indigo-500 text-white font-display font-bold text-[15px] shadow-sm hover:bg-indigo-600 transition-colors mt-4"
                                >
                                    Connect Stripe
                                </button>
                            </div>
                        </div>
                    )}

                    {(activeTab !== 'Account' && activeTab !== 'Billing') && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                            {activeTab === 'Notifications' && <Bell className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            {activeTab === 'Security' && <Shield className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-2">{activeTab} Settings</h3>
                            <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px]">This section is under construction. Settings features will be available in v1.1.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
