import { create } from 'zustand'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { requestApi } from '@/lib/api/client'

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
    try {
      const response = await requestApi<{
        clients: Array<{
          id: string
          client_id: string
          status: string | null
          goal_name: string | null
          compliance: number | null
          weight_trend: unknown
          last_active_at: string | null
          client?: { full_name?: string | null; email?: string | null } | null
        }>
      }>('/api/v1/coach/clients')

      const clients: CoachClientItem[] = (response.data.clients || []).map((row) => {
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
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch clients.') })
      return
    }
  },

  fetchPrograms: async () => {
    try {
      const response = await requestApi<{
        programs: Array<{
          id: string
          name: string
          enrolled: number
          difficulty: string
          length: string
          cover: string
          builderDays: unknown
        }>
      }>('/api/v1/coach/programs')

      const programs: CoachProgramItem[] = (response.data.programs || []).map((row) => ({
        id: String(row.id),
        name: String(row.name || 'Untitled Program'),
        enrolled: Number(row.enrolled || 0),
        difficulty: String(row.difficulty || 'Beginner'),
        length: String(row.length || '4 Weeks'),
        cover: String(row.cover || DEFAULT_PROGRAM_COVER),
        builderDays: parseBuilderDays(row.builderDays),
      }))

      set({ programs })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch programs.') })
      return
    }
  },

  fetchForms: async () => {
    try {
      const response = await requestApi<{
        forms: Array<{
          id: string
          name: string
          submissions: number
          status: string
          updatedAt: string
        }>
      }>('/api/v1/coach/forms')

      const forms: CoachFormItem[] = (response.data.forms || []).map((row) => ({
        id: String(row.id),
        name: String(row.name || 'Untitled Form'),
        submissions: Number(row.submissions || 0),
        lastUpdated: formatDateLabel(String(row.updatedAt || new Date().toISOString())),
        status: normalizeFormStatus(row.status),
      }))

      set({ forms })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch forms.') })
      return
    }
  },

  fetchEvents: async () => {
    try {
      const response = await requestApi<{
        events: Array<{
          id: string
          title: string | null
          event_type: string | null
          start_at: string | null
          end_at: string | null
          status: string | null
          client_id: string | null
        }>
      }>('/api/v1/coach/schedule-events')

      const events: CoachScheduleEvent[] = (response.data.events || []).map((row) => {
        const startAt = String(row.start_at || new Date().toISOString())
        const endAt = String(row.end_at || new Date().toISOString())
        return {
          id: String(row.id),
          title: String(row.title || 'Untitled Event'),
          time: `${new Date(startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          type: String(row.event_type || '1-on-1'),
          color: eventColor(String(row.event_type || '1-on-1')),
          status: normalizeEventStatus(row.status),
          startAt,
          endAt,
          clientId: row.client_id ? String(row.client_id) : undefined,
        }
      })

      set({ events })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch events.') })
      return
    }
  },

  fetchBroadcasts: async () => {
    const coachId = get().coachId ?? (await getAuthenticatedUserId())
    if (!coachId) return

    try {
      const response = await requestApi<{
        broadcasts: Array<{
          id: string
          audience_label: string | null
          message: string | null
          delivered_count: number | null
          read_count: number | null
          created_at: string | null
        }>
      }>('/api/v1/coach/broadcast/history')

      const broadcasts: CoachBroadcastHistory[] = (response.data.broadcasts || []).map((row) => ({
        id: String(row.id),
        target: String(row.audience_label || 'Audience'),
        snippet: String(row.message || ''),
        sentAt: formatDateLabel(String(row.created_at || new Date().toISOString())),
        delivered: Number(row.delivered_count || 0),
        read: Number(row.read_count || 0),
      }))

      set({ broadcasts })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch broadcast history.') })
      return
    }
  },

  updateClientStatus: async (linkId, status) => {
    try {
      await requestApi<{ linkId: string; status: string }>(`/api/v1/coach/clients/${linkId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update client status.') })
      return
    }

    await get().fetchClients()
  },

  addNextAvailableClient: async () => {
    try {
      const response = await requestApi<{
        added: boolean
        reason?: string
        clientId?: string
      }>('/api/v1/coach/clients', {
        method: 'POST',
        body: JSON.stringify({ mode: 'next-available' }),
      })

      if (!response.data.added) {
        return false
      }

      await get().fetchClients()
      return true
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to add next available client.') })
      return false
    }
  },

  addProgram: async (payload) => {
    try {
      await requestApi<{ program: { id: string } }>('/api/v1/coach/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          difficulty: payload.difficulty,
          length: payload.length,
          cover: payload.cover,
          builderDays: payload.builderDays || [],
        }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to add program.') })
      return
    }

    await get().fetchPrograms()
  },

  updateProgram: async (programId, payload) => {
    try {
      await requestApi<{ id: string; updated: boolean }>(`/api/v1/coach/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update program.') })
      return
    }

    await get().fetchPrograms()
  },

  updateProgramDays: async (programId, builderDays) => {
    try {
      await requestApi<{ id: string; updated: boolean }>(`/api/v1/coach/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({ builderDays }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update program days.') })
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
    if (!clientIds.length) return

    try {
      await requestApi<{ assigned: number; programId: string }>('/api/v1/coach/programs/assign', {
        method: 'POST',
        body: JSON.stringify({ programId, clientIds }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to assign program.') })
      return
    }

    await get().fetchPrograms()
  },

  createForm: async (name) => {
    try {
      await requestApi<{ form: { id: string } }>('/api/v1/coach/forms', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to create form.') })
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
    try {
      await requestApi<{ deleted: boolean; id: string }>(`/api/v1/coach/forms/${formId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to delete form.') })
      return
    }

    await get().fetchForms()
  },

  updateFormStatus: async (formId, status) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/coach/forms/${formId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update form status.') })
      return
    }

    await get().fetchForms()
  },

  assignFormToClients: async (formId, clientIds, deadline) => {
    if (!clientIds.length) return

    try {
      const response = await requestApi<{
        assignmentIds: string[]
        notificationFailed?: boolean
        notificationError?: string
      }>(`/api/v1/coach/forms/${formId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          clientIds,
          deadline: deadline || null,
        }),
      })

      if (response.data.notificationFailed && response.data.notificationError) {
        set({ error: `Assignments created but notification failed: ${response.data.notificationError}` })
      }
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to assign form.') })
      return
    }

    await get().fetchForms()
  },

  addScheduleEvent: async (payload) => {
    try {
      await requestApi<{ id: string; created: boolean }>('/api/v1/coach/schedule-events', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to add schedule event.') })
      return
    }

    await get().fetchEvents()
  },

  logBroadcast: async (payload) => {
    try {
      await requestApi<{ logged: boolean }>('/api/v1/coach/broadcast/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to log broadcast.') })
      return
    }

    await get().fetchBroadcasts()
  },

  createOrGetDirectThread: async (clientId) => {
    if (!isSupabaseAuthEnabled()) return null

    try {
      const response = await requestApi<{ threadId: string }>('/api/v1/messages/direct-thread', {
        method: 'POST',
        body: JSON.stringify({ participantId: clientId }),
      })
      return String(response.data.threadId)
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to start conversation.') })
      return null
    }
  },
}))

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseAuthEnabled()) return null

  try {
    const response = await requestApi<{ id: string }>('/api/v1/auth/me')
    return String(response.data.id || '') || null
  } catch {
    return null
  }
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
