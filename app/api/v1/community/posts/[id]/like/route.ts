import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

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

  const { data: post, error: postError } = await (db as any)
    .from('community_posts')
    .select('id,user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (postError || !post) {
    return problemResponse({
      status: 404,
      code: 'POST_NOT_FOUND',
      title: 'Post Not Found',
      detail: 'Post does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { data: existing } = await (db as any)
    .from('community_post_likes')
    .select('post_id')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await (db as any)
      .from('community_post_likes')
      .insert({ post_id: id, user_id: user.id })

    if (error) {
      return problemResponse({
        status: 500,
        code: 'POST_LIKE_FAILED',
        title: 'Post Like Failed',
        detail: error.message,
        requestId,
      })
    }

    const ownerId = String(post.user_id || '')
    if (ownerId && ownerId !== user.id) {
      await createNotification(db as any, {
        recipientId: ownerId,
        actorId: user.id,
        type: 'community_like',
        title: 'New like on your post',
        body: `${user.email?.split('@')[0] || 'Someone'} liked your post.`,
        actionUrl: '/community',
        payload: { postId: id },
      })
    }
  }

  return dataResponse({
    requestId,
    data: {
      liked: true,
      postId: id,
    },
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const { error } = await (db as any)
    .from('community_post_likes')
    .delete()
    .eq('post_id', id)
    .eq('user_id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'POST_UNLIKE_FAILED',
      title: 'Post Unlike Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      liked: false,
      postId: id,
    },
  })
}
