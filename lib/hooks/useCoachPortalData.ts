import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiRequestError, requestApi } from '@/lib/api/client'
import { createClient } from '@/lib/supabase/client'

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
  builderDays: CoachProgramDay[]
}

export interface CoachProgramExercise {
  id: string
  name: string
  sets: number
  reps: number
  imageUrl: string | null
}

export interface CoachProgramDay {
  id: string
  name: string
  exercises: CoachProgramExercise[]
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
  label: string
  time: string
  type: string
  color: string
  status: 'scheduled' | 'postponed' | 'completed' | 'cancelled'
  startAt: string
  endAt: string
  imageUrl?: string | null
  clientId?: string
}

export interface CoachBroadcastHistory {
  id: string
  target: string
  snippet: string
  sentAt: string
  delivered: number
  read: number
  status?: 'scheduled' | 'sent' | 'cancelled' | 'failed'
  scheduleId?: string | null
  scheduledFor?: string | null
}

export interface AddCoachClientResult {
  added: boolean
  reason?: string
  clientId?: string
  mode?: 'next-available' | 'manual'
  manualOverride?: boolean
}

const DEFAULT_PROGRAM_COVER =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&fit=crop'

type CoachDataResource = 'clients' | 'programs' | 'forms' | 'events' | 'broadcasts'

const COACH_DATA_CACHE_MS = 8_000

function useCoachPortalDataState() {
  const [coachId, setCoachId] = useState<string | null>(null)
  const [clients, setClients] = useState<CoachClientItem[]>([])
  const [programs, setPrograms] = useState<CoachProgramItem[]>([])
  const [forms, setForms] = useState<CoachFormItem[]>([])
  const [events, setEvents] = useState<CoachScheduleEvent[]>([])
  const [broadcasts, setBroadcasts] = useState<CoachBroadcastHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const realtimeTimersRef = useRef<Partial<Record<CoachDataResource, ReturnType<typeof setTimeout>>>>({})
  const inFlightRef = useRef<Partial<Record<CoachDataResource, Promise<void>>>>({})
  const lastFetchedAtRef = useRef<Partial<Record<CoachDataResource, number>>>({})

  const runResourceFetch = useCallback(
    async (
      resource: CoachDataResource,
      fetcher: () => Promise<void>,
      force = false,
    ) => {
      const lastFetchedAt = lastFetchedAtRef.current[resource] || 0
      if (!force && Date.now() - lastFetchedAt < COACH_DATA_CACHE_MS) {
        return
      }

      const inFlight = inFlightRef.current[resource]
      if (inFlight) {
        await inFlight
        return
      }

      const task = (async () => {
        try {
          await fetcher()
          lastFetchedAtRef.current[resource] = Date.now()
        } finally {
          delete inFlightRef.current[resource]
        }
      })()

      inFlightRef.current[resource] = task
      await task
    },
    [],
  )

  const fetchClients = useCallback(async (options?: { force?: boolean }) => {
    await runResourceFetch(
      'clients',
      async () => {
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

          const nextClients: CoachClientItem[] = (response.data.clients || []).map((row) => {
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

          setClients(nextClients)
          setError(null)
        } catch (caughtError) {
          setError(toErrorMessage(caughtError, 'Unable to fetch clients.'))
        }
      },
      options?.force === true,
    )
  }, [runResourceFetch])

  const fetchPrograms = useCallback(async (options?: { force?: boolean }) => {
    await runResourceFetch(
      'programs',
      async () => {
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

          const nextPrograms: CoachProgramItem[] = (response.data.programs || []).map((row) => ({
            id: String(row.id),
            name: String(row.name || 'Untitled Program'),
            enrolled: Number(row.enrolled || 0),
            difficulty: String(row.difficulty || 'Beginner'),
            length: String(row.length || '4 Weeks'),
            cover: String(row.cover || DEFAULT_PROGRAM_COVER),
            builderDays: parseBuilderDays(row.builderDays),
          }))

          setPrograms(nextPrograms)
          setError(null)
        } catch (caughtError) {
          setError(toErrorMessage(caughtError, 'Unable to fetch programs.'))
        }
      },
      options?.force === true,
    )
  }, [runResourceFetch])

  const fetchForms = useCallback(async (options?: { force?: boolean }) => {
    await runResourceFetch(
      'forms',
      async () => {
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

          const nextForms: CoachFormItem[] = (response.data.forms || []).map((row) => ({
            id: String(row.id),
            name: String(row.name || 'Untitled Form'),
            submissions: Number(row.submissions || 0),
            lastUpdated: formatDateLabel(String(row.updatedAt || new Date().toISOString())),
            status: normalizeFormStatus(row.status),
          }))

          setForms(nextForms)
          setError(null)
        } catch (caughtError) {
          setError(toErrorMessage(caughtError, 'Unable to fetch forms.'))
        }
      },
      options?.force === true,
    )
  }, [runResourceFetch])

  const fetchEvents = useCallback(async (options?: { force?: boolean }) => {
    await runResourceFetch(
      'events',
      async () => {
        try {
          const response = await requestApi<{
            events: Array<{
              id: string
              title: string | null
              label: string | null
              event_type: string | null
              start_at: string | null
              end_at: string | null
              status: string | null
              image_url: string | null
              client_id: string | null
            }>
          }>('/api/v1/coach/schedule-events')

          const nextEvents: CoachScheduleEvent[] = (response.data.events || []).map((row) => {
            const startAt = String(row.start_at || new Date().toISOString())
            const endAt = String(row.end_at || new Date().toISOString())

            return {
              id: String(row.id),
              title: String(row.title || 'Untitled Event'),
              label: String(row.label || ''),
              time: `${new Date(startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              type: String(row.event_type || '1-on-1'),
              color: eventColor(String(row.event_type || '1-on-1')),
              status: normalizeEventStatus(row.status),
              startAt,
              endAt,
              imageUrl: row.image_url ? String(row.image_url) : null,
              clientId: row.client_id ? String(row.client_id) : undefined,
            }
          })

          setEvents(nextEvents)
          setError(null)
        } catch (caughtError) {
          setError(toErrorMessage(caughtError, 'Unable to fetch events.'))
        }
      },
      options?.force === true,
    )
  }, [runResourceFetch])

  const fetchBroadcasts = useCallback(async (options?: { force?: boolean }) => {
    await runResourceFetch(
      'broadcasts',
      async () => {
        try {
          const response = await requestApi<{
            broadcasts: Array<{
              id: string
              audience_label: string | null
              message: string | null
              delivered_count: number | null
              read_count: number | null
              created_at: string | null
              status?: 'scheduled' | 'sent' | 'cancelled' | 'failed'
              schedule_id?: string | null
              scheduled_for?: string | null
            }>
          }>('/api/v1/coach/broadcast/history')

          const nextBroadcasts: CoachBroadcastHistory[] = (response.data.broadcasts || []).map((row) => ({
            id: String(row.id),
            target: String(row.audience_label || 'Audience'),
            snippet: String(row.message || ''),
            sentAt: formatDateLabel(String(row.created_at || new Date().toISOString())),
            delivered: Number(row.delivered_count || 0),
            read: Number(row.read_count || 0),
            status: row.status,
            scheduleId: row.schedule_id ?? null,
            scheduledFor: row.scheduled_for ?? null,
          }))

          setBroadcasts(nextBroadcasts)
          setError(null)
        } catch (caughtError) {
          setError(toErrorMessage(caughtError, 'Unable to fetch broadcast history.'))
        }
      },
      options?.force === true,
    )
  }, [runResourceFetch])

  const initialize = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const currentCoachId = await getAuthenticatedUserId()
    if (!currentCoachId) {
      setIsLoading(false)
      setError('Coach is not authenticated.')
      return
    }

    setCoachId(currentCoachId)

    const coachUnchanged = coachId === currentCoachId
    if (coachUnchanged) {
      const now = Date.now()
      const resources: CoachDataResource[] = ['clients', 'programs', 'forms', 'events', 'broadcasts']
      const allResourcesFresh = resources.every((resource) => {
        const lastFetchedAt = lastFetchedAtRef.current[resource] || 0
        return now - lastFetchedAt < COACH_DATA_CACHE_MS
      })

      if (allResourcesFresh) {
        setIsLoading(false)
        setError(null)
        return
      }
    }

    try {
      await Promise.all([
        fetchClients(),
        fetchPrograms(),
        fetchForms(),
        fetchEvents(),
        fetchBroadcasts(),
      ])
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to load coach portal data.'))
    } finally {
      setIsLoading(false)
    }
  }, [coachId, fetchBroadcasts, fetchClients, fetchEvents, fetchForms, fetchPrograms])

  const updateClientStatus = useCallback(async (linkId: string, status: CoachClientItem['status']) => {
    try {
      await requestApi<{ linkId: string; status: string }>(`/api/v1/coach/clients/${linkId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      await fetchClients({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to update client status.'))
    }
  }, [fetchClients])

  const addNextAvailableClient = useCallback(async () => {
    try {
      const response = await requestApi<{
        added: boolean
        reason?: string
        clientId?: string
        mode?: 'next-available' | 'manual'
        manualOverride?: boolean
      }>('/api/v1/coach/clients', {
        method: 'POST',
        body: JSON.stringify({ mode: 'next-available' }),
      })

      if (!response.data.added) {
        return {
          added: false,
          reason: response.data.reason,
        } as AddCoachClientResult
      }

      await fetchClients({ force: true })
      setError(null)

      return {
        added: true,
        clientId: response.data.clientId,
        mode: response.data.mode,
        manualOverride: response.data.manualOverride,
      } as AddCoachClientResult
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to add next available client.'))

      return {
        added: false,
        reason: 'REQUEST_FAILED',
      } as AddCoachClientResult
    }
  }, [fetchClients])

  const addProgram = useCallback(async (payload: {
    name: string
    difficulty: string
    length: string
    cover?: string
    builderDays?: CoachProgramDay[]
  }) => {
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

      await fetchPrograms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to add program.'))
    }
  }, [fetchPrograms])

  const updateProgram = useCallback(async (programId: string, payload: {
    name?: string
    difficulty?: string
    length?: string
    cover?: string
    builderDays?: CoachProgramDay[]
  }) => {
    try {
      await requestApi<{ id: string; updated: boolean }>(`/api/v1/coach/programs/${programId}?mode=in-place`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      await fetchPrograms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to update program.'))
    }
  }, [fetchPrograms])

  const updateProgramDays = useCallback(async (programId: string, builderDays: CoachProgramDay[]) => {
    try {
      await requestApi<{ id: string; updated: boolean }>(`/api/v1/coach/programs/${programId}?mode=in-place`, {
        method: 'PATCH',
        body: JSON.stringify({ builderDays }),
      })

      await fetchPrograms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to update program days.'))
    }
  }, [fetchPrograms])

  const duplicateProgram = useCallback(async (programId: string) => {
    const source = programs.find((program) => program.id === programId)
    if (!source) return

    await addProgram({
      name: `${source.name} Copy`,
      difficulty: source.difficulty,
      length: source.length,
      cover: source.cover,
      builderDays: source.builderDays,
    })
  }, [addProgram, programs])

  const deleteProgram = useCallback(async (programId: string) => {
    try {
      await requestApi<{ id: string; deleted: boolean }>(`/api/v1/coach/programs/${programId}`, {
        method: 'DELETE',
      })

      await fetchPrograms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to delete program.'))
    }
  }, [fetchPrograms])

  const assignProgram = useCallback(async (programId: string, clientIds: string[]) => {
    if (!clientIds.length) return

    try {
      await requestApi<{ assigned: number; programId: string }>('/api/v1/coach/programs/assign', {
        method: 'POST',
        body: JSON.stringify({ programId, clientIds }),
      })

      await fetchPrograms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to assign program.'))
    }
  }, [fetchPrograms])

  const createForm = useCallback(async (name: string) => {
    try {
      await requestApi<{ form: { id: string } }>('/api/v1/coach/forms', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })

      await fetchForms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to create form.'))
    }
  }, [fetchForms])

  const duplicateForm = useCallback(async (formId: string) => {
    const form = forms.find((entry) => entry.id === formId)
    if (!form) return

    await createForm(`${form.name} Copy`)
  }, [createForm, forms])

  const deleteForm = useCallback(async (formId: string) => {
    try {
      await requestApi<{ deleted: boolean; id: string }>(`/api/v1/coach/forms/${formId}`, {
        method: 'DELETE',
      })

      await fetchForms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to delete form.'))
    }
  }, [fetchForms])

  const updateFormStatus = useCallback(async (formId: string, status: CoachFormItem['status']) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/coach/forms/${formId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      await fetchForms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to update form status.'))
    }
  }, [fetchForms])

  const assignFormToClients = useCallback(async (formId: string, clientIds: string[], deadline?: string) => {
    if (!clientIds.length) return

    try {
      await requestApi<{ assignmentIds: string[] }>(`/api/v1/coach/forms/${formId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          clientIds,
          deadline: deadline || null,
        }),
      })

      await fetchForms({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to assign form.'))
    }
  }, [fetchForms])

  const addScheduleEvent = useCallback(async (payload: {
    title: string
    label?: string
    type: string
    startAt: string
    endAt: string
    status?: 'scheduled' | 'postponed' | 'completed' | 'cancelled'
    imageUrl?: string | null
    clientId?: string
  }) => {
    try {
      await requestApi<{ id: string; created: boolean }>('/api/v1/coach/schedule-events', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await fetchEvents({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to add schedule event.'))
    }
  }, [fetchEvents])

  const rescheduleEvent = useCallback(async (eventId: string, payload: { startAt: string; endAt: string }) => {
    try {
      await requestApi<{ id: string; updated: boolean }>('/api/v1/coach/schedule-events', {
        method: 'PATCH',
        body: JSON.stringify({
          eventId,
          startAt: payload.startAt,
          endAt: payload.endAt,
          status: 'scheduled',
        }),
      })

      await fetchEvents({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to reschedule event.'))
    }
  }, [fetchEvents])

  const updateScheduleEventStatus = useCallback(async (
    eventId: string,
    status: 'scheduled' | 'postponed' | 'completed' | 'cancelled',
  ) => {
    try {
      await requestApi<{ id: string; updated: boolean }>('/api/v1/coach/schedule-events', {
        method: 'PATCH',
        body: JSON.stringify({
          eventId,
          status,
        }),
      })

      await fetchEvents({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to update event status.'))
    }
  }, [fetchEvents])

  const deleteScheduleEvent = useCallback(async (eventId: string) => {
    try {
      await requestApi<{ id: string; deleted: boolean }>(`/api/v1/coach/schedule-events?eventId=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ eventId }),
      })

      await fetchEvents({ force: true })
      setError(null)
    } catch (caughtError) {
      if (caughtError instanceof ApiRequestError && caughtError.status === 404) {
        await fetchEvents({ force: true })
        setError(null)
        return
      }

      setError(toErrorMessage(caughtError, 'Unable to delete schedule event.'))
    }
  }, [fetchEvents])

  const logBroadcast = useCallback(async (payload: { target: string; message: string; delivered: number; read: number }) => {
    try {
      await requestApi<{ logged: boolean }>('/api/v1/coach/broadcast/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await fetchBroadcasts({ force: true })
      setError(null)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to log broadcast.'))
    }
  }, [fetchBroadcasts])

  const createOrGetDirectThread = useCallback(async (clientIdValue: string) => {
    try {
      const response = await requestApi<{ threadId: string }>('/api/v1/messages/direct-thread', {
        method: 'POST',
        body: JSON.stringify({ participantId: clientIdValue }),
      })
      return String(response.data.threadId)
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'Unable to start conversation.'))
      return null
    }
  }, [])

  useEffect(() => {
    if (!coachId) return

    const supabase = createClient()

    const scheduleRefresh = (resource: CoachDataResource, callback: () => void) => {
      const existingTimer = realtimeTimersRef.current[resource]
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      realtimeTimersRef.current[resource] = setTimeout(() => {
        callback()
        delete realtimeTimersRef.current[resource]
      }, 180)
    }

    const channel = supabase
      .channel(`coach-portal-live-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_client_links',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('clients', () => {
            void fetchClients({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_programs',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('programs', () => {
            void fetchPrograms({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_program_assignments',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('programs', () => {
            void fetchPrograms({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_forms',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('forms', () => {
            void fetchForms({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_form_assignments',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('forms', () => {
            void fetchForms({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_schedule_events',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('events', () => {
            void fetchEvents({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_broadcast_logs',
          filter: `coach_id=eq.${coachId}`,
        },
        () => {
          scheduleRefresh('broadcasts', () => {
            void fetchBroadcasts({ force: true })
          })
        },
      )
      .subscribe()

    return () => {
      const timers = Object.values(realtimeTimersRef.current).filter(Boolean) as Array<ReturnType<typeof setTimeout>>
      for (const timer of timers) {
        clearTimeout(timer)
      }
      realtimeTimersRef.current = {}
      channel.unsubscribe()
    }
  }, [coachId, fetchBroadcasts, fetchClients, fetchEvents, fetchForms, fetchPrograms])

  return useMemo(() => ({
    coachId,
    clients,
    programs,
    forms,
    events,
    broadcasts,
    isLoading,
    error,
    initialize,
    fetchClients,
    fetchPrograms,
    fetchForms,
    fetchEvents,
    fetchBroadcasts,
    updateClientStatus,
    addNextAvailableClient,
    addProgram,
    updateProgram,
    updateProgramDays,
    duplicateProgram,
    deleteProgram,
    assignProgram,
    createForm,
    duplicateForm,
    deleteForm,
    updateFormStatus,
    assignFormToClients,
    addScheduleEvent,
    rescheduleEvent,
    updateScheduleEventStatus,
    deleteScheduleEvent,
    logBroadcast,
    createOrGetDirectThread,
  }), [
    coachId,
    clients,
    programs,
    forms,
    events,
    broadcasts,
    isLoading,
    error,
    initialize,
    fetchClients,
    fetchPrograms,
    fetchForms,
    fetchEvents,
    fetchBroadcasts,
    updateClientStatus,
    addNextAvailableClient,
    addProgram,
    updateProgram,
    updateProgramDays,
    duplicateProgram,
    deleteProgram,
    assignProgram,
    createForm,
    duplicateForm,
    deleteForm,
    updateFormStatus,
    assignFormToClients,
    addScheduleEvent,
    rescheduleEvent,
    updateScheduleEventStatus,
    deleteScheduleEvent,
    logBroadcast,
    createOrGetDirectThread,
  ])
}

type CoachPortalDataContextValue = ReturnType<typeof useCoachPortalDataState>

const CoachPortalDataContext = createContext<CoachPortalDataContextValue | null>(null)

export function CoachPortalDataProvider({ children }: { children: ReactNode }) {
  const value = useCoachPortalDataState()
  const { initialize } = value

  useEffect(() => {
    void initialize()
  }, [initialize])

  return createElement(CoachPortalDataContext.Provider, { value }, children)
}

export function useCoachPortalData() {
  const value = useContext(CoachPortalDataContext)
  if (!value) {
    throw new Error('useCoachPortalData must be used inside CoachPortalDataProvider.')
  }
  return value
}

async function getAuthenticatedUserId(): Promise<string | null> {
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

function parseBuilderDays(value: unknown): CoachProgramDay[] {
  if (!Array.isArray(value)) return []

  return value.map((entry, index) => {
    const day = toObject(entry)
    const exercisesValue = day.exercises

    return {
      id: String(day.id || `d_${index + 1}`),
      name: String(day.name || `Day ${index + 1}`),
      exercises: Array.isArray(exercisesValue)
        ? exercisesValue.map((exercise, exerciseIndex) => {
          if (typeof exercise === 'string') {
            return {
              id: `ex_${index + 1}_${exerciseIndex + 1}`,
              name: exercise,
              sets: 3,
              reps: 10,
              imageUrl: null,
            }
          }

          const exerciseObject = toObject(exercise)
          return {
            id: String(exerciseObject.id || `ex_${index + 1}_${exerciseIndex + 1}`),
            name: String(exerciseObject.name || ''),
            sets: normalizeSetsOrReps(exerciseObject.sets, 3),
            reps: normalizeSetsOrReps(exerciseObject.reps, 10),
            imageUrl: normalizeOptionalUrl(exerciseObject.imageUrl),
          }
        })
        : [],
    }
  })
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
  if (status === 'postponed') return 'postponed'
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
