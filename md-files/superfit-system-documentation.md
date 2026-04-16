# SuperFit System Documentation (Detailed)

Last updated: 2026-04-16
Documentation mode: implementation-accurate

## 1. Purpose

This document reflects what is implemented in the current repository, including route coverage, API surfaces, and store behavior for client, coach, and admin portals.

## 2. Runtime and Architecture

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4 + CSS variable design tokens
- Zustand domain stores (persisted and non-persisted)
- Supabase auth + database + realtime subscriptions
- Framer Motion and GSAP used in selected UX surfaces

Portal organization:

- User app: `app/(dashboard)`
- Coach app: `app/coach`
- Admin app: `app/admin`
- Public/system routes: `app/page.tsx`, `app/auth`, `app/onboarding`, `app/contact`, `app/suspended`, `app/under-review`

## 3. Route Guarding and Account Status Flows

### 3.1 User Layout (`app/(dashboard)/layout.tsx`)

- Initializes auth state.
- Redirects unauthenticated users to `/`.
- Redirects suspended/inactive users to `/suspended`.
- Redirects coach users in pending review to `/under-review`.
- Redirects coach/admin users to their portal unless explicit user-app mode is enabled.
- Redirects users with incomplete onboarding to `/onboarding`.

### 3.2 Coach Layout (`app/coach/layout.tsx`)

- Requires authenticated coach role.
- Redirects suspended/inactive to `/suspended`.
- Redirects pending review to `/under-review`.
- Uses `CoachPortalDataProvider` and shared top bar.

### 3.3 Admin Layout (`app/admin/layout.tsx`)

- Requires authenticated admin role.
- Redirects suspended/inactive to `/suspended`.
- Starts/stops admin realtime subscriptions via `useAdminPortalStore`.

## 4. Frontend Route Inventory

### 4.1 Public and System

- `/` (marketing and auth entry)
- `/auth`
- `/onboarding`
- `/contact`
- `/suspended`
- `/under-review`

### 4.2 Client/User (`app/(dashboard)`)

- `/dashboard`
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
- `/support`
- `/timer`
- `/workout`

### 4.3 Coach (`app/coach`)

- `/coach`
- `/coach/analytics`
- `/coach/broadcast`
- `/coach/clients`
- `/coach/clients/[clientId]`
- `/coach/content`
- `/coach/forms`
- `/coach/marketplace`
- `/coach/messages`
- `/coach/notifications`
- `/coach/programs`
- `/coach/schedule`
- `/coach/settings`
- `/coach/support`

### 4.4 Admin (`app/admin`)

- `/admin`
- `/admin/applications`
- `/admin/coaches`
- `/admin/content`
- `/admin/payments`
- `/admin/settings`
- `/admin/support`
- `/admin/users`

## 5. Feature Coverage by Portal

### 5.1 Client/User Features

Implemented or strongly wired:

- Workout session lifecycle and logging (`/workout` + `/api/v1/workouts*`)
- Goal CRUD (`/goals` + `/api/v1/goals*`)
- Hydration logging (`/hydration` + `/api/v1/hydration*`)
- Nutrition logging plus search/upload/scan endpoints (`/diary` + `/api/v1/nutrition*`)
- Direct messaging and reactions (`/messages` + `/api/v1/messages*`)
- Notifications list/read actions (`/notifications` + `/api/v1/notifications*`)
- Support ticketing UI (`/support` + `/api/v1/support/tickets*`)

Partial or mixed local/API behavior:

- Analytics (`/analytics`)
- Community feed depth (`/community`)
- Coaching marketplace/client-hub UX (`/coaching*`)
- Meal planner richness (`/meal-planner`)
- Subscription/payment realism (`/subscription` + simulated checkout)

### 5.2 Coach Features

Implemented or strongly wired:

- Client list/status/summary and add-available flows
- Programs CRUD and assignment
- Forms CRUD, status changes, assignments, and submission views
- Broadcast sends and history
- Content publishing
- Schedule event CRUD-like flows
- Marketplace profile management
- Settings load/save

Partial areas:

- Advanced analytics depth and selected workflow tooling in coach pages

### 5.3 Admin Features

Implemented or strongly wired:

- Users list/filter/update/status/premium/delete
- Coaches list with client and revenue derived aggregates
- Coach application review lifecycle
- Payments listing and pending payout approval
- Moderation report listing and status updates
- Platform settings load/save

Partial areas:

- Expanded moderation automation and deeper operations beyond current controls

## 6. API Inventory (`app/api/v1`)

Current implementation includes 80 API route handlers.

### 6.1 Core and Utility

- `/api/v1/auth/me`
- `/api/v1/health`
- `/api/v1/search`
- `/api/v1/analytics/overview`

### 6.2 User Fitness and Tracking

- `/api/v1/workouts`, `/api/v1/workouts/[id]`
- `/api/v1/exercises/search`, `/api/v1/exercises/logs`
- `/api/v1/goals`, `/api/v1/goals/[id]`
- `/api/v1/hydration`, `/api/v1/hydration/[id]`
- `/api/v1/nutrition`, `/api/v1/nutrition/[id]`
- `/api/v1/nutrition/foods/search`, `/api/v1/nutrition/ai-scan`, `/api/v1/nutrition/upload`
- `/api/v1/meal-planner/recipes/search`
- `/api/v1/calculators/responses`

### 6.3 Messaging, Notifications, Community, Social

- `/api/v1/messages`
- `/api/v1/messages/send`
- `/api/v1/messages/threads`
- `/api/v1/messages/mark-read`
- `/api/v1/messages/reactions`
- `/api/v1/messages/direct-thread`
- `/api/v1/notifications`, `/api/v1/notifications/[id]`
- `/api/v1/community/posts`, `/api/v1/community/posts/[id]`
- `/api/v1/community/posts/[id]/comments`
- `/api/v1/community/posts/[id]/like`
- `/api/v1/community/posts/[id]/repost`
- `/api/v1/friends`, `/api/v1/friends/[id]`, `/api/v1/friends/[id]/respond`
- `/api/v1/follows`

### 6.4 Profile, Subscription, Support

- `/api/v1/settings/profile`
- `/api/v1/settings/avatar`
- `/api/v1/subscription`
- `/api/v1/simulated-checkout`
- `/api/v1/support/tickets`
- `/api/v1/support/tickets/[id]`
- `/api/v1/support/tickets/[id]/messages`

### 6.5 Coach APIs

- `/api/v1/coach/clients`
- `/api/v1/coach/clients/available`
- `/api/v1/coach/clients/[clientId]/summary`
- `/api/v1/coach/clients/[clientId]/status`
- `/api/v1/coach/programs`
- `/api/v1/coach/programs/[id]`
- `/api/v1/coach/programs/assign`
- `/api/v1/coach/forms`
- `/api/v1/coach/forms/[id]`
- `/api/v1/coach/forms/[id]/status`
- `/api/v1/coach/forms/[id]/assign`
- `/api/v1/coach/forms/[id]/submissions`
- `/api/v1/coach/content`
- `/api/v1/coach/broadcast`
- `/api/v1/coach/broadcast/history`
- `/api/v1/coach/schedule-events`
- `/api/v1/coach/marketplace`
- `/api/v1/coach/media/upload`
- `/api/v1/coach/settings`

### 6.6 Coaching Discovery and Engagement

- `/api/v1/coaching/discover`
- `/api/v1/coaching/hub`
- `/api/v1/coaching/[coachId]/overview`
- `/api/v1/coaching/[coachId]/reviews`
- `/api/v1/coaching/reviews/[reviewId]/reply`
- `/api/v1/coaching/forms/submissions`

### 6.7 Admin APIs

- `/api/v1/admin/users`
- `/api/v1/admin/users/[id]`
- `/api/v1/admin/users/[id]/status`
- `/api/v1/admin/users/[id]/premium`
- `/api/v1/admin/coaches`
- `/api/v1/admin/applications`
- `/api/v1/admin/applications/[id]/status`
- `/api/v1/admin/payments`
- `/api/v1/admin/payments/approve-pending`
- `/api/v1/admin/reports`
- `/api/v1/admin/reports/[id]/status`
- `/api/v1/admin/settings`

## 7. Store Registry and Runtime Behavior

### 7.1 Persisted Stores

- `useAuthStore` (`superfit-auth-storage`)
- `useUserStore` (`superfit-user-storage`)
- `useWorkoutStore` (`superfit-workout-storage`)
- `useNutritionStore` (`superfit-nutrition-storage`)
- `useHydrationStore` (`superfit-hydration-storage-v2`)
- `useGoalStore` (`superfit-goals-storage`)
- `useCommunityStore` (`superfit-community-storage-v3`)
- `useMessageStore` (`superfit-messages-storage-v3`)
- `useNotificationStore` (`superfit-notifications-storage-v1`)
- `useCoachingStore` (`superfit-coaching-storage`)
- `useCalculatorStore` (`superfit-calculator-storage-v1`)
- `useUIStore` (`superfit-ui-storage`)

### 7.2 Non-persisted Operational Stores

- `useCoachPortalStore` for coach operations (`/api/v1/coach/*`)
- `useAdminPortalStore` for admin operations (`/api/v1/admin/*`)

### 7.3 Caching and Realtime Notes

- `useAuthStore` keeps a 60s auth init cache window.
- `useMessageStore` keeps a 30s init cache and subscribes to realtime message tables.
- `useNotificationStore` keeps a 20s init cache and subscribes to notification/social tables.
- `useAdminPortalStore` applies a 30s TTL by dataset and force-refreshes via realtime table events.

## 8. Shared UI and Module Wiring

- User shell: `components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, `components/layout/TopBar.tsx`
- Coach shell: `app/coach/CoachSidebar.tsx` + shared top bar
- Admin shell: `app/admin/AdminSidebar.tsx`, `app/admin/AdminTopBar.tsx`
- Shared support interface for all scopes: `components/support/SupportCenter.tsx`
- Calculation utilities: `lib/calculations.ts`

## 9. Documentation Maintenance Rules

When implementation changes:

1. Update this file, `SYSTEM_DOCUMENTATION.md`, and `md-files/superfit-all-functionalities-list.md` together.
2. Keep route and API inventories synchronized with `app/**/page.tsx` and `app/api/v1/**/route.ts`.
3. Keep persisted store keys synchronized with `store/*.ts`.
4. Label mixed or mock behavior explicitly; avoid production claims not present in code.
