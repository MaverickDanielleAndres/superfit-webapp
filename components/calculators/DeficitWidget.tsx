'use client'

import React, { useState } from 'react'
import { TrendingDown, Calendar } from 'lucide-react'
import { getDeficitScenarios, calculateBMR, calculateTDEE } from '@/lib/calculations'
import { Sex, ActivityLevel } from '@/types'

export function DeficitWidget() {
    const [currentWeight, setCurrentWeight] = useState(85)
    const [goalWeight, setGoalWeight] = useState(75)
    const [height, setHeight] = useState(180)
    const [age, setAge] = useState(30)
    const [sex, setSex] = useState<Sex>('male')
    const [activity, setActivity] = useState<ActivityLevel>('moderate')

    const bmr = calculateBMR(currentWeight, height, age, sex)
    const tdee = calculateTDEE(bmr, activity)

    const scenarios = getDeficitScenarios(tdee, currentWeight, goalWeight)

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Inputs */}
            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Current (kg)</label>
                        <input type="number" value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                    </div>
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Goal (kg)</label>
                        <input type="number" value={goalWeight} onChange={e => setGoalWeight(Number(e.target.value))}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Height (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                    </div>
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Age</label>
                        <input type="number" value={age} onChange={e => setAge(Number(e.target.value))}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Sex</label>
                        <select value={sex} onChange={e => setSex(e.target.value as Sex)}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Activity</label>
                        <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}
                            className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)">
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Lightly Active</option>
                            <option value="moderate">Moderate</option>
                            <option value="very_active">Very Active</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 bg-[var(--text-primary)] rounded-[20px] p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-[40px] h-[40px] rounded-full bg-(--bg-base) bg-opacity-20 flex items-center justify-center">
                        <TrendingDown className="w-[20px] h-[20px] text-(--bg-base)" />
                    </div>
                    <div>
                        <span className="block font-body text-[12px] text-(--bg-base) opacity-80 uppercase tracking-wider font-semibold">Maintenance TDEE</span>
                        <span className="font-display font-bold text-[20px] text-(--bg-base) leading-none">{Math.round(tdee)} kcal</span>
                    </div>
                </div>

                {scenarios.length > 0 ? (
                    <div className="space-y-3">
                        {scenarios.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-[12px] bg-(--bg-base) bg-opacity-10">
                                <div>
                                    <span className="block font-body text-[14px] font-medium text-(--bg-base)">{s.label}</span>
                                    <span className="block font-body text-[12px] text-(--bg-base) opacity-70">
                                        Target: {Math.max(1200, Math.round(tdee - s.deficit))} kcal/day
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-(--bg-base)">
                                    <Calendar className="w-[14px] h-[14px] opacity-80" />
                                    <span className="font-display font-bold text-[16px]">{s.weeks} wks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="font-body text-[14px] text-(--bg-base) opacity-80">
                            Current weight must be greater than goal weight for deficit modeling.
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
