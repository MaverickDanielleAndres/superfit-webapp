import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Difficulty, Equipment, Exercise, MuscleGroup, MovementPattern } from '@/types'

const DEFAULT_LIMIT = 20

interface ExerciseDbItem {
  id?: string
  name?: string
  bodyPart?: string
  target?: string
  equipment?: string
  gifUrl?: string
  instructions?: string[]
}

const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: 'fallback-squat',
    name: 'Bodyweight Squat',
    muscleGroups: ['quads', 'glutes'],
    equipment: ['bodyweight'],
    movementPattern: 'squat',
    difficulty: 'beginner',
    instructions: ['Stand with feet shoulder-width apart.', 'Keep chest up and descend until thighs are near parallel.', 'Drive through the mid-foot to return to standing.'],
  },
  {
    id: 'fallback-pushup',
    name: 'Push-Up',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['bodyweight'],
    movementPattern: 'push',
    difficulty: 'beginner',
    instructions: ['Keep a straight line from head to heels.', 'Lower chest under control.', 'Press back to full extension.'],
  },
  {
    id: 'fallback-row',
    name: 'Dumbbell Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'pull',
    difficulty: 'intermediate',
    instructions: ['Brace one hand and knee on a bench.', 'Pull elbow toward hip.', 'Lower with control.'],
  },
]

const EQUIPMENT_MAP: Record<string, Equipment> = {
  bodyweight: 'bodyweight',
  dumbbell: 'dumbbell',
  barbell: 'barbell',
  cable: 'cable',
  machine: 'machine',
  kettlebell: 'kettlebell',
  bands: 'resistance_band',
  band: 'resistance_band',
  smith: 'rack',
  bench: 'bench',
}

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: 'chest',
  back: 'back',
  shoulder: 'shoulders',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  forearm: 'forearms',
  quadriceps: 'quads',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  abs: 'core',
  abdominals: 'core',
  core: 'core',
  traps: 'traps',
  lats: 'lats',
  cardio: 'cardio',
}

function mapEquipment(value: string): Equipment[] {
  const normalized = value.toLowerCase().trim()
  const mapped = EQUIPMENT_MAP[normalized]
  return mapped ? [mapped] : ['bodyweight']
}

function mapMuscles(target: string, bodyPart: string): MuscleGroup[] {
  const picks = [target, bodyPart]
    .map((item) => String(item || '').toLowerCase().trim())
    .filter(Boolean)
    .map((item) => MUSCLE_MAP[item])
    .filter(Boolean)

  return picks.length ? Array.from(new Set(picks)) : ['core']
}

function mapMovementPattern(target: string, bodyPart: string): MovementPattern {
  const text = `${target} ${bodyPart}`.toLowerCase()
  if (text.includes('chest') || text.includes('triceps') || text.includes('shoulder')) return 'push'
  if (text.includes('back') || text.includes('lats') || text.includes('biceps') || text.includes('trap')) return 'pull'
  if (text.includes('quad') || text.includes('glute') || text.includes('calf')) return 'squat'
  if (text.includes('hamstring')) return 'hinge'
  if (text.includes('core') || text.includes('abs')) return 'core'
  if (text.includes('cardio')) return 'cardio'
  return 'isolation'
}

function mapDifficulty(equipment: string): Difficulty {
  const text = equipment.toLowerCase()
  if (text.includes('barbell') || text.includes('cable') || text.includes('machine')) return 'intermediate'
  if (text.includes('body') || text.includes('band')) return 'beginner'
  return 'intermediate'
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
  const query = String(params.get('q') || '').trim()
  const limitInput = Number.parseInt(params.get('limit') || `${DEFAULT_LIMIT}`, 10)
  const limit = Number.isFinite(limitInput) ? Math.max(1, Math.min(limitInput, 40)) : DEFAULT_LIMIT

  if (query.length < 2) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Search query must be at least 2 characters.',
      requestId,
      retriable: false,
    })
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.EXERCISEDB_RAPIDAPI_KEY || ''
  const rapidApiHost = process.env.EXERCISEDB_RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'

  if (!rapidApiKey) {
    const fallback = FALLBACK_EXERCISES.filter((exercise) =>
      exercise.name.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, limit)

    return dataResponse({
      requestId,
      data: {
        exercises: fallback,
        source: 'fallback',
      },
    })
  }

  try {
    const endpoint = new URL(`https://${rapidApiHost}/exercises/name/${encodeURIComponent(query)}`)
    endpoint.searchParams.set('limit', String(limit))

    const response = await fetch(endpoint.toString(), {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`ExerciseDB request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as ExerciseDbItem[]
    const exercises = (Array.isArray(payload) ? payload : []).slice(0, limit).map((item) => {
      const name = String(item.name || 'Exercise')
      const target = String(item.target || '')
      const bodyPart = String(item.bodyPart || '')
      const equipment = String(item.equipment || 'bodyweight')

      const mapped: Exercise = {
        id: String(item.id || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`),
        name,
        muscleGroups: mapMuscles(target, bodyPart),
        equipment: mapEquipment(equipment),
        movementPattern: mapMovementPattern(target, bodyPart),
        difficulty: mapDifficulty(equipment),
        instructions: Array.isArray(item.instructions) && item.instructions.length
          ? item.instructions.map((line) => String(line))
          : ['Open the demo and execute with controlled form.'],
        gifUrl: item.gifUrl ? String(item.gifUrl) : undefined,
        videoUrl: item.gifUrl ? String(item.gifUrl) : undefined,
      }

      return mapped
    })

    return dataResponse({
      requestId,
      data: {
        exercises,
        source: 'exercisedb',
      },
    })
  } catch {
    const fallback = FALLBACK_EXERCISES.filter((exercise) =>
      exercise.name.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, limit)

    return dataResponse({
      requestId,
      data: {
        exercises: fallback,
        source: 'fallback',
      },
    })
  }
}
