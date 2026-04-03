'use client'

/**
 * Authentication Page — Sign In & Sign Up
 * Uses Supabase auth for email/password sign in and sign up.
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Activity, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, signup, isLoading, error, isAuthenticated, user, clearError, initializeAuth, logout } = useAuthStore()

    const [mode, setMode] = useState<AuthMode>('signin')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState('')
    const [success, setSuccess] = useState(false)
    const accountInactive = searchParams.get('reason') === 'account-inactive'

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    // If redirected for account status, keep user on auth and clear stale session state.
    useEffect(() => {
        if (accountInactive) {
            if (isAuthenticated) {
                logout()
            }
            return
        }

        // If already authenticated, redirect
        if (isAuthenticated && user) {
            if (!user.onboardingComplete) {
                router.push('/onboarding')
            } else {
                router.push('/')
            }
        }
    }, [accountInactive, isAuthenticated, logout, user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError('')
        clearError()

        if (mode === 'signup') {
            if (!name.trim()) { setLocalError('Please enter your full name.'); return }
            if (password !== confirmPassword) { setLocalError('Passwords do not match.'); return }
            if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return }
            const ok = await signup(name, email, password)
            if (ok) {
                setSuccess(true)
                setTimeout(() => router.push('/onboarding'), 800)
            }
        } else {
            const ok = await login(email, password)
            if (ok) {
                setSuccess(true)
                const userFromStore = useAuthStore.getState().user
                setTimeout(() => {
                    if (userFromStore && !userFromStore.onboardingComplete) {
                        router.push('/onboarding')
                    } else {
                        router.push('/')
                    }
                }, 800)
            }
        }
    }

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode)
        setLocalError('')
        clearError()
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
    }

    const displayError = localError || error || ''

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fffde6] via-[#e3fff5] to-[#e6f1ff] dark:from-[#0a0a0f] dark:via-[#0d1a14] dark:to-[#0a0f1a] flex items-center justify-center p-4">
            {/* Decorative blobs */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[440px]">
                {/* Logo & Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-[64px] h-[64px] rounded-[20px] bg-emerald-500 mb-4 shadow-lg shadow-emerald-500/30">
                        <Activity className="w-[32px] h-[32px] text-white" />
                    </div>
                    <h1 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight">SuperFit</h1>
                    <p className="font-body text-[14px] text-(--text-secondary) mt-1">Your complete fitness ecosystem</p>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 dark:bg-[var(--bg-surface)] backdrop-blur-sm border border-white/40 dark:border-(--border-subtle) rounded-[32px] p-8 shadow-2xl shadow-black/10"
                >
                    {/* Tab Switch */}
                    <div className="flex bg-(--bg-elevated,_#f4f4f4) dark:bg-[#1a1a1a] rounded-[16px] p-1 mb-8">
                        <button
                            onClick={() => switchMode('signin')}
                            className={cn(
                                'flex-1 py-3 rounded-[12px] font-body font-bold text-[14px] transition-all',
                                mode === 'signin' ? 'bg-white dark:bg-[var(--bg-surface)] text-emerald-600 shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)'
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => switchMode('signup')}
                            className={cn(
                                'flex-1 py-3 rounded-[12px] font-body font-bold text-[14px] transition-all',
                                mode === 'signup' ? 'bg-white dark:bg-[var(--bg-surface)] text-emerald-600 shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)'
                            )}
                        >
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {accountInactive && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-[12px]">
                                <AlertCircle className="w-[16px] h-[16px] text-amber-600 shrink-0" />
                                <span className="font-body text-[13px] text-amber-700">Your account is currently inactive. Contact support or your coach to reactivate access.</span>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    key="name-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Alex Thompson"
                                            required
                                            className="h-[52px] rounded-[14px] bg-(--bg-elevated,_#f9fafb) dark:bg-[#1c1c1c] border border-gray-200 dark:border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-1.5">
                            <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="h-[52px] rounded-[14px] bg-(--bg-elevated,_#f9fafb) dark:bg-[#1c1c1c] border border-gray-200 dark:border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Password</label>
                                {mode === 'signin' && (
                                    <button type="button" className="font-body text-[13px] text-emerald-600 hover:text-emerald-700 font-medium">Forgot?</button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full h-[52px] rounded-[14px] bg-(--bg-elevated,_#f9fafb) dark:bg-[#1c1c1c] border border-gray-200 dark:border-(--border-default) px-4 pr-12 font-body text-[15px] text-(--text-primary) focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    key="confirm-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-body text-[13px] font-semibold text-(--text-secondary) uppercase tracking-wider">Confirm Password</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="h-[52px] rounded-[14px] bg-(--bg-elevated,_#f9fafb) dark:bg-[#1c1c1c] border border-gray-200 dark:border-(--border-default) px-4 font-body text-[15px] text-(--text-primary) focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Message */}
                        <AnimatePresence>
                            {displayError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[12px]"
                                >
                                    <AlertCircle className="w-[16px] h-[16px] text-red-500 shrink-0" />
                                    <span className="font-body text-[13px] text-red-600 dark:text-red-400">{displayError}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Success State */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-[12px]"
                                >
                                    <CheckCircle className="w-[16px] h-[16px] text-emerald-600 shrink-0" />
                                    <span className="font-body text-[13px] text-emerald-700 dark:text-emerald-400">
                                        {mode === 'signup' ? 'Account created! Redirecting to setup...' : 'Welcome back! Redirecting...'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="h-[56px] w-full rounded-[16px] bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-[16px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-2"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-[20px] h-[20px] animate-spin" /> Processing...</>
                            ) : success ? (
                                <><CheckCircle className="w-[20px] h-[20px]" /> Success!</>
                            ) : mode === 'signin' ? (
                                <>Sign In <ArrowRight className="w-[18px] h-[18px]" /></>
                            ) : (
                                <>Create Account <ArrowRight className="w-[18px] h-[18px]" /></>
                            )}
                        </button>
                    </form>

                </motion.div>

                {/* Footer note */}
                <p className="text-center font-body text-[12px] text-(--text-tertiary) mt-6">
                    By continuing you agree to our Terms of Service & Privacy Policy.
                </p>
            </div>
        </div>
    )
}
