# SuperFit — Complete Design System & UI Specification
## Version 1.0 | Senior UI/UX Reference Document

> **Single Source of Truth for all visual, layout, spacing, typography, color, component, animation, and interaction decisions.**
> **Desktop layout authority: Image 1 (Dark Dashboard) + Image 3 (Coaching Web Platform)**
> **Mobile layout authority: Image 2 (Workout Schedule — left phone = content, right phone = empty state)**
> This document governs every pixel. No deviation permitted without design review.

---

## TABLE OF CONTENTS

1. [Design Philosophy & Visual Identity](#1-design-philosophy)
2. [Color System — Full Token Set](#2-color-system)
3. [Typography System — Fonts, Scale, Rules](#3-typography-system)
4. [Spacing & Grid System](#4-spacing--grid-system)
5. [Desktop Layout Anatomy](#5-desktop-layout-anatomy)
6. [Mobile Layout Anatomy](#6-mobile-layout-anatomy)
7. [Component Library — Exact Specifications](#7-component-library)
8. [Icon System](#8-icon-system)
9. [Motion & Animation System](#9-motion--animation-system)
10. [Dark Mode Specification](#10-dark-mode-specification)
11. [Light Mode Specification](#11-light-mode-specification)
12. [Responsive Breakpoint System](#12-responsive-breakpoint-system)
13. [Form Elements & Input Design](#13-form-elements--input-design)
14. [Chart & Data Visualization Design](#14-chart--data-visualization-design)
15. [Page-by-Page Layout Blueprints](#15-page-by-page-layout-blueprints)
16. [Accessibility Standards](#16-accessibility-standards)
17. [Asset & Media Guidelines](#17-asset--media-guidelines)

---

## 1. Design Philosophy

### 1.1 Core Aesthetic Direction

SuperFit operates in two visual modes that are two expressions of one identity — not two different products.

**Dark Mode (Primary / Default) — drawn directly from Image 1:**
- Deep near-black backgrounds with subtle layered card elevation
- Bright white headings (high contrast), warm gray secondary text
- Single electric green accent that cuts through every screen
- Data visualizations glow softly against dark backgrounds
- Cards appear to float via layered darkness, not drop shadows

**Light Mode (Secondary) — drawn from Image 3:**
- Pure white backgrounds with very light gray cards
- Near-black text for maximum readability
- Same green accent, appearing more vibrant against white
- Generous white space — content breathes
- Subtle 1px gray borders defining card boundaries

### 1.2 Design Personality
`Precise` · `Athletic` · `Data-Forward` · `Professional` · `Focused`

### 1.3 What SuperFit is NOT
- Not playful or cartoonish
- Not purple-gradient generic SaaS
- Not pastel health-app soft
- Not overloaded with gradients everywhere
- Green is used sparingly and intentionally

### 1.4 One Non-Negotiable Rule
Every page must feel like a fitness professional's precision tool. Clean, confident, data-rich without clutter. Every element earns its place.

---

## 2. Color System

### 2.1 CSS Custom Properties — Full Token Set

```css
/* ═══════════════════════════════════════════════════
   DARK MODE — PRIMARY (Image 1 Reference)
   ═══════════════════════════════════════════════════ */
.dark {
  /* ── Backgrounds: layered depth ── */
  --bg-base:          #0a0a0a;   /* Page bg — true near-black */
  --bg-surface:       #111111;   /* Card background */
  --bg-surface-alt:   #161616;   /* Nested sections, code areas */
  --bg-elevated:      #1a1a1a;   /* Hover bg, dropdowns, tooltips */
  --bg-overlay:       rgba(0,0,0,0.72); /* Modal backdrop */

  /* ── Borders ── */
  --border-subtle:    #1f1f1f;   /* Card borders — barely visible */
  --border-default:   #2a2a2a;   /* Form fields, table lines */
  --border-strong:    #3a3a3a;   /* Focus states */

  /* ── Text ── */
  --text-primary:     #fafafa;   /* Headings, metric values */
  --text-secondary:   #a3a3a3;   /* Labels, descriptions */
  --text-tertiary:    #525252;   /* Placeholders, timestamps */
  --text-inverse:     #0a0a0a;   /* Text on green buttons */

  /* ── Accent: Electric Green ── */
  --accent:           #22c55e;   /* Primary: active nav, CTAs, rings */
  --accent-hover:     #16a34a;   /* Hover state */
  --accent-dim:       #166534;   /* Icon bg, subtle highlights */
  --accent-bg:        rgba(34,197,94,0.10);  /* Tint for selected cards */
  --accent-bg-strong: rgba(34,197,94,0.18);  /* Stronger tint */

  /* ── Status ── */
  --status-success:   #22c55e;
  --status-warning:   #f59e0b;
  --status-danger:    #ef4444;
  --status-info:      #3b82f6;
  --status-purple:    #a855f7;   /* Heart rate line, special metrics */

  /* ── Charts ── */
  --chart-green:      #22c55e;   /* Calories / primary metric */
  --chart-blue:       #60a5fa;   /* Protein */
  --chart-amber:      #fbbf24;   /* Carbs */
  --chart-red:        #f87171;   /* Fat */
  --chart-purple:     #c084fc;   /* Heart rate */
  --chart-grid:       #1f1f1f;   /* Grid lines */
  --chart-axis:       #525252;   /* Axis labels */

  /* ── Sidebar specifics (Image 1 exact) ── */
  --sidebar-bg:           #0f0f0f;
  --sidebar-active-bg:    #1a1a1a;
  --sidebar-active-text:  #ffffff;
  --sidebar-inactive:     #737373;
  --sidebar-icon-active:  #22c55e;
  --sidebar-border:       #1a1a1a;
}

/* ═══════════════════════════════════════════════════
   LIGHT MODE — SECONDARY (Image 3 Reference)
   ═══════════════════════════════════════════════════ */
.light {
  /* ── Backgrounds ── */
  --bg-base:          #ffffff;
  --bg-surface:       #f9f9f9;
  --bg-surface-alt:   #f3f4f6;
  --bg-elevated:      #ffffff;
  --bg-overlay:       rgba(0,0,0,0.45);

  /* ── Borders ── */
  --border-subtle:    #e5e7eb;
  --border-default:   #d1d5db;
  --border-strong:    #9ca3af;

  /* ── Text ── */
  --text-primary:     #0a0a0a;
  --text-secondary:   #4b5563;
  --text-tertiary:    #9ca3af;
  --text-inverse:     #ffffff;

  /* ── Accent (slightly darker for light bg contrast) ── */
  --accent:           #16a34a;
  --accent-hover:     #15803d;
  --accent-dim:       #bbf7d0;
  --accent-bg:        rgba(22,163,74,0.08);
  --accent-bg-strong: rgba(22,163,74,0.15);

  /* ── Status ── */
  --status-success:   #16a34a;
  --status-warning:   #d97706;
  --status-danger:    #dc2626;
  --status-info:      #2563eb;
  --status-purple:    #9333ea;

  /* ── Charts ── */
  --chart-green:      #16a34a;
  --chart-blue:       #2563eb;
  --chart-amber:      #d97706;
  --chart-red:        #dc2626;
  --chart-purple:     #9333ea;
  --chart-grid:       #e5e7eb;
  --chart-axis:       #9ca3af;

  /* ── Sidebar/Nav ── */
  --sidebar-bg:           #ffffff;
  --sidebar-active-bg:    #f0fdf4;
  --sidebar-active-text:  #15803d;
  --sidebar-inactive:     #6b7280;
  --sidebar-icon-active:  #16a34a;
  --sidebar-border:       #e5e7eb;
}
```

### 2.2 Color Usage Rules — NON-NEGOTIABLE

| Context | Token | Rule |
|---|---|---|
| Page background | `--bg-base` | Never deviate |
| All card backgrounds | `--bg-surface` | Every single card |
| Second-level nested cards | `--bg-elevated` | Inside a card only |
| Primary CTA buttons | `--accent` fill + `--text-inverse` text | Solid fill, zero gradient |
| Active nav background | `--sidebar-active-bg` | Rounded, not full-width block |
| Active nav icon | `--sidebar-icon-active` | Icon only, not label |
| All progress fills | `--accent` | Bars, rings, arcs — always green |
| Calories metric | `--chart-green` | |
| Protein metric | `--chart-blue` | |
| Carbs metric | `--chart-amber` | |
| Fat metric | `--chart-red` | |
| Heart rate data | `--chart-purple` | |
| Positive trend | `--status-success` | Arrow + % |
| Negative / over limit | `--status-danger` | |
| Approaching limit | `--status-warning` | 70–99% of limit |
| Dividers | `--border-subtle` | 1px solid |
| Input borders | `--border-default` | |
| Input focus | `--accent` border + `--accent-bg` shadow | |

### 2.3 Green Accent — Strict Usage Rules

✅ USE GREEN FOR:
- Active/selected navigation icon
- Active nav item left border indicator (3px)
- Primary CTA buttons (solid fill)
- All progress rings and bars
- Completion checkmarks
- Goal-met badges
- Positive trend indicators
- Streak counters and achievements
- Selected chips and toggles
- Active workout timer ring
- Hydration ring fill

DO NOT USE GREEN FOR:
- Body text
- Card backgrounds (except selected/active state)
- Secondary or ghost buttons
- Non-interactive decorative borders
- More than one large element per card simultaneously
- Any gradient (no green gradients, ever)

---

## 3. Typography System

### 3.1 Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --font-display: 'DM Sans', -apple-system, sans-serif;
  --font-body:    'Inter', -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}
```

Why these exact fonts:
- **DM Sans** — Geometric, slightly rounded, optical sizing support. Makes large metric numbers (73 kg, 87%) look beautiful and precise.
- **Inter** — The benchmark for UI legibility at 11–15px. Used for all functional text.
- **JetBrains Mono** — Timer countdowns and calculator outputs need technical precision.

### 3.2 Type Scale — Exact Sizes, Weights, Tracking

```css
/* ── Display: Hero metrics, large numbers ── */
.display-2xl { font-family: var(--font-display); font-size: 4rem;    font-weight: 800; line-height: 1.0;  letter-spacing: -0.05em; }
.display-xl  { font-family: var(--font-display); font-size: 3.5rem;  font-weight: 700; line-height: 1.0;  letter-spacing: -0.04em; }
.display-lg  { font-family: var(--font-display); font-size: 2.75rem; font-weight: 700; line-height: 1.1;  letter-spacing: -0.03em; }
.display-md  { font-family: var(--font-display); font-size: 2.25rem; font-weight: 700; line-height: 1.15; letter-spacing: -0.025em; }
.display-sm  { font-family: var(--font-display); font-size: 1.875rem;font-weight: 700; line-height: 1.2;  letter-spacing: -0.02em; }

/* ── Headings ── */
.h1 { font-family: var(--font-display); font-size: 1.75rem;  font-weight: 700; line-height: 1.2;  letter-spacing: -0.02em; }
.h2 { font-family: var(--font-display); font-size: 1.5rem;   font-weight: 600; line-height: 1.25; letter-spacing: -0.015em; }
.h3 { font-family: var(--font-display); font-size: 1.25rem;  font-weight: 600; line-height: 1.3;  letter-spacing: -0.01em; }
.h4 { font-family: var(--font-body);    font-size: 1.0625rem;font-weight: 600; line-height: 1.35; letter-spacing: -0.005em; }
.h5 { font-family: var(--font-body);    font-size: 0.9375rem;font-weight: 600; line-height: 1.4;  letter-spacing: 0; }

/* ── Body ── */
.body-lg { font-family: var(--font-body); font-size: 1.0625rem; font-weight: 400; line-height: 1.65; }
.body    { font-family: var(--font-body); font-size: 0.9375rem; font-weight: 400; line-height: 1.6;  } /* 15px primary */
.body-sm { font-family: var(--font-body); font-size: 0.875rem;  font-weight: 400; line-height: 1.55; } /* 14px */

/* ── UI Labels ── */
.label-lg { font-family: var(--font-body); font-size: 0.875rem;  font-weight: 500; line-height: 1.4; letter-spacing: 0.005em; }
.label    { font-family: var(--font-body); font-size: 0.8125rem; font-weight: 500; line-height: 1.4; letter-spacing: 0.01em; }
.label-sm { font-family: var(--font-body); font-size: 0.75rem;   font-weight: 500; line-height: 1.3; letter-spacing: 0.02em; }

/* ── Overline (ALL CAPS section labels) ── */
.overline { font-family: var(--font-body); font-size: 0.6875rem; font-weight: 600; line-height: 1.2; letter-spacing: 0.08em; text-transform: uppercase; }

/* ── Monospace: timers, calculator outputs ── */
.timer-xl { font-family: var(--font-mono); font-size: 5rem;   font-weight: 600; line-height: 1.0; letter-spacing: -0.02em; }
.timer-lg { font-family: var(--font-mono); font-size: 3rem;   font-weight: 600; line-height: 1.0; letter-spacing: -0.02em; }
.timer-md { font-family: var(--font-mono); font-size: 1.75rem;font-weight: 600; line-height: 1.0; }
.mono     { font-family: var(--font-mono); font-size: 0.875rem;font-weight: 400; line-height: 1.5; }
```

### 3.3 Typography Usage Rules

- One `.h1` per page maximum — the page title
- `.h2` for major section headers within a page
- `.h3` for card titles
- `.overline` always appears ABOVE a heading (never standalone)
- All metric values on dashboard use `.display-md` or larger with `var(--font-display)`
- Unit labels next to numbers: `.label` weight in `--text-secondary`
- Timer countdowns: `.timer-xl` or `.timer-lg` in `var(--font-mono)`
- Maximum 65 characters per line for body text

---

## 4. Spacing & Grid System

### 4.1 Spacing Scale (4px Base)

```
2px  → micro gap between icon and text
4px  → tightest useful spacing
6px  → between badge and surrounding content
8px  → tight internal padding
10px → small component inner padding
12px → standard gap in compact areas
14px → between list items
16px → default component padding / section gap
20px → standard card padding (p-5)
24px → generous card padding / between card rows
28px → main content area horizontal padding (desktop)
32px → section-to-section gap (mobile)
40px → large section gap
48px → page section vertical margin
64px → major layout section separation
80px → hero-level spacing
```

### 4.2 Desktop Layout Grid (Image 1 Reference)

```
Total viewport width (e.g., 1440px)
└── Sidebar: 240px (fixed left)
└── Main content: 1200px (flex-1)
      └── Padding: 24px top, 28px left/right
      └── Top bar: 64px height
      └── Content: calc(100vh - 64px - 24px)

Content inner grid (dashboard):
├── Metric cards row: flex, 4 items, 16px gap between each
├── Main grid: grid-cols-[1.2fr_1fr], 16px gap
├── Secondary grid: grid-cols-[1.2fr_1fr], 16px gap
└── Full-width row: 100% width card
```

### 4.3 Mobile Grid (Image 2 Reference)

```
Viewport: 375px–430px (standard phones)
├── TopBar: 60px height, full width
├── Content: width 100%, padding 0 16px
├── Bottom Nav: 64px fixed, full width
└── Scrollable area: calc(100vh - 60px - 64px)

Card grid options for mobile:
├── Single column: 100% width (default for content cards)
├── Two column: calc(50% - 6px) each, 12px gap (for metric cards, small stats)
└── Horizontal scroll: cards with fixed width, no wrap
```

### 4.4 Consistent Card Padding Per Context

| Card Type | Desktop Padding | Mobile Padding |
|---|---|---|
| Metric card (small, fixed height) | 20px | 16px |
| Standard content card | 24px | 20px |
| Large feature card (ring, chart) | 24px | 20px |
| List item within a card | 12px vertical, 16px horizontal | 12px all |
| Section label within a card | 0 0 12px 0 (bottom margin) | same |

---

## 5. Desktop Layout Anatomy

### 5.1 Sidebar — Exact Pixel Specification (Image 1)

**Container:**
```
position:   fixed
top:        0
left:       0
width:      240px (expanded) / 64px (collapsed)
height:     100vh
z-index:    40
background: var(--sidebar-bg)  ← #0f0f0f dark / #ffffff light
border-right: 1px solid var(--sidebar-border)
overflow:   hidden
transition: width 250ms cubic-bezier(0.16, 1, 0.3, 1)
```

**Section 1 — Logo Header (72px tall):**
```
padding:    0 16px
height:     72px
display:    flex, align-items: center, gap: 10px

[SF Icon]  32px × 32px square, border-radius: 8px, background: --accent
           "SF" text: DM Sans 700, 14px, white, centered inside
[Brand]    "SuperFit" — DM Sans 700, 18px, --text-primary
           (hidden when sidebar collapsed)
```

**Section 2 — User Block (72px tall):**
```
padding:    0 16px
height:     72px
display:    flex, align-items: center, gap: 10px

[Avatar]   36px × 36px, rounded-full, object-fit: cover
[Text]     Stacked:
           Name:     Inter 500, 14px, --text-primary
           Username: Inter 400, 12px, --text-tertiary
           [PRO]     rounded-full pill, 20px height, 8px padding,
                     Inter 700, 10px, UPPERCASE,
                     background: --accent-bg, color: --accent
           (Text + badge hidden when collapsed)
```

**Separator:** 1px `--border-subtle`, margin: 8px 16px

**Section Label ("MAIN MENU"):**
```
margin:     12px 16px 8px
display:    flex, justify-content: space-between, align-items: center
Text:       overline style — Inter 600, 11px, uppercase, letter-spacing 0.08em, --text-tertiary
Icon:       Edit icon, 14px, --text-tertiary
(Hidden when collapsed)
```

**Navigation Items — each 44px tall:**
```
display:    flex, align-items: center
height:     44px
padding:    0 12px
margin:     2px 8px  ← gives rounded pill gap from edges
border-radius: 10px
gap:        10px
cursor:     pointer
transition: background 120ms ease, color 120ms ease

[Icon]  18px Lucide icon, currentColor
[Label] Inter 500, 14px (hidden when collapsed)
```

**Inactive nav item:**
```
background: transparent
icon color: --sidebar-inactive  (#737373 dark)
label color: --sidebar-inactive
```

**Active nav item (Image 1: "Dashboard" highlighted):**
```
background: --sidebar-active-bg  (#1a1a1a dark / #f0fdf4 light)
icon color: --sidebar-icon-active  (#22c55e)
label color: --sidebar-active-text  (#ffffff dark / #15803d light)
font-weight: 600
```

**Hover state:**
```
background: --bg-elevated
transition: 120ms
```

**Sidebar Navigation Items (exact order from Image 1):**

Section "MAIN MENU":
1. `LayoutDashboard` → Dashboard
2. `BarChart3`       → Analytics
3. `Target`         → Goals
4. `CalendarDays`   → Timelines

Section "Settings & Help":
5. `Settings`       → Settings
6. `Paintbrush`     → Appearance
7. `HelpCircle`     → Support

**Community card (bottom of sidebar, pinned):**
```
position:  absolute, bottom: 0, left: 0, right: 0
padding:   16px
card:      --bg-elevated bg, rounded-xl, 12px padding

[Avatar group] 3 circular avatars (28px each) overlapping by 8px
               + green circle with + icon (20px) overlapping last avatar
[Text]  "Join the community and find out more"
        Inter 400, 12px, --text-secondary

(Replaced by just a users icon when collapsed)
```

**Collapse toggle button:**
```
position:  absolute, bottom: 16px + community card height, right: -12px
width:     24px, height: 24px, rounded-full
background: --bg-elevated
border:    1px solid --border-default
icon:      ChevronLeft (14px) → rotates 180° when collapsed
z-index:   1 (sits on the border between sidebar and content)
```

### 5.2 Main Content — TopBar (Image 1 Reference)

```
height:       64px
position:     sticky, top: 0, z-index: 30
background:   var(--bg-base)  ← same as page, no elevation
border-bottom: none  ← open, no line
padding:      0 28px
display:      flex, align-items: center, justify-content: space-between
```

**Left block:**
```
[Greeting line 1] "Good morning"  — label, 13px, --text-secondary
[Greeting line 2] "Welcome Back !" — DM Sans 600, 20px, --text-primary
(Line 2 changes by time: Good morning 5am–12pm | Good afternoon 12–5pm | Good evening 5pm+)
```

**Right icon row (from Image 1 exact):**
```
gap: 4px
Each icon button: 40px × 40px, rounded-full, hover: --bg-elevated bg

1. Search icon (Search, 20px)
2. Message icon (MessageCircle, 20px) 
3. Notification bell (Bell, 20px) with badge:
   Badge: 18px × 18px, rounded-full, --accent bg, white text, Inter 700 10px
   Badge content: "2" (notification count)
   Badge position: absolute, -4px top, -4px right of the icon button
4. Settings icon (Settings2, 20px)
5. Theme toggle (Moon/Sun, 20px)

icon color: --text-secondary
hover icon color: --text-primary
```

### 5.3 Metric Cards Row — Exact Specification (Image 1)

4 equal-width cards in a flex row, 16px gap between each.

**Container:**
```
display:   flex
gap:       16px
margin-bottom: 16px
```

**Each card:**
```
background:    --bg-surface  (#111111)
border:        1px solid --border-subtle  (#1f1f1f)
border-radius: 20px
padding:       20px
flex:          1
height:        90px
position:      relative
min-width:     0  ← prevents flex overflow
```

**Card internal layout:**
```
[Title row]  title text (label, 13px, --text-secondary) | [icon container] absolute top-right

[Value row]  value (DM Sans 700, 28px, --text-primary) + unit (Inter 400, 13px, --text-secondary, 4px gap)

[Trend]      position: absolute, bottom: 16px, right: 16px
             ↑ + % value  Inter 500, 12px
             Green if positive, red if negative
```

**Icon container (top-right):**
```
position:      absolute, top: 16px, right: 16px
width:         34px, height: 34px
border-radius: 10px
background:    --bg-elevated
display:       flex, align-items: center, justify-content: center
icon size:     17px, color: --text-secondary
```

**The 4 cards from Image 1:**

| # | Title | Icon | Value | Unit | Trend |
|---|---|---|---|---|---|
| 1 | Weight balance | `Weight` | 73 | kg | ↑ 0.22% |
| 2 | Heart rate | `HeartPulse` | 90 | bpm | (none) |
| 3 | Hydration level | `Droplets` | 86 | % | ↑ 3.06% |
| 4 | Blood cells / Calories | `Activity` | 1,100 | ul | ↑ 2.22% |

### 5.4 Macro Ring Card — Pixel Specification (Image 1)

```
Card: full width of left column
height: auto (approx 280px)
padding: 24px
```

**Internal layout: flex row**
```
Left (SVG ring area): width 180px, flex-shrink: 0
Right (legend): flex-1, padding-left: 24px, display: flex, flex-direction: column, justify-content: center
```

**SVG Ring (left):**
```
viewBox: "0 0 160 160"
width: 160px, height: 160px

Track circle:
  cx:60 cy:60 r:54
  fill: none
  stroke: --border-subtle
  stroke-width: 8

Three progress arcs (layered from outside in):
Arc 1 (outermost) — Calories Burn:
  stroke: --chart-green (#22c55e)
  stroke-width: 8
  stroke-linecap: round
  progress: 87% of circumference

Arc 2 (middle) — Carbs:
  stroke: --chart-amber
  r: 44  (smaller radius)
  stroke-width: 7
  progress: 23.2% offset

Arc 3 (innermost) — Protein:
  stroke: --chart-blue
  r: 34
  stroke-width: 6
  progress: 11.9% offset

All arcs: transform="rotate(-90 80 80)" to start from top

Center text:
  "87%"   — DM Sans 800, 28px, --text-primary, anchor: middle
  "1,980ml" — Inter 400, 12px, --text-secondary, anchor: middle, dy: 20
```

**Legend (right):**
Each legend row:
```
display: flex, align-items: center, gap: 10px, margin-bottom: 16px

[Dot]  8px × 8px circle, rounded-full, color per metric
[Name] "Calories burn" — Inter 400, 13px, --text-secondary
[%]    "31.2%" — DM Sans 600, 15px, --text-primary  (pushed right via flex)
[Trend] "↑ 0.22%" — Inter 500, 12px, --status-success
```

**"View full details" button:**
```
width: 100%
height: 40px
margin-top: 20px (above the button, after legend)
border: 1px solid --border-default
border-radius: 12px
background: transparent
text: Inter 500, 14px, --text-secondary
hover: background --bg-elevated
```

### 5.5 Heart Rate Chart Card — Pixel Specification (Image 1)

```
Card: right column (same row as macro ring)
height: matches macro ring card (approx 280px)
padding: 24px
```

**Header:**
```
display: flex, justify-content: space-between, align-items: center
margin-bottom: 16px

Left: "Heart rate" — DM Sans 600, 18px, --text-primary
Right: [MoreHorizontal icon, 20px, --text-tertiary, in 32px × 32px hit area]
```

**Chart area (Recharts AreaChart):**
```
height: 130px
margin-bottom: 0

CartesianGrid: strokeDasharray "3 3", stroke: --chart-grid, vertical: false
XAxis: tickLine false, axisLine false, tick fill --chart-axis, fontSize 11
YAxis: hide={true}
Area:
  type: "monotone"
  dataKey: "bpm"
  stroke: --chart-purple (#a855f7 dark / #9333ea light)
  strokeWidth: 2
  fill: "url(#heartGradient)"
  dot: false
  activeDot: { r: 4, fill: --chart-purple, strokeWidth: 0 }

Gradient definition:
<defs>
  <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%"  stopColor="var(--chart-purple)" stopOpacity="0.3"/>
    <stop offset="95%" stopColor="var(--chart-purple)" stopOpacity="0.0"/>
  </linearGradient>
</defs>
```

**Core Strength metrics (below chart, from Image 1):**
```
border-top: 1px solid --border-subtle
padding-top: 16px
display: grid, grid-template-columns: repeat(3, 1fr)

Each column:
  [Overline label]  "Current" / "Average" / "Max"  — 11px, UPPERCASE, --text-tertiary
  [Value]           "1.6" / "2.2" / "4.2"          — DM Sans 600, 20px, --text-primary
  [Unit]            "sec/sqt"                        — Inter 400, 11px, --text-secondary

Vertical divider between columns:
  width: 1px, background: --border-subtle, height: 36px, margin: auto
```

### 5.6 Fitness Goal Building Card — Pixel Specification (Image 1)

```
Card: right column (same row as Recommended Activity)
padding: 24px
```

**Header:**
```
"Fitness Goal Building" — DM Sans 600, 16px, --text-primary
"Your Fitness:" — Inter 400, 13px, --text-secondary, margin-bottom: 20px
```

**Each goal row (3 total from Image 1):**
```
display: flex, align-items: center, gap: 16px
padding: 14px 0
border-bottom: 1px solid --border-subtle (except last row)

Left metric block (60px wide):
  Number: DM Sans 700, 22px, --text-primary
  Unit:   Inter 400, 11px, --text-secondary, margin-top: 2px

Center text:
  Name:    Inter 600, 14px, --text-primary
  Sub:     Inter 400, 12px, --text-secondary

Right arc (flex-shrink: 0, margin-left: auto):
  SVG: 44px × 44px
  Track arc: 4px stroke, --border-default, semi-circle style
  Progress arc: 4px stroke, --accent, stroke-linecap: round
  Center label: DM Sans 700, 11px, --accent (the %)
```

**Three rows from Image 1:**

| Left # | Left Unit | Center Name | Sub | Arc % |
|---|---|---|---|---|
| 10 | Min | ABS & Stretch | 10 min / day | 65% |
| 12 | Sets | Side planks | 1.2 sets / day | 35% |
| 10 | Sets | Rope lifting | 10 sets / day | 50% |

### 5.7 Recommended Activity List — Pixel Specification (Image 1)

```
Card: left column (same row as Goal Building)
padding: 24px
```

**Header:**
```
display: flex, justify-content: space-between, align-items: center
margin-bottom: 16px

Left: "Recommended activity" — DM Sans 600, 16px, --text-primary
Right: Two icon toggle buttons (list/grid), each 32px × 32px, rounded-lg
       Active view icon: --text-primary | Inactive: --text-tertiary
```

**Each activity row:**
```
display: flex, align-items: center, gap: 12px
padding: 12px 0
border-bottom: 1px solid --border-subtle (except last)

[Icon block]     36px × 36px, rounded-xl, --bg-elevated bg
                 Exercise-category icon, 18px, --accent color

[Text block]     flex-1
  Name:          Inter 600, 14px, --text-primary
  Date:          Inter 400, 12px, --text-tertiary

[Time]           text-right
  Clock icon     14px, --text-tertiary, inline
  Time range:    Inter 400, 12px, --text-secondary
  (e.g., "7:00 AM to 9:00 AM")

[Price]          DM Sans 600, 13px, --text-primary, min-width: 60px, text-right
                 (e.g., "$11.70/m")

[More button]    MoreHorizontal, 18px, --text-tertiary
                 visible on hover only (opacity: 0 → 1 on row hover)
                 32px × 32px, rounded-lg
```

**Four rows from Image 1:**

| Name | Date | Time | Price |
|---|---|---|---|
| Fitness for Beginner | Start from 20 June 2024 | 7:00 AM to 9:00 AM | $11.70/m |
| Beginner to Advance gym | Start from 01 July 2024 | 08:00 AM to 9:00 AM | $15.70/m |
| Ultimate Body Workout | Start from 24 June 2024 | 7:30 AM to 9:00 AM | $9.70/m |
| Beginner to Advance gym | (repeat) | 7:00 AM to 9:00 AM | $11.70/m |

### 5.8 Trainer Carousel — Pixel Specification (Image 1)

```
Card: full-width bottom row
padding: 24px
```

**Header:**
```
display: flex, justify-content: space-between, align-items: center
margin-bottom: 16px

Left: "Trainer" — DM Sans 600, 16px, --text-primary
Right: ArrowUpRight icon, 20px, --text-secondary, in 32px × 32px button
```

**Card scroll container:**
```
display: flex
gap: 12px
overflow-x: auto
scrollbar-width: none (-webkit-scrollbar: display none)
padding-bottom: 4px  ← room for scroll momentum
```

**Each trainer card (from Image 1 exact — 3 visible):**
```
width:         120px
height:        150px
flex-shrink:   0
border-radius: 14px
overflow:      hidden
position:      relative
cursor:        pointer

[Photo]        width: 100%, height: 100%, object-fit: cover

[Gradient]     position: absolute, bottom: 0, left: 0, right: 0, height: 70px
               background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)

[Name]         position: absolute, bottom: 22px, left: 10px, right: 10px
               Inter 600, 13px, white
               white-space: nowrap, overflow: hidden, text-overflow: ellipsis

[Role]         position: absolute, bottom: 9px, left: 10px, right: 10px
               Inter 400, 11px, rgba(255,255,255,0.72)
               white-space: nowrap, overflow: hidden, text-overflow: ellipsis
```

**Three trainers from Image 1:**

| Name | Role |
|---|---|
| John Arnold | Cardio specialist |
| Kathryn Murphy | Weight lifting specialist |
| Harry b... | Cardio spe... (truncated) |

### 5.9 Three-Column Coaching Layout — Pixel Specification (Image 3)

Used exclusively on the `/coaching` page in desktop view.

**Top navigation bar (Image 3 exact):**
```
height:       56px
background:   --bg-surface (white in light mode)
border-bottom: 1px solid --border-subtle
padding:      0 24px
display:      flex, align-items: center, gap: 8px

Left group:
  [SF Logo icon 28px]
  [Nav tabs]: Home | Member | Workout | Nutritions | Community
  Tab style: Inter 500, 14px, --text-secondary
  Active tab ("Workout"): 
    background: --accent
    color: white
    border-radius: 8px
    padding: 6px 16px
    height: 32px

Center:
  [Search input]: width 200px, height 36px, rounded-full
                  "Search for a workout..." placeholder
                  [Search icon] inside left

Right group (gap: 12px):
  [Date display]:
    Day number:  DM Sans 700, 20px, --text-primary  "19"
    Month/day:   Inter 400, 11px, --text-secondary  "Tue. December"
    Stacked vertically

  ["Show my Task" button]:
    background: --bg-elevated (dark in dark mode)
    border: 1px solid --border-default
    border-radius: 999px (pill)
    height: 36px, padding: 0 16px
    Inter 500, 13px, --text-primary

  [Calendar icon button]: 36px × 36px, rounded-full

  [Coach avatar + name]:
    Avatar: 32px, rounded-full
    Name stacked:
      "Dwayne Tatum" — Inter 600, 13px, --text-primary
      "Coach"         — Inter 400, 11px, --text-secondary
```

**Three-column grid:**
```
display: grid
grid-template-columns: 260px 1fr 280px
gap: 16px
padding: 16px 24px
height: calc(100vh - 56px)
overflow: hidden

LEFT column:   overflow-y: auto
CENTER column: overflow-y: auto
RIGHT column:  overflow-y: auto
```

---

## 6. Mobile Layout Anatomy

### 6.1 TopBar — Mobile Specification (Image 2 Reference)

```
height:        60px
position:      sticky, top: 0, z-index: 30
background:    var(--bg-base)
border-bottom: 1px solid --border-subtle
padding:       0 16px
display:       flex, align-items: center, justify-content: space-between
```

**Left:** Back button OR menu icon
```
width:         40px, height: 40px
border-radius: rounded-full
icon:          ChevronLeft OR Menu, 20px, --text-primary
background:    transparent
hover:         --bg-elevated
```

**Center:** Page title
```
font:      DM Sans 600, 17px, --text-primary
position:  absolute, left: 50%, transform: translateX(-50%)
           (truly centered regardless of side button widths)
```

**Right:** Context-specific action buttons
```
display: flex, gap: 4px
Each button: 40px × 40px, rounded-full, icon 20px, --text-secondary
```

**On Workout Schedule page (Image 2 exact):**
- Title: "Workout Schedule (Daily)"
- Right: Pencil/edit icon

**On Dashboard (no back):**
- Left: User avatar (32px)
- Center-left: Greeting text (not centered — left aligned)
- Right: Bell icon + avatar or theme toggle

### 6.2 Calendar Strip — Mobile Specification (Image 2 Reference)

**Container:**
```
background: linear-gradient(135deg, #0f4c3a 0%, #1a6b52 60%, #0d4a36 100%)
            ← The dark teal header seen on right phone in Image 2
            Use this ONLY on workout/schedule pages
            On other pages: --bg-base background
padding:    16px 16px 20px
```

**Month navigation row:**
```
display:         flex, justify-content: space-between, align-items: center
margin-bottom:   12px

[Left arrow]     ChevronLeft, 20px, white/--text-primary
[Month label]    "February 2022" — DM Sans 500, 15px, white/--text-primary
[Right arrow]    ChevronRight, 20px, white/--text-primary
```

**Day chips row:**
```
display:         flex, gap: 4px
overflow-x:      auto
scrollbar-width: none
padding-bottom:  4px
```

**Each day chip (from Image 2 exact):**
```
width:           40px
height:          52px
border-radius:   20px
display:         flex, flex-direction: column, align-items: center, justify-content: center
gap:             2px
cursor:          pointer
flex-shrink:     0

Day letter:  Inter 400, 11px, (white on gradient bg / --text-tertiary on plain bg)
Date number: DM Sans 600, 15px
             Inactive: white 70% opacity (on gradient) / --text-primary (plain)
             Active:   DM Sans 700, 15px, white

Active chip:
  background:    rgba(255,255,255,0.25) OR --accent (green) on plain background
  border-radius: 20px
  The active day number in Image 2 is inside a dark green circle

Workout indicator dot (below date number):
  width: 4px, height: 4px
  border-radius: 50%
  background: --accent (on plain bg) / white (on gradient bg)
  margin-top: 2px
  visible only on days with logged/scheduled workouts
```

### 6.3 Schedule Time-Slot List — Mobile Specification (Image 2)

**Container:**
```
padding:          16px 16px 0 16px
```

**Date label above list:**
```
"February 26" — DM Sans 600, 16px, --text-primary
margin-bottom: 20px
```

**Layout grid for time + card:**
```
display: grid
grid-template-columns: 48px 1px 1fr
gap: 0 12px
align-items: start
```

**Time column (col 1, 48px):**
```
text:      Inter 400, 12px, --text-tertiary
padding:   14px 0  ← vertically centers to card
text-align: right
```

**Timeline line (col 2, 1px):**
```
width:    1px
background: --border-subtle
height:   100%
margin:   0 auto
```

**Content column (col 3):**

Workout card present:
```
background:    --bg-surface
border:        1px solid --border-subtle
border-radius: 14px
padding:       12px
margin-bottom: 8px
display:       flex, align-items: center, gap: 12px

[Thumbnail]    40px × 40px, border-radius: 10px, object-fit: cover
               Falls back to category icon in --bg-elevated bg, --accent icon

[Text block]   flex-1
  [Name]       Inter 600, 14px, --text-primary
  [Tags row]   display: flex, gap: 6px, margin-top: 4px
    [Intensity badge]  rounded-full, 20px height, 8px padding
                       "🔥 Intense" = --accent text + --accent-bg
                       "⚡ Moderate" = amber text + amber-bg
                       "💧 Light" = blue text + blue-bg
    [Duration]  Inter 400, 12px, --text-secondary  "30 min"
    [Category]  Inter 400, 12px, --text-tertiary  "Cardio"

[Edit icon]    Pencil, 16px, --text-tertiary, right side, 32px × 32px hit area
```

Empty time slot:
```
height:     44px
display:    flex, align-items: center
text:       "No Schedule" — Inter 400, 13px, --text-tertiary, italic
```

### 6.4 Empty State Screen — Mobile Specification (Image 2 Right Phone)

**Full screen centered layout:**
```
flex-direction: column
align-items: center
justify-content: center
padding: 32px 24px
text-align: center
gap: 0  ← controlled per element
```

**Date label:**
```
"February 25" — DM Sans 600, 18px, --text-primary
margin-bottom: 32px
```

**Equipment illustration:**
```
width:         180px
height:        auto
object-fit:    contain
margin-bottom: 32px
(In Image 2: a dumbbell/bench equipment photo on white/transparent bg)
```

**Primary text:**
```
"You don't have any active workout for today."
DM Sans 600, 16px, --text-primary, max-width: 240px, line-height: 1.4
margin-bottom: 8px
```

**Secondary text:**
```
"Let's log your first meal today and get insights."
Inter 400, 14px, --text-secondary, max-width: 220px, line-height: 1.55
margin-bottom: 32px
```

**CTA button (from Image 2 exact):**
```
width:         calc(100% - 32px)
height:        52px
background:    --accent
border-radius: 16px  (rounded-2xl)
display:       flex, align-items: center, justify-content: center, gap: 8px

Text:    "Explore Workouts" — Inter 600, 15px, white
Icon:    Plus, 20px, white (right of text)
```

### 6.5 Bottom Tab Navigation — Mobile Specification

```
position:   fixed
bottom:     0
left:       0
right:      0
z-index:    50
height:     64px + env(safe-area-inset-bottom)
background: var(--bg-surface)  ← NOT transparent, solid
border-top: 1px solid --border-subtle
padding:    0 0 env(safe-area-inset-bottom) 0
```

**Tab container:**
```
display:    flex
height:     64px
```

**Inactive tab:**
```
flex:         1
display:      flex, flex-direction: column, align-items: center, justify-content: center
gap:          3px
padding-top:  8px

[Icon]   24px, --text-tertiary
[Label]  Inter 500, 10px, --text-tertiary, letter-spacing: 0.01em
```

**Active tab:**
```
[Icon]   24px, --accent
[Label]  Inter 600, 10px, --accent
[Dot]    4px × 4px, rounded-full, --accent, positioned below label
```

**Center "+ Log" tab (special action button):**
```
flex:           1
display:        flex, flex-direction: column, align-items: center

[Circle button] width: 52px, height: 52px
                border-radius: 50%
                background: --accent
                display: flex, align-items: center, justify-content: center
                position: relative, bottom: 10px  ← floats above nav bar
                border: 3px solid --bg-base  ← separates from nav bar
                box-shadow: 0 4px 16px rgba(34,197,94,0.4)  ← green glow

[+ Icon]        Plus, 22px, white
[Label]         "Log" — Inter 600, 10px, --accent, margin-top: 2px
                (below the raised button)
```

**5 tabs (order):**
1. Home → `LayoutDashboard`
2. Nutrition → `Utensils`
3. Log → `Plus` (center floating button)
4. Progress → `TrendingUp`
5. Profile → `User`

### 6.6 Mobile Card Rules Summary

| Property | Value |
|---|---|
| Page horizontal padding | 16px |
| Card border radius | 16px (rounded-2xl) |
| Card internal padding | 16px (p-4) |
| Card gap in list | 12px |
| Section-to-section gap | 24px |
| Content bottom padding | 80px (above tab nav) |
| Touch targets min size | 44px × 44px |
| Font size never below | 11px |
| Line height for body | 1.55–1.65 |

---

## 7. Component Library

### 7.1 Button System — All Variants

**Primary:**
```css
.btn-primary {
  background:    var(--accent);
  color:         var(--text-inverse);
  border:        none;
  border-radius: 12px;
  height:        44px;
  padding:       0 20px;
  font:          Inter 600 15px;
  letter-spacing: -0.01em;
  cursor:        pointer;
  display:       inline-flex;
  align-items:   center;
  gap:           8px;
  transition:    all 150ms ease;
  white-space:   nowrap;
}
.btn-primary:hover  { background: var(--accent-hover); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); opacity: 0.92; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
```

**Secondary:**
```css
.btn-secondary {
  background:    transparent;
  color:         var(--text-primary);
  border:        1px solid var(--border-default);
  border-radius: 12px;
  height:        44px;
  padding:       0 20px;
  font:          Inter 500 15px;
  transition:    all 150ms ease;
}
.btn-secondary:hover { background: var(--bg-elevated); border-color: var(--border-strong); }
```

**Ghost:**
```css
.btn-ghost {
  background: transparent;
  color:      var(--text-secondary);
  border:     none;
  border-radius: 10px;
  height:     40px;
  padding:    0 14px;
  font:       Inter 500 14px;
  transition: all 120ms ease;
}
.btn-ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
```

**Icon Button:**
```css
.btn-icon {
  width:         40px;
  height:        40px;
  border-radius: 10px;
  background:    transparent;
  border:        none;
  display:       flex;
  align-items:   center;
  justify-content: center;
  cursor:        pointer;
  color:         var(--text-secondary);
  transition:    all 120ms ease;
}
.btn-icon:hover { background: var(--bg-elevated); color: var(--text-primary); }
```

**Button size variants:**

| Variant | Height | Padding H | Font | Border radius |
|---|---|---|---|---|
| xs | 28px | 8px | 12px | 8px |
| sm | 36px | 14px | 13px | 10px |
| md (default) | 44px | 20px | 15px | 12px |
| lg | 52px | 28px | 16px | 14px |
| xl (mobile CTA) | 56px | 32px | 17px | 16px |

### 7.2 Card System

**Base card:**
```css
.card {
  background:    var(--bg-surface);
  border:        1px solid var(--border-subtle);
  border-radius: 20px;
  padding:       20px;
}
/* Light mode only: */
.light .card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}
```

**Interactive card:**
```css
.card-interactive {
  cursor: pointer;
  transition: transform 200ms ease, border-color 150ms ease;
}
.card-interactive:hover {
  transform:    translateY(-2px);
  border-color: var(--border-default);
}
.light .card-interactive:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
```

**Active/selected card:**
```css
.card-selected {
  border-color: var(--accent);
  background:   var(--accent-bg);
}
```

**Small card (tighter radius):**
```css
.card-sm { border-radius: 16px; padding: 16px; }
```

### 7.3 Badge & Chip System

**Status badge (read-only):**
```css
.badge {
  display:       inline-flex;
  align-items:   center;
  height:        22px;
  padding:       0 10px;
  border-radius: 999px;
  font:          Inter 600 11px;
  letter-spacing: 0.02em;
  white-space:   nowrap;
}
.badge-green  { background: var(--accent-bg);               color: var(--accent); }
.badge-amber  { background: rgba(245,158,11,0.12);          color: var(--status-warning); }
.badge-red    { background: rgba(239,68,68,0.12);           color: var(--status-danger); }
.badge-blue   { background: rgba(59,130,246,0.12);          color: var(--status-info); }
.badge-gray   { background: var(--bg-elevated);             color: var(--text-secondary); }
.badge-purple { background: rgba(168,85,247,0.12);          color: var(--status-purple); }
```

**Interactive chip (multi-select):**
```css
.chip {
  height:        36px;
  padding:       0 16px;
  border-radius: 999px;
  border:        1px solid var(--border-default);
  background:    transparent;
  font:          Inter 500 13px;
  color:         var(--text-secondary);
  cursor:        pointer;
  transition:    all 150ms ease;
  white-space:   nowrap;
  user-select:   none;
}
.chip:hover    { border-color: var(--border-strong); color: var(--text-primary); }
.chip-selected { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }
```

### 7.4 Progress Ring (SVG — Exact)

```typescript
// React component spec
interface ProgressRingProps {
  size: number       // SVG viewBox size (e.g., 160)
  strokeWidth: number // ring thickness
  progress: number   // 0–100
  color?: string     // defaults to var(--accent)
  label?: string     // center top text
  sublabel?: string  // center bottom text
}

// SVG structure:
// <svg viewBox="0 0 {size} {size}">
//   <!-- Track -->
//   <circle cx={size/2} cy={size/2} r={radius} fill="none"
//           stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
//   <!-- Progress arc -->
//   <circle cx={size/2} cy={size/2} r={radius} fill="none"
//           stroke={color} strokeWidth={strokeWidth}
//           strokeLinecap="round"
//           strokeDasharray={circumference}
//           strokeDashoffset={circumference * (1 - progress/100)}
//           transform={`rotate(-90 ${size/2} ${size/2})`}
//           style={{ transition: 'stroke-dashoffset 1000ms cubic-bezier(0.34,1.56,0.64,1)' }} />
//   <!-- Center label -->
//   <text x={size/2} y={size/2 - 8} textAnchor="middle"
//         fontFamily="DM Sans" fontWeight="700" fontSize={size*0.175}
//         fill="var(--text-primary)">{label}</text>
//   <text x={size/2} y={size/2 + 12} textAnchor="middle"
//         fontFamily="Inter" fontWeight="400" fontSize={size*0.075}
//         fill="var(--text-secondary)">{sublabel}</text>
// </svg>
```

### 7.5 Progress Bar

```css
.progress-track {
  width:         100%;
  height:        6px;
  border-radius: 999px;
  background:    var(--bg-elevated);
  overflow:      hidden;
}
.progress-fill {
  height:        100%;
  border-radius: 999px;
  background:    var(--accent);
  transition:    width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: left;
}
.progress-track.sm  .progress-fill { height: 4px; }
.progress-track.lg  .progress-fill { height: 10px; }
```

### 7.6 Toggle / Switch

```css
.toggle-track {
  width:         44px;
  height:        24px;
  border-radius: 999px;
  background:    var(--border-default);
  position:      relative;
  cursor:        pointer;
  transition:    background 200ms ease;
}
.toggle-track.checked { background: var(--accent); }
.toggle-thumb {
  position:      absolute;
  top:           3px; left: 3px;
  width:         18px; height: 18px;
  border-radius: 50%;
  background:    white;
  box-shadow:    0 1px 4px rgba(0,0,0,0.3);
  transition:    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle-track.checked .toggle-thumb { transform: translateX(20px); }
```

### 7.7 Avatar

```css
.avatar {
  border-radius: 50%;
  object-fit:    cover;
  background:    var(--accent-bg);
  flex-shrink:   0;
  display:       block;
}
/* Sizes: 20 | 28 | 36 | 44 | 64 | 96 | 128 px */
.avatar-sm  { width: 28px;  height: 28px; }
.avatar-md  { width: 36px;  height: 36px; }
.avatar-lg  { width: 44px;  height: 44px; }
.avatar-xl  { width: 64px;  height: 64px; }
.avatar-2xl { width: 96px;  height: 96px; }
```

---

## 8. Icon System

**Library:** Lucide React — exclusively. No mixing with other icon sets.
**Default stroke width:** 1.75 (Lucide default). Do NOT change.
**Color:** Always `currentColor` (inherits from parent).

### 8.1 Navigation Icons (exact)

| Page | Lucide Component |
|---|---|
| Dashboard | `LayoutDashboard` |
| Analytics | `BarChart3` |
| Goals | `Target` |
| Timelines | `CalendarDays` |
| Nutrition | `Utensils` |
| Workouts | `Dumbbell` |
| Hydration | `Droplets` |
| Timers | `Timer` |
| Calculators | `Calculator` |
| Progress | `TrendingUp` |
| Coaching | `Users` |
| Community | `MessageSquare` |
| Settings | `Settings` |
| Appearance | `Paintbrush` |
| Support | `HelpCircle` |

### 8.2 Action Icons (exact)

| Action | Icon |
|---|---|
| Add / New | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| More options (3-dot) | `MoreHorizontal` |
| Expand | `ChevronRight` |
| Back | `ChevronLeft` |
| Notifications | `Bell` |
| Dark mode | `Moon` |
| Light mode | `Sun` |
| Calendar | `Calendar` |
| Camera | `Camera` |
| Barcode scan | `Scan` |
| Voice/Mic | `Mic` |
| Heart rate | `HeartPulse` |
| Weight/Scale | `Weight` |
| Droplet (single) | `Droplet` |
| Fire/Calories | `Flame` |
| Trophy | `Trophy` |
| Streak/Zap | `Zap` |
| Complete | `CircleCheck` |
| Warning | `AlertCircle` |
| Download | `Download` |
| Share | `Share2` |
| Bookmark | `Bookmark` |
| Play | `Play` |
| Pause | `Pause` |
| Stop | `Square` |
| Skip | `SkipForward` |
| Restart | `RotateCcw` |
| Check | `Check` |
| Close / X | `X` |
| External link | `ArrowUpRight` |
| Collapse sidebar | `PanelLeftClose` |
| Expand sidebar | `PanelLeftOpen` |

### 8.3 Icon Sizes by Context

| Context | Size |
|---|---|
| Sidebar navigation icons | 18px |
| Button icons (primary/secondary) | 18px |
| TopBar icons | 20px |
| Card header icons | 20px |
| Inline with text | 15px |
| Tab bar (mobile) | 24px |
| Large empty-state icons | 48px |
| Feature/hero icons | 32px |

---

## 9. Motion & Animation System

### 9.1 Easing Functions (4 only — no others permitted)

```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);      /* Entrances, reveals */
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0);       /* Exits, closings */
--ease-inout:  cubic-bezier(0.87, 0, 0.13, 1);      /* Position changes */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* Bouncy: buttons, fills */
```

### 9.2 Duration Scale

| Speed | Duration | Use |
|---|---|---|
| Instant | 0ms | Toggles, checkboxes |
| Fast | 100ms | Hover bg changes, focus rings |
| Normal | 200ms | Button press, badge appear |
| Smooth | 300ms | Page transitions, drawer opens |
| Slow | 500ms | Progress bars fill on mount |
| Crawl | 800ms | Number count-up animations |

### 9.3 Framer Motion Variants (exact)

```typescript
// Page wrapper — every page component
export const pageVariants = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0,
              transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -8,
              transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] } }
}

// Staggered card container
export const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
}

// Individual card entrance
export const itemVariants = {
  hidden:  { opacity: 0, y: 18, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1,
             transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }
}

// Bottom sheet (mobile add food / add workout)
export const sheetVariants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { y: '100%', transition: { duration: 0.25, ease: [0.7, 0, 0.84, 0] } }
}

// Modal (desktop)
export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1,
             transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.96,
             transition: { duration: 0.15 } }
}

// Sidebar collapse
export const sidebarVariants = {
  expanded:  { width: 240, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  collapsed: { width: 64,  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
}

// PR / achievement pop
export const achievementVariants = {
  initial:  { scale: 0, rotate: -15, opacity: 0 },
  animate:  { scale: 1, rotate: 0, opacity: 1,
              transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 } }
}

// Number count-up
// Use Framer Motion's animate() + useMotionValue:
// const count = useMotionValue(0)
// const rounded = useTransform(count, (v) => Math.round(v))
// useEffect(() => { animate(count, targetValue, { duration: 0.8, ease: 'easeOut' }) }, [])
```

### 9.4 Hover Rules (all interactive elements)

```
Cards with whileHover:  { scale: 1.005 } (subtle, not dramatic)
Buttons with whileTap:  { scale: 0.97 }
Buttons with whileHover: { scale: 1.01 }
Icon buttons:           CSS only, background change 120ms
Trainer cards:          translateY(-3px) with cursor pointer
Nav items:              background change only, no scale
```

### 9.5 Specific Page Animations

**Dashboard mount sequence:**
1. Sidebar fades in (0–200ms)
2. TopBar fades in (100–300ms)
3. Metric cards stagger in from bottom (200–500ms)
4. Progress ring arc animates from 0 to value (300–1000ms)
5. Heart rate chart line draws in left-to-right (400–900ms)
6. Other cards fade in (500–700ms)

**Workout set completion:**
```
Checkbox checked → green fill + scale spring (0.3s)
Row background → subtle green flash (0.4s) then fades
Rest timer → slides in from right (0.35s)
Volume counter → increments with count-up (0.5s)
```

**Water drink logged:**
```
Progress ring arc → spring to new value (0.8s)
Percentage in center → count-up (0.8s)
Entry appears in list → fade + slide from top (0.3s)
```

---

## 10. Dark Mode Specification

Dark mode is the **default theme**. All screenshots and design references use dark mode unless stated.

### 10.1 Layer Depth System

```
Depth 0  #0a0a0a  → Page background (--bg-base)
Depth 1  #111111  → Cards (--bg-surface)
Depth 2  #161616  → Content inside cards (--bg-surface-alt)
Depth 3  #1a1a1a  → Hover states, elevated dropdowns (--bg-elevated)
Depth 4  #212121  → Tooltips, nested dropdowns
Depth 5  #2a2a2a  → Focused inputs (--border-strong)
```

Each layer must be visibly distinct at close inspection but subtle at normal viewing distance. No layer should appear "white" or even "gray" — the entire scale is very dark.

### 10.2 Text on Dark Backgrounds

- `--text-primary` = `#fafafa` — NOT pure white. Pure white (#ffffff) on black is too harsh.
- `--text-secondary` = `#a3a3a3` — Warm cool gray, clear but receded
- `--text-tertiary` = `#525252` — Just visible enough for timestamps and helpers

### 10.3 Dark Mode Chart Overrides

Charts use slightly more saturated colors in dark mode for vibrancy on dark backgrounds:

```css
.dark {
  --chart-green:  #22c55e;  /* Keep same */
  --chart-blue:   #60a5fa;  /* Lighter blue for dark bg */
  --chart-amber:  #fbbf24;  /* Warmer amber */
  --chart-red:    #f87171;  /* Lighter red */
  --chart-purple: #c084fc;  /* Lighter purple */
}
```

---

## 11. Light Mode Specification

Light mode is drawn from Image 3. It should feel professional and clinical, not soft or healthcare-generic.

### 11.1 Card Elevation in Light Mode

Since backgrounds are all close to white, use shadow for depth:

```css
.light {
  --shadow-card-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-card-md: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  --shadow-card-lg: 0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
}
```

Apply `.shadow-card-sm` on all standard cards, `.shadow-card-md` on focused/active cards.

### 11.2 Light Mode Green Adjustment

Accent green is `#16a34a` (not `#22c55e`) in light mode — the slightly darker variant ensures 4.5:1 contrast ratio on white backgrounds.

---

## 12. Responsive Breakpoint System

### 12.1 Breakpoints

```typescript
const screens = {
  xs:   '360px',   // Small phones
  sm:   '430px',   // Modern phones (iPhone 14 Pro Max)
  md:   '768px',   // Tablets
  lg:   '1024px',  // Small laptops, iPad Pro landscape
  xl:   '1280px',  // Standard laptops
  '2xl': '1440px', // Large displays (Image 1 design width)
  '3xl': '1920px', // Wide monitors
}
```

### 12.2 Layout Rules at Each Breakpoint

| Range | Sidebar | Bottom Nav | Content Columns |
|---|---|---|---|
| 360–767px | Hidden | Visible (5 tabs) | 1 column |
| 768–1023px | Hidden | Visible | 1–2 columns |
| 1024–1279px | 64px icon-only | Hidden | 2 columns |
| 1280–1439px | 240px expanded | Hidden | 2–3 columns |
| 1440px+ | 240px expanded | Hidden | 3–4 columns |

### 12.3 Tailwind Class Patterns

```
// Grid patterns
Single col mobile → two col desktop:
  grid grid-cols-1 md:grid-cols-2

Single → two → three:
  grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3

Metric cards (2 on mobile, 4 on desktop):
  grid grid-cols-2 xl:flex

// Visibility
Desktop only:    hidden xl:flex
Mobile only:     flex xl:hidden
Tablet+:         hidden md:flex

// Padding responsive
Mobile content:  px-4 py-4
Desktop content: px-7 py-6

// Text size responsive
Mobile:  text-2xl
Desktop: text-3xl xl:text-4xl
```

---

## 13. Form Elements & Input Design

### 13.1 Form Anatomy Rules

```
Label (above input, always — no floating labels)
  ↓ 6px gap
Input field
  ↓ 4px gap
Error message OR helper text (either, not both)

Field-to-field vertical gap:    20px
Section-to-section vertical gap: 28px
Form width (desktop): max-width 480px, centered on page
Form width (mobile):  100%, 16px padding
```

### 13.2 Standard Input

```css
.input {
  width:         100%;
  height:        44px;
  padding:       0 16px;
  border-radius: 12px;
  border:        1px solid var(--border-default);
  background:    var(--bg-surface);
  color:         var(--text-primary);
  font:          Inter 400 15px;
  outline:       none;
  transition:    border-color 150ms ease, box-shadow 150ms ease;
  -webkit-appearance: none;
}
.input::placeholder { color: var(--text-tertiary); }
.input:focus {
  border-color: var(--accent);
  box-shadow:   0 0 0 3px var(--accent-bg);
}
.input.error {
  border-color: var(--status-danger);
  box-shadow:   0 0 0 3px rgba(239,68,68,0.1);
}
```

### 13.3 Number Stepper

```
Container: display flex, align-items center, gap 0
width: fit-content

[−]  36px × 36px, rounded-l-xl, --bg-elevated bg, --border-default border-r
[N]  48px wide, text-center, DM Sans 600 18px, --bg-surface bg, border-y
[+]  36px × 36px, rounded-r-xl, --bg-elevated bg, --border-default border-l

Full container: border 1px --border-default, rounded-xl, overflow hidden
```

### 13.4 Label Spec

```css
.form-label {
  display:       block;
  font:          Inter 500 13px;
  color:         var(--text-secondary);
  margin-bottom: 6px;
}
.form-error {
  font:          Inter 400 12px;
  color:         var(--status-danger);
  margin-top:    4px;
}
.form-helper {
  font:          Inter 400 12px;
  color:         var(--text-tertiary);
  margin-top:    4px;
}
```

---

## 14. Chart & Data Visualization Design

### 14.1 Recharts Universal Config

```typescript
// Apply to ALL charts — no exceptions
const chartConfig = {
  cartesianGrid: {
    strokeDasharray: "4 4",
    stroke: "var(--chart-grid)",
    vertical: false,        // Horizontal grid lines only
  },
  xAxis: {
    tick:     { fill: "var(--chart-axis)", fontSize: 11, fontFamily: "Inter" },
    axisLine: false,
    tickLine: false,
  },
  yAxis: {
    tick:     { fill: "var(--chart-axis)", fontSize: 11, fontFamily: "Inter" },
    axisLine: false,
    tickLine: false,
    width:    38,
  },
  tooltip: {
    contentStyle: {
      background:   "var(--bg-elevated)",
      border:       "1px solid var(--border-default)",
      borderRadius: "12px",
      fontSize:     "13px",
      fontFamily:   "Inter, sans-serif",
      color:        "var(--text-primary)",
      boxShadow:    "0 8px 24px rgba(0,0,0,0.2)",
      padding:      "10px 14px",
    },
    cursor: { stroke: "var(--border-default)", strokeWidth: 1 },
  },
}
```

### 14.2 Chart Gradient Definitions (reusable)

```typescript
// Use inside <defs> of every AreaChart/LineChart
const gradients = {
  green: (
    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stopColor="var(--chart-green)"  stopOpacity="0.25" />
      <stop offset="95%" stopColor="var(--chart-green)"  stopOpacity="0" />
    </linearGradient>
  ),
  purple: (
    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stopColor="var(--chart-purple)" stopOpacity="0.28" />
      <stop offset="95%" stopColor="var(--chart-purple)" stopOpacity="0" />
    </linearGradient>
  ),
  blue: (
    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stopColor="var(--chart-blue)"   stopOpacity="0.22" />
      <stop offset="95%" stopColor="var(--chart-blue)"   stopOpacity="0" />
    </linearGradient>
  ),
}
```

### 14.3 Chart Assignments by Page

| Page | Data | Chart Type | Colors |
|---|---|---|---|
| Dashboard | Heart rate | AreaChart + area | --chart-purple |
| Dashboard | Macro ring | RadialBarChart OR SVG arcs | green + blue + amber |
| Nutrition | Daily calories (14d) | BarChart | green/red by goal |
| Nutrition | Macro split | PieChart (donut) | green+blue+amber+red |
| Hydration | 7-day history | BarChart | green/amber/red by % |
| Progress | Weight trend | ComposedChart (Scatter + Line) | dots=gray, avg=green |
| Progress | 1RM trend | LineChart | --chart-green |
| Coaching | Calorie 5-day | BarChart (mini) | --chart-green |
| Calculators | Weight loss curve | AreaChart | green=predicted, gray=myth |
| Workouts | Volume per muscle | BarChart horizontal | --chart-green |

---

## 15. Page-by-Page Layout Blueprints

### 15.1 Dashboard (Desktop)

```
[SIDEBAR 240px fixed, full height]
[MAIN content, margin-left: 240px]
  [TOPBAR: 64px, sticky]
    Left: greeting text stack | Right: 5 icon buttons
  [CONTENT: padding 24px 28px]
    [ROW 1: 4 metric cards — flex, gap 16px]
      Weight | Heart Rate | Hydration | Blood/Cal
      Each: flex-1, height 90px, rounded-2xl
    [ROW 2: 2-col grid, gap 16px, grid-cols-[1.2fr_1fr]]
      Left:  Macro Ring Card
      Right: Heart Rate Chart Card
    [ROW 3: 2-col grid, gap 16px, grid-cols-[1.2fr_1fr]]
      Left:  Recommended Activity list
      Right: Fitness Goal Building
    [ROW 4: full width]
      Trainer Carousel card
```

### 15.2 Dashboard (Mobile)

```
[TOPBAR: greeting + notification + avatar]
[SCROLLABLE CONTENT: px-4]
  [METRIC CARDS: 2×2 grid, gap 12px]
  [MACRO RING + WATER: 2 cols, gap 12px]
  [HEART RATE CHART: full width]
  [WORKOUT TODAY: full width]
  [TRAINER STRIP: horizontal scroll, full width]
  [ACTIVITY LIST: full width]
[BOTTOM TAB NAV: fixed]
```

### 15.3 Workout Schedule (Mobile — Image 2)

```
[TOPBAR: back | "Workout Schedule (Daily)" | edit]
[GRADIENT HEADER: dark teal, contains calendar]
  [Month nav row: < February 2022 >]
  [Day chips: horizontal scroll, 7+ days]
[WHITE CONTENT AREA]
  [Date label: "February 26"]
  [TIME-SLOT LIST]
    08:00 | line | [Workout card]
    07:00 | line | No Schedule
    09:00 | line | [Workout card]
    10:00 | line | [Workout card]
    11:00 | line | No Schedule
    ... continues
[BOTTOM TAB NAV: fixed]
```

### 15.4 Coaching (Desktop — Image 3)

```
[TOP HORIZONTAL NAV: full width, 56px]
  Logo | Tabs | Search | Date | Task btn | Coach avatar
[THREE-COLUMN GRID: padding 16px 24px, gap 16px]
  [LEFT 260px — sticky scroll]
    AI Chat card (gradient bg, bot icon, input)
    "Suggest Workout" CTA card
    "Browse By Body Area" (4 muscle chips)
    Daily Schedule mini-list
  [CENTER fluid — scrolls]
    Trending Workouts (H-scroll cards)
    Featured Workout (full-width large card)
    Short Workouts (grid)
    My Active Workout (list, % progress bars)
  [RIGHT 280px — sticky scroll]
    Streak card: "3 day streak!" + week dots
    Longest streak badge: "22"
    Nutrition History (3 meal rows)
    Average Calories consumed
    Mini bar chart (5 days)
```

---

## 16. Accessibility Standards

### 16.1 Contrast Requirements

| Combination | Minimum | Target |
|---|---|---|
| `--text-primary` on `--bg-base` | 4.5:1 | 15:1+ |
| `--text-secondary` on `--bg-base` | 4.5:1 | 7:1 |
| `--accent` on `--bg-base` (dark) | 3:1 | 7.5:1 |
| `--accent` on `--bg-base` (light) | 4.5:1 | 5.2:1 |
| White text on `--accent` button | 4.5:1 | ✅ passes |

### 16.2 Focus Ring

```css
:focus-visible {
  outline:        2px solid var(--accent);
  outline-offset: 2px;
  border-radius:  inherit;
}
/* Override for rounded elements: */
.rounded-full:focus-visible { border-radius: 999px; }
```

### 16.3 Touch Targets

- All interactive elements on mobile: minimum 44×44px
- Minimum 8px gap between adjacent touch targets
- Bottom nav items: full height × full (width/5)

### 16.4 ARIA Requirements

```
All icon-only buttons:   aria-label="[action name]"
Progress rings:          role="progressbar" aria-valuenow aria-valuemin aria-valuemax
Charts:                  aria-label="[description of what chart shows]"
Modals/drawers:          role="dialog" aria-modal="true" aria-labelledby
Collapsible sections:    aria-expanded aria-controls
Nav items:               aria-current="page" on active
Sidebar:                 aria-label="Main navigation" role="navigation"
```

---

## 17. Asset & Media Guidelines

### 17.1 Image Formats & Sizes

| Asset Type | Format | Max Size | Display Size |
|---|---|---|---|
| Coach photo | WebP | 200KB | 400×400px |
| Trainer card bg | WebP | 150KB | 240×300px |
| Workout cover | WebP | 300KB | 600×400px |
| Exercise GIF | WebP animated | 800KB | 400×400px |
| User avatar | WebP | 100KB | 200×200px |
| Progress photo | WebP | 2MB | User upload |

### 17.2 App Icon / Logo

```
Shape:    32×32px rounded square (8px radius)
BG:       --accent (#22c55e)
Monogram: "SF" — DM Sans 800, 14px, #ffffff
Clearance: 2px minimum from any edge

Usage:    Sidebar header, browser tab favicon, PWA icon
Do NOT:   Use on colored backgrounds, stretch, add effects
```

### 17.3 Empty State Illustrations

All empty states follow this exact style:
- Line-art style, 1.5px stroke, DM Sans-compatible style
- Palette: `--accent` + `--text-tertiary` + white/transparent only
- Maximum 3 colors per illustration
- Size: 140–180px wide, centered on screen
- Source: use Lucide icons at 64–80px as a fallback if no illustration

---

*SuperFit Design System v1.0*
*All visual decisions flow from this document. Any deviation requires design review.*
*Desktop: Image 1 (dark dashboard) + Image 3 (coaching web) | Mobile: Image 2 (workout schedule)*
*Last updated: March 2026*
