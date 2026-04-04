import Image from 'next/image'
import { Dumbbell, LucideIcon, ShieldCheck, Users } from 'lucide-react'
import { ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function Features() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
      <FeatureCard>
        <CardHeader className="pb-3">
          <CardHeading
            icon={Dumbbell}
            title="Layer 01"
            description="Athlete Execution"
            supporting="Workouts, macros, hydration, timers, and progress checkpoints stay in one clean flow."
          />
        </CardHeader>

        <CardContent>
          <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="relative h-48 w-full">
              <Image
                src="/mockupimage.png"
                alt="Athlete workflow preview"
                fill
                sizes="(max-width: 768px) 100vw, 580px"
                className="object-cover object-left-top opacity-85"
              />
            </div>
            <ul className="grid gap-2 p-4 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              {['Session logging', 'Nutrition adherence', 'Hydration goals', 'Progress analytics'].map((item) => (
                <li key={item} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </FeatureCard>

      <FeatureCard>
        <CardHeader className="pb-3">
          <CardHeading
            icon={Users}
            title="Layer 02"
            description="Coach Command Center"
            supporting="Programs, check-ins, client messaging, forms, and schedule management in a focused workspace."
          />
        </CardHeader>

        <CardContent>
          <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="relative h-48 w-full">
              <Image
                src="/mockupimage.png"
                alt="Coach workflow preview"
                fill
                sizes="(max-width: 768px) 100vw, 580px"
                className="object-cover object-center opacity-80"
              />
            </div>
            <ul className="grid gap-2 p-4 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              {['Client roster', 'Program builder', 'Broadcast tools', 'Coach analytics'].map((item) => (
                <li key={item} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </FeatureCard>

      <FeatureCard className="p-6 lg:col-span-2">
        <div className="mx-auto my-2 max-w-3xl text-center">
          <CardHeading
            icon={ShieldCheck}
            title="Layer 03"
            description="Growth Infrastructure"
            supporting="Role-aware access, scalable architecture, and automation-ready workflows for long-term expansion."
            centered
          />
        </div>

        <div className="mt-4 flex justify-center gap-5 overflow-hidden">
          <CircularUI
            label="Role permissions"
            circles={[{ pattern: 'border' }, { pattern: 'none' }]}
          />

          <CircularUI
            label="Secure data model"
            circles={[{ pattern: 'primary' }, { pattern: 'border' }]}
          />

          <CircularUI
            label="Automation hooks"
            circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
          />

          <CircularUI
            label="Operational visibility"
            circles={[{ pattern: 'primary' }, { pattern: 'none' }]}
            className="hidden sm:block"
          />
        </div>
      </FeatureCard>
    </div>
  )
}

interface FeatureCardProps {
  children: ReactNode
  className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn('group relative rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] shadow-zinc-950/20', className)}>
    <CardDecorator />
    {children}
  </Card>
)

const CardDecorator = () => (
  <>
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-[var(--accent)]" />
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-[var(--accent)]" />
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-[var(--accent)]" />
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-[var(--accent)]" />
  </>
)

interface CardHeadingProps {
  icon: LucideIcon
  title: string
  description: string
  supporting: string
  centered?: boolean
}

const CardHeading = ({ icon: Icon, title, description, supporting, centered = false }: CardHeadingProps) => (
  <div className={cn('p-6', centered && 'text-center')}>
    <span className={cn('flex items-center gap-2 text-sm text-[var(--text-secondary)]', centered && 'justify-center')}>
      <Icon className="size-4 text-[var(--accent)]" />
      {title}
    </span>
    <p className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">{description}</p>
    <p className="mt-2 text-sm text-[var(--text-secondary)]">{supporting}</p>
  </div>
)

interface CircleConfig {
  pattern: 'none' | 'border' | 'primary'
}

interface CircularUIProps {
  label: string
  circles: CircleConfig[]
  className?: string
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
  <div className={className}>
    <div className="size-fit rounded-2xl bg-gradient-to-b from-[var(--border-default)] to-transparent p-px">
      <div className="relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-elevated)] p-4">
        {circles.map((circle, i) => (
          <div
            key={i}
            className={cn('size-7 rounded-full border sm:size-8', {
              'border-[var(--accent)]': circle.pattern === 'none',
              'border-[var(--accent)] bg-[repeating-linear-gradient(-45deg,rgba(34,197,94,0.3),rgba(34,197,94,0.3)_1px,transparent_1px,transparent_4px)]':
                circle.pattern === 'border',
              'border-[var(--accent)] bg-[var(--accent-bg)] bg-[repeating-linear-gradient(-45deg,rgba(34,197,94,0.8),rgba(34,197,94,0.8)_1px,transparent_1px,transparent_4px)]':
                circle.pattern === 'primary'
            })}
          />
        ))}
      </div>
    </div>
    <span className="mt-1.5 block text-center text-sm text-[var(--text-secondary)]">{label}</span>
  </div>
)
