'use client'

import React, { useState } from 'react'
import { Zap } from 'lucide-react'
import { calculateProteinTarget } from '@/lib/calculations'
import { FitnessGoal, ActivityLevel } from '@/types'

export function ProteinWidget() {
    const [weight, setWeight] = useState(70)
    const [goal, setGoal] = useState<FitnessGoal>('muscle_gain')
    const [activity, setActivity] = useState<ActivityLevel>('moderate')

    const protein = calculateProteinTarget(weight, goal, activity)

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Inputs */}
            <div className="flex-1 space-y-4">
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Body Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)" />
                </div>
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Primary Goal</label>
                    <select value={goal} onChange={e => setGoal(e.target.value as FitnessGoal)}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)">
                        <option value="weight_loss">Lose Fat (Preserve Muscle)</option>
                        <option value="muscle_gain">Build Muscle (Bulk)</option>
                        <option value="maintenance">Maintain Weight</option>
                        <option value="recomposition">Body Recomposition</option>
                    </select>
                </div>
                <div>
                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Activity Level</label>
                    <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}
                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:outline-none focus:border-(--accent) text-(--text-primary)">
                        <option value="sedentary">Sedentary</option>
                        <option value="light">Lightly Active</option>
                        <option value="moderate">Moderately Active</option>
                        <option value="very_active">Very Active</option>
                    </select>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[20px] p-6 flex flex-col justify-center items-center text-center">
                <div className="w-[48px] h-[48px] rounded-full bg-(--chart-blue) bg-opacity-20 flex items-center justify-center mb-4">
                    <Zap className="w-[24px] h-[24px] text-(--chart-blue)" />
                </div>
                <span className="font-body text-[13px] text-(--text-secondary) uppercase tracking-wider font-semibold mb-2">Daily Protein Target</span>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display font-bold text-[48px] text-(--text-primary) leading-none">{protein}</span>
                    <span className="font-body text-[16px] text-(--text-secondary) font-medium">grams</span>
                </div>
                <p className="font-body text-[13px] text-(--text-tertiary) max-w-[240px]">
                    Based on clinical equations for optimal protein synthesis relative to your goal and weight.
                </p>
            </div>
        </div>
    )
}
