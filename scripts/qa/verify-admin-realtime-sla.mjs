import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const SLA_MS = 2000

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const idx = line.indexOf('=')
      if (idx === -1) return acc
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

async function loadSupabaseConfig(rootDir) {
  const envPath = path.join(rootDir, '.env.local')
  const envRaw = await fs.readFile(envPath, 'utf8')
  const env = parseEnv(envRaw)

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  return { url, anonKey, serviceRoleKey }
}

async function subscribeRealtime(client, tables) {
  const events = []

  const channel = client.channel(`qa-admin-realtime-sla-${Date.now()}`)

  for (const table of tables) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        events.push({
          table,
          eventType: payload.eventType,
          ts: Date.now(),
        })
      },
    )
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out subscribing realtime channel')), 8000)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer)
        resolve(null)
      } else if (status === 'CHANNEL_ERROR') {
        clearTimeout(timer)
        reject(new Error('Realtime channel error while subscribing'))
      }
    })
  })

  return {
    channel,
    events,
    async waitForEvent(table, sinceMs, timeoutMs = 6000) {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        const hit = events.find((evt) => evt.table === table && evt.ts >= sinceMs)
        if (hit) return hit
        await new Promise((r) => setTimeout(r, 40))
      }
      return null
    },
  }
}

function summarize(rows) {
  const total = rows.length
  const passed = rows.filter((row) => row.pass).length
  const failed = total - passed
  const p95Base = rows.map((row) => row.latencyMs).filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  const p95 = p95Base.length ? p95Base[Math.floor(0.95 * (p95Base.length - 1))] : null

  return {
    total,
    passed,
    failed,
    p95LatencyMs: p95,
  }
}

async function run() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
  const { url, anonKey, serviceRoleKey } = await loadSupabaseConfig(rootDir)

  const writer = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const listener = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: signInError } = await listener.auth.signInWithPassword({
    email: 'admin@superfit.com',
    password: 'admin123',
  })
  if (signInError) {
    throw new Error(`Failed to sign in admin listener: ${signInError.message}`)
  }

  const monitoredTables = [
    'profiles',
    'admin_coach_applications',
    'payment_transactions',
    'admin_moderation_reports',
    'platform_settings',
  ]

  const realtime = await subscribeRealtime(listener, monitoredTables)
  await new Promise((resolve) => setTimeout(resolve, 300))

  const results = []
  const cleanup = []

  try {
    const { data: profile } = await writer
      .from('profiles')
      .select('id, is_premium')
      .eq('role', 'user')
      .limit(1)
      .maybeSingle()

    if (!profile?.id) {
      throw new Error('No user profile found for realtime probe')
    }

    {
      const startedAt = Date.now()
      const nextPremium = !profile.is_premium
      const { error } = await writer.from('profiles').update({ is_premium: nextPremium }).eq('id', profile.id)
      if (error) throw error

      const evt = await realtime.waitForEvent('profiles', startedAt)
      results.push({
        probe: 'Admin premium toggle -> profiles realtime',
        table: 'profiles',
        latencyMs: evt ? evt.ts - startedAt : null,
        pass: Boolean(evt) && evt.ts - startedAt <= SLA_MS,
      })

      await writer.from('profiles').update({ is_premium: profile.is_premium }).eq('id', profile.id)
    }

    {
      const key = `qa_realtime_probe_${Date.now()}`
      cleanup.push(async () => {
        await writer.from('platform_settings').delete().eq('setting_key', key)
      })

      const startedAt = Date.now()
      const { error } = await writer.from('platform_settings').insert({
        setting_key: key,
        setting_value: { source: 'qa', at: new Date().toISOString() },
      })
      if (error) throw error

      const evt = await realtime.waitForEvent('platform_settings', startedAt)
      results.push({
        probe: 'Admin settings save -> platform settings realtime',
        table: 'platform_settings',
        latencyMs: evt ? evt.ts - startedAt : null,
        pass: Boolean(evt) && evt.ts - startedAt <= SLA_MS,
      })
    }

    {
      const applicationId = randomUUID()
      cleanup.push(async () => {
        await writer.from('admin_coach_applications').delete().eq('id', applicationId)
      })

      const startedAt = Date.now()
      const { error } = await writer.from('admin_coach_applications').insert({
        id: applicationId,
        email: `qa-${Date.now()}@example.com`,
        full_name: 'QA Realtime Probe',
        experience_years: 1,
        specialties: ['strength'],
        status: 'pending',
      })
      if (error) throw error

      const evt = await realtime.waitForEvent('admin_coach_applications', startedAt)
      results.push({
        probe: 'Admin application status flow -> applications realtime',
        table: 'admin_coach_applications',
        latencyMs: evt ? evt.ts - startedAt : null,
        pass: Boolean(evt) && evt.ts - startedAt <= SLA_MS,
      })
    }

    {
      const startedAt = Date.now()
      const { data, error } = await writer
        .from('payment_transactions')
        .insert({
          amount_cents: 1250,
          currency: 'USD',
          status: 'pending',
        })
        .select('id')
        .single()

      if (error) throw error

      const paymentId = data.id
      cleanup.push(async () => {
        await writer.from('payment_transactions').delete().eq('id', paymentId)
      })

      const evt = await realtime.waitForEvent('payment_transactions', startedAt)
      results.push({
        probe: 'Admin payouts approval flow -> payments realtime',
        table: 'payment_transactions',
        latencyMs: evt ? evt.ts - startedAt : null,
        pass: Boolean(evt) && evt.ts - startedAt <= SLA_MS,
      })
    }

    {
      const startedAt = Date.now()
      const { data, error } = await writer
        .from('admin_moderation_reports')
        .insert({
          content_type: 'post',
          reason: 'qa realtime probe',
          status: 'pending',
        })
        .select('id')
        .single()

      if (error) throw error

      const reportId = data.id
      cleanup.push(async () => {
        await writer.from('admin_moderation_reports').delete().eq('id', reportId)
      })

      const evt = await realtime.waitForEvent('admin_moderation_reports', startedAt)
      results.push({
        probe: 'Admin moderation status flow -> reports realtime',
        table: 'admin_moderation_reports',
        latencyMs: evt ? evt.ts - startedAt : null,
        pass: Boolean(evt) && evt.ts - startedAt <= SLA_MS,
      })
    }
  } finally {
    for (const task of cleanup.reverse()) {
      try {
        await task()
      } catch {
        // best-effort cleanup only
      }
    }

    await realtime.channel.unsubscribe()
    await listener.removeChannel(realtime.channel)
    await listener.auth.signOut()
    listener.realtime.disconnect()
    writer.realtime.disconnect()
  }

  const summary = summarize(results)
  const eventCounts = monitoredTables.reduce((acc, table) => {
    acc[table] = realtime.events.filter((evt) => evt.table === table).length
    return acc
  }, {})

  console.log(JSON.stringify({ slaMs: SLA_MS, summary, eventCounts, results }, null, 2))

  if (summary.failed > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('Admin realtime SLA probe failed:', error)
  process.exit(1)
})
