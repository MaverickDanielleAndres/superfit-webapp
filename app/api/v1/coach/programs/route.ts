import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const ProgramDaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  exercises: z.array(z.string()),
})

const CreateProgramSchema = z.object({
  name: z.string().min(1).max(120),
  difficulty: z.string().min(1).max(50),
  length: z.string().min(1).max(50),
  cover: z.string().url().optional(),
  builderDays: z.array(ProgramDaySchema).optional(),
})

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

  const { data: programsData, error: programsError } = await (supabase as any)
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

  const programIds = (programsData || []).map((row: any) => row.id)
  let assignments: any[] = []

  if (programIds.length) {
    const { data: assignmentData, error: assignmentError } = await (supabase as any)
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

    assignments = assignmentData || []
  }

  const enrollmentMap = new Map<string, number>()
  for (const row of assignments) {
    const programId = String(row.program_id || '')
    enrollmentMap.set(programId, (enrollmentMap.get(programId) || 0) + 1)
  }

  const programs = (programsData || []).map((row: any) => ({
    id: String(row.id),
    name: String(row.name || 'Untitled Program'),
    enrolled: enrollmentMap.get(String(row.id)) || 0,
    difficulty: String(row.difficulty || 'Beginner'),
    length: String(row.length_label || '4 Weeks'),
    cover: String(row.cover_url || '/program-covers/default.jpg'),
    builderDays: Array.isArray(row.builder_days) ? row.builder_days : [],
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

  const { data, error } = await (supabase as any)
    .from('coach_programs')
    .insert({
      coach_id: user.id,
      name: parsed.data.name,
      difficulty: parsed.data.difficulty,
      length_label: parsed.data.length,
      cover_url: parsed.data.cover || '/program-covers/default.jpg',
      builder_days: parsed.data.builderDays || [],
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
        builderDays: Array.isArray(data.builder_days) ? data.builder_days : [],
      },
    },
  })
}
