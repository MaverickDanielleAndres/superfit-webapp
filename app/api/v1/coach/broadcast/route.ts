import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type AudienceKey = 'all_active' | 'onboarding' | 'weight_loss' | 'muscle_gain'

const BroadcastSchema = z.object({
  target: z.enum(['all_active', 'onboarding', 'weight_loss', 'muscle_gain']),
  message: z.string().min(1).max(1000),
})

interface Recipient {
  id: string
  name: string
  goal: string | null
  onboardingComplete: boolean
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

  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,goal,onboarding_complete,role')
    .neq('id', user.id)
    .order('full_name', { ascending: true })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'BROADCAST_RECIPIENTS_FETCH_FAILED',
      title: 'Broadcast Recipients Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const recipients: Recipient[] = (data || [])
    .filter((profile: any) => profile.role !== 'coach' && profile.role !== 'admin')
    .map((profile: any) => ({
      id: String(profile.id || ''),
      name: String(profile.full_name || 'Client'),
      goal: profile.goal ? String(profile.goal) : null,
      onboardingComplete: Boolean(profile.onboarding_complete),
    }))
    .filter((recipient) => !!recipient.id)

  return dataResponse({
    requestId,
    data: {
      recipients,
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

  const { data: profiles, error: recipientsError } = await supabase
    .from('profiles')
    .select('id,full_name,goal,onboarding_complete,role')
    .neq('id', user.id)

  if (recipientsError) {
    return problemResponse({
      status: 500,
      code: 'BROADCAST_RECIPIENTS_FETCH_FAILED',
      title: 'Broadcast Recipients Fetch Failed',
      detail: recipientsError.message,
      requestId,
    })
  }

  const recipients: Recipient[] = (profiles || [])
    .filter((profile: any) => profile.role !== 'coach' && profile.role !== 'admin')
    .map((profile: any) => ({
      id: String(profile.id || ''),
      name: String(profile.full_name || 'Client'),
      goal: profile.goal ? String(profile.goal) : null,
      onboardingComplete: Boolean(profile.onboarding_complete),
    }))
    .filter((recipient) => !!recipient.id)

  const targetedRecipients = filterRecipientsByTarget(recipients, parsed.data.target)
  const recipientIds = targetedRecipients.map((recipient) => recipient.id)
  const audienceLabel = audienceLabelFor(parsed.data.target)

  const threadByRecipient = await getDirectThreadsByRecipient(supabase as any, user.id, recipientIds)

  for (const recipientId of recipientIds) {
    if (threadByRecipient.has(recipientId)) continue

    const { data: createdThread, error: threadError } = await (supabase as any)
      .from('message_threads')
      .insert({
        created_by: user.id,
        is_group: false,
        group_name: null,
        group_avatar: null,
      })
      .select('id')
      .single()

    if (threadError || !createdThread?.id) {
      return problemResponse({
        status: 500,
        code: 'BROADCAST_SEND_FAILED',
        title: 'Broadcast Send Failed',
        detail: threadError?.message || 'Unable to create direct message thread.',
        requestId,
      })
    }

    const { error: participantError } = await (supabase as any)
      .from('message_thread_participants')
      .insert([
        { thread_id: createdThread.id, user_id: user.id },
        { thread_id: createdThread.id, user_id: recipientId },
      ])

    if (participantError) {
      return problemResponse({
        status: 500,
        code: 'BROADCAST_SEND_FAILED',
        title: 'Broadcast Send Failed',
        detail: participantError.message || 'Unable to add participants to thread.',
        requestId,
      })
    }

    threadByRecipient.set(recipientId, String(createdThread.id))
  }

  const messageRows = recipientIds
    .map((recipientId) => threadByRecipient.get(recipientId))
    .filter((threadId): threadId is string => Boolean(threadId))
    .map((threadId) => ({
      thread_id: threadId,
      sender_id: user.id,
      text: parsed.data.message,
      status: 'delivered',
      attachments: [{ kind: 'broadcast', audience: audienceLabel }],
    }))

  if (messageRows.length) {
    const { error: messageError } = await (supabase as any).from('messages').insert(messageRows)

    if (messageError) {
      return problemResponse({
        status: 500,
        code: 'BROADCAST_SEND_FAILED',
        title: 'Broadcast Send Failed',
        detail: messageError.message || 'Unable to persist broadcast messages.',
        requestId,
      })
    }

    await (supabase as any)
      .from('message_threads')
      .update({ updated_at: new Date().toISOString() })
      .in('id', Array.from(new Set(messageRows.map((row) => row.thread_id))))
  }

  const { error: logError } = await (supabase as any).from('coach_broadcast_logs').insert({
    coach_id: user.id,
    audience_label: audienceLabel,
    message: parsed.data.message,
    delivered_count: messageRows.length,
    read_count: 0,
  })

  if (logError) {
    return problemResponse({
      status: 500,
      code: 'BROADCAST_LOG_FAILED',
      title: 'Broadcast Log Failed',
      detail: logError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      delivered: messageRows.length,
      read: 0,
      target: audienceLabel,
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

async function getDirectThreadsByRecipient(
  supabase: any,
  coachId: string,
  recipientIds: string[],
): Promise<Map<string, string>> {
  const threadByRecipient = new Map<string, string>()
  if (!recipientIds.length) return threadByRecipient

  const { data: membershipRows, error: membershipError } = await supabase
    .from('message_thread_participants')
    .select('thread_id,thread:message_threads(id,is_group)')
    .eq('user_id', coachId)

  if (membershipError) return threadByRecipient

  const directThreadIds = (membershipRows || [])
    .filter((row: any) => !row.thread?.is_group)
    .map((row: any) => String(row.thread_id || ''))
    .filter(Boolean)

  if (!directThreadIds.length) return threadByRecipient

  const { data: participantRows, error: participantError } = await supabase
    .from('message_thread_participants')
    .select('thread_id,user_id')
    .in('thread_id', directThreadIds)

  if (participantError) return threadByRecipient

  const participantsByThread = new Map<string, string[]>()
  for (const row of participantRows || []) {
    const threadId = String(row.thread_id || '')
    const userId = String(row.user_id || '')
    if (!threadId || !userId) continue

    const existing = participantsByThread.get(threadId) || []
    participantsByThread.set(threadId, [...existing, userId])
  }

  for (const recipientId of recipientIds) {
    const matchingThread = directThreadIds.find((threadId: string) => {
      const participants = participantsByThread.get(threadId) || []
      return participants.length === 2 && participants.includes(coachId) && participants.includes(recipientId)
    })

    if (matchingThread) threadByRecipient.set(recipientId, matchingThread)
  }

  return threadByRecipient
}
