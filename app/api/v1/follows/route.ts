import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const FollowMutationSchema = z.object({
  followeeId: z.string().uuid(),
})

export async function GET(request: Request) {
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

  const params = new URL(request.url).searchParams
  const userId = String(params.get('userId') || user.id)

  const [{ data: followingRows, error: followingError }, { data: followerRows, error: followerError }] = await Promise.all([
    (db as any)
      .from('user_follows')
      .select('followee_id,created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false }),
    (db as any)
      .from('user_follows')
      .select('follower_id,created_at')
      .eq('followee_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (followingError || followerError) {
    return problemResponse({
      status: 500,
      code: 'FOLLOWS_FETCH_FAILED',
      title: 'Follows Fetch Failed',
      detail: followingError?.message || followerError?.message || 'Unable to fetch follows.',
      requestId,
    })
  }

  const followingIds = (Array.isArray(followingRows) ? followingRows : [])
    .map((row) => String(row.followee_id || ''))
    .filter(Boolean)

  const followerIds = (Array.isArray(followerRows) ? followerRows : [])
    .map((row) => String(row.follower_id || ''))
    .filter(Boolean)

  const profileIds = Array.from(new Set([...followingIds, ...followerIds]))
  const profileById = new Map<string, { name: string; handle: string; avatar: string; role: string }>()

  if (profileIds.length) {
    const { data: profiles, error: profilesError } = await (db as any)
      .from('profiles')
      .select('id,full_name,email,avatar_url,role')
      .in('id', profileIds)

    if (profilesError) {
      return problemResponse({
        status: 500,
        code: 'FOLLOWS_FETCH_FAILED',
        title: 'Follows Fetch Failed',
        detail: profilesError.message,
        requestId,
      })
    }

    for (const profile of profiles || []) {
      const id = String(profile.id || '')
      if (!id) continue
      const email = String(profile.email || '')
      profileById.set(id, {
        name: String(profile.full_name || email.split('@')[0] || 'User'),
        handle: `@${email.split('@')[0] || id.slice(0, 8)}`,
        avatar: String(profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`),
        role: String(profile.role || 'user'),
      })
    }
  }

  const following = followingIds.map((id) => ({
    userId: id,
    ...(profileById.get(id) || {
      name: 'User',
      handle: `@${id.slice(0, 8)}`,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`,
      role: 'user',
    }),
  }))

  const followers = followerIds.map((id) => ({
    userId: id,
    ...(profileById.get(id) || {
      name: 'User',
      handle: `@${id.slice(0, 8)}`,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`,
      role: 'user',
    }),
  }))

  return dataResponse({
    requestId,
    data: {
      userId,
      following,
      followers,
      followingIds,
      followerIds,
      counts: {
        following: followingIds.length,
        followers: followerIds.length,
      },
    },
  })
}

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

  const parsed = FollowMutationSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid follow payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { followeeId } = parsed.data

  if (followeeId === user.id) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'You cannot follow yourself.',
      requestId,
      retriable: false,
    })
  }

  const { data: targetProfile } = await (db as any)
    .from('profiles')
    .select('id')
    .eq('id', followeeId)
    .maybeSingle()

  if (!targetProfile?.id) {
    return problemResponse({
      status: 404,
      code: 'USER_NOT_FOUND',
      title: 'User Not Found',
      detail: 'Target user does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await (db as any)
    .from('user_follows')
    .upsert(
      {
        follower_id: user.id,
        followee_id: followeeId,
      },
      { onConflict: 'follower_id,followee_id' },
    )

  if (error) {
    return problemResponse({
      status: 500,
      code: 'FOLLOW_CREATE_FAILED',
      title: 'Follow Create Failed',
      detail: error.message,
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: followeeId,
    actorId: user.id,
    type: 'follow',
    title: 'New follower',
    body: `${user.email?.split('@')[0] || 'Someone'} started following you.`,
    actionUrl: '/community',
    payload: { followerId: user.id },
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      following: true,
      followeeId,
    },
  })
}

export async function DELETE(request: Request) {
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

  const params = new URL(request.url).searchParams
  const followeeId = params.get('followeeId')

  if (!followeeId) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'followeeId query param is required.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await (db as any)
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followee_id', followeeId)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'FOLLOW_DELETE_FAILED',
      title: 'Follow Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: followeeId,
    actorId: user.id,
    type: 'unfollow',
    title: 'Follower update',
    body: `${user.email?.split('@')[0] || 'Someone'} unfollowed you.`,
    actionUrl: '/community',
    payload: { followerId: user.id },
  })

  return dataResponse({
    requestId,
    data: {
      following: false,
      followeeId,
    },
  })
}
