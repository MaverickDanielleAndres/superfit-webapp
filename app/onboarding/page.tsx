'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check, Activity, Target, Zap, ChevronRight, Droplet, Pill, HeartPulse, Sparkles, Scale, Dumbbell, Utensils } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Sex, ActivityLevel, FitnessGoal, DietaryPreference, ExercisePreference } from '@/types'
import { calculateBMI, calculateBMR, calculateTDEE } from '@/lib/calculations'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
    const router = useRouter()
    const { completeOnboarding } = useAuthStore()

    const [step, setStep] = useState(1)
    const totalSteps = 11

    // Form State
    const [name, setName] = useState('')
    const [age, setAge] = useState<number>(30)
    const [sex, setSex] = useState<Sex>('male')
    const [height, setHeight] = useState<number>(175)
    const [currentWeight, setCurrentWeight] = useState<number>(75)
    const [goalWeight, setGoalWeight] = useState<number>(70)
    const [goal, setGoal] = useState<FitnessGoal>('weight_loss')
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
    const [weeklyWorkouts, setWeeklyWorkouts] = useState<number>(3)
    const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('omnivore')
    const [exercisePreferences, setExercisePreferences] = useState<ExercisePreference[]>([])
    const [supplements, setSupplements] = useState<string[]>([])
    const [healthConditions, setHealthConditions] = useState<string[]>([])
    const [waterConsumption, setWaterConsumption] = useState<string>('average')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleNext = () => { if (step < totalSteps) setStep(step + 1) }
    const handleBack = () => { if (step > 1) setStep(step - 1) }

    const handleComplete = async () => {
        setIsSubmitting(true)
        const success = await completeOnboarding({
            name,
            age,
            sex,
            height,
            currentWeight,
            goalWeight,
            goal,
            activityLevel,
            weeklyWorkouts,
            dietaryPreference,
            exercisePreferences,
        })
        setIsSubmitting(false)
        if (success) {
            router.push('/')
        }
    }

    // Calculations for Step 9 & 10
    const { bmi, category } = calculateBMI(currentWeight, height)
    const bmr = calculateBMR(currentWeight, height, age, sex)
    const tdee = calculateTDEE(bmr, activityLevel)
    const weightDiff = currentWeight - goalWeight
    const isLoss = weightDiff > 0
    const weeksToGoal = Math.abs(weightDiff) / 0.5 // 0.5kg week safe progress

    let baseWaterMl = currentWeight * 35 // 35ml per kg base
    if (activityLevel === 'moderate') baseWaterMl += 500
    if (activityLevel === 'very_active') baseWaterMl += 1000
    if (waterConsumption === 'low') baseWaterMl += 250 // need to drink more than they feel

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 text-center py-6">
                        <div className="w-[80px] h-[80px] mx-auto rounded-[24px] bg-(--accent-bg) flex items-center justify-center">
                            <Sparkles className="w-[40px] h-[40px] text-(--accent)" />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-[32px] text-(--text-primary) tracking-tight mb-3">Welcome to SuperFit</h2>
                            <p className="font-body text-(--text-secondary) text-[16px] leading-relaxed max-w-[320px] mx-auto">
                                Let&apos;s build your perfect, personalized fitness engine. We&apos;ll ask a few questions to calibrate your experience.
                            </p>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div className="space-y-6">
                        <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Basic Biometrics</h2>
                        <p className="font-body text-(--text-secondary) text-[14px]">Let&apos;s tailor SuperFit to your body.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent)" placeholder="What should we call you?" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Age</label>
                                    <input type="number" value={age} onChange={e => setAge(Number(e.target.value))}
                                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent)" />
                                </div>
                                <div>
                                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Sex at birth</label>
                                    <select value={sex} onChange={e => setSex(e.target.value as Sex)}
                                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent) text-(--text-primary)">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Height (cm)</label>
                                    <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
                                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent)" />
                                </div>
                                <div>
                                    <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Current Weight (kg)</label>
                                    <input type="number" value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))}
                                        className="w-full h-[48px] bg-[var(--bg-elevated)] border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent)" />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Target className="w-[32px] h-[32px] text-blue-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">What&apos;s your primary goal?</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'weight_loss', label: 'Lose Weight & Burn Fat', icon: Activity },
                                { id: 'muscle_gain', label: 'Build Muscle & Bulk', icon: Zap },
                                { id: 'recomposition', label: 'Body Recomposition', icon: Target },
                                { id: 'maintenance', label: 'Maintain Current Weight', icon: Check }
                            ].map(g => (
                                <button key={g.id} onClick={() => setGoal(g.id as FitnessGoal)}
                                    className={cn("h-[64px] px-4 rounded-[14px] border flex items-center gap-4 transition-all",
                                        goal === g.id ? "bg-[var(--accent-bg-strong)] border-(--accent) text-(--accent)" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-primary) hover:border-(--border-subtle) hover:bg-[var(--bg-surface-alt)]"
                                    )}>
                                    <g.icon className="w-[20px] h-[20px] shrink-0" />
                                    <span className="font-body font-medium text-[15px]">{g.label}</span>
                                </button>
                            ))}
                        </div>
                        {goal !== 'maintenance' && (
                            <div className="mt-4 p-4 border border-(--border-subtle) rounded-[14px] bg-[var(--bg-elevated)]">
                                <label className="block font-body text-[13px] text-(--text-secondary) mb-1">Target Goal Weight (kg)</label>
                                <input type="number" value={goalWeight} onChange={e => setGoalWeight(Number(e.target.value))}
                                    className="w-full h-[48px] bg-(--bg-base) border border-(--border-default) rounded-[12px] px-4 font-body text-[15px] focus:border-(--accent)" />
                            </div>
                        )}
                    </div>
                )
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Activity className="w-[32px] h-[32px] text-orange-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Base Activity Level</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">How active are you outside of purposeful workouts?</p>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, mostly sitting (< 5k steps)' },
                                { id: 'light', label: 'Lightly Active', sub: 'Teacher, retail, on feet often (5k-8k steps)' },
                                { id: 'moderate', label: 'Moderately Active', sub: 'Waitress, construction (8k-12k steps)' },
                                { id: 'very_active', label: 'Very Active', sub: 'Heavy manual labor (> 12k steps)' }
                            ].map(a => (
                                <button key={a.id} onClick={() => setActivityLevel(a.id as ActivityLevel)}
                                    className={cn("p-4 rounded-[14px] border flex items-start gap-4 transition-all text-left",
                                        activityLevel === a.id ? "bg-[var(--accent-bg-strong)] border-(--accent)" : "bg-[var(--bg-elevated)] border-(--border-default) hover:border-(--border-subtle)"
                                    )}>
                                    <div className="flex-1">
                                        <div className={cn("font-body font-medium text-[15px]", activityLevel === a.id ? "text-(--accent)" : "text-(--text-primary)")}>{a.label}</div>
                                        <div className="font-body text-[12px] text-(--text-secondary) mt-1">{a.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            case 5:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Dumbbell className="w-[32px] h-[32px] text-zinc-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Workout Frequency</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">How many training sessions per week are you committing to?</p>

                        <div className="bg-[var(--bg-elevated)] p-6 rounded-[16px] border border-(--border-subtle) text-center space-y-4">
                            <span className="font-display text-[48px] font-black text-(--accent)">{weeklyWorkouts}</span>
                            <span className="block font-body text-[14px] text-(--text-secondary)">sessions / week</span>
                            <input
                                type="range"
                                min="0" max="7"
                                value={weeklyWorkouts}
                                onChange={(e) => setWeeklyWorkouts(Number(e.target.value))}
                                className="w-full h-2 bg-(--border-default) rounded-lg appearance-none cursor-pointer accent-(--accent)"
                            />
                        </div>

                        <div className="pt-4">
                            <label className="block font-body text-[13px] text-(--text-secondary) mb-3">Favorite Exercise Types</label>
                            <div className="flex flex-wrap gap-2">
                                {['weights', 'cardio', 'hiit', 'yoga', 'cycling', 'running', 'martial_arts', 'sports'].map(ex => {
                                    const isSelected = exercisePreferences.includes(ex as ExercisePreference)
                                    return (
                                        <button key={ex}
                                            onClick={() => {
                                                if (isSelected) setExercisePreferences(prev => prev.filter(p => p !== ex))
                                                else setExercisePreferences(prev => [...prev, ex as ExercisePreference])
                                            }}
                                            className={cn("px-4 h-[40px] rounded-full border font-body text-[14px] capitalize transition-all",
                                                isSelected ? "bg-(--chart-purple) border-(--chart-purple) text-white" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary) hover:border-(--border-subtle)"
                                            )}>
                                            {ex.replace('_', ' ')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            case 6:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Utensils className="w-[32px] h-[32px] text-green-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Dietary Profile</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">This defines how your macronutrients are split.</p>

                        <div className="grid grid-cols-2 gap-3">
                            {['omnivore', 'vegan', 'vegetarian', 'keto', 'paleo', 'flexitarian'].map(d => (
                                <button key={d} onClick={() => setDietaryPreference(d as DietaryPreference)}
                                    className={cn("h-[64px] rounded-[14px] border font-body text-[15px] font-medium capitalize transition-all",
                                        dietaryPreference === d ? "bg-(--accent) border-(--accent) text-white shadow-md shadow-emerald-500/20" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)"
                                    )}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            case 7:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Pill className="w-[32px] h-[32px] text-purple-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Supplement Use</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">Select any supplements you take to help us build your daily stacked schedule.</p>

                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'creatine', label: 'Creatine', sub: '5g daily recommendation' },
                                { id: 'protein', label: 'Whey / Plant Protein', sub: 'Calculated in macros' },
                                { id: 'preworkout', label: 'Pre-Workout / Caffeine', sub: 'We will track your caffeine limit' },
                                { id: 'vitamins', label: 'Multivitamin / Fish Oil', sub: 'Daily health staples' }
                            ].map(s => {
                                const isSelected = supplements.includes(s.id);
                                return (
                                    <button key={s.id} onClick={() => {
                                        if (isSelected) setSupplements(prev => prev.filter(p => p !== s.id))
                                        else setSupplements(prev => [...prev, s.id])
                                    }}
                                        className={cn("p-4 rounded-[14px] border flex items-center gap-4 transition-all text-left",
                                            isSelected ? "bg-(--chart-purple)/10 border-(--chart-purple)" : "bg-[var(--bg-elevated)] border-(--border-default) hover:border-(--border-subtle)"
                                        )}>
                                        <div className="flex-1">
                                            <div className={cn("font-body font-medium text-[15px]", isSelected ? "text-(--chart-purple)" : "text-(--text-primary)")}>{s.label}</div>
                                            <div className="font-body text-[12px] text-(--text-secondary) mt-1">{s.sub}</div>
                                        </div>
                                        <div className={cn("w-[24px] h-[24px] rounded-md border-2 flex items-center justify-center shrink-0",
                                            isSelected ? "border-(--chart-purple) bg-(--chart-purple)" : "border-(--border-subtle)"
                                        )}>
                                            {isSelected && <Check className="w-[14px] h-[14px] text-white" />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            case 8:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <HeartPulse className="w-[32px] h-[32px] text-red-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Health Flags (Optional)</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">Do you have any conditions we should account for when recommending meals or exercises?</p>

                        <div className="flex flex-wrap gap-2">
                            {['PCOS', 'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Celiac', 'Lactose Intolerant', 'History of Eating Disorder', 'Joint Pain / Injury'].map(hc => {
                                const isSelected = healthConditions.includes(hc)
                                return (
                                    <button key={hc}
                                        onClick={() => {
                                            if (isSelected) setHealthConditions(prev => prev.filter(p => p !== hc))
                                            else setHealthConditions(prev => [...prev, hc])
                                        }}
                                        className={cn("px-4 h-[40px] rounded-full border font-body text-[14px] transition-all",
                                            isSelected ? "bg-red-500 border-red-500 text-white" : "bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary) hover:border-(--border-subtle)"
                                        )}>
                                        {hc}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-8 p-4 rounded-[12px] bg-amber-500/10 border border-amber-500/30 font-body text-[13px] text-amber-600">
                            Note: SuperFit is a fitness tool, not a medical device. Always consult your physician.
                        </div>
                    </div>
                )
            case 9:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Droplet className="w-[32px] h-[32px] text-cyan-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Water Assessment</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">Hydration limits fatigue and improves fat oxidation.</p>

                        <div>
                            <label className="block font-body text-[13px] text-(--text-secondary) mb-3">How much water do you currently drink?</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'low', label: 'Less than 1L', sub: '1-3 glasses a day' },
                                    { id: 'average', label: '1L - 2.5L', sub: '4-8 glasses a day' },
                                    { id: 'high', label: 'More than 2.5L', sub: 'I carry a gallon jug' },
                                ].map(w => (
                                    <button key={w.id} onClick={() => setWaterConsumption(w.id)}
                                        className={cn("p-4 rounded-[14px] border flex items-center justify-between transition-all text-left",
                                            waterConsumption === w.id ? "bg-cyan-500/10 border-cyan-500" : "bg-[var(--bg-elevated)] border-(--border-default) hover:border-(--border-subtle)"
                                        )}>
                                        <div>
                                            <div className={cn("font-body font-medium text-[15px]", waterConsumption === w.id ? "text-cyan-600" : "text-(--text-primary)")}>{w.label}</div>
                                            <div className="font-body text-[12px] text-(--text-secondary) mt-1">{w.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            case 10:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Scale className="w-[32px] h-[32px] text-emerald-500" />
                            <h2 className="font-display font-bold text-[28px] text-(--text-primary)">Your Blueprints</h2>
                        </div>
                        <p className="font-body text-(--text-secondary) text-[14px]">We have crunched the numbers.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-elevated)] p-4 rounded-[16px] border border-(--border-subtle)">
                                <span className="font-body text-[12px] text-(--text-tertiary) uppercase tracking-wider font-semibold">Current BMI</span>
                                <div className="flex items-end gap-2 mt-1">
                                    <span className="font-display font-bold text-[28px] leading-none text-(--text-primary)">{bmi}</span>
                                </div>
                                <div className="font-body text-[12px] mt-2 text-(--text-secondary)">
                                    Category: <span className={category === 'Healthy weight' ? 'text-(--status-success)' : 'text-(--status-warning)'}>{category}</span>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-elevated)] p-4 rounded-[16px] border border-(--border-subtle)">
                                <span className="font-body text-[12px] text-(--text-tertiary) uppercase tracking-wider font-semibold">TDEE</span>
                                <div className="flex items-end gap-2 mt-1">
                                    <span className="font-display font-bold text-[28px] leading-none text-(--text-primary)">{Math.round(tdee)}</span>
                                    <span className="font-body text-[12px] text-(--text-secondary) mb-1">kcal</span>
                                </div>
                                <div className="font-body text-[12px] mt-2 text-(--text-secondary)">
                                    Total Daily Burn
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-[16px] flex items-center justify-between">
                            <div>
                                <span className="block font-body text-[12px] text-cyan-700 uppercase tracking-wider font-semibold mb-1">Water Target</span>
                                <span className="block font-display font-bold text-[24px] text-cyan-600">{Math.round(baseWaterMl)} ml</span>
                            </div>
                            <Droplet className="w-[32px] h-[32px] text-cyan-400 opacity-50" />
                        </div>

                        {goal !== 'maintenance' && (
                            <div className="bg-[var(--accent-bg-strong)] border border-(--accent) p-5 rounded-[16px]">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-[20px] h-[20px] text-(--accent)" />
                                    <span className="font-display font-semibold text-[16px] text-(--text-primary)">Goal Trajectory</span>
                                </div>
                                <p className="font-body text-[14px] text-(--text-primary) leading-relaxed">
                                    Based on a safe steady pace, you can reach your goal weight of <span className="font-bold">{goalWeight}kg</span> in approximately <span className="font-bold text-(--accent)">{Math.round(weeksToGoal)} weeks</span>.
                                    We will build a {isLoss ? 'caloric deficit' : 'caloric surplus'} to help you get there sustainably.
                                </p>
                            </div>
                        )}
                    </div>
                )
            case 11:
                return (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 text-center py-10">
                        <div className="w-[100px] h-[100px] rounded-full bg-emerald-500 flex items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <Check className="w-[50px] h-[50px] text-white" />
                            </motion.div>
                        </div>
                        <div className="pt-4">
                            <h2 className="font-display font-black tracking-tight text-[32px] text-(--text-primary) mb-3">Engine Configured!</h2>
                            <p className="font-body text-(--text-secondary) text-[16px] max-w-[280px] mx-auto leading-relaxed">
                                {name || 'Champ'}, your macros, hydration limits, and dashboards are dialed in.
                            </p>
                        </div>
                    </div>
                )
        }
    }

    // Only show back button logic for steps 2 through 11
    const showBack = step > 1
    // Show top progress bar everywhere except step 1 and 11
    const showProgress = step > 1 && step < totalSteps
    const progressPercent = ((step - 1) / (totalSteps - 1)) * 100

    return (
        <div className="min-h-screen bg-(--bg-base) flex flex-col items-center pt-8 md:pt-16 px-4">

            {showProgress && (
                <div className="w-full max-w-[500px] mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={handleBack} className={cn("w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all", step > 1 ? "bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) hover:bg-(--border-subtle)" : "opacity-0 cursor-default")}>
                            <ArrowLeft className="w-[16px] h-[16px]" />
                        </button>
                        <span className="font-display font-semibold text-[13px] tracking-widest uppercase text-(--text-tertiary)">
                            Step {step - 1} of {totalSteps - 2}
                        </span>
                        <div className="w-[36px]"></div> {/* Spacer */}
                    </div>
                    <div className="h-[6px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-(--accent)"
                            initial={{ width: `${((step - 2) / (totalSteps - 2)) * 100}%` }}
                            animate={{ width: `${((step - 1) / (totalSteps - 2)) * 100}%` }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        />
                    </div>
                </div>
            )}

            {/* Main Form Card */}
            <div className={cn("w-full max-w-[500px]", !showProgress && "mt-[10vh]")}>
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={step}>
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="mt-10 flex justify-end">
                        {step === 1 ? (
                            <button
                                onClick={handleNext}
                                className="w-full h-[56px] rounded-[14px] bg-(--text-primary) text-(--bg-base) font-body font-semibold text-[16px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                            >
                                Get Started
                            </button>
                        ) : step < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={step === 2 && (!name || !age || !height || !currentWeight)}
                                className="h-[52px] px-8 rounded-[14px] bg-(--text-primary) text-(--bg-base) font-body font-semibold text-[15px] flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Continue <ArrowRight className="w-[18px] h-[18px]" />
                            </button>
                        ) : (
                            <button
                                onClick={() => { void handleComplete() }}
                                disabled={isSubmitting}
                                className="w-full h-[56px] rounded-[14px] bg-(--accent) text-white font-display font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-(--accent-hover) transition-all shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.5)] transform hover:-translate-y-[2px]"
                            >
                                Enter Dashboard <ChevronRight className="w-[20px] h-[20px]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
