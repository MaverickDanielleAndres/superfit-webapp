'use client'

import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import { calculateBMI } from '@/lib/calculations'
import { cn } from '@/lib/utils'

export function BMIWidget() {
    const [weight, setWeight] = useState(70)
    const [height, setHeight] = useState(175)

    const { bmi, category } = calculateBMI(weight, height)

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Inputs */}
            <div className="flex-1 space-y-4">
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                </div>
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Height (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[20px] p-6 flex flex-col justify-center items-center text-center">
                <div className="w-[48px] h-[48px] rounded-full bg-[var(--accent-bg-strong)] flex items-center justify-center mb-4">
                    <Activity className="w-[24px] h-[24px] text-(--accent)" />
                </div>
                <span className="font-body text-[13px] text-(--text-secondary) uppercase tracking-wider font-semibold mb-2">Your BMI</span>
                <span className="font-display font-bold text-[48px] text-(--text-primary) leading-none mb-2">{bmi}</span>
                <span className={cn("font-body font-medium text-[15px] px-3 py-1 rounded-full",
                    category === 'Healthy weight' ? 'bg-(--status-success) bg-opacity-10 text-(--status-success)' :
                        category === 'Underweight' ? 'bg-(--status-warning) bg-opacity-10 text-(--status-warning)' :
                            'bg-(--status-danger) bg-opacity-10 text-(--status-danger)'
                )}>
                    {category}
                </span>
            </div>
        </div>
    )
}
