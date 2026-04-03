'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeightPoint {
  date: string
  weight: number
}

interface BodyWeightChartProps {
  data: WeightPoint[]
}

export function BodyWeightChart({ data }: BodyWeightChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} dy={10} />
        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--status-success)', fontWeight: 'bold' }}
        />
        <Area type="monotone" dataKey="weight" stroke="var(--status-success)" strokeWidth={3} fillOpacity={1} fill="url(#weightColor)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
