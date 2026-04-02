'use client'

import React from 'react'
import { MoreHorizontal, Grid2X2, List, Clock, Activity, Dumbbell, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const activities = [
    { id: 1, name: 'Chest focus', date: 'Thurs, 05 Sept 2024', time: '7:00 AM to 9:00 AM', price: '$11.70/m', icon: Dumbbell },
    { id: 2, name: 'Cardio & Abs', date: 'Fri, 06 Sept 2024', time: '8:00 AM to 10:00 AM', price: '$15.00/m', icon: Activity },
    { id: 3, name: 'HIIT Session', date: 'Sat, 07 Sept 2024', time: '9:00 AM to 10:30 AM', price: '$12.50/m', icon: Flame },
]

export function RecommendedActivity() {
    const [view, setView] = React.useState<'list' | 'grid'>('list')
    const router = useRouter()

    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-[24px]">

            {/* Header */}
            <div className="flex justify-between items-center mb-[16px]">
                <h3 className="font-display font-semibold text-[16px] text-(--text-primary) leading-none">
                    Recommended activity
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setView('list')}
                        className={cn("w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-colors cursor-pointer",
                            view === 'list' ? "bg-[var(--bg-elevated)] text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-primary)"
                        )}
                    >
                        <List className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setView('grid')}
                        className={cn("w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-colors cursor-pointer",
                            view === 'grid' ? "bg-[var(--bg-elevated)] text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-primary)"
                        )}
                    >
                        <Grid2X2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col">
                {activities.map((act, index) => (
                    <motion.div
                        key={act.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={cn(
                            "group flex items-center gap-[12px] py-[12px]",
                            index !== activities.length - 1 && "border-b border-(--border-subtle)"
                        )}
                    >
                        {/* Icon Block */}
                        <div className="w-[36px] h-[36px] rounded-[12px] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                            <act.icon className="w-[18px] h-[18px] text-(--accent)" strokeWidth={2.5} />
                        </div>

                        <div className="flex-1 flex flex-col justify-center min-w-0 cursor-pointer" onClick={() => router.push('/workout')}>
                            <span className="font-body font-semibold text-[14px] text-(--text-primary) leading-none mb-1 hover:text-(--accent) transition-colors truncate">
                                {act.name}
                            </span>
                            <span className="font-body font-normal text-[12px] text-(--text-tertiary) leading-none truncate">
                                {act.date}
                            </span>
                        </div>

                        {/* Time Block */}
                        <div className="text-right flex items-center justify-end gap-1.5 shrink-0 hidden sm:flex">
                            <Clock className="w-[14px] h-[14px] text-(--text-tertiary)" />
                            <span className="font-body font-normal text-[12px] text-(--text-secondary) leading-none">
                                {act.time}
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className="min-w-[60px] text-right shrink-0">
                            <span className="font-display font-semibold text-[13px] text-(--text-primary) leading-none">
                                {act.price}
                            </span>
                        </div>

                        {/* Action */}
                        <button className="w-[24px] h-[24px] rounded-md flex items-center justify-center text-(--text-tertiary) opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition-all cursor-pointer">
                            <MoreHorizontal className="w-[18px] h-[18px]" />
                        </button>
                    </motion.div>
                ))}
            </div>

        </div>
    )
}
