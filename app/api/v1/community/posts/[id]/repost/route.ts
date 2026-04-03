import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
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

  const { data: source, error: sourceError } = await (db as any)
    .from('community_posts')
    .select('id,user_id,content,post_type,media_urls,poll,workout_ref,meal_ref,pr_ref')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (sourceError || !source) {
    return problemResponse({
      status: 404,
      code: 'POST_NOT_FOUND',
      title: 'Post Not Found',
      detail: 'Source post does not exist.',
      requestId,
      retriable: false,
    })
  }

  const payload: Database['public']['Tables']['community_posts']['Insert'] = {
    user_id: user.id,
    content: String(source.content || ''),
    post_type: String(source.post_type || 'text'),
    media_urls: Array.isArray(source.media_urls) ? source.media_urls : [],
    poll: source.poll || null,
    workout_ref: source.workout_ref || null,
    meal_ref: source.meal_ref || null,
    pr_ref: source.pr_ref || null,
    repost_of_id: id,
  }

  const { data, error } = await (db as any)
    .from('community_posts')
    .insert(payload)
    .select('id,created_at')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'POST_REPOST_FAILED',
      title: 'Post Repost Failed',
      detail: error?.message || 'Unable to repost.',
      requestId,
    })
  }

  const ownerId = String(source.user_id || '')
  if (ownerId && ownerId !== user.id) {
    await createNotification(db as any, {
      recipientId: ownerId,
      actorId: user.id,
      type: 'community_repost',
      title: 'Your post was reposted',
      body: `${user.email?.split('@')[0] || 'Someone'} reposted your post.`,
      actionUrl: '/community',
      payload: { postId: id, repostId: String(data.id) },
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      repostId: String(data.id),
      postId: id,
      createdAt: String(data.created_at || new Date().toISOString()),
    },
  })
}
