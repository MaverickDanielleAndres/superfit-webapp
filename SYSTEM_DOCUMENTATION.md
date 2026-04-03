# SuperFit System Documentation

Last updated: 2026-04-03
Scope: Current implementation in this repository

## 1. Product Summary

SuperFit is a role-based fitness platform built on Next.js App Router.

The current implementation ships three operational portals:

- User dashboard experience (`app/(dashboard)`)
- Coach workspace (`app/coach`)
- Admin console (`app/admin`)

The platform is now in a hybrid implementation state:

- Core domain workflows are backed by internal `/api/v1/*` route handlers and Supabase data access.
- Several UI areas remain partially mocked or intentionally limited (especially advanced analytics and selected coach/admin operations).

## 2. Technology Stack

- Framework: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS v4 + CSS variable design tokens
- State management: Zustand + `zustand/middleware/persist`
- Motion: Framer Motion
- Charts: Recharts
- UI feedback: Sonner toasts
- Theming: `next-themes` (`dark` default, `light` optional)

## 3. Application Structure

### 3.1 Routing Surfaces

- Public routes:
  - `/auth`
  - `/onboarding`

- User routes (`app/(dashboard)`):
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

- Coach routes (`app/coach`):
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

- Admin routes (`app/admin`):
  - `/admin`
  - `/admin/applications`
  - `/admin/coaches`
  - `/admin/content`
  - `/admin/payments`
  - `/admin/settings`
  - `/admin/users`

### 3.2 RBAC Behavior

- `app/(dashboard)/layout.tsx` redirects non-user roles to coach/admin surfaces.
- `app/coach/layout.tsx` requires authenticated `coach` role.
- `app/admin/layout.tsx` requires authenticated `admin` role.

## 4. Backend API Surface

App Router API handlers are implemented under `app/api/v1`.

- Core user domains:
  - `/api/v1/auth/me`
  - `/api/v1/workouts`, `/api/v1/workouts/[id]`
  - `/api/v1/goals`, `/api/v1/goals/[id]`
  - `/api/v1/hydration`, `/api/v1/hydration/[id]`
  - `/api/v1/nutrition`, `/api/v1/nutrition/[id]`
  - `/api/v1/nutrition/foods/search`, `/api/v1/nutrition/ai-scan`
  - `/api/v1/messages/*`
  - `/api/v1/notifications`, `/api/v1/notifications/[id]`
  - `/api/v1/community/posts/*`
  - `/api/v1/friends/*`
  - `/api/v1/settings/profile`
  - `/api/v1/subscription`, `/api/v1/simulated-checkout`
  - `/api/v1/search`, `/api/v1/health`

- Coach domain:
  - `/api/v1/coach/clients*`
  - `/api/v1/coach/programs*`
  - `/api/v1/coach/forms*`
  - `/api/v1/coach/content`
  - `/api/v1/coach/broadcast*`
  - `/api/v1/coach/schedule-events`
  - `/api/v1/coach/marketplace`
  - `/api/v1/coach/settings`
  - `/api/v1/coaching/[coachId]/*`, `/api/v1/coaching/reviews/*`

- Admin domain:
  - `/api/v1/admin/users*`
  - `/api/v1/admin/coaches`
  - `/api/v1/admin/applications*`
  - `/api/v1/admin/payments*`
  - `/api/v1/admin/reports*`
  - `/api/v1/admin/settings`

- Additional support:
  - `/api/v1/exercises/search`
  - `/api/v1/meal-planner/recipes/search`

## 5. State Architecture

SuperFit uses domain-separated stores in `store/`.

- `useAuthStore`: auth state, Supabase login/signup, profile updates
- `useUserStore`: onboarding completion + target recalculation
- `useWorkoutStore`: active sessions, exercise logging, custom exercises
- `useNutritionStore`: day logs, manual food entries, macro totals
- `useHydrationStore`: hydration day entries + caffeine totals
- `useGoalStore`: CRUD operations for personal goals
- `useCommunityStore`: posts, likes, reposts, comments
- `useMessageStore`: thread/message state, reactions, unread handling
- `useNotificationStore`: notifications list, unread counts, mark read/seen, realtime refresh hooks
- `useCoachingStore`: coach marketplace/feed/client hub state
- `useCoachPortalStore`: coach operational data (clients/programs/forms/events/broadcasts)
- `useAdminPortalStore`: admin operational data (users/coaches/applications/payments/reports/settings)
- `useUIStore`: shell state (sidebar collapse)

All stores persist to browser storage with explicit keys (for example `superfit-auth-storage`, `superfit-ui-storage`, `superfit-coaching-storage`).

## 6. Design System Foundation

Primary design tokens are in `app/globals.css`:

- Background/surface tokens (`--bg-*`)
- Text tokens (`--text-*`)
- Border tokens (`--border-*`)
- Accent and status tokens (`--accent`, `--status-*`)
- Chart and sidebar tokens

Typography variables are injected in `app/layout.tsx` via Google fonts:

- `--font-display` = DM Sans
- `--font-body` = Inter
- `--font-mono` = JetBrains Mono

## 7. Current Implementation Status

The product is functional as a hybrid MVP with active API integration plus selected partial areas.

Examples of implemented backend-backed flows:

- Coach operational routes (`/coach/*`) use `/api/v1/coach/*` handlers for core CRUD/actions.
- Admin operational routes (`/admin/*`) use `/api/v1/admin/*` handlers for moderation, users, applications, payments, and settings.
- User routes for workouts/goals/hydration/nutrition/messages/notifications use dedicated `/api/v1` handlers.

Examples of explicit partial/mocked behavior still present:

- Some local fallback state remains in non-auth domains when Supabase is disabled
- AI food scanner simulated output
- Multiple coach portal actions with "coming soon" toasts
- Mock upload/search logic in some communication and media flows

## 8. Known Technical Notes

- Both `useAuthStore` and `useUserStore` hold user/auth-like data. Keep this in mind during backend integration to avoid state drift.
- API coverage is broad but not complete; several modules still mix persisted data with local/mock UI behaviors.
- `useNotificationStore` includes realtime subscription wiring and optimistic state updates for read/seen operations.
- Documentation should not claim production integrations that are not implemented.

## 9. Developer Commands

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - linting
