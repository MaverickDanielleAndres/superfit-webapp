# SuperFit Functionality Inventory

Last updated: 2026-04-03
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
| `/coach/broadcast` | Partial | Audience segmentation/send/history now use `/api/v1/coach/broadcast` and `/api/v1/coach/broadcast/history`, delivering persisted messages/logs; advanced filter controls are still limited. |
| `/coach/clients` | Partial | Client roster load, status updates, and "add next available client" now run through `/api/v1/coach/clients` APIs; some action modals remain coming soon. |
| `/coach/clients/[clientId]` | Partial | Client profile drill-down with tabs and notes; some side panels marked coming soon. |
| `/coach/content` | Partial | Post and meal-plan publishing now uses `/api/v1/coach/content` with persisted `community_posts`; scheduling panel remains coach-schedule based and broader content ops are still evolving. |
| `/coach/forms` | Partial | Form listing/create/delete/status/assignment now runs through `/api/v1/coach/forms` APIs; advanced analytics and template tooling are still limited. |
| `/coach/marketplace` | Partial | Marketplace listing load/save now runs through `/api/v1/coach/marketplace`; public listing optimization and richer package tooling remain limited. |
| `/coach/programs` | Partial | Program fetch/create/update/day edits and assignments now run through `/api/v1/coach/programs` APIs; richer lifecycle tools (archive/versioning) remain limited. |
| `/coach/schedule` | Partial | Event list/create flows now use `/api/v1/coach/schedule-events`; richer calendar interactions and advanced scheduling automation remain limited. |
| `/coach/settings` | Partial | Account settings load/save now runs through `/api/v1/coach/settings`; notifications/security and full payout lifecycle remain partially mocked. |

## 4. Admin Portal (`app/admin`)

| Route | Status | Key Capabilities |
|---|---|---|
| `/admin` | Partial | High-level metrics and administrative search controls are implemented in UI. |
| `/admin/users` | Partial | User listing and status/premium actions now run through `/api/v1/admin/users` endpoints; deeper lifecycle tooling remains limited. |
| `/admin/coaches` | Partial | Coach management data now loads through `/api/v1/admin/coaches` with client/revenue aggregation; extended coach operations remain limited. |
| `/admin/applications` | Partial | Application review status updates now run through `/api/v1/admin/applications` and `/api/v1/admin/applications/[id]/status` with approval side effects. |
| `/admin/payments` | Partial | Payment list and pending payout approvals now run through `/api/v1/admin/payments` and `/api/v1/admin/payments/approve-pending`; external settlement integration is still pending. |
| `/admin/content` | Partial | Moderation report retrieval/status actions now run through `/api/v1/admin/reports` APIs; policy automation and richer moderation ops are still evolving. |
| `/admin/settings` | Partial | Settings load/save now runs through `/api/v1/admin/settings`; broader platform configuration surface and audit controls are still limited. |

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
- Backend/API integration is now in place for key coach/admin flows (coach clients, content, broadcast/history, forms, programs, schedule events, marketplace, settings, direct-thread creation; admin applications, users/coaches, reports, payments, settings) but several modules still rely on local/mock patterns.
- Core remaining gaps are deeper domain coverage (for example richer client-detail workflows and coach/admin advanced operations), real-time sync, and replacement of remaining mocked datasets.
- Documentation and product messaging should continue to label these as MVP/local-state features until integrations are completed.
