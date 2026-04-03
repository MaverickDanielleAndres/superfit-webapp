'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SubscriptionPage() {
    const [isSubscribed, setIsSubscribed] = useState(false)

    if (isSubscribed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto h-full flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center px-4"
            >
                <div className="w-[80px] h-[80px] rounded-full bg-(--status-success) bg-opacity-10 text-(--status-success) flex items-center justify-center mb-6">
                    <CheckCircle className="w-[40px] h-[40px]" />
                </div>
                <h1 className="font-display font-bold text-[36px] text-(--text-primary) mb-4">Welcome to SuperFit Pro!</h1>
                <p className="font-body text-[16px] text-(--text-secondary) mb-8">
                    Your 14-day free trial is now active. You have full access to advanced analytics, AI coaching, and all premium features.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="h-[52px] px-8 rounded-[16px] bg-(--accent) text-white font-display font-bold text-[16px] hover:bg-(--accent-hover) transition-colors shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                >
                    Go to Dashboard
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto h-full flex flex-col gap-8 pb-20 items-center justify-center min-h-[calc(100vh-140px)]"
        >
            <div className="text-center max-w-2xl mx-auto mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--accent) bg-opacity-10 text-(--accent) font-body text-[13px] font-bold uppercase tracking-wider mb-4 border border-(--accent) border-opacity-20">
                    <Crown className="w-[16px] h-[16px]" /> Upgrade to SuperFit Pro
                </span>
                <h1 className="font-display font-bold text-[36px] md:text-[48px] text-(--text-primary) leading-tight mb-4">Unlock Your Full Potential</h1>
                <p className="font-body text-[16px] text-(--text-secondary)">Get access to advanced analytics, 1-on-1 coaching, AI workout generation, and our massive recipe database.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                {/* Free Tier */}
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[32px] p-8 shadow-sm flex flex-col">
                    <h3 className="font-display font-bold text-[24px] text-(--text-primary) mb-2">Basic</h3>
                    <p className="font-body text-[14px] text-(--text-secondary) mb-6">Essential tracking for self-guided athletes.</p>

                    <div className="mb-8">
                        <span className="font-display font-bold text-[48px] text-(--text-primary)">$0</span>
                        <span className="font-body text-[16px] text-(--text-secondary)">/mo</span>
                    </div>

                    <button className="w-full h-[56px] rounded-[16px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-display font-bold text-[16px] mb-8 hover:bg-(--border-subtle) transition-colors">
                        Current Plan
                    </button>

                    <ul className="flex flex-col gap-4">
                        {[
                            'Basic Workout Tracking',
                            'Macro & Calorie Goals',
                            'Standard Food Database',
                            'Community Feed Access',
                            'Bodyweight Trends'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 font-body text-[15px] text-(--text-secondary)">
                                <Check className="w-[20px] h-[20px] text-(--status-success)" /> {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pro Tier (Highlighted) */}
                <div className="bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-alt)] border-2 border-(--accent) rounded-[32px] p-8 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.3)] relative flex flex-col overflow-hidden">

                    {/* Recommendation badge */}
                    <div className="absolute top-0 right-0 bg-(--accent) text-white font-body font-bold text-[12px] uppercase tracking-wider px-4 py-1.5 rounded-bl-[16px]">
                        Most Popular
                    </div>

                    <h3 className="font-display font-bold text-[24px] text-(--text-primary) mb-2 flex items-center gap-2">
                        Pro <Star className="w-[20px] h-[20px] text-(--accent) fill-current" />
                    </h3>
                    <p className="font-body text-[14px] text-(--text-secondary) mb-6">Advanced tools & unlimited coaching access.</p>

                    <div className="mb-8">
                        <span className="font-display font-bold text-[48px] text-(--text-primary)">$19</span>
                        <span className="font-body text-[16px] text-(--text-secondary)">/mo</span>
                        <span className="block font-body text-[13px] text-(--text-tertiary) mt-1">Billed annually ($228/year)</span>
                    </div>

                    <button
                        onClick={() => setIsSubscribed(true)}
                        className="w-full h-[56px] rounded-[16px] bg-(--accent) text-white font-display font-bold text-[16px] mb-8 hover:bg-(--accent-hover) hover:scale-[1.02] transition-all shadow-[0_4px_16px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                        Start 14-Day Free Trial
                    </button>

                    <ul className="flex flex-col gap-4">
                        {[
                            'Everything in Basic',
                            'Advanced Strength Analytics (1RM)',
                            'AI Coaching Chatbot',
                            'Recipe Builder & Export',
                            'Form Check Video Uploads',
                            'Wearable Integrations (Apple, Garmin)',
                            'Ad-free Experience'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 font-body text-[15px] text-(--text-primary)">
                                <Zap className="w-[20px] h-[20px] text-(--accent) shrink-0 mt-0.5" /> <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            <p className="font-body text-[13px] text-(--text-tertiary) text-center max-w-md mt-4">
                Prices are in USD. By subscribing you agree to our Terms of Service and Privacy Policy. Cancel anytime from your account settings.
            </p>

        </motion.div>
    )
}
