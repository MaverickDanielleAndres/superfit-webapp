import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SERVER_PORT = 3210
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`
const SAMPLE_ID = '11111111-1111-1111-1111-111111111111'

const timestamp = new Date()
const stamp = timestamp.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
const artifactDir = path.join(ROOT, 'md-files', 'qa-artifacts')
const markdownPath = path.join(artifactDir, `qa-log-${stamp}.md`)
const jsonPath = path.join(artifactDir, `qa-log-${stamp}.json`)

const pageWorkflows = [
  '/',
  '/analytics',
  '/calculators',
  '/coaching',
  '/coaching/dashboard',
  '/community',
  '/diary',
  '/exercises',
  '/goals',
  '/hydration',
  '/meal-planner',
  '/messages',
  '/progress',
  '/settings',
  '/subscription',
  '/timer',
  '/workout',
  '/coach',
  '/coach/analytics',
  '/coach/broadcast',
  '/coach/clients',
  '/coach/content',
  '/coach/forms',
  '/coach/marketplace',
  '/coach/programs',
  '/coach/schedule',
  '/coach/settings',
  '/admin',
  '/admin/users',
  '/admin/coaches',
  '/admin/applications',
  '/admin/payments',
  '/admin/content',
  '/admin/settings',
]

const apiChecks = [
  { method: 'GET', route: '/api/v1/health', expected: 200 },
  { method: 'GET', route: '/api/v1/auth/me', expected: 401 },
  { method: 'GET', route: '/api/v1/admin/applications', expected: 401 },
  { method: 'PATCH', route: `/api/v1/admin/applications/${SAMPLE_ID}/status`, expected: 401, body: { status: 'Approved' } },
  { method: 'GET', route: '/api/v1/admin/coaches', expected: 401 },
  { method: 'GET', route: '/api/v1/admin/payments', expected: 401 },
  { method: 'POST', route: '/api/v1/admin/payments/approve-pending', expected: 401, body: {} },
  { method: 'GET', route: '/api/v1/admin/reports', expected: 401 },
  { method: 'PATCH', route: `/api/v1/admin/reports/${SAMPLE_ID}/status`, expected: 401, body: { status: 'Dismissed' } },
  { method: 'GET', route: '/api/v1/admin/settings', expected: 401 },
  { method: 'PATCH', route: '/api/v1/admin/settings', expected: 401, body: { maintenanceMode: false, platformFeePercent: 10, autoApproveCoaches: true } },
  { method: 'GET', route: '/api/v1/admin/users', expected: 401 },
  { method: 'PATCH', route: `/api/v1/admin/users/${SAMPLE_ID}/status`, expected: 401, body: { status: 'Active' } },
  { method: 'PATCH', route: `/api/v1/admin/users/${SAMPLE_ID}/premium`, expected: 401, body: { enabled: true } },
  { method: 'GET', route: '/api/v1/coach/broadcast', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/broadcast', expected: 401, body: { target: 'all_active', message: 'qa' } },
  { method: 'GET', route: '/api/v1/coach/broadcast/history', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/broadcast/history', expected: 401, body: { target: 'QA', message: 'qa', delivered: 1, read: 0 } },
  { method: 'GET', route: '/api/v1/coach/clients', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/clients', expected: 401, body: { mode: 'next-available' } },
  { method: 'PATCH', route: `/api/v1/coach/clients/${SAMPLE_ID}/status`, expected: 401, body: { status: 'Active' } },
  { method: 'GET', route: '/api/v1/coach/content', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/content', expected: 401, body: { title: 'qa', description: 'qa', type: 'Post' } },
  { method: 'GET', route: '/api/v1/coach/forms', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/forms', expected: 401, body: { name: 'QA Form' } },
  { method: 'PATCH', route: `/api/v1/coach/forms/${SAMPLE_ID}/status`, expected: 401, body: { status: 'Active' } },
  { method: 'POST', route: `/api/v1/coach/forms/${SAMPLE_ID}/assign`, expected: 401, body: { clientIds: [SAMPLE_ID] } },
  { method: 'DELETE', route: `/api/v1/coach/forms/${SAMPLE_ID}`, expected: 401 },
  { method: 'GET', route: '/api/v1/coach/marketplace', expected: 401 },
  { method: 'PATCH', route: '/api/v1/coach/marketplace', expected: 401, body: { displayName: 'QA', headline: 'QA', specialties: ['strength'], clientCap: 30, isActive: true } },
  { method: 'GET', route: '/api/v1/coach/programs', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/programs', expected: 401, body: { name: 'QA', difficulty: 'Beginner', length: '4 Weeks' } },
  { method: 'PATCH', route: `/api/v1/coach/programs/${SAMPLE_ID}`, expected: 401, body: { name: 'QA2' } },
  { method: 'POST', route: '/api/v1/coach/programs/assign', expected: 401, body: { programId: SAMPLE_ID, clientIds: [SAMPLE_ID] } },
  { method: 'GET', route: '/api/v1/coach/schedule-events', expected: 401 },
  { method: 'POST', route: '/api/v1/coach/schedule-events', expected: 401, body: { title: 'QA', type: 'call', startAt: '2026-01-01T10:00:00.000Z', endAt: '2026-01-01T10:30:00.000Z' } },
  { method: 'GET', route: '/api/v1/coach/settings', expected: 401 },
  { method: 'PATCH', route: '/api/v1/coach/settings', expected: 401, body: { fullName: 'QA User', email: 'qa@example.com' } },
  { method: 'POST', route: '/api/v1/messages/direct-thread', expected: 401, body: { participantId: SAMPLE_ID } },
]

const backendConnectionChecks = [
  { feature: 'Coach Broadcast', file: 'app/coach/broadcast/page.tsx', needle: '/api/v1/coach/broadcast' },
  { feature: 'Coach Broadcast History', file: 'store/useCoachPortalStore.ts', needle: '/api/v1/coach/broadcast/history' },
  { feature: 'Coach Clients', file: 'store/useCoachPortalStore.ts', needle: '/api/v1/coach/clients' },
  { feature: 'Coach Content', file: 'app/coach/content/page.tsx', needle: '/api/v1/coach/content' },
  { feature: 'Coach Forms', file: 'store/useCoachPortalStore.ts', needle: '/api/v1/coach/forms' },
  { feature: 'Coach Marketplace', file: 'app/coach/marketplace/page.tsx', needle: '/api/v1/coach/marketplace' },
  { feature: 'Coach Programs', file: 'store/useCoachPortalStore.ts', needle: '/api/v1/coach/programs' },
  { feature: 'Coach Schedule', file: 'store/useCoachPortalStore.ts', needle: '/api/v1/coach/schedule-events' },
  { feature: 'Coach Settings', file: 'app/coach/settings/page.tsx', needle: '/api/v1/coach/settings' },
  { feature: 'Admin Users', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/users' },
  { feature: 'Admin Coaches', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/coaches' },
  { feature: 'Admin Applications', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/applications' },
  { feature: 'Admin Payments', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/payments' },
  { feature: 'Admin Reports', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/reports' },
  { feature: 'Admin Settings', file: 'store/useAdminPortalStore.ts', needle: '/api/v1/admin/settings' },
]

const globalChecks = [
  { name: 'Theme switching integration', file: 'components/ThemeProvider.tsx', needle: 'next-themes' },
  { name: 'Global shell component AppShell', file: 'components/layout/AppShell.tsx', needle: 'export default' },
  { name: 'Global shell component Sidebar', file: 'components/layout/Sidebar.tsx', needle: 'export' },
  { name: 'Global shell component TopBar', file: 'components/layout/TopBar.tsx', needle: 'export' },
  { name: 'Onboarding page exists', file: 'app/onboarding/page.tsx', needle: 'export default' },
  { name: 'Role guards in dashboard layout', file: 'app/(dashboard)/layout.tsx', needle: 'redirect' },
  { name: 'Role guards in coach layout', file: 'app/coach/layout.tsx', needle: 'redirect' },
  { name: 'Role guards in admin layout', file: 'app/admin/layout.tsx', needle: 'redirect' },
]

const hotspotChecks = [
  { name: 'Coach broadcast filters hotspot', query: 'Filter options coming soon', includePattern: 'app/coach/broadcast/page.tsx' },
  { name: 'Coach client notes/action hotspot', query: 'coming soon|Coming soon', includePattern: 'app/coach/clients/[clientId]/page.tsx' },
  { name: 'Coach planner creation hotspot', query: 'coming soon|Coming soon', includePattern: 'app/coach/page.tsx' },
  { name: 'Client hub program viewer hotspot', query: 'coming soon|Coming soon', includePattern: 'components/coaching/ClientHub.tsx' },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchRoute(route, method = 'GET', body) {
  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return response.status
}

function startServer() {
  const child = spawn('npm', ['run', 'start', '--', '-p', String(SERVER_PORT)], {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', () => {})
  child.stderr.on('data', () => {})

  return child
}

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const status = await fetchRoute('/api/v1/health')
      if (status === 200) return true
    } catch {
      // ignore until ready
    }
    await sleep(1000)
  }
  return false
}

async function fileContains(filePath, needle) {
  const abs = path.join(ROOT, filePath)
  const content = await fs.readFile(abs, 'utf8')
  return content.includes(needle)
}

async function run() {
  await fs.mkdir(artifactDir, { recursive: true })

  const results = {
    meta: {
      timestamp: timestamp.toISOString(),
      baseUrl: BASE_URL,
      script: 'scripts/qa/run-feature-checklist.mjs',
    },
    pageWorkflows: [],
    apiWorkflows: [],
    backendConnections: [],
    globalChecks: [],
    hotspotChecks: [],
    summary: {},
  }

  const server = startServer()
  let serverReady = false

  try {
    serverReady = await waitForServer()
    if (!serverReady) {
      throw new Error('Server did not become ready within timeout.')
    }

    for (const route of pageWorkflows) {
      const status = await fetchRoute(route)
      const pass = [200, 302, 303, 307, 308].includes(status)
      results.pageWorkflows.push({ route, status, pass })
    }

    for (const check of apiChecks) {
      const status = await fetchRoute(check.route, check.method, check.body)
      const pass = status === check.expected
      results.apiWorkflows.push({ ...check, status, pass })
    }

    for (const check of backendConnectionChecks) {
      const pass = await fileContains(check.file, check.needle)
      results.backendConnections.push({ ...check, pass })
    }

    for (const check of globalChecks) {
      const pass = await fileContains(check.file, check.needle)
      results.globalChecks.push({ ...check, pass })
    }

    for (const check of hotspotChecks) {
      let pass = false
      try {
        const content = await fs.readFile(path.join(ROOT, check.includePattern), 'utf8')
        pass = new RegExp(check.query, 'i').test(content)
      } catch {
        pass = false
      }
      results.hotspotChecks.push({ ...check, pass })
    }
  } finally {
    if (server && !server.killed) {
      server.kill('SIGTERM')
      await sleep(1200)
    }
  }

  const allChecks = [
    ...results.pageWorkflows,
    ...results.apiWorkflows,
    ...results.backendConnections,
    ...results.globalChecks,
    ...results.hotspotChecks,
  ]

  const passed = allChecks.filter((item) => item.pass).length
  const failed = allChecks.length - passed

  results.summary = {
    total: allChecks.length,
    passed,
    failed,
    passRate: allChecks.length ? Number(((passed / allChecks.length) * 100).toFixed(2)) : 0,
  }

  const md = []
  md.push('# SuperFit QA Workflow Log')
  md.push('')
  md.push(`- Timestamp: ${results.meta.timestamp}`)
  md.push(`- Base URL: ${results.meta.baseUrl}`)
  md.push(`- Total Checks: ${results.summary.total}`)
  md.push(`- Passed: ${results.summary.passed}`)
  md.push(`- Failed: ${results.summary.failed}`)
  md.push(`- Pass Rate: ${results.summary.passRate}%`)
  md.push('')

  md.push('## Page Workflows')
  md.push('')
  md.push('| Route | Status | Result |')
  md.push('|---|---:|---|')
  for (const item of results.pageWorkflows) {
    md.push(`| ${item.route} | ${item.status} | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }
  md.push('')

  md.push('## API Workflows')
  md.push('')
  md.push('| Method | Route | Expected | Actual | Result |')
  md.push('|---|---|---:|---:|---|')
  for (const item of results.apiWorkflows) {
    md.push(`| ${item.method} | ${item.route} | ${item.expected} | ${item.status} | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }
  md.push('')

  md.push('## Backend Connection Checks')
  md.push('')
  md.push('| Feature | File | Match | Result |')
  md.push('|---|---|---|---|')
  for (const item of results.backendConnections) {
    md.push(`| ${item.feature} | ${item.file} | ${item.needle} | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }
  md.push('')

  md.push('## Global Feature Checks')
  md.push('')
  md.push('| Check | File | Result |')
  md.push('|---|---|---|')
  for (const item of results.globalChecks) {
    md.push(`| ${item.name} | ${item.file} | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }
  md.push('')

  md.push('## Coming Soon Hotspot Checks')
  md.push('')
  md.push('| Check | Target | Result |')
  md.push('|---|---|---|')
  for (const item of results.hotspotChecks) {
    md.push(`| ${item.name} | ${item.includePattern} | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }
  md.push('')

  await fs.writeFile(markdownPath, md.join('\n'), 'utf8')
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf8')

  console.log(`QA markdown log: ${path.relative(ROOT, markdownPath)}`)
  console.log(`QA json log: ${path.relative(ROOT, jsonPath)}`)
  console.log(`QA summary: ${results.summary.passed}/${results.summary.total} passed (${results.summary.passRate}%)`)

  if (results.summary.failed > 0) {
    process.exitCode = 2
  }
}

run().catch((error) => {
  console.error('QA script failed:', error)
  process.exitCode = 1
})
