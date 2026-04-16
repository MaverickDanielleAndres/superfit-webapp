# SuperFit System Documentation

Last updated: 2026-04-16
Scope: Current implementation in this repository

## 1. Product Summary

SuperFit is a role-based fitness platform built on Next.js App Router with three operational portals:

- User portal (`app/(dashboard)`)
- Coach portal (`app/coach`)
- Admin portal (`app/admin`)

The root route (`app/page.tsx`) is a marketing/entry experience with sign-in, athlete sign-up, and coach-application flows. Portal access is enforced with account-status and role checks.

## 2. Technology Stack

- Framework: Next.js 16, React 19, TypeScript
- Styling: Tailwind CSS v4 + CSS variable tokens
- State: Zustand + persisted slices with `zustand/middleware/persist`
- Motion: Framer Motion (plus GSAP in landing page)
- Charts: Recharts
- Notifications/toasts: Sonner
- Theming: `next-themes`
- Auth and data: Supabase (with guarded fallback behavior when auth is disabled)

## 3. Routing Surfaces

### 3.1 Public and System Routes

- `/` (marketing + auth entry modals)
- `/auth`
- `/onboarding`
- `/contact`
- `/suspended`
- `/under-review`

### 3.2 User Routes (`app/(dashboard)`)

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

### 3.3 Coach Routes (`app/coach`)

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

### 3.4 Admin Routes (`app/admin`)

- `/admin`
- `/admin/applications`
- `/admin/coaches`
- `/admin/content`
- `/admin/payments`
- `/admin/settings`
- `/admin/support`
- `/admin/users`

### 3.5 Access Control Behavior

- `app/(dashboard)/layout.tsx` initializes auth, enforces onboarding, and redirects suspended/inactive accounts.
- Coach accounts in `pending_review` are redirected to `/under-review`.
- `app/coach/layout.tsx` enforces coach role and account status.
- `app/admin/layout.tsx` enforces admin role and account status.
- Portal mode toggles allow controlled return to the user app for coach/admin accounts.

## 4. Backend API Surface

API handlers are implemented under `app/api/v1` (80 route handlers currently).

### 4.1 Auth, System, Search, Analytics

- `/api/v1/auth/me`
- `/api/v1/health`
- `/api/v1/search`
- `/api/v1/analytics/overview`

### 4.2 User Fitness Domains

- `/api/v1/workouts`
- `/api/v1/workouts/[id]`
- `/api/v1/exercises/search`
- `/api/v1/exercises/logs`
- `/api/v1/goals`
- `/api/v1/goals/[id]`
- `/api/v1/hydration`
- `/api/v1/hydration/[id]`
- `/api/v1/nutrition`
- `/api/v1/nutrition/[id]`
- `/api/v1/nutrition/foods/search`
- `/api/v1/nutrition/ai-scan`
- `/api/v1/nutrition/upload`
- `/api/v1/meal-planner/recipes/search`
- `/api/v1/calculators/responses`

### 4.3 Messaging, Notifications, Social

- `/api/v1/messages`
- `/api/v1/messages/send`
- `/api/v1/messages/threads`
- `/api/v1/messages/mark-read`
- `/api/v1/messages/reactions`
- `/api/v1/messages/direct-thread`
- `/api/v1/notifications`
- `/api/v1/notifications/[id]`
- `/api/v1/community/posts`
- `/api/v1/community/posts/[id]`
- `/api/v1/community/posts/[id]/comments`
- `/api/v1/community/posts/[id]/like`
- `/api/v1/community/posts/[id]/repost`
- `/api/v1/friends`
- `/api/v1/friends/[id]`
- `/api/v1/friends/[id]/respond`
- `/api/v1/follows`

### 4.4 Profile, Subscription, Support

- `/api/v1/settings/profile`
- `/api/v1/settings/avatar`
- `/api/v1/subscription`
- `/api/v1/simulated-checkout`
- `/api/v1/support/tickets`
- `/api/v1/support/tickets/[id]`
- `/api/v1/support/tickets/[id]/messages`

### 4.5 Coach APIs

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
- `/api/v1/coach/schedule-events`
- `/api/v1/coach/broadcast`
- `/api/v1/coach/broadcast/history`
- `/api/v1/coach/content`
- `/api/v1/coach/marketplace`
- `/api/v1/coach/media/upload`
- `/api/v1/coach/settings`

### 4.6 Coaching Discovery and User-to-Coach APIs

- `/api/v1/coaching/discover`
- `/api/v1/coaching/hub`
- `/api/v1/coaching/[coachId]/overview`
- `/api/v1/coaching/[coachId]/reviews`
- `/api/v1/coaching/reviews/[reviewId]/reply`
- `/api/v1/coaching/forms/submissions`

### 4.7 Admin APIs

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

## 5. Feature Coverage Snapshot

### 5.1 Client/User

- Implemented and backend-backed: workouts, goals, hydration, nutrition logs, core messaging, notifications, support tickets.
- Implemented with mixed API + local/mock behavior: analytics surfaces, community feed enhancements, diary AI-scan experience, meal planner richness, some settings and subscription flows.

### 5.2 Coach

- Implemented and backend-backed: client roster and status updates, programs CRUD and assignment, forms CRUD and assignment/submissions, broadcast history, schedule events, marketplace profile, content publishing, settings load/save.
- Partial areas: advanced analytics depth, richer planner/automation workflows, and selected UX actions still constrained.

### 5.3 Admin

- Implemented and backend-backed: users/coaches listings, status and premium controls, application processing, payments list and payout approval, moderation reports, platform settings.
- Partial areas: deeper moderation automation, expanded financial operations, and broader operational tooling.

## 6. State Architecture

SuperFit currently uses 14 domain stores in `store/`.

### 6.1 Persisted Stores (with storage keys)

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

### 6.2 Non-persisted Operational Stores

- `useCoachPortalStore` (coach operational state over `/api/v1/coach/*`)
- `useAdminPortalStore` (admin operational state over `/api/v1/admin/*`)

### 6.3 Caching and Realtime Notes

- `useAuthStore` initializes with a 60s cache window for authenticated sessions.
- `useMessageStore` has 30s init caching + Supabase realtime refresh.
- `useNotificationStore` has 20s init caching + Supabase realtime refresh.
- `useAdminPortalStore` uses 30s per-domain TTL with forced refresh on realtime events.

## 7. Design System Foundation

- Global tokens: `app/globals.css`
- Shared shell: `components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, `components/layout/TopBar.tsx`
- Role sidebars: `app/coach/CoachSidebar.tsx`, `app/admin/AdminSidebar.tsx`
- Shared support module: `components/support/SupportCenter.tsx`

## 8. Developer Commands

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
