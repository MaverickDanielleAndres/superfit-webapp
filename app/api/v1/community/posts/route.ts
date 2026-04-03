import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database, Json } from '@/types/supabase'

interface CommunityPostItem {
  id: string
  userId: string
  userName: string
  userHandle: string
  userAvatar: string
  isCoach: boolean
  isVerified?: boolean
  type: 'workout' | 'meal' | 'progress' | 'text' | 'pr' | 'challenge'
  content: string
  mediaUrls?: string[]
  poll?: unknown
  workoutRef?: unknown
  mealRef?: unknown
  prRef?: unknown
  likes: number
  comments: number
  reposts: number
  views?: number
  isLiked?: boolean
  postedAt: string
}

const PostCreateSchema = z.object({
  content: z.string().min(1).max(4000),
  type: z.enum(['workout', 'meal', 'progress', 'text', 'pr', 'challenge']).default('text'),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  poll: z.unknown().optional().nullable(),
  workoutRef: z.unknown().optional().nullable(),
  mealRef: z.unknown().optional().nullable(),
  prRef: z.unknown().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  repostOfId: z.string().uuid().optional().nullable(),
})

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

  const { data: postsData, error: postsError } = await (db as any)
    .from('community_posts')
    .select('id,user_id,content,post_type,media_urls,poll,workout_ref,meal_ref,pr_ref,created_at,parent_id,repost_of_id')
    .is('deleted_at', null)
    .is('parent_id', null)
    .is('repost_of_id', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (postsError) {
    return problemResponse({
      status: 500,
      code: 'COMMUNITY_FETCH_FAILED',
      title: 'Community Fetch Failed',
      detail: postsError.message,
      requestId,
    })
  }

  const posts = Array.isArray(postsData) ? postsData : []
  const postIds = posts.map((row) => String(row.id || '')).filter(Boolean)
  const postUserIds = Array.from(new Set(posts.map((row) => String(row.user_id || '')).filter(Boolean)))

  const profileById = new Map<string, {
    full_name?: string | null
    avatar_url?: string | null
    role?: string | null
    email?: string | null
  }>()

  if (postUserIds.length) {
    const { data: profileRows, error: profileError } = await (db as any)
      .from('profiles')
      .select('id,full_name,avatar_url,role,email')
      .in('id', postUserIds)

    if (profileError) {
      return problemResponse({
        status: 500,
        code: 'COMMUNITY_FETCH_FAILED',
        title: 'Community Fetch Failed',
        detail: profileError.message,
        requestId,
      })
    }

    for (const profile of profileRows || []) {
      const id = String(profile.id || '')
      if (!id) continue
      profileById.set(id, {
        full_name: profile.full_name || null,
        avatar_url: profile.avatar_url || null,
        role: profile.role || null,
        email: profile.email || null,
      })
    }
  }

  const likesByPost = new Map<string, number>()
  const likedByMe = new Set<string>()
  const commentsByPost = new Map<string, number>()
  const repostsByPost = new Map<string, number>()

  if (postIds.length) {
    const { data: likesData, error: likesError } = await (db as any)
      .from('community_post_likes')
      .select('post_id,user_id')
      .in('post_id', postIds)

    if (likesError) {
      return problemResponse({
        status: 500,
        code: 'COMMUNITY_FETCH_FAILED',
        title: 'Community Fetch Failed',
        detail: likesError.message,
        requestId,
      })
    }

    for (const like of likesData || []) {
      const postId = String(like.post_id || '')
      if (!postId) continue
      likesByPost.set(postId, (likesByPost.get(postId) || 0) + 1)
      if (String(like.user_id || '') === user.id) likedByMe.add(postId)
    }

    const { data: commentsData, error: commentsError } = await (db as any)
      .from('community_posts')
      .select('id,parent_id')
      .is('deleted_at', null)
      .in('parent_id', postIds)

    if (commentsError) {
      return problemResponse({
        status: 500,
        code: 'COMMUNITY_FETCH_FAILED',
        title: 'Community Fetch Failed',
        detail: commentsError.message,
        requestId,
      })
    }

    for (const comment of commentsData || []) {
      const parentId = String(comment.parent_id || '')
      if (!parentId) continue
      commentsByPost.set(parentId, (commentsByPost.get(parentId) || 0) + 1)
    }

    const { data: repostData, error: repostError } = await (db as any)
      .from('community_posts')
      .select('id,repost_of_id')
      .is('deleted_at', null)
      .in('repost_of_id', postIds)

    if (repostError) {
      return problemResponse({
        status: 500,
        code: 'COMMUNITY_FETCH_FAILED',
        title: 'Community Fetch Failed',
        detail: repostError.message,
        requestId,
      })
    }

    for (const repost of repostData || []) {
      const sourceId = String(repost.repost_of_id || '')
      if (!sourceId) continue
      repostsByPost.set(sourceId, (repostsByPost.get(sourceId) || 0) + 1)
    }
  }

  const mappedPosts: CommunityPostItem[] = posts.map((row) => {
    const profile = profileById.get(String(row.user_id || '')) || {}

    const postId = String(row.id || '')
    const userId = String(row.user_id || '')
    const emailHandle = profile.email ? String(profile.email).split('@')[0] : userId.slice(0, 8)

    return {
      id: postId,
      userId,
      userName: profile.full_name || 'SuperFit User',
      userHandle: `@${emailHandle}`,
      userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
      isCoach: profile.role === 'coach',
      type: normalizePostType(row.post_type),
      content: String(row.content || ''),
      mediaUrls: Array.isArray(row.media_urls) ? row.media_urls.map((value: unknown) => String(value)) : undefined,
      poll: row.poll || undefined,
      workoutRef: row.workout_ref || undefined,
      mealRef: row.meal_ref || undefined,
      prRef: row.pr_ref || undefined,
      likes: likesByPost.get(postId) || 0,
      comments: commentsByPost.get(postId) || 0,
      reposts: repostsByPost.get(postId) || 0,
      views: 0,
      isLiked: likedByMe.has(postId),
      postedAt: String(row.created_at || new Date().toISOString()),
    }
  })

  return dataResponse({
    requestId,
    data: {
      posts: mappedPosts,
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

  const parsed = PostCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid community post payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: Database['public']['Tables']['community_posts']['Insert'] = {
    user_id: user.id,
    content: parsed.data.content,
    post_type: parsed.data.type,
    media_urls: parsed.data.mediaUrls,
    poll: (parsed.data.poll || null) as Json | null,
    workout_ref: (parsed.data.workoutRef || null) as Json | null,
    meal_ref: (parsed.data.mealRef || null) as Json | null,
    pr_ref: (parsed.data.prRef || null) as Json | null,
    parent_id: parsed.data.parentId || null,
    repost_of_id: parsed.data.repostOfId || null,
  }

  const { data, error } = await (db as any)
    .from('community_posts')
    .insert(payload)
    .select('id,user_id,content,post_type,media_urls,poll,workout_ref,meal_ref,pr_ref,created_at')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'POST_CREATE_FAILED',
      title: 'Post Create Failed',
      detail: error?.message || 'Unable to create post.',
      requestId,
    })
  }

  const { data: profile } = await (db as any)
    .from('profiles')
    .select('full_name,avatar_url,role,email')
    .eq('id', user.id)
    .maybeSingle()

  const emailHandle = profile?.email ? String(profile.email).split('@')[0] : user.id.slice(0, 8)

  return dataResponse({
    requestId,
    status: 201,
    data: {
      post: {
        id: String(data.id),
        userId: String(data.user_id),
        userName: String(profile?.full_name || 'SuperFit User'),
        userHandle: `@${emailHandle}`,
        userAvatar: String(profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`),
        isCoach: profile?.role === 'coach',
        type: normalizePostType(data.post_type),
        content: String(data.content || ''),
        mediaUrls: Array.isArray(data.media_urls) ? data.media_urls.map((value: unknown) => String(value)) : undefined,
        poll: data.poll || undefined,
        workoutRef: data.workout_ref || undefined,
        mealRef: data.meal_ref || undefined,
        prRef: data.pr_ref || undefined,
        likes: 0,
        comments: 0,
        reposts: 0,
        views: 0,
        isLiked: false,
        postedAt: String(data.created_at || new Date().toISOString()),
      } satisfies CommunityPostItem,
    },
  })
}

function normalizePostType(type: unknown): CommunityPostItem['type'] {
  if (type === 'workout' || type === 'meal' || type === 'progress' || type === 'text' || type === 'pr' || type === 'challenge') {
    return type
  }
  return 'text'
}
