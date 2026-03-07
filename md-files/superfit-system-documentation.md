# SuperFit — Complete Web App System Documentation
## Full-Stack Next.js SaaS Fitness Platform | MVP Specification
### Senior Lead Engineer Reference Document v1.0

> **This document covers the complete system architecture, all Zustand stores, every page specification, component implementations, calculation formulas, mock data, and the full AI code generator prompt.**
> **Design decisions are NOT in this document — see `superfit-design-system.md` for all visual specifications.**
> **Tech:** Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Zustand · Framer Motion · Recharts

---

## TABLE OF CONTENTS

1. [Technology Stack & Setup](#1-technology-stack--setup)
2. [Project File Structure](#2-project-file-structure)
3. [TypeScript Type Definitions](#3-typescript-type-definitions)
4. [Zustand Store Specifications](#4-zustand-store-specifications)
5. [Calculation Engine](#5-calculation-engine)
6. [Mock Data Seeds](#6-mock-data-seeds)
7. [Page Specifications — All 13 Pages](#7-page-specifications)
8. [Component Specifications](#8-component-specifications)
9. [API Routes (MVP Stubs)](#9-api-routes)
10. [Routing & Navigation Logic](#10-routing--navigation-logic)
11. [Authentication Flow (Mock)](#11-authentication-flow)
12. [Performance Requirements](#12-performance-requirements)
13. [Complete AI Code Generator Prompt](#13-complete-ai-code-generator-prompt)

---

## 1. Technology Stack & Setup

### 1.1 Exact Package Versions

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "18.3.x",
    "react-dom": "18.3.x",
    "typescript": "5.4.x",
    "tailwindcss": "3.4.x",
    "framer-motion": "11.x",
    "recharts": "2.12.x",
    "zustand": "4.5.x",
    "date-fns": "3.6.x",
    "react-hook-form": "7.51.x",
    "zod": "3.23.x",
    "sonner": "1.4.x",
    "next-themes": "0.3.x",
    "lucide-react": "0.376.x",
    "class-variance-authority": "0.7.x",
    "clsx": "2.1.x",
    "tailwind-merge": "2.3.x",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-slider": "latest",
    "@radix-ui/react-switch": "latest",
    "@radix-ui/react-progress": "latest",
    "@radix-ui/react-avatar": "latest",
    "@radix-ui/react-popover": "latest",
    "@radix-ui/react-sheet": "latest",
    "@radix-ui/react-toast": "latest",
    "@radix-ui/react-accordion": "latest",
    "@radix-ui/react-separator": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-badge": "latest",
    "@radix-ui/react-scroll-area": "latest",
    "@radix-ui/react-command": "latest"
  }
}
```

### 1.2 Installation Commands

```bash
# 1. Create project
npx create-next-app@latest superfit \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd superfit

# 2. Initialize shadcn/ui
npx shadcn-ui@latest init
# When prompted:
# Style: Default
# Base color: Neutral  
# CSS variables: Yes

# 3. Add ALL shadcn components needed
npx shadcn-ui@latest add \
  button card input label select slider switch tabs badge avatar \
  dialog sheet progress separator skeleton toast dropdown-menu \
  popover command calendar scroll-area accordion collapsible \
  radio-group checkbox textarea tooltip alert

# 4. Install all other dependencies
npm install \
  framer-motion recharts zustand date-fns \
  react-hook-form zod sonner next-themes lucide-react \
  class-variance-authority clsx tailwind-merge

# 5. Install Google Fonts (or use next/font)
npm install @next/font
```

### 1.3 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'randomuser.me', 'api.dicebear.com'],
    formats: ['image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}
module.exports = nextConfig
```

### 1.4 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Sans', ...fontFamily.sans],
        body:    ['Inter', ...fontFamily.sans],
        mono:    ['JetBrains Mono', ...fontFamily.mono],
      },
      colors: {
        // Map Tailwind to CSS variables
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'shimmer': 'shimmer 1.4s infinite linear',
        'float':   'float 3s ease-in-out infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        }
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

---

## 2. Project File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← AppShell: sidebar + mobile nav
│   │   ├── page.tsx                ← Dashboard home
│   │   ├── nutrition/
│   │   │   ├── page.tsx            ← Food diary
│   │   │   ├── scan/page.tsx       ← Camera / AI scan
│   │   │   └── meal-planner/page.tsx
│   │   ├── workouts/
│   │   │   ├── page.tsx            ← Schedule + library
│   │   │   ├── log/page.tsx        ← Active workout session
│   │   │   ├── programs/page.tsx   ← Programs & routines
│   │   │   └── [id]/page.tsx       ← Workout detail
│   │   ├── hydration/
│   │   │   └── page.tsx
│   │   ├── calculators/
│   │   │   ├── page.tsx            ← Calculator hub
│   │   │   ├── bmi/page.tsx
│   │   │   ├── protein/page.tsx
│   │   │   ├── calories/page.tsx
│   │   │   ├── creatine/page.tsx
│   │   │   ├── macros/page.tsx
│   │   │   ├── tdee/page.tsx
│   │   │   ├── body-fat/page.tsx
│   │   │   ├── one-rep-max/page.tsx
│   │   │   ├── vo2-max/page.tsx
│   │   │   ├── heart-rate-zones/page.tsx
│   │   │   ├── if-window/page.tsx
│   │   │   ├── reverse-diet/page.tsx
│   │   │   ├── ideal-weight/page.tsx
│   │   │   ├── calories-burned/page.tsx
│   │   │   └── caffeine/page.tsx
│   │   ├── progress/
│   │   │   └── page.tsx
│   │   ├── coaching/
│   │   │   ├── page.tsx            ← Coach discovery + Image 3 layout
│   │   │   ├── [coachId]/page.tsx  ← Coach profile
│   │   │   └── my-coach/page.tsx   ← Active coaching
│   │   ├── community/
│   │   │   └── page.tsx
│   │   ├── timers/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── coach/
│   │   ├── layout.tsx              ← Coach-side shell (different nav)
│   │   ├── page.tsx                ← Coach dashboard
│   │   ├── clients/page.tsx
│   │   ├── programs/page.tsx
│   │   ├── content/page.tsx
│   │   └── analytics/page.tsx
│   ├── globals.css
│   └── layout.tsx                  ← Root layout with providers
│
├── components/
│   ├── ui/                         ← shadcn/ui generated components
│   ├── layout/
│   │   ├── AppShell.tsx            ← Desktop sidebar + content wrapper
│   │   ├── Sidebar.tsx             ← Left nav (desktop)
│   │   ├── MobileNav.tsx           ← Bottom tab bar (mobile)
│   │   ├── TopBar.tsx              ← Mobile header
│   │   ├── DesktopTopBar.tsx       ← Desktop header row
│   │   └── PageWrapper.tsx         ← Motion wrapper for page transitions
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── MacroRingCard.tsx
│   │   ├── HeartRateCard.tsx
│   │   ├── RecommendedActivity.tsx
│   │   ├── FitnessGoalCard.tsx
│   │   └── TrainerCarousel.tsx
│   ├── nutrition/
│   │   ├── FoodDiary.tsx
│   │   ├── MealSection.tsx
│   │   ├── FoodEntryRow.tsx
│   │   ├── FoodSearchSheet.tsx
│   │   ├── MacroSummaryBar.tsx
│   │   ├── CalendarStrip.tsx
│   │   ├── AIScanOverlay.tsx
│   │   └── MealPlannerGrid.tsx
│   ├── workouts/
│   │   ├── WorkoutSchedule.tsx
│   │   ├── TimeSlotList.tsx
│   │   ├── WorkoutCard.tsx
│   │   ├── WorkoutEmptyState.tsx
│   │   ├── ExerciseLibrary.tsx
│   │   ├── ActiveSession.tsx
│   │   ├── SetLogger.tsx
│   │   ├── RestTimer.tsx
│   │   └── StrengthChart.tsx
│   ├── hydration/
│   │   ├── HydrationRing.tsx
│   │   ├── QuickAddButtons.tsx
│   │   ├── DrinkTypeSelector.tsx
│   │   ├── DrinkLog.tsx
│   │   └── HydrationChart.tsx
│   ├── calculators/
│   │   ├── CalculatorHub.tsx
│   │   ├── BMICalculator.tsx
│   │   ├── ProteinCalculator.tsx
│   │   ├── CalorieDeficitCalculator.tsx
│   │   ├── CreatineCalculator.tsx
│   │   ├── MacroCalculator.tsx
│   │   └── OneRepMaxCalculator.tsx
│   ├── timers/
│   │   ├── TimerHub.tsx
│   │   ├── IntervalTimer.tsx
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   └── CustomTimerBuilder.tsx
│   ├── coaching/
│   │   ├── CoachingLayout.tsx      ← Three-column Image 3 layout
│   │   ├── CoachCard.tsx
│   │   ├── AIAssistantCard.tsx
│   │   ├── BodyAreaBrowser.tsx
│   │   ├── StreakPanel.tsx
│   │   ├── NutritionHistoryPanel.tsx
│   │   └── TrendingWorkouts.tsx
│   ├── progress/
│   │   ├── WeightChart.tsx
│   │   ├── ProgressPhotoGrid.tsx
│   │   ├── MeasurementsTracker.tsx
│   │   └── PRTracker.tsx
│   ├── community/
│   │   ├── SocialFeed.tsx
│   │   ├── PostCard.tsx
│   │   ├── ChallengeCard.tsx
│   │   └── Leaderboard.tsx
│   └── shared/
│       ├── PageHeader.tsx
│       ├── StatCard.tsx
│       ├── ProgressRing.tsx
│       ├── ProgressBar.tsx
│       ├── ThemeToggle.tsx
│       ├── LoadingSkeleton.tsx
│       ├── EmptyState.tsx
│       ├── AvatarWithStatus.tsx
│       └── NumberStepper.tsx
│
├── store/
│   ├── useUserStore.ts
│   ├── useNutritionStore.ts
│   ├── useWorkoutStore.ts
│   ├── useHydrationStore.ts
│   ├── useProgressStore.ts
│   ├── useCoachingStore.ts
│   ├── useTimerStore.ts
│   └── useCommunityStore.ts
│
├── lib/
│   ├── utils.ts               ← cn(), formatters
│   ├── calculations.ts        ← ALL fitness formulas
│   ├── foodDatabase.ts        ← 60 mock foods
│   ├── exerciseDatabase.ts    ← 80 mock exercises
│   ├── coachData.ts           ← 6 mock coaches
│   └── mockData.ts            ← All seed data for stores
│
├── hooks/
│   ├── useTimer.ts            ← Timer interval management
│   ├── useWorkoutSession.ts   ← Active workout helpers
│   ├── useNutrition.ts        ← Food diary helpers
│   ├── useHydration.ts        ← Water tracking helpers
│   └── useTheme.ts            ← Theme management
│
└── types/
    └── index.ts               ← ALL TypeScript interfaces
```

---

## 3. TypeScript Type Definitions

### `src/types/index.ts` — COMPLETE

```typescript
// ══════════════════════════════════════════
// USER
// ══════════════════════════════════════════
export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active'
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'recomposition' | 'maintenance' | 'endurance' | 'general'
export type DietaryPreference = 'omnivore' | 'vegan' | 'vegetarian' | 'keto' | 'paleo' | 'flexitarian'
export type MeasurementSystem = 'metric' | 'imperial'
export type ExercisePreference = 'weights' | 'cardio' | 'hiit' | 'yoga' | 'cycling' | 'running' | 'martial_arts' | 'crossfit' | 'sports'

export interface UserProfile {
  id:                  string
  name:                string
  email:               string
  avatar:              string | null
  age:                 number
  sex:                 Sex
  height:              number       // cm
  currentWeight:       number       // kg
  goalWeight:          number       // kg
  goal:                FitnessGoal
  activityLevel:       ActivityLevel
  weeklyWorkouts:      number       // sessions per week
  sessionDuration:     number       // minutes
  exercisePreferences: ExercisePreference[]
  dietaryPreference:   DietaryPreference
  measurementSystem:   MeasurementSystem
  bmr:                 number       // auto-calculated, kcal
  tdee:                number       // auto-calculated, kcal
  dailyCalorieTarget:  number       // kcal
  proteinTarget:       number       // grams
  carbTarget:          number       // grams
  fatTarget:           number       // grams
  fiberTarget:         number       // grams
  waterTargetMl:       number       // ml
  isPro:               boolean
  isCoach:             boolean
  onboardingComplete:  boolean
  joinDate:            string       // ISO date string
  timezone:            string
}

// ══════════════════════════════════════════
// NUTRITION
// ══════════════════════════════════════════
export type MealSlot = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'
export type NutrientCategory = 'Protein' | 'Grains' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Nuts' | 'Fats' | 'Beverages' | 'Supplements' | 'Snacks' | 'Restaurant' | 'Other'

export interface FoodItem {
  id:           string
  name:         string
  brand?:       string
  servingSize:  number       // grams
  servingUnit:  string       // 'g' | 'ml' | 'oz' | 'piece' | 'cup' etc.
  calories:     number       // per serving
  protein:      number       // grams per serving
  carbs:        number       // grams per serving
  fat:          number       // grams per serving
  fiber?:       number
  sugar?:       number
  sodium?:      number       // mg
  potassium?:   number       // mg
  vitaminC?:    number       // mg
  calcium?:     number       // mg
  iron?:        number       // mg
  cholesterol?: number       // mg
  saturatedFat?: number      // grams
  category:     NutrientCategory
  isVerified:   boolean
  isCustom?:    boolean
  barcode?:     string
}

export interface MealEntry {
  id:         string
  foodItemId: string
  foodItem:   FoodItem
  quantity:   number       // multiplier of servingSize (1 = one serving)
  mealSlot:   MealSlot
  loggedAt:   string       // ISO datetime
  notes?:     string
}

export interface DayLog {
  date:    string           // YYYY-MM-DD
  entries: MealEntry[]
}

export interface SavedMeal {
  id:      string
  name:    string
  entries: Omit<MealEntry, 'id' | 'loggedAt'>[]
}

export interface WeeklyMealPlan {
  id:    string
  name:  string
  days:  Record<number, Record<MealSlot, string[]>>  // dayIndex → mealSlot → foodItemIds
}

// ══════════════════════════════════════════
// WORKOUTS
// ══════════════════════════════════════════
export type SetType = 'warmup' | 'working' | 'failure' | 'dropset'
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation' | 'cardio' | 'core' | 'isolation'
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'traps' | 'lats' | 'cardio'
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'resistance_band' | 'kettlebell' | 'suspension' | 'pull_up_bar' | 'bench' | 'rack'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Exercise {
  id:              string
  name:            string
  muscleGroups:    MuscleGroup[]    // primary muscle groups
  secondaryGroups?: MuscleGroup[]
  equipment:       Equipment[]
  movementPattern: MovementPattern
  difficulty:      Difficulty
  instructions:    string[]
  gifUrl?:         string
  videoUrl?:       string
  isCustom?:       boolean
}

export interface SetLog {
  id:            string
  setNumber:     number
  weight:        number         // kg or lbs (user's preference)
  reps:          number
  rpe?:          number         // 1–10
  setType:       SetType
  completed:     boolean
  restSeconds?:  number         // recommended rest
  notes?:        string
}

export interface ExerciseLog {
  id:               string
  exerciseId:       string
  exercise:         Exercise
  sets:             SetLog[]
  notes?:           string
  isSuperset:       boolean
  supersetGroupId?: string      // links exercises in a superset
  targetSets?:      number
  targetReps?:      string      // e.g., "8-12" or "5"
  targetWeight?:    number
}

export interface WorkoutSession {
  id:            string
  name:          string
  date:          string         // YYYY-MM-DD
  startTime:     string         // ISO datetime
  endTime?:      string
  duration?:     number         // minutes
  exercises:     ExerciseLog[]
  totalVolume:   number         // total kg lifted (sets × reps × weight)
  calories?:     number         // estimated calories burned
  notes?:        string
  isCompleted:   boolean
  routineId?:    string         // which routine it was based on
  isTemplate:    boolean        // is this a template (not a logged session)
}

export interface WorkoutRoutine {
  id:            string
  name:          string
  description?:  string
  exercises:     {
    exerciseId:   string
    targetSets:   number
    targetReps:   string        // "8-12" or "5×5" etc.
    restSeconds:  number
    notes?:       string
  }[]
  scheduledDays?: number[]      // 0=Sun, 1=Mon ... 6=Sat
  category?:      string
}

// ══════════════════════════════════════════
// HYDRATION
// ══════════════════════════════════════════
export type DrinkType = 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink' | 'milk' | 'sparkling' | 'smoothie' | 'custom'

export interface DrinkEntry {
  id:              string
  type:            DrinkType
  label:           string        // display name
  amountMl:        number
  caffeinesMg?:    number
  hydrationFactor: number        // 1.0=water, 0.8=tea, 0.5=coffee, -0.3=alcohol
  loggedAt:        string        // ISO datetime
}

export interface HydrationDay {
  date:                string
  entries:             DrinkEntry[]
  goalMl:              number
  totalHydrationMl:    number    // sum of amountMl × hydrationFactor
  totalCaffeineMg:     number
}

// ══════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════
export interface WeightEntry {
  date:      string
  weight:    number   // kg
  bodyFat?:  number   // percentage
  notes?:    string
}

export interface BodyMeasurements {
  date:        string
  neck?:       number
  shoulders?:  number
  chest?:      number
  upperArm?:   number
  forearm?:    number
  waist?:      number
  hips?:       number
  thigh?:      number
  calf?:       number
  custom?:     Record<string, number>
}

export interface ProgressPhoto {
  id:     string
  date:   string
  url:    string
  notes?: string
}

export interface PersonalRecord {
  exerciseId:   string
  exerciseName: string
  weight:       number
  reps:         number
  estimated1RM: number
  date:         string
}

// ══════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════
export type TimerMode = 'tabata' | 'hiit' | 'emom' | 'amrap' | 'circuit' | 'custom' | 'round_timer' | 'countdown' | 'yoga' | 'boxing'
export type IntervalType = 'work' | 'rest' | 'prepare' | 'transition'

export interface TimerInterval {
  id:              string
  name:            string
  durationSeconds: number
  type:            IntervalType
  color:           string
  exerciseGifUrl?: string
  coachingCue?:    string
}

export interface TimerConfig {
  id:              string
  name:            string
  mode:            TimerMode
  intervals:       TimerInterval[]
  totalRounds:     number
  prepSeconds:     number        // countdown before starting
  soundEnabled:    boolean
  restBetweenRounds: number      // seconds
}

// ══════════════════════════════════════════
// COACHING
// ══════════════════════════════════════════
export type CoachSpecialty = 'weight_loss' | 'muscle_gain' | 'powerlifting' | 'athletic_performance' | 'prenatal' | 'senior' | 'rehabilitation' | 'nutrition' | 'cardio' | 'hiit' | 'yoga' | 'mindfulness'

export interface Coach {
  id:            string
  name:          string
  avatar:        string
  coverImage:    string
  specialty:     CoachSpecialty[]
  bio:           string
  shortBio:      string          // 1-2 sentences for cards
  certifications: string[]
  rating:        number          // 0–5
  reviewCount:   number
  clientCount:   number
  pricePerMonth: number          // USD
  isVerified:    boolean
  isAvailable:   boolean
  languages:     string[]
  yearsExp:      number
  location:      string
}

export interface CoachPost {
  id:          string
  coachId:     string
  type:        'text' | 'image' | 'video' | 'workout' | 'meal_plan' | 'challenge'
  title?:      string
  content:     string
  mediaUrl?:   string
  tags:        string[]
  likes:       number
  comments:    number
  saves:       number
  postedAt:    string
  isExclusive: boolean           // subscriber-only
  isLiked?:    boolean           // by current user
  isSaved?:    boolean
}

// ══════════════════════════════════════════
// COMMUNITY
// ══════════════════════════════════════════
export interface CommunityPost {
  id:          string
  userId:      string
  userName:    string
  userAvatar:  string
  isCoach:     boolean
  type:        'workout' | 'meal' | 'progress' | 'text' | 'pr' | 'challenge'
  content:     string
  mediaUrl?:   string
  workoutRef?: { name: string; duration: number; volume: number }
  mealRef?:    { calories: number; protein: number }
  prRef?:      { exercise: string; weight: number; reps: number }
  likes:       number
  comments:    number
  isLiked?:    boolean
  postedAt:    string
}

export interface Challenge {
  id:          string
  name:        string
  description: string
  type:        'steps' | 'calories' | 'workouts' | 'water' | 'protein' | 'custom'
  startDate:   string
  endDate:     string
  participants: number
  isJoined?:   boolean
  leaderboard: { userId: string; name: string; avatar: string; score: number }[]
}
```

---

## 4. Zustand Store Specifications

### `useUserStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserProfile } from '@/types'
import { calculateBMR, calculateTDEE, calculateProteinTarget, calculateWaterGoal } from '@/lib/calculations'

interface UserState {
  user: UserProfile | null
  isAuthenticated: boolean
  // Actions
  setUser: (user: UserProfile) => void
  updateUser: (partial: Partial<UserProfile>) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  completeOnboarding: (data: Partial<UserProfile>) => void
  recalculateTargets: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null
        })),

      login: async (email, password) => {
        // MVP: mock login — accept any credentials
        const mockUser = getMockUser()
        set({ user: mockUser, isAuthenticated: true })
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      completeOnboarding: (data) => {
        const { weight, height, age, sex, goal, activityLevel } = data as any
        const bmr  = calculateBMR(weight, height, age, sex)
        const tdee = calculateTDEE(bmr, activityLevel)
        const deficitSurplus = goal === 'weight_loss' ? -500 : goal === 'muscle_gain' ? 300 : 0
        const calorieTarget = Math.max(1200, tdee + deficitSurplus)
        const protein = calculateProteinTarget(weight, goal, activityLevel)
        const fat     = Math.round((calorieTarget * 0.28) / 9)
        const carbs   = Math.round((calorieTarget - (protein * 4) - (fat * 9)) / 4)
        const water   = calculateWaterGoal(weight, activityLevel)

        set((state) => ({
          user: {
            ...state.user!,
            ...data,
            bmr,
            tdee,
            dailyCalorieTarget: calorieTarget,
            proteinTarget:  protein,
            carbTarget:     carbs,
            fatTarget:      fat,
            fiberTarget:    sex === 'male' ? 38 : 25,
            waterTargetMl:  water,
            onboardingComplete: true,
          }
        }))
      },

      recalculateTargets: () => {
        const { user } = get()
        if (!user) return
        const bmr     = calculateBMR(user.currentWeight, user.height, user.age, user.sex)
        const tdee    = calculateTDEE(bmr, user.activityLevel)
        const protein = calculateProteinTarget(user.currentWeight, user.goal, user.activityLevel)
        set((state) => ({
          user: state.user ? { ...state.user, bmr, tdee, proteinTarget: protein } : null
        }))
      },
    }),
    { name: 'superfit-user' }
  )
)
```

### `useNutritionStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MealEntry, DayLog, FoodItem, SavedMeal, MealSlot } from '@/types'
import { format } from 'date-fns'
import { FOOD_DATABASE } from '@/lib/foodDatabase'
import { SEED_FOOD_ENTRIES } from '@/lib/mockData'

interface NutritionState {
  logs:        Record<string, DayLog>     // key: YYYY-MM-DD
  foodDatabase: FoodItem[]
  savedMeals:  SavedMeal[]
  // Actions
  addFoodEntry:    (entry: Omit<MealEntry, 'id'>, date?: string) => void
  removeFoodEntry: (entryId: string, date?: string) => void
  updateFoodEntry: (entryId: string, quantity: number, date?: string) => void
  getTodayLog:     () => DayLog
  getTodayMacros:  () => { calories: number; protein: number; carbs: number; fat: number }
  getMacrosForDate:(date: string) => { calories: number; protein: number; carbs: number; fat: number }
  getLogStreak:    () => number
  searchFoods:     (query: string) => FoodItem[]
  saveMeal:        (name: string, entries: MealEntry[]) => void
}

const EMPTY_MACROS = { calories: 0, protein: 0, carbs: 0, fat: 0 }

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs:         { [format(new Date(), 'yyyy-MM-dd')]: { date: format(new Date(), 'yyyy-MM-dd'), entries: SEED_FOOD_ENTRIES } },
      foodDatabase: FOOD_DATABASE,
      savedMeals:   [],

      addFoodEntry: (entry, date) => {
        const key = date ?? format(new Date(), 'yyyy-MM-dd')
        const id  = `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`
        set((state) => {
          const existing = state.logs[key] ?? { date: key, entries: [] }
          return {
            logs: {
              ...state.logs,
              [key]: { ...existing, entries: [...existing.entries, { ...entry, id }] }
            }
          }
        })
      },

      removeFoodEntry: (entryId, date) => {
        const key = date ?? format(new Date(), 'yyyy-MM-dd')
        set((state) => ({
          logs: {
            ...state.logs,
            [key]: {
              ...state.logs[key],
              entries: (state.logs[key]?.entries ?? []).filter(e => e.id !== entryId)
            }
          }
        }))
      },

      updateFoodEntry: (entryId, quantity, date) => {
        const key = date ?? format(new Date(), 'yyyy-MM-dd')
        set((state) => ({
          logs: {
            ...state.logs,
            [key]: {
              ...state.logs[key],
              entries: (state.logs[key]?.entries ?? []).map(e =>
                e.id === entryId ? { ...e, quantity } : e
              )
            }
          }
        }))
      },

      getTodayLog: () => {
        const key = format(new Date(), 'yyyy-MM-dd')
        return get().logs[key] ?? { date: key, entries: [] }
      },

      getTodayMacros: () => {
        return get().getMacrosForDate(format(new Date(), 'yyyy-MM-dd'))
      },

      getMacrosForDate: (date) => {
        const log = get().logs[date]
        if (!log) return EMPTY_MACROS
        return log.entries.reduce((acc, entry) => {
          const { foodItem, quantity } = entry
          const ratio = (quantity * foodItem.servingSize) / foodItem.servingSize
          // quantity is already the multiplier:
          return {
            calories: acc.calories + foodItem.calories * quantity,
            protein:  acc.protein  + foodItem.protein  * quantity,
            carbs:    acc.carbs    + foodItem.carbs     * quantity,
            fat:      acc.fat      + foodItem.fat       * quantity,
          }
        }, { ...EMPTY_MACROS })
      },

      getLogStreak: () => {
        const { logs } = get()
        let streak = 0
        let date = new Date()
        while (true) {
          const key = format(date, 'yyyy-MM-dd')
          if (!logs[key] || logs[key].entries.length === 0) break
          streak++
          date.setDate(date.getDate() - 1)
        }
        return streak
      },

      searchFoods: (query) => {
        const q = query.toLowerCase().trim()
        if (!q) return get().foodDatabase.slice(0, 20)
        return get().foodDatabase.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.brand?.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        ).slice(0, 50)
      },

      saveMeal: (name, entries) => {
        const id = `meal_${Date.now()}`
        const saved: SavedMeal = {
          id, name,
          entries: entries.map(({ id: _, loggedAt: __, ...rest }) => rest)
        }
        set((state) => ({ savedMeals: [...state.savedMeals, saved] }))
      },
    }),
    { name: 'superfit-nutrition' }
  )
)
```

### `useWorkoutStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WorkoutSession, ExerciseLog, SetLog, WorkoutRoutine, Exercise, SetType } from '@/types'
import { format } from 'date-fns'
import { EXERCISE_LIBRARY } from '@/lib/exerciseDatabase'
import { SEED_WORKOUT_SESSIONS, SEED_ROUTINES } from '@/lib/mockData'
import { calculate1RM } from '@/lib/calculations'

interface WorkoutState {
  sessions:        WorkoutSession[]
  routines:        WorkoutRoutine[]
  exerciseLibrary: Exercise[]
  activeSession:   WorkoutSession | null
  // Actions
  startWorkout:          (name: string, routineId?: string) => void
  endWorkout:            (save?: boolean) => void
  addExerciseToSession:  (exerciseId: string) => void
  removeExerciseFromSession: (exerciseLogId: string) => void
  addSet:                (exerciseLogId: string, setType?: SetType) => void
  updateSet:             (exerciseLogId: string, setId: string, updates: Partial<SetLog>) => void
  completeSet:           (exerciseLogId: string, setId: string) => void
  removeSet:             (exerciseLogId: string, setId: string) => void
  getPRs:                () => Record<string, { weight: number; reps: number; estimated1RM: number; date: string }>
  getWeeklyVolume:       () => number
  getWorkoutStreak:      () => number
  getVolumeByMuscle:     () => Record<string, number>
  getSessionsByDate:     (date: string) => WorkoutSession[]
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessions:        SEED_WORKOUT_SESSIONS,
      routines:        SEED_ROUTINES,
      exerciseLibrary: EXERCISE_LIBRARY,
      activeSession:   null,

      startWorkout: (name, routineId) => {
        const routine = routineId ? get().routines.find(r => r.id === routineId) : null
        const exercises: ExerciseLog[] = routine
          ? routine.exercises.map((re, i) => {
              const ex = get().exerciseLibrary.find(e => e.id === re.exerciseId)!
              return {
                id:           `el_${Date.now()}_${i}`,
                exerciseId:   re.exerciseId,
                exercise:     ex,
                sets:         [{ id: `set_${Date.now()}`, setNumber: 1, weight: 0, reps: 0, setType: 'working', completed: false }],
                isSuperset:   false,
                targetSets:   re.targetSets,
                targetReps:   re.targetReps,
              }
            })
          : []

        const session: WorkoutSession = {
          id:          `ws_${Date.now()}`,
          name,
          date:        format(new Date(), 'yyyy-MM-dd'),
          startTime:   new Date().toISOString(),
          exercises,
          totalVolume: 0,
          isCompleted: false,
          isTemplate:  false,
        }
        set({ activeSession: session })
      },

      endWorkout: (save = true) => {
        const { activeSession } = get()
        if (!activeSession) return
        const completed = {
          ...activeSession,
          endTime:     new Date().toISOString(),
          duration:    Math.round((Date.now() - new Date(activeSession.startTime).getTime()) / 60000),
          totalVolume: activeSession.exercises.reduce((total, el) =>
            total + el.sets.filter(s => s.completed).reduce((v, s) => v + s.weight * s.reps, 0), 0),
          isCompleted: true,
        }
        if (save) {
          set((state) => ({
            sessions:      [completed, ...state.sessions],
            activeSession: null
          }))
        } else {
          set({ activeSession: null })
        }
      },

      addExerciseToSession: (exerciseId) => {
        const exercise = get().exerciseLibrary.find(e => e.id === exerciseId)
        if (!exercise || !get().activeSession) return
        const exerciseLog: ExerciseLog = {
          id:         `el_${Date.now()}`,
          exerciseId,
          exercise,
          sets:       [{ id: `set_${Date.now()}`, setNumber: 1, weight: 0, reps: 0, setType: 'working', completed: false }],
          isSuperset: false,
        }
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, exercises: [...state.activeSession.exercises, exerciseLog] }
            : null
        }))
      },

      addSet: (exerciseLogId, setType = 'working') => {
        set((state) => {
          if (!state.activeSession) return state
          const exercises = state.activeSession.exercises.map(el => {
            if (el.id !== exerciseLogId) return el
            const newSetNum = el.sets.length + 1
            const lastSet = el.sets[el.sets.length - 1]
            return {
              ...el,
              sets: [...el.sets, {
                id:         `set_${Date.now()}`,
                setNumber:  newSetNum,
                weight:     lastSet?.weight ?? 0,
                reps:       lastSet?.reps ?? 0,
                setType,
                completed:  false,
              }]
            }
          })
          return { activeSession: { ...state.activeSession, exercises } }
        })
      },

      updateSet: (exerciseLogId, setId, updates) => {
        set((state) => {
          if (!state.activeSession) return state
          const exercises = state.activeSession.exercises.map(el => {
            if (el.id !== exerciseLogId) return el
            return { ...el, sets: el.sets.map(s => s.id === setId ? { ...s, ...updates } : s) }
          })
          return { activeSession: { ...state.activeSession, exercises } }
        })
      },

      completeSet: (exerciseLogId, setId) => {
        get().updateSet(exerciseLogId, setId, { completed: true })
      },

      removeSet: (exerciseLogId, setId) => {
        set((state) => {
          if (!state.activeSession) return state
          const exercises = state.activeSession.exercises.map(el => {
            if (el.id !== exerciseLogId) return el
            return { ...el, sets: el.sets.filter(s => s.id !== setId) }
          })
          return { activeSession: { ...state.activeSession, exercises } }
        })
      },

      removeExerciseFromSession: (exerciseLogId) => {
        set((state) => {
          if (!state.activeSession) return state
          return {
            activeSession: {
              ...state.activeSession,
              exercises: state.activeSession.exercises.filter(el => el.id !== exerciseLogId)
            }
          }
        })
      },

      getPRs: () => {
        const prs: Record<string, { weight: number; reps: number; estimated1RM: number; date: string }> = {}
        get().sessions.forEach(session => {
          session.exercises.forEach(el => {
            el.sets.filter(s => s.completed && s.weight > 0).forEach(s => {
              const est1RM = calculate1RM(s.weight, s.reps)
              const existing = prs[el.exerciseId]
              if (!existing || est1RM > existing.estimated1RM) {
                prs[el.exerciseId] = { weight: s.weight, reps: s.reps, estimated1RM: est1RM, date: session.date }
              }
            })
          })
        })
        return prs
      },

      getWeeklyVolume: () => {
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        return get().sessions
          .filter(s => new Date(s.date) >= startOfWeek && s.isCompleted)
          .reduce((total, s) => total + s.totalVolume, 0)
      },

      getWorkoutStreak: () => {
        const sessions = get().sessions.filter(s => s.isCompleted)
        const sessionDates = new Set(sessions.map(s => s.date))
        let streak = 0
        let date = new Date()
        while (sessionDates.has(format(date, 'yyyy-MM-dd'))) {
          streak++
          date.setDate(date.getDate() - 1)
        }
        return streak
      },

      getVolumeByMuscle: () => {
        const volumes: Record<string, number> = {}
        const lastMonth = new Date(); lastMonth.setDate(lastMonth.getDate() - 30)
        get().sessions
          .filter(s => s.isCompleted && new Date(s.date) >= lastMonth)
          .forEach(session => {
            session.exercises.forEach(el => {
              const volume = el.sets.filter(s => s.completed)
                .reduce((v, s) => v + s.weight * s.reps, 0)
              el.exercise.muscleGroups.forEach(mg => {
                volumes[mg] = (volumes[mg] ?? 0) + volume
              })
            })
          })
        return volumes
      },

      getSessionsByDate: (date) => {
        return get().sessions.filter(s => s.date === date && s.isCompleted)
      },
    }),
    { name: 'superfit-workouts' }
  )
)
```

### `useHydrationStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DrinkEntry, HydrationDay, DrinkType } from '@/types'
import { format } from 'date-fns'
import { SEED_HYDRATION } from '@/lib/mockData'

const HYDRATION_FACTORS: Record<DrinkType, number> = {
  water: 1.0, sparkling: 1.0, juice: 0.85, milk: 0.85,
  smoothie: 0.9, sports_drink: 0.9,
  tea: 0.8, coffee: 0.5, custom: 0.9,
}

const CAFFEINE_CONTENT: Partial<Record<DrinkType, number>> = {
  coffee: 95,   // mg per 240ml
  tea:    47,   // mg per 240ml
}

interface HydrationState {
  days:        Record<string, HydrationDay>
  dailyGoalMl: number
  cupSizes:    { label: string; ml: number }[]
  // Actions
  addDrink:            (type: DrinkType, amountMl: number, label?: string) => void
  removeDrink:         (drinkId: string, date?: string) => void
  setDailyGoal:        (ml: number) => void
  getToday:            () => HydrationDay
  getHydrationPercent: () => number
  getHydrationStreak:  () => number
  getWeekHistory:      () => HydrationDay[]
}

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      days:        SEED_HYDRATION,
      dailyGoalMl: 2500,
      cupSizes: [
        { label: '150ml', ml: 150 },
        { label: '250ml', ml: 250 },
        { label: '350ml', ml: 350 },
        { label: '500ml', ml: 500 },
      ],

      addDrink: (type, amountMl, label) => {
        const key     = format(new Date(), 'yyyy-MM-dd')
        const factor  = HYDRATION_FACTORS[type] ?? 1.0
        const caffeine = (CAFFEINE_CONTENT[type] ?? 0) * (amountMl / 240)
        const entry: DrinkEntry = {
          id:              `drink_${Date.now()}`,
          type,
          label:           label ?? type.replace('_', ' '),
          amountMl,
          caffeinesMg:     caffeine > 0 ? caffeine : undefined,
          hydrationFactor: factor,
          loggedAt:        new Date().toISOString(),
        }
        set((state) => {
          const existing = state.days[key] ?? { date: key, entries: [], goalMl: state.dailyGoalMl, totalHydrationMl: 0, totalCaffeineMg: 0 }
          const newTotal    = existing.totalHydrationMl + (amountMl * factor)
          const newCaffeine = existing.totalCaffeineMg + (caffeine)
          return {
            days: {
              ...state.days,
              [key]: { ...existing, entries: [...existing.entries, entry], totalHydrationMl: newTotal, totalCaffeineMg: newCaffeine }
            }
          }
        })
      },

      removeDrink: (drinkId, date) => {
        const key = date ?? format(new Date(), 'yyyy-MM-dd')
        set((state) => {
          const day = state.days[key]
          if (!day) return state
          const removed = day.entries.find(e => e.id === drinkId)
          if (!removed) return state
          return {
            days: {
              ...state.days,
              [key]: {
                ...day,
                entries: day.entries.filter(e => e.id !== drinkId),
                totalHydrationMl: day.totalHydrationMl - (removed.amountMl * removed.hydrationFactor),
                totalCaffeineMg:  day.totalCaffeineMg  - (removed.caffeinesMg ?? 0),
              }
            }
          }
        })
      },

      setDailyGoal: (ml) => set({ dailyGoalMl: ml }),

      getToday: () => {
        const key = format(new Date(), 'yyyy-MM-dd')
        const { dailyGoalMl } = get()
        return get().days[key] ?? { date: key, entries: [], goalMl: dailyGoalMl, totalHydrationMl: 0, totalCaffeineMg: 0 }
      },

      getHydrationPercent: () => {
        const today = get().getToday()
        return Math.min(100, Math.round((today.totalHydrationMl / today.goalMl) * 100))
      },

      getHydrationStreak: () => {
        const { days, dailyGoalMl } = get()
        let streak = 0
        let date = new Date()
        while (true) {
          const key = format(date, 'yyyy-MM-dd')
          const day = days[key]
          if (!day || day.totalHydrationMl < day.goalMl * 0.9) break
          streak++
          date.setDate(date.getDate() - 1)
        }
        return streak
      },

      getWeekHistory: () => {
        const { days, dailyGoalMl } = get()
        const history: HydrationDay[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(); date.setDate(date.getDate() - i)
          const key  = format(date, 'yyyy-MM-dd')
          history.push(days[key] ?? { date: key, entries: [], goalMl: dailyGoalMl, totalHydrationMl: 0, totalCaffeineMg: 0 })
        }
        return history
      },
    }),
    { name: 'superfit-hydration' }
  )
)
```

### `useProgressStore.ts`, `useTimerStore.ts`, `useCoachingStore.ts`

These follow the same pattern — see the TypeScript interfaces in Section 3 for the full data model. Each uses `create` + `persist` middleware, initializes with SEED data from `mockData.ts`, and exposes actions that update the Zustand state.

---

## 5. Calculation Engine

### `src/lib/calculations.ts` — COMPLETE

```typescript
import { ActivityLevel, FitnessGoal, Sex } from '@/types'

// ═══════════════════════════════════════════
// BMR & TDEE
// ═══════════════════════════════════════════

/**
 * Harris-Benedict BMR Formula (revised Roza & Shizgal 1984)
 * @param weight kg | @param height cm | @param age years
 * @returns BMR in kcal/day
 */
export function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
  if (sex === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  }
  return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  very_active: 1.725,
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2))
}

// ═══════════════════════════════════════════
// CALORIE TARGET
// ═══════════════════════════════════════════

const GOAL_ADJUSTMENTS: Record<FitnessGoal, number> = {
  weight_loss:   -500,
  muscle_gain:    300,
  recomposition:  -200,
  maintenance:      0,
  endurance:       100,
  general:          0,
}

export function calculateCalorieTarget(tdee: number, goal: FitnessGoal, sex: Sex): number {
  const adjusted = tdee + GOAL_ADJUSTMENTS[goal]
  const minimum  = sex === 'male' ? 1500 : 1200
  return Math.max(minimum, Math.round(adjusted))
}

// ═══════════════════════════════════════════
// MACRONUTRIENT TARGETS
// ═══════════════════════════════════════════

const PROTEIN_RATIOS: Record<FitnessGoal, number> = {
  weight_loss:   1.8,   // g per kg bodyweight
  muscle_gain:   2.2,
  recomposition: 2.0,
  maintenance:   1.4,
  endurance:     1.6,
  general:       1.5,
}

export function calculateProteinTarget(weightKg: number, goal: FitnessGoal, activityLevel: ActivityLevel): number {
  const activityBonus = activityLevel === 'very_active' ? 0.2 : activityLevel === 'moderate' ? 0.1 : 0
  return Math.round(weightKg * ((PROTEIN_RATIOS[goal] ?? 1.5) + activityBonus))
}

export function calculateMacros(
  totalCalories: number,
  proteinGrams: number,
  goal: FitnessGoal
): { protein: number; carbs: number; fat: number } {
  const fatPct = goal === 'keto' ? 0.70 : 0.28
  const proteinCals = proteinGrams * 4
  const fatCals     = totalCalories * fatPct
  const carbCals    = totalCalories - proteinCals - fatCals
  return {
    protein: proteinGrams,
    fat:     Math.max(0, Math.round(fatCals / 9)),
    carbs:   Math.max(0, Math.round(carbCals / 4)),
  }
}

// ═══════════════════════════════════════════
// ONE REP MAX
// ═══════════════════════════════════════════

/** Brzycki Formula — more accurate for ≤10 reps */
export function calculateBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps >= 37) return weight  // formula breaks down at very high reps
  return weight * (36 / (37 - reps))
}

/** Epley Formula — more accurate for >10 reps */
export function calculateEpley(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/** Select best formula based on rep count */
export function calculate1RM(weight: number, reps: number): number {
  const result = reps <= 10 ? calculateBrzycki(weight, reps) : calculateEpley(weight, reps)
  return Math.round(result * 10) / 10
}

/** Estimate reps at a given % of 1RM */
export function estimateRepsAt(oneRM: number, targetWeight: number): number {
  const pct  = targetWeight / oneRM
  const reps = Math.round((1 - pct) * 30)
  return Math.max(1, Math.min(reps, 30))
}

/** Warm-up set progression */
export function calculateWarmupSets(workingWeight: number): { weight: number; reps: number; label: string }[] {
  return [
    { weight: 20,                      reps: 10, label: 'Empty bar' },
    { weight: Math.round(workingWeight * 0.4), reps: 8,  label: '40%' },
    { weight: Math.round(workingWeight * 0.6), reps: 5,  label: '60%' },
    { weight: Math.round(workingWeight * 0.8), reps: 3,  label: '80%' },
    { weight: Math.round(workingWeight * 0.9), reps: 1,  label: '90%' },
  ]
}

/** Plate calculator — returns plates per side for a given barbell weight */
export function calculatePlates(targetKg: number, barKg = 20): { weight: number; count: number }[] {
  const PLATE_WEIGHTS = [25, 20, 15, 10, 5, 2.5, 1.25]
  const remaining = (targetKg - barKg) / 2  // per side
  const plates: { weight: number; count: number }[] = []
  let leftover = remaining
  for (const plate of PLATE_WEIGHTS) {
    if (leftover <= 0) break
    const count = Math.floor(leftover / plate)
    if (count > 0) { plates.push({ weight: plate, count }); leftover -= count * plate }
  }
  return plates
}

// ═══════════════════════════════════════════
// BMI
// ═══════════════════════════════════════════

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely_obese'

export function getBMICategory(bmi: number, isAsian = false): BMICategory {
  const thresholds = isAsian
    ? { underweight: 18.5, normal: 23.0, overweight: 27.5, obese: 32.5 }
    : { underweight: 18.5, normal: 25.0, overweight: 30.0, obese: 35.0 }
  if (bmi < thresholds.underweight) return 'underweight'
  if (bmi < thresholds.normal)      return 'normal'
  if (bmi < thresholds.overweight)  return 'overweight'
  if (bmi < thresholds.obese)       return 'obese'
  return 'severely_obese'
}

export const BMI_CATEGORY_LABELS: Record<BMICategory, string> = {
  underweight:    'Underweight',
  normal:         'Healthy Weight',
  overweight:     'Overweight',
  obese:          'Obese',
  severely_obese: 'Severely Obese',
}

// ═══════════════════════════════════════════
// HYDRATION
// ═══════════════════════════════════════════

export function calculateWaterGoal(weightKg: number, activityLevel: ActivityLevel): number {
  const base = weightKg * 35  // 35ml per kg baseline
  const activityBonus: Record<ActivityLevel, number> = {
    sedentary:   0, light: 200, moderate: 400, very_active: 700
  }
  return Math.round(base + activityBonus[activityLevel])
}

// ═══════════════════════════════════════════
// CREATINE
// ═══════════════════════════════════════════

export function calculateCreatineDosage(weightKg: number, loadingPhase: boolean): {
  loadingDose: number    // g/day during loading (5–7 days)
  loadingDoses: number   // number of divided doses per day
  maintenanceDose: number  // g/day ongoing
} {
  const maintenance = Math.round(Math.max(3, Math.min(5, weightKg * 0.03)) * 10) / 10
  return {
    loadingDose:     loadingPhase ? 20 : 0,
    loadingDoses:    4,
    maintenanceDose: maintenance,
  }
}

// ═══════════════════════════════════════════
// WEIGHT LOSS PROJECTION (Hall NIH Model)
// ═══════════════════════════════════════════

/**
 * Simplified version of Kevin Hall's dynamic model
 * More accurate than the linear 3500 kcal/lb rule
 * Accounts for metabolic adaptation as weight decreases
 */
export function projectWeightLoss(
  currentWeightKg: number,
  dailyCalories: number,
  tdee: number,
  weeks: number
): number[] {
  const weights: number[] = [currentWeightKg]
  let weight = currentWeightKg
  const dailyDeficit = tdee - dailyCalories

  for (let week = 1; week <= weeks; week++) {
    // Metabolic adaptation factor (increases as more weight is lost)
    const lostSoFar   = currentWeightKg - weight
    const adaptation  = 1 - (lostSoFar / currentWeightKg) * 0.15  // 15% max adaptation
    const adjustedDeficit = dailyDeficit * adaptation
    // 7700 kcal per kg of fat (more accurate than 7716)
    const weeklyLossKg = (adjustedDeficit * 7) / 7700
    weight = Math.max(40, weight - weeklyLossKg)  // floor at 40kg
    weights.push(Math.round(weight * 10) / 10)
  }
  return weights
}

// ═══════════════════════════════════════════
// PROGRESS ANALYTICS
// ═══════════════════════════════════════════

export function calculateMovingAverage(
  data: { date: string; weight: number }[],
  windowDays = 7
): { date: string; weight: number }[] {
  return data.map((entry, i) => {
    const start  = Math.max(0, i - windowDays + 1)
    const window = data.slice(start, i + 1)
    const avg    = window.reduce((sum, d) => sum + d.weight, 0) / window.length
    return { date: entry.date, weight: Math.round(avg * 100) / 100 }
  })
}

/** Weekly rate of weight change (kg/week) */
export function calculateWeightRate(data: { date: string; weight: number }[]): number {
  if (data.length < 7) return 0
  const recent = data.slice(-7)
  const first  = recent[0].weight
  const last   = recent[recent.length - 1].weight
  return Math.round(((last - first) / (recent.length / 7)) * 100) / 100
}

// ═══════════════════════════════════════════
// HEART RATE ZONES
// ═══════════════════════════════════════════

export function calculateHRZones(age: number, restingHR: number = 60): {
  zone: number; name: string; min: number; max: number; color: string
}[] {
  const maxHR   = 220 - age
  const hrReserve = maxHR - restingHR

  const zones = [
    { zone: 1, name: 'Recovery',  pct: [0.50, 0.60], color: '#3b82f6' },
    { zone: 2, name: 'Aerobic',   pct: [0.60, 0.70], color: '#22c55e' },
    { zone: 3, name: 'Tempo',     pct: [0.70, 0.80], color: '#f59e0b' },
    { zone: 4, name: 'Threshold', pct: [0.80, 0.90], color: '#f97316' },
    { zone: 5, name: 'VO2 Max',   pct: [0.90, 1.00], color: '#ef4444' },
  ]

  return zones.map(z => ({
    zone:  z.zone,
    name:  z.name,
    color: z.color,
    min:   Math.round(restingHR + hrReserve * z.pct[0]),
    max:   Math.round(restingHR + hrReserve * z.pct[1]),
  }))
}

// ═══════════════════════════════════════════
// INTERMITTENT FASTING WINDOW
// ═══════════════════════════════════════════

export function calculateIFWindow(protocol: '16:8' | '18:6' | '20:4' | 'OMAD', firstMealHour: number): {
  fastStart: string; fastEnd: string; eatStart: string; eatEnd: string; fastHours: number; eatHours: number
} {
  const fastHours = { '16:8': 16, '18:6': 18, '20:4': 20, 'OMAD': 23 }[protocol]
  const eatHours  = 24 - fastHours
  const eatStartH = firstMealHour
  const eatEndH   = (eatStartH + eatHours) % 24
  const fastStart = eatEndH
  const fastEnd   = eatStartH

  const fmt = (h: number) => {
    const hour = h % 12 || 12
    const ampm = h < 12 || h === 24 ? 'AM' : 'PM'
    return `${hour}:00 ${ampm}`
  }

  return {
    fastStart: fmt(fastStart),
    fastEnd:   fmt(fastEnd),
    eatStart:  fmt(eatStartH),
    eatEnd:    fmt(eatEndH),
    fastHours,
    eatHours,
  }
}

// ═══════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════

export function kgToLbs(kg: number): number   { return Math.round(kg * 2.2046 * 10) / 10 }
export function lbsToKg(lbs: number): number  { return Math.round(lbs / 2.2046 * 10) / 10 }
export function cmToFtIn(cm: number): string  {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}
export function mlToOz(ml: number): number    { return Math.round(ml * 0.033814 * 10) / 10 }
export function ozToMl(oz: number): number    { return Math.round(oz / 0.033814) }
```

---

## 6. Mock Data Seeds

### `src/lib/foodDatabase.ts` — 60 items (excerpt — build all 60)

```typescript
import { FoodItem } from '@/types'

export const FOOD_DATABASE: FoodItem[] = [
  // ── Proteins ──
  { id: 'f001', name: 'Chicken Breast (grilled)', category: 'Protein', isVerified: true,
    servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6,
    sodium: 74, cholesterol: 85 },
  { id: 'f002', name: 'Salmon (baked)', category: 'Protein', isVerified: true,
    servingSize: 100, servingUnit: 'g', calories: 208, protein: 20, carbs: 0, fat: 13,
    sodium: 59, cholesterol: 63 },
  { id: 'f003', name: 'Whole Eggs', category: 'Protein', isVerified: true,
    servingSize: 100, servingUnit: 'g', calories: 155, protein: 13, carbs: 1.1, fat: 11,
    sodium: 124, cholesterol: 373 },
  { id: 'f004', name: 'Ground Beef (90% lean)', category: 'Protein', isVerified: true,
    servingSize: 100, servingUnit: 'g', calories: 176, protein: 20, carbs: 0, fat: 10,
    sodium: 72 },
  { id: 'f005', name: 'Canned Tuna (in water)', category: 'Protein', isVerified: true,
    servingSize: 85, servingUnit: 'g (1 can)', calories: 109, protein: 25, carbs: 0, fat: 1,
    sodium: 287 },
  { id: 'f006', name: 'Whey Protein Powder', category: 'Supplements', isVerified: true,
    servingSize: 30, servingUnit: 'g (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 2,
    sodium: 130 },
  { id: 'f007', name: 'Greek Yogurt (0% fat)', category: 'Dairy', isVerified: true,
    servingSize: 170, servingUnit: 'g (1 container)', calories: 100, protein: 17, carbs: 6, fat: 0.7,
    calcium: 187 },
  { id: 'f008', name: 'Cottage Cheese (1% fat)', category: 'Dairy', isVerified: true,
    servingSize: 113, servingUnit: 'g (½ cup)', calories: 81, protein: 14, carbs: 3, fat: 1.1,
    calcium: 68 },
  // ── Grains / Carbs ──
  { id: 'f009', name: 'Brown Rice (cooked)', category: 'Grains', isVerified: true,
    servingSize: 200, servingUnit: 'g (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8,
    fiber: 3.5 },
  { id: 'f010', name: 'White Rice (cooked)', category: 'Grains', isVerified: true,
    servingSize: 200, servingUnit: 'g (1 cup)', calories: 260, protein: 5.4, carbs: 57, fat: 0.4 },
  { id: 'f011', name: 'Oats (dry rolled)', category: 'Grains', isVerified: true,
    servingSize: 80, servingUnit: 'g (1 cup dry)', calories: 311, protein: 11, carbs: 54, fat: 5.3,
    fiber: 8 },
  { id: 'f012', name: 'Sweet Potato (baked)', category: 'Grains', isVerified: true,
    servingSize: 150, servingUnit: 'g (1 medium)', calories: 129, protein: 2.4, carbs: 30, fat: 0.2,
    fiber: 4.5 },
  { id: 'f013', name: 'Whole Wheat Bread', category: 'Grains', isVerified: true,
    servingSize: 28, servingUnit: 'g (1 slice)', calories: 69, protein: 3.6, carbs: 12, fat: 1.1,
    fiber: 1.9 },
  { id: 'f014', name: 'Pasta (cooked)', category: 'Grains', isVerified: true,
    servingSize: 200, servingUnit: 'g (1 cup cooked)', calories: 310, protein: 11, carbs: 61, fat: 1.3,
    fiber: 2.5 },
  { id: 'f015', name: 'Banana', category: 'Fruits', isVerified: true,
    servingSize: 120, servingUnit: 'g (1 medium)', calories: 107, protein: 1.3, carbs: 27, fat: 0.4,
    fiber: 3.1 },
  // ── Vegetables ──
  { id: 'f016', name: 'Broccoli (steamed)', category: 'Vegetables', isVerified: true,
    servingSize: 100, servingUnit: 'g (1 cup)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4,
    fiber: 2.6 },
  { id: 'f017', name: 'Spinach (raw)', category: 'Vegetables', isVerified: true,
    servingSize: 30, servingUnit: 'g (1 cup)', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1,
    iron: 0.8 },
  { id: 'f018', name: 'Mixed Green Salad', category: 'Vegetables', isVerified: true,
    servingSize: 100, servingUnit: 'g (2 cups)', calories: 20, protein: 1.5, carbs: 3.5, fat: 0.3,
    fiber: 2 },
  // ── Fats ──
  { id: 'f019', name: 'Almonds', category: 'Nuts', isVerified: true,
    servingSize: 28, servingUnit: 'g (1 oz / ~23)', calories: 164, protein: 6, carbs: 6, fat: 14,
    fiber: 3.5 },
  { id: 'f020', name: 'Avocado', category: 'Fats', isVerified: true,
    servingSize: 150, servingUnit: 'g (1 medium)', calories: 240, protein: 3, carbs: 13, fat: 22,
    fiber: 10 },
  { id: 'f021', name: 'Olive Oil', category: 'Fats', isVerified: true,
    servingSize: 14, servingUnit: 'g (1 tbsp)', calories: 119, protein: 0, carbs: 0, fat: 14 },
  { id: 'f022', name: 'Peanut Butter (natural)', category: 'Nuts', isVerified: true,
    servingSize: 32, servingUnit: 'g (2 tbsp)', calories: 190, protein: 8, carbs: 7, fat: 16,
    fiber: 2 },
  // ── Beverages ──
  { id: 'f023', name: 'Black Coffee', category: 'Beverages', isVerified: true,
    servingSize: 240, servingUnit: 'ml (1 cup)', calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { id: 'f024', name: 'Whole Milk', category: 'Beverages', isVerified: true,
    servingSize: 240, servingUnit: 'ml (1 cup)', calories: 149, protein: 8, carbs: 12, fat: 8,
    calcium: 276 },
  { id: 'f025', name: 'Chocolate Protein Shake', category: 'Beverages', isVerified: true,
    servingSize: 355, servingUnit: 'ml (1 bottle)', calories: 160, protein: 30, carbs: 8, fat: 2.5 },
  // ... continue to 60 items
]
```

### `src/lib/exerciseDatabase.ts` — 80 exercises (excerpt)

```typescript
import { Exercise } from '@/types'

export const EXERCISE_LIBRARY: Exercise[] = [
  // ── Compound: Lower Body ──
  { id: 'e001', name: 'Barbell Back Squat', difficulty: 'intermediate', movementPattern: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings'], secondaryGroups: ['core', 'calves'],
    equipment: ['barbell', 'rack'],
    instructions: ['Set the bar at shoulder height on the rack.', 'Step under the bar and place it across your upper traps.', 'Unrack the bar and step back with feet shoulder-width apart, toes slightly out.', 'Descend by pushing hips back and bending knees simultaneously.', 'Reach parallel (crease of hip below top of knee) or below.', 'Drive through heels to return to standing.'] },
  { id: 'e002', name: 'Romanian Deadlift', difficulty: 'intermediate', movementPattern: 'hinge',
    muscleGroups: ['hamstrings', 'glutes'], secondaryGroups: ['lats', 'core'],
    equipment: ['barbell', 'dumbbell'],
    instructions: ['Hold bar at hip height, feet hip-width.', 'Push hips back while lowering bar down legs.', 'Keep spine neutral throughout.', 'Stop when hamstrings are fully stretched (varies by flexibility).', 'Drive hips forward to return.'] },
  { id: 'e003', name: 'Leg Press', difficulty: 'beginner', movementPattern: 'squat',
    muscleGroups: ['quads', 'glutes'], secondaryGroups: ['hamstrings'],
    equipment: ['machine'],
    instructions: ['Sit in leg press machine with back flat against pad.', 'Place feet shoulder-width on platform.', 'Lower weight by bending knees to 90 degrees.', 'Press through heels to extend legs without locking out.'] },
  // ── Compound: Upper Push ──
  { id: 'e004', name: 'Bench Press (Barbell)', difficulty: 'intermediate', movementPattern: 'push',
    muscleGroups: ['chest', 'triceps'], secondaryGroups: ['shoulders'],
    equipment: ['barbell', 'bench'],
    instructions: ['Lie on bench with eyes under the bar.', 'Grip slightly wider than shoulder-width.', 'Unrack and lower to mid-chest with elbows at 45-75 degrees.', 'Press back to starting position.'] },
  { id: 'e005', name: 'Overhead Press (Barbell)', difficulty: 'intermediate', movementPattern: 'push',
    muscleGroups: ['shoulders', 'triceps'], secondaryGroups: ['core', 'traps'],
    equipment: ['barbell', 'rack'],
    instructions: ['Stand with bar at collarbone height.', 'Grip just outside shoulder width.', 'Press bar straight up overhead.', 'Lower back to starting position with control.'] },
  { id: 'e006', name: 'Dumbbell Incline Press', difficulty: 'beginner', movementPattern: 'push',
    muscleGroups: ['chest', 'triceps'], secondaryGroups: ['shoulders'],
    equipment: ['dumbbell', 'bench'],
    instructions: ['Set bench to 30-45 degrees incline.', 'Hold dumbbells at shoulder level.', 'Press up and slightly together.', 'Lower with control.'] },
  // ── Compound: Upper Pull ──
  { id: 'e007', name: 'Deadlift', difficulty: 'advanced', movementPattern: 'hinge',
    muscleGroups: ['hamstrings', 'glutes', 'back'], secondaryGroups: ['traps', 'core', 'forearms'],
    equipment: ['barbell'],
    instructions: ['Stand with bar over mid-foot.', 'Hinge to grip bar just outside legs.', 'Set back flat, chest up, bar in contact with shins.', 'Drive floor away to lift bar, keeping it close to body.', 'Lock hips and knees at top.', 'Lower with control.'] },
  { id: 'e008', name: 'Pull-Up', difficulty: 'intermediate', movementPattern: 'pull',
    muscleGroups: ['lats', 'biceps'], secondaryGroups: ['shoulders', 'core'],
    equipment: ['pull_up_bar'],
    instructions: ['Hang from bar with overhand grip slightly wider than shoulder-width.', 'Pull chest to bar by driving elbows down.', 'Lower fully to dead hang.'] },
  { id: 'e009', name: 'Barbell Row', difficulty: 'intermediate', movementPattern: 'pull',
    muscleGroups: ['lats', 'back'], secondaryGroups: ['biceps', 'traps'],
    equipment: ['barbell'],
    instructions: ['Hinge to 45 degrees with bar hanging.', 'Pull bar to lower chest/upper abdomen.', 'Lower with control.'] },
  { id: 'e010', name: 'Lat Pulldown', difficulty: 'beginner', movementPattern: 'pull',
    muscleGroups: ['lats', 'biceps'], secondaryGroups: ['shoulders'],
    equipment: ['cable', 'machine'],
    instructions: ['Sit at cable machine with thighs under pad.', 'Grip bar wider than shoulder-width.', 'Pull bar to upper chest.', 'Control the return.'] },
  // ── Isolation: Arms ──
  { id: 'e011', name: 'Barbell Curl', difficulty: 'beginner', movementPattern: 'isolation',
    muscleGroups: ['biceps'], secondaryGroups: ['forearms'],
    equipment: ['barbell'],
    instructions: ['Stand with bar at arms length.', 'Curl bar to shoulder height, keeping elbows fixed.', 'Lower with control.'] },
  { id: 'e012', name: 'Tricep Pushdown (Cable)', difficulty: 'beginner', movementPattern: 'isolation',
    muscleGroups: ['triceps'],
    equipment: ['cable'],
    instructions: ['Set cable pulley high with rope attachment.', 'Push rope down until arms are fully extended.', 'Return with control.'] },
  // ── Core ──
  { id: 'e013', name: 'Plank', difficulty: 'beginner', movementPattern: 'core',
    muscleGroups: ['core'],
    equipment: ['bodyweight'],
    instructions: ['Hold push-up position with forearms on ground.', 'Keep body in straight line from head to heels.', 'Hold for time.'] },
  { id: 'e014', name: 'Hanging Leg Raise', difficulty: 'intermediate', movementPattern: 'core',
    muscleGroups: ['core'], secondaryGroups: ['forearms'],
    equipment: ['pull_up_bar'],
    instructions: ['Hang from bar.', 'Raise legs to 90 degrees (bent-knee easier, straight harder).', 'Lower with control.'] },
  // ── Cardio ──
  { id: 'e015', name: 'Treadmill Run', difficulty: 'beginner', movementPattern: 'cardio',
    muscleGroups: ['cardio'], equipment: ['machine'],
    instructions: ['Set treadmill speed and incline.', 'Run for target time or distance.'] },
  // ... continue to 80 exercises
]
```

### `src/lib/mockData.ts` — Seed data for stores

```typescript
// Seed data for immediate population of all stores on first load
// This ensures no empty states on first launch

import { format, subDays } from 'date-fns'
import { MealEntry, WorkoutSession, HydrationDay, WeightEntry } from '@/types'
import { FOOD_DATABASE } from './foodDatabase'
import { EXERCISE_LIBRARY } from './exerciseDatabase'

// Today's food entries (seed the diary with 3 meals)
export const SEED_FOOD_ENTRIES: MealEntry[] = [
  {
    id: 'seed_e1', mealSlot: 'breakfast',
    foodItemId: 'f011', foodItem: FOOD_DATABASE.find(f => f.id === 'f011')!,
    quantity: 1, loggedAt: new Date().toISOString(),
  },
  {
    id: 'seed_e2', mealSlot: 'breakfast',
    foodItemId: 'f003', foodItem: FOOD_DATABASE.find(f => f.id === 'f003')!,
    quantity: 2, loggedAt: new Date().toISOString(),
  },
  {
    id: 'seed_e3', mealSlot: 'lunch',
    foodItemId: 'f001', foodItem: FOOD_DATABASE.find(f => f.id === 'f001')!,
    quantity: 2, loggedAt: new Date().toISOString(),
  },
  {
    id: 'seed_e4', mealSlot: 'lunch',
    foodItemId: 'f009', foodItem: FOOD_DATABASE.find(f => f.id === 'f009')!,
    quantity: 1, loggedAt: new Date().toISOString(),
  },
  {
    id: 'seed_e5', mealSlot: 'lunch',
    foodItemId: 'f016', foodItem: FOOD_DATABASE.find(f => f.id === 'f016')!,
    quantity: 1.5, loggedAt: new Date().toISOString(),
  },
]

// Past 30 days of weight entries for the progress chart
export const SEED_WEIGHT_LOG: WeightEntry[] = Array.from({ length: 30 }, (_, i) => ({
  date:   format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
  weight: 76.2 - (i * 0.08) + (Math.random() * 0.6 - 0.3),  // gradual downtrend with noise
})).map(e => ({ ...e, weight: Math.round(e.weight * 10) / 10 }))

// Seeded workout sessions (past 10 days)
export const SEED_WORKOUT_SESSIONS: WorkoutSession[] = [
  {
    id: 'ws_seed_1',
    name: 'Upper Body Strength',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: subDays(new Date(), 1).toISOString(),
    duration: 62,
    isCompleted: true,
    isTemplate: false,
    totalVolume: 14240,
    exercises: [
      {
        id: 'el_1', exerciseId: 'e004',
        exercise: EXERCISE_LIBRARY.find(e => e.id === 'e004')!,
        isSuperset: false,
        sets: [
          { id: 's1', setNumber: 1, weight: 60,  reps: 10, setType: 'warmup',  completed: true },
          { id: 's2', setNumber: 2, weight: 80,  reps: 8,  setType: 'working', completed: true },
          { id: 's3', setNumber: 3, weight: 80,  reps: 8,  setType: 'working', completed: true },
          { id: 's4', setNumber: 4, weight: 82.5,reps: 7,  setType: 'working', completed: true },
        ]
      },
      {
        id: 'el_2', exerciseId: 'e008',
        exercise: EXERCISE_LIBRARY.find(e => e.id === 'e008')!,
        isSuperset: false,
        sets: [
          { id: 's5', setNumber: 1, weight: 0, reps: 10, setType: 'working', completed: true },
          { id: 's6', setNumber: 2, weight: 0, reps: 9,  setType: 'working', completed: true },
          { id: 's7', setNumber: 3, weight: 0, reps: 8,  setType: 'working', completed: true },
        ]
      }
    ]
  },
  // ... 4–5 more sessions
]

// Seeded routines
export const SEED_ROUTINES = [
  {
    id: 'r001', name: 'Push Day', description: 'Chest, Shoulders, Triceps',
    exercises: [
      { exerciseId: 'e004', targetSets: 4, targetReps: '8', restSeconds: 180 },
      { exerciseId: 'e005', targetSets: 3, targetReps: '8', restSeconds: 180 },
      { exerciseId: 'e006', targetSets: 3, targetReps: '10-12', restSeconds: 120 },
      { exerciseId: 'e012', targetSets: 3, targetReps: '12-15', restSeconds: 90 },
    ],
    scheduledDays: [1, 4]  // Monday, Thursday
  },
  {
    id: 'r002', name: 'Pull Day', description: 'Back, Biceps',
    exercises: [
      { exerciseId: 'e007', targetSets: 4, targetReps: '5', restSeconds: 240 },
      { exerciseId: 'e008', targetSets: 3, targetReps: '6-10', restSeconds: 180 },
      { exerciseId: 'e009', targetSets: 3, targetReps: '8-10', restSeconds: 150 },
      { exerciseId: 'e011', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
    ],
    scheduledDays: [2, 5]  // Tuesday, Friday
  },
  // ... Leg Day, Full Body, etc.
]

// 7-day hydration seed
export const SEED_HYDRATION: Record<string, HydrationDay> = Object.fromEntries(
  Array.from({ length: 7 }, (_, i) => {
    const date  = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const total = 1600 + Math.round(Math.random() * 1200)
    return [date, { date, entries: [], goalMl: 2500, totalHydrationMl: total, totalCaffeineMg: 180 }]
  })
)
```

---

## 7. Page Specifications

### 7.1 Onboarding Page (`/onboarding`) — 8 Steps

**State management:**
- Local `useState` for current step (0–7)
- Local `useState` for accumulated form data
- On final step completion → call `useUserStore.completeOnboarding()`

**Step components:**
Each step is a separate component receiving `onNext(data)` and `onBack()` callbacks.

Steps:
1. `WelcomeStep` — Name input
2. `BiometricsStep` — Sex toggle, Age stepper, Height/Weight sliders
3. `GoalStep` — 6 goal cards (multi-select behavior: only one selected)
4. `ActivityStep` — 4 activity level cards
5. `TrainingStep` — Exercise preference chips (multi-select) + weekly frequency
6. `DietStep` — 6 dietary preference cards
7. `ResultsStep` — Show calculated BMR/TDEE/targets in stat cards (no form inputs)
8. `CompleteStep` — Celebration + CTA

**Progress bar (top):**
- Width: `(currentStep / 7) * 100%`
- Green fill, animated with CSS transition

**Back/Next controls:**
- Back button: ghost, disabled on step 0
- Next button: primary, "Get Started" on last step
- Both: 44px height, `rounded-xl`

### 7.2 Dashboard (`/`) — Full Specification

**Data dependencies:**
```typescript
const { user }         = useUserStore()
const { getTodayMacros, getTodayLog } = useNutritionStore()
const { getHydrationPercent, getToday: getTodayWater } = useHydrationStore()
const { sessions, getWorkoutStreak }  = useWorkoutStore()
```

**Metric card data mapping:**
- Weight balance: `user.currentWeight` kg | trend: from last 7 days weight log
- Heart rate: static mock "90 bpm" for MVP (no wearable integration)
- Hydration level: `getHydrationPercent()`% | trend from yesterday
- Calories: `getTodayMacros().calories` kcal

**Macro ring data:**
```typescript
const macros = getTodayMacros()
const calPct  = (macros.calories / user.dailyCalorieTarget) * 100
const protPct = (macros.protein  / user.proteinTarget) * 100
const carbPct = (macros.carbs    / user.carbTarget) * 100
```

**Recommended Activity:**
- Source: SEED_ROUTINES + next scheduled workout from today's plan
- First 4 items shown, with "See More" link to `/workouts`

**Trainer Carousel:**
- Source: `useCoachingStore().coaches.slice(0, 5)`

### 7.3 Nutrition Page (`/nutrition`) — Full Specification

**Tab bar:** Diary | Macros | Meal Planner

**Diary tab:**
- Top: `CalendarStrip` — 7-day strip, today highlighted
- Middle: `MacroSummaryBar` — 4 macro pills with progress bars
- Below: One `MealSection` per meal slot (6 total)
- Bottom: Fixed `AddFoodFAB` button (+ Add Food)

**Macros tab:**
- `MacroRingCard` (full-width)
- `MacroBarChart` — 14-day history
- `MicronutrientTable` — daily vs. target

**Add Food flow:**
1. Tap "+ Add Food" in any meal section
2. `FoodSearchSheet` slides up from bottom
3. Search or browse food
4. Select food → `FoodDetailModal` with serving size + qty controls
5. Confirm → added to diary → sheet closes → macro bar updates

### 7.4 Workouts Page (`/workouts`) — Full Specification

**Default view:** Schedule (matches Image 2 mobile, calendar strip view desktop)

**Tab bar (desktop only):** Schedule | Library | Programs | My Progress

**Schedule view:**
- `CalendarStrip` at top (same component as nutrition page)
- Date label below calendar
- `TimeSlotList` component (matches Image 2 exactly)
  - If workout scheduled → `WorkoutCard`
  - If empty → "No Schedule" text
- Empty state for entire day → `WorkoutEmptyState` (matches Image 2 right phone exactly)
- CTA "Start Workout" → navigates to `/workouts/log` 
- CTA "Browse Workouts" → shows exercise library

**Active Workout Session (`/workouts/log`):**

Header:
- Back arrow | "Active Workout" | "Finish" primary button
- Live elapsed timer (updates every second via `useTimer` hook)
- Volume counter

Exercise log list:
- One `ExerciseCard` per exercise
- Each has: name, muscle groups, previous session note, `SetTable`

`SetTable` columns: Set # | Previous | Weight | Reps | RPE | Type | ✓

`RestTimer` component:
- Appears after tapping ✓ on any set
- Countdown from configurable rest time
- Framer Motion slide-in from right
- "-15s" and "+15s" adjustment buttons

Bottom of screen: "+ Add Exercise" dashed card

Finish workout:
- Confirm sheet: summary stats + "Save" + "Discard"
- On save: `useWorkoutStore.endWorkout()` + toast notification + navigate to `/progress`

### 7.5 Hydration Page (`/hydration`)

**Top section:**
- `HydrationRing` SVG — 200px, animated to current %
- "X ml of Y ml" text below ring
- Streak badge: "🔥 X Day Streak"

**Quick add:**
- `QuickAddButtons` — 4 pre-set amounts (150 / 250 / 350 / 500ml)
- Each button has `+` icon and ml amount
- Tap → calls `useHydrationStore.addDrink('water', ml)`
- Ring animates to new value on tap

**Drink type selector:**
- Horizontal scroll of 7 drink type chips
- Active type shown with border + hydration coefficient

**Today's log:**
- Scrollable list of entries
- Each: time | drink icon | label | amount
- Swipe left to delete (mobile) / hover delete button (desktop)

**7-day chart:**
- `HydrationChart` — Recharts BarChart
- Each bar colored by % of goal (green/amber/red)

### 7.6 Calculators Hub (`/calculators`)

**Layout:** Grid of `CalculatorCard` components — 2 cols mobile, 4 cols desktop

**Each card:** Icon | Name | 1-line description | "Calculate →" button

**15 calculator cards:**
BMI · Protein · Calorie Deficit · Creatine · Macros · TDEE · Body Fat · 1RM · VO2 Max · Hydration · IF Window · Reverse Diet · Ideal Weight · Heart Rate Zones · Calories Burned

**Calculator pages (each follows same 3-section layout):**
1. Form section (inputs)
2. "Calculate" primary button
3. Results section (slides in on calculation, hidden until first calculation)

**BMI Calculator — exact result display:**
```
[BMI Gauge: horizontal colored scale with needle marker]
BMI Value: [large number]  [category badge]
[Explanation paragraph]
[Risk level indicator]
[Recommended calorie range]
```

**Protein Calculator — stepped form (5 steps like onboarding)**

**Creatine Calculator — form + two result cards:**
- Loading Phase card (if selected)
- Maintenance Phase card

**Calorie Deficit Calculator — table + chart:**
- Table: 8 rows × 3 columns (intake / time / rate)
- Chart: `AreaChart` with weight projection (Hall model)

### 7.7 Timer Hub (`/timers`)

**Mode selector:** Horizontal chip scroll — 8 modes

**Active timer view:**
```
[Mode name — overline label]
[Round indicator: Round 3/8]
[SVG circular countdown ring — large, full screen width on mobile]
  [Large time number in center — JetBrains Mono]
  [Interval type label — WORK / REST]
[Controls: ⏮ Restart  ▶/⏸ Play/Pause  ⏭ Skip]
```

**Tabata preset (active by default):**
- 20s work / 10s rest × 8 rounds
- Pre-configured in `useTimerStore`
- Ring color: green during work, gray/muted during rest

**Custom builder:**
- Hidden by default, shown when "Custom" mode selected
- `CustomTimerBuilder` component:
  - List of intervals (drag to reorder on desktop)
  - "+ Add Interval" button
  - Each interval: name input | duration (mm:ss) | type select | color picker
  - Rounds input
  - "Start" button → loads config into timer

**Pre-built templates (card grid):**
- 6 template cards with "Use This" button
- Templates: Tabata Classic / 30:30 HIIT / 45:15 Strength / EMOM 10min / Boxing 3min / Yoga Flow

### 7.8 Progress Analytics (`/progress`)

**Tab bar:** Weight · Measurements · Strength · Nutrition · Photos

**Weight tab:**
```
[Quick add weight: input + date + "Log" button]
[ComposedChart: Scatter (raw) + Line (7d moving avg) + goal line]
[Stats row: Starting → Current → Goal → Rate/Week]
[Projected reach date: "At this rate, goal by June 12"]
```

**Strength tab:**
```
[Exercise dropdown selector]
[1RM progression LineChart]
[Volume BarChart (weekly)]
[PR table: 5 most recent PRs with trophy icons]
```

**Measurements tab:**
```
[Add measurements modal trigger button]
[SVG body silhouette with labeled arrows]
[Mini sparkline charts for each measurement in a grid]
```

**Nutrition tab:**
```
[14-day calorie BarChart (green/red by goal)]
[Macro consistency: "Hit protein goal X/14 days" + calendar dots]
[Donut chart: average macro split]
```

**Photos tab:**
```
[Upload placeholder button]
[Photo grid: date-grouped]
[Compare mode: side-by-side two photos]
```

### 7.9 Coaching Discovery (`/coaching`) — Image 3 Layout

**Layout:** Three-column grid (desktop) / single column (mobile)
Uses `CoachingLayout` component which wraps in the Image 3 structure.

**Top nav:** CoachTopNav component (replaces standard TopBar on this page for desktop)

**Left column content:**
1. `AIAssistantCard` — "Hey, Need help?" with bot icon + input field
2. "Suggest Workout" green CTA card
3. `BodyAreaBrowser` — 4 muscle area chips with SVG muscle diagrams
4. Mini daily schedule (last 3 items from today's schedule)

**Center column content:**
1. `TrendingWorkouts` — horizontal scroll of workout cards
2. Featured workout — full-width large card
3. "Short Workouts" section header + grid
4. "My Active Workout" — list with % complete progress bars

**Right column content:**
1. `StreakPanel` — "3 day streak this week!" + week dot grid + longest streak
2. "You are on fire!" motivation text
3. `NutritionHistoryPanel` — last 3 meals with macro chips
4. "Average Calories Consumed" — large number + mini BarChart (5 days)

### 7.10 Community Feed (`/community`)

**Layout:**
- Mobile: single column feed
- Desktop: 3-col (trending topics sidebar | feed | challenges sidebar)

**Feed post types:**
- `WorkoutPost` — completed workout card with stats
- `MealPost` — food log share with macro breakdown
- `ProgressPost` — milestone with optional photo
- `PRPost` — personal record celebration with trophy
- `TextPost` — text-only update

**Post actions:** Like (heart) | Comment | Share | Save

**Challenges section:**
- Challenge cards grid
- Each: name, type badge, participants count, dates, "Join" button

### 7.11 Settings Page (`/settings`)

**Sidebar navigation (desktop) / Accordion (mobile):**
Profile · Goals · Notifications · Appearance · Privacy · Support

**Profile section:**
- Avatar uploader (circular)
- Name, email, bio
- Height, weight, age (with unit toggle)
- "Recalculate my targets" button

**Goals section:**
- Calorie goal input
- Protein/carbs/fat: toggle between grams and % mode
- Water goal slider
- Weekly workout target

**Appearance section:**
- Theme: Light / Dark / System (3 radio cards with preview thumbnails)
- Unit system: Metric / Imperial
- Font size: Default / Large

**Notifications section:**
- Toggle list per notification type
- Meal time pickers (when reminders enabled)

### 7.12 Coach Dashboard (`/coach`)

**Coach-side navigation shell:**
- Top horizontal nav (wider than coaching discover)
- Links: Dashboard · Clients · Programs · Content · Analytics · Live

**Dashboard home:**
- 4 revenue metric cards: Monthly Revenue | Active Clients | Subscribers | Programs Sold
- Recent client activity feed (right panel on desktop)
- Upcoming sessions list

**Clients page (`/coach/clients`):**
- Table with: Avatar + Name | Goal | Last Active | Compliance % | Weight trend | View button
- Click → per-client detail page with all logged data

**Content page (`/coach/content`):**
- Post composer (rich text area + media upload zone)
- Post type selector tabs
- Audience selector
- Content calendar (published + scheduled posts)

---

## 8. Component Specifications

### 8.1 AppShell (`layout.tsx` in dashboard route group)

```typescript
// Renders the full desktop layout:
// [Sidebar | Main Content]
// On mobile renders:
// [TopBar | Page Content | Bottom Nav]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  return (
    <div className="flex h-screen bg-[var(--bg-base)]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      </div>
      
      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        <DesktopTopBar />
        <div className="md:hidden">
          <TopBar />
        </div>
        {children}
      </main>
      
      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <MobileNav />
      </div>
    </div>
  )
}
```

### 8.2 MetricCard Component

```typescript
interface MetricCardProps {
  title:       string
  value:       string | number
  unit:        string
  trend?:      number           // positive = good, negative = bad
  trendLabel?: string           // "0.22%"
  icon:        React.ReactNode
  className?:  string
}

// Renders exactly as Image 1 metric cards:
// - rounded-2xl card
// - title top-left
// - icon top-right (in bg-elevated square)
// - value + unit center
// - trend bottom-right (green if positive, red if negative)
```

### 8.3 MacroSummaryBar Component

```typescript
interface MacroSummaryBarProps {
  calories:    { current: number; goal: number }
  protein:     { current: number; goal: number }
  carbs:       { current: number; goal: number }
  fat:         { current: number; goal: number }
}

// Renders 4 macro pills horizontally
// Each pill: icon + "X / Yg" text + thin progress bar below
// Colors: green (calories) | blue (protein) | amber (carbs) | red (fat)
```

### 8.4 ProgressRing Component (SVG)

```typescript
interface ProgressRingProps {
  progress:       number       // 0–100
  size?:          number       // SVG px (default 160)
  strokeWidth?:   number       // ring thickness (default 8)
  color?:         string       // stroke color (default var(--accent))
  trackColor?:    string       // (default var(--border-subtle))
  label?:         string       // center main text
  sublabel?:      string       // center secondary text
  animate?:       boolean      // animate on mount (default true)
}
```

### 8.5 CalendarStrip Component

```typescript
interface CalendarStripProps {
  selectedDate:   Date
  onDateSelect:   (date: Date) => void
  markedDates?:   string[]     // YYYY-MM-DD strings with workout/food logged
  variant?:       'gradient' | 'plain'  
  // gradient: Image 2 dark teal header style
  // plain: standard --bg-base background
}
```

### 8.6 WorkoutCard Component

```typescript
interface WorkoutCardProps {
  name:        string
  category:    string
  duration:    number          // minutes
  calories?:   number
  difficulty:  Difficulty
  coachName?:  string
  score?:      number
  coverGradient?: string       // CSS gradient string
  onBookmark?: () => void
  isBookmarked?: boolean
  onClick?:    () => void
}
// Renders exactly as Image 3 workout cards:
// Cover gradient bg | Difficulty badge TL | Bookmark TR
// Name | Coach row | Stats row (kcal + min + score)
```

### 8.7 RestTimer Component

```typescript
interface RestTimerProps {
  initialSeconds: number       // configurable per exercise
  onComplete:     () => void
  onSkip:         () => void
  onAdjust:       (delta: number) => void  // +15 or -15
}
// Green countdown bar depleting horizontally
// Large countdown number
// -15 | countdown | +15 buttons
// Skip link
// Framer Motion: slides in from right on mount, slides out on complete
```

---

## 9. API Routes (MVP Stubs)

All are stubbed — return mock data. Ready to replace with real API calls.

```
POST   /api/auth/login          → mock login
POST   /api/auth/register       → mock register
GET    /api/user/profile        → return from store
PUT    /api/user/profile        → update store

GET    /api/nutrition/foods     → search FOOD_DATABASE
POST   /api/nutrition/log       → add to nutrition store
DELETE /api/nutrition/log/[id]  → remove from store

GET    /api/workouts/sessions   → from workout store
POST   /api/workouts/sessions   → create new session

GET    /api/coaching/coaches    → MOCK_COACHES array
GET    /api/coaching/posts      → MOCK_POSTS array

POST   /api/ai/food-scan        → return mock recognized foods
POST   /api/ai/voice-log        → return mock parsed food entry
```

---

## 10. Routing & Navigation Logic

### Route Groups

```
(auth) routes:    /login, /register, /onboarding
                  No sidebar/nav shell
                  Redirect to / if already authenticated

(dashboard) routes: /
                    All have AppShell (sidebar + mobile nav)
                    Redirect to /login if not authenticated

/coach routes:    /coach, /coach/clients, etc.
                  Coach-specific shell
                  Only accessible if user.isCoach === true
```

### Navigation Guard

```typescript
// In app/(dashboard)/layout.tsx:
'use client'
import { useUserStore } from '@/store/useUserStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const { isAuthenticated, user } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    else if (isAuthenticated && !user?.onboardingComplete) router.push('/onboarding')
  }, [isAuthenticated, user])

  if (!isAuthenticated) return null
  return <AppShell>{children}</AppShell>
}
```

### Active Nav State

```typescript
// In Sidebar.tsx and MobileNav.tsx:
import { usePathname } from 'next/navigation'

const pathname = usePathname()
const isActive = (href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)
```

---

## 11. Authentication Flow (Mock MVP)

```typescript
// Mock login: any email + "password" → succeeds
// Creates a mock user from MOCK_USER_PROFILE
// Stores in Zustand (persisted to localStorage)

// Mock register: any values → creates user + redirects to onboarding

// Session persistence: Zustand persist middleware
// Clears on: logout action, localStorage.clear()

// For demo: auto-login with mock user is acceptable
// Include a "Demo Mode" button on login page
```

---

## 12. Performance Requirements

### Bundle Size Targets
- Initial JS bundle: < 200KB gzipped
- First Contentful Paint: < 1.5s on 3G
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### Optimization Techniques

```typescript
// 1. Dynamic imports for heavy components
const Recharts = dynamic(() => import('recharts'), { ssr: false })
const IntervalTimer = dynamic(() => import('@/components/timers/IntervalTimer'))

// 2. Route-level code splitting (automatic with App Router)

// 3. Image optimization (next/image for all images)

// 4. Virtualization for long lists (exercise library 80+ items)
// Use react-virtual or manual windowing

// 5. Memo for expensive components
const WorkoutCard = memo(({ ... }) => { ... })

// 6. Debounce food search (300ms)
const debouncedSearch = useDebouncedCallback((query) => {
  setResults(searchFoods(query))
}, 300)
```

---

## 13. Complete AI Code Generator Prompt

---

**Copy everything below and paste into your AI code generator (Cursor, v0.dev, GitHub Copilot, or Claude):**

---

You are a **Senior Lead Full-Stack Engineer and UI/UX Expert**. Build **SuperFit** — a complete, production-quality SaaS fitness web application MVP. Follow these specifications exactly. Do not simplify. Build every feature listed. No shortcuts.

## TECH STACK (exact)
- **Framework:** Next.js 14 App Router, TypeScript, strict mode
- **Styling:** Tailwind CSS + shadcn/ui (base color: Neutral, CSS variables: yes)
- **State:** Zustand with persist middleware (all data — no backend)
- **Animation:** Framer Motion 11
- **Charts:** Recharts 2
- **Icons:** Lucide React (only — no mixing)
- **Fonts:** DM Sans (display/headings) + Inter (body/UI) + JetBrains Mono (timers)
- **Other:** next-themes, sonner (toasts), react-hook-form + zod, date-fns

## DESIGN — ONE UNIFIED SYSTEM

Follow the SuperFit Design System exactly:

**Color Palette (dark mode — default):**
```
--bg-base:       #0a0a0a  (page bg)
--bg-surface:    #111111  (all cards)
--bg-elevated:   #1a1a1a  (hover, dropdown)
--bg-overlay:    rgba(0,0,0,0.72)
--border-subtle: #1f1f1f  (card borders)
--border-default:#2a2a2a  (forms)
--text-primary:  #fafafa
--text-secondary:#a3a3a3
--text-tertiary: #525252
--accent:        #22c55e  (green — progress, CTAs, active states)
--accent-bg:     rgba(34,197,94,0.10)
--chart-green:   #22c55e
--chart-blue:    #60a5fa
--chart-amber:   #fbbf24
--chart-red:     #f87171
--chart-purple:  #c084fc  (heart rate)
```

**Light mode counterparts:**
```
--bg-base: #ffffff  --bg-surface: #f9f9f9  --accent: #16a34a
--text-primary: #0a0a0a  --text-secondary: #4b5563
--border-subtle: #e5e7eb  --border-default: #d1d5db
```

**Typography:**
- Headings + metric values: DM Sans (700–800)
- UI text + body: Inter (400–600)
- Timers + numbers: JetBrains Mono

## DESKTOP LAYOUT — IMAGE 1 (Dark Dashboard)
This is the exact layout to implement for ALL desktop views:

```
[SIDEBAR 240px fixed] + [MAIN CONTENT margin-left:240px]
```

**Sidebar (Image 1 exact):**
- `#0f0f0f` background with `#1a1a1a` border-right
- Header: "SF" green icon (32px) + "SuperFit" DM Sans 700 18px
- User block: 36px avatar + name (Inter 500 14px) + @username + PRO badge
- Nav items: 44px tall, 8px margin horizontal, 10px border-radius
- Active: `#1a1a1a` bg + green icon (`#22c55e`) + white label
- Community card pinned at bottom
- Collapse button (chevron) that animates sidebar to 64px

**Main content TopBar (Image 1 exact):**
- 64px height, sticky, `#0a0a0a` bg
- Left: "Good morning" (13px gray) / "Welcome Back!" (DM Sans 600 20px)
- Right: Search · Message · Bell (with badge "2") · Settings · Theme toggle
- All icons: 40×40 rounded-full hit areas, 20px icons

**Dashboard grid (Image 1 exact):**
Row 1: 4 metric cards (flex, equal width, 90px height, 16px gap)
  - Weight 73kg | Heart Rate 90bpm | Hydration 86% | Calories 1100ul
  - Each: `#111111` bg, `#1f1f1f` border, `rounded-2xl`, value in DM Sans 700 28px
  - Trend indicator bottom-right (green ↑ or red ↓)
  - Icon in `#1a1a1a` square, absolute top-right

Row 2: 2-column grid, gap 16px (1.2fr : 1fr)
  - Macro Ring card (left): SVG ring with 3 arcs + legend + "View full details"
  - Heart Rate chart (right): Recharts AreaChart (purple line/fill) + Core Strength metrics

Row 3: 2-column grid, gap 16px (1.2fr : 1fr)
  - Recommended Activity list (left): rows with icon, name, date, time, price, 3-dot menu
  - Fitness Goal Building (right): 3 goal rows with arc progress

Row 4: Full-width Trainer carousel
  - Horizontal scroll of 120×150px trainer cards with photo, gradient overlay, name, role

## MOBILE LAYOUT — IMAGE 2 (Workout Schedule)
This is the exact layout to implement for ALL mobile views:

```
[TOPBAR 60px sticky] + [SCROLLABLE CONTENT] + [BOTTOM NAV 64px fixed]
```

**TopBar (Image 2 exact):**
- 60px height, `#0a0a0a` bg, `#1f1f1f` border-bottom
- 40px back/menu button left | title center (DM Sans 600 17px) | action icons right

**Calendar Strip (workout pages — Image 2 exact):**
- Dark teal gradient header: `linear-gradient(135deg, #0f4c3a, #1a6b52, #0d4a36)`
- Month nav: ChevronLeft · "February 2022" (DM Sans 500 15px) · ChevronRight
- Day chips: 40×52px, `rounded-2xl`
  - Inactive: transparent, white text 70% opacity
  - Active: `#22c55e` fill OR green circle, white DM Sans 700
  - Workout dots: 4px green circle below date

**Time-slot list (Image 2 left phone exact):**
- Grid: [48px time col] [1px line] [workout card]
- Time: Inter 400 12px `--text-tertiary`, right-aligned
- Workout card: `#111111` bg, `#1f1f1f` border, `rounded-xl`, 12px padding
  - 40px thumbnail + name (Inter 600 14px) + badges row + edit icon
  - Intensity badges: "🔥 Intense" green | "⚡ Moderate" amber | "💧 Light" blue

**Empty state (Image 2 right phone exact):**
- Date label (DM Sans 600 18px)
- Equipment illustration (180px)
- "You don't have any active workout for today."
- "Let's log your first meal today and get insights."
- "Explore Workouts +" button: `#22c55e` bg, `rounded-2xl`, 52px height, full width

**Bottom tab nav:**
- `#111111` bg, `#1f1f1f` top border, 64px height
- 5 tabs: Home | Nutrition | [+ Log center raised button] | Progress | Profile
- Active: `#22c55e` icon + label + 4px dot
- Center button: 52px circle, `#22c55e` bg, 10px raised, green glow shadow, 3px white border

## BUILD THESE 13 PAGES (ALL COMPLETE):

### 1. Onboarding (`/onboarding`) — 8 steps
Animated multi-step form. Steps: Name → Biometrics → Goal (6 cards) → Activity (4 cards) → Training prefs → Diet (6 cards) → Results preview (calculated targets) → Celebration. Green progress bar top. Back/Next controls.

### 2. Dashboard (`/`) — Image 1 exact
4 metric cards + Macro ring + Heart rate chart + Activity list + Goal building + Trainer carousel. All data from Zustand stores. Number count-up animations on mount.

### 3. Nutrition (`/nutrition`) — Food diary
CalendarStrip + MacroSummaryBar + 6 MealSections (accordion). FoodSearchSheet (bottom sheet mobile / modal desktop) with search + barcode + AI snap + voice tabs. Full macro update on every food addition.

### 4. Workout Schedule (`/workouts`) — Image 2 exact
CalendarStrip (gradient header on mobile) + TimeSlotList + Empty state. WorkoutCard components matching Image 2. "Explore Workouts +" CTA.

### 5. Active Workout (`/workouts/log`)
Live timer. ExerciseCards with SetTable (weight/reps/RPE/type/✓). RestTimer slides in after set completion. "+ Add Exercise" at bottom. Finish → summary sheet.

### 6. Hydration (`/hydration`)
Large animated SVG ring. QuickAddButtons (150/250/350/500ml). DrinkTypeSelector chips. Today's log list (swipe to delete). 7-day BarChart (green/amber/red). Streak badge.

### 7. Calculators (`/calculators`)
Hub grid of 15 calculator cards. Build these 5 IN FULL:
- BMI: form → gauge chart + category badge
- Protein: 5-step form → macro breakdown
- Creatine: form → loading + maintenance dose cards
- Calorie Deficit: form → table + weight projection chart (Hall model)
- 1RM: weight + reps → estimated 1RM + rep range table

### 8. Timer Hub (`/timers`)
Mode selector chips. Large SVG ring timer (JetBrains Mono, green during work / gray during rest). Play/Pause/Skip/Restart controls. Tabata default. CustomTimerBuilder (drag-to-reorder intervals). 6 template cards.

### 9. Progress (`/progress`)
5 tabs. Weight: ComposedChart (scatter+moving average) + stats + rate. Strength: exercise selector + 1RM chart + PR table. Measurements: body diagram. Nutrition: 14-day bar + consistency. Photos: gallery.

### 10. Coaching (`/coaching`) — Image 3 exact (desktop 3-col)
CoachTopNav. LEFT: AI chat card + body area browser + mini schedule. CENTER: trending workouts + featured + active programs. RIGHT: streak counter (3 days, week dots, longest 22) + nutrition history + calorie chart.

### 11. Community (`/community`)
Social feed with 5 post types. Challenges grid. Like/comment/share/save actions. Leaderboard sidebar.

### 12. Settings (`/settings`)
Tabbed: Profile (avatar upload) · Goals (macro targets) · Appearance (theme toggle) · Notifications (toggles + time pickers).

### 13. Coach Dashboard (`/coach`) + clients + content pages
Coach-side shell. Revenue metrics. Client table with compliance %. Content composer.

## ZUSTAND STORES — 7 STORES, ALL PERSISTED

Build these exact stores with persist middleware:
- `useUserStore` — profile, onboarding, login, recalculate targets
- `useNutritionStore` — food diary, search, saved meals, streak
- `useWorkoutStore` — sessions, active session, sets, 1RM, PRs, volume
- `useHydrationStore` — drinks, daily goal, streak, weekly history
- `useProgressStore` — weight log, measurements, photos, PRs
- `useTimerStore` — configs, active timer, interval state
- `useCoachingStore` — coaches, posts, follow/subscribe

## CALCULATION FUNCTIONS (implement all)
- `calculateBMR(weight, height, age, sex)` — Harris-Benedict
- `calculateTDEE(bmr, activityLevel)` — with multipliers
- `calculateCalorieTarget(tdee, goal, sex)` — with goal adjustments + safety floors
- `calculateProteinTarget(weight, goal, activityLevel)` — g per kg ratios
- `calculate1RM(weight, reps)` — Brzycki (≤10) or Epley (>10)
- `calculateBMI(weight, height)` + `getBMICategory(bmi, isAsian?)`
- `calculateWaterGoal(weight, activityLevel)` — 35ml/kg + activity bonus
- `calculateCreatineDosage(weight, loadingPhase)` — loading + maintenance
- `projectWeightLoss(...)` — Hall NIH model with metabolic adaptation
- `calculateMovingAverage(data, window)` — for weight trend
- `calculateWarmupSets(workingWeight)` — 5 warm-up sets
- `calculatePlates(targetKg)` — plates per side
- `calculateHRZones(age, restingHR)` — 5 training zones
- `calculateIFWindow(protocol, firstMealHour)` — eating + fasting windows
- Unit conversions: kg↔lbs, cm→ft/in, ml↔oz

## MOCK DATA (seed stores on first load)
- 60 food items across all categories (proteins, grains, veg, fruits, dairy, nuts, fats, supplements)
- 80 exercises across all muscle groups and movements
- 6 mock coaches with bios, ratings, prices
- 30 days of weight entries (gradual downward trend with noise)
- 5 past workout sessions
- 4 workout routines (Push/Pull/Legs/Full Body)
- 7 days of hydration history
- Today's food diary pre-populated with 5 entries (~1,548 kcal)

## FRAMER MOTION ANIMATIONS (implement all)

```typescript
// Page entry: opacity 0→1, y 12→0, 280ms ease-out
// Card stagger: staggerChildren 0.07s, each item y 18→0 + scale 0.975→1
// Bottom sheet: y 100%→0, 350ms ease-out
// Modal: scale 0.96→1 + opacity
// Sidebar collapse: width 240→64, 250ms
// Progress ring fill: animate from 0 to value over 1000ms spring
// Number count-up: useMotionValue + useTransform, 800ms ease-out
// Set completion: scale spring + green flash
// Achievement PR: scale 0→1 + rotate -15→0, spring, 500ms
// Button: whileHover scale 1.01, whileTap scale 0.97
```

## RECHARTS CONFIG (apply universally)
```typescript
// All charts:
cartesianGrid: { strokeDasharray: "4 4", stroke: "var(--chart-grid)", vertical: false }
xAxis: { tick: { fill: "var(--chart-axis)", fontSize: 11 }, axisLine: false, tickLine: false }
tooltip: { contentStyle: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "12px", fontFamily: "Inter" } }
// Use CSS variables for all stroke/fill colors — never hardcoded hex
```

## RESPONSIVE RULES
- Mobile (< 768px): Single column, bottom tab nav, no sidebar
- Tablet (768–1023px): Two column, bottom tab nav, no sidebar
- Desktop (1024–1279px): 64px icon sidebar, no bottom nav
- Desktop (1280px+): 240px full sidebar, no bottom nav
- Always: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` pattern
- Content padding: `px-4 py-4 md:px-7 md:py-6`

## SONNER TOASTS — add these
- Food added: "🥗 Chicken Breast added to Lunch"
- Workout started: "💪 Upper Body Strength started"
- Set PR: "🏆 New 1RM PR! Bench Press: 90kg"
- Water logged: "💧 500ml added — 79% of goal"
- Goal met: "🎯 Daily calorie goal reached!"
- Workout completed: "✅ Workout complete! 62 min · 14,240kg volume"

## FINAL CHECKLIST — EVERY ITEM REQUIRED
- [ ] All 7 Zustand stores with persist middleware
- [ ] All calculation functions implemented + tested
- [ ] 60+ food items seeded
- [ ] 80+ exercises seeded
- [ ] 6 coaches seeded
- [ ] Dashboard metric cards match Image 1 exactly
- [ ] Sidebar matches Image 1 exactly (color, font, active state)
- [ ] Mobile workout schedule matches Image 2 exactly (calendar, time-slot list, empty state)
- [ ] Mobile bottom nav matches Image 2 (5 tabs, raised center + button)
- [ ] Coaching page matches Image 3 exactly (3-column layout, top nav)
- [ ] All Framer Motion animations implemented
- [ ] All Recharts use CSS variables for colors
- [ ] Dark mode perfect (matches Image 1)
- [ ] Light mode perfect (clean white, Image 3 style)
- [ ] All 15 calculators built and functional
- [ ] Timer hub: Tabata + custom builder both work
- [ ] Food diary: add/remove entries updates macros live
- [ ] Active workout: set logging + rest timer + finish flow
- [ ] Hydration: ring animates on drink addition
- [ ] Progress: weight chart + moving average
- [ ] Onboarding: all 8 steps + recalculates targets
- [ ] Sonner toasts on all key actions
- [ ] Mobile bottom padding 80px on all content pages
- [ ] Keyboard navigation + focus rings on all interactive elements
- [ ] No empty states on first load (all stores seeded)

---

**Build the entire application. Every page. Every component. Every calculation. Make it production-quality. This should rival MyFitnessPal + Strong App + Whoop in a single interface.**

---

*SuperFit Complete System Documentation v1.0*
*Desktop: Image 1 (dark dashboard) + Image 3 (coaching web)*
*Mobile: Image 2 (workout schedule)*
*Stack: Next.js 14 · TypeScript · Tailwind · shadcn/ui · Zustand · Framer Motion · Recharts*
*Last updated: March 2026*
