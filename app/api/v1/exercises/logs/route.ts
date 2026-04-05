import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return problemResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      detail: 'Authentication required.',
      requestId,
      retriable: false,
    })
  }

  const params = new URL(request.url).searchParams
  const limit = Math.min(Math.max(Number(params.get('limit') || 500), 50), 1000)

  const { data: rows, error } = await (supabase as any)
    .from('exercise_logs')
    .select('exercise_name,logged_at,weight,reps,completed')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(limit)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'EXERCISE_LOGS_FETCH_FAILED',
      title: 'Exercise Logs Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const byName = new Map<string, { exerciseName: string; lastLoggedAt: string; setsLogged: number; totalVolume: number }>()

  for (const row of Array.isArray(rows) ? rows : []) {
    const exerciseName = String(row.exercise_name || '').trim()
    if (!exerciseName) continue

    const key = exerciseName.toLowerCase()
    const existing = byName.get(key)

    const reps = Number(row.reps || 0)
    const weight = Number(row.weight || 0)
    const volume = Number.isFinite(reps) && Number.isFinite(weight) ? reps * weight : 0

    if (!existing) {
      byName.set(key, {
        exerciseName,
        lastLoggedAt: String(row.logged_at || new Date().toISOString()),
        setsLogged: 1,
        totalVolume: Math.max(0, volume),
      })
      continue
    }

    existing.setsLogged += 1
    existing.totalVolume += Math.max(0, volume)
  }

  return dataResponse({
    requestId,
    data: {
      summaries: Array.from(byName.values()).map((entry) => ({
        ...entry,
        totalVolume: Math.round(entry.totalVolume),
      })),
    },
  })
}
