import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type AudienceKey = 'all_active' | 'onboarding' | 'weight_loss' | 'muscle_gain'
type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const BroadcastSchema = z.object({
  target: z.enum(['all_active', 'onboarding', 'weight_loss', 'muscle_gain']),
  message: z.string().min(1).max(1000),
  mediaUrl: z.string().url().optional().nullable(),
  scheduleAt: z.string().datetime().optional().nullable(),
})

const BroadcastActionSchema = z
  .object({
    action: z.enum(['dispatch_due', 'send_now', 'cancel']),
    scheduleId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.action === 'send_now' || value.action === 'cancel') && !value.scheduleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduleId'],
        message: 'scheduleId is required for this action.',
      })
    }
  })

interface Recipient {
  id: string
  name: string
  goal: string | null
  onboardingComplete: boolean
}

interface ProfileRecipientRow {
  id: string | null
  full_name: string | null
  goal: string | null
  onboarding_complete: boolean | null
  role: string | null
  account_status: string | null
}

interface CoachClientLinkRow {
  client_id: string | null
  status: string | null
  goal_name: string | null
}

interface ThreadMembershipRow {
  thread_id: string | null
  thread: {
    id: string | null
    is_group: boolean | null
  } | null
}

interface ParticipantMembershipRow {
  thread_id: string | null
  user_id: string | null
}

interface ScheduledBroadcastRow {
  id: string | null
  target_key: string | null
  audience_label: string | null
  message: string | null
  media_url: string | null
  scheduled_for: string | null
  status: string | null
}

interface BroadcastDispatchPayload {
  target: AudienceKey
  message: string
  mediaUrl?: string | null
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

  const recipientsResult = await getRecipientsForTarget(db, user.id, 'all_active', true)
  if (!recipientsResult.ok) {
    return problemResponse({
      status: 500,
      code: 'BROADCAST_RECIPIENTS_FETCH_FAILED',
      title: 'Broadcast Recipients Fetch Failed',
      detail: recipientsResult.error,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      recipients: recipientsResult.recipients,
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

  const parsed = BroadcastSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid broadcast payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const db = supabase as SupabaseServerClient

  const scheduleAtIso = parsed.data.scheduleAt ? new Date(parsed.data.scheduleAt) : null
  const shouldSchedule = Boolean(scheduleAtIso && scheduleAtIso.getTime() > Date.now())

  if (shouldSchedule) {
    const dynamicDb = db as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: (columns: string) => {
            single: () => Promise<{ data: { id: string | null } | null; error: { message: string } | null }>
          }
        }
      }
    }

    const scheduleResult = await dynamicDb
      .from('coach_broadcast_schedules')
      .insert({
        coach_id: user.id,
        target_key: parsed.data.target,
        audience_label: audienceLabelFor(parsed.data.target),
        message: parsed.data.message,
        media_url: parsed.data.mediaUrl || null,
        scheduled_for: scheduleAtIso?.toISOString() || null,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (scheduleResult.error || !scheduleResult.data?.id) {
      return problemResponse({
        status: 500,
        code: 'BROADCAST_SCHEDULE_FAILED',
        title: 'Broadcast Schedule Failed',
        detail: scheduleResult.error?.message || 'Unable to schedule broadcast.',
        requestId,
      })
    }

    return dataResponse({
      requestId,
      status: 201,
      data: {
        scheduled: true,
        scheduleId: String(scheduleResult.data.id),
        target: audienceLabelFor(parsed.data.target),
        scheduleAt: scheduleAtIso?.toISOString() || null,
      },
    })
  }

  const dispatchResult = await dispatchBroadcastNow(db, user.id, {
    target: parsed.data.target,
    message: parsed.data.message,
    mediaUrl: parsed.data.mediaUrl || null,
  })

  if (!dispatchResult.ok) {
    return problemResponse({
      status: 500,
      code: 'BROADCAST_SEND_FAILED',
      title: 'Broadcast Send Failed',
      detail: dispatchResult.error,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      delivered: dispatchResult.delivered,
      read: 0,
      target: dispatchResult.audienceLabel,
      logId: dispatchResult.logId,
      scheduled: false,
    },
  })
}

export async function PATCH(request: Request) {
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

  const parsed = BroadcastActionSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid broadcast action payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  if (parsed.data.action === 'dispatch_due') {
    const processed = await dispatchDueBroadcasts(db, user.id, parsed.data.limit || 20)

    return dataResponse({
      requestId,
      data: {
        processed: processed.total,
        sent: processed.sent,
        failed: processed.failed,
      },
    })
  }

  const scheduleId = String(parsed.data.scheduleId || '')
  const scheduledRowResult = await getScheduledBroadcastById(db, user.id, scheduleId)
  if (!scheduledRowResult.ok) {
    return problemResponse({
      status: scheduledRowResult.notFound ? 404 : 500,
      code: scheduledRowResult.notFound ? 'BROADCAST_SCHEDULE_NOT_FOUND' : 'BROADCAST_SCHEDULE_ACTION_FAILED',
      title: scheduledRowResult.notFound ? 'Scheduled Broadcast Not Found' : 'Scheduled Broadcast Action Failed',
      detail: scheduledRowResult.error,
      requestId,
      retriable: false,
    })
  }

  const scheduledRow = scheduledRowResult.row

  if (parsed.data.action === 'cancel') {
    const cancelResult = await updateScheduledBroadcast(db, scheduleId, {
      status: 'cancelled',
      sent_at: null,
      last_error: null,
    })

    if (!cancelResult.ok) {
      return problemResponse({
        status: 500,
        code: 'BROADCAST_SCHEDULE_ACTION_FAILED',
        title: 'Scheduled Broadcast Action Failed',
        detail: cancelResult.error,
        requestId,
      })
    }

    return dataResponse({
      requestId,
      data: {
        cancelled: true,
        scheduleId,
      },
    })
  }

  if (scheduledRow.status !== 'scheduled') {
    return dataResponse({
      requestId,
      data: {
        sent: false,
        scheduleId,
        detail: `Schedule already ${scheduledRow.status || 'processed'}.`,
      },
    })
  }

  const sendResult = await dispatchBroadcastNow(db, user.id, {
    target: normalizeTargetKey(scheduledRow.target_key),
    message: String(scheduledRow.message || ''),
    mediaUrl: scheduledRow.media_url || null,
  })

  if (!sendResult.ok) {
    await updateScheduledBroadcast(db, scheduleId, {
      status: 'failed',
      last_error: sendResult.error,
    })

    return problemResponse({
      status: 500,
      code: 'BROADCAST_SCHEDULE_ACTION_FAILED',
      title: 'Scheduled Broadcast Action Failed',
      detail: sendResult.error,
      requestId,
    })
  }

  await updateScheduledBroadcast(db, scheduleId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
    delivered_count: sendResult.delivered,
    read_count: 0,
    last_error: null,
  })

  return dataResponse({
    requestId,
    data: {
      sent: true,
      scheduleId,
      delivered: sendResult.delivered,
      logId: sendResult.logId,
    },
  })
}

function filterRecipientsByTarget(recipients: Recipient[], target: AudienceKey): Recipient[] {
  if (target === 'onboarding') return recipients.filter((recipient) => !recipient.onboardingComplete)
  if (target === 'weight_loss') return recipients.filter((recipient) => recipient.goal === 'weight_loss')
  if (target === 'muscle_gain') return recipients.filter((recipient) => recipient.goal === 'muscle_gain')
  return recipients.filter((recipient) => recipient.onboardingComplete)
}

function audienceLabelFor(target: AudienceKey): string {
  if (target === 'onboarding') return 'Onboarding Clients'
  if (target === 'weight_loss') return 'Weight Loss Goal'
  if (target === 'muscle_gain') return 'Muscle Gain Goal'
  return 'All Active Clients'
}

async function getRecipientsForTarget(
  db: SupabaseServerClient,
  coachId: string,
  target: AudienceKey,
  skipFilter = false,
): Promise<{ ok: true; recipients: Recipient[] } | { ok: false; error: string }> {
  const { data: rawLinks, error: linkError } = await db
    .from('coach_client_links')
    .select('client_id,status,goal_name')
    .eq('coach_id', coachId)

  if (linkError) return { ok: false, error: linkError.message }

  const links = Array.isArray(rawLinks) ? (rawLinks as CoachClientLinkRow[]) : []
  const eligibleLinks = links.filter((link) => {
    const status = String(link.status || '').toLowerCase()
    return status === 'active' || status === 'onboarding'
  })

  const clientIds = Array.from(new Set(eligibleLinks.map((link) => String(link.client_id || '')).filter(Boolean)))
  if (!clientIds.length) return { ok: true, recipients: [] }

  const { data: rawProfiles, error: profileError } = await db
    .from('profiles')
    .select('id,full_name,goal,onboarding_complete,role,account_status')
    .in('id', clientIds)

  if (profileError) return { ok: false, error: profileError.message }

  const linkByClientId = new Map<string, CoachClientLinkRow>()
  for (const link of eligibleLinks) {
    const clientId = String(link.client_id || '')
    if (!clientId) continue
    linkByClientId.set(clientId, link)
  }

  const profiles = Array.isArray(rawProfiles) ? (rawProfiles as ProfileRecipientRow[]) : []
  const recipients = profiles
    .filter((profile) => profile.role !== 'coach' && profile.role !== 'admin')
    .filter((profile) => String(profile.account_status || 'active').toLowerCase() === 'active')
    .map((profile) => {
      const id = String(profile.id || '')
      const link = linkByClientId.get(id)
      const linkStatus = String(link?.status || '').toLowerCase()

      return {
        id,
        name: String(profile.full_name || 'Client'),
        goal: profile.goal ? String(profile.goal) : link?.goal_name ? String(link.goal_name) : null,
        onboardingComplete: linkStatus === 'onboarding' ? false : Boolean(profile.onboarding_complete),
      }
    })
    .filter((recipient) => !!recipient.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    ok: true,
    recipients: skipFilter ? recipients : filterRecipientsByTarget(recipients, target),
  }
}

function normalizeTargetKey(value: string | null): AudienceKey {
  if (value === 'onboarding' || value === 'weight_loss' || value === 'muscle_gain') return value
  return 'all_active'
}

async function dispatchBroadcastNow(
  db: SupabaseServerClient,
  coachId: string,
  payload: BroadcastDispatchPayload,
): Promise<{ ok: true; delivered: number; audienceLabel: string; logId: string } | { ok: false; error: string }> {
  const recipientsResult = await getRecipientsForTarget(db, coachId, payload.target)
  if (!recipientsResult.ok) return recipientsResult

  const targetedRecipients = recipientsResult.recipients
  const recipientIds = targetedRecipients.map((recipient) => recipient.id)
  const audienceLabel = audienceLabelFor(payload.target)

  const { data: logRow, error: logCreateError } = await db
    .from('coach_broadcast_logs')
    .insert({
      coach_id: coachId,
      audience_label: audienceLabel,
      message: payload.message,
      delivered_count: 0,
      read_count: 0,
    })
    .select('id')
    .single()

  const broadcastLogId = String(logRow?.id || '')
  if (logCreateError || !broadcastLogId) {
    return { ok: false, error: logCreateError?.message || 'Unable to create broadcast log.' }
  }

  if (!recipientIds.length) {
    return { ok: true, delivered: 0, audienceLabel, logId: broadcastLogId }
  }

  const threadByRecipient = await getDirectThreadsByRecipient(db, coachId, recipientIds)

  for (const recipientId of recipientIds) {
    if (threadByRecipient.has(recipientId)) continue

    const createdThreadId = crypto.randomUUID()

    const { error: threadError } = await db
      .from('message_threads')
      .insert({
        id: createdThreadId,
        created_by: coachId,
        is_group: false,
        group_name: null,
        group_avatar: null,
      })

    if (threadError) {
      return { ok: false, error: threadError?.message || 'Unable to create direct message thread.' }
    }

    const { error: participantError } = await db
      .from('message_thread_participants')
      .insert([
        { thread_id: createdThreadId, user_id: coachId },
        { thread_id: createdThreadId, user_id: recipientId },
      ])

    if (participantError) {
      return { ok: false, error: participantError.message || 'Unable to add participants to thread.' }
    }

    threadByRecipient.set(recipientId, createdThreadId)
  }

  const messageRows = recipientIds
    .map((recipientId) => threadByRecipient.get(recipientId))
    .filter((threadId): threadId is string => Boolean(threadId))
    .map((threadId) => ({
      thread_id: threadId,
      sender_id: coachId,
      text: payload.message,
      status: 'delivered',
      attachments: [
        {
          kind: 'broadcast',
          audience: audienceLabel,
          mediaUrl: payload.mediaUrl || null,
          broadcastLogId,
        },
      ],
    }))

  if (messageRows.length) {
    const { error: messageError } = await db.from('messages').insert(messageRows)
    if (messageError) {
      return { ok: false, error: messageError.message || 'Unable to persist broadcast messages.' }
    }

    await db
      .from('message_threads')
      .update({ updated_at: new Date().toISOString() })
      .in('id', Array.from(new Set(messageRows.map((row) => row.thread_id))))
  }

  const deliveredCount = messageRows.length

  if (deliveredCount > 0) {
    const nowIso = new Date().toISOString()
    const notificationRows = recipientIds.map((recipientId) => ({
      recipient_id: recipientId,
      actor_id: coachId,
      type: 'coach_broadcast',
      title: 'New announcement from your coach',
      body: payload.message.slice(0, 280),
      action_url: '/coaching',
      payload: {
        audience: audienceLabel,
        broadcastLogId,
        mediaUrl: payload.mediaUrl || null,
      },
      delivered_at: nowIso,
    }))

    const { error: notificationError } = await db.from('notifications').insert(notificationRows)
    if (notificationError) {
      // Broadcast delivery should not fail if notification fan-out fails.
      console.error('[coach/broadcast] notifications insert failed', notificationError.message)
    }
  }

  await db
    .from('coach_broadcast_logs')
    .update({ delivered_count: deliveredCount })
    .eq('id', broadcastLogId)
    .eq('coach_id', coachId)

  return { ok: true, delivered: deliveredCount, audienceLabel, logId: broadcastLogId }
}

async function dispatchDueBroadcasts(db: SupabaseServerClient, coachId: string, limit: number): Promise<{ total: number; sent: number; failed: number }> {
  const dynamicDb = db as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            lte: (column: string, value: string) => {
              order: (column: string, options: { ascending: boolean }) => {
                limit: (value: number) => Promise<{ data: ScheduledBroadcastRow[] | null; error: { message: string } | null }>
              }
            }
          }
          lte: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => {
              limit: (value: number) => Promise<{ data: ScheduledBroadcastRow[] | null; error: { message: string } | null }>
            }
          }
        }
      }
    }
  }

  const { data, error } = await dynamicDb
    .from('coach_broadcast_schedules')
    .select('id,target_key,audience_label,message,media_url,scheduled_for,status')
    .eq('coach_id', coachId)
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(limit)

  if (error || !Array.isArray(data)) {
    return { total: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const row of data) {
    const scheduleId = String(row.id || '')
    if (!scheduleId) continue

    const dispatchResult = await dispatchBroadcastNow(db, coachId, {
      target: normalizeTargetKey(row.target_key),
      message: String(row.message || ''),
      mediaUrl: row.media_url || null,
    })

    if (!dispatchResult.ok) {
      failed += 1
      await updateScheduledBroadcast(db, scheduleId, {
        status: 'failed',
        last_error: dispatchResult.error,
      })
      continue
    }

    sent += 1
    await updateScheduledBroadcast(db, scheduleId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      delivered_count: dispatchResult.delivered,
      read_count: 0,
      last_error: null,
    })
  }

  return { total: data.length, sent, failed }
}

async function getScheduledBroadcastById(
  db: SupabaseServerClient,
  coachId: string,
  scheduleId: string,
): Promise<{ ok: true; row: ScheduledBroadcastRow } | { ok: false; error: string; notFound?: boolean }> {
  const dynamicDb = db as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: ScheduledBroadcastRow | null; error: { message: string } | null }>
          }
        }
      }
    }
  }

  const { data, error } = await dynamicDb
    .from('coach_broadcast_schedules')
    .select('id,target_key,audience_label,message,media_url,scheduled_for,status')
    .eq('id', scheduleId)
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'Scheduled broadcast not found.', notFound: true }

  return { ok: true, row: data }
}

async function updateScheduledBroadcast(
  db: SupabaseServerClient,
  scheduleId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const dynamicDb = db as unknown as {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }

  const { error } = await dynamicDb
    .from('coach_broadcast_schedules')
    .update(payload)
    .eq('id', scheduleId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function getDirectThreadsByRecipient(
  supabase: SupabaseServerClient,
  coachId: string,
  recipientIds: string[],
): Promise<Map<string, string>> {
  const threadByRecipient = new Map<string, string>()
  if (!recipientIds.length) return threadByRecipient

  const { data: rawMembershipRows, error: membershipError } = await supabase
    .from('message_thread_participants')
    .select('thread_id,thread:message_threads(id,is_group)')
    .eq('user_id', coachId)

  if (membershipError) return threadByRecipient

  const membershipRows = Array.isArray(rawMembershipRows) ? (rawMembershipRows as ThreadMembershipRow[]) : []

  const directThreadIds = membershipRows
    .filter((row) => !row.thread?.is_group)
    .map((row) => String(row.thread_id || ''))
    .filter(Boolean)

  if (!directThreadIds.length) return threadByRecipient

  const { data: rawParticipantRows, error: participantError } = await supabase
    .from('message_thread_participants')
    .select('thread_id,user_id')
    .in('thread_id', directThreadIds)

  if (participantError) return threadByRecipient

  const participantRows = Array.isArray(rawParticipantRows)
    ? (rawParticipantRows as ParticipantMembershipRow[])
    : []

  const participantsByThread = new Map<string, string[]>()
  for (const row of participantRows) {
    const threadId = String(row.thread_id || '')
    const userId = String(row.user_id || '')
    if (!threadId || !userId) continue

    const existing = participantsByThread.get(threadId) || []
    participantsByThread.set(threadId, [...existing, userId])
  }

  for (const recipientId of recipientIds) {
    const matchingThread = directThreadIds.find((threadId) => {
      const participants = participantsByThread.get(threadId) || []
      return participants.length === 2 && participants.includes(coachId) && participants.includes(recipientId)
    })

    if (matchingThread) threadByRecipient.set(recipientId, matchingThread)
  }

  return threadByRecipient
}
