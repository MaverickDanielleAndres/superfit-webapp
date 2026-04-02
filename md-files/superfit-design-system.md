# SuperFit Design System

Last updated: 2026-04-02
Source of truth: `app/globals.css`, root layout fonts, and active layout components

## 1. Design Intent

SuperFit UI should feel like a precision training console:

- Dense but readable information hierarchy
- Strong metric visibility
- Premium dark-first visual language
- Consistent interaction patterns across user, coach, and admin surfaces

## 2. Theming Model

Theme is class-driven using `next-themes`:

- Default theme: `dark`
- Alternate theme: `light`
- System preference sync: disabled (`enableSystem={false}`)

## 3. Token System

All colors should come from CSS variables exposed through Tailwind v4 theme mapping.

### 3.1 Surface Tokens

- `--bg-base`
- `--bg-surface`
- `--bg-surface-alt`
- `--bg-elevated`
- `--bg-overlay`

### 3.2 Text Tokens

- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-inverse`

### 3.3 Border Tokens

- `--border-subtle`
- `--border-default`
- `--border-strong`

### 3.4 Accent And Status Tokens

- Accent: `--accent`, `--accent-hover`, `--accent-dim`, `--accent-bg`, `--accent-bg-strong`
- Status: `--status-success`, `--status-warning`, `--status-danger`, `--status-info`, `--status-purple`

### 3.5 Chart Tokens

- `--chart-green`, `--chart-blue`, `--chart-amber`, `--chart-red`, `--chart-purple`
- `--chart-grid`, `--chart-axis`

### 3.6 Sidebar Tokens

- `--sidebar-bg`
- `--sidebar-active-bg`
- `--sidebar-active-text`
- `--sidebar-inactive`
- `--sidebar-icon-active`
- `--sidebar-border`

## 4. Typography

Defined in `app/layout.tsx` through next/font variables:

- Display: DM Sans (`--font-display`)
- Body: Inter (`--font-body`)
- Mono: JetBrains Mono (`--font-mono`)

### Usage Rules

- Use display font for page titles, metric headlines, and key section headers.
- Use body font for form controls, table rows, and explanatory copy.
- Use mono font for timers and precision numeric readouts.

## 5. Core Layout Rules

### 5.1 User/Coach Shell

- Left sidebar width:
  - Expanded: 240px
  - Collapsed: 64px
- Main panel padding:
  - TopBar height: 64px (user shell)
  - Content padding: 24px to 28px depending on breakpoint

### 5.2 Admin Shell

- Fixed left sidebar: 240px
- Main panel left padding: 240px

### 5.3 Collapse Behavior

- Sidebar collapse state comes from `useUIStore` and persists.
- Collapsed state uses icon-first navigation with hover tooltips.

## 6. Shape, Spacing, And Visual Rhythm

- Card radius patterns commonly used: 10px, 12px, 16px, 20px, 24px.
- Preferred card treatment: subtle border + layered surface, not heavy global shadows.
- Inputs generally follow 44px to 52px heights depending on context.

## 7. Motion Guidelines

Framer Motion is used for page and component transitions.

- Keep transitions short and purposeful.
- Preserve readability during animated state changes.
- Avoid novelty motion that reduces scan speed of metrics.

## 8. Component-Level Conventions

### 8.1 Buttons

- Primary action buttons should use accent token colors.
- Secondary actions should remain surface/border based.
- Danger actions should use status-danger tokens.

### 8.2 Inputs

- Inputs use elevated/surface backgrounds and border tokens.
- Focus state should use accent-based border/ring feedback.
- Placeholder text should stay in tertiary text token range.

### 8.3 Navigation

- Active navigation state must be visually distinct in all themes.
- Icon and label combinations should remain concise and consistent with route names.

## 9. Accessibility Baseline

- Maintain sufficient contrast in both themes.
- Do not rely on color alone to communicate status.
- Keep clickable targets comfortably sized for pointer and touch use.

## 10. Anti-Patterns To Avoid

- Hardcoded one-off colors that bypass token system.
- Font changes outside approved display/body/mono stack.
- Mixing multiple unrelated visual styles in a single flow.
- Treating mocked visuals as production-complete in documentation.
