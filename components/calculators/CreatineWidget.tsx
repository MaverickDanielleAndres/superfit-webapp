'use client'

import React, { useState } from 'react'
import { Calculator } from 'lucide-react'
import { calculateCreatine } from '@/lib/calculations'

export function CreatineWidget() {
    const [weight, setWeight] = useState(70)

    const { loadDaily, maintainDaily } = calculateCreatine(weight)

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Inputs */}
            <div className="flex-1 space-y-4 flex flex-col justify-center">
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Body Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                </div>
                <p className="font-body text-[13px] text-(--text-secondary) mt-4">
                    Creatine monohydrate is the most researched sports supplement. It increases phosphocreatine stores in muscle, enhancing power output.
                </p>
            </div>

            {/* Results */}
            <div className="flex-1 bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[20px] p-6 flex flex-col gap-6">

                <div className="flex items-center gap-4">
                    <div className="w-[40px] h-[40px] rounded-full bg-(--chart-amber) bg-opacity-20 flex items-center justify-center">
                        <Calculator className="w-[20px] h-[20px] text-(--chart-amber)" />
                    </div>
                    <div>
                        <span className="block font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold">Loading Phase (Days 1-5)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="font-display font-bold text-[24px] text-(--text-primary) leading-none">{loadDaily}</span>
                            <span className="font-body text-[13px] text-(--text-secondary)">grams / day</span>
                        </div>
                    </div>
                </div>

                <div className="h-[1px] bg-(--border-subtle) w-full" />

                <div className="flex items-center gap-4">
                    <div className="w-[40px] h-[40px] rounded-full bg-(--accent) bg-opacity-20 flex items-center justify-center">
                        <Calculator className="w-[20px] h-[20px] text-(--accent)" />
                    </div>
                    <div>
                        <span className="block font-body text-[12px] text-(--text-secondary) uppercase tracking-wider font-semibold">Maintenance Phase</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="font-display font-bold text-[24px] text-(--text-primary) leading-none">{maintainDaily}</span>
                            <span className="font-body text-[13px] text-(--text-secondary)">grams / day</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
