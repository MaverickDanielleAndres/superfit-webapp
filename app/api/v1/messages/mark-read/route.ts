import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const MarkReadSchema = z.object({
  threadId: z.string().uuid(),
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

  const parsed = MarkReadSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid mark-read payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { error } = await db
    .from('message_thread_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('thread_id', parsed.data.threadId)
    .eq('user_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'MARK_READ_FAILED',
      title: 'Mark Read Failed',
      detail: error.message,
      requestId,
    })
  }

  await db
    .from('messages')
    .update({ status: 'read', updated_at: new Date().toISOString() })
    .eq('thread_id', parsed.data.threadId)
    .neq('sender_id', user.id)

  return dataResponse({
    requestId,
    data: {
      threadId: parsed.data.threadId,
      read: true,
    },
  })
}
