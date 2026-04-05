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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ThreadCreateSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
  isGroup: z.boolean().optional().default(false),
  groupName: z.string().max(120).optional().nullable(),
  groupAvatar: z.string().url().optional().nullable(),
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

  const parsed = ThreadCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid thread payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const participantIds = Array.from(
    new Set(
      [user.id, ...parsed.data.participantIds]
        .filter((participantId) => UUID_REGEX.test(participantId))
        .filter(Boolean),
    ),
  )

  if (!participantIds.length) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'At least one valid participant is required.',
      requestId,
      retriable: false,
    })
  }

  if (!parsed.data.isGroup) {
    const otherParticipantIds = participantIds.filter((participantId) => participantId !== user.id)

    if (otherParticipantIds.length !== 1) {
      return problemResponse({
        status: 422,
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        detail: 'Direct threads must have exactly one other participant.',
        requestId,
        retriable: false,
      })
    }

    const targetParticipantId = otherParticipantIds[0]
    const rolesByUserId = await getProfileRolesByUserId(db, [user.id, targetParticipantId])

    if (!rolesByUserId.has(targetParticipantId)) {
      return problemResponse({
        status: 404,
        code: 'PARTICIPANT_NOT_FOUND',
        title: 'Participant Not Found',
        detail: 'The selected participant does not exist.',
        requestId,
        retriable: false,
      })
    }

    const isAllowed = await canUsersDirectMessage(db, user.id, targetParticipantId)

    if (!isAllowed) {
      return problemResponse({
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'Direct messaging requires an accepted friendship, follow relationship, or active coaching link.',
        requestId,
        retriable: false,
      })
    }
  }

  const { data: createdThread, error: threadError } = await db
    .from('message_threads')
    .insert({
      created_by: user.id,
      is_group: parsed.data.isGroup,
      group_name: parsed.data.groupName || null,
      group_avatar: parsed.data.groupAvatar || null,
    })
    .select('id')
    .single()

  if (threadError || !createdThread?.id) {
    return problemResponse({
      status: 500,
      code: 'THREAD_CREATE_FAILED',
      title: 'Thread Create Failed',
      detail: threadError?.message || 'Unable to create thread.',
      requestId,
    })
  }

  const participants = participantIds.map((participantId) => ({
    thread_id: createdThread.id as string,
    user_id: participantId,
  }))

  const { error: participantsError } = await db
    .from('message_thread_participants')
    .insert(participants)

  if (participantsError) {
    return problemResponse({
      status: 500,
      code: 'THREAD_CREATE_FAILED',
      title: 'Thread Create Failed',
      detail: participantsError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      threadId: createdThread.id as string,
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
