'use client'

import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const data = [
    { time: 'Sun', bpm: 60 },
    { time: 'Mon', bpm: 68 },
    { time: 'Tue', bpm: 85 },
    { time: 'Wed', bpm: 72 },
    { time: 'Thu', bpm: 65 },
    { time: 'Fri', bpm: 90 },
    { time: 'Sat', bpm: 70 },
]

export function HeartRateCard() {
    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-[24px] flex flex-col h-[280px]">

            {/* Header */}
            <div className="flex justify-between items-center mb-[16px]">
                <h3 className="font-display font-semibold text-[18px] text-(--text-primary) leading-none">
                    Heart rate
                </h3>
                <button className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-(--text-tertiary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer">
                    <MoreHorizontal className="w-[20px] h-[20px]" />
                </button>
            </div>

            {/* Chart */}
            <div className="h-[130px] w-full mb-0 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-purple)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--chart-purple)" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} dy={10} />
                        <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
                        <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke="var(--chart-purple)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#heartGradient)"
                            activeDot={{ r: 4, fill: 'var(--chart-purple)', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Metrics */}
            <div className="border-t border-(--border-subtle) pt-[16px] grid grid-cols-3 mt-auto relative">
                <div className="flex flex-col">
                    <span className="font-body font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary) mb-1">CURRENT</span>
                    <div className="flex items-baseline gap-1">
                        <span className="font-display font-semibold text-[20px] text-(--text-primary) leading-none">1.6</span>
                        <span className="font-body font-normal text-[11px] text-(--text-secondary) leading-none">sec/sqt</span>
                    </div>
                </div>

                <div className="flex flex-col pl-[16px] border-l border-(--border-subtle)">
                    <span className="font-body font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary) mb-1">AVERAGE</span>
                    <div className="flex items-baseline gap-1">
                        <span className="font-display font-semibold text-[20px] text-(--text-primary) leading-none">2.2</span>
                        <span className="font-body font-normal text-[11px] text-(--text-secondary) leading-none">sec/sqt</span>
                    </div>
                </div>

                <div className="flex flex-col pl-[16px] border-l border-(--border-subtle)">
                    <span className="font-body font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary) mb-1">MAX</span>
                    <div className="flex items-baseline gap-1">
                        <span className="font-display font-semibold text-[20px] text-(--text-primary) leading-none">4.2</span>
                        <span className="font-body font-normal text-[11px] text-(--text-secondary) leading-none">sec/sqt</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
