'use client'

import React from 'react'
import { Star, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'

function getSafeCoachAvatar(avatar: string, name: string): string {
    const trimmed = String(avatar || '').trim()
    if (trimmed.length > 0) return trimmed
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name || 'coach')}`
}

interface CoachCardProps {
    id?: string
    name: string
    avatar: string
    location?: string
    specialty: string[]
    shortBio: string
    rating: number
    reviewCount: number
    price: number
    isAvailable: boolean
}

export function CoachCard({
    id, name, avatar, specialty, shortBio, rating, reviewCount, price, isAvailable
}: CoachCardProps) {
    const router = useRouter()
    const safeAvatar = getSafeCoachAvatar(avatar, name)

    const handleMessage = async () => {
        if (!id) return

        try {
            const response = await requestApi<{ threadId: string }>('/api/v1/messages/direct-thread', {
                method: 'POST',
                body: JSON.stringify({ participantId: id }),
            })
            router.push(`/messages?thread=${encodeURIComponent(response.data.threadId)}`)
        } catch (error) {
            const status = typeof error === 'object' && error !== null && 'status' in error
                ? Number((error as { status?: unknown }).status)
                : 0

            if (status === 403) {
                toast.info('Subscribe first, or establish an active coach-client link before messaging.')
                return
            }

            toast.error('Unable to open chat right now.')
        }
    }

    const handleViewProfile = () => {
        if (!id) return
        router.push(`/coaching/${id}`)
    }

    return (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[20px] p-[20px] hover:border-[var(--border-default)] transition-all group">

            {/* Top Header */}
            <div className="flex justify-between items-start mb-[16px]">
                <div className="flex items-center gap-[12px]">
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={safeAvatar} alt={name} className="w-[48px] h-[48px] rounded-full object-cover border border-(--border-subtle)" />
                        {isAvailable && (
                            <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-(--status-success) rounded-full border-2 border-[var(--bg-elevated)]" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-display font-semibold text-[16px] text-(--text-primary) leading-none mb-1">
                            {name}
                        </h4>
                        <div className="flex items-center gap-1 text-(--text-secondary)">
                            <Star className="w-[12px] h-[12px] fill-(--status-warning) text-(--status-warning)" />
                            <span className="font-body font-medium text-[12px] leading-none">{rating} • {reviewCount} reviews</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="font-display font-semibold text-[18px] text-(--text-primary) leading-none">${price}</span>
                    <span className="block font-body text-[11px] text-(--text-tertiary) mt-1">/ mo</span>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-[6px] mb-[12px]">
                {specialty.map(s => (
                    <span key={s} className="px-[8px] py-[4px] rounded-md bg-(--bg-surface-alt) text-(--text-secondary) font-body text-[11px] uppercase tracking-wider font-semibold">
                        {s.replace('_', ' ')}
                    </span>
                ))}
            </div>

            {/* Bio */}
            <p className="font-body text-[13px] text-(--text-secondary) mb-[20px] line-clamp-2">
                {shortBio}
            </p>

            {/* Actions */}
            <div className="flex gap-[8px]">
                <button 
                    onClick={handleViewProfile}
                    className="flex-1 h-[40px] rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-body font-bold text-[13px] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                >
                    Subscribe
                </button>
                <button 
                    onClick={handleViewProfile}
                    className="flex-1 h-[40px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) hover:bg-(--bg-surface-alt) text-(--text-primary) font-body font-bold text-[13px] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                >
                    Profile
                </button>
                <button 
                    onClick={() => { void handleMessage() }}
                    title="Message Coach"
                    className="w-[40px] h-[40px] shrink-0 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) hover:bg-(--bg-surface-alt) text-(--text-primary) transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                >
                    <MessageCircle className="w-[18px] h-[18px]" />
                </button>
            </div>

        </div>
    )
}
