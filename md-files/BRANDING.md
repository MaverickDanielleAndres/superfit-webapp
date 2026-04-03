# SuperFit Branding Guide

Last updated: 2026-04-03
Scope: Product UI, product copy, and documentation surfaces

## 1. Brand Core

SuperFit is a precision fitness operating system.

- Positioning: Data-driven fitness tracking with coaching and role-based operations.
- Personality: Confident, disciplined, practical, premium.
- Promise: Clear progress signals, low-friction workflows, and consistent cross-portal UX.

## 2. Naming Rules

- Product name must always be `SuperFit`.
- `SF` is allowed only in compact logo contexts.
- Role labels are fixed: `User`, `Coach`, `Admin`.
- Route and navigation labels should be direct and task-oriented.

## 3. Voice And Tone

- Prefer direct action language: `Start workout`, `Save changes`, `Review application`.
- Keep labels concise and operational.
- Avoid hype or guaranteed-outcome language.
- Keep coach/admin copy operational, not marketing-heavy.

## 4. Visual System Rules

SuperFit uses a token-first visual system from `app/globals.css`.

- Use only approved CSS variables for production UI colors.
- Primary action color must use accent tokens (`--accent` and related variants).
- Status states must use semantic status tokens (`--status-success`, `--status-warning`, `--status-danger`, `--status-info`).
- Prefer layered surfaces and subtle borders over heavy shadow-heavy treatments.

## 5. Typography Rules

Fonts are defined in `app/layout.tsx`:

- Display: DM Sans (`--font-display`)
- Body: Inter (`--font-body`)
- Mono: JetBrains Mono (`--font-mono`)

Usage:

- Use display for page titles and metric headlines.
- Use body for controls, tables, and explanatory copy.
- Use mono for timers and precision numeric readouts.

## 6. Layout And Navigation Rules

- Keep sidebar behavior consistent with existing shell patterns (collapsed and expanded states).
- Maintain route naming consistency across User/Coach/Admin portals.
- Theme support remains `dark` default with `light` optional.
- Empty states must be explicit about real status (`Implemented`, `Partial`, or `Planned`).

## 7. Accessibility Baseline

- Maintain readable contrast in both dark and light themes.
- Do not use color alone to communicate status.
- Use clear labels and avoid ambiguous icon-only actions where possible.
- Preserve touch-friendly click targets in mobile layouts.

## 8. Branding QA Checklist

Before merging brand-impacting work, verify:

1. New UI uses existing tokens and approved font variables.
2. New copy matches role context and SuperFit voice.
3. Navigation labels remain concise and consistent.
4. Documentation reflects actual implementation status (no inflated claims).
5. Visual updates remain consistent across User, Coach, and Admin surfaces.

## 9. Source References

- `brandingrules.md`
- `md-files/superfit-design-system.md`
- `SYSTEM_DOCUMENTATION.md`
- `md-files/superfit-system-documentation.md`
