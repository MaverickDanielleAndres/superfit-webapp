import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

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

  const { data: createdThread, error: threadError } = await (supabase as any)
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

  const { error: participantsError } = await (supabase as any)
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
