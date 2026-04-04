'use client'
import { HeroHighlight, Highlight } from '@/components/ui/hero-highlight'

export function HeroHighlightDemo() {
  return (
    <HeroHighlight>
      <h1 className='text-center text-4xl font-bold leading-tight md:text-5xl lg:text-6xl'>
        Build an athlete-first routine with
        <br />
        <Highlight>coach-powered accountability.</Highlight>
      </h1>
    </HeroHighlight>
  )
}
