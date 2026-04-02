# SuperFit Branding Rules

Last updated: 2026-04-02
Owner: Product + Design + Frontend

## 1. Brand Core

SuperFit is a precision fitness operating system, not a generic wellness blog.

- Positioning: Data-driven fitness tracking with coaching and role-based operations.
- Personality: Confident, disciplined, practical, premium.
- Promise: Clear progress signals, minimal friction, consistent visual language.

## 2. Naming Rules

- Product name is always `SuperFit` (capital S + F).
- Internal short form `SF` is allowed for compact logo surfaces only.
- Do not invent alternate product names in UI copy.
- Roles are fixed labels: `User`, `Coach`, `Admin`.

## 3. Voice And Tone

- Use direct, useful language. Prefer "Start workout" over "Begin your journey".
- Prioritize action-oriented labels in buttons and headers.
- Keep microcopy short, specific, and measurable.
- Avoid exaggerated claims like "guaranteed" or "instant transformation".
- Avoid novelty slang in production copy.

## 4. Visual Identity Rules

SuperFit uses a token-first design system backed by CSS variables in `app/globals.css`.

- Primary accent is green (`--accent`) and its defined token variants.
- Do not introduce ad-hoc brand colors for core actions.
- Use semantic status tokens for warning, danger, and info states.
- Prefer layered surfaces and subtle borders over heavy shadow noise.

## 5. Typography Rules

Use font variables configured in root layout:

- Display: DM Sans (`--font-display`)
- Body: Inter (`--font-body`)
- Mono/Timer: JetBrains Mono (`--font-mono`)

Rules:

- Page titles and key metric headers use display font.
- Form labels, body copy, and table text use body font.
- Timer values and precision numeric outputs use mono font.

## 6. UI Behavior Rules

- Sidebars must preserve the 64px collapsed and 240px expanded model where applicable.
- Top-level navigation labels must match route intent and stay concise.
- Theme switching supports `dark` and `light` only.
- Empty states should be honest about status (MVP, mocked, or pending), never disguised as final.

## 7. Copywriting Rules By Context

- Dashboard cards: 1 concise metric title + clear unit.
- Forms: imperative labels and explicit validation messages.
- Notifications: factual event + timeframe.
- Coach/Admin tools: operational language, no consumer marketing tone.

## 8. Content Integrity Rules

- Documentation must separate `implemented`, `partial`, and `planned` states.
- When behavior is mocked, label it as mocked.
- Never claim integrations or production backends that do not exist in code.

## 9. Accessibility And Inclusivity

- Maintain readable contrast in both themes.
- Do not rely on color alone to indicate status.
- Use clear labels for controls and avoid ambiguous icon-only actions.
- Keep inclusive language for all users and fitness levels.

## 10. Enforcement Checklist

Before merging brand-impacting changes, verify:

1. New UI uses existing design tokens and typography variables.
2. New copy matches SuperFit tone and role context.
3. Any mocked behavior is clearly indicated.
4. Route labels, page titles, and navigation naming remain consistent.
5. Documentation updates reflect the real implementation state.
