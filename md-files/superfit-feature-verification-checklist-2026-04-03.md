# SuperFit Feature Verification Checklist

Date: 2026-04-03
Scope: Global platform, User Portal, Coach Portal, Admin Portal, Shared Modules

## Validation Run

- [x] `npm run build` passed (all app routes compiled, API routes resolved).
- [x] `npm run lint` passed with warnings only (`279 warnings`, `0 errors`).
- [x] Coach/Admin direct page-level data calls moved to `/api/v1/*` endpoints.
- [ ] Full manual UI click-through (all routes, all actions, mobile/desktop) not yet executed in this run.

Legend:
- Backend: `Yes` (API/persistent), `Partial` (mixed API + mock/local), `No` (local/mock only).
- UI: `Compile-OK` means build passed for that route/module. `Manual-QA` means interactive validation still required.

## 1. Global Platform Features

| Area | Backend | UI | Checklist | Notes |
|---|---|---|---|---|
| Authentication (sign in/sign up) | Partial | Compile-OK + Manual-QA | [ ] | Demo/mock account logic still present in auth flow. |
| Role-based access control | Yes | Compile-OK + Manual-QA | [ ] | Route-level guards implemented in role layouts. |
| Onboarding profile setup | Partial | Compile-OK + Manual-QA | [ ] | Functional, but downstream persistence patterns still mixed. |
| Theme switching | Yes | Compile-OK + Manual-QA | [ ] | `next-themes` integrated. |
| Global shell (sidebar + top bar) | Yes | Compile-OK + Manual-QA | [ ] | Stable shared layout components. |
| Persistent client state | Yes | Compile-OK + Manual-QA | [ ] | Zustand persist used across stores. |

## 2. User Portal (`app/(dashboard)`)

| Route | Backend | UI | Checklist | Notes |
|---|---|---|---|---|
| `/` | Partial | Compile-OK + Manual-QA | [ ] | Dashboard renders; data still mixed sources. |
| `/analytics` | Partial | Compile-OK + Manual-QA | [ ] | Visuals present; chart data largely mock/local. |
| `/calculators` | No (not backend-required) | Compile-OK + Manual-QA | [ ] | Primarily client-side calculators. |
| `/coaching` | Partial | Compile-OK + Manual-QA | [ ] | UI present; feed/client interactions still partially seeded. |
| `/coaching/[coachId]` | Partial | Compile-OK + Manual-QA | [ ] | Mock-driven profile details remain. |
| `/coaching/dashboard` | Partial | Compile-OK + Manual-QA | [ ] | Scaffolding exists; mixed data confidence. |
| `/community` | Partial | Compile-OK + Manual-QA | [ ] | Community APIs exist; some social behaviors still local/mock. |
| `/diary` | Partial | Compile-OK + Manual-QA | [ ] | Logging works; AI flow simulated. |
| `/exercises` | Partial | Compile-OK + Manual-QA | [ ] | Search/detail works; progression analytics mock-heavy. |
| `/goals` | Yes | Compile-OK + Manual-QA | [ ] | Goal CRUD backed by `/api/v1/goals`. |
| `/hydration` | Partial | Compile-OK + Manual-QA | [ ] | Hydration API exists; some aggregate visuals placeholder. |
| `/meal-planner` | Partial | Compile-OK + Manual-QA | [ ] | UX present; meal structures still mock-oriented. |
| `/messages` | Partial | Compile-OK + Manual-QA | [ ] | Message APIs exist; uploads/attachments still partial. |
| `/progress` | Partial | Compile-OK + Manual-QA | [ ] | Visualization present; some data placeholders. |
| `/settings` | Partial | Compile-OK + Manual-QA | [ ] | Account/preferences UI exists; many settings local-only. |
| `/subscription` | Partial | Compile-OK + Manual-QA | [ ] | Subscription API/simulated checkout exists; real billing incomplete. |
| `/timer` | No (not backend-required) | Compile-OK + Manual-QA | [ ] | Timer engine local; integrations mocked. |
| `/workout` | Yes | Compile-OK + Manual-QA | [ ] | Workout APIs and session flow integrated. |

## 3. Coach Portal (`app/coach`)

| Route | Backend | UI | Checklist | Notes |
|---|---|---|---|---|
| `/coach` | Partial | Compile-OK + Manual-QA | [ ] | Dashboard works; some actions still coming-soon. |
| `/coach/analytics` | Partial | Compile-OK + Manual-QA | [ ] | UI available; placeholders remain. |
| `/coach/broadcast` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/broadcast` + `/api/v1/coach/broadcast/history`. |
| `/coach/clients` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/clients` + status endpoint. |
| `/coach/clients/[clientId]` | Partial | Compile-OK + Manual-QA | [ ] | Detail page still has partial/coming-soon panels. |
| `/coach/content` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/content` for publish/list. |
| `/coach/forms` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/forms` + status/assign/delete routes. |
| `/coach/marketplace` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/marketplace` load/save. |
| `/coach/programs` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/programs` + assign/update routes. |
| `/coach/schedule` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/coach/schedule-events`. |
| `/coach/settings` | Partial | Compile-OK + Manual-QA | [ ] | Account tab API-backed; notifications/security/billing still partial. |

## 4. Admin Portal (`app/admin`)

| Route | Backend | UI | Checklist | Notes |
|---|---|---|---|---|
| `/admin` | Partial | Compile-OK + Manual-QA | [ ] | Metrics/search surface works; some summary cards not deeply wired. |
| `/admin/users` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/admin/users` + status/premium actions. |
| `/admin/coaches` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/admin/coaches`. |
| `/admin/applications` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/admin/applications` + status route with side effects. |
| `/admin/payments` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/admin/payments` + approve-pending route. |
| `/admin/content` | Yes (core) | Compile-OK + Manual-QA | [ ] | Moderation flow uses `/api/v1/admin/reports` routes. |
| `/admin/settings` | Yes (core) | Compile-OK + Manual-QA | [ ] | Uses `/api/v1/admin/settings`. |

## 5. Shared Functional Modules

| Module | Backend | UI | Checklist | Notes |
|---|---|---|---|---|
| Layout system (`AppShell`, `Sidebar`, `TopBar`) | Yes | Compile-OK + Manual-QA | [ ] | Stable shared UI shell. |
| Calculator widgets | No (not backend-required) | Compile-OK + Manual-QA | [ ] | Utility-driven client-side logic. |
| Coaching components (`ClientHub`, cards) | Partial | Compile-OK + Manual-QA | [ ] | Functional UI, mixed backing data. |
| Workout components (modals/drawers/timer pill) | Yes (workout domain) | Compile-OK + Manual-QA | [ ] | Integrated with workout flows. |
| Exercise detail sheet | Partial | Compile-OK + Manual-QA | [ ] | Visual analytics still mock-biased. |

## 6. Explicit "Coming Soon" Hotspots

| Hotspot | Status | Checklist | Notes |
|---|---|---|---|
| Coach broadcast filters | Incomplete by design | [ ] | Still marked limited/coming-soon behavior. |
| Coach client notes sidebar / actions modal | Incomplete by design | [ ] | Partial interaction surface only. |
| Coach planner creation action | Incomplete by design | [ ] | Action intentionally not fully implemented. |
| Client hub program viewer action | Incomplete by design | [ ] | Viewer action still pending full implementation. |

## 7. Integration Readiness Conclusion

- [x] Core Coach/Admin backend contract migration completed for high-impact flows.
- [x] Build and type checks pass.
- [x] No compile-blocking lint errors.
- [ ] Full UI regression/interaction QA still required before production signoff.
- [ ] Remaining product gaps are primarily planned partials, not unresolved API wiring blockers.

## Suggested Manual QA Pass (must-run)

- [ ] Auth: sign in/out by role and verify route guards.
- [ ] User: create/update/delete goals, hydration logs, workout session lifecycle, messages send/reactions.
- [ ] Coach: broadcast send/history, client status updates, create/edit/assign program, forms create/assign, schedule event create.
- [ ] Coach: settings save, marketplace save and reload persistence check.
- [ ] Admin: application approve/reject side effects, user status/premium toggles, payouts approval, moderation status transitions, settings save.
- [ ] Mobile + desktop responsive walkthrough for dashboard/coach/admin critical routes.
