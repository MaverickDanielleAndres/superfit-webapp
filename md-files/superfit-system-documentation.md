# SuperFit System Documentation (Detailed)

Last updated: 2026-04-03
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
- `/notifications`
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

## 5. Backend API Inventory

API route handlers are implemented under `app/api/v1` and are consumed by dashboard, coach, and admin portals.

### 5.1 Auth And Core User Domains

- Auth/session:
  - `/api/v1/auth/me`

- User progress domains:
  - `/api/v1/workouts`, `/api/v1/workouts/[id]`
  - `/api/v1/goals`, `/api/v1/goals/[id]`
  - `/api/v1/hydration`, `/api/v1/hydration/[id]`
  - `/api/v1/nutrition`, `/api/v1/nutrition/[id]`
  - `/api/v1/nutrition/foods/search`, `/api/v1/nutrition/ai-scan`

- Social and communication:
  - `/api/v1/messages/*`
  - `/api/v1/notifications`, `/api/v1/notifications/[id]`
  - `/api/v1/community/posts/*`
  - `/api/v1/friends/*`

- Settings and account:
  - `/api/v1/settings/profile`
  - `/api/v1/subscription`
  - `/api/v1/simulated-checkout`

- Utility/search:
  - `/api/v1/search`
  - `/api/v1/health`
  - `/api/v1/exercises/search`
  - `/api/v1/meal-planner/recipes/search`

### 5.2 Coach Domains

- Portal routes:
  - `/api/v1/coach/clients*`
  - `/api/v1/coach/programs*`
  - `/api/v1/coach/forms*`
  - `/api/v1/coach/content`
  - `/api/v1/coach/broadcast*`
  - `/api/v1/coach/schedule-events`
  - `/api/v1/coach/marketplace`
  - `/api/v1/coach/settings`

- Marketplace/profile/reviews:
  - `/api/v1/coaching/[coachId]/overview`
  - `/api/v1/coaching/[coachId]/reviews`
  - `/api/v1/coaching/reviews/[reviewId]/reply`

### 5.3 Admin Domains

- `/api/v1/admin/users*`
- `/api/v1/admin/coaches`
- `/api/v1/admin/applications*`
- `/api/v1/admin/payments*`
- `/api/v1/admin/reports*`
- `/api/v1/admin/settings`

## 6. Shared Layout Components

`components/layout/` contains shell primitives:

- `AppShell.tsx`: wraps user routes with sidebar + top bar
- `Sidebar.tsx`: main user navigation, unread badge support, collapse/expand
- `TopBar.tsx`: greeting, search modal, notifications, theme toggle

Role-specific sidebars:

- `app/coach/CoachSidebar.tsx`
- `app/admin/AdminSidebar.tsx`

## 7. State Management

State is organized by business domain and persisted locally.

### 7.1 Store Registry

- `useAuthStore` (`superfit-auth-storage`)
  - Handles login/signup/logout/error/user session
  - Uses Supabase auth and profile synchronization

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

- `useNotificationStore` (`superfit-notifications-storage-v1`)
  - Notifications list, unread state, mark-read/seen actions, realtime subscriptions

- `useCoachingStore` (`superfit-coaching-storage`)
  - Coach marketplace and client hub data model

- `useCoachPortalStore` (non-persisted operational domain state)
  - Coach client/program/form/event/broadcast state backed by `/api/v1/coach/*`

- `useAdminPortalStore` (non-persisted operational domain state)
  - Admin users/coaches/applications/payments/reports/settings backed by `/api/v1/admin/*`

- `useUIStore` (`superfit-ui-storage`)
  - Sidebar collapse state

### 7.2 Important Note

Both auth and user profile concerns currently exist in `useAuthStore` and `useUserStore`. This dual ownership is acceptable for MVP but should be unified during deeper backend hardening.

## 8. Domain Modules

### 8.1 Calculations Layer

`lib/calculations.ts` provides deterministic utility functions:

- BMR (Mifflin-St Jeor style branch by sex)
- TDEE by activity multipliers
- Protein target estimation by goal/activity
- Water target estimation
- BMI categorization
- Creatine load/maintenance suggestion
- Deficit scenarios for weight-loss timelines

### 8.2 Mock Data Layer

`lib/mockData.ts` seeds:

- Baseline user profile
- Baseline hydration entries

Many UI routes also include local mock arrays and optimistic interactions.

### 8.3 Type System

`types/index.ts` centralizes type contracts for:

- User, nutrition, workout, hydration, progress
- Messaging and community
- Coaching entities

## 9. Design System Wiring

### 9.1 Theme Tokens

Tokens are defined in `app/globals.css` and mapped via Tailwind theme custom properties.

Token groups:

- Background/surface
- Border
- Text
- Accent/status
- Chart
- Sidebar

### 9.2 Typography

`app/layout.tsx` sets font variables:

- Display: DM Sans
- Body: Inter
- Mono: JetBrains Mono

### 9.3 Motion And Feedback

- Framer Motion for page and modal animations
- Sonner for toast notifications

## 10. Functional Coverage Snapshot

### 10.1 Strongly Implemented

- Shell/navigation/theming framework
- Role-based route protection and redirect logic
- Workout session tracking flow
- Goal CRUD state
- Coach and admin core API-backed workflows
- Notifications API integration with realtime updates
- Calculator workflows and utility-backed outputs

### 10.2 Implemented But Mock-Heavy

- Community feed and social interactions
- Messages/attachments workflow
- Coaching workflows
- Meal planning and AI scan experience
- Analytics panels in user/coach/admin spaces

### 10.3 Explicitly Partial

Known "coming soon" hooks are present in selected coach and client hub actions (for example filters/actions/planner/program viewer).

## 11. Documentation Maintenance Rules

When features change:

1. Update this file and `superfit-all-functionalities-list.md` together.
2. Mark partial/mocked behavior clearly.
3. Reflect new `/api/v1` additions/removals in the API inventory section.
4. Do not claim production API/payment/integration support unless implemented.
