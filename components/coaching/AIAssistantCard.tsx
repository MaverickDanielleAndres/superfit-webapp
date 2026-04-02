'use client'

import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

export function AIAssistantCard() {
    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-[24px] relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute -top-[20px] -right-[20px] w-[120px] h-[120px] bg-(--accent) opacity-[0.05] rounded-full blur-2xl pointer-events-none" />

            <div className="w-[40px] h-[40px] rounded-[12px] bg-[var(--accent-bg-strong)] flex items-center justify-center mb-[16px]">
                <Sparkles className="w-[20px] h-[20px] text-(--accent)" />
            </div>

            <h3 className="font-display font-semibold text-[18px] text-(--text-primary) leading-snug mb-[8px]">
                Need help finding the perfect coach?
            </h3>

            <p className="font-body text-[13px] text-(--text-secondary) leading-relaxed mb-[24px]">
                Our AI matches your specific goals, schedule, and preferences with the best available fitness professionals.
            </p>

            <button className="w-full h-[44px] rounded-[12px] bg-(--text-primary) hover:opacity-90 text-(--bg-base) font-body font-medium text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer">
                Start Assessment <ArrowRight className="w-[16px] h-[16px]" />
            </button>

        </div>
    )
}
