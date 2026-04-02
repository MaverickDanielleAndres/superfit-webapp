# SuperFit — Complete Design System & UI Specification
## Version 2.0 | Single Source of Truth

> **Desktop layout authority:** Image 1 (Dark Dashboard) + Image 3 (Coaching Web Platform)
> **Mobile layout authority:** Image 2 (Workout Schedule — left phone = content, right phone = empty state)
> This document governs every pixel. No deviation permitted without design review.

---

## 1. DESIGN PHILOSOPHY

### 1.1 Core Aesthetic
SuperFit has two visual modes — two expressions of one identity:

**Dark Mode (Default) — Image 1:**
- Deep near-black backgrounds with layered card elevation
- Bright white headings, warm gray secondary text
- Single electric green accent (`#22c55e`) as the system's only color
- Cards float via layered darkness (not drop shadows)
- Data visualizations glow softly

**Light Mode — Image 3:**
- Pure white backgrounds, very light gray cards
- Near-black text for maximum readability
- Generous white space
- Subtle 1px gray borders defining card boundaries

### 1.2 Non-Negotiable Rule
Every page must feel like a fitness professional's precision tool. Clean, confident, data-rich without clutter.

---

## 2. COLOR SYSTEM

```css
/* ═══════ DARK MODE (default) ═══════ */
.dark {
  --bg-base:          #0a0a0a;
  --bg-surface:       #111111;
  --bg-surface-alt:   #161616;
  --bg-elevated:      #1a1a1a;
  --bg-overlay:       rgba(0,0,0,0.72);
  --border-subtle:    #1f1f1f;
  --border-default:   #2a2a2a;
  --border-strong:    #3a3a3a;
  --text-primary:     #fafafa;
  --text-secondary:   #a3a3a3;
  --text-tertiary:    #525252;
  --text-inverse:     #0a0a0a;
  --accent:           #22c55e;
  --accent-hover:     #16a34a;
  --accent-dim:       #166534;
  --accent-bg:        rgba(34,197,94,0.10);
  --accent-bg-strong: rgba(34,197,94,0.18);
  --status-success:   #22c55e;
  --status-warning:   #f59e0b;
  --status-danger:    #ef4444;
  --status-info:      #3b82f6;
  --status-purple:    #a855f7;
  --chart-green:      #22c55e;
  --chart-blue:       #60a5fa;
  --chart-amber:      #fbbf24;
  --chart-red:        #f87171;
  --chart-purple:     #c084fc;
  --chart-grid:       #1f1f1f;
  --chart-axis:       #525252;
  --sidebar-bg:       #0f0f0f;
  --sidebar-active-bg:    #1a1a1a;
  --sidebar-active-text:  #ffffff;
  --sidebar-inactive:     #737373;
  --sidebar-icon-active:  #22c55e;
  --sidebar-border:       #1a1a1a;
}

/* ═══════ LIGHT MODE ═══════ */
.light {
  --bg-base:          #ffffff;
  --bg-surface:       #f9f9f9;
  --bg-surface-alt:   #f3f4f6;
  --bg-elevated:      #ffffff;
  --bg-overlay:       rgba(0,0,0,0.45);
  --border-subtle:    #e5e7eb;
  --border-default:   #d1d5db;
  --border-strong:    #9ca3af;
  --text-primary:     #0a0a0a;
  --text-secondary:   #4b5563;
  --text-tertiary:    #9ca3af;
  --text-inverse:     #ffffff;
  --accent:           #16a34a;
  --accent-hover:     #15803d;
  --accent-dim:       #bbf7d0;
  --accent-bg:        rgba(22,163,74,0.08);
  --accent-bg-strong: rgba(22,163,74,0.15);
  --sidebar-bg:       #ffffff;
  --sidebar-active-bg:    #f0fdf4;
  --sidebar-active-text:  #15803d;
  --sidebar-inactive:     #6b7280;
  --sidebar-icon-active:  #16a34a;
  --sidebar-border:       #e5e7eb;
}
```

### Green Accent — Strict Usage
✅ Active nav icon · Primary CTA buttons · All progress rings/bars · Completion checks · Streak counters · Selected states
🚫 Body text · Card backgrounds · Ghost buttons · Decorative borders · Gradients

---

## 3. TYPOGRAPHY

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --font-display: 'DM Sans', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}

/* Scale */
.display-xl  { font: 700 3.5rem/1.0  var(--font-display); letter-spacing: -0.04em; }
.display-lg  { font: 700 2.75rem/1.1 var(--font-display); letter-spacing: -0.03em; }
.display-md  { font: 700 2.25rem/1.15 var(--font-display); letter-spacing: -0.025em; }
.h1 { font: 700 1.75rem/1.2  var(--font-display); letter-spacing: -0.02em; }
.h2 { font: 600 1.5rem/1.25  var(--font-display); letter-spacing: -0.015em; }
.h3 { font: 600 1.25rem/1.3  var(--font-display); letter-spacing: -0.01em; }
.h4 { font: 600 1.0625rem/1.35 var(--font-body); }
.body    { font: 400 0.9375rem/1.6 var(--font-body); }
.body-sm { font: 400 0.875rem/1.55 var(--font-body); }
.label   { font: 500 0.8125rem/1.4 var(--font-body); letter-spacing: 0.01em; }
.overline { font: 600 0.6875rem/1.2 var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; }
.timer-xl { font: 600 5rem/1.0   var(--font-mono); letter-spacing: -0.02em; }
.timer-lg { font: 600 3rem/1.0   var(--font-mono); }
.timer-md { font: 600 1.75rem/1.0 var(--font-mono); }
```

---

## 4. SPACING & GRID

**4px base unit.** Scale: 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 · 80px

**Desktop Grid:**
```
Sidebar (240px fixed) | Main content (flex-1)
Content padding: 24px top, 28px left/right
Card gap: 16px
```

**Mobile Grid:**
```
TopBar (60px) | Content (px-4) | Bottom Nav (64px fixed)
Card gap: 12px, card radius: rounded-2xl (16px)
Content bottom padding: 80px
```

---

## 5. SIDEBAR BEHAVIOR — ICON CLICK EXPAND/COLLAPSE

### 5.1 Core Sidebar Interaction (NEW — REQUIRED)

The sidebar has **two interaction modes:**

**Desktop Sidebar — Click-to-Expand/Collapse:**
```
DEFAULT STATE: Collapsed (64px wide, icons only)
EXPANDED STATE: 240px wide, icons + labels visible

RULE: Clicking ANY sidebar icon:
  → Expands sidebar if collapsed (icons + labels appear)
  → AND navigates to that page

RULE: Clicking anywhere outside sidebar (on main content):
  → Collapses sidebar back to 64px (icons only)

RULE: Clicking the same icon again while expanded:
  → Collapses sidebar (NOT re-navigate)

RULE: Hovering over sidebar when collapsed:
  → Shows tooltip with nav item label (NOT auto-expand)
```

**Implementation spec:**
```typescript
// Sidebar state:
const [isExpanded, setIsExpanded]   = useState(false)
const [activeHover, setActiveHover] = useState<string | null>(null)

// Click on nav icon:
const handleNavClick = (href: string) => {
  if (!isExpanded) {
    setIsExpanded(true)        // expand first
    router.push(href)          // navigate simultaneously
  } else {
    if (pathname === href) {
      setIsExpanded(false)     // same page = collapse
    } else {
      router.push(href)        // different page = just navigate (stay expanded)
    }
  }
}

// Click outside:
// Wrap main content with onClick={() => setIsExpanded(false)}
// Use useClickOutside hook referencing the sidebar ref

// Animation:
// <motion.aside animate={{ width: isExpanded ? 240 : 64 }}
//   transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} />
```

**Collapsed sidebar (64px):**
```
[SF icon centered, 32px]
─────────────────
[Nav icon 1, centered, 18px, tooltip on hover]
[Nav icon 2, centered, 18px]
[Nav icon 3, centered, 18px]
...
─────────────────
[Settings icon]
[Appearance icon]
[Support icon]
```

**Expanded sidebar (240px, same as previously spec'd Image 1):**
```
[SF Icon]  SuperFit
─────────────────
[Avatar]  Michael Brown
          @Michaelbrown07  [PRO]
─────────────────
MAIN MENU                [edit]
[Icon]  Dashboard   ← active: green icon, #1a1a1a bg
[Icon]  Analytics
[Icon]  Goals
[Icon]  Timelines
[Icon]  Nutrition
[Icon]  Workouts
[Icon]  Coaching
[Icon]  Community
[Icon]  Messages
─────────────────
SETTINGS
[Icon]  Settings
[Icon]  Appearance
[Icon]  Support
─────────────────
[Community CTA card]
```

**Tooltip (collapsed state, on hover):**
```css
.sidebar-tooltip {
  position:   absolute;
  left:       72px;   /* right of sidebar + 8px */
  background: var(--bg-elevated);
  border:     1px solid var(--border-default);
  border-radius: 8px;
  padding:    6px 12px;
  font:       Inter 500 13px;
  color:      var(--text-primary);
  white-space: nowrap;
  pointer-events: none;
  z-index:    100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  /* animate: opacity 0→1, x -4→0, 150ms */
}
```

---

## 6. DESKTOP LAYOUT ANATOMY (Image 1 + Image 3)

### 6.1 Sidebar Full Spec
- Width: 64px (collapsed) / 240px (expanded)
- Background: `#0f0f0f`
- Border-right: `1px solid #1a1a1a`
- Position: `fixed left-0 top-0 h-screen z-40`

**Logo header (72px):**
- SF icon: 32px green square, border-radius 8px, "SF" DM Sans 800 14px white
- Brand: "SuperFit" DM Sans 700 18px (hidden collapsed)

**User block (72px):**
- Avatar 36px rounded-full
- Name: Inter 500 14px `--text-primary` (hidden collapsed)
- @username: Inter 400 12px `--text-tertiary` (hidden collapsed)
- PRO badge: green pill, 20px height (hidden collapsed)

**Nav items (each 44px):**
- Padding: 0 12px, margin: 2px 8px, border-radius: 10px
- Icon: 18px Lucide
- Label: Inter 500 14px (hidden collapsed, shown expanded)
- Active: `--sidebar-active-bg` bg + green icon + white label
- Hover: `--bg-elevated`
- Inactive: transparent bg + `#737373` icon

### 6.2 Main TopBar (Image 1)
- 64px height, sticky, `--bg-base` bg, no border
- Left: "Good morning" (13px) + "Welcome Back!" (DM Sans 600 20px)
- Right: Search · Message · Bell (badge) · Settings · Theme toggle
- Each icon: 40×40 rounded-full, 20px icon

### 6.3 Dashboard Grid (Image 1 Exact)
Row 1: 4 metric cards — flex, 16px gap, each 90px height
Row 2: grid-cols-[1.2fr_1fr] — Macro Ring | Heart Rate Chart
Row 3: grid-cols-[1.2fr_1fr] — Recommended Activity | Goals
Row 4: Full-width Trainer Carousel

---

## 7. MOBILE LAYOUT ANATOMY (Image 2)

### 7.1 TopBar (60px)
- Sticky, `--bg-base`, `#1f1f1f` border-bottom
- Back/menu left | title center (DM Sans 600 17px) | action icons right

### 7.2 Calendar Strip (Image 2 exact)
- Gradient header: `linear-gradient(135deg, #0f4c3a, #1a6b52, #0d4a36)`
- Month nav: < Month Year >
- Day chips: 40×52px rounded-2xl, active = green circle/fill

### 7.3 Time-Slot List (Image 2 left phone)
- Grid: 48px time | 1px line | workout card
- Workout card: `#111111` bg, rounded-xl, thumbnail+tags+edit

### 7.4 Empty State (Image 2 right phone)
- Equipment illustration 180px
- "You don't have any active workout for today."
- "Explore Workouts +" button: green, rounded-2xl, 52px, full width

### 7.5 Bottom Tab Navigation (5 tabs)
- Fixed 64px, `#111111` bg, `#1f1f1f` top border
- Tabs: Home | Nutrition | [+Log raised] | Progress | Profile
- Active: green icon + label + 4px dot
- Center +Log: 52px circle, green, 10px raised, green glow shadow

---

## 8. COMPONENT LIBRARY

### 8.1 Buttons

```css
/* Primary */
.btn-primary { background: var(--accent); color: var(--text-inverse);
  border: none; border-radius: 12px; height: 44px; padding: 0 20px;
  font: Inter 600 15px; transition: all 150ms ease; }
.btn-primary:hover  { background: var(--accent-hover); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }

/* Secondary */
.btn-secondary { background: transparent; color: var(--text-primary);
  border: 1px solid var(--border-default); border-radius: 12px;
  height: 44px; padding: 0 20px; font: Inter 500 15px; }
.btn-secondary:hover { background: var(--bg-elevated); }

/* Ghost */
.btn-ghost { background: transparent; color: var(--text-secondary);
  border: none; border-radius: 10px; height: 40px; padding: 0 14px;
  font: Inter 500 14px; }

/* Sizes: xs 28px | sm 36px | md 44px | lg 52px | xl 56px */
```

### 8.2 Cards

```css
.card { background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 20px; padding: 20px; }
.card-sm { border-radius: 16px; padding: 16px; }
.card-interactive { cursor: pointer; transition: transform 200ms ease; }
.card-interactive:hover { transform: translateY(-2px); border-color: var(--border-default); }
.card-selected { border-color: var(--accent); background: var(--accent-bg); }
.light .card { box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
```

### 8.3 Badges & Chips

```css
.badge { display: inline-flex; align-items: center; height: 22px;
  padding: 0 10px; border-radius: 999px; font: Inter 600 11px; }
.badge-green  { background: var(--accent-bg); color: var(--accent); }
.badge-amber  { background: rgba(245,158,11,0.12); color: var(--status-warning); }
.badge-red    { background: rgba(239,68,68,0.12); color: var(--status-danger); }
.badge-blue   { background: rgba(59,130,246,0.12); color: var(--status-info); }
.badge-gray   { background: var(--bg-elevated); color: var(--text-secondary); }

.chip { height: 36px; padding: 0 16px; border-radius: 999px;
  border: 1px solid var(--border-default); background: transparent;
  font: Inter 500 13px; color: var(--text-secondary); cursor: pointer; }
.chip:hover    { border-color: var(--border-strong); color: var(--text-primary); }
.chip-selected { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); }
```

### 8.4 Progress Ring (SVG)

```
viewBox: 0 0 160 160
Track:    r=54, stroke: --border-subtle, strokeWidth: 8
Progress: r=54, stroke: --accent, strokeWidth: 8, strokeLinecap: round
          strokeDasharray = 2π×54 = 339.29
          strokeDashoffset = 339.29 × (1 - progress/100)
          transform: rotate(-90 80 80)
          transition: strokeDashoffset 1s cubic-bezier(0.34,1.56,0.64,1)
Center:   DM Sans 800 28px (label), Inter 400 12px (sublabel)
```

### 8.5 Progress Bar

```css
.progress-track { width: 100%; height: 6px; border-radius: 999px; background: var(--bg-elevated); overflow: hidden; }
.progress-fill  { height: 100%; border-radius: 999px; background: var(--accent);
  transition: width 600ms cubic-bezier(0.34,1.56,0.64,1); }
```

### 8.6 Inputs

```css
.input { width: 100%; height: 44px; padding: 0 16px; border-radius: 12px;
  border: 1px solid var(--border-default); background: var(--bg-surface);
  color: var(--text-primary); font: Inter 400 15px; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
.input.error { border-color: var(--status-danger); }
```

### 8.7 Toggle

```css
.toggle-track { width: 44px; height: 24px; border-radius: 999px;
  background: var(--border-default); position: relative; cursor: pointer; }
.toggle-track.on { background: var(--accent); }
.toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white;
  position: absolute; top: 3px; left: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  transition: transform 200ms cubic-bezier(0.34,1.56,0.64,1); }
.toggle-track.on .toggle-thumb { transform: translateX(20px); }
```

---

## 9. ICON SYSTEM

**Library:** Lucide React exclusively. Stroke width: 1.75 (default). Always `currentColor`.

**Nav icons:** LayoutDashboard · BarChart3 · Target · CalendarDays · Utensils · Dumbbell · Users · MessageSquare · MessageCircle · Settings · Paintbrush · HelpCircle · ShieldCheck (Admin) · GraduationCap (Coach)

**Sizes:** Nav=18px · Buttons=18px · TopBar=20px · Inline=15px · Mobile tab=24px · Empty state=64px

---

## 10. MOTION & ANIMATION

```typescript
// Page entry
{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }

// Card stagger
{ staggerChildren: 0.07, delayChildren: 0.05 }
{ hidden: { opacity: 0, y: 18, scale: 0.975 }, visible: { opacity: 1, y: 0, scale: 1 } }

// Bottom sheet
{ hidden: { y: '100%' }, visible: { y: 0, transition: { duration: 0.35 } } }

// Modal
{ hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.22 } } }

// Sidebar expand/collapse
{ animate: { width: isExpanded ? 240 : 64 }, transition: { duration: 0.25, ease: [0.16,1,0.3,1] } }
// Labels: animate opacity 0→1 (150ms delay after sidebar expands)

// Timer ring countdown: stroke-dashoffset, 1 second tick
// Number count-up: useMotionValue → useTransform, 800ms easeOut
// Set completion: scale spring [1, 1.2, 1] + green flash
// PR badge: scale 0→1, rotate -15→0, spring 500ms
// Buttons: whileHover scale 1.01, whileTap scale 0.97
```

---

## 11. RESPONSIVE BREAKPOINTS

| Range | Sidebar | Bottom Nav | Columns |
|---|---|---|---|
| <768px | Hidden (bottom nav) | Visible | 1 col |
| 768–1023px | Hidden | Visible | 1–2 col |
| 1024–1279px | 64px icons | Hidden | 2 col |
| 1280px+ | 64px → 240px (click-expand) | Hidden | 2–3 col |

---

## 12. CHARTS (Recharts Universal Config)

```typescript
cartesianGrid: { strokeDasharray: "4 4", stroke: "var(--chart-grid)", vertical: false }
xAxis: { tick: { fill: "var(--chart-axis)", fontSize: 11 }, axisLine: false, tickLine: false }
yAxis: { tick: { fill: "var(--chart-axis)", fontSize: 11 }, axisLine: false, tickLine: false }
tooltip: { contentStyle: {
  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
  borderRadius: "12px", fontSize: "13px", fontFamily: "Inter",
  color: "var(--text-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
}}
// ALWAYS use CSS variables for colors — never hardcode hex in charts
```

---

## 13. ACCESSIBILITY

```css
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```
- All touch targets: 44×44px minimum
- All icon-only buttons: `aria-label` required
- Progress rings: `role="progressbar"` with aria-value attributes
- Modals: `role="dialog"` `aria-modal="true"`
- Nav: `aria-current="page"` on active item

---

*SuperFit Design System v2.0 | Desktop: Image 1 + Image 3 | Mobile: Image 2*