'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Bell, CreditCard, Save, Globe, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AdminSettingsState, useAdminPortalStore } from '@/store/useAdminPortalStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type SettingsTab = 'Platform' | 'Billing' | 'Security' | 'Database' | 'Notifications'

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('Platform')
    const [draftSettings, setDraftSettings] = useState<AdminSettingsState | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string
        message: string
        confirmText: string
        tone: 'default' | 'danger'
    } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)

    const { settings, fetchSettings, saveSettings } = useAdminPortalStore()

    useEffect(() => {
        let isMounted = true

        void (async () => {
            setIsPageLoading(true)
            await fetchSettings()
            if (isMounted) setIsPageLoading(false)
        })()

        return () => {
            isMounted = false
        }
    }, [fetchSettings])

    useEffect(() => {
        setDraftSettings(settings)
    }, [settings])

    const setField = <K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) => {
        setDraftSettings((current) => {
            if (!current) return current
            return { ...current, [key]: value }
        })
    }

    const saveCurrentSettings = async () => {
        if (!draftSettings) return
        const toastId = toast.loading('Saving settings...')
        try {
            await saveSettings(draftSettings)
            toast.success('Settings updated successfully.', { id: toastId })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to save settings.', { id: toastId })
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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to complete action.')
        } finally {
            setIsConfirming(false)
        }
    }

    const requestSaveCurrentSettings = (scope: string) => {
        openConfirmation(
            {
                title: `Save ${scope} Settings?`,
                message: `Apply the current ${scope.toLowerCase()} configuration changes now?`,
                confirmText: 'Save Changes',
            },
            async () => {
                await saveCurrentSettings()
            },
        )
    }

    if (isPageLoading && !draftSettings) {
        return (
            <div className="w-full max-w-5xl mx-auto py-8 animate-pulse flex flex-col gap-6">
                <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
                <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-8">
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="h-12 w-full rounded-[12px] bg-[var(--bg-elevated)]" />
                        ))}
                    </div>
                    <div className="h-[540px] rounded-[24px] bg-[var(--bg-elevated)]" />
                </div>
            </div>
        )
    }

    if (!draftSettings) {
        return null
    }

    const renderToggle = (
        label: string,
        description: string,
        checked: boolean,
        onToggle: () => void,
    ) => (
        <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] mt-2">
            <div>
                <span className="font-bold text-[14px] block text-(--text-primary)">{label}</span>
                <span className="text-[12px] text-(--text-secondary)">{description}</span>
            </div>
            <button
                onClick={onToggle}
                className={cn('relative w-[44px] h-[24px] rounded-full transition-colors', checked ? 'bg-red-600' : 'bg-(--border-subtle)')}
            >
                <div className={cn('absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all', checked ? 'left-[22px]' : 'left-[2px]')} />
            </button>
        </div>
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-5xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Global Settings</h1>
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
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
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
                                            value={draftSettings.platformName}
                                            onChange={(event) => setField('platformName', event.target.value)}
                                            className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none w-full text-(--text-primary)"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-body text-[13px] font-bold text-(--text-secondary)">Support Email</label>
                                        <input
                                            type="email"
                                            value={draftSettings.supportEmail}
                                            onChange={(event) => setField('supportEmail', event.target.value)}
                                            className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none w-full text-(--text-primary)"
                                        />
                                    </div>
                                    {renderToggle(
                                        'Maintenance Mode',
                                        'Temporarily disable access for non-admin users.',
                                        draftSettings.maintenanceMode,
                                        () => setField('maintenanceMode', !draftSettings.maintenanceMode),
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-4">Coach Settings</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <label className="font-body text-[13px] font-bold text-(--text-secondary)">Platform Fee Percentage</label>
                                            <span className="font-bold text-[14px] text-(--text-primary)">{draftSettings.platformFeePercent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            value={draftSettings.platformFeePercent}
                                            onChange={(event) => setField('platformFeePercent', Number(event.target.value))}
                                            className="w-full h-2 bg-(--border-subtle) rounded-lg appearance-none cursor-pointer accent-red-600"
                                        />
                                        <span className="text-[12px] text-(--text-tertiary)">Percentage taken from coach subscription revenue.</span>
                                    </div>
                                    {renderToggle(
                                        'Auto-approve Coaches',
                                        'Bypass manual review for new coach applications.',
                                        draftSettings.autoApproveCoaches,
                                        () => setField('autoApproveCoaches', !draftSettings.autoApproveCoaches),
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button
                                    onClick={() => {
                                        requestSaveCurrentSettings('Platform')
                                    }}
                                    className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-[18px] h-[18px]" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Security' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary)">Security Controls</h3>
                            {renderToggle(
                                'Enforce 2FA For Admins',
                                'Require two-factor authentication for all admin accounts.',
                                draftSettings.enforceAdmin2fa,
                                () => setField('enforceAdmin2fa', !draftSettings.enforceAdmin2fa),
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Max Login Attempts</label>
                                    <input type="number" min={1} max={20} value={draftSettings.maxLoginAttempts} onChange={(event) => setField('maxLoginAttempts', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Session Timeout (minutes)</label>
                                    <input type="number" min={5} max={720} value={draftSettings.sessionTimeoutMinutes} onChange={(event) => setField('sessionTimeoutMinutes', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Lockout Duration (minutes)</label>
                                <input type="number" min={1} max={240} value={draftSettings.lockoutMinutes} onChange={(event) => setField('lockoutMinutes', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                            </div>
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    requestSaveCurrentSettings('Security')
                                }} className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2">
                                    <Save className="w-[18px] h-[18px]" /> Save Security
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Billing' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary)">Billing Controls</h3>
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Payout Schedule</label>
                                <select value={draftSettings.payoutSchedule} onChange={(event) => setField('payoutSchedule', event.target.value as AdminSettingsState['payoutSchedule'])} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none">
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Biweekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            {renderToggle(
                                'Auto-approve Payouts',
                                'Automatically approve pending payout transactions.',
                                draftSettings.autoApprovePayouts,
                                () => setField('autoApprovePayouts', !draftSettings.autoApprovePayouts),
                            )}
                            {renderToggle(
                                'Allow Refunds',
                                'Allow customer support to process refunds.',
                                draftSettings.allowRefunds,
                                () => setField('allowRefunds', !draftSettings.allowRefunds),
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Refund Window (days)</label>
                                    <input type="number" min={0} max={90} value={draftSettings.refundWindowDays} onChange={(event) => setField('refundWindowDays', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Minimum Payout (cents)</label>
                                    <input type="number" min={0} value={draftSettings.minimumPayoutCents} onChange={(event) => setField('minimumPayoutCents', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    requestSaveCurrentSettings('Billing')
                                }} className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2">
                                    <Save className="w-[18px] h-[18px]" /> Save Billing
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Database' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary)">Database Controls</h3>
                            {renderToggle(
                                'Enable Read Replicas',
                                'Route analytics/reporting traffic to read replicas when available.',
                                draftSettings.enableReadReplicas,
                                () => setField('enableReadReplicas', !draftSettings.enableReadReplicas),
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Analytics Retention (days)</label>
                                    <input type="number" min={7} max={3650} value={draftSettings.analyticsRetentionDays} onChange={(event) => setField('analyticsRetentionDays', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Soft Delete Retention (days)</label>
                                    <input type="number" min={1} max={365} value={draftSettings.softDeleteRetentionDays} onChange={(event) => setField('softDeleteRetentionDays', Number(event.target.value))} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary)">Maintenance Window (UTC)</label>
                                <input type="text" value={draftSettings.maintenanceWindowUtc} onChange={(event) => setField('maintenanceWindowUtc', event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) outline-none" />
                            </div>
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    requestSaveCurrentSettings('Database')
                                }} className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2">
                                    <Save className="w-[18px] h-[18px]" /> Save Database
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Notifications' && (
                        <div className="flex flex-col gap-6">
                            <h3 className="font-display font-black text-[18px] text-(--text-primary)">Notification Controls</h3>
                            {renderToggle(
                                'Email On New Applications',
                                'Notify admin team when a coach application is submitted.',
                                draftSettings.emailOnApplication,
                                () => setField('emailOnApplication', !draftSettings.emailOnApplication),
                            )}
                            {renderToggle(
                                'Email On Moderation Reports',
                                'Send alerts when new moderation reports are opened.',
                                draftSettings.emailOnReport,
                                () => setField('emailOnReport', !draftSettings.emailOnReport),
                            )}
                            {renderToggle(
                                'Email On Payout Events',
                                'Notify finance admins on payout approvals/failures.',
                                draftSettings.emailOnPayout,
                                () => setField('emailOnPayout', !draftSettings.emailOnPayout),
                            )}
                            {renderToggle(
                                'In-app Broadcasts',
                                'Allow global in-app platform announcements.',
                                draftSettings.inAppBroadcasts,
                                () => setField('inAppBroadcasts', !draftSettings.inAppBroadcasts),
                            )}
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button onClick={() => {
                                    requestSaveCurrentSettings('Notification')
                                }} className="h-[44px] px-6 rounded-[12px] bg-red-600 text-white font-bold text-[14px] shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2">
                                    <Save className="w-[18px] h-[18px]" /> Save Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
