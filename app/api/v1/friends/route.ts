import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const SendFriendRequestSchema = z.object({
  targetUserId: z.string().uuid(),
})

interface FriendRecord {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string
  updated_at: string
}

export async function GET() {
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

  const { data: friendshipRows, error: friendshipError } = await (db as any)
    .from('user_friendships')
    .select('id,requester_id,addressee_id,status,created_at,updated_at')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (friendshipError) {
    return problemResponse({
      status: 500,
      code: 'FRIENDS_FETCH_FAILED',
      title: 'Friends Fetch Failed',
      detail: friendshipError.message,
      requestId,
    })
  }

  const friendships: FriendRecord[] = Array.isArray(friendshipRows) ? friendshipRows : []
  const relatedUserIds = new Set<string>()

  for (const friendship of friendships) {
    const requesterId = String(friendship.requester_id || '')
    const addresseeId = String(friendship.addressee_id || '')

    if (requesterId && requesterId !== user.id) relatedUserIds.add(requesterId)
    if (addresseeId && addresseeId !== user.id) relatedUserIds.add(addresseeId)
  }

  const { data: profileRows, error: profileError } = await (db as any)
    .from('profiles')
    .select('id,full_name,avatar_url,email,role')
    .in('id', Array.from(relatedUserIds).length ? Array.from(relatedUserIds) : ['00000000-0000-0000-0000-000000000000'])

  if (profileError) {
    return problemResponse({
      status: 500,
      code: 'FRIENDS_FETCH_FAILED',
      title: 'Friends Fetch Failed',
      detail: profileError.message,
      requestId,
    })
  }

  const profileById = new Map<string, { full_name?: string | null; avatar_url?: string | null; email?: string | null; role?: string | null }>()

  for (const profile of profileRows || []) {
    profileById.set(String(profile.id), {
      full_name: profile.full_name || null,
      avatar_url: profile.avatar_url || null,
      email: profile.email || null,
      role: profile.role || null,
    })
  }

  const friends = [] as Array<{
    friendshipId: string
    userId: string
    name: string
    handle: string
    avatar: string
    role: string
    status: 'accepted'
  }>

  const incomingRequests = [] as Array<{
    friendshipId: string
    userId: string
    name: string
    handle: string
    avatar: string
    role: string
    status: 'pending'
  }>

  const outgoingRequests = [] as Array<{
    friendshipId: string
    userId: string
    name: string
    handle: string
    avatar: string
    role: string
    status: 'pending'
  }>

  for (const friendship of friendships) {
    const requesterId = String(friendship.requester_id || '')
    const addresseeId = String(friendship.addressee_id || '')
    const status = String(friendship.status || '')

    const otherUserId = requesterId === user.id ? addresseeId : requesterId
    if (!otherUserId) continue

    const profile = profileById.get(otherUserId)
    const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User'
    const handle = `@${(profile?.email || otherUserId).split('@')[0]}`
    const avatar = profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${otherUserId}`
    const role = profile?.role || 'user'

    if (status === 'accepted') {
      friends.push({
        friendshipId: friendship.id,
        userId: otherUserId,
        name: displayName,
        handle,
        avatar,
        role,
        status: 'accepted',
      })
      continue
    }

    if (status === 'pending' && addresseeId === user.id) {
      incomingRequests.push({
        friendshipId: friendship.id,
        userId: otherUserId,
        name: displayName,
        handle,
        avatar,
        role,
        status: 'pending',
      })
      continue
    }

    if (status === 'pending' && requesterId === user.id) {
      outgoingRequests.push({
        friendshipId: friendship.id,
        userId: otherUserId,
        name: displayName,
        handle,
        avatar,
        role,
        status: 'pending',
      })
    }
  }

  const excludedIds = new Set<string>([user.id, ...Array.from(relatedUserIds)])
  const { data: suggestionRows } = await (db as any)
    .from('profiles')
    .select('id,full_name,avatar_url,email,role')
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const suggestions = (suggestionRows || [])
    .filter((row: any) => !excludedIds.has(String(row.id || '')))
    .slice(0, 8)
    .map((row: any) => ({
      userId: String(row.id || ''),
      name: String(row.full_name || row.email?.split('@')[0] || 'User'),
      handle: `@${String(row.email || row.id || '').split('@')[0]}`,
      avatar: String(row.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${row.id}`),
      role: String(row.role || 'user'),
    }))

  return dataResponse({
    requestId,
    data: {
      friends,
      incomingRequests,
      outgoingRequests,
      suggestions,
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

  const parsed = SendFriendRequestSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid friend request payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const targetUserId = parsed.data.targetUserId
  if (targetUserId === user.id) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'You cannot send a friend request to yourself.',
      requestId,
      retriable: false,
    })
  }

  const { data: targetProfile } = await (db as any)
    .from('profiles')
    .select('id,full_name')
    .eq('id', targetUserId)
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

  const [forwardExisting, reverseExisting] = await Promise.all([
    (db as any)
      .from('user_friendships')
      .select('id,status,requester_id,addressee_id')
      .eq('requester_id', user.id)
      .eq('addressee_id', targetUserId)
      .maybeSingle(),
    (db as any)
      .from('user_friendships')
      .select('id,status,requester_id,addressee_id')
      .eq('requester_id', targetUserId)
      .eq('addressee_id', user.id)
      .maybeSingle(),
  ])

  const existing = forwardExisting.data || reverseExisting.data
  if (existing?.id && existing.status === 'accepted') {
    return dataResponse({
      requestId,
      data: {
        friendshipId: String(existing.id),
        status: 'accepted',
        alreadyFriends: true,
      },
    })
  }

  if (existing?.id && existing.status === 'pending') {
    if (String(existing.requester_id) === targetUserId && String(existing.addressee_id) === user.id) {
      const { data: accepted, error: acceptError } = await (db as any)
        .from('user_friendships')
        .update({ status: 'accepted', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id,status')
        .single()

      if (acceptError || !accepted) {
        return problemResponse({
          status: 500,
          code: 'FRIEND_REQUEST_ACCEPT_FAILED',
          title: 'Friend Request Accept Failed',
          detail: acceptError?.message || 'Unable to accept pending request.',
          requestId,
        })
      }

      await createNotification(db as any, {
        recipientId: targetUserId,
        actorId: user.id,
        type: 'friend_request_accepted',
        title: 'Friend request accepted',
        body: `${user.email?.split('@')[0] || 'A user'} accepted your friend request.`,
        actionUrl: '/community',
        payload: { friendshipId: String(accepted.id) },
      })

      return dataResponse({
        requestId,
        data: {
          friendshipId: String(accepted.id),
          status: 'accepted',
          acceptedExistingRequest: true,
        },
      })
    }

    return dataResponse({
      requestId,
      data: {
        friendshipId: String(existing.id),
        status: 'pending',
        alreadyPending: true,
      },
    })
  }

  const { data: created, error: createError } = await (db as any)
    .from('user_friendships')
    .insert({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: 'pending',
    })
    .select('id,status')
    .single()

  if (createError || !created) {
    return problemResponse({
      status: 500,
      code: 'FRIEND_REQUEST_FAILED',
      title: 'Friend Request Failed',
      detail: createError?.message || 'Unable to send friend request.',
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: targetUserId,
    actorId: user.id,
    type: 'friend_request',
    title: 'New friend request',
    body: `${user.email?.split('@')[0] || 'A user'} sent you a friend request.`,
    actionUrl: '/community',
    payload: { friendshipId: String(created.id) },
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      friendshipId: String(created.id),
      status: String(created.status || 'pending'),
    },
  })
}
