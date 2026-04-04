'use client'

import * as React from 'react'
import DottedMap from 'dotted-map'
import { Activity, ArrowRight, Dumbbell, Flame, MapPin, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const map = new DottedMap({ height: 55, grid: 'diagonal' })
const points = map.getPoints()

const chartData = [
  { week: 'W1', athlete: 62, coach: 140 },
  { week: 'W2', athlete: 84, coach: 188 },
  { week: 'W3', athlete: 101, coach: 210 },
  { week: 'W4', athlete: 133, coach: 252 },
  { week: 'W5', athlete: 118, coach: 236 },
  { week: 'W6', athlete: 162, coach: 294 },
]

type FeedMessage = {
  title: string
  time: string
  content: string
}

const messages: FeedMessage[] = [
  {
    title: 'Athlete Check-in',
    time: '1m ago',
    content: '3 clients completed today\'s workout session.',
  },
  {
    title: 'Coach Broadcast',
    time: '4m ago',
    content: 'Weekly nutrition reminders delivered successfully.',
  },
  {
    title: 'Program Update',
    time: '7m ago',
    content: 'Lower-body progression block published to team.',
  },
  {
    title: 'Hydration Alert',
    time: '10m ago',
    content: '8 athletes reached their daily hydration target.',
  },
]

export function CombinedFeaturedSectionDemo({ className }: { className?: string }) {
  return (
    <section id='feature-grid' className={cn('bg-transparent py-24', className)}>
      <div className='mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-2xl border border-lime-500/25 bg-zinc-950/70 md:grid-cols-2 md:grid-rows-2'>
        <div className='relative border-b border-r border-lime-500/20 bg-zinc-950/60 p-6 md:border-b md:border-r'>
          <div className='mb-4 flex items-center gap-2 text-sm text-zinc-400'>
            <MapPin className='h-4 w-4 text-lime-300' />
            SuperFit Active Regions
          </div>
          <h3 className='text-xl font-medium text-zinc-100'>
            Monitor athlete and coach activity by location.{' '}
            <span className='text-zinc-400'>Keep engagement high across your entire roster.</span>
          </h3>

          <div className='relative mt-5 overflow-hidden rounded-xl border border-lime-500/20 bg-zinc-900 p-4'>
            <div className='absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-md border border-lime-500/30 bg-zinc-900 px-3 py-1 text-xs font-medium text-lime-300 shadow'>
              Last sync from Manila
            </div>
            <Map />
          </div>
        </div>

        <div className='flex flex-col justify-between gap-4 border-b border-lime-500/20 bg-zinc-900/75 p-6 md:border-b md:border-l-0'>
          <div>
            <span className='mb-3 inline-flex items-center gap-2 text-sm text-zinc-400'>
              <Users className='h-4 w-4 text-lime-300' />
              Athlete + Coach Feed
            </span>
            <h3 className='text-xl font-medium text-zinc-100'>
              Real-time team communication,{' '}
              <span className='text-zinc-400'>without leaving your training workspace.</span>
            </h3>
          </div>
          <div className='flex w-full items-center justify-center'>
            <FeaturedMessageCard />
          </div>
        </div>

        <div className='space-y-4 border-r border-lime-500/20 bg-zinc-950/55 p-6'>
          <div className='mb-2 flex items-center gap-2 text-sm text-zinc-400'>
            <Activity className='h-4 w-4 text-lime-300' />
            Progress Throughput
          </div>
          <h3 className='text-xl font-medium text-zinc-100'>
            Track weekly volume and coaching interactions.{' '}
            <span className='text-zinc-400'>Adjust quickly from one analytics view.</span>
          </h3>
          <MonitoringChart />
        </div>

        <div className='grid bg-zinc-900/75 sm:grid-cols-2'>
          <FeatureCard
            icon={<Dumbbell className='h-4 w-4 text-lime-300' />}
            title='Athlete Workflows'
            subtitle='Session-ready UI'
            description='Workout, nutrition, hydration, and progress in one place.'
          />
          <FeatureCard
            icon={<Flame className='h-4 w-4 text-lime-300' />}
            title='Coach Workflows'
            subtitle='High-leverage tools'
            description='Programs, forms, broadcasts, and client tracking streamlined.'
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
}) {
  return (
    <div className='feature-card relative flex min-h-[220px] flex-col gap-3 border border-lime-500/20 bg-zinc-900 p-4'>
      <div className='flex items-center gap-2 text-sm text-zinc-400'>
        {icon}
        {title}
      </div>
      <h3 className='max-w-[20rem] text-lg font-medium text-zinc-100'>
        {subtitle} <span className='text-zinc-400'>{description}</span>
      </h3>

      <Card className='absolute bottom-0 right-0 h-24 w-24 rounded-br-none rounded-tl-xl rounded-tr-none border-8 border-b-0 border-lime-500/30 border-r-0 bg-zinc-950 sm:h-28 sm:w-32' />

      <div className='absolute bottom-2 right-2 z-10 flex items-center gap-2 rounded-full border border-lime-500/30 bg-zinc-900 p-3 transition hover:-rotate-45'>
        <ArrowRight className='h-4 w-4 text-lime-300' />
      </div>
    </div>
  )
}

const Map = () => (
  <svg viewBox='0 0 120 60' className='h-auto w-full text-lime-300/70'>
    {points.map((point, i) => (
      <circle key={i} cx={point.x} cy={point.y} r={0.15} fill='currentColor' />
    ))}
  </svg>
)

function MonitoringChart() {
  return (
    <div className='w-full overflow-x-auto rounded-xl border border-lime-500/20 bg-zinc-900 p-3'>
      <AreaChart width={560} height={220} data={chartData}>
        <defs>
          <linearGradient id='fillAthlete' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#84cc16' stopOpacity={0.8} />
            <stop offset='65%' stopColor='#84cc16' stopOpacity={0.12} />
          </linearGradient>
          <linearGradient id='fillCoach' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#22c55e' stopOpacity={0.75} />
            <stop offset='65%' stopColor='#22c55e' stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis dataKey='week' tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
        <YAxis hide />
        <CartesianGrid vertical={false} stroke='rgba(132,204,22,0.12)' />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: '#111111',
            border: '1px solid rgba(132,204,22,0.25)',
            borderRadius: '10px',
            color: '#e4e4e7',
          }}
        />
        <Area dataKey='coach' type='monotone' stroke='#22c55e' fill='url(#fillCoach)' strokeWidth={2} />
        <Area dataKey='athlete' type='monotone' stroke='#84cc16' fill='url(#fillAthlete)' strokeWidth={2} />
      </AreaChart>
    </div>
  )
}

const FeaturedMessageCard = () => {
  return (
    <div className='relative h-[280px] w-full max-w-sm overflow-hidden rounded-xl border border-lime-500/20 bg-zinc-950 p-2 font-sans'>
      <div className='absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-zinc-950 to-transparent' />

      <div className='relative z-0 space-y-2'>
        {messages.map((msg, i) => (
          <div
            key={i}
            className='animate-scaleUp flex cursor-pointer items-start gap-3 rounded-lg border border-lime-500/20 p-3 opacity-0 transition duration-300 ease-in-out'
            style={{
              animationDelay: `${i * 240}ms`,
              animationFillMode: 'forwards',
            }}
          >
            <div className='h-8 w-8 min-h-[2rem] min-w-[2rem] rounded-lg bg-gradient-to-br from-lime-400 to-green-600' />
            <div className='flex flex-col'>
              <div className='flex items-center gap-2 text-xs font-semibold text-zinc-100'>
                {msg.title}
                <span className="text-xs text-zinc-500 before:mr-1 before:content-['•']">
                  {msg.time}
                </span>
              </div>
              <p className='mt-0.5 line-clamp-1 text-xs text-zinc-400'>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
