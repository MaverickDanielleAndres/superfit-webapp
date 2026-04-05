'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { requestApi } from '@/lib/api/client'
import { useAuthStore } from '@/store/useAuthStore'

function toVisibilityApi(value: 'Public' | 'Friends Only' | 'Private'): 'public' | 'friends_only' | 'private' {
    if (value === 'Friends Only') return 'friends_only'
    if (value === 'Private') return 'private'
    return 'public'
}

function toVisibilityLabel(value: string): 'Public' | 'Friends Only' | 'Private' {
    if (value === 'friends_only') return 'Friends Only'
    if (value === 'private') return 'Private'
    return 'Public'
}

export default function SettingsPage() {
    const { updateProfile } = useAuthStore()
    const [activeTab, setActiveTab] = useState('Account')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric')
    const [timezone, setTimezone] = useState('UTC')
    const [profileVisibility, setProfileVisibility] = useState<'Public' | 'Friends Only' | 'Private'>('Public')
    const [shareWorkouts, setShareWorkouts] = useState(true)
    const [shareWeightData, setShareWeightData] = useState(false)
    const [weekStart, setWeekStart] = useState<'Monday' | 'Sunday'>('Monday')
    const [integrations, setIntegrations] = useState<Record<string, unknown>>({})
    const [emailReminders, setEmailReminders] = useState(true)
    const [newSubmissionAlerts, setNewSubmissionAlerts] = useState(true)
    const [messageNotifications, setMessageNotifications] = useState(true)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isAvatarUploading, setIsAvatarUploading] = useState(false)
    const avatarInputRef = React.useRef<HTMLInputElement>(null)

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsAvatarUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await requestApi<{ avatarUrl: string }>('/api/v1/settings/avatar', {
                method: 'POST',
                body: formData,
            })

            const nextAvatar = String(response.data.avatarUrl || '')
            setAvatarUrl(nextAvatar)
            updateProfile({ avatar: nextAvatar })
            toast.success('Avatar updated.')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsAvatarUploading(false)
            event.target.value = ''
        }
    }

    useEffect(() => {
        void (async () => {
            try {
                const response = await requestApi<{
                    fullName: string
                    email: string
                    avatarUrl: string
                    measurementSystem: 'metric' | 'imperial'
                    timezone: string
                    profileVisibility: 'public' | 'friends_only' | 'private'
                    shareWorkouts: boolean
                    shareWeightData: boolean
                    weekStart: 'monday' | 'sunday'
                    integrations: Record<string, unknown>
                    twoFactorEnabled: boolean
                }>('/api/v1/coach/settings')

                const fullName = String(response.data.fullName || '')
                const [first = '', ...rest] = fullName.split(' ')
                setFirstName(first)
                setLastName(rest.join(' '))
                setEmail(String(response.data.email || ''))
                setAvatarUrl(String(response.data.avatarUrl || ''))
                setMeasurementSystem(response.data.measurementSystem || 'metric')
                setTimezone(String(response.data.timezone || 'UTC'))
                setProfileVisibility(toVisibilityLabel(response.data.profileVisibility))
                setShareWorkouts(response.data.shareWorkouts)
                setShareWeightData(response.data.shareWeightData)
                setWeekStart(response.data.weekStart === 'sunday' ? 'Sunday' : 'Monday')
                const nextIntegrations = response.data.integrations && typeof response.data.integrations === 'object' ? response.data.integrations : {}
                setIntegrations(nextIntegrations)
                setEmailReminders(nextIntegrations.notification_email_reminders !== false)
                setNewSubmissionAlerts(nextIntegrations.notification_new_submissions !== false)
                setMessageNotifications(nextIntegrations.notification_messages !== false)
                setTwoFactorEnabled(Boolean(response.data.twoFactorEnabled))
            } catch (error) {
                toast.error(getErrorMessage(error))
            }
        })()
    }, [])

    const saveSettings = async (successMessage: string) => {
        setIsSaving(true)
        const id = toast.loading('Saving preferences...')
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        const nextIntegrations = {
            ...integrations,
            notification_email_reminders: emailReminders,
            notification_new_submissions: newSubmissionAlerts,
            notification_messages: messageNotifications,
        }

        try {
            await requestApi<{ saved: boolean }>('/api/v1/coach/settings', {
                method: 'PATCH',
                body: JSON.stringify({
                    fullName,
                    email,
                    avatarUrl: avatarUrl.trim() || null,
                    measurementSystem,
                    timezone,
                    profileVisibility: toVisibilityApi(profileVisibility),
                    shareWorkouts,
                    shareWeightData,
                    weekStart: weekStart === 'Sunday' ? 'sunday' : 'monday',
                    integrations: nextIntegrations,
                    twoFactorEnabled,
                    currentPassword,
                    newPassword,
                }),
            })

            updateProfile({
                name: fullName,
                email,
                avatar: avatarUrl.trim() || null,
                measurementSystem,
                timezone,
            })

            setIntegrations(nextIntegrations)
            setCurrentPassword('')
            setNewPassword('')

            toast.success(successMessage, { id })
        } catch (error) {
            toast.error(getErrorMessage(error), { id })
        }

        setIsSaving(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Settings</h1>
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
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                                <div className="relative">
                                    <div className="w-[80px] h-[80px] rounded-full bg-[var(--bg-elevated)] border-2 border-(--border-subtle) flex items-center justify-center overflow-hidden">
                                        {avatarUrl ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={avatarUrl} alt="Coach profile avatar" className="w-full h-full object-cover" />
                                            </>
                                        ) : (
                                            <User className="w-[32px] h-[32px] text-(--text-tertiary)" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isAvatarUploading}
                                        className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-emerald-500 text-white border-2 border-(--bg-surface) flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-display font-black text-[18px] text-(--text-primary)">Profile Picture</h3>
                                    <p className="font-body text-[13px] text-(--text-secondary)">{isAvatarUploading ? 'Uploading...' : 'JPG, PNG or WEBP. 3MB max.'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">First Name</label>
                                    <input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Last Name</label>
                                    <input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Email Address</label>
                                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Timezone</label>
                                    <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="UTC">UTC</option>
                                        <option value="Europe/London">Europe/London</option>
                                        <option value="America/New_York">America/New_York</option>
                                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                                        <option value="Asia/Manila">Asia/Manila</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Measurement System</label>
                                    <select value={measurementSystem} onChange={(event) => setMeasurementSystem(event.target.value as 'metric' | 'imperial')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="metric">Metric</option>
                                        <option value="imperial">Imperial</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Week Starts On</label>
                                    <select value={weekStart} onChange={(event) => setWeekStart(event.target.value as 'Monday' | 'Sunday')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="Monday">Monday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Profile Visibility</label>
                                    <select value={profileVisibility} onChange={(event) => setProfileVisibility(event.target.value as 'Public' | 'Friends Only' | 'Private')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="Public">Public</option>
                                        <option value="Friends Only">Friends Only</option>
                                        <option value="Private">Private</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Share Workouts</label>
                                    <select value={shareWorkouts ? 'yes' : 'no'} onChange={(event) => setShareWorkouts(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Share Weight Data</label>
                                    <select value={shareWeightData ? 'yes' : 'no'} onChange={(event) => setShareWeightData(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button 
                                    onClick={() => void saveSettings('Account settings saved!')}
                                    disabled={isSaving}
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
                                        const connectUrl = process.env.NEXT_PUBLIC_STRIPE_CONNECT_URL || 'https://dashboard.stripe.com/connect/accounts'
                                        window.open(connectUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="h-[48px] px-8 rounded-[12px] bg-indigo-500 text-white font-display font-bold text-[15px] shadow-sm hover:bg-indigo-600 transition-colors mt-4"
                                >
                                    Connect Stripe
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Notifications' && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary)">Notification Preferences</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">Control which coach updates you receive by email and in-app alerts.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Email Reminders</label>
                                    <select value={emailReminders ? 'yes' : 'no'} onChange={(event) => setEmailReminders(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Enabled</option>
                                        <option value="no">Disabled</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">New Submission Alerts</label>
                                    <select value={newSubmissionAlerts ? 'yes' : 'no'} onChange={(event) => setNewSubmissionAlerts(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Enabled</option>
                                        <option value="no">Disabled</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Message Notifications</label>
                                    <select value={messageNotifications ? 'yes' : 'no'} onChange={(event) => setMessageNotifications(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Enabled</option>
                                        <option value="no">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button
                                    onClick={() => void saveSettings('Notification settings saved!')}
                                    disabled={isSaving}
                                    className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-[18px] h-[18px]" /> Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Security' && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="font-display font-black text-[18px] text-(--text-primary)">Security Controls</h3>
                                <p className="font-body text-[13px] text-(--text-secondary)">Manage account protection and credential updates.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Two-Factor Authentication</label>
                                    <select value={twoFactorEnabled ? 'yes' : 'no'} onChange={(event) => setTwoFactorEnabled(event.target.value === 'yes')} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)">
                                        <option value="yes">Enabled</option>
                                        <option value="no">Disabled</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">Current Password</label>
                                    <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-body text-[13px] font-bold text-(--text-secondary)">New Password</label>
                                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-[44px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) focus:border-emerald-500 font-body text-[14px] outline-none w-full text-(--text-primary)" />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-(--border-subtle)">
                                <button
                                    onClick={() => void saveSettings('Security settings saved!')}
                                    disabled={isSaving}
                                    className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-[18px] h-[18px]" /> Save Security
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </motion.div>
    )
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}
