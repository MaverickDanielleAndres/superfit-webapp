import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { getAvatarFallbackUrl, getSafeImageSrc } from '@/lib/media'

interface RouteContext {
  params: Promise<{ clientId: string }>
}

interface ClientLinkRow {
  id: string
  status: string | null
  goal_name: string | null
  compliance: number | null
  last_active_at: string | null
  weight_trend: unknown
  notes: string | null
}

interface ClientProfileRow {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface ProgramInfoRow {
  id: string | null
  name: string | null
  difficulty: string | null
  length_label: string | null
}

interface ProgramAssignmentRow {
  id: string
  status: string | null
  progress_pct: number | null
  assigned_at: string | null
  completed_at: string | null
  program: ProgramInfoRow | null
}

interface FormInfoRow {
  id: string | null
  name: string | null
  status?: string | null
}

interface FormAssignmentRow {
  id: string
  assigned_at: string | null
  deadline: string | null
  completed_at: string | null
  form: FormInfoRow | null
}

interface FormSubmissionRow {
  id: string
  response: unknown
  review_status: string | null
  coach_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  form: FormInfoRow | null
}

interface ScheduleEventRow {
  id: string
  title: string | null
  event_type: string | null
  status: string | null
  start_at: string | null
  end_at: string | null
  notes: string | null
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { clientId } = await context.params
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

  const { data: rawLinkRow, error: linkError } = await supabase
    .from('coach_client_links')
    .select('id,status,goal_name,compliance,last_active_at,weight_trend,notes')
    .eq('coach_id', user.id)
    .eq('client_id', clientId)
    .maybeSingle()
  const linkRow = (rawLinkRow ?? null) as ClientLinkRow | null

  if (linkError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_SUMMARY_FETCH_FAILED',
      title: 'Client Summary Fetch Failed',
      detail: linkError.message,
      requestId,
    })
  }

  if (!linkRow?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_CLIENT_NOT_FOUND',
      title: 'Client Not Found',
      detail: 'The requested client is not linked to this coach account.',
      requestId,
      retriable: false,
    })
  }

  const [profileResult, programResult, formAssignmentResult, formSubmissionResult, scheduleResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,email,avatar_url')
      .eq('id', clientId)
      .maybeSingle(),
    supabase
      .from('coach_program_assignments')
      .select('id,status,progress_pct,assigned_at,completed_at,program:coach_programs(id,name,difficulty,length_label)')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('coach_form_assignments')
      .select('id,assigned_at,deadline,completed_at,form:coach_forms(id,name,status)')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('coach_form_submissions')
      .select('id,response,review_status,coach_notes,submitted_at,reviewed_at,form:coach_forms(id,name)')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false })
      .limit(20),
    supabase
      .from('coach_schedule_events')
      .select('id,title,event_type,status,start_at,end_at,notes')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('start_at', { ascending: false })
      .limit(30),
  ])

  const hasFetchError =
    profileResult.error ||
    programResult.error ||
    formAssignmentResult.error ||
    formSubmissionResult.error ||
    scheduleResult.error

  if (hasFetchError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_SUMMARY_FETCH_FAILED',
      title: 'Client Summary Fetch Failed',
      detail:
        profileResult.error?.message ||
        programResult.error?.message ||
        formAssignmentResult.error?.message ||
        formSubmissionResult.error?.message ||
        scheduleResult.error?.message ||
        'Unable to fetch client summary.',
      requestId,
    })
  }

  const profile = (profileResult.data ?? null) as ClientProfileRow | null
  const programRows = Array.isArray(programResult.data) ? (programResult.data as ProgramAssignmentRow[]) : []
  const formAssignmentRows = Array.isArray(formAssignmentResult.data)
    ? (formAssignmentResult.data as FormAssignmentRow[])
    : []
  const formSubmissionRows = Array.isArray(formSubmissionResult.data)
    ? (formSubmissionResult.data as FormSubmissionRow[])
    : []
  const scheduleRows = Array.isArray(scheduleResult.data) ? (scheduleResult.data as ScheduleEventRow[]) : []

  const programAssignments = programRows.map((row) => ({
    id: String(row.id || ''),
    status: String(row.status || 'active'),
    progressPct: Number(row.progress_pct || 0),
    assignedAt: String(row.assigned_at || new Date().toISOString()),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    program: {
      id: String(row.program?.id || ''),
      name: String(row.program?.name || 'Program'),
      difficulty: String(row.program?.difficulty || 'Beginner'),
      lengthLabel: String(row.program?.length_label || '4 Weeks'),
    },
  }))

  const formAssignments = formAssignmentRows.map((row) => ({
    id: String(row.id || ''),
    assignedAt: String(row.assigned_at || new Date().toISOString()),
    deadline: row.deadline ? String(row.deadline) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    form: {
      id: String(row.form?.id || ''),
      name: String(row.form?.name || 'Form'),
      status: String(row.form?.status || 'draft'),
    },
  }))

  const formSubmissions = formSubmissionRows.map((row) => ({
    id: String(row.id || ''),
    submittedAt: String(row.submitted_at || new Date().toISOString()),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewStatus: String(row.review_status || 'pending'),
    coachNotes: row.coach_notes ? String(row.coach_notes) : '',
    response: row.response && typeof row.response === 'object' ? row.response : {},
    form: {
      id: String(row.form?.id || ''),
      name: String(row.form?.name || 'Form'),
    },
  }))

  const scheduleEvents = scheduleRows.map((row) => ({
    id: String(row.id || ''),
    title: String(row.title || 'Session'),
    eventType: String(row.event_type || '1-on-1'),
    status: String(row.status || 'scheduled'),
    startAt: String(row.start_at || new Date().toISOString()),
    endAt: String(row.end_at || new Date().toISOString()),
    notes: row.notes ? String(row.notes) : '',
  }))

  return dataResponse({
    requestId,
    data: {
      client: {
        id: String(clientId),
        name: String(profile?.full_name || profile?.email?.split('@')?.[0] || 'Client'),
        email: String(profile?.email || ''),
        avatarUrl: getSafeImageSrc(profile?.avatar_url, getAvatarFallbackUrl(clientId)),
      },
      link: {
        id: String(linkRow.id),
        status: String(linkRow.status || 'active'),
        goalName: String(linkRow.goal_name || 'General Fitness'),
        compliance: Number(linkRow.compliance || 0),
        lastActiveAt: String(linkRow.last_active_at || new Date().toISOString()),
        weightTrend: Array.isArray(linkRow.weight_trend) ? linkRow.weight_trend : [],
        notes: linkRow.notes ? String(linkRow.notes) : '',
      },
      programAssignments,
      formAssignments,
      formSubmissions,
      scheduleEvents,
    },
  })
}
