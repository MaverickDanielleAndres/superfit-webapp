import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Json } from '@/types/supabase'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const ProgramExerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sets: z.number().int().min(1).max(99).default(3),
  reps: z.number().int().min(1).max(99).default(10),
  imageUrl: z.string().min(1).max(2048).optional().nullable(),
})

const ProgramDaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  exercises: z.array(z.union([z.string(), ProgramExerciseSchema])),
})

const CreateProgramSchema = z.object({
  name: z.string().min(1).max(120),
  difficulty: z.string().min(1).max(50),
  length: z.string().min(1).max(50),
  cover: z.string().url().optional(),
  builderDays: z.array(ProgramDaySchema).optional(),
})

interface ProgramRow {
  id: string | null
  name: string | null
  difficulty: string | null
  length_label: string | null
  cover_url: string | null
  builder_days: Json | null
}

interface ProgramAssignmentCountRow {
  program_id: string | null
}

export async function GET() {
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

  const db = supabase as SupabaseServerClient

  const { data: rawProgramsData, error: programsError } = await db
    .from('coach_programs')
    .select('id,name,difficulty,length_label,cover_url,builder_days')
    .eq('coach_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (programsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAMS_FETCH_FAILED',
      title: 'Programs Fetch Failed',
      detail: programsError.message,
      requestId,
    })
  }

  const programsData = Array.isArray(rawProgramsData) ? (rawProgramsData as ProgramRow[]) : []
  const programIds = programsData.map((row) => row.id).filter((id): id is string => Boolean(id))
  let assignments: ProgramAssignmentCountRow[] = []

  if (programIds.length) {
    const { data: assignmentData, error: assignmentError } = await db
      .from('coach_program_assignments')
      .select('program_id')
      .eq('coach_id', user.id)
      .in('program_id', programIds)

    if (assignmentError) {
      return problemResponse({
        status: 500,
        code: 'COACH_PROGRAMS_FETCH_FAILED',
        title: 'Programs Fetch Failed',
        detail: assignmentError.message,
        requestId,
      })
    }

    assignments = Array.isArray(assignmentData) ? (assignmentData as ProgramAssignmentCountRow[]) : []
  }

  const enrollmentMap = new Map<string, number>()
  for (const row of assignments) {
    const programId = String(row.program_id || '')
    enrollmentMap.set(programId, (enrollmentMap.get(programId) || 0) + 1)
  }

  const programs = programsData.map((row) => ({
    id: String(row.id),
    name: String(row.name || 'Untitled Program'),
    enrolled: enrollmentMap.get(String(row.id)) || 0,
    difficulty: String(row.difficulty || 'Beginner'),
    length: String(row.length_label || '4 Weeks'),
    cover: String(row.cover_url || '/program-covers/default.jpg'),
    builderDays: normalizeProgramDays(row.builder_days),
  }))

  return dataResponse({
    requestId,
    data: {
      programs,
    },
  })
}

export async function POST(request: Request) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problemResponse({
      status: 400,
      code: 'INVALID_JSON',
      title: 'Invalid JSON',
      detail: 'Request body must be valid JSON.',
      requestId,
      retriable: false,
    })
  }

  const parsed = CreateProgramSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid program payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const db = supabase as SupabaseServerClient

  const { data, error } = await db
    .from('coach_programs')
    .insert({
      coach_id: user.id,
      name: parsed.data.name,
      difficulty: parsed.data.difficulty,
      length_label: parsed.data.length,
      cover_url: parsed.data.cover || '/program-covers/default.jpg',
      builder_days: normalizeProgramDays(parsed.data.builderDays || []),
    })
    .select('id,name,difficulty,length_label,cover_url,builder_days')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_CREATE_FAILED',
      title: 'Program Create Failed',
      detail: error?.message || 'Unable to create program.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      program: {
        id: String(data.id),
        name: String(data.name || 'Untitled Program'),
        enrolled: 0,
        difficulty: String(data.difficulty || 'Beginner'),
        length: String(data.length_label || '4 Weeks'),
        cover: String(data.cover_url || '/program-covers/default.jpg'),
        builderDays: normalizeProgramDays(data.builder_days),
      },
    },
  })
}

function normalizeProgramDays(value: unknown): Array<{
  id: string
  name: string
  exercises: Array<{
    id: string
    name: string
    sets: number
    reps: number
    imageUrl: string | null
  }>
}> {
  if (!Array.isArray(value)) return []

  return value.map((entry, dayIndex) => {
    const day = toObject(entry)
    const rawExercises = Array.isArray(day.exercises) ? day.exercises : []

    return {
      id: String(day.id || `d_${dayIndex + 1}`),
      name: String(day.name || `Day ${dayIndex + 1}`),
      exercises: rawExercises
        .map((exercise, exerciseIndex) => normalizeProgramExercise(exercise, dayIndex, exerciseIndex))
        .filter((exercise) => exercise.name.length > 0),
    }
  })
}

function normalizeProgramExercise(
  value: unknown,
  dayIndex: number,
  exerciseIndex: number,
): {
  id: string
  name: string
  sets: number
  reps: number
  imageUrl: string | null
} {
  if (typeof value === 'string') {
    return {
      id: `ex_${dayIndex + 1}_${exerciseIndex + 1}`,
      name: value.trim(),
      sets: 3,
      reps: 10,
      imageUrl: null,
    }
  }

  const objectValue = toObject(value)
  return {
    id: String(objectValue.id || `ex_${dayIndex + 1}_${exerciseIndex + 1}`),
    name: String(objectValue.name || '').trim(),
    sets: normalizeSetsOrReps(objectValue.sets, 3),
    reps: normalizeSetsOrReps(objectValue.reps, 10),
    imageUrl: normalizeOptionalUrl(objectValue.imageUrl),
  }
}

function normalizeSetsOrReps(value: unknown, fallback: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(1, Math.min(99, Math.round(numeric)))
}

function normalizeOptionalUrl(value: unknown): string | null {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function toObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>
  }

  return {}
}
