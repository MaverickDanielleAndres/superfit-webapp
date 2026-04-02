'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bell, Lock, Smartphone, Download, Activity, Moon, Watch, ChevronRight, Check, Plus, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'privacy'>('profile')
    const [integrations, setIntegrations] = useState({ appleHealth: true, garmin: false, myfitnesspal: false })
    const { theme, setTheme } = useTheme()
    const { user, updateProfile, logout } = useAuthStore()
    const router = useRouter()

    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.email ? `@${user.email.split('@')[0]}` : '@user',
        location: 'New York, NY',
        currentPassword: '',
        newPassword: ''
    })
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Modal states
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)

    const handleSaveProfile = () => {
        updateProfile({ name: profileForm.name, email: profileForm.email })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    const handleToggleIntegration = (key: keyof typeof integrations) => {
        setIntegrations(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleExportData = () => {
        const data = JSON.stringify({ user, exportDate: new Date().toISOString() }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'superfit-data-export.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleDeactivateAccount = () => {
        setIsDeactivateModalOpen(false)
        logout()
        router.push('/auth')
    }

    const handleDeleteAccount = () => {
        setIsDeleteModalOpen(false)
        logout()
        router.push('/auth')
    }

    const IntegrationsSettings = () => (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
            >
                <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-2">Connected Devices & Apps</h3>

                {/* Apple Health */}
                <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" className="w-[20px] h-[20px]" />
                        </div>
                        <div>
                            <h4 className="font-body font-bold text-[15px] text-(--text-primary)">Apple Health</h4>
                            <p className="font-body text-[13px] text-(--text-secondary)">Sync steps, heart rate, and sleep data.</p>
                        </div>
                    </div>
                    <button onClick={() => handleToggleIntegration('appleHealth')} className={cn("h-[36px] px-4 rounded-[10px] font-body font-bold text-[13px] flex items-center gap-2 transition-all", integrations.appleHealth ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-(--bg-surface) border border-(--border-default) text-(--text-primary) hover:bg-(--border-subtle)')}>
                        {integrations.appleHealth ? <><Check className="w-[14px] h-[14px]" /> Connected</> : <><Plus className="w-[14px] h-[14px]" /> Connect</>}
                    </button>
                </div>

                {/* Garmin */}
                <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] rounded-full bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
                            <Watch className="w-[24px] h-[24px] text-white" />
                        </div>
                        <div>
                            <h4 className="font-body font-bold text-[15px] text-(--text-primary)">Garmin Connect</h4>
                            <p className="font-body text-[13px] text-(--text-secondary)">Sync workouts and advanced biometrics.</p>
                        </div>
                    </div>
                    <button onClick={() => handleToggleIntegration('garmin')} className={cn("h-[36px] px-4 rounded-[10px] font-body font-bold text-[13px] flex items-center gap-2 transition-all", integrations.garmin ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-(--bg-surface) border border-(--border-default) text-(--text-primary) hover:bg-(--border-subtle)')}>
                        {integrations.garmin ? <><Check className="w-[14px] h-[14px]" /> Connected</> : 'Connect'}
                    </button>
                </div>

                {/* MyFitnessPal */}
                <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] rounded-full bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                            <Activity className="w-[24px] h-[24px] text-white" />
                        </div>
                        <div>
                            <h4 className="font-body font-bold text-[15px] text-(--text-primary)">MyFitnessPal</h4>
                            <p className="font-body text-[13px] text-(--text-secondary)">Two-way sync for nutrition and calories.</p>
                        </div>
                    </div>
                    <button onClick={() => handleToggleIntegration('myfitnesspal')} className={cn("h-[36px] px-4 rounded-[10px] font-body font-bold text-[13px] flex items-center gap-2 transition-all", integrations.myfitnesspal ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-(--bg-surface) border border-(--border-default) text-(--text-primary) hover:bg-(--border-subtle)')}>
                        {integrations.myfitnesspal ? <><Check className="w-[14px] h-[14px]" /> Connected</> : 'Connect'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )

    const PrivacySettings = () => (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8"
            >
                <div>
                    <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-2">Privacy & Visibility</h3>
                    <p className="font-body text-[14px] text-(--text-secondary) mb-4">Control what others can see on your profile.</p>

                    <div className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] overflow-hidden divide-y divide-(--border-subtle) shadow-sm">
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <span className="block font-body font-semibold text-[15px] text-(--text-primary)">Profile Visibility</span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">Who can see your profile on leaderboards</span>
                            </div>
                            <select className="bg-(--bg-surface) border border-(--border-default) rounded-[8px] px-3 py-2 font-body text-[13px] text-(--text-primary) outline-none focus:border-(--accent)">
                                <option>Public</option>
                                <option>Friends Only</option>
                                <option>Private</option>
                            </select>
                        </div>
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <span className="block font-body font-semibold text-[15px] text-(--text-primary)">Share Workouts</span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">Automatically post completed workouts to feed</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                            </label>
                        </div>
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <span className="block font-body font-semibold text-[15px] text-(--text-primary)">Share Weight Data</span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">Display your current weight on progress posts</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-(--border-subtle) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent)"></div>
                            </label>
                        </div>
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <span className="block font-body font-semibold text-[15px] text-(--text-primary)">Two-Factor Authentication (2FA)</span>
                                <span className="block font-body text-[13px] text-(--text-secondary)">Secure your account with an authenticator app</span>
                            </div>
                            <button onClick={() => setIs2FAModalOpen(true)} className="px-4 py-2 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) font-body text-[13px] font-bold text-(--text-primary) hover:border-(--border-subtle) transition-colors cursor-pointer">
                                Setup 2FA
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-display font-bold text-[18px] text-(--status-danger) mb-2">Danger Zone</h3>
                    <p className="font-body text-[14px] text-(--text-secondary) mb-4">Export your data, or permanently remove your account.</p>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] overflow-hidden divide-y divide-red-500/10">
                        <button onClick={handleExportData} className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-red-500/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Download className="w-[18px] h-[18px] text-(--text-primary)" />
                                <span className="font-body font-semibold text-[15px] text-(--text-primary)">Export All Data (.JSON)</span>
                            </div>
                            <ChevronRight className="w-[18px] h-[18px] text-(--text-tertiary) group-hover:text-(--text-primary) transition-colors" />
                        </button>
                        <button onClick={() => setIsDeactivateModalOpen(true)} className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-red-500/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="font-body font-semibold text-[15px] text-yellow-600">Deactivate Account (Temporary)</span>
                            </div>
                        </button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="font-body font-semibold text-[15px] text-(--status-danger)">Delete Account Permanently</span>
                            </div>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto h-full flex flex-col md:flex-row gap-8 pb-20"
            >
                {/* Settings Navigation */}
                <div className="w-full md:w-[260px] shrink-0">
                    <h1 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight mb-8 tracking-tight">Settings</h1>

                    <div className="flex flex-col gap-1">
                        {[
                            { id: 'profile', label: 'Profile Settings', icon: User },
                            { id: 'integrations', label: 'Integrations', icon: Smartphone },
                            { id: 'privacy', label: 'Privacy & Data', icon: Lock },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn("w-full h-[52px] rounded-[14px] flex items-center gap-3 px-4 transition-all font-body font-semibold text-[15px]", activeTab === tab.id ? 'bg-(--bg-surface) border border-(--border-subtle) text-(--text-primary) shadow-sm' : 'bg-transparent border border-transparent text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:text-(--text-primary)')}
                            >
                                <tab.icon className={cn("w-[20px] h-[20px]", activeTab === tab.id ? 'text-(--accent)' : '')} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Theme Toggle Widget */}
                    <div className="mt-8 bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] p-4 shadow-sm">
                        <span className="block font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold mb-3">Appearance</span>
                        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-[10px]">
                            <button onClick={() => setTheme('light')} className={cn("flex-1 py-2 rounded-[8px] font-body text-[13px] font-semibold transition-all", theme === 'light' ? 'bg-(--bg-surface) shadow-sm text-(--text-primary)' : 'text-(--text-secondary)')}>Light</button>
                            <button onClick={() => setTheme('dark')} className={cn("flex-1 py-2 rounded-[8px] font-body text-[13px] font-semibold transition-all", theme === 'dark' ? 'bg-(--bg-surface) shadow-sm text-(--text-primary)' : 'text-(--text-secondary)')}>Dark</button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button 
                            onClick={handleDeactivateAccount} 
                            className="w-full h-[52px] rounded-[14px] flex items-center gap-3 px-4 transition-all font-body font-semibold text-[15px] bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-transparent hover:border-red-500/30"
                        >
                            <LogOut className="w-[20px] h-[20px]" /> Log Out
                        </button>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 sm:p-8 shadow-sm">
                    {activeTab === 'profile' && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-8"
                            >
                                <div>
                                    <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-6">Personal Information</h3>
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="relative">
                                            <div className="w-[88px] h-[88px] rounded-full bg-emerald-500 flex items-center justify-center text-white font-display font-bold text-[32px] shadow-md">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <button className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-(--bg-elevated) flex items-center justify-center text-(--text-primary) border border-(--border-subtle) shadow-sm hover:scale-110 transition-transform"><Plus className="w-[14px] h-[14px]" /></button>
                                        </div>
                                        <div>
                                            <button className="h-[40px] px-5 rounded-[12px] border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) font-body font-semibold text-[14px] hover:border-(--border-default) transition-colors">Change Avatar</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Full Name</label>
                                            <input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none transition-all" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Email Address</label>
                                            <input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none transition-all" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Username</label>
                                            <input type="text" value={profileForm.username} onChange={e => setProfileForm(f => ({...f, username: e.target.value}))} className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none transition-all" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Location</label>
                                            <input type="text" value={profileForm.location} onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 mt-2 border-t border-(--border-subtle)">
                                    <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-5">Security</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Current Password</label>
                                            <input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm(f => ({...f, currentPassword: e.target.value}))} placeholder="••••••••" className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) outline-none transition-all" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">New Password</label>
                                            <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm(f => ({...f, newPassword: e.target.value}))} placeholder="••••••••" className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-(--accent) outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 mt-2 border-t border-(--border-subtle)">
                                    <h3 className="font-display font-bold text-[20px] text-(--text-primary) mb-5">App Preferences</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">Unit System</label>
                                            <select className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) outline-none focus:border-emerald-500">
                                                <option>Metric (kg, cm)</option>
                                                <option>Imperial (lbs, in)</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-body text-[13px] text-(--text-secondary) font-semibold ml-1">First Day of Week</label>
                                            <select className="h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) outline-none focus:border-emerald-500">
                                                <option>Monday</option>
                                                <option>Sunday</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-2 border-t border-(--border-subtle) flex items-center justify-between">
                                    <button onClick={handleSaveProfile} className="h-[52px] px-8 rounded-[14px] bg-(--accent) text-white font-display font-bold text-[15px] hover:bg-(--accent-hover) transition-colors flex items-center justify-center gap-2">
                                        {saveSuccess ? <><Check className="w-[18px] h-[18px]" /> Saved!</> : 'Save Changes'}
                                    </button>
                                    {saveSuccess && <span className="font-body text-[14px] text-emerald-600 block animate-in fade-in duration-300">Changes saved successfully.</span>}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                    {activeTab === 'integrations' && <IntegrationsSettings />}
                    {activeTab === 'privacy' && <PrivacySettings />}
                </div>

            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {isDeactivateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeactivateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-[480px] bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) p-8 shadow-2xl flex flex-col gap-5">
                            <button onClick={() => setIsDeactivateModalOpen(false)} className="absolute top-4 right-4 w-[32px] h-[32px] rounded-full bg-(--bg-elevated) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            <div className="w-[64px] h-[64px] rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-[32px] h-[32px] text-yellow-600" />
                            </div>
                            <h2 className="font-display font-bold text-[24px] text-center text-(--text-primary)">Deactivate Account?</h2>
                            <p className="font-body text-[15px] text-center text-(--text-secondary) leading-relaxed">
                                Your profile and data will be hidden from everyone. You can restore your account anytime by simply logging back in with your credentials.
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => setIsDeactivateModalOpen(false)} className="flex-1 h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) font-body font-semibold text-[15px] text-(--text-primary)">Cancel</button>
                                <button onClick={handleDeactivateAccount} className="flex-1 h-[52px] rounded-[14px] bg-yellow-600 text-white font-body font-semibold text-[15px] shadow-[0_4px_14px_rgba(202,138,4,0.3)]">Deactivate</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-[480px] bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) p-8 shadow-2xl flex flex-col gap-5">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 right-4 w-[32px] h-[32px] rounded-full bg-(--bg-elevated) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            <div className="w-[64px] h-[64px] rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-[32px] h-[32px] text-red-500" />
                            </div>
                            <h2 className="font-display font-bold text-[24px] text-center text-(--status-danger)">Delete Account Permanently?</h2>
                            <p className="font-body text-[15px] text-center text-(--text-secondary) leading-relaxed">
                                This action is <strong className="text-(--text-primary)">irreversible</strong>. All your progress data, logs, and account history will be permanently erased. Please be certain.
                            </p>
                            <label className="flex items-start gap-3 mt-2 p-4 bg-red-500/5 rounded-[12px] border border-red-500/20 cursor-pointer group">
                                <input type="checkbox" className="mt-1 w-[18px] h-[18px] accent-red-500 cursor-pointer" />
                                <span className="font-body text-[13px] text-(--text-secondary) group-hover:text-(--text-primary)">I understand that my data will be permanently deleted and cannot be recovered.</span>
                            </label>
                            <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) font-body font-semibold text-[15px] text-(--text-primary)">Cancel</button>
                                <button onClick={handleDeleteAccount} className="flex-1 h-[52px] rounded-[14px] bg-red-500 text-white font-body font-semibold text-[15px] shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-colors">Delete Permanently</button>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {/* 2FA Setup Modal */}
                {is2FAModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIs2FAModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-[400px] bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) p-8 shadow-2xl flex flex-col items-center gap-5">
                            <button onClick={() => setIs2FAModalOpen(false)} className="absolute top-4 right-4 w-[32px] h-[32px] rounded-full bg-(--bg-elevated) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            
                            <div className="w-[48px] h-[48px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                <Lock className="w-[24px] h-[24px] text-emerald-500" />
                            </div>
                            <h2 className="font-display font-bold text-[24px] text-center text-(--text-primary)">Setup 2FA</h2>
                            <p className="font-body text-[14px] text-center text-(--text-secondary) leading-relaxed">
                                Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                            </p>
                            
                            <div className="w-[200px] h-[200px] bg-white rounded-[16px] p-4 flex items-center justify-center shadow-inner my-2">
                                {/* Dummy QR Code */}
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/SuperFit:${user?.email || 'user'}?secret=JBSWY3DPEHPK3PXP&issuer=SuperFit`} alt="2FA QR Code" className="w-full h-full object-contain" />
                            </div>
                            
                            <div className="w-full">
                                <label className="font-body text-[13px] font-bold text-(--text-secondary) block mb-1.5 ml-1">Enter 6-digit code</label>
                                <input type="text" maxLength={6} placeholder="000000" className="w-full h-[52px] rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-default) px-4 font-display font-black tracking-[0.5em] text-[20px] text-center text-(--text-primary) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) outline-none transition-all" />
                            </div>

                            <button onClick={() => {
                                toast.success('2FA successfully enabled!')
                                setIs2FAModalOpen(false)
                            }} className="w-full h-[52px] mt-2 rounded-[14px] bg-(--accent) text-white font-body font-bold text-[15px] shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:bg-(--accent-hover) transition-colors">
                                Verify & Enable
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </React.Fragment>
    )
}
