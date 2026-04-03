import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const DirectThreadSchema = z.object({
  participantId: z.string().uuid(),
})

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin
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

  const existingThreadId = await findDirectThreadId(db as any, user.id, parsed.data.participantId)
  if (existingThreadId) {
    return dataResponse({
      requestId,
      data: {
        threadId: existingThreadId,
      },
    })
  }

  const { data: threadData, error: threadError } = await (db as any)
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

  const { error: participantsError } = await (db as any)
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

async function findDirectThreadId(supabase: any, currentUserId: string, participantId: string): Promise<string | null> {
  const { data: memberships, error: membershipError } = await supabase
    .from('message_thread_participants')
    .select('thread_id')
    .eq('user_id', currentUserId)

  if (membershipError) return null

  const candidateThreadIds = (memberships || [])
    .map((row: any) => String(row.thread_id || ''))
    .filter(Boolean)

  if (!candidateThreadIds.length) return null

  const { data: threadRows, error: threadError } = await supabase
    .from('message_threads')
    .select('id,is_group')
    .in('id', candidateThreadIds)

  if (threadError) return null

  const directThreadIds = (threadRows || [])
    .filter((row: any) => row?.is_group === false)
    .map((row: any) => String(row.id || ''))
    .filter(Boolean)

  if (!directThreadIds.length) return null

  const { data: participants, error: participantsError } = await supabase
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
    return users.length === 2 && users.includes(currentUserId) && users.includes(participantId)
  })

  return match || null
}
