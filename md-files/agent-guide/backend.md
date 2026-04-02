# backend.md — Backend Development Rules for AI Agents
> Read this file before writing any: API routes, database queries, service logic,
> background jobs, external integrations, error handling, or logging.
> Also read `security.md` for all auth/data/input handling rules.
> AI-generated backend code is often functional but insecure, unlogged, and brittle.

---

## 🏛 Architecture Principles

### Layered Architecture — Responsibilities Are Fixed

```
Request → Route → Middleware → Controller → Service → Repository → Database
                                    ↓
                              Error Handler
```

| Layer | Responsibility | What It Must NOT Do |
|-------|---------------|-------------------|
| Route | Declare endpoints, apply middleware | Business logic |
| Middleware | Auth, rate limit, validation, logging | Data access |
| Controller | Parse request, call service, return response | DB queries |
| Service | Business logic, orchestration | HTTP concerns |
| Repository | Data access, query building | Business logic |

```typescript
// ✅ Clean separation example

// route.ts
router.post('/orders', requireAuth, validate(CreateOrderSchema), createOrderController)

// controller.ts
async function createOrderController(req: AuthRequest, res: Response) {
  const order = await orderService.create(req.user.id, req.body)
  res.status(201).json({ data: order })
}

// service.ts
async function create(userId: string, input: CreateOrderInput): Promise<Order> {
  const user    = await userRepo.findById(userId)
  const product = await productRepo.findById(input.productId)
  if (product.stock < input.quantity) throw new AppError('Insufficient stock', 'OUT_OF_STOCK', 409)
  return orderRepo.create({ userId, productId: product.id, quantity: input.quantity })
}

// repository.ts
async function create(data: CreateOrderData): Promise<Order> {
  return db.order.create({ data, include: { product: true, user: { select: { id, name } } } })
}
```

---

## 🌐 API Design

### Standard Response Envelope

```typescript
// ✅ Every response follows this shape
interface ApiResponse<T> {
  data:    T
  meta?:   PaginationMeta
  errors?: ApiError[]
}

// Single resource
res.json({ data: user })

// Collection with pagination
res.json({
  data: orders,
  meta: { page: 2, perPage: 20, total: 145, totalPages: 8 },
})

// Error (from error handler — never manually)
res.status(422).json({
  type:     'https://yourapi.com/errors/validation-error',
  title:    'Validation Error',
  status:   422,
  detail:   'Email format is invalid.',
  instance: req.originalUrl,
})
```

### URL Structure Rules

```
# ✅ Correct
GET    /api/v1/users
GET    /api/v1/users/:id
GET    /api/v1/users/:id/orders
POST   /api/v1/users/:id/orders
PUT    /api/v1/orders/:id
PATCH  /api/v1/orders/:id
DELETE /api/v1/orders/:id

# ❌ Wrong
GET  /api/getUsers
POST /api/createOrder
GET  /api/user/:id          ← singular
GET  /api/order_items       ← snake_case
```

- **Nouns, not verbs** in URLs
- **Plural** for collections
- **kebab-case** for multi-word segments
- **Version in path**: `/api/v1/...`
- **camelCase** for JSON property names

### HTTP Methods & Status Codes

| Method | Success Code | Notes |
|--------|-------------|-------|
| GET | 200 | Never modifies state |
| POST | 201 + Location header | Creates resource |
| PUT | 200 | Full replacement |
| PATCH | 200 | Partial update |
| DELETE | 204 | No response body |
| POST (action) | 200 | e.g., `/orders/:id/cancel` |

### IDs — Never Expose Auto-Increment

```typescript
// ❌ Leaks database size and enumeration attack surface
{ "id": 1042 }

// ✅ UUID
{ "id": "01933e7a-f1c2-7f2b-a453-84bde3c1b2ab" }

// ✅ Prefixed opaque ID (Stripe-style)
{ "id": "ord_01933e7a_f1c2_7f2b" }
```

---

## ❌ Error Handling

### Typed Error Hierarchy

```typescript
// lib/errors.ts — define once, use everywhere

export class AppError extends Error {
  constructor(
    message:    string,
    public readonly code:          string,
    public readonly statusCode:    number,
    public readonly isOperational: boolean = true,  // false = programmer error
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND', 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }
}
```

### Global Error Handler — RFC 7807

```typescript
// middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const correlationId = req.headers['x-correlation-id'] as string ?? crypto.randomUUID()

  // Log full error internally
  logger.error('Request failed', {
    correlationId,
    errorName:  err.name,
    errorCode:  err instanceof AppError ? err.code : 'INTERNAL_ERROR',
    message:    err.message,
    stack:      err.stack,
    path:       req.path,
    method:     req.method,
    userId:     req.user?.id,
  })

  // Operational errors → safe to expose details
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      type:     `https://yourapi.com/errors/${err.code.toLowerCase().replace(/_/g, '-')}`,
      title:    err.name,
      status:   err.statusCode,
      detail:   err.message,
      instance: req.originalUrl,
      ...(err instanceof ValidationError && err.fields ? { fields: err.fields } : {}),
    })
  }

  // Unknown errors → never expose internals
  res.status(500).json({
    type:     'https://yourapi.com/errors/internal-server-error',
    title:    'Internal Server Error',
    status:   500,
    detail:   'An unexpected error occurred. Please try again later.',
    instance: req.originalUrl,
  })
}

// ✅ Unhandled rejection / exception handlers
process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled promise rejection', { reason })
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', { message: error.message, stack: error.stack })
  process.exit(1)
})
```

### Result Types for Expected Failures

```typescript
type Result<T, E = AppError> =
  | { ok: true;  value: T }
  | { ok: false; error: E }

// Use for operations with known, recoverable failure modes
async function findUserByEmail(email: string): Promise<Result<User, NotFoundError>> {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { ok: false, error: new NotFoundError('User', email) }
  return { ok: true, value: user }
}
```

---

## 📝 Logging

### Structured JSON Logging — Always

```typescript
import { createLogger, format, transports } from 'winston'

export const logger = createLogger({
  level:  process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'api' },
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? format.combine(format.colorize(), format.simple())
        : format.json(),
    }),
  ],
})
```

### Request Logging Middleware

```typescript
// ✅ Log every request with correlation ID
app.use((req, res, next) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID()
  const start         = Date.now()

  res.setHeader('x-correlation-id', correlationId)

  req.log = logger.child({
    correlationId,
    requestId: crypto.randomUUID(),
    userId:    req.user?.id,
  })

  req.log.info('Incoming request', {
    method:    req.method,
    path:      req.path,
    userAgent: req.headers['user-agent'],
    ip:        req.ip,
  })

  res.on('finish', () => {
    req.log.info('Request completed', {
      statusCode: res.statusCode,
      duration:   Date.now() - start,
    })
  })

  next()
})
```

### What to Log / What NOT to Log

```typescript
// ✅ LOG: request metadata, state changes, external calls, slow queries, security events
logger.info('Order created', { orderId: order.id, userId, total: order.total })
logger.warn('Slow query detected', { query: 'findOrders', duration: 3200, threshold: 1000 })
logger.error('Stripe charge failed', { orderId, stripeCode: err.code, retryable: true })

// ❌ NEVER LOG: passwords, tokens, full request body (may contain credentials), PII
// ✅ Log safe identifiers instead
logger.info('User login', {
  userId: user.id,
  email:  maskEmail(user.email),  // j***@example.com
  ip:     req.ip,
  success: true,
})

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}
```

---

## 🔁 Retry & Circuit Breaker

### Exponential Backoff for External Calls

```typescript
async function withRetry<T>(
  fn:      () => Promise<T>,
  options: { maxRetries?: number; baseMs?: number; maxMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseMs = 200, maxMs = 10_000 } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Don't retry programmer errors
      if (error instanceof AppError && !error.isOperational) throw error

      const delay = Math.min(baseMs * 2 ** attempt + Math.random() * 100, maxMs)
      logger.warn('Retrying after failure', { attempt, delay, error: (error as Error).message })
      await sleep(delay)
    }
  }

  throw new Error('Unreachable')
}
```

### Circuit Breaker for External Services

```typescript
class CircuitBreaker {
  private failures  = 0
  private lastFail  = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly threshold   = 5,
    private readonly resetMs     = 30_000,
    private readonly serviceName = 'external-service',
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFail > this.resetMs) {
        this.state = 'half-open'
      } else {
        throw new AppError(`${this.serviceName} is unavailable`, 'CIRCUIT_OPEN', 503)
      }
    }

    try {
      const result  = await fn()
      this.failures = 0
      this.state    = 'closed'
      return result
    } catch (error) {
      this.failures++
      this.lastFail = Date.now()
      if (this.failures >= this.threshold) {
        this.state = 'open'
        logger.error(`Circuit breaker opened for ${this.serviceName}`)
      }
      throw error
    }
  }
}

// Instantiate per service (singleton)
export const stripeBreaker = new CircuitBreaker(5, 30_000, 'stripe')
export const emailBreaker  = new CircuitBreaker(3, 60_000, 'sendgrid')
```

---

## 💾 Database Patterns

### Always Use Transactions for Multi-Step Writes

```typescript
// ❌ Partial failure leaves data inconsistent
await db.order.create({ data: orderData })
await db.inventory.decrement({ where: { id: productId }, data: { stock: quantity } })
await db.payment.create({ data: paymentData })

// ✅ Atomic — all or nothing
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })

  await tx.inventory.update({
    where: { id: productId },
    data:  { stock: { decrement: quantity } },
  })

  await tx.payment.create({ data: { ...paymentData, orderId: order.id } })

  return order
})
```

### Soft Deletes — Never Hard Delete User Data

```typescript
// schema.prisma
model Order {
  id        String    @id @default(cuid())
  deletedAt DateTime?               // soft delete flag
}

// repository
async function softDelete(id: string): Promise<void> {
  await db.order.update({
    where: { id },
    data:  { deletedAt: new Date() },
  })
}

// Always filter soft-deleted records
async function findActive(userId: string): Promise<Order[]> {
  return db.order.findMany({
    where: { userId, deletedAt: null },
  })
}
```

---

## 🔗 External Service Integration

```typescript
// ✅ Wrap every external client in a typed service class
// services/emailService.ts

class EmailService {
  private readonly breaker = emailBreaker

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.breaker.execute(() =>
      withRetry(() =>
        sendgrid.send({
          to,
          from:        'noreply@myapp.com',
          templateId:  process.env.SENDGRID_WELCOME_TEMPLATE!,
          dynamicTemplateData: { name },
        })
      )
    )

    logger.info('Welcome email sent', { to: maskEmail(to) })
  }
}

export const emailService = new EmailService()
```

---

## 🔀 Background Jobs

```typescript
// ✅ Idempotent jobs — safe to retry on failure
async function processOrder(jobData: { orderId: string; attempt: number }): Promise<void> {
  const { orderId, attempt } = jobData

  // Check if already processed — idempotency key
  const existing = await db.orderProcessingLog.findUnique({ where: { orderId } })
  if (existing?.completedAt) {
    logger.info('Order already processed, skipping', { orderId })
    return
  }

  try {
    await db.$transaction(async (tx) => {
      await fulfillOrder(tx, orderId)
      await tx.orderProcessingLog.upsert({
        where:  { orderId },
        create: { orderId, completedAt: new Date() },
        update: { completedAt: new Date() },
      })
    })
  } catch (error) {
    logger.error('Order processing failed', { orderId, attempt, error: (error as Error).message })
    throw error  // Let queue retry with backoff
  }
}
```

---

## 🏥 Health Checks

```typescript
// ✅ Health endpoint — required on all services
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
  ])

  const [db_check, cache_check] = checks
  const healthy = checks.every(c => c.status === 'fulfilled')

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: db_check.status === 'fulfilled' ? 'ok' : 'error',
      cache:    cache_check.status === 'fulfilled' ? 'ok' : 'error',
    },
  })
})
```

---

## ✅ Backend Checklist — Run Before Every PR

**API Design:**
- [ ] URLs use plural nouns, kebab-case, versioned `/api/v1/...`
- [ ] HTTP methods match CRUD semantics
- [ ] All responses use standard envelope `{ data, meta?, errors? }`
- [ ] All errors use RFC 7807 Problem Details format
- [ ] IDs are UUIDs or prefixed — no auto-increment exposed

**Error Handling:**
- [ ] Custom error classes with code, statusCode, isOperational
- [ ] Global error handler in place — no leaking stacks to clients
- [ ] All async functions have try-catch or propagate typed errors
- [ ] `unhandledRejection` and `uncaughtException` handlers registered
- [ ] External calls wrapped in retry + circuit breaker

**Logging:**
- [ ] Structured JSON logging on all requests
- [ ] Correlation ID generated and propagated
- [ ] No PII, passwords, or tokens in any log
- [ ] Errors logged with full context (correlationId, path, userId, stack)

**Database:**
- [ ] Multi-step writes in transactions
- [ ] No N+1 queries — eager load with `include`/`select`
- [ ] All list endpoints paginated
- [ ] Soft deletes for user data
- [ ] Singleton DB client — no per-request instantiation

**Security:**
- [ ] All inputs validated with schema before use
- [ ] Auth middleware on every protected route
- [ ] RBAC checked before every data read/write
- [ ] Rate limiting applied

**Reliability:**
- [ ] Health check endpoint at `/health`
- [ ] Background jobs are idempotent
- [ ] External service calls use retry + circuit breaker

---

> **Remember**: Backend code is the last line of defense for your data.
> Be explicit about every failure mode. Log everything useful. Expose nothing sensitive.
