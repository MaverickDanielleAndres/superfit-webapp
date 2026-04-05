import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canUsersDirectMessage } from '@/lib/social'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface ProfileRoleRow {
  id: string | null
  role: string | null
}

interface ThreadMembershipRow {
  thread_id: string | null
  user_id?: string | null
}

interface ThreadSummaryRow {
  id: string | null
  is_group: boolean | null
}

const DirectThreadSchema = z.object({
  participantId: z.string().uuid(),
})

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient
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

  const parsed = DirectThreadSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid direct-thread payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  if (parsed.data.participantId === user.id) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'You cannot create a direct thread with yourself.',
      requestId,
      retriable: false,
    })
  }

  const rolesByUserId = await getProfileRolesByUserId(db, [user.id, parsed.data.participantId])
  if (!rolesByUserId.has(parsed.data.participantId)) {
    return problemResponse({
      status: 404,
      code: 'PARTICIPANT_NOT_FOUND',
      title: 'Participant Not Found',
      detail: 'The selected participant does not exist.',
      requestId,
      retriable: false,
    })
  }

  const requesterIsCoach = rolesByUserId.get(user.id) === 'coach'
  const participantIsCoach = rolesByUserId.get(parsed.data.participantId) === 'coach'
  const isAllowed = await canUsersDirectMessage(db, user.id, parsed.data.participantId)

  if (!isAllowed) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail:
        requesterIsCoach || participantIsCoach
          ? 'Direct messaging requires an active coach-client link, accepted friendship, or follow relationship.'
          : 'Direct messaging requires an accepted friendship, follow relationship, or active coaching link.',
      requestId,
      retriable: false,
    })
  }

  const existingThreadId = await findDirectThreadId(db, user.id, parsed.data.participantId)
  if (existingThreadId) {
    return dataResponse({
      requestId,
      data: {
        threadId: existingThreadId,
      },
    })
  }

  const { data: threadData, error: threadError } = await db
    .from('message_threads')
    .insert({
      created_by: user.id,
      is_group: false,
    })
    .select('id')
    .single()

  if (threadError || !threadData?.id) {
    return problemResponse({
      status: 500,
      code: 'DIRECT_THREAD_CREATE_FAILED',
      title: 'Direct Thread Create Failed',
      detail: threadError?.message || 'Unable to start conversation.',
      requestId,
    })
  }

  const { error: participantsError } = await db
    .from('message_thread_participants')
    .insert([
      { thread_id: threadData.id, user_id: user.id },
      { thread_id: threadData.id, user_id: parsed.data.participantId },
    ])

  if (participantsError) {
    return problemResponse({
      status: 500,
      code: 'DIRECT_THREAD_CREATE_FAILED',
      title: 'Direct Thread Create Failed',
      detail: participantsError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      threadId: String(threadData.id),
    },
  })
}

async function getProfileRolesByUserId(supabase: SupabaseServerClient, userIds: string[]): Promise<Map<string, string>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (!uniqueUserIds.length) return new Map<string, string>()

  const { data, error } = await supabase
    .from('profiles')
    .select('id,role')
    .in('id', uniqueUserIds)

  if (error) return new Map<string, string>()

  const rows = Array.isArray(data) ? (data as ProfileRoleRow[]) : []
  const roleMap = new Map<string, string>()
  for (const row of rows) {
    const id = String(row.id || '')
    if (!id) continue
    roleMap.set(id, String(row.role || '').trim().toLowerCase())
  }

  return roleMap
}

async function findDirectThreadId(
  supabase: SupabaseServerClient,
  currentUserId: string,
  participantId: string,
): Promise<string | null> {
  const { data: memberships, error: membershipError } = await supabase
    .from('message_thread_participants')
    .select('thread_id')
    .eq('user_id', currentUserId)

  if (membershipError) return null

  const membershipRows = Array.isArray(memberships) ? (memberships as ThreadMembershipRow[]) : []
  const candidateThreadIds = membershipRows
    .map((row) => String(row.thread_id || ''))
    .filter(Boolean)

  if (!candidateThreadIds.length) return null

  const { data: threadRows, error: threadError } = await supabase
    .from('message_threads')
    .select('id,is_group')
    .in('id', candidateThreadIds)

  if (threadError) return null

  const allThreadRows = Array.isArray(threadRows) ? (threadRows as ThreadSummaryRow[]) : []
  const directThreadIds = allThreadRows
    .filter((row) => row?.is_group === false)
    .map((row) => String(row.id || ''))
    .filter(Boolean)

  if (!directThreadIds.length) return null

  const { data: participants, error: participantsError } = await supabase
    .from('message_thread_participants')
    .select('thread_id,user_id')
    .in('thread_id', directThreadIds)

  if (participantsError) return null

  const participantsByThread = new Map<string, string[]>()
  const participantRows = Array.isArray(participants) ? (participants as ThreadMembershipRow[]) : []
  for (const row of participantRows) {
    const threadId = String(row.thread_id || '')
    const userId = String(row.user_id || '')
    const existing = participantsByThread.get(threadId) || []
    participantsByThread.set(threadId, [...existing, userId])
  }

  const match = directThreadIds.find((threadId: string) => {
    const users = participantsByThread.get(threadId) || []
    return users.length === 2 && users.includes(currentUserId) && users.includes(participantId)
  })

  return match || null
}
