'use client'

import React from 'react'
import { motion } from 'framer-motion'

const GoalRow = ({
    number, unit, name, subText, percent, delay
}: {
    number: number, unit: string, name: string, subText: string, percent: number, delay: number
}) => {
    const r = 20
    const circ = 2 * Math.PI * r
    const offset = circ - (percent / 100) * circ

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay }}
            className="flex items-center gap-[16px] py-[14px] border-b border-(--border-subtle) last:border-0"
        >
            {/* Metrics Left */}
            <div className="w-[60px] flex flex-col justify-center shrink-0">
                <span className="font-display font-bold text-[22px] text-(--text-primary) leading-none mb-0.5">{number}</span>
                <span className="font-body font-normal text-[11px] text-(--text-secondary) leading-none">{unit}</span>
            </div>

            {/* Main Text Center */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <span className="font-body font-semibold text-[14px] text-(--text-primary) leading-none mb-1 truncate">{name}</span>
                <span className="font-body font-normal text-[12px] text-(--text-secondary) leading-none truncate">{subText}</span>
            </div>

            {/* Progress Right */}
            <div className="w-[44px] h-[44px] shrink-0 relative flex items-center justify-center ml-auto">
                <svg viewBox="0 0 48 48" className="w-[44px] h-[44px] transform -rotate-90">
                    <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border-default)" strokeWidth="4" strokeLinecap="round" />
                    <motion.circle
                        cx="24" cy="24" r={r}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
                        animate={{ strokeDasharray: circ, strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: "easeOut", delay: delay + 0.2 }}
                    />
                </svg>
                <span className="absolute font-display font-bold text-[11px] text-(--accent) leading-none">{percent}%</span>
            </div>
        </motion.div>
    )
}

export function FitnessGoalCard() {
    return (
        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-[24px]">

            {/* Header */}
            <div className="mb-[20px]">
                <h3 className="font-display font-semibold text-[16px] text-(--text-primary) leading-none mb-[8px]">
                    Fitness Goal Building
                </h3>
                <p className="font-body font-normal text-[13px] text-(--text-secondary) leading-none">
                    Your Fitness:
                </p>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
                <GoalRow number={10} unit="Min" name="ABS & Stretch" subText="10 min / day" percent={65} delay={0.1} />
                <GoalRow number={12} unit="Sets" name="Side planks" subText="1.2 sets / day" percent={35} delay={0.2} />
                <GoalRow number={10} unit="Sets" name="Rope lifting" subText="10 sets / day" percent={50} delay={0.3} />
            </div>

        </div>
    )
}
