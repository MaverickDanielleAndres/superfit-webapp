'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNutritionStore } from '@/store/useNutritionStore'
import EditMacrosModal from './EditMacrosModal'

export function MacroRingCard() {
    const router = useRouter()
    const user = useAuthStore(s => s.user)
    const getDailyTotals = useNutritionStore(s => s.getDailyTotals)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // SVG specific logic based on exact pixel specs
    const strokeOuter = 8
    const strokeMid = 7
    const strokeInner = 6

    const rOuter = 54
    const rMid = 44
    const rInner = 34

    const todayDate = new Date().toISOString().split('T')[0]
    const totals = getDailyTotals(todayDate)

    const targetCals = user?.dailyCalorieTarget || 2000
    const targetProtein = user?.proteinTarget || 150
    const targetCarbs = user?.carbTarget || 200

    const calPercent = Math.min(100, (totals.calories / targetCals) * 100) || 0
    const carbsPercent = Math.min(100, (totals.carbs / targetCarbs) * 100) || 0
    const proteinPercent = Math.min(100, (totals.protein / targetProtein) * 100) || 0

    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-[24px] flex flex-row items-center h-[280px]">

            {/* SVG Ring Block */}
            <div className="w-[180px] shrink-0 relative flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-[160px] h-[160px] transform -rotate-90">

                    {/* Base track */}
                    <circle cx="80" cy="80" r={rOuter} fill="none" stroke="var(--border-subtle)" strokeWidth={strokeOuter} />

                    {/* Innermost - Protein (Blue) */}
                    <circle cx="80" cy="80" r={rInner} fill="none"
                        stroke="var(--chart-blue)" strokeWidth={strokeInner} strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * rInner}`}
                        strokeDashoffset={`${2 * Math.PI * rInner * (1 - proteinPercent / 100)}`} />

                    {/* Middle - Carbs (Amber) */}
                    <circle cx="80" cy="80" r={rMid} fill="none"
                        stroke="var(--chart-amber)" strokeWidth={strokeMid} strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * rMid}`}
                        strokeDashoffset={`${2 * Math.PI * rMid * (1 - carbsPercent / 100)}`} />

                    {/* Outermost - Calories (Green) */}
                    <circle cx="80" cy="80" r={rOuter} fill="none"
                        stroke="var(--chart-green)" strokeWidth={strokeOuter} strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * rOuter}`}
                        strokeDashoffset={`${2 * Math.PI * rOuter * (1 - calPercent / 100)}`} />
                </svg>

                {/* Center Text absolute positioning over SVG */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-extrabold text-[28px] text-(--text-primary) leading-none mt-1">
                        {Math.round(calPercent)}%
                    </span>
                    <span className="font-body font-normal text-[12px] text-(--text-secondary) leading-none mt-1">
                        {Math.round(totals.calories)} kcal
                    </span>
                </div>
            </div>

            {/* Legend Block */}
            <div className="flex-1 pl-[24px] flex flex-col justify-center relative">
                
                <button 
                    onClick={() => setIsEditOpen(true)}
                    className="absolute -top-2 right-0 w-[32px] h-[32px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                >
                    <Settings className="w-[14px] h-[14px]" />
                </button>

                <div className="flex items-center gap-[10px] mb-[16px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-(--chart-green) shrink-0" />
                    <span className="font-body font-normal text-[13px] text-(--text-secondary) shrink-0">Calories</span>
                    <span className="font-display font-semibold text-[15px] text-(--text-primary) ml-auto shrink-0">{Math.round(calPercent)}%</span>
                    <span className="font-body font-medium text-[12px] text-(--text-tertiary) shrink-0 w-[60px] text-right">{Math.round(totals.calories)}/{targetCals}</span>
                </div>

                <div className="flex items-center gap-[10px] mb-[16px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-(--chart-amber) shrink-0" />
                    <span className="font-body font-normal text-[13px] text-(--text-secondary) shrink-0">Carbs</span>
                    <span className="font-display font-semibold text-[15px] text-(--text-primary) ml-auto shrink-0">{Math.round(carbsPercent)}%</span>
                    <span className="font-body font-medium text-[12px] text-(--text-tertiary) shrink-0 w-[60px] text-right">{Math.round(totals.carbs)}/{targetCarbs}g</span>
                </div>

                <div className="flex items-center gap-[10px] mb-[16px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-(--chart-blue) shrink-0" />
                    <span className="font-body font-normal text-[13px] text-(--text-secondary) shrink-0">Protein</span>
                    <span className="font-display font-semibold text-[15px] text-(--text-primary) ml-auto shrink-0">{Math.round(proteinPercent)}%</span>
                    <span className="font-body font-medium text-[12px] text-(--text-tertiary) shrink-0 w-[60px] text-right">{Math.round(totals.protein)}/{targetProtein}g</span>
                </div>

                <button onClick={() => router.push('/diary')} className="w-full h-[40px] mt-[4px] rounded-[12px] border border-(--border-default) bg-transparent font-body font-medium text-[14px] text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:text-(--text-primary) transition-colors cursor-pointer">
                    View full details
                </button>
            </div>
            
            <EditMacrosModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
        </div>
    )
}
