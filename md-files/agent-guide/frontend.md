# frontend.md — Frontend Development Rules for AI Agents
> Read this file before writing any React components, hooks, forms, routing, state management,
> data fetching, or client-side logic. Also read `design.md` for all visual decisions.
> AI-generated frontend code is often functional but inaccessible, unoptimized, and inconsistent.

---

## ⚛️ React Component Philosophy

### One Responsibility Per Component
```typescript
// ❌ God component — does too much
function UserDashboard() {
  // Fetches user, handles auth, shows stats, renders table, manages form...
}

// ✅ Composed — each piece does one thing
function UserDashboard() {
  return (
    <AuthGate>
      <DashboardLayout>
        <UserStats />
        <RecentActivityTable />
        <QuickActionForm />
      </DashboardLayout>
    </AuthGate>
  )
}
```

### Component Size Rule
- < 100 lines: ideal
- 100–200 lines: acceptable — consider splitting
- > 200 lines: must split into smaller components

### Naming Conventions
```typescript
// Components: PascalCase, noun-based
UserProfileCard.tsx
OrderSummaryTable.tsx

// Hooks: camelCase, "use" prefix, verb phrase
useCurrentUser.ts
useOrderHistory.ts
useDebounce.ts

// Utilities: camelCase, verb-first
formatCurrency.ts
parseOrderTotal.ts
validateEmail.ts

// Pages: kebab-case directories (Next.js App Router)
app/dashboard/page.tsx
app/orders/[id]/page.tsx
```

---

## 🗂 Component Architecture

### File Structure Per Feature
```
features/orders/
├── components/
│   ├── OrderCard.tsx          # Presentational
│   ├── OrderTable.tsx         # Presentational
│   └── OrderStatusBadge.tsx   # Presentational
├── hooks/
│   ├── useOrders.ts           # Data + state
│   └── useOrderActions.ts     # Mutations
├── types/
│   └── order.types.ts
└── index.ts                   # Public API
```

### Container vs Presentational Pattern
```typescript
// ✅ Presentational — pure, testable, no data fetching
interface OrderCardProps {
  order:     Order
  onSelect:  (id: string) => void
  isSelected: boolean
}

function OrderCard({ order, onSelect, isSelected }: OrderCardProps) {
  return (
    <div
      onClick={() => onSelect(order.id)}
      aria-pressed={isSelected}
      role="button"
      className={`card ${isSelected ? 'card--selected' : ''}`}
    >
      <h3>{order.title}</h3>
      <OrderStatusBadge status={order.status} />
    </div>
  )
}

// ✅ Container — fetches, transforms, passes down
function OrderListContainer() {
  const { orders, isLoading, error } = useOrders()

  if (isLoading) return <OrderListSkeleton />
  if (error)     return <ErrorState message={error.message} />
  if (!orders.length) return <EmptyState title="No orders yet" />

  return <OrderTable orders={orders} />
}
```

---

## 🎣 Custom Hooks

### Always Handle All States
```typescript
// ✅ Complete hook — loading, error, data, and mutations
function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false  // ✅ Prevent stale state from unmounted component

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchOrders(filters)
        if (!cancelled) setOrders(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [filters])  // ✅ Stable dependency — use useMemo for object filters

  return { orders, isLoading, error }
}
```

### Hook Rules
- One concern per hook
- Always clean up in `useEffect` return function
- Never call hooks conditionally
- Stable references for object/array dependencies (`useMemo`, `useCallback`)
- Name async operations clearly — avoid ambiguous `data`, `result`

---

## 📋 Forms

### Always Use Schema Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ✅ Schema first — single source of truth for client + server
const CreateOrderSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').max(100),
  quantity:    z.number().int().positive('Quantity must be a positive number'),
  deliveryDate: z.string().refine(d => new Date(d) > new Date(), 'Must be a future date'),
})

type CreateOrderInput = z.infer<typeof CreateOrderSchema>

function CreateOrderForm({ onSuccess }: { onSuccess: (order: Order) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
  })

  async function onSubmit(data: CreateOrderInput) {
    const order = await createOrder(data)
    onSuccess(order)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField>
        <Label htmlFor="title">Order title</Label>
        <Input
          id="title"
          {...register('title')}
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
        {errors.title && (
          <FormError id="title-error" role="alert">
            {errors.title.message}
          </FormError>
        )}
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create order'}
      </Button>
    </form>
  )
}
```

### Form Rules
- Always use `react-hook-form` + `zod` — no raw `useState` for form state
- Validation schema shared with backend where possible
- `aria-invalid` and `aria-describedby` on every input with errors
- Disable submit button during submission — never allow double-submit
- Show inline errors immediately after blur — not only on submit
- Never reset the form on error — preserve user input

---

## 🌐 Data Fetching

### Strategy: Server Components First (Next.js App Router)
```typescript
// ✅ Server Component — data fetched at request time, no client JS
// app/dashboard/page.tsx
async function DashboardPage() {
  const stats = await getStats()           // Direct DB call — no fetch overhead
  const recent = await getRecentOrders()

  return (
    <DashboardLayout>
      <StatsGrid stats={stats} />
      <RecentOrdersTable orders={recent} />
    </DashboardLayout>
  )
}

// ✅ Client Component — only for interactivity
'use client'
function OrderFilters({ onFilter }: { onFilter: (f: Filters) => void }) {
  // Interactive — needs client
}
```

### Client-Side Data Fetching Pattern
```typescript
// ✅ Use SWR or React Query — never raw fetch in components
import useSWR from 'swr'

function useUser(id: string) {
  const { data, error, isLoading, mutate } = useSWR<User>(
    id ? `/api/users/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    user:      data,
    isLoading,
    error,
    refresh:   mutate,
  }
}

// ✅ Typed fetcher with error handling
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(err.detail || 'Request failed', res.status)
  }
  return res.json()
}
```

---

## 🗃 State Management

### State Lives at the Lowest Possible Level

```
UI State (hover, modal open)    → local useState in component
Form state                      → react-hook-form
Server/async state              → SWR / React Query
Shared UI state (theme, toast)  → React Context (light)
Complex global state            → Zustand (only when needed)
URL state (filters, pagination) → URL search params
```

```typescript
// ✅ URL as state — survives refresh, shareable, bookmarkable
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

function ProductFilters() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const category     = searchParams.get('category') ?? 'all'

  function setCategory(c: string) {
    const params = new URLSearchParams(searchParams)
    params.set('category', c)
    router.push(`?${params.toString()}`)
  }

  return <CategorySelect value={category} onChange={setCategory} />
}

// ✅ Zustand — only for truly global state (auth user, cart, notifications)
import { create } from 'zustand'

interface NotificationStore {
  notifications: Notification[]
  add:    (n: Notification) => void
  remove: (id: string)      => void
}

const useNotifications = create<NotificationStore>()(set => ({
  notifications: [],
  add:    (n) => set(s => ({ notifications: [...s.notifications, n] })),
  remove: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}))
```

---

## 🔀 Routing (Next.js App Router)

```
app/
├── layout.tsx          # Root layout — HTML, body, providers
├── page.tsx            # Home page
├── (auth)/             # Route group — no URL segment
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/        # Route group with shared layout
│   ├── layout.tsx      # Dashboard shell — sidebar, nav
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
└── api/
    └── v1/
        └── users/
            └── route.ts
```

```typescript
// ✅ Protect routes with middleware
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = { matcher: ['/dashboard/:path*', '/settings/:path*'] }
```

---

## ⏳ Loading & Suspense

```typescript
// ✅ Always design all three states
function OrderSection() {
  const { orders, isLoading, error } = useOrders()

  // Loading
  if (isLoading) return <OrderTableSkeleton rows={5} />

  // Error
  if (error) return (
    <ErrorCard
      title="Couldn't load orders"
      message={error.message}
      action={<Button onClick={retry}>Try again</Button>}
    />
  )

  // Empty
  if (!orders.length) return (
    <EmptyState
      icon={<BoxIcon />}
      title="No orders yet"
      description="Create your first order to get started."
      action={<Button href="/orders/new">Create order</Button>}
    />
  )

  // Data
  return <OrderTable orders={orders} />
}

// ✅ Skeleton loading — matches final layout (prevents CLS)
function OrderTableSkeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-label="Loading orders">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row animate-pulse" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}
```

---

## ♿ Accessibility Baseline

```typescript
// ✅ Semantic HTML — always the first choice
<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
<h1>–<h6>  (one h1 per page)
<ul>, <ol>, <li>
<button> for actions, <a> for navigation
<table>, <thead>, <th scope="col"> for tabular data

// ✅ Focus management for modals and dialogs
function Modal({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  return open ? (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={ref}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  ) : null
}

// ✅ Live regions for async updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

---

## ❗ Error Boundaries

```typescript
// ✅ Wrap all major sections in error boundaries
'use client'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="error-card">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  )
}

// In layout or page
<ErrorBoundary FallbackComponent={ErrorFallback} onError={reportError}>
  <UserDashboard />
</ErrorBoundary>
```

---

## 📏 TypeScript Rules

```typescript
// ✅ Explicit prop types — never 'any'
interface ButtonProps {
  variant:   'primary' | 'secondary' | 'destructive' | 'ghost'
  size?:     'sm' | 'md' | 'lg'
  disabled?: boolean
  isLoading?: boolean
  onClick?:  () => void
  children:  React.ReactNode
}

// ✅ Type API responses — never trust 'any'
type ApiResponse<T> = {
  data:    T
  meta?:   PaginationMeta
  errors?: ApiError[]
}

// ✅ Discriminated unions for state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error';   error: Error }

// ❌ Never
const data: any = await fetch(...)
function render(props: any) {}
```

---

## ✅ Frontend Checklist — Run Before Every PR

**Components:**
- [ ] Single responsibility — one concern per component
- [ ] All props typed — no `any`
- [ ] Loading, error, and empty states all implemented
- [ ] Error boundary wrapping data-dependent sections

**Forms:**
- [ ] Using `react-hook-form` + `zod`
- [ ] All inputs have visible `<Label>` elements
- [ ] Errors linked via `aria-describedby`
- [ ] Submit disabled during submission

**Data Fetching:**
- [ ] Server Components used for initial load where possible
- [ ] Client fetches use SWR / React Query — no raw fetch in components
- [ ] Race conditions handled (cleanup in `useEffect`)

**Accessibility:**
- [ ] Semantic HTML used throughout
- [ ] Keyboard navigation works for all interactions
- [ ] Focus visible on all interactive elements
- [ ] `aria-live` for dynamic content updates
- [ ] Modals trap focus and close on Escape

**Performance:**
- [ ] Lists > 100 items virtualized
- [ ] Heavy components lazy-loaded
- [ ] Images optimized with `next/image`
- [ ] No `useEffect` without cleanup where needed

**TypeScript:**
- [ ] No `any` types
- [ ] All event handlers typed
- [ ] API responses typed with interfaces

---

> **Remember**: Frontend code runs on devices you don't control, networks you can't predict,
> and for users with diverse abilities and needs. Build defensively.
> Always handle the unhappy path — it's what users experience most.
