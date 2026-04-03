# SUPERFIT Copilot Agent Contract

Last updated: 2026-04-02
Scope: All SuperFit engineering sessions

## 1. Mission

You are implementing SuperFit as a production-grade, Supabase-backed platform across User, Coach, and Admin portals.

Session objectives:

1. Read required guidance files before coding.
2. Prioritize performance and backend wiring over mock expansion.
3. Replace no-op interactions with real, traceable behavior.
4. Leave the repo cleaner, safer, and more connected each session.

## 2. Non-Negotiables

Never do the following:

- Skip required guide-file reading.
- Leave TypeScript errors unresolved.
- Leave Tailwind class/token breakage unresolved.
- Apply DB schema changes without a migration file.
- Use "coming soon"/no-op click handlers as final behavior.
- Claim production integrations that are not implemented.

## 3. Required Read Order

At session start, read in this order:

1. `md-files/agent-guide/COPILOT.md`
2. `md-files/superfit-system-documentation.md`
3. `md-files/superfit-all-functionalities-list.md`
4. `md-files/superfit-design-system.md`
5. `md-files/agent-guide/AGENTS.md`
6. `md-files/agent-guide/backend.md`
7. `md-files/agent-guide/frontend.md`
8. `md-files/agent-guide/security.md`
9. `md-files/agent-guide/performance.md`
10. `md-files/agent-guide/production.md`
11. `md-files/agent-guide/design.md`

## 4. Supabase Is The Primary Backend

Use Supabase for auth, persistence, policies, realtime, and edge functions.

- Inspect schema before proposing table changes.
- Use migration files under `supabase/migrations/`.
- Apply migrations only after review.
- Regenerate and commit types after schema changes.

## 5. Performance-First Execution

Fix route-switch lag before broad feature work.

Required baseline actions:

1. Add route-level `loading.tsx` skeletons.
2. Dynamic-import heavy charts and large modals/drawers.
3. Improve nav prefetch behavior on primary sidebars.
4. Add Next package import optimization.
5. Avoid unnecessary client components.

## 6. Migration Protocol

Every DB change follows this order:

1. Inspect existing schema.
2. Write migration SQL file with timestamped name.
3. Review for compatibility and rollback safety.
4. Apply migration.
5. Regenerate TS DB types.
6. Update stores/hooks/components impacted by schema change.

## 7. Feature Phases

Execution order:

- Phase 0: Foundation (Supabase, auth/middleware, performance baseline)
- Phase 1: Core user data features (goals/workouts/hydration/diary/onboarding)
- Phase 2: Realtime messaging and community
- Phase 3: Coach portal completion
- Phase 4: Admin portal completion
- Phase 5: Edge functions and webhooks
- Phase 6: Final quality, accessibility, and production hardening

## 8. Button Completion Rule

Every button must do one of:

1. Trigger a real data operation.
2. Navigate to a functional route.
3. Open a workflow surface that leads to a real operation.

Unacceptable final handlers:

- `console.log(...)`
- empty callbacks
- permanent `toast('coming soon')`

## 9. Validation Gate

Before closing a feature slice:

1. `npx tsc --noEmit`
2. `npx next build`
3. `npx next lint`
4. Ensure generated Supabase types are current after schema changes.

## 10. PR and Commit Guidance

Use small, phase-aligned PR slices.

Commit format:

`type(scope): description`

Types:

- `feat`, `fix`, `perf`, `refactor`, `chore`, `db`, `realtime`

Common scopes:

- `auth`, `goals`, `workout`, `messaging`, `community`, `coaching`, `admin`, `performance`, `design`
