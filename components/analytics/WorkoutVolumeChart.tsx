'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface VolumePoint {
  date?: string
  month?: string
  volume: number
}

interface WorkoutVolumeChartProps {
  data: VolumePoint[]
  xKey: 'date' | 'month'
}

export function WorkoutVolumeChart({ data, xKey }: WorkoutVolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-outfit)' }} tickFormatter={(val) => `${val / 1000}k`} />
        <Tooltip
          cursor={{ fill: 'var(--bg-elevated)' }}
          contentStyle={{ backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
        />
        <Bar dataKey="volume" fill="var(--chart-blue)" radius={[6, 6, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
