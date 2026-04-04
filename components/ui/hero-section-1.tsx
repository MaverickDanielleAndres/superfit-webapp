import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className='overflow-hidden'>
        <div
          aria-hidden
          className='absolute inset-0 isolate z-[2] hidden opacity-50 contain-strict lg:block'
        >
          <div className='absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]' />
          <div className='absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]' />
          <div className='absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]' />
        </div>

        <section>
          <div className='relative pt-24 md:pt-36'>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: 'spring',
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className='absolute inset-0 -z-20'
            >
              <div className='absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent_70%)]' />
            </AnimatedGroup>

            <div
              aria-hidden
              className='absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#0a0a0a_75%)]'
            />

            <div className='mx-auto max-w-7xl px-6'>
              <div className='text-center sm:mx-auto lg:mr-auto lg:mt-0'>
                <AnimatedGroup variants={transitionVariants as any}>
                  <Link
                    href='/dashboard'
                    className='group mx-auto flex w-fit items-center gap-4 rounded-full border border-lime-500/25 bg-zinc-900 p-1 pl-4 shadow-md shadow-black/20 transition-all duration-300 hover:bg-zinc-800'
                  >
                    <span className='text-sm text-zinc-200'>Introducing the Athlete + Coach workspace</span>
                    <span className='block h-4 w-0.5 border-l border-zinc-700 bg-zinc-700' />

                    <div className='size-6 overflow-hidden rounded-full bg-zinc-800 duration-500 group-hover:bg-zinc-700'>
                      <div className='flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0'>
                        <span className='flex size-6'>
                          <ArrowRight className='m-auto size-3 text-lime-300' />
                        </span>
                        <span className='flex size-6'>
                          <ArrowRight className='m-auto size-3 text-lime-300' />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <h1 className='mx-auto mt-8 max-w-4xl text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]'>
                    Modern training workflows for athletes and coaches
                  </h1>
                  <p className='mx-auto mt-8 max-w-2xl text-balance text-lg text-zinc-400'>
                    Highly focused tools for workout tracking, nutrition planning, coaching operations, and performance analytics.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...(transitionVariants as any),
                  }}
                  className='mt-12 flex flex-col items-center justify-center gap-2 md:flex-row'
                >
                  <div className='rounded-[14px] border border-lime-500/30 bg-lime-500/10 p-0.5'>
                    <Button asChild size='lg' className='rounded-xl bg-lime-500 px-5 text-base text-black hover:bg-lime-400'>
                      <Link href='/auth'>
                        <span className='text-nowrap'>Start Training</span>
                      </Link>
                    </Button>
                  </div>
                  <Button asChild size='lg' variant='ghost' className='h-10.5 rounded-xl px-5 text-zinc-200'>
                    <Link href='/dashboard'>
                      <span className='text-nowrap'>Open Dashboard</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...(transitionVariants as any),
              }}
            >
              <div className='relative mt-8 overflow-hidden px-2 sm:mt-12 md:mt-20'>
                <div aria-hidden className='absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-[#0a0a0a]' />
                <div className='relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-lime-500/20 bg-zinc-950 p-4 shadow-lg shadow-black/40 ring-1 ring-lime-500/20'>
                  <div className='grid gap-3 sm:grid-cols-[160px_1fr]'>
                    <aside className='rounded-xl border border-lime-500/20 bg-zinc-900 p-3'>
                      <p className='mb-2 text-xs font-medium text-lime-300'>Client Dashboard</p>
                      <div className='space-y-1.5 text-xs text-zinc-400'>
                        {['Overview', 'Workout', 'Nutrition', 'Hydration', 'Progress', 'Messages'].map((item) => (
                          <div key={item} className='rounded-md border border-zinc-800 px-2 py-1.5'>
                            {item}
                          </div>
                        ))}
                      </div>
                    </aside>
                    <div className='rounded-xl border border-zinc-800 bg-zinc-900 p-3'>
                      <div className='mb-3 flex items-center justify-between'>
                        <p className='text-sm text-zinc-300'>Weekly Compliance Snapshot</p>
                        <span className='rounded-full border border-lime-500/25 bg-lime-500/10 px-2 py-1 text-xs text-lime-300'>+12.4%</span>
                      </div>
                      <div className='grid grid-cols-3 gap-2'>
                        {[['Workouts', '5/6'], ['Calories', '92%'], ['Hydration', '81%']].map(([label, value]) => (
                          <div key={label} className='rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2'>
                            <p className='text-[11px] text-zinc-500'>{label}</p>
                            <p className='text-xs font-semibold text-zinc-100'>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        <section className='bg-transparent pb-16 pt-16 md:pb-28'>
          <div className='group relative m-auto max-w-5xl px-6'>
            <div className='absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100'>
              <Link href='/dashboard' className='block text-sm text-zinc-400 duration-150 hover:opacity-75'>
                <span> Explore platform modules</span>
                <ChevronRight className='ml-1 inline-block size-3' />
              </Link>
            </div>
            <div className='mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-8 gap-y-8 transition-all duration-500 group-hover:opacity-50 group-hover:blur-xs sm:gap-x-12 sm:gap-y-12'>
              {['Workout', 'Nutrition', 'Hydration', 'Goals', 'Coaching', 'Forms', 'Messaging', 'Analytics'].map((name) => (
                <div key={name} className='flex'>
                  <div className='mx-auto rounded-md border border-lime-500/25 bg-zinc-900 px-3 py-1 text-xs text-zinc-300'>
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

const menuItems = [
  { name: 'Features', href: '#feature-grid' },
  { name: 'Coaches', href: '#for-coaches' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#top' },
]

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header>
      <nav data-state={menuState && 'active'} className='group fixed z-20 w-full px-2'>
        <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'max-w-4xl rounded-2xl border border-lime-500/20 bg-black/50 backdrop-blur-lg lg:px-5')}>
          <div className='relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4'>
            <div className='flex w-full justify-between lg:w-auto'>
              <Link href='/' aria-label='home' className='flex items-center space-x-2'>
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className='relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden'
              >
                <Menu className='m-auto size-6 duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:rotate-180 group-data-[state=active]:opacity-0' />
                <X className='absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:scale-100 group-data-[state=active]:rotate-0 group-data-[state=active]:opacity-100' />
              </button>
            </div>

            <div className='absolute inset-0 m-auto hidden size-fit lg:block'>
              <ul className='flex gap-8 text-sm'>
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className='block text-zinc-400 duration-150 hover:text-zinc-100'>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className='mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-lime-500/20 bg-zinc-950 p-6 shadow-2xl shadow-black/30 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex'>
              <div className='lg:hidden'>
                <ul className='space-y-6 text-base'>
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className='block text-zinc-400 duration-150 hover:text-zinc-100'>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className='flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit'>
                <Button asChild variant='outline' size='sm' className={cn(isScrolled && 'lg:hidden')}>
                  <Link href='/auth'>
                    <span>Login</span>
                  </Link>
                </Button>
                <Button asChild size='sm' className={cn('bg-lime-500 text-black hover:bg-lime-400', isScrolled && 'lg:hidden')}>
                  <Link href='/auth'>
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <Button asChild size='sm' className={cn('hidden bg-lime-500 text-black hover:bg-lime-400', isScrolled ? 'lg:inline-flex' : 'hidden')}>
                  <Link href='/dashboard'>
                    <span>Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className='rounded-md bg-lime-500 px-2 py-0.5 text-xs font-bold text-black'>SF</div>
      <span className='text-sm font-semibold text-zinc-200'>SuperFit</span>
    </div>
  )
}

export default HeroSection
