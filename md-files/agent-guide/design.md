# design.md — Design System & Branding Rules for AI Agents
> Read this file before touching any UI: components, layouts, colors, typography, spacing,
> icons, animations, or copy. Every visual decision must trace back to a design token.
> Never hardcode visual values. Never deviate from the brand without explicit approval.

---

## 🎨 Brand Identity — Non-Negotiable

### Mission of the Visual Language
Every UI element communicates the brand before any user reads a word.
The design system exists to make that communication consistent, accessible, and intentional.

### Brand Voice in UI
- **Clear over clever** — labels, button text, and errors say exactly what they mean
- **Confident but not cold** — use active voice, avoid passive constructions
- **Concise** — every word earns its space; no filler, no padding words
- **Human** — avoid jargon, system language, and error codes in user-facing copy

---

## 🎨 Color System

### Core Palette — Use Tokens, Never Hex Values Directly

```css
/* tokens.css — single source of truth */
:root {
  /* Brand */
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-200: #bfdbfe;
  --color-brand-300: #93c5fd;
  --color-brand-400: #60a5fa;
  --color-brand-500: #3b82f6;  /* Primary */
  --color-brand-600: #2563eb;  /* Primary hover */
  --color-brand-700: #1d4ed8;
  --color-brand-800: #1e40af;
  --color-brand-900: #1e3a8a;

  /* Neutrals */
  --color-gray-50:  #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Semantic */
  --color-success:  #10b981;
  --color-warning:  #f59e0b;
  --color-error:    #ef4444;
  --color-info:     #3b82f6;

  /* Semantic surface aliases */
  --color-bg-primary:    var(--color-gray-50);
  --color-bg-secondary:  var(--color-gray-100);
  --color-bg-inverse:    var(--color-gray-900);
  --color-text-primary:  var(--color-gray-900);
  --color-text-muted:    var(--color-gray-500);
  --color-text-inverse:  var(--color-gray-50);
  --color-border:        var(--color-gray-200);
}

/* Dark mode — system-aware */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary:   var(--color-gray-900);
    --color-bg-secondary: var(--color-gray-800);
    --color-text-primary: var(--color-gray-50);
    --color-text-muted:   var(--color-gray-400);
    --color-border:       var(--color-gray-700);
  }
}
```

### Color Usage Rules

| Token Purpose | Use For | Never Use For |
|--------------|---------|--------------|
| `--color-brand-500` | Primary actions, links, active states | Decorative backgrounds |
| `--color-brand-600` | Hover state of primary | Default state |
| `--color-error` | Error messages, destructive actions | Warnings or info |
| `--color-warning` | Caution states, non-critical alerts | Errors |
| `--color-success` | Confirmations, completed states | In-progress states |
| `--color-text-muted` | Supporting text, placeholders | Primary content |

```typescript
// ❌ NEVER hardcode color values
<div style={{ color: '#3b82f6', background: '#f9fafb' }}>

// ✅ ALWAYS use CSS variables via Tailwind or CSS tokens
<div className="text-brand-500 bg-gray-50 dark:bg-gray-900">

// ✅ Or via CSS modules with tokens
.card { background: var(--color-bg-secondary); color: var(--color-text-primary); }
```

---

## 🔤 Typography System

### Type Scale — Never Invent New Sizes

```css
:root {
  /* Font families */
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Size scale (rem) */
  --text-xs:   0.75rem;   /*  12px */
  --text-sm:   0.875rem;  /*  14px */
  --text-base: 1rem;      /*  16px */
  --text-lg:   1.125rem;  /*  18px */
  --text-xl:   1.25rem;   /*  20px */
  --text-2xl:  1.5rem;    /*  24px */
  --text-3xl:  1.875rem;  /*  30px */
  --text-4xl:  2.25rem;   /*  36px */
  --text-5xl:  3rem;      /*  48px */

  /* Weight */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line height */
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Hierarchy

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title (h1) | `text-4xl` | `font-bold` | `leading-tight` |
| Section header (h2) | `text-3xl` | `font-semibold` | `leading-tight` |
| Card title (h3) | `text-xl` | `font-semibold` | `leading-snug` |
| Body text | `text-base` | `font-normal` | `leading-relaxed` |
| Supporting text | `text-sm` | `font-normal` | `leading-normal` |
| Labels / Captions | `text-xs` | `font-medium` | `leading-normal` |
| Code | `font-mono text-sm` | — | — |

---

## 📐 Spacing System

### 4px Base Grid — Every Measurement Is a Multiple

```css
:root {
  --space-0:   0;
  --space-1:   0.25rem;  /*  4px */
  --space-2:   0.5rem;   /*  8px */
  --space-3:   0.75rem;  /* 12px */
  --space-4:   1rem;     /* 16px */
  --space-5:   1.25rem;  /* 20px */
  --space-6:   1.5rem;   /* 24px */
  --space-8:   2rem;     /* 32px */
  --space-10:  2.5rem;   /* 40px */
  --space-12:  3rem;     /* 48px */
  --space-16:  4rem;     /* 64px */
  --space-20:  5rem;     /* 80px */
  --space-24:  6rem;     /* 96px */
}
```

### Spacing Conventions

| Context | Spacing |
|---------|---------|
| Within a component (padding) | `space-3` to `space-4` |
| Between related elements | `space-2` to `space-3` |
| Between sections | `space-8` to `space-12` |
| Page margins | `space-4` (mobile) → `space-8` (desktop) |
| Card padding | `space-4` to `space-6` |
| Form field gap | `space-4` |
| Button internal padding | `px-space-4 py-space-2` |

---

## 🔘 Component Design Rules

### Button Hierarchy
```typescript
// ✅ One primary action per screen/modal
// ✅ Clear visual hierarchy: Primary > Secondary > Ghost/Text

// Primary — brand action, one per context
<Button variant="primary">Save Changes</Button>

// Secondary — supporting action
<Button variant="secondary">Cancel</Button>

// Destructive — irreversible actions
<Button variant="destructive">Delete Account</Button>

// Ghost — low-emphasis, inline
<Button variant="ghost">Learn More</Button>
```

**Button Text Rules:**
- Always verb-first: "Save", "Create Project", "Delete Account"
- Never: "OK", "Yes", "Submit" — be specific about the action
- Destructive buttons must describe what is being destroyed

### Form Design
```typescript
// ✅ Always visible labels — never placeholder-only
<FormField>
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@company.com" />
  <FormDescription>We'll send a confirmation link.</FormDescription>
  <FormError>{errors.email?.message}</FormError>
</FormField>

// ❌ Never — placeholder as the only label (fails a11y and usability)
<Input placeholder="Email address" />
```

### Card Design
```typescript
// ✅ Consistent card anatomy
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Supporting context</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

---

## 🌙 Dark Mode — Required on All UI

```typescript
// ✅ Use CSS variable tokens — they flip automatically
// ✅ Use Tailwind dark: variant for overrides

// ❌ NEVER light-mode-only colors
<div className="bg-white text-black">

// ✅ Token-based (auto dark mode via CSS vars)
<div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">

// ✅ Tailwind approach
<div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
```

---

## ♿ Accessibility (a11y) — Baseline Requirements

```typescript
// ✅ Semantic HTML first — no div-soup
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// ✅ All interactive elements keyboard-accessible
<button
  onClick={handleAction}
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
  aria-label="Delete post"
  aria-pressed={isDeleted}
>
  <TrashIcon aria-hidden />
</button>

// ✅ Focus rings — never remove outline without a replacement
.focus-visible:focus {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}

// ✅ Color contrast — WCAG AA minimum
/* Normal text: 4.5:1 contrast ratio */
/* Large text (18px+): 3:1 contrast ratio */
/* UI components: 3:1 */

// ✅ Images always have meaningful alt text
<Image src="/hero.jpg" alt="Team collaborating in a modern office" />

// ✅ Screen reader only text when needed
<span className="sr-only">Loading…</span>

// ✅ Form errors linked to inputs
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">{errors.email?.message}</p>
```

---

## 🎭 Motion & Animation

```css
/* ✅ Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration:  0.01ms !important;
  }
}

/* ✅ Animation timing tokens */
:root {
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    350ms;
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Animation Principles:**
- Entrances: fast (100–200ms), ease-out
- Exits: faster than entrances (75–150ms)
- Page transitions: 200–350ms max
- Infinite animations: only for explicit loading states, never decoration
- Never animate layout-causing properties (top, left, width, height) — use `transform`

---

## 📱 Responsive Design

### Breakpoint System

```css
:root {
  /* Mobile-first breakpoints */
  /* sm:  640px  */
  /* md:  768px  */
  /* lg:  1024px */
  /* xl:  1280px */
  /* 2xl: 1536px */
}
```

### Responsive Rules
- **Mobile-first**: base styles are mobile, media queries add complexity
- **Content breakpoints**: break when the content demands it, not at arbitrary screen sizes
- **Touch targets**: minimum 44×44px for all interactive elements on mobile
- **No horizontal overflow**: test every layout at 320px width (minimum supported)
- **Typography scales**: use `clamp()` for fluid type where appropriate

```typescript
// ✅ Mobile-first responsive layout
<div className="
  grid grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  gap-4 sm:gap-6
">
```

---

## 🖼 Iconography

```typescript
// ✅ Use a single icon library — never mix
import { ArrowRight, Check, X, ChevronDown } from 'lucide-react'

// ✅ Icons are decorative when accompanied by text
<button>
  <ArrowRight className="w-4 h-4" aria-hidden="true" />
  <span>Continue</span>
</button>

// ✅ Icons are informative when standalone — require aria-label
<button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</button>

// ✅ Consistent icon sizing
// Inline (with text): w-4 h-4  (16px)
// Button icon:        w-5 h-5  (20px)
// Feature icon:       w-6 h-6  (24px)
// Hero/display icon:  w-8+ h-8+ (32px+)
```

---

## 📋 UI Copy Rules

| Context | Rule | Example |
|---------|------|---------|
| Empty states | Tell users what they can do, not what's missing | "Create your first project to get started" not "No projects found" |
| Error messages | Say what happened + what to do | "Email already in use. Try signing in instead." |
| Loading states | Describe the action, not a spinner | "Saving your changes…" |
| Confirmation dialogs | Repeat the action in the button | Dialog: "Delete 'My Project'?" Button: "Delete project" |
| Buttons | Verb-first, specific | "Save changes" not "Submit" |
| Tooltips | Explain what, not how to click | "Archived projects are hidden from your dashboard" |

---

## ✅ Design Checklist — Run Before Every PR

- [ ] All colors use design tokens — no hardcoded hex values
- [ ] All text uses the typography scale — no arbitrary font sizes
- [ ] All spacing uses the 4px grid — no arbitrary pixel values
- [ ] Dark mode implemented and tested
- [ ] Mobile layout tested at 320px, 375px, 768px, and 1280px
- [ ] All interactive elements have visible focus rings
- [ ] All images have descriptive alt text
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] `prefers-reduced-motion` respected in all animations
- [ ] Icons accompanied by text or have `aria-label`
- [ ] Forms have visible labels (not just placeholders)
- [ ] Empty, loading, and error states all designed and implemented
- [ ] Copy follows brand voice: clear, active, specific

---

> **Remember**: Design consistency builds trust. Every deviation from the system
> introduces friction — for users experiencing inconsistency,
> and for developers trying to maintain it. Follow the tokens. Follow the hierarchy.
