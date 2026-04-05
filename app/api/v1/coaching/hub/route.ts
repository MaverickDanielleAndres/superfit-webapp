import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

type JsonLike = string | number | boolean | null | JsonLike[] | { [key: string]: JsonLike }

const UpdateSharingSchema = z
  .object({
    weight: z.boolean().optional(),
    nutrition: z.boolean().optional(),
    progressPhotos: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.weight !== undefined || value.nutrition !== undefined || value.progressPhotos !== undefined,
    {
      message: 'At least one sharing field is required.',
      path: ['weight'],
    },
  )

interface ActiveLinkRow {
  id: string | null
  coach_id: string | null
  status: string | null
  goal_name: string | null
  updated_at: string | null
}

interface CoachProfileRow {
  id: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  goal: string | null
}

interface ProgramInfoRow {
  id: string | null
  name: string | null
  difficulty: string | null
  length_label: string | null
}

interface ProgramAssignmentRow {
  id: string | null
  status: string | null
  progress_pct: number | null
  assigned_at: string | null
  program: ProgramInfoRow | null
}

interface FormInfoRow {
  id: string | null
  name: string | null
  status: string | null
  form_schema: JsonLike
}

type HubQuestionType = 'short_text' | 'long_text' | 'number' | 'date' | 'single_select' | 'multi_select' | 'checkbox_group' | 'scale'

interface HubFormQuestion {
  id: string
  label: string
  type: HubQuestionType
  required: boolean
  options: string[]
  scaleMin?: number
  scaleMax?: number
  scaleStep?: number
}

interface FormAssignmentRow {
  id: string | null
  form_id: string | null
  assigned_at: string | null
  deadline: string | null
  completed_at: string | null
  form: FormInfoRow | null
}

interface FormSubmissionRow {
  id: string | null
  form_id: string | null
  response: JsonLike
  review_status: string | null
  coach_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
}

interface ScheduleRow {
  id: string | null
  title: string | null
  event_type: string | null
  status: string | null
  start_at: string | null
  end_at: string | null
  notes: string | null
}

interface ProfileSettingsRow {
  profile_visibility: string | null
  share_weight_data: boolean | null
  share_workouts: boolean | null
  week_start: string | null
  integrations: JsonLike
  two_factor_enabled: boolean | null
}

interface MessageRow {
  id: string | null
  text: string | null
  attachments: JsonLike
  created_at: string | null
}

function getCoachAvatar(coachId: string, avatarUrl: string | null): string {
  return String(
    avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(coachId || 'coach')}`,
  )
}

function toIsoString(value: string | null | undefined): string {
  if (!value) return new Date().toISOString()
  return String(value)
}

function extractBroadcastAttachment(attachments: JsonLike): {
  mediaUrl: string | null
  audience: string | null
  broadcastLogId: string | null
} | null {
  if (!Array.isArray(attachments)) return null

  for (const entry of attachments) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    if (String(candidate.kind || '') !== 'broadcast') continue

    return {
      mediaUrl: candidate.mediaUrl ? String(candidate.mediaUrl) : null,
      audience: candidate.audience ? String(candidate.audience) : null,
      broadcastLogId: candidate.broadcastLogId ? String(candidate.broadcastLogId) : null,
    }
  }

  return null
}

function normalizeQuestionType(value: unknown): HubQuestionType {
  if (
    value === 'long_text' ||
    value === 'number' ||
    value === 'date' ||
    value === 'single_select' ||
    value === 'multi_select' ||
    value === 'checkbox_group' ||
    value === 'scale'
  ) {
    return value
  }

  return 'short_text'
}

function normalizeFormQuestions(formSchema: JsonLike | null | undefined): HubFormQuestion[] {
  if (!formSchema || typeof formSchema !== 'object' || Array.isArray(formSchema)) return []

  const questionsValue = (formSchema as Record<string, unknown>).questions
  if (!Array.isArray(questionsValue)) return []

  return questionsValue.map((entry, index) => {
    const question = entry && typeof entry === 'object' && !Array.isArray(entry)
      ? (entry as Record<string, unknown>)
      : {}

    const type = normalizeQuestionType(question.type)
    const questionId = typeof question.id === 'string' && question.id.trim().length > 0
      ? question.id
      : `q-${index + 1}`

    const label = typeof question.label === 'string' && question.label.trim().length > 0
      ? question.label.trim()
      : `Question ${index + 1}`

    const options = (type === 'single_select' || type === 'multi_select' || type === 'checkbox_group') && Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim()).filter(Boolean)
      : []

    const scaleMin = type === 'scale' && Number.isFinite(Number(question.scaleMin))
      ? Number(question.scaleMin)
      : 1
    const scaleMax = type === 'scale' && Number.isFinite(Number(question.scaleMax))
      ? Number(question.scaleMax)
      : 10
    const scaleStep = type === 'scale' && Number.isFinite(Number(question.scaleStep)) && Number(question.scaleStep) > 0
      ? Number(question.scaleStep)
      : 1

    return {
      id: questionId,
      label,
      type,
      required: Boolean(question.required),
      options,
      scaleMin: type === 'scale' ? scaleMin : undefined,
      scaleMax: type === 'scale' ? scaleMax : undefined,
      scaleStep: type === 'scale' ? scaleStep : undefined,
    }
  })
}

async function findDirectThreadId(db: SupabaseServerClient, clientId: string, coachId: string): Promise<string | null> {
  const { data: clientMembershipRows, error: clientMembershipError } = await db
    .from('message_thread_participants')
    .select('thread_id')
    .eq('user_id', clientId)

  if (clientMembershipError) return null

  const clientThreadIds = Array.from(
    new Set(
      (Array.isArray(clientMembershipRows) ? clientMembershipRows : [])
        .map((row: { thread_id?: string | null }) => String(row.thread_id || ''))
        .filter(Boolean),
    ),
  )

  if (!clientThreadIds.length) return null

  const { data: coachMembershipRows, error: coachMembershipError } = await db
    .from('message_thread_participants')
    .select('thread_id')
    .eq('user_id', coachId)
    .in('thread_id', clientThreadIds)

  if (coachMembershipError) return null

  const sharedThreadIds = Array.from(
    new Set(
      (Array.isArray(coachMembershipRows) ? coachMembershipRows : [])
        .map((row: { thread_id?: string | null }) => String(row.thread_id || ''))
        .filter(Boolean),
    ),
  )

  if (!sharedThreadIds.length) return null

  const { data: threadRows, error: threadError } = await db
    .from('message_threads')
    .select('id,is_group')
    .in('id', sharedThreadIds)

  if (threadError) return null

  const directThread = (Array.isArray(threadRows) ? threadRows : []).find(
    (row: { id?: string | null; is_group?: boolean | null }) => row?.is_group === false,
  )

  return directThread?.id ? String(directThread.id) : null
}

export async function GET() {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabase as SupabaseServerClient

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

  const { data: profileSettingsData, error: settingsError } = await db
    .from('profile_settings')
    .select('profile_visibility,share_weight_data,share_workouts,week_start,integrations,two_factor_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (settingsError) {
    return problemResponse({
      status: 500,
      code: 'COACHING_HUB_FETCH_FAILED',
      title: 'Coaching Hub Fetch Failed',
      detail: settingsError.message,
      requestId,
    })
  }

  const profileSettings = (profileSettingsData ?? null) as ProfileSettingsRow | null

  const { data: activeLinkData, error: activeLinkError } = await db
    .from('coach_client_links')
    .select('id,coach_id,status,goal_name,updated_at')
    .eq('client_id', user.id)
    .in('status', ['active', 'onboarding'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeLinkError) {
    return problemResponse({
      status: 500,
      code: 'COACHING_HUB_FETCH_FAILED',
      title: 'Coaching Hub Fetch Failed',
      detail: activeLinkError.message,
      requestId,
    })
  }

  const activeLink = (activeLinkData ?? null) as ActiveLinkRow | null

  const sharing = {
    weight: Boolean(profileSettings?.share_weight_data ?? true),
    nutrition: Boolean(profileSettings?.share_workouts ?? true),
    progressPhotos: Boolean(profileSettings?.share_workouts ?? false),
  }

  if (!activeLink?.coach_id) {
    return dataResponse({
      requestId,
      data: {
        coach: null,
        link: null,
        programAssignments: [],
        formAssignments: [],
        formSubmissions: [],
        scheduleEvents: [],
        announcements: [],
        stats: {
          activePrograms: 0,
          pendingForms: 0,
          upcomingSessions: 0,
        },
        sharing,
      },
    })
  }

  const coachId = String(activeLink.coach_id)

  const [coachResult, programResult, formAssignmentResult, formSubmissionResult, scheduleResult] = await Promise.all([
    db
      .from('profiles')
      .select('id,full_name,email,avatar_url,goal')
      .eq('id', coachId)
      .maybeSingle(),
    db
      .from('coach_program_assignments')
      .select('id,status,progress_pct,assigned_at,program:coach_programs(id,name,difficulty,length_label)')
      .eq('coach_id', coachId)
      .eq('client_id', user.id)
      .order('assigned_at', { ascending: false }),
    db
      .from('coach_form_assignments')
      .select('id,form_id,assigned_at,deadline,completed_at,form:coach_forms(id,name,status,form_schema)')
      .eq('coach_id', coachId)
      .eq('client_id', user.id)
      .order('assigned_at', { ascending: false }),
    db
      .from('coach_form_submissions')
      .select('id,form_id,response,review_status,coach_notes,submitted_at,reviewed_at')
      .eq('coach_id', coachId)
      .eq('client_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(50),
    db
      .from('coach_schedule_events')
      .select('id,title,event_type,status,start_at,end_at,notes')
      .eq('coach_id', coachId)
      .eq('client_id', user.id)
      .order('start_at', { ascending: true })
      .limit(40),
  ])

  const hasFetchError =
    coachResult.error ||
    programResult.error ||
    formAssignmentResult.error ||
    formSubmissionResult.error ||
    scheduleResult.error

  if (hasFetchError) {
    return problemResponse({
      status: 500,
      code: 'COACHING_HUB_FETCH_FAILED',
      title: 'Coaching Hub Fetch Failed',
      detail:
        coachResult.error?.message ||
        programResult.error?.message ||
        formAssignmentResult.error?.message ||
        formSubmissionResult.error?.message ||
        scheduleResult.error?.message ||
        'Unable to load coaching hub data.',
      requestId,
    })
  }

  const coachProfile = (coachResult.data ?? null) as CoachProfileRow | null
  const programRows = Array.isArray(programResult.data) ? (programResult.data as ProgramAssignmentRow[]) : []
  const formAssignmentRows = Array.isArray(formAssignmentResult.data)
    ? (formAssignmentResult.data as FormAssignmentRow[])
    : []
  const formSubmissionRows = Array.isArray(formSubmissionResult.data)
    ? (formSubmissionResult.data as FormSubmissionRow[])
    : []
  const scheduleRows = Array.isArray(scheduleResult.data) ? (scheduleResult.data as ScheduleRow[]) : []

  const formNameById = new Map<string, string>()
  for (const assignment of formAssignmentRows) {
    const formId = String(assignment.form_id || assignment.form?.id || '')
    if (!formId) continue
    formNameById.set(formId, String(assignment.form?.name || 'Form'))
  }

  const latestSubmissionByFormId = new Map<string, FormSubmissionRow>()
  for (const submission of formSubmissionRows) {
    const formId = String(submission.form_id || '')
    if (!formId || latestSubmissionByFormId.has(formId)) continue
    latestSubmissionByFormId.set(formId, submission)
  }

  const programAssignments = programRows.map((row) => ({
    id: String(row.id || ''),
    status: String(row.status || 'active'),
    progressPct: Number(row.progress_pct || 0),
    assignedAt: toIsoString(row.assigned_at),
    program: {
      id: String(row.program?.id || ''),
      name: String(row.program?.name || 'Program'),
      difficulty: String(row.program?.difficulty || 'Beginner'),
      lengthLabel: String(row.program?.length_label || '4 Weeks'),
    },
  }))

  const formAssignments = formAssignmentRows.map((row) => {
    const formId = String(row.form_id || row.form?.id || '')
    const latestSubmission = latestSubmissionByFormId.get(formId)

    return {
      id: String(row.id || ''),
      assignedAt: toIsoString(row.assigned_at),
      deadline: row.deadline ? String(row.deadline) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
      form: {
        id: formId,
        name: String(row.form?.name || formNameById.get(formId) || 'Form'),
        status: String(row.form?.status || 'active'),
        questions: normalizeFormQuestions(row.form?.form_schema),
      },
      submission: latestSubmission
        ? {
            id: String(latestSubmission.id || ''),
            reviewStatus: String(latestSubmission.review_status || 'pending'),
            submittedAt: toIsoString(latestSubmission.submitted_at),
            reviewedAt: latestSubmission.reviewed_at ? String(latestSubmission.reviewed_at) : null,
            coachNotes: latestSubmission.coach_notes ? String(latestSubmission.coach_notes) : '',
            response:
              latestSubmission.response && typeof latestSubmission.response === 'object'
                ? latestSubmission.response
                : {},
          }
        : null,
    }
  })

  const formSubmissions = formSubmissionRows.map((row) => {
    const response = row.response && typeof row.response === 'object' ? row.response : {}
    const formId = String(row.form_id || '')

    return {
      id: String(row.id || ''),
      formId,
      formName: String(formNameById.get(formId) || 'Form'),
      reviewStatus: String(row.review_status || 'pending'),
      submittedAt: toIsoString(row.submitted_at),
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      coachNotes: row.coach_notes ? String(row.coach_notes) : '',
      response,
    }
  })

  const nowMs = Date.now()
  const scheduleEvents = scheduleRows.map((row) => {
    const startAt = toIsoString(row.start_at)
    const startMs = Number.isFinite(Date.parse(startAt)) ? Date.parse(startAt) : 0

    return {
      id: String(row.id || ''),
      title: String(row.title || 'Session'),
      eventType: String(row.event_type || '1-on-1'),
      status: String(row.status || 'scheduled'),
      startAt,
      endAt: toIsoString(row.end_at),
      notes: row.notes ? String(row.notes) : '',
      isUpcoming: startMs >= nowMs && String(row.status || 'scheduled') === 'scheduled',
    }
  })

  const directThreadId = await findDirectThreadId(db, user.id, coachId)
  let announcements: Array<{
    id: string
    message: string
    createdAt: string
    mediaUrl: string | null
    audienceLabel: string | null
    broadcastLogId: string | null
  }> = []

  if (directThreadId) {
    const { data: rawMessages, error: messageError } = await db
      .from('messages')
      .select('id,text,attachments,created_at')
      .eq('thread_id', directThreadId)
      .eq('sender_id', coachId)
      .order('created_at', { ascending: false })
      .limit(40)

    if (messageError) {
      return problemResponse({
        status: 500,
        code: 'COACHING_HUB_FETCH_FAILED',
        title: 'Coaching Hub Fetch Failed',
        detail: messageError.message,
        requestId,
      })
    }

    const messageRows = Array.isArray(rawMessages) ? (rawMessages as MessageRow[]) : []
    announcements = messageRows
      .map((row) => {
        const attachment = extractBroadcastAttachment(row.attachments)
        if (!attachment) return null

        return {
          id: String(row.id || ''),
          message: String(row.text || ''),
          createdAt: toIsoString(row.created_at),
          mediaUrl: attachment.mediaUrl,
          audienceLabel: attachment.audience,
          broadcastLogId: attachment.broadcastLogId,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }

  const pendingForms = formAssignments.filter((item) => !item.completedAt).length
  const upcomingSessions = scheduleEvents.filter((event) => event.isUpcoming).length

  return dataResponse({
    requestId,
    data: {
      coach: coachProfile?.id
        ? {
            id: String(coachProfile.id),
            name: String(coachProfile.full_name || coachProfile.email?.split('@')?.[0] || 'Coach'),
            avatar: getCoachAvatar(String(coachProfile.id), coachProfile.avatar_url),
            bio: String(coachProfile.goal || 'Your coaching partner.'),
          }
        : null,
      link: {
        id: String(activeLink.id || ''),
        coachId,
        status: String(activeLink.status || 'active'),
        goalName: String(activeLink.goal_name || 'General Fitness'),
      },
      programAssignments,
      formAssignments,
      formSubmissions,
      scheduleEvents,
      announcements,
      stats: {
        activePrograms: programAssignments.length,
        pendingForms,
        upcomingSessions,
      },
      sharing,
    },
  })
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabase as SupabaseServerClient

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

  const parsed = UpdateSharingSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid sharing settings payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: existingData, error: existingError } = await db
    .from('profile_settings')
    .select('profile_visibility,share_weight_data,share_workouts,week_start,integrations,two_factor_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return problemResponse({
      status: 500,
      code: 'COACHING_HUB_SHARING_UPDATE_FAILED',
      title: 'Sharing Update Failed',
      detail: existingError.message,
      requestId,
    })
  }

  const existing = (existingData ?? null) as ProfileSettingsRow | null
  const currentWeight = Boolean(existing?.share_weight_data ?? true)
  const currentWorkouts = Boolean(existing?.share_workouts ?? true)

  const nextWeight = parsed.data.weight ?? currentWeight
  const nextWorkouts = parsed.data.nutrition ?? parsed.data.progressPhotos ?? currentWorkouts

  const { error: upsertError } = await db.from('profile_settings').upsert(
    {
      user_id: user.id,
      profile_visibility: String(existing?.profile_visibility || 'public'),
      share_weight_data: nextWeight,
      share_workouts: nextWorkouts,
      week_start: String(existing?.week_start || 'monday'),
      integrations: existing?.integrations || {},
      two_factor_enabled: Boolean(existing?.two_factor_enabled ?? false),
    },
    { onConflict: 'user_id' },
  )

  if (upsertError) {
    return problemResponse({
      status: 500,
      code: 'COACHING_HUB_SHARING_UPDATE_FAILED',
      title: 'Sharing Update Failed',
      detail: upsertError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      sharing: {
        weight: nextWeight,
        nutrition: nextWorkouts,
        progressPhotos: nextWorkouts,
      },
      updated: true,
    },
  })
}
