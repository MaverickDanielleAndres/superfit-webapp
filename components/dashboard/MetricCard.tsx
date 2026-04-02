'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MetricCardProps {
    title: string
    value: string | number
    unit: string
    trend?: string
    trendUp?: boolean
    icon: LucideIcon
    href?: string
    action?: React.ReactNode
}

export function MetricCard({ title, value, unit, trend, trendUp, icon: Icon, href, action }: MetricCardProps) {
    const content = (
        <>
            {/* Title & Icon */}
            <div className="flex justify-between items-start">
                <span className="font-body font-medium text-[13px] text-(--text-secondary) leading-none">
                    {title}
                </span>
                <div className="flex items-center gap-2 relative z-10">
                    {action && <div onClick={(e) => e.preventDefault()}>{action}</div>}
                    <div className="w-[34px] h-[34px] rounded-[10px] bg-(--bg-elevated) flex items-center justify-center pointer-events-none group-hover:bg-[var(--bg-surface-alt)] transition-colors">
                        <Icon className="w-[17px] h-[17px] text-(--text-secondary)" strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* Value & Trend */}
            <div className="flex items-end justify-between mt-auto">
                <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-[28px] text-(--text-primary) leading-none">
                        {value}
                    </span>
                    <span className="font-body font-normal text-[13px] text-(--text-secondary) leading-none mb-[2px]">
                        {unit}
                    </span>
                </div>

                {trend && (
                    <span className={cn(
                        "font-body font-medium text-[12px] leading-none mb-[2px]",
                        trendUp ? "text-(--status-success)" : "text-(--status-danger)"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
        </>
    )

    if (href) {
        return (
            <Link href={href} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-[20px] flex-1 min-w-0 h-[90px] relative flex flex-col justify-between group hover:border-(--border-default) transition-colors cursor-pointer">
                {content}
            </Link>
        )
    }

    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-[20px] flex-1 min-w-0 h-[90px] relative flex flex-col justify-between group hover:border-(--border-default) transition-colors">
            {content}
        </div>
    )
}
