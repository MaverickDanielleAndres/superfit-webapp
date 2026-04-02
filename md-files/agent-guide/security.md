# security.md — Security Rules for AI Agents
> Read this file completely before writing any code involving: authentication, authorization,
> user input, file uploads, external APIs, data storage, or secrets.
> Security is not optional. Every line generated must be reviewed with a security-first mindset.

---

## ⚠️ Core Security Principles

### 1. Trust Nothing, Verify Everything
- All AI-generated code requires human security review before merge
- Run SAST (Static Application Security Testing) in CI on every PR
- Secrets scanning in pre-commit hooks — block commits with embedded credentials
- Never skip security checks for "simple" or "internal" changes

### 2. Defense in Depth
- Multiple independent security layers — no single point of failure
- Fail securely: default deny, not default allow
- Assume breach mentality — design as if the perimeter is already compromised

### 3. Principle of Least Privilege
- Grant minimum permissions necessary to perform a task
- Time-bound access where possible
- Service accounts and API keys scoped to specific resources only
- Audit and rotate permissions regularly

---

## 🛡 Input Validation & Sanitization

### Rule: Validate at the Boundary, Always
Every piece of data entering the system — from any source — is untrusted until validated.

**TypeScript (Zod):**
```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  email:    z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  age:      z.number().int().min(0).max(150),
  role:     z.enum(['viewer', 'editor', 'admin']),
})

// ✅ Parse throws on invalid input — never call .safeParse and ignore the error
const validated = CreateUserSchema.parse(req.body)
```

**Python (Pydantic):**
```python
from pydantic import BaseModel, EmailStr, constr, conint
from enum import Enum

class Role(str, Enum):
    viewer = "viewer"
    editor = "editor"
    admin  = "admin"

class CreateUserInput(BaseModel):
    email:    EmailStr
    username: constr(min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    age:      conint(ge=0, le=150)
    role:     Role

validated = CreateUserInput(**request.body)
```

### Validation Requirements by Field Type

| Field Type | Requirements |
|-----------|-------------|
| Email | Library validation, max 255 chars, lowercase normalize |
| Username | Alphanumeric + `_-` only, 3–50 chars |
| URL | Validate protocol (`https` only in prod), SSRF allowlist |
| File Upload | MIME type + extension check, max size, malware scan, random filename |
| JSON | Validate schema, reject unknown fields in strict mode |
| Numbers | Explicit min/max ranges, prevent integer overflow |
| Dates | Format validation, reject impossible dates (year > 2100) |
| HTML | DOMPurify sanitize if render required — never raw |
| IDs | UUIDs or prefixed opaque IDs only — never auto-increment exposed |

---

## 🔒 SQL Injection Prevention

```typescript
// ❌ NEVER — string concatenation in SQL
const q = `SELECT * FROM users WHERE email = '${email}'`  // VULNERABLE

// ✅ ALWAYS — parameterized (Prisma handles this automatically)
const user = await prisma.user.findUnique({ where: { email } })

// ✅ Raw SQL — use tagged template (Prisma)
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email} AND role = ${role}
`
```

```python
# ❌ NEVER
query = f"SELECT * FROM users WHERE email = '{email}'"  # VULNERABLE

# ✅ SQLAlchemy ORM (parameterized automatically)
user = db.query(User).filter(User.email == email).first()

# ✅ Raw SQL with SQLAlchemy
result = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email})
```

---

## 🚫 XSS Prevention

```typescript
// ✅ React escapes JSX content automatically
<div>{userContent}</div>  // Safe

// ❌ NEVER without sanitization
<div dangerouslySetInnerHTML={{ __html: userContent }} />  // VULNERABLE

// ✅ When HTML rendering is truly required
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(userContent, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong'] })
<div dangerouslySetInnerHTML={{ __html: clean }} />

// ✅ CSP header (next.config.js)
const cspHeader = `
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
```

---

## 🚫 Command Injection Prevention

```typescript
// ❌ NEVER pass user input to shell commands
exec(`convert ${filename} output.jpg`)  // VULNERABLE

// ✅ Use libraries — no shell involved
import sharp from 'sharp'
await sharp(sanitizedPath).resize(800).toFile('output.jpg')

// ✅ If shell is unavoidable — strict allowlist
const ALLOWED_OPS = ['resize', 'rotate', 'crop'] as const
if (!ALLOWED_OPS.includes(userOp)) throw new ValidationError('Invalid operation')
```

```python
# ❌ NEVER
subprocess.run(f"convert {filename}", shell=True)  # VULNERABLE

# ✅ List format, no shell
subprocess.run(['convert', sanitized_path, 'output.jpg'], shell=False, timeout=30)

# ✅ Better — use Pillow
from PIL import Image
Image.open(sanitized_path).save('output.jpg')
```

---

## 🔑 Authentication

### Password Hashing
```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12  // Never below 10

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

### Account Lockout
```typescript
const MAX_ATTEMPTS  = 5
const LOCKOUT_MS    = 15 * 60 * 1000  // 15 minutes

async function checkLockout(user: User): Promise<void> {
  if (user.loginAttempts >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - user.lastFailedAt.getTime()
    if (elapsed < LOCKOUT_MS) {
      throw new AppError('Account temporarily locked. Try again later.', 'ACCOUNT_LOCKED', 429)
    }
    await resetLoginAttempts(user.id)
  }
}
```

### JWT Configuration
```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET          = process.env.JWT_SECRET!       // min 256-bit random string
const JWT_EXPIRES_IN      = '15m'                         // short-lived access token
const REFRESH_EXPIRES_IN  = '7d'                          // refresh token

function signAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },                               // minimal claims — no PII
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'myapp', audience: 'myapp-api' }
  )
}

function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'myapp',
    audience: 'myapp-api',
  }) as jwt.JwtPayload
}

// ✅ Support previous secret during rotation
function verifyWithRotation(token: string) {
  try {
    return verifyToken(token)
  } catch {
    if (process.env.JWT_SECRET_PREV) {
      return jwt.verify(token, process.env.JWT_SECRET_PREV) as jwt.JwtPayload
    }
    throw new AppError('Invalid token', 'INVALID_TOKEN', 401)
  }
}
```

---

## 🔐 Authorization (RBAC)

```typescript
// ✅ Define permissions centrally
const PERMISSIONS = {
  admin:  ['read', 'write', 'delete', 'manage', 'export'],
  editor: ['read', 'write'],
  viewer: ['read'],
} as const

type Role = keyof typeof PERMISSIONS
type Permission = typeof PERMISSIONS[Role][number]

function can(user: { role: Role }, action: Permission): boolean {
  return (PERMISSIONS[user.role] as readonly string[]).includes(action)
}

// ✅ Check on every endpoint
async function deletePost(req: AuthRequest, postId: string) {
  const post = await getPost(postId)

  // Owner OR admin can delete
  if (req.user.id !== post.authorId && !can(req.user, 'manage')) {
    throw new AppError('Forbidden', 'FORBIDDEN', 403)
  }

  await removePost(postId)
}
```

---

## 🗝 Secrets Management

### Rules
- `.env` is in `.gitignore` — **always**, no exceptions
- `.env.example` is committed with placeholder values
- **Production secrets** live in a secrets manager (AWS Secrets Manager, Vault, Doppler)
- **API keys** passed via headers (`X-API-Key`), never query params (they appear in logs)

```bash
# .env.example — commit this
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
JWT_SECRET="replace-with-256-bit-random-string"
STRIPE_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."

# .gitignore — always present
.env
.env.local
.env.*.local
```

### API Key Pattern (Server-to-Server)
```typescript
// ✅ Validate API key via header, never query param
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key']
  if (!key || !isValidApiKey(key)) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  next()
}

// ✅ Store hashed API keys in DB — never plaintext
async function isValidApiKey(key: string): Promise<boolean> {
  const hash = createHash('sha256').update(key).digest('hex')
  const stored = await db.apiKey.findUnique({ where: { keyHash: hash } })
  return !!stored && stored.expiresAt > new Date()
}
```

---

## 🗄 Data Encryption at Rest

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

class FieldEncryption {
  private readonly key: Buffer
  private readonly algo = 'aes-256-gcm'

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')  // 32 bytes hex
  }

  encrypt(text: string): string {
    const iv   = randomBytes(16)
    const c    = createCipheriv(this.algo, this.key, iv)
    let enc    = c.update(text, 'utf8', 'hex')
    enc       += c.final('hex')
    const tag  = c.getAuthTag()
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`
  }

  decrypt(payload: string): string {
    const [ivHex, tagHex, enc] = payload.split(':')
    const d = createDecipheriv(this.algo, this.key, Buffer.from(ivHex, 'hex'))
    d.setAuthTag(Buffer.from(tagHex, 'hex'))
    let out  = d.update(enc, 'hex', 'utf8')
    out     += d.final('utf8')
    return out
  }
}

// Encrypt before writing to DB
const enc  = new FieldEncryption()
user.ssn   = enc.encrypt(rawSsn)
user.email = enc.encrypt(rawEmail)  // for high-sensitivity apps
```

---

## 🛑 SSRF Prevention

```typescript
import { isIP } from 'net'

const ALLOWED_DOMAINS = ['api.stripe.com', 'api.sendgrid.com']
const PRIVATE_RANGES  = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./]

async function safeFetch(url: string): Promise<Response> {
  const { hostname, protocol } = new URL(url)

  if (protocol !== 'https:') throw new AppError('Only HTTPS allowed', 'SSRF_BLOCK', 400)

  if (hostname === 'localhost' || isIP(hostname) !== 0) {
    const isPrivate = PRIVATE_RANGES.some(r => r.test(hostname))
    if (isPrivate) throw new AppError('Private IP blocked', 'SSRF_BLOCK', 400)
  }

  if (!ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    throw new AppError('Domain not in allowlist', 'SSRF_BLOCK', 400)
  }

  return fetch(url)
}
```

---

## 📤 File Upload Security

```typescript
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_MIME  = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const ALLOWED_EXT   = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf'])
const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB

export const upload = multer({
  storage: multer.memoryStorage(),          // ← never write directly to disk from temp name
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Invalid MIME type'))
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) return cb(new Error('Invalid extension'))
    cb(null, true)
  },
})

// ✅ Always rename to random UUID — never use user-supplied filename
function safeFilename(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase()
  return `${randomUUID()}${ext}`
}

// ✅ Store outside web root, serve via signed URL
// ✅ Integrate ClamAV or similar for malware scanning in production
```

---

## 🚦 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

// General API — 100 req / 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Auth endpoints — 5 attempts / 15 min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts.' },
})

app.use('/api/', apiLimiter)
app.post('/api/auth/login',    authLimiter, loginHandler)
app.post('/api/auth/register', authLimiter, registerHandler)
app.post('/api/auth/reset',    authLimiter, resetHandler)
```

---

## 🏛 Security Headers

```typescript
// middleware.ts (Next.js) or global Express middleware
const securityHeaders = {
  'Strict-Transport-Security':  'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options':            'SAMEORIGIN',
  'X-Content-Type-Options':     'nosniff',
  'X-DNS-Prefetch-Control':     'on',
  'Referrer-Policy':            'strict-origin-when-cross-origin',
  'Permissions-Policy':         'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':    cspHeader,
}

Object.entries(securityHeaders).forEach(([k, v]) => res.setHeader(k, v))
```

---

## 📋 Audit Logging

```typescript
// ✅ Log all sensitive operations — immutable audit trail
interface AuditEvent {
  userId:     string
  action:     'login' | 'logout' | 'password_change' | 'role_change' | 'data_export' | 'delete'
  resource:   string
  resourceId: string
  ip:         string
  userAgent:  string
  timestamp:  Date
  meta?:      Record<string, unknown>
}

async function audit(event: AuditEvent): Promise<void> {
  await Promise.all([
    db.auditLog.create({ data: event }),     // relational store
    sendToLogStream(event),                   // immutable external stream (CloudWatch / Datadog)
  ])
}

// Track: auth events, role/permission changes, PII access, data export, deletions, admin actions
```

---

## 🧯 GDPR / Data Privacy

```typescript
// ✅ Data export — respond to subject access requests
async function exportUserData(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { orders: true, sessions: true, auditLogs: true },
  })
}

// ✅ Soft-delete with anonymization, hard-delete on schedule
async function requestDeletion(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      deletedAt:   new Date(),
      email:       `deleted+${userId}@void.invalid`,
      name:        'Deleted User',
      phoneNumber: null,
    },
  })
  // Schedule hard delete job at deletedAt + 30 days
}
```

---

## ✅ Security Checklist — Run Before Every PR

- [ ] All user inputs validated with strict schemas (Zod / Pydantic)
- [ ] No SQL string concatenation anywhere — parameterized only
- [ ] No `eval()`, `Function()`, `exec()` with user-controlled data
- [ ] Passwords hashed with bcrypt at 12+ rounds
- [ ] JWT secrets 256+ bits, verified with issuer + audience claims
- [ ] Auth middleware on every protected route
- [ ] RBAC authorization checked before every data read/write
- [ ] No secrets in code — environment variables only
- [ ] Sensitive fields encrypted at rest
- [ ] File uploads validated: MIME type, extension, size, random rename
- [ ] Rate limiting on all public endpoints (stricter on auth routes)
- [ ] All security headers set
- [ ] Audit logging for all sensitive operations
- [ ] Error responses contain no stack traces, SQL, or internal paths
- [ ] SSRF protection on all outbound URL fetches
- [ ] `.env` in `.gitignore`, `.env.example` committed with placeholders

---

> **Remember**: Security is not an afterthought. Every line of code is an attack surface.
> When in doubt, deny by default and ask a human.
