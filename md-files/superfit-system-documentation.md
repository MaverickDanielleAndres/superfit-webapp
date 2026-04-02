# SuperFit System Documentation (Detailed)

Last updated: 2026-04-02
Documentation mode: implementation-accurate

## 1. Purpose

This document describes what is currently implemented in the SuperFit repository and how major modules connect.

It intentionally avoids roadmap inflation. If behavior is mocked or partial, it is labeled as such.

## 2. Runtime And Tooling

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4 + custom variable tokens
- Zustand persistence for application state
- Framer Motion for transitions
- Recharts for chart surfaces
- Sonner for toast notifications

## 3. Top-Level Architecture

The app is organized around three role-specific portals plus auth/onboarding:

- User portal under `app/(dashboard)`
- Coach portal under `app/coach`
- Admin portal under `app/admin`
- Shared entry routes: `app/auth/page.tsx`, `app/onboarding/page.tsx`

### 3.1 Route Guarding Model

- `app/(dashboard)/layout.tsx`
  - Requires authenticated user profile
  - Redirects coach/admin accounts to their dedicated portals
  - Redirects incomplete profiles to onboarding

- `app/coach/layout.tsx`
  - Requires authenticated coach role

- `app/admin/layout.tsx`
  - Requires authenticated admin role

## 4. Route Inventory

### 4.1 User Surface

- `/`
- `/analytics`
- `/calculators`
- `/coaching`
- `/coaching/[coachId]`
- `/coaching/dashboard`
- `/community`
- `/diary`
- `/exercises`
- `/goals`
- `/hydration`
- `/meal-planner`
- `/messages`
- `/progress`
- `/settings`
- `/subscription`
- `/timer`
- `/workout`

### 4.2 Coach Surface

- `/coach`
- `/coach/analytics`
- `/coach/broadcast`
- `/coach/clients`
- `/coach/clients/[clientId]`
- `/coach/content`
- `/coach/forms`
- `/coach/marketplace`
- `/coach/programs`
- `/coach/schedule`
- `/coach/settings`

### 4.3 Admin Surface

- `/admin`
- `/admin/applications`
- `/admin/coaches`
- `/admin/content`
- `/admin/payments`
- `/admin/settings`
- `/admin/users`

## 5. Shared Layout Components

`components/layout/` contains shell primitives:

- `AppShell.tsx`: wraps user routes with sidebar + top bar
- `Sidebar.tsx`: main user navigation, unread badge support, collapse/expand
- `TopBar.tsx`: greeting, search modal, notifications, theme toggle

Role-specific sidebars:

- `app/coach/CoachSidebar.tsx`
- `app/admin/AdminSidebar.tsx`

## 6. State Management

State is organized by business domain and persisted locally.

### 6.1 Store Registry

- `useAuthStore` (`superfit-auth-storage`)
  - Handles login/signup/logout/error/user session
  - Supports hardcoded demo credentials and local registrations

- `useUserStore` (`superfit-user-storage`)
  - Onboarding completion and recalculation of nutrition/hydration targets

- `useWorkoutStore` (`superfit-workout-storage`)
  - Active session state, set logging, exercise insertion/removal, custom exercises

- `useNutritionStore` (`superfit-nutrition-storage`)
  - Day logs, entries, and macro total calculations

- `useHydrationStore` (`superfit-hydration-storage-v2`)
  - Drink entries, hydration/caffeine aggregation, mock initialization

- `useGoalStore` (`superfit-goals-storage`)
  - Goal list and CRUD operations

- `useCommunityStore` (`superfit-community-storage-v2`)
  - Feed posts, likes, reposts, comment counts

- `useMessageStore` (`superfit-messages-storage-v2`)
  - Threads, message arrays, reactions, unread counters

- `useCoachingStore` (`superfit-coaching-storage`)
  - Coach marketplace and client hub data model

- `useUIStore` (`superfit-ui-storage`)
  - Sidebar collapse state

### 6.2 Important Note

Both auth and user profile concerns currently exist in `useAuthStore` and `useUserStore`. This dual ownership is acceptable for MVP but should be unified during backend migration.

## 7. Domain Modules

### 7.1 Calculations Layer

`lib/calculations.ts` provides deterministic utility functions:

- BMR (Mifflin-St Jeor style branch by sex)
- TDEE by activity multipliers
- Protein target estimation by goal/activity
- Water target estimation
- BMI categorization
- Creatine load/maintenance suggestion
- Deficit scenarios for weight-loss timelines

### 7.2 Mock Data Layer

`lib/mockData.ts` seeds:

- Baseline user profile
- Baseline hydration entries

Many UI routes also include local mock arrays and optimistic interactions.

### 7.3 Type System

`types/index.ts` centralizes type contracts for:

- User, nutrition, workout, hydration, progress
- Messaging and community
- Coaching entities

## 8. Design System Wiring

### 8.1 Theme Tokens

Tokens are defined in `app/globals.css` and mapped via Tailwind theme custom properties.

Token groups:

- Background/surface
- Border
- Text
- Accent/status
- Chart
- Sidebar

### 8.2 Typography

`app/layout.tsx` sets font variables:

- Display: DM Sans
- Body: Inter
- Mono: JetBrains Mono

### 8.3 Motion And Feedback

- Framer Motion for page and modal animations
- Sonner for toast notifications

## 9. Functional Coverage Snapshot

### 9.1 Strongly Implemented

- Shell/navigation/theming framework
- Role-based route protection and redirect logic
- Workout session tracking flow
- Goal CRUD state
- Calculator workflows and utility-backed outputs

### 9.2 Implemented But Mock-Heavy

- Community feed and social interactions
- Messages/attachments workflow
- Coaching workflows
- Meal planning and AI scan experience
- Analytics panels in user/coach/admin spaces

### 9.3 Explicitly Partial

Known "coming soon" hooks are present in selected coach and client hub actions (for example filters/actions/planner/program viewer).

## 10. Documentation Maintenance Rules

When features change:

1. Update this file and `superfit-all-functionalities-list.md` together.
2. Mark partial/mocked behavior clearly.
3. Do not claim production API/payment/integration support unless implemented.
