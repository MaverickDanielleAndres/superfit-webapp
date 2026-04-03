import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

const CommentCreateSchema = z.object({
  content: z.string().min(1).max(2000),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const parsed = CommentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid comment payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: parent, error: parentError } = await (db as any)
    .from('community_posts')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (parentError || !parent) {
    return problemResponse({
      status: 404,
      code: 'POST_NOT_FOUND',
      title: 'Post Not Found',
      detail: 'Parent post does not exist.',
      requestId,
      retriable: false,
    })
  }

  const payload: Database['public']['Tables']['community_posts']['Insert'] = {
    user_id: user.id,
    parent_id: id,
    content: parsed.data.content,
    post_type: 'text',
  }

  const { data, error } = await (db as any)
    .from('community_posts')
    .insert(payload)
    .select('id,created_at,content')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'COMMENT_CREATE_FAILED',
      title: 'Comment Create Failed',
      detail: error?.message || 'Unable to create comment.',
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      comment: {
        id: String(data.id),
        content: String(data.content || ''),
        createdAt: String(data.created_at || new Date().toISOString()),
      },
      postId: id,
    },
  })
}
