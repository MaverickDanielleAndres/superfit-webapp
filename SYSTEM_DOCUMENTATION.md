# SuperFit System Documentation

Last updated: 2026-04-02
Scope: Current implementation in this repository

## 1. Product Summary

SuperFit is a role-based fitness platform built on Next.js App Router with a strong front-end MVP focus. The app currently ships three operational portals:

- User dashboard experience (`app/(dashboard)`)
- Coach workspace (`app/coach`)
- Admin console (`app/admin`)

The project is heavily state-driven with Zustand persistence and currently relies on mock/seeded data for many domains.

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

## 4. State Architecture

SuperFit uses domain-separated stores in `store/`.

- `useAuthStore`: auth state, demo account login, signup, profile updates
- `useUserStore`: onboarding completion + target recalculation
- `useWorkoutStore`: active sessions, exercise logging, custom exercises
- `useNutritionStore`: day logs, manual food entries, macro totals
- `useHydrationStore`: hydration day entries + caffeine totals
- `useGoalStore`: CRUD operations for personal goals
- `useCommunityStore`: posts, likes, reposts, comments
- `useMessageStore`: thread/message state, reactions, unread handling
- `useCoachingStore`: coach marketplace/feed/client hub state
- `useUIStore`: shell state (sidebar collapse)

All stores persist to browser storage with explicit keys (for example `superfit-auth-storage`, `superfit-ui-storage`, `superfit-coaching-storage`).

## 5. Design System Foundation

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

## 6. Current Implementation Status

The product is functional as an interactive front-end MVP, but several areas are intentionally mocked.

Examples of explicit partial/mocked behavior in code:

- Mock login accounts and mock profile seeding
- AI food scanner simulated output
- Multiple coach portal actions with "coming soon" toasts
- Mock calendar/event rendering in coach schedule
- Mock upload/search logic in some communication and media flows

## 7. Known Technical Notes

- Both `useAuthStore` and `useUserStore` hold user/auth-like data. Keep this in mind during backend integration to avoid state drift.
- Most business logic is client-side and state-local; API integration remains a future phase.
- Documentation should not claim production integrations that are not implemented.

## 8. Developer Commands

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - linting
