'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Weight, HeartPulse, Droplets, Activity, Plus } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useHydrationStore } from '@/store/useHydrationStore'
import { toast } from 'sonner'

const MacroRingCard = dynamic(() => import('@/components/dashboard/MacroRingCard').then((m) => m.MacroRingCard), {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse" />
})

const RecommendedActivity = dynamic(() => import('@/components/dashboard/RecommendedActivity').then((m) => m.RecommendedActivity), {
    ssr: false,
    loading: () => <div className="h-[260px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse" />
})

const FitnessGoalCard = dynamic(() => import('@/components/dashboard/FitnessGoalCard').then((m) => m.FitnessGoalCard), {
    ssr: false,
    loading: () => <div className="h-[260px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse" />
})

const HeartRateCard = dynamic(() => import('@/components/dashboard/HeartRateCard').then((m) => m.HeartRateCard), {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse" />
})

export default function DashboardPage() {
    const getHydrationDay = useHydrationStore(s => s.getHydrationDay)
    const addDrink = useHydrationStore(s => s.addDrink)

    const todayDate = new Date().toISOString().split('T')[0]
    const hydrationDay = getHydrationDay(todayDate)

    const waterPercentage = hydrationDay ? Math.min(100, Math.round((hydrationDay.totalHydrationMl / hydrationDay.goalMl) * 100)) : 0

    const handleQuickAddWater = () => {
        addDrink(todayDate, {
            type: 'water',
            label: 'Quick Water',
            amountMl: 250,
            hydrationFactor: 1,
            caffeinesMg: 0,
            loggedAt: new Date().toISOString()
        })
        toast.success('Added 250ml of water!')
    }

    return (
        <div className="flex flex-col gap-[16px] max-w-7xl">

            <div className="flex flex-col md:flex-row gap-[16px]">
                <MetricCard title="Weight balance" icon={Weight} value="73" unit="kg" trend="↑ 0.22%" trendUp={true} href="/progress" />
                <MetricCard title="Heart rate" icon={HeartPulse} value="90" unit="bpm" href="/analytics" />
                <MetricCard
                    title="Hydration level"
                    icon={Droplets}
                    value={waterPercentage}
                    unit="%"
                    trend={`${hydrationDay?.totalHydrationMl || 0}/${hydrationDay?.goalMl || 3000} ml`}
                    trendUp={true}
                    href="/hydration"
                    action={
                        <button
                            onClick={(e) => { e.preventDefault(); handleQuickAddWater(); }}
                            className="h-[28px] px-3 bg-(--accent) text-white font-body text-[12px] font-bold rounded-full hover:bg-(--accent-hover) transition-transform active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-[12px] h-[12px]" strokeWidth={3} /> Water
                        </button>
                    }
                />
                <MetricCard title="Calories burn" icon={Activity} value="1,100" unit="kcal" trend="↑ 2.22%" trendUp={true} href="/exercises" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[16px]">
                <MacroRingCard />
                <HeartRateCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[16px]">
                <RecommendedActivity />
                <FitnessGoalCard />
            </div>

        </div>
    )
}