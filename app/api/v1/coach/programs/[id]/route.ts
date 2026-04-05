import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

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

const UpdateProgramSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    difficulty: z.string().min(1).max(50).optional(),
    length: z.string().min(1).max(50).optional(),
    cover: z.string().url().optional(),
    builderDays: z.array(ProgramDaySchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.')

interface RouteContext {
  params: Promise<{ id: string }>
}

interface ProgramDetailRow {
  id: string | null
  name: string | null
  difficulty: string | null
  length_label: string | null
  cover_url: string | null
  builder_days: unknown
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const { data: rawProgram, error: programError } = await db
    .from('coach_programs')
    .select('id,name,difficulty,length_label,cover_url,builder_days')
    .eq('id', id)
    .eq('coach_id', user.id)
    .eq('is_archived', false)
    .maybeSingle()

  if (programError) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_FETCH_FAILED',
      title: 'Program Fetch Failed',
      detail: programError.message,
      requestId,
    })
  }

  const program = (rawProgram || null) as ProgramDetailRow | null
  if (!program?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_PROGRAM_NOT_FOUND',
      title: 'Program Not Found',
      detail: 'Program not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  const { count: enrolledCount, error: enrollmentError } = await db
    .from('coach_program_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)
    .eq('program_id', id)

  if (enrollmentError) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_FETCH_FAILED',
      title: 'Program Fetch Failed',
      detail: enrollmentError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      program: {
        id: String(program.id),
        name: String(program.name || 'Untitled Program'),
        enrolled: Number(enrolledCount || 0),
        difficulty: String(program.difficulty || 'Beginner'),
        length: String(program.length_label || '4 Weeks'),
        cover: String(program.cover_url || '/program-covers/default.jpg'),
        builderDays: normalizeProgramDays(program.builder_days),
      },
    },
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const url = new URL(request.url)
  const mode = url.searchParams.get('mode')
  const shouldVersion = mode !== 'in-place'
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

  const parsed = UpdateProgramSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid program update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const updates: Database['public']['Tables']['coach_programs']['Update'] = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty
  if (parsed.data.length !== undefined) updates.length_label = parsed.data.length
  if (parsed.data.cover !== undefined) updates.cover_url = parsed.data.cover
  if (parsed.data.builderDays !== undefined) updates.builder_days = normalizeProgramDays(parsed.data.builderDays)

  const db = supabase as SupabaseServerClient

  if (shouldVersion) {
    const { data: existingProgram, error: existingProgramError } = await db
      .from('coach_programs')
      .select('id,name,difficulty,length_label,cover_url,builder_days')
      .eq('id', id)
      .eq('coach_id', user.id)
      .eq('is_archived', false)
      .maybeSingle()

    if (existingProgramError) {
      return problemResponse({
        status: 500,
        code: 'COACH_PROGRAM_UPDATE_FAILED',
        title: 'Program Update Failed',
        detail: existingProgramError.message,
        requestId,
      })
    }

    if (!existingProgram?.id) {
      return problemResponse({
        status: 404,
        code: 'COACH_PROGRAM_NOT_FOUND',
        title: 'Program Not Found',
        detail: 'Program not found for this coach.',
        requestId,
        retriable: false,
      })
    }

    const nextProgram: Database['public']['Tables']['coach_programs']['Insert'] = {
      coach_id: user.id,
      name: parsed.data.name ?? String(existingProgram.name || 'Untitled Program'),
      difficulty: parsed.data.difficulty ?? String(existingProgram.difficulty || 'Beginner'),
      length_label: parsed.data.length ?? String(existingProgram.length_label || '4 Weeks'),
      cover_url: parsed.data.cover ?? String(existingProgram.cover_url || '/program-covers/default.jpg'),
      builder_days:
        parsed.data.builderDays !== undefined
          ? normalizeProgramDays(parsed.data.builderDays)
          : normalizeProgramDays(existingProgram.builder_days),
      is_archived: false,
    }

    const { data: createdProgram, error: createProgramError } = await db
      .from('coach_programs')
      .insert(nextProgram)
      .select('id')
      .single()

    if (createProgramError || !createdProgram?.id) {
      return problemResponse({
        status: 500,
        code: 'COACH_PROGRAM_UPDATE_FAILED',
        title: 'Program Update Failed',
        detail: createProgramError?.message || 'Unable to create a new program version.',
        requestId,
      })
    }

    const { error: reassignError } = await db
      .from('coach_program_assignments')
      .update({ program_id: String(createdProgram.id) })
      .eq('coach_id', user.id)
      .eq('program_id', id)
      .neq('status', 'completed')

    if (reassignError) {
      await db.from('coach_programs').delete().eq('id', String(createdProgram.id)).eq('coach_id', user.id)
      return problemResponse({
        status: 500,
        code: 'COACH_PROGRAM_UPDATE_FAILED',
        title: 'Program Update Failed',
        detail: reassignError.message,
        requestId,
      })
    }

    const { error: archiveError } = await db
      .from('coach_programs')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('coach_id', user.id)

    if (archiveError) {
      return problemResponse({
        status: 500,
        code: 'COACH_PROGRAM_UPDATE_FAILED',
        title: 'Program Update Failed',
        detail: archiveError.message,
        requestId,
      })
    }

    return dataResponse({
      requestId,
      data: {
        id: String(createdProgram.id),
        previousProgramId: id,
        updated: true,
        versioned: true,
      },
    })
  }

  const { error } = await db
    .from('coach_programs')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_UPDATE_FAILED',
      title: 'Program Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id,
      updated: true,
      versioned: false,
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

export async function DELETE(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const { data, error } = await db
    .from('coach_programs')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_PROGRAM_DELETE_FAILED',
      title: 'Program Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  if (!data?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_PROGRAM_NOT_FOUND',
      title: 'Program Not Found',
      detail: 'Program not found for this coach.',
      requestId,
      retriable: false,
    })
  }

  return dataResponse({
    requestId,
    data: {
      id,
      deleted: true,
    },
  })
}
