import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

function parseRange(value: string | null): '1m' | '3m' | '6m' | '1y' {
  if (value === '1m' || value === '3m' || value === '6m' || value === '1y') return value
  return '6m'
}

function startDateForRange(range: '1m' | '3m' | '6m' | '1y'): Date {
  const now = new Date()
  const start = new Date(now)
  if (range === '1m') start.setMonth(start.getMonth() - 1)
  if (range === '3m') start.setMonth(start.getMonth() - 3)
  if (range === '6m') start.setMonth(start.getMonth() - 6)
  if (range === '1y') start.setFullYear(start.getFullYear() - 1)
  return start
}

function labelForDate(dateIso: string, range: '1m' | '3m' | '6m' | '1y'): string {
  const date = new Date(dateIso)
  if (range === '1m') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
  })
}

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
  const range = parseRange(params.get('range'))
  const start = startDateForRange(range).toISOString()

  const [{ data: logRows, error: logsError }, { data: workoutRows, error: workoutsError }] = await Promise.all([
    (supabase as any)
      .from('exercise_logs')
      .select('exercise_name,weight,reps,completed,logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .order('logged_at', { ascending: true }),
    (supabase as any)
      .from('workout_sessions')
      .select('id,is_completed,start_time')
      .eq('user_id', user.id)
      .gte('start_time', start)
      .order('start_time', { ascending: true }),
  ])

  if (logsError || workoutsError) {
    return problemResponse({
      status: 500,
      code: 'ANALYTICS_FETCH_FAILED',
      title: 'Analytics Fetch Failed',
      detail: logsError?.message || workoutsError?.message || 'Unable to load analytics.',
      requestId,
    })
  }

  const logs = Array.isArray(logRows) ? logRows : []
  const workouts = Array.isArray(workoutRows) ? workoutRows : []

  const volumeByLabel = new Map<string, number>()
  let totalVolume = 0
  let topEstimated1RM = 0

  for (const row of logs) {
    if (!row.completed) continue

    const weight = Number(row.weight || 0)
    const reps = Number(row.reps || 0)
    const volume = weight * reps
    if (!Number.isFinite(volume) || volume <= 0) continue

    totalVolume += volume
    const label = labelForDate(String(row.logged_at || new Date().toISOString()), range)
    volumeByLabel.set(label, (volumeByLabel.get(label) || 0) + volume)

    const estimated1RM = weight * (1 + reps / 30)
    if (Number.isFinite(estimated1RM) && estimated1RM > topEstimated1RM) {
      topEstimated1RM = estimated1RM
    }
  }

  const volumeSeries = Array.from(volumeByLabel.entries()).map(([label, volume]) => ({
    label,
    volume: Math.round(volume),
  }))

  const workoutsCompleted = workouts.filter((workout) => Boolean(workout.is_completed)).length

  return dataResponse({
    requestId,
    data: {
      range,
      kpis: {
        totalVolume: Math.round(totalVolume),
        workoutsCompleted,
        topEstimated1RM: Number(topEstimated1RM.toFixed(1)),
      },
      volumeSeries,
    },
  })
}
