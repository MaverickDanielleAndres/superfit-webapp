import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

export interface CoachClientItem {
  linkId: string
  id: string
  name: string
  email: string
  goal: string
  lastActive: string
  compliance: number
  weightTrend: number[]
  status: 'Active' | 'Onboarding' | 'Inactive'
}

export interface CoachProgramItem {
  id: string
  name: string
  enrolled: number
  difficulty: string
  length: string
  cover: string
  builderDays: Array<{ id: string; name: string; exercises: string[] }>
}

export interface CoachFormItem {
  id: string
  name: string
  submissions: number
  lastUpdated: string
  status: 'Active' | 'Draft' | 'Archived'
}

export interface CoachScheduleEvent {
  id: string
  title: string
  time: string
  type: string
  color: string
  status: 'scheduled' | 'completed' | 'cancelled'
  startAt: string
  endAt: string
  clientId?: string
}

export interface CoachBroadcastHistory {
  id: string
  target: string
  snippet: string
  sentAt: string
  delivered: number
  read: number
}

interface CoachPortalState {
  coachId: string | null
  clients: CoachClientItem[]
  programs: CoachProgramItem[]
  forms: CoachFormItem[]
  events: CoachScheduleEvent[]
  broadcasts: CoachBroadcastHistory[]
  isLoading: boolean
  error: string | null

  initialize: () => Promise<void>
  fetchClients: () => Promise<void>
  fetchPrograms: () => Promise<void>
  fetchForms: () => Promise<void>
  fetchEvents: () => Promise<void>
  fetchBroadcasts: () => Promise<void>
  updateClientStatus: (linkId: string, status: CoachClientItem['status']) => Promise<void>
  addNextAvailableClient: () => Promise<boolean>

  addProgram: (payload: {
    name: string
    difficulty: string
    length: string
    cover?: string
    builderDays?: Array<{ id: string; name: string; exercises: string[] }>
  }) => Promise<void>
  updateProgram: (programId: string, payload: {
    name?: string
    difficulty?: string
    length?: string
    cover?: string
    builderDays?: Array<{ id: string; name: string; exercises: string[] }>
  }) => Promise<void>
  updateProgramDays: (programId: string, builderDays: Array<{ id: string; name: string; exercises: string[] }>) => Promise<void>
  duplicateProgram: (programId: string) => Promise<void>
  assignProgram: (programId: string, clientIds: string[]) => Promise<void>

  createForm: (name: string) => Promise<void>
  duplicateForm: (formId: string) => Promise<void>
  deleteForm: (formId: string) => Promise<void>
  updateFormStatus: (formId: string, status: CoachFormItem['status']) => Promise<void>
  assignFormToClients: (formId: string, clientIds: string[], deadline?: string) => Promise<void>

  addScheduleEvent: (payload: {
    title: string
    type: string
    startAt: string
    endAt: string
    status?: 'scheduled' | 'completed' | 'cancelled'
    clientId?: string
  }) => Promise<void>

  logBroadcast: (payload: { target: string; message: string; delivered: number; read: number }) => Promise<void>
  createOrGetDirectThread: (clientId: string) => Promise<string | null>
}

const DEFAULT_PROGRAM_COVER =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'

export const useCoachPortalStore = create<CoachPortalState>((set, get) => ({
  coachId: null,
  clients: [],
  programs: [],
  forms: [],
  events: [],
  broadcasts: [],
  isLoading: false,
  error: null,

  initialize: async () => {
    if (!isSupabaseAuthEnabled()) return

    set({ isLoading: true, error: null })
    const coachId = await getAuthenticatedUserId()

    if (!coachId) {
      set({ isLoading: false, error: 'Coach is not authenticated.' })
      return
    }

    set({ coachId })

    try {
      await Promise.all([
        get().fetchClients(),
        get().fetchPrograms(),
        get().fetchForms(),
        get().fetchEvents(),
        get().fetchBroadcasts(),
      ])
      set({ isLoading: false, error: null })
    } catch (error) {
      set({ isLoading: false, error: toErrorMessage(error, 'Unable to load coach portal data.') })
    }
  },

  fetchClients: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('coach_client_links')
      .select('id,client_id,status,goal_name,compliance,weight_trend,last_active_at,client:profiles(full_name,email)')
      .eq('coach_id', coachId)
      .order('last_active_at', { ascending: false })

    if (error) {
      set({ error: error.message })
      return
    }

    const clients: CoachClientItem[] = (data || []).map((row: any) => {
      const profile = row.client || {}
      return {
        linkId: String(row.id),
        id: String(row.client_id),
        name: String(profile.full_name || 'Client'),
        email: String(profile.email || ''),
        goal: String(row.goal_name || 'General Fitness'),
        lastActive: toRelativeTime(row.last_active_at),
        compliance: Number(row.compliance || 0),
        weightTrend: parseWeightTrend(row.weight_trend),
        status: normalizeClientStatus(row.status),
      }
    })

    set({ clients })
  },

  fetchPrograms: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { data: programsData, error: programsError } = await (supabase as any)
      .from('coach_programs')
      .select('id,name,difficulty,length_label,cover_url,builder_days')
      .eq('coach_id', coachId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (programsError) {
      set({ error: programsError.message })
      return
    }

    const programIds = (programsData || []).map((row: any) => row.id)
    let assignments: any[] = []

    if (programIds.length) {
      const { data: assignmentData, error: assignmentError } = await (supabase as any)
        .from('coach_program_assignments')
        .select('program_id')
        .eq('coach_id', coachId)
        .in('program_id', programIds)

      if (assignmentError) {
        set({ error: assignmentError.message })
      } else {
        assignments = assignmentData || []
      }
    }

    const enrollmentMap = new Map<string, number>()
    for (const row of assignments) {
      const programId = String(row.program_id || '')
      enrollmentMap.set(programId, (enrollmentMap.get(programId) || 0) + 1)
    }

    const programs: CoachProgramItem[] = (programsData || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name || 'Untitled Program'),
      enrolled: enrollmentMap.get(String(row.id)) || 0,
      difficulty: String(row.difficulty || 'Beginner'),
      length: String(row.length_label || '4 Weeks'),
      cover: String(row.cover_url || DEFAULT_PROGRAM_COVER),
      builderDays: parseBuilderDays(row.builder_days),
    }))

    set({ programs })
  },

  fetchForms: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { data: formsData, error: formsError } = await (supabase as any)
      .from('coach_forms')
      .select('id,name,status,updated_at')
      .eq('coach_id', coachId)
      .order('updated_at', { ascending: false })

    if (formsError) {
      set({ error: formsError.message })
      return
    }

    const formIds = (formsData || []).map((row: any) => row.id)
    let submissions: any[] = []

    if (formIds.length) {
      const { data: submissionData, error: submissionError } = await (supabase as any)
        .from('coach_form_submissions')
        .select('form_id')
        .eq('coach_id', coachId)
        .in('form_id', formIds)

      if (submissionError) {
        set({ error: submissionError.message })
      } else {
        submissions = submissionData || []
      }
    }

    const submissionMap = new Map<string, number>()
    for (const row of submissions) {
      const formId = String(row.form_id || '')
      submissionMap.set(formId, (submissionMap.get(formId) || 0) + 1)
    }

    const forms: CoachFormItem[] = (formsData || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name || 'Untitled Form'),
      submissions: submissionMap.get(String(row.id)) || 0,
      lastUpdated: formatDateLabel(String(row.updated_at || new Date().toISOString())),
      status: normalizeFormStatus(row.status),
    }))

    set({ forms })
  },

  fetchEvents: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('coach_schedule_events')
      .select('id,title,event_type,start_at,end_at,status,client_id')
      .eq('coach_id', coachId)
      .order('start_at', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }

    const events: CoachScheduleEvent[] = (data || []).map((row: any) => ({
      id: String(row.id),
      title: String(row.title || 'Untitled Event'),
      time: `${new Date(row.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(row.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: String(row.event_type || '1-on-1'),
      color: eventColor(String(row.event_type || '1-on-1')),
      status: normalizeEventStatus(row.status),
      startAt: String(row.start_at),
      endAt: String(row.end_at),
      clientId: row.client_id ? String(row.client_id) : undefined,
    }))

    set({ events })
  },

  fetchBroadcasts: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('coach_broadcast_logs')
      .select('id,audience_label,message,delivered_count,read_count,created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      set({ error: error.message })
      return
    }

    const broadcasts: CoachBroadcastHistory[] = (data || []).map((row: any) => ({
      id: String(row.id),
      target: String(row.audience_label || 'Audience'),
      snippet: String(row.message || ''),
      sentAt: formatDateLabel(String(row.created_at || new Date().toISOString())),
      delivered: Number(row.delivered_count || 0),
      read: Number(row.read_count || 0),
    }))

    set({ broadcasts })
  },

  updateClientStatus: async (linkId, status) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_client_links')
      .update({ status: status.toLowerCase() })
      .eq('id', linkId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchClients()
  },

  addNextAvailableClient: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return false

    const supabase = createClient()
    const { data: linkedRows, error: linkedError } = await (supabase as any)
      .from('coach_client_links')
      .select('client_id')
      .eq('coach_id', coachId)

    if (linkedError) {
      set({ error: linkedError.message })
      return false
    }

    const linkedIds = new Set((linkedRows || []).map((row: any) => String(row.client_id || '')))

    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id,goal')
      .eq('role', 'user')
      .eq('account_status', 'active')
      .order('created_at', { ascending: true })
      .limit(50)

    if (profilesError) {
      set({ error: profilesError.message })
      return false
    }

    const nextClient = (profiles || []).find((profile: any) => !linkedIds.has(String(profile.id || '')))
    if (!nextClient?.id) return false

    const { error: insertError } = await (supabase as any)
      .from('coach_client_links')
      .insert({
        coach_id: coachId,
        client_id: nextClient.id,
        status: 'active',
        goal_name: String(nextClient.goal || 'General Fitness'),
        compliance: 0,
        weight_trend: [],
        last_active_at: new Date().toISOString(),
      })

    if (insertError) {
      set({ error: insertError.message })
      return false
    }

    await get().fetchClients()
    return true
  },

  addProgram: async (payload) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_programs')
      .insert({
        coach_id: coachId,
        name: payload.name,
        difficulty: payload.difficulty,
        length_label: payload.length,
        cover_url: payload.cover || DEFAULT_PROGRAM_COVER,
        builder_days: payload.builderDays || [],
      })

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchPrograms()
  },

  updateProgram: async (programId, payload) => {
    const supabase = createClient()
    const updates: Record<string, unknown> = {}
    if (payload.name !== undefined) updates.name = payload.name
    if (payload.difficulty !== undefined) updates.difficulty = payload.difficulty
    if (payload.length !== undefined) updates.length_label = payload.length
    if (payload.cover !== undefined) updates.cover_url = payload.cover
    if (payload.builderDays !== undefined) updates.builder_days = payload.builderDays

    const { error } = await (supabase as any)
      .from('coach_programs')
      .update(updates)
      .eq('id', programId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchPrograms()
  },

  updateProgramDays: async (programId, builderDays) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_programs')
      .update({ builder_days: builderDays })
      .eq('id', programId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchPrograms()
  },

  duplicateProgram: async (programId) => {
    const coachId = get().coachId
    if (!coachId) return

    const source = get().programs.find((program) => program.id === programId)
    if (!source) return

    await get().addProgram({
      name: `${source.name} Copy`,
      difficulty: source.difficulty,
      length: source.length,
      cover: source.cover,
      builderDays: source.builderDays,
    })
  },

  assignProgram: async (programId, clientIds) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId || !clientIds.length) return

    const supabase = createClient()
    const rows = clientIds.map((clientId) => ({
      program_id: programId,
      coach_id: coachId,
      client_id: clientId,
      status: 'active',
      progress_pct: 0,
    }))

    const { error } = await (supabase as any)
      .from('coach_program_assignments')
      .upsert(rows, { onConflict: 'program_id,client_id' })

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchPrograms()
  },

  createForm: async (name) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_forms')
      .insert({
        coach_id: coachId,
        name,
        status: 'draft',
        form_schema: { questions: [] },
      })

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchForms()
  },

  duplicateForm: async (formId) => {
    const form = get().forms.find((entry) => entry.id === formId)
    if (!form) return

    await get().createForm(`${form.name} Copy`)
  },

  deleteForm: async (formId) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_forms')
      .delete()
      .eq('id', formId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchForms()
  },

  updateFormStatus: async (formId, status) => {
    const supabase = createClient()
    const normalized = status.toLowerCase()

    const { error } = await (supabase as any)
      .from('coach_forms')
      .update({ status: normalized })
      .eq('id', formId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchForms()
  },

  assignFormToClients: async (formId, clientIds, deadline) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId || !clientIds.length) return

    const supabase = createClient()
    const rows = clientIds.map((clientId) => ({
      form_id: formId,
      coach_id: coachId,
      client_id: clientId,
      deadline: deadline || null,
    }))

    const { data, error } = await (supabase as any)
      .from('coach_form_assignments')
      .upsert(rows, { onConflict: 'form_id,coach_id,client_id' })
      .select('id')

    if (error) {
      set({ error: error.message })
      return
    }

    const assignmentIds = (data || [])
      .map((row: { id?: string }) => String(row.id || ''))
      .filter(Boolean)

    if (assignmentIds.length && isSupabaseAuthEnabled()) {
      const { error: invokeError } = await supabase.functions.invoke('on-form-assigned', {
        body: {
          assignmentIds,
        },
      })

      if (invokeError) {
        set({ error: `Assignments created but notification failed: ${invokeError.message}` })
      }
    }

    await get().fetchForms()
  },

  addScheduleEvent: async (payload) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_schedule_events')
      .insert({
        coach_id: coachId,
        client_id: payload.clientId || null,
        title: payload.title,
        event_type: payload.type,
        status: payload.status || 'scheduled',
        start_at: payload.startAt,
        end_at: payload.endAt,
      })

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchEvents()
  },

  logBroadcast: async (payload) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('coach_broadcast_logs')
      .insert({
        coach_id: coachId,
        audience_label: payload.target,
        message: payload.message,
        delivered_count: payload.delivered,
        read_count: payload.read,
      })

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchBroadcasts()
  },

  createOrGetDirectThread: async (clientId) => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId || !isSupabaseAuthEnabled()) return null

    const supabase = createClient()
    const existingThreadId = await findDirectThreadId(supabase, coachId, clientId)
    if (existingThreadId) return existingThreadId

    const { data: threadData, error: threadError } = await (supabase as any)
      .from('message_threads')
      .insert({
        created_by: coachId,
        is_group: false,
      })
      .select('id')
      .single()

    if (threadError || !threadData?.id) {
      set({ error: threadError?.message || 'Unable to start conversation.' })
      return null
    }

    const { error: participantsError } = await (supabase as any)
      .from('message_thread_participants')
      .insert([
        { thread_id: threadData.id, user_id: coachId },
        { thread_id: threadData.id, user_id: clientId },
      ])

    if (participantsError) {
      set({ error: participantsError.message })
      return null
    }

    return String(threadData.id)
  },
}))

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseAuthEnabled()) return null
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

async function findDirectThreadId(
  supabase: ReturnType<typeof createClient>,
  coachId: string,
  clientId: string
): Promise<string | null> {
  const { data: memberships, error: membershipError } = await (supabase as any)
    .from('message_thread_participants')
    .select('thread_id,thread:message_threads(is_group)')
    .eq('user_id', coachId)

  if (membershipError) return null

  const directThreadIds = (memberships || [])
    .filter((row: any) => !row.thread?.is_group)
    .map((row: any) => String(row.thread_id || ''))
    .filter(Boolean)

  if (!directThreadIds.length) return null

  const { data: participants, error: participantsError } = await (supabase as any)
    .from('message_thread_participants')
    .select('thread_id,user_id')
    .in('thread_id', directThreadIds)

  if (participantsError) return null

  const participantsByThread = new Map<string, string[]>()
  for (const row of participants || []) {
    const threadId = String(row.thread_id || '')
    const userId = String(row.user_id || '')
    const existing = participantsByThread.get(threadId) || []
    participantsByThread.set(threadId, [...existing, userId])
  }

  const match = directThreadIds.find((threadId: string) => {
    const users = participantsByThread.get(threadId) || []
    return users.length === 2 && users.includes(coachId) && users.includes(clientId)
  })

  return match || null
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

function parseWeightTrend(value: unknown): number[] {
  if (!Array.isArray(value) || !value.length) return [0, 0, 0, 0, 0, 0, 0]
  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry))
  return normalized.length ? normalized : [0, 0, 0, 0, 0, 0, 0]
}

function parseBuilderDays(value: unknown): Array<{ id: string; name: string; exercises: string[] }> {
  if (!Array.isArray(value)) return []

  return value.map((entry: any, index: number) => ({
    id: String(entry?.id || `d_${index + 1}`),
    name: String(entry?.name || `Day ${index + 1}`),
    exercises: Array.isArray(entry?.exercises)
      ? entry.exercises.map((exercise: unknown) => String(exercise))
      : [],
  }))
}

function toRelativeTime(isoDate: unknown): string {
  if (!isoDate) return 'Unknown'

  const date = new Date(String(isoDate))
  const diffMs = Date.now() - date.getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'Just now'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function normalizeClientStatus(value: unknown): CoachClientItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'onboarding') return 'Onboarding'
  if (status === 'inactive') return 'Inactive'
  return 'Active'
}

function normalizeFormStatus(value: unknown): CoachFormItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'active') return 'Active'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

function normalizeEventStatus(value: unknown): CoachScheduleEvent['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'scheduled'
}

function eventColor(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized.includes('group')) return 'bg-blue-500'
  if (normalized.includes('video')) return 'bg-purple-500'
  return 'bg-emerald-500'
}
