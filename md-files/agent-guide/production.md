# production.md — Production Rules for AI Agents
> Read this file before any deployment, infrastructure change, environment configuration,
> CI/CD modification, database migration, or monitoring setup.
> Production is where mistakes are expensive and irreversible. Proceed with discipline.

---

## 🚨 Production Rules — Absolute

1. **NEVER push directly to `main`** — all changes go through PR + at least one human review
2. **NEVER run migrations without a rollback plan** — test on staging first
3. **NEVER deploy on Friday** — no exceptions without explicit team approval
4. **NEVER skip staging** — every change runs on staging before production
5. **NEVER merge with failing CI** — all checks must be green
6. **NEVER hardcode credentials anywhere** — secrets manager only
7. **NEVER delete data without a verified backup** — check backup freshness first

---

## 🌍 Environment Strategy

### Three-Environment Minimum

```
Development (local)  → Individual developer machines
Staging              → Mirrors production exactly — used for QA and pre-deploy verification
Production           → Live user traffic
```

### Environment Variables by Environment

```bash
# .env.example — committed, all keys present, placeholder values
NODE_ENV="development"
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_dev"
JWT_SECRET="dev-secret-replace-in-production"
REDIS_URL="redis://localhost:6379"
STRIPE_SECRET_KEY="sk_test_..."
LOG_LEVEL="debug"

# Staging — managed in secrets manager, NOT committed
NODE_ENV="staging"
DATABASE_URL="<from secrets manager>"
JWT_SECRET="<from secrets manager>"
LOG_LEVEL="info"

# Production — managed in secrets manager, NOT committed
NODE_ENV="production"
DATABASE_URL="<from secrets manager>"
JWT_SECRET="<from secrets manager>"
LOG_LEVEL="warn"
```

### Variable Safety Rules
```typescript
// ✅ Validate all required env vars at startup — fail fast
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

// config/env.ts — loaded once at boot
export const env = {
  nodeEnv:      requireEnv('NODE_ENV') as 'development' | 'staging' | 'production',
  databaseUrl:  requireEnv('DATABASE_URL'),
  jwtSecret:    requireEnv('JWT_SECRET'),
  redisUrl:     requireEnv('REDIS_URL'),
  logLevel:     process.env.LOG_LEVEL || 'info',
  port:         parseInt(process.env.PORT || '3000', 10),
}
```

---

## 🗄 Database Migrations

### Migration Safety Rules
- Migrations must be **backward compatible** during the deploy window (zero-downtime)
- The pattern: **expand → deploy → contract**
  1. Expand: Add new column/table (old code still works)
  2. Deploy: New code uses new column
  3. Contract: Remove old column in a separate migration after full deploy

```sql
-- ✅ Phase 1: Expand — add nullable column (old code ignores it)
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Deploy new code that writes to both old_name and display_name

-- ✅ Phase 2: Contract — backfill and set NOT NULL after deploy
UPDATE users SET display_name = name WHERE display_name IS NULL;
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;
-- Later: DROP COLUMN name (separate migration, separate deploy)

-- ❌ NEVER: Single migration that renames a column (breaks old code immediately)
ALTER TABLE users RENAME COLUMN name TO display_name;
```

### Migration Checklist
- [ ] Tested on a staging database that mirrors production schema
- [ ] Has a rollback script or verified `--down` migration
- [ ] Does not lock tables for > 1 second (test with `EXPLAIN` on large tables)
- [ ] Backup taken before running on production
- [ ] Timed — run during low-traffic window for table-locking operations
- [ ] Idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)

```bash
# Run migration with timeout monitoring
psql $DATABASE_URL \
  --command "SET lock_timeout = '5s';" \
  --file migration.sql
```

---

## 🚢 Deployment Process

### Standard Deploy Checklist

```
Pre-deploy:
- [ ] Feature branch merged to main via approved PR
- [ ] CI/CD pipeline green (lint, type check, tests, security scan)
- [ ] Staging deploy successful and verified
- [ ] Database migrations (if any) reviewed and tested
- [ ] Feature flag configured (for large changes)
- [ ] Rollback plan documented
- [ ] On-call engineer available

Deploy:
- [ ] Trigger deployment via CI/CD (never manually)
- [ ] Monitor deployment progress in real-time
- [ ] Watch error rate dashboard during rollout
- [ ] Run smoke tests immediately after deploy

Post-deploy:
- [ ] Monitor for 15 minutes: error rate, latency, memory, CPU
- [ ] Verify key user journeys manually
- [ ] Check log stream for unexpected errors
- [ ] Close the deploy in incident log
```

### Zero-Downtime Deploy Strategy

```yaml
# ✅ Rolling deploy with health checks (Kubernetes)
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge:       1
    maxUnavailable: 0     # Zero downtime

# ✅ Readiness probe — only route traffic to healthy pods
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds:       5
  failureThreshold:    3

# ✅ Graceful shutdown — finish in-flight requests
terminationGracePeriodSeconds: 30
```

```typescript
// ✅ Handle SIGTERM gracefully — finish in-flight, reject new
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — starting graceful shutdown')

  server.close(async () => {
    await db.$disconnect()
    await redis.disconnect()
    logger.info('Graceful shutdown complete')
    process.exit(0)
  })

  // Force exit after 25s (before k8s kills at 30s)
  setTimeout(() => process.exit(1), 25_000)
})
```

---

## 🚩 Feature Flags

### When to Use Feature Flags
- Any change affecting > 5% of users
- New pricing, billing, or payment flows — always
- Database schema changes that need coordinated rollout
- Experiments and A/B tests
- High-risk refactors

```typescript
import { Unleash } from 'unleash-client'

const unleash = new Unleash({
  appName:     'myapp',
  url:         process.env.UNLEASH_URL!,
  customHeaders: { Authorization: process.env.UNLEASH_TOKEN! },
})

// ✅ Check flag with user context for gradual rollout
function isFeatureEnabled(flagName: string, userId: string): boolean {
  return unleash.isEnabled(flagName, { userId })
}

// ✅ In routes/services
async function getCheckoutFlow(userId: string) {
  if (isFeatureEnabled('new-checkout-v2', userId)) {
    return newCheckoutService.process(userId)
  }
  return legacyCheckoutService.process(userId)
}
```

---

## 📊 Monitoring & Alerting

### Required Metrics — Alert on These

```yaml
# ✅ Error rate alert
- alert: HighErrorRate
  condition: http_errors_5xx / http_requests_total > 0.01  # > 1%
  for: 2m
  severity: critical
  action: Page on-call

# ✅ Latency alert
- alert: HighLatency
  condition: http_request_duration_p95 > 2000ms  # > 2s p95
  for: 5m
  severity: warning

# ✅ Database connection pool
- alert: DBPoolExhausted
  condition: db_connection_pool_available < 5
  for: 1m
  severity: critical

# ✅ Memory usage
- alert: HighMemoryUsage
  condition: memory_usage_percent > 85
  for: 5m
  severity: warning

# ✅ Disk usage
- alert: HighDiskUsage
  condition: disk_usage_percent > 80
  severity: warning
```

### Structured Logging for Production

```typescript
// ✅ Log format that Datadog / CloudWatch / ELK can parse
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "level": "error",
  "service": "order-api",
  "correlationId": "req_01933e7a",
  "userId": "usr_abc123",
  "message": "Payment processing failed",
  "errorCode": "CARD_DECLINED",
  "duration": 1243,
  "path": "/api/v1/orders",
  "method": "POST"
}

// ✅ Never in production
console.log('something failed:', err)  // Unstructured, no level, no context
```

### Health Check Implementation

```typescript
// ✅ Tiered health: liveness vs readiness
// Liveness: "is the process alive?" — restart if failing
app.get('/health/live', (_, res) => res.json({ status: 'ok' }))

// Readiness: "can this pod receive traffic?" — pull from rotation if failing
app.get('/health/ready', async (_, res) => {
  const [db, cache] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
  ])

  const ready = [db, cache].every(r => r.status === 'fulfilled')
  res.status(ready ? 200 : 503).json({
    status:    ready ? 'ready' : 'not-ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: db.status === 'fulfilled'    ? 'ok' : 'error',
      cache:    cache.status === 'fulfilled' ? 'ok' : 'error',
    },
  })
})
```

---

## 🔄 CI/CD Pipeline

### Required Pipeline Stages

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  validate:
    steps:
      - run: npm run lint                    # Lint all files
      - run: npm run type-check              # TypeScript strict
      - run: npm run test:unit               # Unit tests
      - run: npm run test:integration        # Integration tests
      - run: npm audit --audit-level=high    # Security audit
      - run: npm run build                   # Ensure build passes

  deploy-staging:
    needs: validate
    environment: staging
    steps:
      - run: npm run migrate:staging         # Run pending migrations
      - run: npm run deploy:staging          # Deploy to staging
      - run: npm run smoke-test:staging      # Smoke tests

  deploy-production:
    needs: deploy-staging
    environment: production
    # Require manual approval for production
    steps:
      - run: npm run migrate:production      # Migrations
      - run: npm run deploy:production       # Deploy
      - run: npm run smoke-test:production   # Verify
```

### Branch Protection Rules (Configure in GitHub/GitLab)

```
main branch:
- Require pull request before merging
- Require 1 approving review minimum
- Dismiss stale reviews on new commits
- Require status checks to pass:
  - lint
  - type-check
  - test:unit
  - test:integration
  - security-audit
- Require branches to be up to date before merging
- Include administrators — no bypass
```

---

## 💾 Backup Strategy

### Backup Requirements

| Data | Frequency | Retention | Verified |
|------|-----------|-----------|---------|
| Production DB | Continuous WAL + daily snapshot | 30 days | Weekly restore test |
| User uploads (S3) | S3 versioning + cross-region replication | 90 days | Monthly |
| Secrets | Secrets manager with versioning | Indefinite | On rotation |
| Config | Git history | Indefinite | Always |

```bash
# ✅ Verify backup integrity weekly (scheduled job)
#!/bin/bash
BACKUP_URL=$(get_latest_backup_url)
pg_restore --dry-run --dbname=postgres "$BACKUP_URL" && \
  echo "Backup verified OK" || \
  alert-oncall "BACKUP VERIFICATION FAILED"
```

---

## 🚨 Incident Response

### Severity Levels

| Level | Definition | Response Time | Examples |
|-------|-----------|---------------|---------|
| P0 | Complete outage, data loss | Immediate | DB down, auth broken |
| P1 | Major feature unavailable | < 15 min | Checkout broken, payments failing |
| P2 | Partial degradation | < 1 hour | Slow responses, partial errors |
| P3 | Minor issue | Next business day | UI bug, non-critical error spike |

### Rollback Procedure

```bash
# ✅ Rollback to last known good deploy (< 5 minutes)
# Vercel
vercel rollback [deployment-url]

# Railway / Render
# Redeploy previous container via dashboard or CLI

# Kubernetes
kubectl rollout undo deployment/myapp

# ✅ Database rollback — ONLY if migration was run
# 1. Check that down migration exists and is tested
# 2. Take a snapshot of current state first
# 3. Run down migration
# 4. Verify data integrity
# NEVER roll back a migration that has deleted data — restore from backup instead
```

### Incident Log Template

```markdown
## Incident: [Title]
**Date**: YYYY-MM-DD HH:MM UTC
**Severity**: P0 / P1 / P2 / P3
**Status**: Open / Resolved

### Timeline
- HH:MM — [First alert / detection]
- HH:MM — [Investigation began]
- HH:MM — [Root cause identified]
- HH:MM — [Fix deployed]
- HH:MM — [Incident resolved]

### Root Cause
[What caused it]

### Impact
[What/who was affected, duration]

### Resolution
[What was done to fix it]

### Action Items
- [ ] [Preventive action — owner — deadline]
```

---

## 🔒 Production Security Hardening

```typescript
// ✅ Disable dev-only features in production
if (process.env.NODE_ENV === 'production') {
  // No stack traces in error responses (handled in error handler)
  // No query logging to console
  // No debug endpoints
}

// ✅ Secrets never in environment output
app.get('/debug/env', (_, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).end()  // Endpoint doesn't exist in prod
  }
  // ...
})

// ✅ Response headers don't leak tech stack
app.disable('x-powered-by')  // Don't send "X-Powered-By: Express"
```

---

## ✅ Production Checklist — Before Every Release

**Code:**
- [ ] All CI checks green — no exceptions
- [ ] Code reviewed by at least one other engineer
- [ ] No debug code, `console.log`, or commented-out blocks
- [ ] No hardcoded credentials or environment-specific values

**Database:**
- [ ] Migrations tested on staging schema
- [ ] Rollback plan documented
- [ ] Backup taken and verified before migration

**Configuration:**
- [ ] All required env vars set in production secrets manager
- [ ] No `.env` file in production filesystem
- [ ] Feature flags configured for gradual rollout

**Observability:**
- [ ] Deployment event logged in monitoring dashboard
- [ ] Alerts active and routed to on-call
- [ ] Health check endpoints responding

**Deployment:**
- [ ] Staging smoke tests passed
- [ ] Deploy triggered via CI/CD (not manual)
- [ ] On-call engineer available during deploy window
- [ ] Rollback procedure ready if needed

**Post-deploy:**
- [ ] Error rate stable for 15 minutes after deploy
- [ ] Latency p95 within normal range
- [ ] Key user journeys verified manually
- [ ] Incident log updated (or confirmed no incident)

---

> **Remember**: Production is for users, not experiments.
> Slow down, follow the process, and when in doubt — don't deploy.
> A delayed feature is recoverable. A data loss incident is not.
