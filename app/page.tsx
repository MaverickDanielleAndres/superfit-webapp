'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronRight,
  Dumbbell,
  Eye,
  EyeOff,
  Menu,
  Upload,
  Users,
  X
} from 'lucide-react'
import { FlipWords } from '@/components/ui/flip-words'
import { CombinedFeaturedSectionDemo } from '@/components/ui/combined-featured-section'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { Features as Features10 } from '@/components/ui/features-10'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Testimonials } from '@/components/ui/testimonials-demo'
import { useAuthStore } from '@/store/useAuthStore'

type ModalState = 'none' | 'signin' | 'role-select' | 'athlete-signup' | 'coach-apply'
type SelectedRole = 'athlete' | 'coach' | null
type CoachStep = 1 | 2 | 3
type SlideDirection = -1 | 1

type AthleteGoal =
  | 'Lose Weight'
  | 'Build Muscle'
  | 'Improve Endurance'
  | 'General Fitness'

type AthleteActivity =
  | 'Sedentary'
  | 'Lightly Active'
  | 'Active'
  | 'Very Active'

type CoachSpecialization =
  | 'Strength'
  | 'Hypertrophy'
  | 'Weight Loss'
  | 'Endurance'
  | 'Mobility'
  | 'Nutrition'
  | 'Sports Performance'
  | 'Rehabilitation'

type CoachingFormat = 'Online' | 'In-Person' | 'Hybrid'

interface LandingFormData {
  signInEmail: string
  signInPassword: string
  athleteFullName: string
  athleteEmail: string
  athletePassword: string
  athleteConfirmPassword: string
  athleteGoal: AthleteGoal
  athleteActivityLevel: AthleteActivity
  coachFullName: string
  coachEmail: string
  coachPassword: string
  coachConfirmPassword: string
  coachExperienceYears: number
  coachLocation: string
  coachPhotoName: string
  coachSpecializations: CoachSpecialization[]
  coachCertifications: string
  coachBio: string
  coachMaxClients: number
  coachFormats: CoachingFormat[]
  coachConfirmAccuracy: boolean
  coachAgreeTerms: boolean
}

interface LandingErrors {
  signInEmail?: string
  signInPassword?: string
  athleteFullName?: string
  athleteEmail?: string
  athletePassword?: string
  athleteConfirmPassword?: string
  coachFullName?: string
  coachEmail?: string
  coachPassword?: string
  coachConfirmPassword?: string
  coachExperienceYears?: string
  coachLocation?: string
  coachBio?: string
  coachChecks?: string
}

const INITIAL_FORM_DATA: LandingFormData = {
  signInEmail: '',
  signInPassword: '',
  athleteFullName: '',
  athleteEmail: '',
  athletePassword: '',
  athleteConfirmPassword: '',
  athleteGoal: 'General Fitness',
  athleteActivityLevel: 'Active',
  coachFullName: '',
  coachEmail: '',
  coachPassword: '',
  coachConfirmPassword: '',
  coachExperienceYears: 2,
  coachLocation: '',
  coachPhotoName: '',
  coachSpecializations: [],
  coachCertifications: '',
  coachBio: '',
  coachMaxClients: 12,
  coachFormats: ['Online'],
  coachConfirmAccuracy: false,
  coachAgreeTerms: false
}

const INPUT_BASE =
  'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)]'

const LABEL_BASE = 'mb-1 block text-sm text-[var(--text-secondary)]'

const SPECIALIZATIONS: CoachSpecialization[] = [
  'Strength',
  'Hypertrophy',
  'Weight Loss',
  'Endurance',
  'Mobility',
  'Nutrition',
  'Sports Performance',
  'Rehabilitation'
]

const COACHING_FORMATS: CoachingFormat[] = ['Online', 'In-Person', 'Hybrid']

function GoogleLogo() {
  return (
    <svg viewBox="0 0 533.5 544.3" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.3h147.2c-6.3 34.1-25 63-53.3 82.4v68h86.1c50.4-46.4 81.5-114.8 81.5-195.3z" />
      <path fill="#34a853" d="M272 544.3c72.6 0 133.5-24.1 178-65.6l-86.1-68c-24 16.1-54.7 25.6-91.9 25.6-70.7 0-130.6-47.8-152-112.1h-88.8v70.5c44.2 87.5 135 149.6 240.8 149.6z" />
      <path fill="#fbbc04" d="M120 324.2c-10.4-30.9-10.4-64.2 0-95.1v-70.5h-88.8c-36.8 73.3-36.8 162.7 0 236l88.8-70.4z" />
      <path fill="#ea4335" d="M272 107.7c39.5-.6 77.5 14.3 106.5 41.8l79.4-79.4C411.5 24.8 349.9-.2 272 0 166.2 0 75.4 62.1 31.2 149.6l88.8 70.5C141.4 155.5 201.3 107.7 272 107.7z" />
    </svg>
  )
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.09 4.39 23.08 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.98h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z" />
      <path fill="#ffffff" d="M16.67 15.56l.53-3.49h-3.33V9.81c0-.95.46-1.88 1.95-1.88h1.51V4.95s-1.37-.24-2.68-.24c-2.75 0-4.54 1.67-4.54 4.7v2.66H7.08v3.49h3.05V24a12.2 12.2 0 003.76 0v-8.44h2.78z" />
    </svg>
  )
}

const FAQ_ITEMS = [
  {
    id: '1',
    title: 'What makes SuperFit different?',
    content:
      'SuperFit combines athlete tracking and coach operations in one focused platform, so you do not need separate tools for workout logs, programming, messaging, and analytics.'
  },
  {
    id: '2',
    title: 'Can coaches manage multiple clients?',
    content:
      'Yes. Coaches can manage client rosters, assign programs, review adherence, send broadcasts, and monitor progress from a single coach workspace.'
  },
  {
    id: '3',
    title: 'Is the platform mobile-friendly?',
    content:
      'Yes. Core athlete and coach workflows are designed to remain usable and responsive across mobile and desktop screens.'
  },
  {
    id: '4',
    title: 'Do athletes and coaches have separate views?',
    content:
      'Yes. SuperFit uses role-based portals so athlete and coach experiences stay purpose-built while still connected through shared data and communication.'
  }
]

function StatCounter({
  target,
  suffix,
  decimals,
  label
}: {
  target: number
  suffix: string
  decimals?: number
  label: string
}) {
  return (
    <div className="stat-item flex flex-1 flex-col items-center justify-center gap-1 px-4 py-5 text-center">
      <div className="font-[var(--font-mono)] text-[28px] font-semibold text-[var(--text-primary)] sm:text-[34px]">
        <span
          className="stat-counter"
          data-target={target}
          data-suffix={suffix}
          data-decimals={decimals ?? 0}
        >
          0{suffix}
        </span>
      </div>
      <p className="font-[var(--font-body)] text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { login, signup, initializeAuth } = useAuthStore()
  const flipWords = useMemo(
    () => ['with consistency', 'with better coaching', 'with data-backed routines', 'with accountability'],
    []
  )

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState<ModalState>('none')
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null)
  const [coachStep, setCoachStep] = useState<CoachStep>(1)
  const [coachSubmitted, setCoachSubmitted] = useState(false)
  const [athleteSubmitted, setAthleteSubmitted] = useState(false)
  const [modalDirection, setModalDirection] = useState<SlideDirection>(1)
  const [coachStepDirection, setCoachStepDirection] = useState<SlideDirection>(1)
  const [errors, setErrors] = useState<LandingErrors>({})
  const [formData, setFormData] = useState<LandingFormData>(INITIAL_FORM_DATA)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [signInSubmitting, setSignInSubmitting] = useState(false)
  const [athleteSubmitting, setAthleteSubmitting] = useState(false)
  const [coachSubmitting, setCoachSubmitting] = useState(false)

  const themeTokens = useMemo(
    () =>
      ({
        '--bg-base': '#0a0a0a',
        '--bg-surface': '#111111',
        '--bg-surface-alt': '#161616',
        '--bg-elevated': '#1c1c1c',
        '--accent': '#22c55e',
        '--accent-hover': '#16a34a',
        '--accent-dim': 'rgba(34,197,94,0.15)',
        '--accent-bg': 'rgba(34,197,94,0.08)',
        '--text-primary': '#f5f5f5',
        '--text-secondary': '#a3a3a3',
        '--text-tertiary': '#525252',
        '--border-subtle': 'rgba(255,255,255,0.06)',
        '--border-default': 'rgba(255,255,255,0.10)',
        '--border-strong': 'rgba(255,255,255,0.18)',
        '--status-success': '#22c55e',
        '--status-warning': '#f59e0b',
        '--status-danger': '#ef4444',
        '--status-info': '#16a34a',
        '--font-display': "'DM Sans', sans-serif",
        '--font-body': "'Inter', sans-serif",
        '--font-mono': "'JetBrains Mono', monospace"
      }) as React.CSSProperties,
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const setPreference = () => setPrefersReducedMotion(media.matches)
    setPreference()

    media.addEventListener('change', setPreference)
    return () => media.removeEventListener('change', setPreference)
  }, [])

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (modalOpen === 'none') return

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen('none')
        setCoachStep(1)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onEsc)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEsc)
    }
  }, [modalOpen])

  useEffect(() => {
    if (prefersReducedMotion) return

    let cancelled = false
    let ctx: { revert: () => void } | undefined

    const initializeAnimations = async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ])

        if (cancelled) return

        gsap.registerPlugin(ScrollTrigger)

        ctx = gsap.context(() => {
          gsap.from('.nav-item', {
            y: -20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power3.out'
          })

          gsap.from('.hero-word', {
            y: 50,
            opacity: 0,
            stagger: 0.07,
            duration: 0.8,
            ease: 'power3.out'
          })

          gsap.from('.hero-subheadline', {
            opacity: 0,
            y: 18,
            duration: 0.7,
            delay: 0.55,
            ease: 'power3.out'
          })

          gsap.from('.hero-cta', {
            opacity: 0,
            y: 14,
            duration: 0.7,
            delay: 0.65,
            stagger: 0.12,
            ease: 'power3.out'
          })

          gsap.from('.hero-card', {
            x: 80,
            opacity: 0,
            delay: 0.6,
            duration: 0.9,
            ease: 'back.out(1.4)'
          })

          gsap.from('.feature-card', {
            y: 40,
            opacity: 0,
            duration: 0.75,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#feature-grid',
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          })

          gsap.utils.toArray<HTMLElement>('.deep-row').forEach((row) => {
            const direction = row.dataset.direction === 'left' ? -60 : 60
            gsap.from(row, {
              x: direction,
              opacity: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: row,
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            })
          })

          gsap.from('.testimonial-card', {
            y: 24,
            opacity: 0,
            duration: 0.7,
            stagger: 0.14,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#testimonials',
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          })

          gsap.from('.pricing-card', {
            y: 30,
            scale: 0.95,
            opacity: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#pricing',
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          })

          gsap.fromTo(
            '.final-cta-headline',
            { clipPath: 'inset(0 100% 0 0)' },
            {
              clipPath: 'inset(0 0% 0 0)',
              duration: 1.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: '#final-cta',
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            }
          )

          gsap.utils.toArray<HTMLElement>('.stat-counter').forEach((el) => {
            const target = Number(el.dataset.target ?? '0')
            const suffix = el.dataset.suffix ?? ''
            const decimals = Number(el.dataset.decimals ?? '0')
            const counterObj = { val: 0 }

            gsap.to(counterObj, {
              val: target,
              duration: 2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                toggleActions: 'play none none none'
              },
              onUpdate: () => {
                const value = decimals > 0 ? counterObj.val.toFixed(decimals) : Math.round(counterObj.val).toLocaleString()
                el.innerHTML = `${value}${suffix}`
              }
            })
          })
        }, rootRef)
      } catch {
        // Keep the landing page usable even if optional animation modules fail to load.
      }
    }

    void initializeAnimations()

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [prefersReducedMotion])

  const closeModal = () => {
    setModalOpen('none')
    setErrors({})
    setCoachStep(1)
    setCoachSubmitted(false)
    setAthleteSubmitted(false)
  }

  const openSignIn = () => {
    setModalDirection(1)
    setErrors({})
    setModalOpen('signin')
  }

  const openGetStarted = () => {
    setModalDirection(1)
    setSelectedRole(null)
    setCoachStep(1)
    setCoachSubmitted(false)
    setAthleteSubmitted(false)
    setErrors({})
    setModalOpen('role-select')
  }

  const updateField = <K extends keyof LandingFormData>(key: K, value: LandingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSpecialization = (value: CoachSpecialization) => {
    setFormData((prev) => {
      const exists = prev.coachSpecializations.includes(value)
      const next = exists
        ? prev.coachSpecializations.filter((item) => item !== value)
        : [...prev.coachSpecializations, value]

      return { ...prev, coachSpecializations: next }
    })
  }

  const toggleFormat = (value: CoachingFormat) => {
    setFormData((prev) => {
      const exists = prev.coachFormats.includes(value)
      const next = exists ? prev.coachFormats.filter((item) => item !== value) : [...prev.coachFormats, value]
      return { ...prev, coachFormats: next }
    })
  }

  const redirectByRole = () => {
    const user = useAuthStore.getState().user

    if (!user) {
      router.push('/')
      return
    }

    if (user.role === 'admin') {
      router.push('/admin')
      return
    }

    if (user.role === 'coach') {
      router.push('/coach')
      return
    }

    if (!user.onboardingComplete) {
      router.push('/onboarding')
      return
    }

    router.push('/dashboard')
  }

  const selectRole = (role: Exclude<SelectedRole, null>) => {
    setSelectedRole(role)
    setModalDirection(1)

    window.setTimeout(() => {
      if (role === 'athlete') {
        setModalOpen('athlete-signup')
      } else {
        setModalOpen('coach-apply')
        setCoachStep(1)
      }
    }, 120)
  }

  const validateAthleteForm = () => {
    const nextErrors: LandingErrors = {}

    if (!formData.athleteFullName.trim()) nextErrors.athleteFullName = 'Full Name is required.'
    if (!formData.athleteEmail.trim()) nextErrors.athleteEmail = 'Email is required.'
    if (!formData.athletePassword.trim()) nextErrors.athletePassword = 'Password is required.'
    if (formData.athletePassword.length < 8) nextErrors.athletePassword = 'Use at least 8 characters.'
    if (formData.athletePassword !== formData.athleteConfirmPassword) {
      nextErrors.athleteConfirmPassword = 'Passwords must match.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateCoachStep = (step: CoachStep) => {
    const nextErrors: LandingErrors = {}

    if (step === 1) {
      if (!formData.coachFullName.trim()) nextErrors.coachFullName = 'Full Name is required.'
      if (!formData.coachEmail.trim()) nextErrors.coachEmail = 'Email is required.'
      if (!formData.coachPassword.trim()) nextErrors.coachPassword = 'Password is required.'
      if (formData.coachPassword.length < 8) nextErrors.coachPassword = 'Use at least 8 characters.'
      if (formData.coachPassword !== formData.coachConfirmPassword) {
        nextErrors.coachConfirmPassword = 'Passwords must match.'
      }
      if (!formData.coachLocation.trim()) nextErrors.coachLocation = 'Location is required.'
      if (formData.coachExperienceYears < 0) nextErrors.coachExperienceYears = 'Experience cannot be negative.'
    }

    if (step === 2) {
      if (!formData.coachBio.trim()) nextErrors.coachBio = 'Add a short coaching philosophy.'
      if (formData.coachBio.trim().length > 300) nextErrors.coachBio = 'Bio must be 300 characters or less.'
    }

    if (step === 3) {
      if (!formData.coachConfirmAccuracy || !formData.coachAgreeTerms) {
        nextErrors.coachChecks = 'Confirm both checkboxes before submitting.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleAthleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateAthleteForm()) return

    setAthleteSubmitting(true)
    const success = await signup(
      formData.athleteFullName,
      formData.athleteEmail,
      formData.athletePassword,
      'user'
    )

    if (!success) {
      setErrors((prev) => ({
        ...prev,
        athleteEmail: useAuthStore.getState().error || 'Unable to create athlete account.',
      }))
      setAthleteSubmitting(false)
      return
    }

    setAthleteSubmitted(true)
    closeModal()
    redirectByRole()
    setAthleteSubmitting(false)
  }

  const handleCoachContinue = () => {
    if (!validateCoachStep(coachStep)) return
    if (coachStep < 3) {
      setCoachStepDirection(1)
      setCoachStep((prev) => (prev + 1) as CoachStep)
    }
  }

  const handleCoachBack = () => {
    if (coachStep > 1) {
      setCoachStepDirection(-1)
      setCoachStep((prev) => (prev - 1) as CoachStep)
      setErrors({})
      return
    }

    setModalDirection(-1)
    setModalOpen('role-select')
    setErrors({})
  }

  const handleCoachSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateCoachStep(3)) return

    setCoachSubmitting(true)
    const success = await signup(
      formData.coachFullName,
      formData.coachEmail,
      formData.coachPassword,
      'coach'
    )

    if (!success) {
      setErrors((prev) => ({
        ...prev,
        coachEmail: useAuthStore.getState().error || 'Unable to create coach account.',
      }))
      setCoachSubmitting(false)
      return
    }

    setCoachSubmitted(true)
    closeModal()
    redirectByRole()
    setCoachSubmitting(false)
  }

  const handleSignInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: LandingErrors = {}
    if (!formData.signInEmail.trim()) nextErrors.signInEmail = 'Email is required.'
    if (!formData.signInPassword.trim()) nextErrors.signInPassword = 'Password is required.'

    setErrors((prev) => ({
      ...prev,
      signInEmail: nextErrors.signInEmail,
      signInPassword: nextErrors.signInPassword
    }))

    if (Object.keys(nextErrors).length > 0) return

    setSignInSubmitting(true)
    const success = await login(formData.signInEmail, formData.signInPassword)

    if (!success) {
      setErrors((prev) => ({
        ...prev,
        signInPassword: useAuthStore.getState().error || 'Invalid credentials. Please try again.',
      }))
      setSignInSubmitting(false)
      return
    }

    closeModal()
    redirectByRole()
    setSignInSubmitting(false)
  }

  const modalContent = () => {
    if (modalOpen === 'signin') {
      return (
        <form className="space-y-4 p-5 sm:p-6" onSubmit={handleSignInSubmit}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-[var(--font-display)] text-[24px] font-bold text-[var(--text-primary)]">Sign In</h3>
          </div>

          <div>
            <label className={LABEL_BASE}>Email</label>
            <input
              className={INPUT_BASE}
              placeholder="you@domain.com"
              type="email"
              value={formData.signInEmail}
              onChange={(e) => updateField('signInEmail', e.target.value)}
            />
            {errors.signInEmail && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.signInEmail}</p>}
          </div>

          <div>
            <label className={LABEL_BASE}>Password</label>
            <div className="relative">
              <input
                className={`${INPUT_BASE} pr-12`}
                placeholder="Enter your password"
                type={showSignInPassword ? 'text' : 'password'}
                value={formData.signInPassword}
                onChange={(e) => updateField('signInPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
              >
                {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.signInPassword && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.signInPassword}</p>}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              <GoogleLogo />
              Continue with Google
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              <FacebookLogo />
              Continue with Facebook
            </button>
          </div>

          <button
            type="submit"
            disabled={signInSubmitting}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-[var(--font-body)] text-[15px] font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signInSubmitting ? 'Signing In...' : 'Continue'}
          </button>

          <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
            <button type="button" className="w-fit hover:text-[var(--text-primary)]">
              Forgot password?
            </button>
            <button
              type="button"
              className="w-fit hover:text-[var(--text-primary)]"
              onClick={() => {
                setModalDirection(1)
                setModalOpen('role-select')
              }}
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </form>
      )
    }

    if (modalOpen === 'role-select') {
      return (
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h3 className="font-[var(--font-display)] text-[24px] font-bold text-[var(--text-primary)]">Get Started</h3>
            <p className="mt-1 font-[var(--font-body)] text-sm text-[var(--text-secondary)]">Select your role to continue.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => selectRole('athlete')}
              className={`rounded-2xl border bg-[var(--bg-surface)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] ${
                selectedRole === 'athlete' ? 'border-[var(--accent)] ring-1 ring-[var(--accent-dim)]' : 'border-[var(--border-default)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Dumbbell className="h-5 w-5 text-[var(--accent)]" />
                <span className="rounded-full border border-[var(--border-strong)] px-2 py-1 font-[var(--font-mono)] text-[11px] text-[var(--text-secondary)]">
                  Free to start
                </span>
              </div>
              <h4 className="mt-4 font-[var(--font-display)] text-[20px] font-semibold text-[var(--text-primary)]">I&apos;m here to train</h4>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Track workouts, log nutrition, hit goals, connect with coaches.
              </p>
            </button>

            <button
              type="button"
              onClick={() => selectRole('coach')}
              className={`rounded-2xl border bg-[var(--bg-surface)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] ${
                selectedRole === 'coach' ? 'border-[var(--accent)] ring-1 ring-[var(--accent-dim)]' : 'border-[var(--border-default)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-[var(--accent)]" />
                <span className="rounded-full border border-[var(--border-strong)] px-2 py-1 font-[var(--font-mono)] text-[11px] text-[var(--text-secondary)]">
                  Coach Application
                </span>
              </div>
              <h4 className="mt-4 font-[var(--font-display)] text-[20px] font-semibold text-[var(--text-primary)]">I coach athletes</h4>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Manage clients, build programs, broadcast, run your business.
              </p>
            </button>
          </div>
        </div>
      )
    }

    if (modalOpen === 'athlete-signup') {
      const stepNodes = ['Role', 'Account', 'Done']
      const activeStep = athleteSubmitted ? 3 : 2

      return (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            {stepNodes.map((step, index) => {
              const value = index + 1
              const isComplete = value < activeStep
              const isCurrent = value === activeStep

              return (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                        isComplete || isCurrent
                          ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                          : 'border-[var(--border-default)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      {isComplete ? <Check className="h-3.5 w-3.5" /> : value}
                    </div>
                    <span className="hidden text-xs text-[var(--text-secondary)] sm:inline">{step}</span>
                  </div>
                  {value < stepNodes.length && <div className="h-px flex-1 bg-[var(--border-default)]" />}
                </React.Fragment>
              )
            })}
          </div>

          {athleteSubmitted ? (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bg)]">
                <Check className="h-7 w-7 text-[var(--accent)]" />
              </div>
              <h3 className="mt-4 font-[var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">Account Created</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Your athlete account is set. Continue to Sign In and start training.
              </p>
              <button
                type="button"
                className="mt-5 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
                onClick={() => {
                  setModalDirection(-1)
                  setModalOpen('signin')
                }}
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleAthleteSubmit}>
              <div>
                <label className={LABEL_BASE}>Full Name</label>
                <input
                  className={INPUT_BASE}
                  value={formData.athleteFullName}
                  onChange={(e) => updateField('athleteFullName', e.target.value)}
                  placeholder="Enter your full name"
                />
                {errors.athleteFullName && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.athleteFullName}</p>}
              </div>

              <div>
                <label className={LABEL_BASE}>Email</label>
                <input
                  className={INPUT_BASE}
                  type="email"
                  value={formData.athleteEmail}
                  onChange={(e) => updateField('athleteEmail', e.target.value)}
                  placeholder="you@domain.com"
                />
                {errors.athleteEmail && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.athleteEmail}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_BASE}>Password</label>
                  <input
                    className={INPUT_BASE}
                    type="password"
                    value={formData.athletePassword}
                    onChange={(e) => updateField('athletePassword', e.target.value)}
                    placeholder="Create password"
                  />
                  {errors.athletePassword && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.athletePassword}</p>}
                </div>

                <div>
                  <label className={LABEL_BASE}>Confirm Password</label>
                  <input
                    className={INPUT_BASE}
                    type="password"
                    value={formData.athleteConfirmPassword}
                    onChange={(e) => updateField('athleteConfirmPassword', e.target.value)}
                    placeholder="Confirm password"
                  />
                  {errors.athleteConfirmPassword && (
                    <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.athleteConfirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_BASE}>Fitness Goal</label>
                  <select
                    className={INPUT_BASE}
                    value={formData.athleteGoal}
                    onChange={(e) => updateField('athleteGoal', e.target.value as AthleteGoal)}
                  >
                    <option>Lose Weight</option>
                    <option>Build Muscle</option>
                    <option>Improve Endurance</option>
                    <option>General Fitness</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_BASE}>Activity Level</label>
                  <select
                    className={INPUT_BASE}
                    value={formData.athleteActivityLevel}
                    onChange={(e) => updateField('athleteActivityLevel', e.target.value as AthleteActivity)}
                  >
                    <option>Sedentary</option>
                    <option>Lightly Active</option>
                    <option>Active</option>
                    <option>Very Active</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={athleteSubmitting}
                className="mt-1 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {athleteSubmitting ? 'Creating Account...' : 'Create My Account'}
              </button>

              <button
                type="button"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  setModalDirection(-1)
                  setModalOpen('signin')
                }}
              >
                Already have an account? Sign in
              </button>
            </form>
          )}
        </div>
      )
    }

    if (modalOpen === 'coach-apply') {
      const progress = ((coachStep - 1) / 2) * 100

      return (
        <div className="p-5 sm:p-6">
          {coachSubmitted ? (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-7 text-center">
              <div className="mx-auto h-16 w-16">
                <svg className="success-check h-16 w-16" viewBox="0 0 52 52" aria-hidden="true">
                  <circle className="success-check-circle" cx="26" cy="26" r="24" fill="none" />
                  <path className="success-check-path" fill="none" d="M14 27l8 8 16-16" />
                </svg>
              </div>
              <h3 className="mt-4 font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">Application Submitted</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Applications are reviewed within 48 hours. You will receive an email with next steps.
              </p>
              <button
                type="button"
                className="mt-6 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black hover:bg-[var(--accent-hover)]"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="hidden sm:inline">Personal Info</span>
                  <span className="hidden sm:inline">Coaching Profile</span>
                  <span className="hidden sm:inline">Review &amp; Submit</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                  <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {[1, 2, 3].map((step) => {
                    const isActive = coachStep === step
                    const isComplete = coachStep > step
                    return (
                      <div key={step} className="flex items-center gap-2 text-xs">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                            isActive || isComplete
                              ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                              : 'border-[var(--border-default)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {isComplete ? <Check className="h-3.5 w-3.5" /> : step}
                        </div>
                        <span className="hidden text-[var(--text-secondary)] sm:inline">
                          {step === 1 ? 'Personal' : step === 2 ? 'Profile' : 'Review'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait" custom={coachStepDirection}>
                <motion.div
                  key={`coach-step-${coachStep}`}
                  custom={coachStepDirection}
                  initial={{ opacity: 0, x: coachStepDirection > 0 ? 100 : -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: coachStepDirection > 0 ? -100 : 100 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {coachStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className={LABEL_BASE}>Full Name</label>
                        <input
                          className={INPUT_BASE}
                          value={formData.coachFullName}
                          onChange={(e) => updateField('coachFullName', e.target.value)}
                          placeholder="Your name"
                        />
                        {errors.coachFullName && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachFullName}</p>}
                      </div>

                      <div>
                        <label className={LABEL_BASE}>Email</label>
                        <input
                          className={INPUT_BASE}
                          type="email"
                          value={formData.coachEmail}
                          onChange={(e) => updateField('coachEmail', e.target.value)}
                          placeholder="coach@domain.com"
                        />
                        {errors.coachEmail && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachEmail}</p>}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_BASE}>Password</label>
                          <input
                            className={INPUT_BASE}
                            type="password"
                            value={formData.coachPassword}
                            onChange={(e) => updateField('coachPassword', e.target.value)}
                            placeholder="Create password"
                          />
                          {errors.coachPassword && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachPassword}</p>}
                        </div>
                        <div>
                          <label className={LABEL_BASE}>Confirm Password</label>
                          <input
                            className={INPUT_BASE}
                            type="password"
                            value={formData.coachConfirmPassword}
                            onChange={(e) => updateField('coachConfirmPassword', e.target.value)}
                            placeholder="Confirm password"
                          />
                          {errors.coachConfirmPassword && (
                            <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachConfirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className={LABEL_BASE}>Profile Photo</label>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-4 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)]">
                          <Upload className="h-4 w-4" />
                          <span>{formData.coachPhotoName || 'Click to upload profile photo'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              updateField('coachPhotoName', file?.name ?? '')
                            }}
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_BASE}>Years of coaching experience</label>
                          <input
                            className={INPUT_BASE}
                            type="number"
                            min={0}
                            value={formData.coachExperienceYears}
                            onChange={(e) => updateField('coachExperienceYears', Number(e.target.value))}
                          />
                          {errors.coachExperienceYears && (
                            <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachExperienceYears}</p>
                          )}
                        </div>
                        <div>
                          <label className={LABEL_BASE}>Location / City</label>
                          <input
                            className={INPUT_BASE}
                            value={formData.coachLocation}
                            onChange={(e) => updateField('coachLocation', e.target.value)}
                            placeholder="City, Country"
                          />
                          {errors.coachLocation && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachLocation}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {coachStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className={LABEL_BASE}>Specializations</label>
                        <div className="flex flex-wrap gap-2">
                          {SPECIALIZATIONS.map((item) => {
                            const selected = formData.coachSpecializations.includes(item)
                            return (
                              <button
                                key={item}
                                type="button"
                                className={`rounded-full border px-3 py-1 text-sm transition ${
                                  selected
                                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                                }`}
                                onClick={() => toggleSpecialization(item)}
                              >
                                {item}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className={LABEL_BASE}>Certifications held</label>
                        <textarea
                          className={INPUT_BASE}
                          rows={3}
                          value={formData.coachCertifications}
                          onChange={(e) => updateField('coachCertifications', e.target.value)}
                          placeholder="NASM-CPT, ACE, ISSA"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className={LABEL_BASE}>Brief bio / coaching philosophy</label>
                          <span className="font-[var(--font-mono)] text-xs text-[var(--text-tertiary)]">
                            {formData.coachBio.length}/300
                          </span>
                        </div>
                        <textarea
                          className={INPUT_BASE}
                          rows={4}
                          maxLength={300}
                          value={formData.coachBio}
                          onChange={(e) => updateField('coachBio', e.target.value)}
                          placeholder="How you coach and what outcomes you optimize for."
                        />
                        {errors.coachBio && <p className="mt-1 text-xs text-[var(--status-danger)]">{errors.coachBio}</p>}
                      </div>

                      <div>
                        <label className={LABEL_BASE}>Max clients you can take ({formData.coachMaxClients})</label>
                        <input
                          className="w-full"
                          type="range"
                          min={1}
                          max={50}
                          value={formData.coachMaxClients}
                          onChange={(e) => updateField('coachMaxClients', Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className={LABEL_BASE}>Coaching format</label>
                        <div className="flex flex-wrap gap-2">
                          {COACHING_FORMATS.map((item) => {
                            const selected = formData.coachFormats.includes(item)
                            return (
                              <button
                                key={item}
                                type="button"
                                className={`rounded-full border px-3 py-1 text-sm transition ${
                                  selected
                                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                                }`}
                                onClick={() => toggleFormat(item)}
                              >
                                {item}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {coachStep === 3 && (
                    <form className="space-y-4" onSubmit={handleCoachSubmit}>
                      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
                        <h4 className="mb-3 font-[var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">Review your application</h4>
                        <div className="space-y-2">
                          <p><span className="text-[var(--text-tertiary)]">Name:</span> {formData.coachFullName || 'Not provided'}</p>
                          <p><span className="text-[var(--text-tertiary)]">Email:</span> {formData.coachEmail || 'Not provided'}</p>
                          <p><span className="text-[var(--text-tertiary)]">Experience:</span> {formData.coachExperienceYears} years</p>
                          <p><span className="text-[var(--text-tertiary)]">Location:</span> {formData.coachLocation || 'Not provided'}</p>
                          <p>
                            <span className="text-[var(--text-tertiary)]">Specializations:</span>{' '}
                            {formData.coachSpecializations.length > 0
                              ? formData.coachSpecializations.join(', ')
                              : 'Not selected'}
                          </p>
                          <p>
                            <span className="text-[var(--text-tertiary)]">Formats:</span>{' '}
                            {formData.coachFormats.length > 0 ? formData.coachFormats.join(', ') : 'Not selected'}
                          </p>
                          <p><span className="text-[var(--text-tertiary)]">Max clients:</span> {formData.coachMaxClients}</p>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={formData.coachConfirmAccuracy}
                          onChange={(e) => updateField('coachConfirmAccuracy', e.target.checked)}
                        />
                        I confirm the information above is accurate
                      </label>

                      <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={formData.coachAgreeTerms}
                          onChange={(e) => updateField('coachAgreeTerms', e.target.checked)}
                        />
                        I agree to SuperFit&apos;s Coach Terms of Service
                      </label>

                      {errors.coachChecks && <p className="text-xs text-[var(--status-danger)]">{errors.coachChecks}</p>}

                      <button
                        type="submit"
                        disabled={coachSubmitting}
                        className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {coachSubmitting ? 'Submitting...' : 'Submit Application'}
                      </button>

                      <p className="text-xs text-[var(--text-tertiary)]">
                        Applications are reviewed within 48 hours. You&apos;ll receive an email with next steps.
                      </p>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  onClick={handleCoachBack}
                >
                  Back
                </button>
                {coachStep < 3 && (
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-hover)]"
                    onClick={handleCoachContinue}
                  >
                    Continue
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div ref={rootRef} className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]" style={themeTokens}>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.65; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.65; }
        }

        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }

        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }

        .pulse-dot {
          animation: pulse 1.5s infinite;
        }

        .success-check-circle {
          stroke: var(--accent);
          stroke-width: 2;
          stroke-dasharray: 151;
          stroke-dashoffset: 151;
          animation: drawCircle 0.8s ease forwards;
        }

        .success-check-path {
          stroke: var(--accent);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 36;
          stroke-dashoffset: 36;
          animation: drawPath 0.5s ease 0.55s forwards;
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(62% 52% at 10% 90%, rgba(34,197,94,0.15), transparent 70%), radial-gradient(46% 40% at 92% 5%, rgba(22,163,74,0.12), transparent 70%)'
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '18px 18px'
        }}
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(10,10,10,0.85)] backdrop-blur-[16px]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="nav-item flex items-center gap-2">
            <div className="rounded-lg bg-[var(--accent)] px-2 py-1 font-[var(--font-display)] text-sm font-bold text-black">SF</div>
            <span className="font-[var(--font-display)] text-xl font-semibold">SuperFit</span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a className="nav-item text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]" href="#feature-grid">Features</a>
            <a className="nav-item text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]" href="#for-coaches">For Coaches</a>
            <a className="nav-item text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]" href="#pricing">Pricing</a>
            <button
              type="button"
              className="nav-item rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              onClick={openSignIn}
            >
              Sign In
            </button>
            <button
              type="button"
              className="nav-item rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-hover)]"
              onClick={openGetStarted}
            >
              Get Started
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="nav-item rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
              onClick={openSignIn}
            >
              Sign In
            </button>
            <button
              type="button"
              className="nav-item rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-black"
              onClick={openGetStarted}
            >
              Get Started
            </button>
            <button
              type="button"
              aria-label="Toggle menu"
              className="nav-item rounded-lg border border-[var(--border-default)] p-2"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 md:hidden"
            >
              <div className="flex flex-col gap-3 text-sm">
                <a href="#feature-grid" className="text-[var(--text-secondary)]" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#for-coaches" className="text-[var(--text-secondary)]" onClick={() => setMobileMenuOpen(false)}>For Coaches</a>
                <a href="#pricing" className="text-[var(--text-secondary)]" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="min-h-screen px-4 pb-16 pt-28 sm:px-6" id="top">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-bg)] px-3 py-1 font-[var(--font-mono)] text-xs text-[var(--accent)]">
                Precision Fitness OS
              </div>

              <h1 className="mt-6 font-[var(--font-display)] text-[48px] font-bold leading-[0.94] tracking-[-0.04em] sm:text-[58px] lg:text-[72px]">
                {'Your fitness, operating at full precision.'.split(' ').map((word, index) => (
                  <span key={`${word}-${index}`} className="hero-word mr-3 inline-block">
                    {word}
                  </span>
                ))}
              </h1>

              <p className="hero-subheadline mt-6 max-w-[700px] font-[var(--font-body)] text-[17px] leading-relaxed text-[var(--text-secondary)] sm:text-[18px]">
                Track every rep, log every meal, manage every client in one role-based platform built for serious athletes and coaches.
              </p>
              <div className="mt-3 text-lg font-medium text-[var(--text-primary)] sm:text-xl">
                Build your best body{' '}
                <FlipWords words={flipWords} className="text-[var(--accent)]" />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="hero-cta rounded-lg bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-black hover:bg-[var(--accent-hover)]"
                  onClick={openGetStarted}
                >
                  Start Training Free
                </button>
                <a
                  href="#feature-grid"
                  className="hero-cta rounded-lg border border-[var(--border-default)] px-6 py-3 text-[15px] font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                >
                  See How It Works
                </a>
              </div>

              <p className="mt-4 font-[var(--font-mono)] text-xs text-[var(--text-tertiary)] sm:text-sm">
                10,000+ athletes · 500+ coaches · No credit card required
              </p>
            </div>

            <div className="hero-card lg:col-span-2">
              <div
                className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
              >
                <div className="grid gap-3 sm:grid-cols-[92px_1fr]">
                  <aside className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
                    <div className="mb-2 rounded-lg bg-[var(--accent-bg)] px-2 py-1 text-center font-[var(--font-mono)] text-[10px] text-[var(--accent)]">
                      Athlete View
                    </div>
                    <div className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
                      {['Dashboard', 'Workout', 'Nutrition', 'Hydration', 'Progress'].map((item) => (
                        <div key={item} className="rounded-md border border-[var(--border-subtle)] px-2 py-1.5">
                          {item}
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-[var(--font-display)] text-lg font-semibold">Today&apos;s Overview</h3>
                      <span className="font-[var(--font-mono)] text-xs text-[var(--text-tertiary)]">2026-04-04</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Calories', value: '2,140 / 2,400 kcal', pct: 89 },
                        { label: 'Protein', value: '165g / 180g', pct: 92 },
                        { label: 'Hydration', value: '2.1L / 3L', pct: 70 }
                      ].map((kpi) => (
                        <div key={kpi.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                          <p className="text-xs text-[var(--text-secondary)]">{kpi.label}</p>
                          <p className="mt-1 font-[var(--font-mono)] text-xs text-[var(--text-primary)]">{kpi.value}</p>
                          <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-surface-alt)]">
                            <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${kpi.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <svg className="mt-5 h-[95px] w-full" viewBox="0 0 260 95" role="img" aria-label="Weekly activity chart">
                      {[34, 48, 26, 63, 58, 76, 52].map((height, index) => (
                        <rect
                          key={`bar-${height}-${index}`}
                          x={12 + index * 35}
                          y={90 - height}
                          width={20}
                          height={height}
                          rx={6}
                          fill="rgba(34,197,94,0.8)"
                        />
                      ))}
                    </svg>

                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5">
                      <span className="pulse-dot inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                      <span className="font-[var(--font-mono)] text-xs text-[var(--text-secondary)]">Push Day · 32:14</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]" id="stats">
          <div className="mx-auto flex max-w-[1240px] flex-col divide-y divide-[var(--border-subtle)] md:flex-row md:divide-x md:divide-y-0">
            <StatCounter target={10000} suffix="+" label="Athletes Training" />
            <StatCounter target={500} suffix="+" label="Active Coaches" />
            <StatCounter target={2} suffix="" label="Role-Based Portals" />
            <StatCounter target={4.9} suffix="★" decimals={1} label="Average Rating" />
          </div>
        </section>

        <CombinedFeaturedSectionDemo className="px-4 sm:px-6" />

        <section className="px-1 pb-8 -mt-40 -mb-20 pt-2 sm:px-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '980px' }}>
          <div className="mx-auto max-w-[1240px]">
            <ContainerScroll
              titleComponent={
                <>
                  <h2 className="text-3xl font-semibold text-white md:text-5xl">
                    SuperFit platform preview
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-400">
                    One unified workspace for athletes and coaches to track execution, communicate, and grow.
                  </p>
                </>
              }
            >
              <div className="h-full w-full overflow-hidden rounded-2xl border border-lime-500/25 bg-zinc-950 p-4 sm:p-6">
                <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-xl border border-lime-500/20 bg-zinc-900">
                  <Image
                    src="/mockupimage.png"
                    alt="SuperFit platform mockup"
                    fill
                    sizes="(max-width: 768px) 100vw, 1100px"
                    className="object-cover object-center"
                    priority={false}
                  />
                </div>
              </div>
            </ContainerScroll>
          </div>
        </section>

        <section
          id="for-coaches"
          className="px-4 pb-20 sm:px-6"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1200px' }}
        >
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 text-center">
              <h2 className="font-[var(--font-display)] text-[36px] font-bold tracking-[-0.02em] sm:text-[44px]">Precision at every layer</h2>
            </div>
            <Features10 />
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6" id="faq" style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}>
          <div className="mx-auto max-w-[900px]">
            <div className="mb-8 text-center">
              <h2 className="font-[var(--font-display)] text-[34px] font-bold tracking-[-0.02em] sm:text-[42px]">Frequently Asked Questions</h2>
              <p className="mt-3 text-[var(--text-secondary)]">Everything athletes and coaches usually ask before getting started.</p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="1">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem
                  value={item.id}
                  key={item.id}
                  className="rounded-lg border border-[var(--accent)]/25 bg-[var(--bg-surface)] px-4 py-1"
                >
                  <AccordionTrigger className="py-2 text-[15px] leading-6 text-[var(--text-primary)] hover:no-underline">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 text-[var(--text-secondary)]">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section
          id="testimonials"
          className="px-4 pb-20 sm:px-6"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '640px' }}
        >
          <div className="mx-auto max-w-[1240px]">
            <Testimonials />
          </div>
        </section>

        <section
          id="pricing"
          className="px-4 pb-20 sm:px-6"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '780px' }}
        >
          <div className="mx-auto max-w-[1240px]">
            <div className="text-center">
              <h2 className="font-[var(--font-display)] text-[36px] font-bold tracking-[-0.02em] sm:text-[44px]">Simple, honest pricing</h2>
              <p className="mt-3 text-[var(--text-secondary)]">Start free. Scale as you grow.</p>
            </div>
            <div className="mt-9 grid gap-4 lg:grid-cols-3">
              <article className="pricing-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <p className="text-sm text-[var(--text-secondary)]">Get started</p>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">Free</h3>
                <p className="mt-2 font-[var(--font-mono)] text-3xl">$0/mo</p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  {['Workout tracking', 'Goal logging', 'Basic calculators', 'Hydration tracking', 'Community access'].map((f) => (
                    <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--accent)]" />{f}</li>
                  ))}
                </ul>
                <button type="button" className="mt-6 rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm" onClick={openGetStarted}>Start Free</button>
              </article>

              <article className="pricing-card rounded-2xl border border-[var(--accent)] bg-[var(--bg-surface)] p-6" style={{ boxShadow: '0 0 0 1px rgba(34,197,94,0.35)' }}>
                <p className="text-sm text-[var(--text-secondary)]">Train seriously</p>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">Pro</h3>
                <p className="mt-2 font-[var(--font-mono)] text-3xl">$12/mo</p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  {[
                    'Everything in Free',
                    'Nutrition diary',
                    'AI food scan',
                    'Progress analytics',
                    'Meal planner',
                    'Coach marketplace access',
                    'Priority support'
                  ].map((f) => (
                    <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--accent)]" />{f}</li>
                  ))}
                </ul>
                <button type="button" className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black" onClick={openGetStarted}>Start Pro</button>
              </article>

              <article className="pricing-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <p className="text-sm text-[var(--text-secondary)]">Run your business</p>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">Coach</h3>
                <p className="mt-2 font-[var(--font-mono)] text-3xl">From $29/mo</p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  {[
                    'Full coach portal',
                    'Client management',
                    'Program builder',
                    'Forms and broadcasts',
                    'Schedule',
                    'Marketplace listing',
                    'Analytics'
                  ].map((f) => (
                    <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--accent)]" />{f}</li>
                  ))}
                </ul>
                <button type="button" className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black" onClick={openGetStarted}>Apply as Coach</button>
              </article>
            </div>
          </div>
        </section>

        <section id="final-cta" className="relative overflow-hidden px-4 py-20 sm:px-6">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 60% at 20% 80%, rgba(34,197,94,0.18), transparent 70%), radial-gradient(44% 55% at 85% 10%, rgba(21,128,61,0.12), transparent 72%)'
            }}
          />
          <div className="mx-auto max-w-[980px] rounded-3xl border border-[var(--border-default)] bg-[rgba(17,17,17,0.78)] px-6 py-12 text-center backdrop-blur-sm sm:px-10">
            <h2 className="final-cta-headline font-[var(--font-display)] text-[40px] font-bold leading-tight tracking-[-0.03em] sm:text-[56px]">
              Start training with precision.
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Join 10,000+ athletes and 500+ coaches already building on SuperFit.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black"
                onClick={openGetStarted}
              >
                Create Free Account
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border-default)] px-6 py-3 text-sm"
                onClick={openGetStarted}
              >
                Apply as Coach
              </button>
            </div>
            <p className="mt-4 font-[var(--font-mono)] text-xs text-[var(--text-tertiary)]">
              No credit card required · Cancel anytime · Instant access
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[var(--accent)] px-2 py-1 font-[var(--font-display)] text-sm font-bold text-black">SF</div>
                <span className="font-[var(--font-display)] text-xl font-semibold">SuperFit</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Precision fitness. For every role.</p>
            </div>

            <div className="grid flex-1 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="font-[var(--font-display)] text-sm font-semibold">Product</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {['Features', 'Calculators', 'Workout Tracker', 'Nutrition', 'Community'].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-[var(--font-display)] text-sm font-semibold">Portals</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {['Athlete Portal', 'Coach Portal', 'Pricing'].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-[var(--font-display)] text-sm font-semibold">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {['About', 'Blog', 'Careers', 'Privacy', 'Terms'].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-tertiary)] sm:flex-row sm:items-center">
            <p>© 2026 SuperFit. Built for athletes, coaches, and operators.</p>
            <div className="flex items-center gap-2">
              <span>Dark theme</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {modalOpen !== 'none' && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal()
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`relative h-screen w-screen overflow-hidden border border-[var(--border-default)] bg-[rgba(17,17,17,0.94)] sm:h-auto sm:w-full sm:rounded-2xl ${
                modalOpen === 'coach-apply' ? 'sm:max-w-[580px]' : 'sm:max-w-[520px]'
              }`}
            >
              <button
                type="button"
                aria-label="Close modal"
                className="absolute right-4 top-4 z-20 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-screen overflow-y-auto sm:max-h-[calc(100vh-4rem)]">
                <AnimatePresence mode="wait" custom={modalDirection}>
                  <motion.div
                    key={modalOpen}
                    custom={modalDirection}
                    initial={{ opacity: 0, x: modalDirection > 0 ? 100 : -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: modalDirection > 0 ? -100 : 100 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    {modalContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        onClick={openGetStarted}
      >
        Start Now <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default LandingPage
