# performance.md — Performance Rules for AI Agents
> Read this file before writing any: database queries, API endpoints, React components,
> data-fetching logic, list rendering, caching layers, or background jobs.
> Measure first. Optimize with data. Never sacrifice readability for unmeasured gains.

---

## ⚡ Core Performance Principles

### 1. Measure Before Optimizing
- Profile before making changes — assumptions are often wrong
- Use data-driven decisions: flame graphs, query plans, Lighthouse scores
- Set measurable budgets before writing a single line of optimization
- Benchmark before **and** after every optimization

### 2. Clarity First, Performance Second
- Readable, correct code — then optimize based on real profiling
- Premature optimization is the root of all evil
- Annotate performance-critical sections: `// PERF: O(n) — justified by X`

### 3. Think End-to-End
- Network latency usually dominates over CPU time
- Database queries are almost always the bottleneck — start there
- Always consider the full request/render lifecycle, not just one function

---

## 🗄 Database Performance

### The N+1 Problem — Never Ship This

```typescript
// ❌ N+1 — 1 query for users + 1 per user = death at scale
const users = await prisma.user.findMany()
for (const user of users) {
  user.posts = await prisma.post.findMany({ where: { authorId: user.id } })
}

// ✅ Single query with eager loading
const users = await prisma.user.findMany({
  include: {
    posts: { select: { id: true, title: true, createdAt: true } },
    _count: { select: { orders: true } },
  },
})
```

```python
# ❌ N+1 in SQLAlchemy
users = session.query(User).all()
for user in users:
    _ = user.posts  # Triggers separate query per user

# ✅ Eager loading with joinedload
from sqlalchemy.orm import joinedload
users = session.query(User).options(joinedload(User.posts)).all()
```

### Always Select Only What You Need

```typescript
// ❌ Loads entire record including large blobs
const users = await prisma.user.findMany()

// ✅ Select only required fields
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true, role: true },
})
```

### Pagination — Never Return Unbounded Collections

```typescript
// ❌ NEVER — unbounded query
const all = await prisma.post.findMany()

// ✅ Cursor-based pagination (preferred for real-time / large datasets)
async function listPosts(cursor?: string, limit = 20) {
  const take   = Math.min(limit, 100)
  const parsed = cursor ? JSON.parse(Buffer.from(cursor, 'base64url').toString()) : null

  const rows = await prisma.post.findMany({
    take:    take + 1,
    orderBy: { createdAt: 'desc' },
    ...(parsed && { cursor: { id: parsed.id }, skip: 1 }),
    select:  { id: true, title: true, createdAt: true },
  })

  const hasMore   = rows.length > take
  const items     = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ id: items.at(-1)!.id })).toString('base64url')
    : null

  return { items, nextCursor, hasMore }
}

// ✅ Offset pagination (simpler, fine for stable/admin data)
async function listProducts(page = 1, perPage = 20) {
  const take   = Math.min(perPage, 100)
  const skip   = (page - 1) * take
  const [total, items] = await prisma.$transaction([
    prisma.product.count(),
    prisma.product.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
  ])
  return { items, total, page, perPage: take, totalPages: Math.ceil(total / take) }
}
```

### Database Indexes — Required Before Production

```sql
-- ✅ Index foreign keys (Prisma does NOT auto-create these on all DBs)
CREATE INDEX idx_posts_author_id   ON posts(author_id);
CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ✅ Composite index for common filter + sort combos
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);

-- ✅ Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

### Query Performance Targets

| Endpoint Type | p50 | p95 | p99 |
|--------------|-----|-----|-----|
| Cached reads | <50ms | <100ms | <200ms |
| DB reads | <100ms | <200ms | <500ms |
| Write operations | <200ms | <500ms | <1000ms |
| AI-powered | <500ms | <2000ms | <5000ms |
| Batch/background | <1s | <5s | <10s |

---

## 🔴 Caching Strategy

### Cache-Aside Pattern (Read-Through)

```typescript
async function getUser(userId: string): Promise<User> {
  const key    = `user:${userId}:v1`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as User

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  })

  await redis.set(key, JSON.stringify(user), 'EX', 5 * 60)  // 5 min TTL
  return user
}

// ✅ Always invalidate on mutation
async function updateUser(userId: string, data: UpdateUserInput): Promise<User> {
  const user = await db.user.update({ where: { id: userId }, data })
  await redis.del(`user:${userId}:v1`)
  return user
}
```

### Cache TTL Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User session | 15 min (sliding) | Security vs UX balance |
| User profile | 5 min | Infrequent updates |
| Product catalog | 1 hour | Rarely changes |
| Homepage/landing | 24 hours | Static content |
| Real-time data | 0 (no cache) | Must be fresh |
| Config/feature flags | 5 min | Low volatility |

---

## ⚛️ Frontend Performance

### Bundle Size — Minimize It

```typescript
// ✅ Dynamic imports for heavy or conditionally-shown components
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false,
})

// ✅ Named imports — tree-shake everything
import { format, parseISO } from 'date-fns'      // ✅ tree-shaken
import * as dateFns from 'date-fns'               // ❌ imports entire library

import { Button } from '@/components/ui/Button'   // ✅ direct
import * as UI from '@/components/ui'             // ❌ bundles all UI components
```

### Memoization — Use With Evidence

```typescript
// ✅ Memoize genuinely expensive pure computations
const sortedAndFiltered = useMemo(
  () =>
    items
      .filter(i => i.status === filter)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  [items, filter]  // Only recompute when these change
)

// ✅ Stable callbacks for child component props
const handleSubmit = useCallback(
  (data: FormData) => onSubmit({ ...data, userId }),
  [onSubmit, userId]
)

// ❌ Over-memoization — useMemo on trivial operations is noise
const doubled = useMemo(() => count * 2, [count])  // Pointless
```

### Virtualize Long Lists

```typescript
import { FixedSizeList } from 'react-window'

// ✅ Required for any list > 100 items
function UserList({ users }: { users: User[] }) {
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={users.length}
      itemSize={64}
    >
      {({ index, style }) => (
        <UserRow user={users[index]} style={style} key={users[index].id} />
      )}
    </FixedSizeList>
  )
}
```

### Core Web Vitals Targets

| Metric | Target | Meaning |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | Main content load time |
| FID / INP (Interaction to Next Paint) | ≤ 200ms | Interactivity |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | Visual stability |
| FCP (First Contentful Paint) | ≤ 1.8s | Time to first pixel |
| TTFB (Time to First Byte) | ≤ 800ms | Server response time |

### Image Optimization — Always

```typescript
import Image from 'next/image'

// ✅ Always specify width/height (prevents CLS)
// ✅ priority on above-the-fold images (prevents LCP miss)
// ✅ sizes for responsive images
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority
  sizes="(max-width: 768px) 100vw, 1200px"
  placeholder="blur"
  blurDataURL={blurPlaceholder}
/>

// ✅ Lazy load below-the-fold images (default in Next.js Image)
<Image src="/feature.jpg" alt="Feature" width={600} height={400} />
```

---

## ⚙️ Backend Performance

### Parallelize Independent Operations

```typescript
// ❌ Sequential — wastes time
const user    = await fetchUser(id)
const posts   = await fetchPosts(id)
const profile = await fetchProfile(id)

// ✅ Parallel — 3x faster when independent
const [user, posts, profile] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchProfile(id),
])

// ✅ Parallel with independent error handling
const [userResult, postsResult] = await Promise.allSettled([
  fetchUser(id),
  fetchPosts(id),
])
```

### Connection Pooling

```typescript
// prisma/schema.prisma
// Configure pool size based on DB plan
// connection_limit = (2 * CPU cores) + effective_spindle_count
// For serverless: use @prisma/adapter-neon or similar

// ✅ Singleton Prisma client — never instantiate per-request
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Stream Large Data — Never Load Into Memory

```typescript
// ✅ Stream CSV export instead of buffering all rows
import { stringify } from 'csv-stringify'
import { pipeline } from 'stream/promises'

app.get('/api/export/users', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"')

  const cursor    = db.user.findMany({ select: { id, name, email, createdAt: true } })
  const csvStream = stringify({ header: true })

  await pipeline(
    Readable.from(cursor),
    csvStream,
    res
  )
})
```

---

## 🔁 Algorithm Complexity

### Common Anti-Patterns

```typescript
// ❌ O(n²) — nested loop over same data
for (const a of items) {
  for (const b of items) {
    if (a.teamId === b.teamId && a.id !== b.id) { /* group */ }
  }
}

// ✅ O(n) — use a Map
const byTeam = new Map<string, Item[]>()
for (const item of items) {
  const group = byTeam.get(item.teamId) ?? []
  group.push(item)
  byTeam.set(item.teamId, group)
}

// ❌ O(n) repeated lookups in hot path
function getItem(id: string) {
  return items.find(i => i.id === id)  // O(n) each call
}

// ✅ O(1) with Map
const itemMap = new Map(items.map(i => [i.id, i]))
function getItem(id: string) { return itemMap.get(id) }
```

### Complexity Targets

| Complexity | Verdict |
|-----------|---------|
| O(1) | Always preferred — hash maps, direct access |
| O(log n) | Good — binary search, balanced trees |
| O(n) | Acceptable — single pass |
| O(n log n) | Acceptable for sorting |
| O(n²) | Avoid for n > 1000 |
| O(2ⁿ) | Never in production |

---

## 🧠 Memory Management

```typescript
// ✅ Clean up subscriptions, timers, and listeners
useEffect(() => {
  const timer  = setInterval(tick, 1000)
  const sub    = store.subscribe(handler)
  const resize = () => recalc()
  window.addEventListener('resize', resize)

  return () => {
    clearInterval(timer)
    sub.unsubscribe()
    window.removeEventListener('resize', resize)
  }
}, [])

// ✅ WeakMap for metadata that shouldn't prevent GC
const componentMeta = new WeakMap<Element, ComponentMeta>()

// ✅ Stream large files instead of buffering
import { createReadStream } from 'fs'
createReadStream('large.csv').pipe(csvParser).on('data', processRow)
```

---

## 📊 Async Concurrency

```typescript
// ✅ Batch DB calls — avoid calling in a loop
const ids    = ['a', 'b', 'c', 'd', 'e']

// ❌ Loop with await
for (const id of ids) {
  await processItem(id)  // Sequential — N round trips
}

// ✅ Parallel with concurrency cap (avoid overwhelming DB)
import pLimit from 'p-limit'
const limit = pLimit(5)  // Max 5 concurrent
await Promise.all(ids.map(id => limit(() => processItem(id))))
```

---

## ✅ Performance Checklist — Run Before Every PR

**Database:**
- [ ] No N+1 queries — eager load all relations needed in one pass
- [ ] `select` used to fetch only required fields
- [ ] All list queries paginated with a max of 100 items
- [ ] Indexes exist for all FK columns, sort columns, and common filter combos
- [ ] `EXPLAIN ANALYZE` checked for any new complex query

**Caching:**
- [ ] Expensive reads cached (Redis / in-memory) with explicit TTL
- [ ] Cache invalidated on all mutation paths
- [ ] No stale-forever cache entries

**Frontend:**
- [ ] Heavy components lazy-loaded
- [ ] Images sized, formatted (WebP/AVIF), and lazy-loaded below fold
- [ ] Lists > 100 items virtualized
- [ ] Expensive computations memoized with `useMemo`
- [ ] Bundle impact assessed for any new dependency

**Backend:**
- [ ] Independent async operations parallelized with `Promise.all`
- [ ] Large datasets streamed, not buffered
- [ ] Connection pooling used (singleton Prisma client)
- [ ] Algorithm complexity O(n log n) or better for hot paths

**Memory:**
- [ ] `useEffect` cleanups implemented for all subscriptions / timers
- [ ] No unbounded in-memory growth (streams for large data)

---

> **Remember**: Performance is a feature. Ship measurably fast, not just theoretically efficient.
> Always profile before optimizing. Always benchmark after.
