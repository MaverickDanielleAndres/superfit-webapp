# SuperFit Functionality Inventory

Last updated: 2026-04-02
Reference: Actual repository implementation (not aspirational roadmap)

## Status Legend

- Implemented: Feature is interactive and wired to current stores/UI flows.
- Partial: Feature is present but includes mocked data, placeholders, or incomplete actions.
- Planned: Route/module exists but behavior is intentionally not completed yet.

## 1. Global Platform Features

| Area | Status | Notes |
|---|---|---|
| Authentication (sign in/sign up) | Implemented | Uses hardcoded demo accounts plus local mock signup in `useAuthStore`. |
| Role-based access control | Implemented | Route-level redirect guards in dashboard/coach/admin layouts. |
| Onboarding profile setup | Implemented | Collects profile data and computes targets using utility formulas. |
| Theme switching | Implemented | `next-themes` with `dark` default, optional `light`. |
| Global shell (sidebar + top bar) | Implemented | Collapsible sidebar with persisted UI state. |
| Persistent client state | Implemented | Zustand persist keys across all main stores. |

## 2. User Portal (`app/(dashboard)`)

| Route | Status | Key Capabilities |
|---|---|---|
| `/` | Implemented | KPI cards, dashboard widgets, quick navigation actions. |
| `/analytics` | Partial | Visual analytics surface with chart-heavy UI; data remains mostly mock/local. |
| `/calculators` | Implemented | BMI, protein, creatine, deficit calculators; water calculator present in-page. |
| `/coaching` | Partial | Marketplace + client-hub patterns exist; feed/client interactions use seeded data. |
| `/coaching/[coachId]` | Partial | Coach profile view with mock-driven details. |
| `/coaching/dashboard` | Partial | User-side coaching dashboard scaffolded around store data. |
| `/community` | Partial | Posting, like/repost/comment UI exists; thread/follow behavior is local mock state. |
| `/diary` | Partial | Manual food logging and diary totals work; AI scan pipeline is simulated. |
| `/exercises` | Partial | Search/detail UI implemented; progression analytics are mock-backed. |
| `/goals` | Implemented | Goal CRUD and completion updates in persisted goal store. |
| `/hydration` | Partial | Drink logging and totals work; aggregate chart sections include placeholders. |
| `/meal-planner` | Partial | Weekly/monthly planner UX present with mock meal/recipe structures. |
| `/messages` | Partial | Threads, send, reactions, unread counts work locally; attachments/uploads are mocked. |
| `/progress` | Partial | Progress visualization available, several charts are placeholder/mock-driven. |
| `/settings` | Partial | Account/security/preferences UI exists; many settings are local-only. |
| `/subscription` | Partial | Subscription management UI is present, not connected to real billing backend. |
| `/timer` | Partial | Multi-mode timer engine and custom intervals implemented; audio integrations are mocked. |
| `/workout` | Implemented | Active session flow, add exercises, set logging, finish session, and persisted workout state. |

## 3. Coach Portal (`app/coach`)

| Route | Status | Key Capabilities |
|---|---|---|
| `/coach` | Partial | HQ dashboard with KPI blocks and workflow tabs; some planner actions marked coming soon. |
| `/coach/analytics` | Partial | Analytics dashboard available; revenue/chart sections include placeholders. |
| `/coach/broadcast` | Partial | Broadcast composer exists; filters action explicitly marked coming soon. |
| `/coach/clients` | Partial | Client roster and search implemented; some action modals marked coming soon. |
| `/coach/clients/[clientId]` | Partial | Client profile drill-down with tabs and notes; some side panels marked coming soon. |
| `/coach/content` | Partial | Post and meal-plan content workflows present with local/mock persistence. |
| `/coach/forms` | Partial | Form management UX available, not API-backed. |
| `/coach/marketplace` | Partial | Marketplace management interface present with mock data. |
| `/coach/programs` | Partial | Program management and assignment UX present; still local-state oriented. |
| `/coach/schedule` | Partial | Calendar screen exists but week grid/events are mocked. |
| `/coach/settings` | Partial | Settings and payout integration flows are mocked (for example Stripe connect toast). |

## 4. Admin Portal (`app/admin`)

| Route | Status | Key Capabilities |
|---|---|---|
| `/admin` | Partial | High-level metrics and administrative search controls are implemented in UI. |
| `/admin/users` | Partial | User listing/search interface implemented with mock/local data. |
| `/admin/coaches` | Partial | Coach management interface exists with search/filter UX. |
| `/admin/applications` | Partial | Application review layout present. |
| `/admin/payments` | Partial | Payment tracking interface present; no real payment backend wiring. |
| `/admin/content` | Partial | Content moderation style UI surface available. |
| `/admin/settings` | Partial | Admin setting controls available in local/front-end scope. |

## 5. Shared Functional Modules

| Module | Status | Notes |
|---|---|---|
| Layout system (`AppShell`, `Sidebar`, `TopBar`) | Implemented | Core navigation and shell interactions are stable and reusable. |
| Calculator widgets | Implemented | Reusable calculator cards powered by utility functions. |
| Coaching components (`ClientHub`, cards) | Partial | Functional UI with multiple mock-backed actions. |
| Workout components (modals/drawers/timer pill) | Implemented | Integrated with workout store and active session flow. |
| Exercise detail sheet | Partial | Analytics visuals currently rely on mock progression data. |

## 6. Explicit "Coming Soon" Hotspots

The following are currently hardcoded as incomplete actions:

- Coach broadcast filters
- Coach client notes sidebar / actions modal
- Coach planner creation action
- Client hub program viewer action

## 7. Integration Readiness Summary

- Front-end scaffolding and interaction design are advanced.
- Core gaps are backend/API integration, real-time sync, and replacement of mocked datasets.
- Documentation and product messaging should continue to label these as MVP/local-state features until integrations are completed.
