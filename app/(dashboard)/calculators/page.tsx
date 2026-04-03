'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Calculator, Activity, Zap, TrendingDown, Droplet, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WidgetLoading = () => (
    <div className="w-full min-h-[360px] rounded-[16px] border border-(--border-default) bg-[var(--bg-elevated)] animate-pulse" />
)

const BMIWidget = dynamic(() => import('@/components/calculators/BMIWidget').then((m) => m.BMIWidget), {
    ssr: false,
    loading: () => <WidgetLoading />
})
const ProteinWidget = dynamic(() => import('@/components/calculators/ProteinWidget').then((m) => m.ProteinWidget), {
    ssr: false,
    loading: () => <WidgetLoading />
})
const CreatineWidget = dynamic(() => import('@/components/calculators/CreatineWidget').then((m) => m.CreatineWidget), {
    ssr: false,
    loading: () => <WidgetLoading />
})
const DeficitWidget = dynamic(() => import('@/components/calculators/DeficitWidget').then((m) => m.DeficitWidget), {
    ssr: false,
    loading: () => <WidgetLoading />
})

type CalcTab = 'bmi' | 'protein' | 'creatine' | 'deficit' | 'water'

export default function CalculatorsPage() {
    const [activeTab, setActiveTab] = useState<CalcTab>('bmi')
    const [wizardStep, setWizardStep] = useState(1)

    const tabs = [
        { id: 'bmi', label: 'BMI & Risk', icon: Activity },
        { id: 'protein', label: 'Protein Target', icon: Zap },
        { id: 'creatine', label: 'Creatine Dose', icon: Calculator },
        { id: 'deficit', label: 'Fat Loss Model', icon: TrendingDown },
        { id: 'water', label: 'Water Need', icon: Droplet },
    ] as const

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-5xl mx-auto h-full flex flex-col"
        >
            <div className="mb-[24px]">
                <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) leading-tight mb-2">
                    Health & Nutrition Calculators
                </h1>
                <p className="font-body text-[14px] text-(--text-secondary)">
                    Science-backed tools to fine-tune your nutrition and supplementation strategy.
                </p>
            </div>

            {wizardStep > 0 ? (
                <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                    {wizardStep === 1 && (
                        <div className="flex flex-col md:flex-row flex-1">
                            <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-body font-bold text-[12px] uppercase tracking-wider mb-4 w-max">Getting Started</span>
                                <h2 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight mb-4">Discover Your Perfect Numbers</h2>
                                <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed mb-8">
                                    Nutrition isn&apos;t one-size-fits-all. Follow our guided setup to find exactly what your body needs to reach its goals efficiently and safely.
                                </p>
                                <div className="flex flex-col gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-[20px] h-[20px] text-emerald-500 shrink-0" />
                                        <span className="font-body text-[15px] text-(--text-primary)">Science-backed formulas tailored to your biometrics</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-[20px] h-[20px] text-emerald-500 shrink-0" />
                                        <span className="font-body text-[15px] text-(--text-primary)">Calculates hydration, protein, bmi and macros accurately</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-[20px] h-[20px] text-emerald-500 shrink-0" />
                                        <span className="font-body text-[15px] text-(--text-primary)">Syncs seamlessly with your daily tracking goals</span>
                                    </div>
                                </div>
                                <button onClick={() => setWizardStep(2)} className="h-[48px] px-8 bg-emerald-500 text-white rounded-[14px] font-display font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors w-max cursor-pointer">
                                    Start Questionnaire <ArrowRight className="w-[18px] h-[18px]" />
                                </button>
                            </div>
                            <div className="md:w-1/2 relative bg-(--bg-elevated) min-h-[300px]">
                                <img src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply dark:opacity-60" alt="Fitness Calculation" />
                                <div className="absolute inset-0 bg-gradient-to-r from-(--bg-surface) to-transparent w-1/4" />
                            </div>
                        </div>
                    )}
                    {wizardStep === 2 && (
                        <div className="p-8 lg:p-12 flex flex-col items-center w-full flex-1">
                            <span className="block font-body text-[13px] text-emerald-500 font-bold tracking-wider uppercase mb-2">Step 1 of 3</span>
                            <h2 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) mb-2 text-center">What is your primary fitness goal?</h2>
                            <p className="font-body text-[15px] text-(--text-secondary) mb-8 text-center max-w-lg">This determines your calorie & macronutrient baselines to ensure calculations match your physique objectives.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                                {[
                                    { title: 'Lose Weight', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&fit=crop', desc: 'Focus on fat loss & calorie deficit' },
                                    { title: 'Build Muscle', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&fit=crop', desc: 'Hypertrophy & caloric surplus' },
                                    { title: 'Recomposition', img: 'https://images.unsplash.com/photo-1447031388589-38374a274534?w=400&fit=crop', desc: 'Burn fat and build muscle simultaneously' },
                                ].map(opt => (
                                    <button key={opt.title} onClick={() => setWizardStep(3)} className="group text-left border border-(--border-default) rounded-[20px] overflow-hidden hover:border-emerald-500 transition-colors bg-[var(--bg-elevated)] cursor-pointer flex flex-col shadow-sm hover:shadow-md">
                                        <div className="w-full h-[160px] overflow-hidden shrink-0">
                                            <img src={opt.img} alt={opt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="p-5 flex-1 bg-[var(--bg-surface)]">
                                            <h3 className="font-display font-bold text-[18px] text-(--text-primary)">{opt.title}</h3>
                                            <p className="font-body text-[13px] text-(--text-secondary) mt-1">{opt.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {wizardStep === 3 && (
                        <div className="p-8 lg:p-12 flex flex-col items-center w-full flex-1">
                            <span className="block font-body text-[13px] text-emerald-500 font-bold tracking-wider uppercase mb-2">Step 2 of 3</span>
                            <h2 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) mb-2 text-center">How active are you?</h2>
                            <p className="font-body text-[15px] text-(--text-secondary) mb-8 text-center max-w-lg">Select your weekly exercise frequency to compute your total daily energy expenditure (TDEE).</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl">
                                {[
                                    { title: 'Sedentary', img: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=400&fit=crop', desc: 'Desk job, little to no exercise' },
                                    { title: 'Lightly Active', img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&fit=crop', desc: '1-3 days of light exercise' },
                                    { title: 'Moderately Active', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&fit=crop', desc: '3-5 days of moderate exercise' },
                                    { title: 'Very Active', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&fit=crop', desc: '6-7 days of hard exercise' }
                                ].map(opt => (
                                    <button key={opt.title} onClick={() => setWizardStep(4)} className="group text-left border border-(--border-default) rounded-[20px] overflow-hidden hover:border-emerald-500 transition-colors bg-[var(--bg-elevated)] flex flex-col cursor-pointer shadow-sm hover:shadow-md">
                                        <div className="w-full h-[120px] overflow-hidden shrink-0">
                                            <img src={opt.img} alt={opt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="p-4 flex-1 bg-[var(--bg-surface)]">
                                            <h3 className="font-display font-bold text-[16px] text-(--text-primary)">{opt.title}</h3>
                                            <p className="font-body text-[12px] text-(--text-secondary) mt-1">{opt.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {wizardStep === 4 && (
                        <div className="p-8 lg:p-12 flex flex-col items-center text-center w-full flex-1 justify-center">
                            <span className="block font-body text-[13px] text-emerald-500 font-bold tracking-wider uppercase mb-2">Step 3 of 3</span>
                            <div className="w-[80px] h-[80px] rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                                <Droplet className="w-[40px] h-[40px] text-blue-500" />
                            </div>
                            <h2 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) mb-2">Current Water Intake?</h2>
                            <p className="font-body text-[15px] text-(--text-secondary) mb-8 max-w-md">How much water do you typically drink daily? We will customize a hydration plan for your biometrics.</p>
                            <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-2xl mb-8">
                                {['Less than 1L', '1L - 2L', '2L - 3L', 'Over 3L'].map(opt => (
                                    <button key={opt} onClick={() => setWizardStep(0)} className="h-[48px] px-6 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 font-body text-[15px] font-medium text-(--text-primary) transition-colors cursor-pointer shadow-sm">
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn("h-[40px] px-4 rounded-[12px] font-body text-[14px] font-medium flex items-center gap-2 transition-all cursor-pointer",
                                    activeTab === tab.id
                                        ? "bg-(--text-primary) text-(--bg-base)"
                                        : "bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-subtle)"
                                )}
                            >
                                <tab.icon className="w-[16px] h-[16px]" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 lg:p-8 flex-1">
                        {activeTab === 'bmi' && <BMIWidget />}
                        {activeTab === 'protein' && <ProteinWidget />}
                        {activeTab === 'creatine' && <CreatineWidget />}
                        {activeTab === 'deficit' && <DeficitWidget />}
                        {activeTab === 'water' && (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px]">
                                <div className="w-[80px] h-[80px] rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                                    <Droplet className="w-[40px] h-[40px] text-blue-500" />
                                </div>
                                <h3 className="font-display font-bold text-[24px] text-(--text-primary) mb-2">Water Intake Calculator</h3>
                                <p className="font-body text-[15px] text-(--text-secondary) max-w-md mb-8">
                                    Based on your body weight and moderate activity levels, here is your calculated daily requirement.
                                </p>
                                <div className="text-center">
                                    <span className="block font-body text-[14px] uppercase tracking-wider text-(--text-tertiary) font-semibold mb-1">Target</span>
                                    <span className="font-display font-bold text-[48px] text-blue-500 leading-none">2.8L</span>
                                </div>
                                <button className="mt-8 h-[40px] px-6 rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) font-body text-[13px] font-semibold text-(--text-primary) hover:border-(--border-subtle) transition-colors cursor-pointer">
                                    Update Goal
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

        </motion.div>
    )
}
