'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Bell, CreditCard, Save, Globe, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('Platform')
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [autoApprove, setAutoApprove] = useState(true)
    const [platformFee, setPlatformFee] = useState(10)

    const { settings, fetchSettings, saveSettings } = useAdminPortalStore()

    useEffect(() => {
        void fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        setMaintenanceMode(settings.maintenanceMode)
        setAutoApprove(settings.autoApproveCoaches)
        setPlatformFee(settings.platformFeePercent)
    }, [settings])

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Global Settings</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Configure platform-wide rules, API integrations, and administrative preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-2">
                    {[
                        { id: 'Platform', icon: Globe },
                        { id: 'Billing', icon: CreditCard },
                        { id: 'Security', icon: Shield },
                        { id: 'Database', icon: Database },
                        { id: 'Notifications', icon: Bell },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all',
                                activeTab === tab.id
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-transparent text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:text-(--text-primary)',
                            )}
                        >
                            <tab.icon className="w-[18px] h-[18px]" /> {tab.id}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 sm:p-8">
                    {activeTab === 'Platform' && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">General Configuration</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-body text-[13px] font-bold text-(--text-secondary)">Platform Name</label>
                                        <input
                                            type="text"
                                            defaultValue="SuperFit"
                                            className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none w-full text-(--text-primary)"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-body text-[13px] font-bold text-(--text-secondary)">Support Email</label>
                                        <input
                                            type="email"
                                            defaultValue="support@superfit.app"
                                            className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none w-full text-(--text-primary)"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] mt-2">
                                        <div>
                                            <span className="font-bold text-[14px] block text-(--text-primary)">Maintenance Mode</span>
                                            <span className="text-[12px] text-(--text-secondary)">Temporarily disable access for non-admin users.</span>
                                        </div>
                                        <button
                                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                                            className={cn('relative w-[44px] h-[24px] rounded-full transition-colors', maintenanceMode ? 'bg-red-600' : 'bg-(--border-subtle)')}
                                        >
                                            <div className={cn('absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all', maintenanceMode ? 'left-[22px]' : 'left-[2px]')} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">Coach Settings</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary)">Platform Fee Percentage</label>
                                            <span className="font-bold text-[14px] text-(--text-primary)">{platformFee}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            value={platformFee}
                                            onChange={(event) => setPlatformFee(Number(event.target.value))}
                                            className="w-full h-2 bg-(--border-subtle) rounded-lg appearance-none cursor-pointer accent-red-600"
                                        />
                                        <span className="text-[12px] text-(--text-tertiary)">Percentage taken from coach subscription revenue.</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] mt-2">
                                        <div>
                                            <span className="font-bold text-[14px] block text-(--text-primary)">Auto-approve Coaches</span>
                                            <span className="text-[12px] text-(--text-secondary)">Bypass manual review for new coach applications.</span>
                                        </div>
                                        <button
                                            onClick={() => setAutoApprove(!autoApprove)}
                                            className={cn('relative w-[44px] h-[24px] rounded-full transition-colors', autoApprove ? 'bg-red-600' : 'bg-(--border-subtle)')}
                                        >
                                            <div className={cn('absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all', autoApprove ? 'left-[22px]' : 'left-[2px]')} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button
                                    onClick={() => {
                                        void (async () => {
                                            const id = toast.loading('Saving global settings...')
                                            await saveSettings({
                                                maintenanceMode,
                                                autoApproveCoaches: autoApprove,
                                                platformFeePercent: platformFee,
                                            })
                                            toast.success('Platform configuration updated', { id })
                                        })()
                                    }}
                                    className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-[18px] h-[18px]" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Platform' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                            {activeTab === 'Security' && <Shield className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            {activeTab === 'Billing' && <CreditCard className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            {activeTab === 'Database' && <Database className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            {activeTab === 'Notifications' && <Bell className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />}
                            <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-2">{activeTab} Controls</h3>
                            <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px]">Advanced {activeTab.toLowerCase()} settings are restricted in the demo environment.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
