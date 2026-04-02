# SuperFit - Technical System Documentation

## 1. Executive Summary & Architecture

**SuperFit** is an all-in-one comprehensive health, fitness, coaching, and community web application. 
It utilizes a modern, reactive tech stack customized to deliver a "Quiet Luxury" aesthetic (minimalist, sophisticated, and fluid).

### Core Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Customized via native CSS Variables for theming)
- **State Management:** Zustand (Modular, domain-driven stores)
- **Animation:** Framer Motion (Page transitions, micro-interactions)
- **Icons:** Lucide-React
- **UI Components:** ShadCN UI (Immersive dialogs, standardized interaction patterns)

### Design Philosophy
The UI relies on a specific CSS variable theming system (`--bg-surface`, `--bg-elevated`, `--text-primary`, `--border-subtle`). It avoids harsh borders and generic colors favoring subtle blurs, emerald/blue dynamic gradients, fluid transitions, and extensive border-radius configurations to evoke a premium feel.

---

## 2. Authentication & Role-Based Access (RBAC)

The application segregates its user base into three hierarchical roles, modeled in the `UserProfile` type in `types/index.ts`.

Role enum: `'user' | 'coach' | 'admin'`

A unified Login Portal (`app/auth/page.tsx`) handles initial authentication, injecting the user profile into `useAuthStore`. 
Routing is intensely protected at the layout level utilizing Parallel Route Groups:

- **Guard 1 (User App):** Located in `app/(dashboard)/layout.tsx`. Restricts access to base `user` profiles. If a `coach` logs in here, they are force-redirected to `/coach`. If an `admin` logs in, they are redirected to `/admin`.
- **Guard 2 (Coach App):** Located in `app/coach/layout.tsx`. Rejects any non-coach, kicking them back to `/`.
- **Guard 3 (Admin App):** Located in `app/admin/layout.tsx`. Strict rejection of non-admins.

---

## 3. Modular System Topology

The platform consists of three standalone Portals serving distinct user journeys.

### A. The User Application (`app/(dashboard)/*`)
Designed as a unified central hub for the end-consumer to track health, buy programs, and socialize.
* **Layout:** Top Navigation Bar + Left Sidebar Navigation.
* **Core Pages:**
  * **`/` (Dashboard Main):** Daily health rings (Macro, Hydration, Sleep). Current active workout program snippet.
  * **`/workout`:** Workout logger, exercise selection, volume tracking metrics.
  * **`/nutrition`:** Macro tracker, meal entries, daily caloric goals.
  * **`/community`:** Global and tailored social feeds, leaderboards, likes, comments.
  * **`/calculators`:** Suite of fitness tooling (TDEE, 1RM, Macro splits, Wilks score).
  * **`/coaching` (The Marketplace):** Dual-state architecture. Shows a visual Grid of available coaches + filtering tools if unsubstituted. Transforms into the "Active Client Hub" (chat, program viewer, form-check uploads) if subscribed to a coach.
  * **`/coaching/[coachId]`:** Public facing details of a specific coach (Reviews, Tiers, Intro Video).

### B. The Coach Operations Portal (`app/coach/*`)
A dedicated horizontal-nav platform turning the application into a CRM / CMS for personal trainers.
* **Layout:** Top Navbar (Desktop) / Bottom Tab Bar (Mobile) optimized for fast switching context.
* **Core Pages:**
  * **`/coach` (HQ):** Overview of pending tasks (Form checks waiting, unread messages, MRR).
  * **`/coach/clients`:** Roster table with compliance scoring, health trendlines, and filter chips.
  * **`/coach/clients/[clientId]`:** Dedicated drill-down view of a specific client's active programs, progression charts, and direct messaging.
  * **`/coach/programs`:** Visual program builder to draft multi-week training protocols.
  * **`/coach/content`:** Multi-format CMS publisher to post Videos, Meals, and Status updates to their subscriber feeds.
  * **`/coach/schedule`:** Interactive calendar interface managing 1-on-1s and group sessions.
  * **`/coach/broadcast`:** Mass-messaging tool capable of targeting segmented client rosters.
  * **`/coach/forms`:** Questionnaire builder for weekly check-ins and intake forms.
  * **`/coach/marketplace`:** Coach's public Storefront manager—adjusting Bio, Intro Video, and Pricing Tiers mapped to Stripe/Payments.
  * **`/coach/analytics`:** Read-only charts evaluating retention, churn, and revenue projections.
  * **`/coach/settings`:** Profile adjustments, payouts, configurations.

### C. The Super Admin Console (`app/admin/*`)
"God-mode" access controlling the health and business logic of the entire network.
* **Layout:** Fixed Vertical Left Sidebar focusing on dense data visualization.
* **Core Pages:**
  * **`/admin`:** System aggregate health, real-time subscription flow, and open moderation tickets.
  * **`/admin/users`:** Global user directory with suspension triggers and audit logs.
  * **`/admin/coaches`:** Verified coach directory and MRR auditing.
  * **`/admin/applications`:** An queue of pending coach applications with document review capabilities before granting Coach roles.
  * **`/admin/payments`:** Platform-wide master ledger of transaction histories and platform-fee collections.
  * **`/admin/content`:** Community moderation hub capable of dropping flagged User/Coach posts and videos.
  * **`/admin/settings`:** Hardcoded global platform toggles (e.g., Maintenance Mode switch, platform fee percentage adjusters).

---

## 4. State Management Ecosystem (Zustand)

Global state is strictly segregated by domain responsibility inside `store/`.

1.  **`useAuthStore.ts`:** Holds the active user session (`user: UserProfile | null`), login logic (mock roles), and logout hooks.
2.  **`useUserStore.ts`:** Manages onboarding state, current physiological metrics (weight, height, BMR), user aesthetic goals, and dietary preferences.
3.  **`useWorkoutStore.ts`:** Manages logging state, active workout sessions, templates, custom exercises, and sets/reps history.
4.  **`useNutritionStore.ts`:** Houses the daily food log, macro aggregations (`calculateDailyTotals`), daily goals, and food items directory.
5.  **`useHydrationStore.ts`:** Simple state controlling daily water intake goals and current water volume logged.
6.  **`useGoalStore.ts`:** Long-term fitness ambitions (Target weight, PR chasing) with corresponding deadlines.
7.  **`useMessageStore.ts`:** Messaging/Inbox system, handling threads, direct messages, unread flags, and coach/client communication overlays.
8.  **`useCommunityStore.ts`:** Paginates and holds feed posts, comments, likes, and trending hashtags.
9.  **`useUIStore.ts`:** Global UI signaling (Sidebar open/close, active modal overlays, dark mode syncing).

## 5. Technical Design Patterns

- **Server/Client Boundaries:** Widespread usage of `'use client'` at the view layers due to Framer Motion usage, heavy interactivity, and Zustand syncing. 
- **Mock Data Layer:** Application is running via a robust `lib/mockData.ts` mapping generating comprehensive data relations to simulate an active database. This allows front-end scaffolding and layout verification prior to an official Supabase/PostgreSQL backend hookup.
- **Component Reusability:** The `cn()` utility acts as the backbone for merging Tailwind CSS strings cleanly, widely applied in custom components and layout shells.
- **No-Refetch Persistence:** Many stores operate without external persistence currently, relying on React local state + Zustand. Upon wiring an exterior DB (Supabase), the actions in Zustand stores are designed to be modified to map to API calls, acting as a facade to the UI.

---
*Generated for internal reference and onboarding. Architecture is built for scale, ready for PostgreSQL / Edge deployment scaling.*
