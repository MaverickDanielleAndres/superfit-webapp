# AGENTS.md — Master AI Agent Configuration
> Reference this file at the start of every session. It governs all agent behavior across the project.
> Specialized rules live in companion files — always read the relevant one before writing code.

---

## 🗂 Rule File Index

| File | When to Read |
|------|-------------|
| `AGENTS.md` ← you are here | Every session, every task |
| `security.md` | Auth, input handling, APIs, secrets, data |
| `performance.md` | Queries, caching, rendering, bundle size |
| `design.md` | UI components, layout, branding, tokens |
| `frontend.md` | React, state, routing, forms, accessibility |
| `backend.md` | APIs, databases, services, error handling, logging |
| `production.md` | Deployment, CI/CD, monitoring, rollback |

**Rule**: Before touching any code, identify which files apply and mentally load them. Never guess conventions — read the file.

---

## 🧠 Agent Mindset

### Clarify Before You Code
- Never start implementation without a clear, unambiguous goal
- If requirements are incomplete, ask **one focused question** — not five
- Propose a plan for any task that touches more than 2 files
- State your assumptions explicitly before proceeding

### Simplicity is the Default
- The simplest correct solution wins every time
- No abstractions unless they remove real, present duplication
- No new patterns unless the existing ones demonstrably fail
- Readable code > clever code, always

### One Thing at a Time
- One concern per PR, one feature per branch
- Never refactor and implement in the same commit
- Never fix unrelated bugs while working on a feature — log them, don't fix them

### Self-Review Before Submitting
1. Does this solve the stated problem and nothing more?
2. Is there a simpler way to achieve the same result?
3. Have I introduced any security, performance, or correctness issues?
4. Does this match patterns already in the codebase?

---

## 📐 Universal Code Standards

### Naming
- **Files/Dirs**: `kebab-case` for directories, `PascalCase` for components, `camelCase` for modules
- **Variables**: `camelCase` with auxiliary verbs — `isLoading`, `hasError`, `canEdit`
- **Functions**: Descriptive action verbs — `fetchUserById`, `validateEmail`, `parseOrderTotal`
- **Classes/Types/Interfaces**: `PascalCase` noun-based — `UserRepository`, `OrderSummary`
- **Constants**: `UPPER_SNAKE_CASE` — `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`
- **Booleans**: Always prefix — `is`, `has`, `can`, `should`, `will`

### Structure Rules
- Functions: max ~40 lines. If longer, extract named helpers
- Files: max ~300 lines. If longer, split by responsibility
- Nesting: max 3 levels deep. Extract to named functions beyond that
- Parameters: max 3. Beyond that, use an options object/struct

### Comments
- Code should be self-documenting — names explain the **what**
- Comments explain the **why**, not the what
- Every exported function/class gets a JSDoc/docstring
- Mark temporary workarounds: `// TODO(username): reason — ticket #123`
- Mark known dangers: `// SECURITY:`, `// PERF:`, `// FRAGILE:`

### Formatting
- Use the project's configured formatter (Prettier / Black / Ruff) — never override it manually
- Run formatter on file-scope before every commit
- Never mix formatting changes with logic changes in the same commit

---

## 🔐 Security — Non-Negotiable Rules

> Full rules: read `security.md` before any auth/data/API work.

- **ALL** user input is validated with a schema (Zod / Pydantic) before use
- **NEVER** concatenate SQL strings — parameterized queries only
- **NEVER** commit secrets, API keys, or credentials — `.env` only
- **NEVER** `eval()`, `Function()`, or shell `exec()` with user data
- Passwords hashed with bcrypt, 12+ rounds minimum
- Authentication check on every protected route — no exceptions
- Authorization (RBAC) checked before every data read or mutation
- Rate limiting on every public-facing endpoint
- Security headers set on every response
- Sensitive data (PII, payments) encrypted at rest

---

## ⚡ Performance — Non-Negotiable Rules

> Full rules: read `performance.md` before any query/rendering/API work.

- **NEVER** return an unbounded collection — paginate everything
- **NEVER** write N+1 queries — use eager loading / joins
- Parallelize independent async operations with `Promise.all`
- Memoize expensive pure computations
- Virtualize lists with more than 100 items
- Lazy-load heavy components and non-critical routes
- Cache expensive read operations (Redis/in-memory) with explicit invalidation

---

## 🎨 Design — Non-Negotiable Rules

> Full rules: read `design.md` before any UI/component work.

- Use design tokens — never hardcode colors, spacing, or font sizes
- Follow the brand color palette and typography scale defined in `design.md`
- All interactive elements must have visible focus states
- Maintain consistent spacing using the 4px/8px grid
- Never ship a UI without dark mode support (unless explicitly excluded)
- Copy the pattern from the nearest existing similar component before creating a new one

---

## 🖥 Frontend — Non-Negotiable Rules

> Full rules: read `frontend.md` before any React/UI work.

- Components are small, focused, and composable — one responsibility each
- All forms use the project's form library with schema validation
- Loading, error, and empty states handled in every data-fetching component
- Accessibility: semantic HTML, ARIA where needed, keyboard navigable
- No raw `fetch` in components — use the data-fetching abstraction layer
- State lives at the lowest possible level — lift only when necessary

---

## 🔧 Backend — Non-Negotiable Rules

> Full rules: read `backend.md` before any API/DB/service work.

- All API responses follow the standard envelope: `{ data, meta?, errors? }`
- All errors use RFC 7807 Problem Details format
- Every API endpoint is versioned (`/api/v1/...`)
- Structured JSON logging on every request — no `console.log` in production
- Custom typed error classes — no raw `Error` strings
- External service calls wrapped in circuit breakers with retry + backoff
- Database transactions for any multi-step write operation

---

## 🚀 Production — Non-Negotiable Rules

> Full rules: read `production.md` before any deployment/infra work.

- **NEVER** push directly to `main` — all changes go through PR + review
- Feature flags for any change affecting >5% of users
- Migration scripts must be backward compatible (zero-downtime deploys)
- Health check endpoints required on all services
- Alerts configured for error rate, latency p95, and database connection pool
- Rollback procedure documented and tested before every release

---

## 📁 Project Structure Convention

```
project-root/
├── AGENTS.md               ← this file
├── security.md             ← security rules
├── performance.md          ← performance rules
├── design.md               ← design/branding rules
├── frontend.md             ← frontend rules
├── backend.md              ← backend rules
├── production.md           ← production/deployment rules
├── src/
│   ├── app/                ← routing layer (Next.js App Router / pages)
│   ├── components/         ← shared UI components
│   │   ├── ui/             ← primitives (Button, Input, Modal...)
│   │   └── features/       ← feature-specific composed components
│   ├── lib/                ← utilities, helpers, shared logic
│   ├── hooks/              ← custom React hooks
│   ├── services/           ← business logic, external API wrappers
│   ├── repositories/       ← data access layer (DB queries)
│   ├── types/              ← shared TypeScript types/interfaces
│   └── config/             ← app configuration, constants
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

---

## 🧪 Testing Baseline

- Write tests alongside code — not after
- Every bug fix gets a regression test before the fix
- Unit tests: all business logic, utilities, transformations
- Integration tests: all API endpoints, all DB operations
- E2E tests: critical user journeys only (auth, payment, core flow)
- Tests are independent — no shared mutable state between tests
- Use test factories, never hardcoded fixture data

**Test Naming**: `"[action/condition] [expected result]"`
- ✅ `"returns 401 when token is missing"`
- ✅ `"creates order and sends confirmation email"`
- ❌ `"test the login function"`

---

## 🔀 Git Workflow

### Branch Naming
- `feature/[ticket]-short-description`
- `fix/[ticket]-short-description`
- `hotfix/short-description`
- `chore/short-description`

### Commit Format
```
type(scope): description

Types: feat | fix | docs | style | refactor | test | chore | perf | security
```

### Pre-Commit Checklist
- [ ] Lint passes (file-scoped)
- [ ] Type check passes (file-scoped)
- [ ] Relevant tests pass
- [ ] No debug logs or commented-out code
- [ ] No hardcoded secrets or credentials
- [ ] `.env` not modified without explicit instruction

### What Requires Approval Before Acting
- Installing new packages
- Modifying `package.json`, `tsconfig.json`, CI config
- Running full project build or full test suite
- Any git push to `main` / `develop` / shared branches
- Deleting files or directories
- Modifying database schemas or migrations
- Changing environment variables

---

## 🤝 When Stuck

1. **Ask** — one precise question, not a list of five
2. **Propose** — write your plan before writing code on anything complex
3. **Reference** — find the nearest existing example in the codebase and match it
4. **Shrink** — if blocked, implement the smallest possible slice that still has value
5. **Escalate** — flag architectural concerns before implementing, not after

---

**Last Updated**: [Date]
**Maintained By**: [Team/Individual]
