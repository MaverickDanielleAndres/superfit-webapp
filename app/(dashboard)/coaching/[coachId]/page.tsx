'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MapPin, Award, CheckCircle2, PlayCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function CoachProfilePage() {
    const params = useParams()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'programs' | 'posts' | 'reviews'>('programs')
    const [isSubscribing, setIsSubscribing] = useState(false)
    const tabs: Array<'programs' | 'posts' | 'reviews'> = ['programs', 'posts', 'reviews']

    // Mock data for the coach
    const coach = {
        name: 'Marcus Thorne',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&fit=crop',
        cover: 'https://images.unsplash.com/photo-1534438327276-[14e6300c3a26?w=1200&fit=crop](https://images.unsplash.com/photo-1534438327276-(14e6300c3a26?w=1200&fit=crop))',
        location: 'London, UK',
        specialties: ['Muscle Gain', 'Powerlifting', 'Strength Matrix'],
        certifications: ['NSCA-CSCS', 'Precision Nutrition L2'],
        experience: '8 years',
        rating: 5.0,
        reviewCount: 89,
        bio: 'Strength architect. I build competitive powerlifters and serious bodybuilders. My methodology is rooted in biomechanics and progressive overload, ensuring every session brings you closer to your genetic potential.',
    }

    const handleSubscribe = async (planName = 'Premium Tier', amountCents = 9900) => {
        const coachIdParam = Array.isArray(params.coachId) ? params.coachId[0] : params.coachId
        const coachId = coachIdParam && UUID_REGEX.test(coachIdParam) ? coachIdParam : null
        const idempotencyKey = `checkout_${Date.now()}_${crypto.randomUUID()}`

        setIsSubscribing(true)
        try {
            let response: Response | null = null
            for (let attempt = 1; attempt <= 2; attempt += 1) {
                response = await fetch('/api/v1/simulated-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Idempotency-Key': idempotencyKey,
                    },
                    body: JSON.stringify({
                        coachId,
                        planName,
                        amountCents,
                        currency: 'usd',
                    }),
                })

                if (response.ok || response.status < 500 || attempt === 2) {
                    break
                }

                await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
            }

            if (!response) {
                toast.error('Unable to process subscription right now.')
                return
            }

            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                toast.error(payload?.detail || 'Unable to process subscription right now.')
                if (response.status === 401) {
                    router.push('/auth')
                }
                return
            }

            toast.success(`Subscription active: ${planName}`)
            router.push('/coaching')
        } catch {
            toast.error('Unable to process subscription right now.')
        } finally {
            setIsSubscribing(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto h-full pb-20 pt-2"
        >
            <Link href="/coaching" className="inline-flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) font-body font-bold text-[14px] mb-4 transition-colors">
                <ArrowLeft className="w-[16px] h-[16px]" /> Back to Coaches
            </Link>

            {/* Profile Header */}
            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm mb-6 relative">
                <div className="h-[200px] w-full bg-[#1c1c1c] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coach.cover} alt="Cover" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                <div className="px-6 sm:px-10 pb-8 relative pt-20">
                    <div className="absolute -top-[60px] left-6 sm:left-10 p-2 bg-(--bg-surface) rounded-[24px] border border-(--border-subtle) shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coach.avatar} alt={coach.name} className="w-[100px] h-[100px] rounded-[16px] object-cover" />
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="font-display font-black text-[32px] text-(--text-primary) leading-none">{coach.name}</h1>
                                <span className="bg-blue-500/10 text-blue-500 font-bold text-[11px] px-2 py-1 rounded-[6px] flex items-center gap-1 uppercase tracking-wider">
                                    <CheckCircle2 className="w-[12px] h-[12px]" /> Verified
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 font-body text-[14px] text-(--text-secondary) font-medium mb-4">
                                <span className="flex items-center gap-1.5"><Star className="w-[16px] h-[16px] fill-[var(--status-warning)] text-[var(--status-warning)]" /> {coach.rating} ({coach.reviewCount} reviews)</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-[16px] h-[16px]" /> {coach.location}</span>
                                <span className="flex items-center gap-1.5"><Award className="w-[16px] h-[16px]" /> {coach.experience} Exp</span>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {coach.specialties.map(spec => (
                                    <span key={spec} className="bg-[var(--bg-elevated)] border border-(--border-default) px-3 py-1 rounded-full font-body text-[12px] font-bold text-(--text-primary)">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button
                                onClick={() => { void handleSubscribe() }}
                                disabled={isSubscribing}
                                className="h-[48px] px-8 rounded-[14px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-display font-bold text-[16px] transition-all shadow-md flex items-center justify-center gap-2 w-full cursor-pointer"
                            >
                                {isSubscribing ? 'Processing...' : 'Subscribe Now'}
                            </button>
                            <button
                                onClick={() => router.push(`/messages?coach=${encodeURIComponent(coach.name)}`)}
                                className="h-[48px] px-8 rounded-[14px] border border-(--border-subtle) bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-alt)] text-(--text-primary) font-display font-bold text-[16px] transition-all flex items-center justify-center gap-2 w-full cursor-pointer"
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex border-b border-(--border-subtle) gap-6 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn("pb-3 font-display font-black text-[16px] transition-colors relative whitespace-nowrap capitalize", activeTab === tab ? "text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)")}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'programs' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { name: 'Basic Tier', price: 49, features: ['1 Custom Program', 'Monthly Check-in', 'App Access'] },
                                { name: 'Premium Tier', price: 99, features: ['Weekly Check-ins', 'Macro Adjustments', 'Form Reviews', 'Priority Chat'] },
                                { name: 'Elite Tier', price: 199, features: ['Daily Chat Support', '1-on-1 Zoom Calls', 'Vip Meetups', 'Custom Nutrition'] }
                            ].map(plan => (
                                <div key={plan.name} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col cursor-pointer hover:border-emerald-500 transition-colors group">
                                    <h3 className="font-display font-black text-[20px] text-(--text-primary) mb-1">{plan.name}</h3>
                                    <div className="font-display font-black text-[32px] text-(--text-primary) mb-6">${plan.price}<span className="text-[14px] font-body text-(--text-secondary) font-medium">/mo</span></div>
                                    <ul className="flex flex-col gap-3 mb-6 flex-1">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-2 font-body text-[14px] font-medium text-(--text-secondary)">
                                                <CheckCircle2 className="w-[16px] h-[16px] text-emerald-500 shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => { void handleSubscribe(plan.name, plan.price * 100) }}
                                        disabled={isSubscribing}
                                        className="w-full h-[44px] rounded-[12px] bg-[var(--bg-elevated)] group-hover:bg-emerald-500 group-hover:text-white border border-(--border-default) group-hover:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-[14px] transition-colors cursor-pointer"
                                    >
                                        Select Plan
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'posts' && (
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center py-20">
                            <Activity className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />
                            <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">No Public Posts Yet</h3>
                            <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px] text-center">This coach shares most of their content exclusively with active subscribers.</p>
                        </div>
                    )}
                    
                    {activeTab === 'reviews' && (
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center py-20">
                            <Star className="w-[48px] h-[48px] text-(--text-tertiary) mb-4" />
                            <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">4.9 Average Rating</h3>
                            <p className="font-body text-[14px] text-(--text-secondary) max-w-[300px] text-center">Reviews will be visible in the next update.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                    {/* About */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm">
                        <h3 className="font-display font-black text-[18px] text-(--text-primary) mb-3">About Coach</h3>
                        <p className="font-body text-[14px] text-(--text-secondary) leading-relaxed mb-6">
                            {coach.bio}
                        </p>
                        <h4 className="font-display font-bold text-[15px] text-(--text-primary) mb-3">Certifications</h4>
                        <ul className="flex flex-col gap-2">
                            {coach.certifications.map(cert => (
                                <li key={cert} className="flex items-center gap-2 font-body text-[14px] font-medium text-(--text-primary)">
                                    <Award className="w-[16px] h-[16px] text-emerald-500 shrink-0" /> {cert}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Intro Video */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-4 shadow-sm relative overflow-hidden group cursor-pointer h-[180px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&fit=crop" alt="Coach intro video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <div className="w-[48px] h-[48px] rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-[24px] h-[24px]" />
                            </div>
                            <span className="font-display font-bold text-[15px] text-white">Watch Intro Video</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
