import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const LIMIT_DEFAULT = 20
const LIMIT_MIN = 1
const LIMIT_MAX = 50

const MealFoodItemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  source: z.enum(['manual', 'api']).default('manual'),
  serving: z.string().max(80).optional(),
  calories: z.number().min(0).max(5000).optional(),
  protein: z.number().min(0).max(500).optional(),
  carbs: z.number().min(0).max(500).optional(),
  fat: z.number().min(0).max(500).optional(),
  category: z.string().max(60).optional(),
  imageUrl: z.string().url().optional().nullable(),
})

const MealDrinkItemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  amount: z.string().max(60).optional(),
  calories: z.number().min(0).max(2000).optional(),
})

const MealDaySchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().max(2400).optional(),
  notes: z.string().max(600).optional(),
  foods: z.array(MealFoodItemSchema).optional().default([]),
  drinks: z.array(MealDrinkItemSchema).optional().default([]),
  macroTarget: z
    .object({
      calories: z.number().min(0).max(10000).optional(),
      protein: z.number().min(0).max(1000).optional(),
      carbs: z.number().min(0).max(1000).optional(),
      fat: z.number().min(0).max(1000).optional(),
    })
    .optional(),
})

const CoachContentCreateSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(6000),
  type: z.enum(['Post', 'Video', 'Meal', 'Challenge']),
  mediaUrl: z.string().url().optional().nullable(),
  subscribersOnly: z.boolean().default(true),
  mealDays: z.array(MealDaySchema).optional().default([]),
  tags: z.array(z.string().min(1).max(40)).optional().default([]),
  clientIds: z.array(z.string().uuid()).optional().default([]),
})

interface ContentPostRow {
  id: string | null
  content: string | null
  post_type: string | null
  created_at: string | null
}

interface ContentLikeRow {
  post_id: string | null
}

interface ContentTagLinkRow {
  post_id: string | null
  tag_id: string | null
}

interface ContentTagRow {
  id: string | null
  label: string | null
}

interface CreatedPostRow {
  id: string | null
  content: string | null
  post_type: string | null
  created_at: string | null
}

interface CreatedTagIdRow {
  id: string | null
}

export async function GET(request: Request) {
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

  const limitParam = new URL(request.url).searchParams.get('limit')
  const parsedLimit = Number.parseInt(limitParam || `${LIMIT_DEFAULT}`, 10)
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, parsedLimit))
    : LIMIT_DEFAULT

  const db = supabase as SupabaseServerClient

  const { data: rawPostsData, error: postsError } = await db
    .from('community_posts')
    .select('id,content,post_type,created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (postsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CONTENT_FETCH_FAILED',
      title: 'Coach Content Fetch Failed',
      detail: postsError.message,
      requestId,
    })
  }

  const posts = Array.isArray(rawPostsData) ? (rawPostsData as ContentPostRow[]) : []
  const postIds = posts.map((row) => String(row.id || '')).filter(Boolean)
  const likeMap = new Map<string, number>()
  const tagsByPost = new Map<string, string[]>()

  if (postIds.length) {
    const { data: rawLikesData, error: likesError } = await db
      .from('community_post_likes')
      .select('post_id')
      .in('post_id', postIds)

    if (likesError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CONTENT_FETCH_FAILED',
        title: 'Coach Content Fetch Failed',
        detail: likesError.message,
        requestId,
      })
    }

    const likesData = Array.isArray(rawLikesData) ? (rawLikesData as ContentLikeRow[]) : []
    for (const likeRow of likesData) {
      const key = String(likeRow.post_id || '')
      if (!key) continue
      likeMap.set(key, (likeMap.get(key) || 0) + 1)
    }
  }

  if (postIds.length) {
    const { data: rawLinkRows, error: linkError } = await db
      .from('coach_content_tag_links')
      .select('post_id,tag_id')
      .in('post_id', postIds)

    if (linkError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CONTENT_FETCH_FAILED',
        title: 'Coach Content Fetch Failed',
        detail: linkError.message,
        requestId,
      })
    }

    const links = Array.isArray(rawLinkRows) ? (rawLinkRows as ContentTagLinkRow[]) : []
    const tagIds = Array.from(new Set(links.map((row) => String(row.tag_id || '')).filter(Boolean)))
    const tagById = new Map<string, string>()

    if (tagIds.length) {
      const { data: rawTagRows, error: tagError } = await db
        .from('coach_content_tags')
        .select('id,label')
        .in('id', tagIds)

      if (tagError) {
        return problemResponse({
          status: 500,
          code: 'COACH_CONTENT_FETCH_FAILED',
          title: 'Coach Content Fetch Failed',
          detail: tagError.message,
          requestId,
        })
      }

      const tagRows = Array.isArray(rawTagRows) ? (rawTagRows as ContentTagRow[]) : []
      for (const tag of tagRows) {
        const id = String(tag.id || '')
        if (!id) continue
        tagById.set(id, String(tag.label || ''))
      }
    }

    for (const link of links) {
      const postId = String(link.post_id || '')
      const tagId = String(link.tag_id || '')
      if (!postId || !tagId) continue
      const label = tagById.get(tagId)
      if (!label) continue
      const existing = tagsByPost.get(postId) || []
      if (!existing.includes(label)) {
        tagsByPost.set(postId, [...existing, label])
      }
    }
  }

  return dataResponse({
    requestId,
    data: {
      publications: posts.map((row) => {
        const id = String(row.id || '')
        const headline = String(row.content || 'Untitled').split('\n')[0]
        return {
          id,
          title: headline.replace(/^#\s*/, '').replace(/^\[Subscribers\]\s*/, '').trim() || 'Untitled',
          type: mapPostTypeToLabel(String(row.post_type || 'text')),
          createdAt: String(row.created_at || new Date().toISOString()),
          likes: likeMap.get(id) || 0,
          tags: tagsByPost.get(id) || [],
        }
      }),
    },
  })
}

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

  const parsed = CoachContentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid coach content payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const basePayload: Omit<Database['public']['Tables']['community_posts']['Insert'], 'content'> = {
    user_id: user.id,
    post_type: mapComposerTypeToPostType(parsed.data.type),
    media_urls: parsed.data.mediaUrl ? [parsed.data.mediaUrl] : [],
  }

  const db = supabase as SupabaseServerClient

  const mealClientIds = parsed.data.type === 'Meal'
    ? Array.from(new Set(parsed.data.clientIds || []))
    : []

  if (parsed.data.type === 'Meal' && mealClientIds.length) {
    const { data: rawLinks, error: linkError } = await db
      .from('coach_client_links')
      .select('client_id')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .in('client_id', mealClientIds)

    if (linkError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CONTENT_CREATE_FAILED',
        title: 'Coach Content Create Failed',
        detail: linkError.message,
        requestId,
      })
    }

    const linkedClientIds = new Set(
      (Array.isArray(rawLinks) ? rawLinks : [])
        .map((row) => String((row as { client_id?: string | null }).client_id || ''))
        .filter(Boolean),
    )

    const invalidClientIds = mealClientIds.filter((id) => !linkedClientIds.has(id))
    if (invalidClientIds.length) {
      return problemResponse({
        status: 422,
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        detail: 'Meal plans can only be assigned to active linked clients.',
        requestId,
        retriable: false,
      })
    }
  }

  const insertRows: Database['public']['Tables']['community_posts']['Insert'][] = mealClientIds.length
    ? mealClientIds.map((clientId) => ({
      ...basePayload,
      content: buildContentPayload(
        parsed.data.type,
        parsed.data.title,
        parsed.data.description,
        parsed.data.mealDays,
        parsed.data.subscribersOnly,
        clientId,
      ),
    }))
    : [
      {
        ...basePayload,
        content: buildContentPayload(
          parsed.data.type,
          parsed.data.title,
          parsed.data.description,
          parsed.data.mealDays,
          parsed.data.subscribersOnly,
        ),
      },
    ]

  const { data: rawPosts, error } = await db
    .from('community_posts')
    .insert(insertRows)
    .select('id,content,post_type,created_at')
    .order('created_at', { ascending: false })

  const createdPosts = Array.isArray(rawPosts) ? (rawPosts as CreatedPostRow[]) : []
  const primaryPost = createdPosts[0] || null

  if (error || !primaryPost) {
    return problemResponse({
      status: 500,
      code: 'COACH_CONTENT_CREATE_FAILED',
      title: 'Coach Content Create Failed',
      detail: error?.message || 'Unable to publish content.',
      requestId,
    })
  }

  const normalizedTags = normalizeTags(parsed.data.tags)
  if (normalizedTags.length) {
    const tagPayload = normalizedTags.map((tag) => ({
      coach_id: user.id,
      label: tag,
      slug: slugify(tag),
    }))

    const { data: rawTags, error: tagError } = await db
      .from('coach_content_tags')
      .upsert(tagPayload, { onConflict: 'coach_id,slug' })
      .select('id')

    if (tagError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CONTENT_CREATE_FAILED',
        title: 'Coach Content Create Failed',
        detail: tagError.message,
        requestId,
      })
    }

    const tags = Array.isArray(rawTags) ? (rawTags as CreatedTagIdRow[]) : []
    const createdPostIds = createdPosts.map((row) => String(row.id || '')).filter(Boolean)
    const links = createdPostIds.flatMap((postId) =>
      tags
        .map((tag) => ({
          tag_id: String(tag.id || ''),
          post_id: postId,
        }))
        .filter((row) => row.tag_id.length > 0),
    )

    if (links.length) {
      const { error: linkError } = await db
        .from('coach_content_tag_links')
        .upsert(links, { onConflict: 'tag_id,post_id' })

      if (linkError) {
        return problemResponse({
          status: 500,
          code: 'COACH_CONTENT_CREATE_FAILED',
          title: 'Coach Content Create Failed',
          detail: linkError.message,
          requestId,
        })
      }
    }
  }

  const targetRecipientIds = new Set<string>()
  if (mealClientIds.length) {
    for (const clientId of mealClientIds) targetRecipientIds.add(clientId)
  } else {
    const { data: rawActiveLinks, error: activeLinkError } = await db
      .from('coach_client_links')
      .select('client_id')
      .eq('coach_id', user.id)
      .eq('status', 'active')

    if (!activeLinkError) {
      for (const row of Array.isArray(rawActiveLinks) ? rawActiveLinks : []) {
        const clientId = String((row as { client_id?: string | null }).client_id || '')
        if (!clientId) continue
        targetRecipientIds.add(clientId)
      }
    }
  }

  if (targetRecipientIds.size > 0) {
    const nowIso = new Date().toISOString()
    const notificationRows = Array.from(targetRecipientIds).map((recipientId) => ({
      recipient_id: recipientId,
      actor_id: user.id,
      type: 'coach_content_published',
      title: parsed.data.type === 'Meal' ? 'New meal plan from your coach' : 'New content from your coach',
      body: parsed.data.title,
      action_url: '/coaching',
      payload: {
        publicationId: String(primaryPost.id || ''),
        publicationType: parsed.data.type,
        tags: normalizedTags,
      },
      delivered_at: nowIso,
    }))

    const { error: notificationError } = await db.from('notifications').insert(notificationRows)
    if (notificationError) {
      console.error('[coach/content] notifications insert failed', notificationError.message)
    }
  }

  const headline = String(primaryPost.content || 'Untitled').split('\n')[0]

  return dataResponse({
    requestId,
    status: 201,
    data: {
      publication: {
        id: String(primaryPost.id),
        title: headline.replace(/^#\s*/, '').replace(/^\[Subscribers\]\s*/, '').trim() || 'Untitled',
        type: mapPostTypeToLabel(String(primaryPost.post_type || 'text')),
        createdAt: String(primaryPost.created_at || new Date().toISOString()),
        likes: 0,
        tags: normalizedTags,
      },
      createdCount: createdPosts.length,
    },
  })
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags || []) {
    const trimmed = String(tag || '').trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(trimmed)
  }

  return normalized.slice(0, 8)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

function mapComposerTypeToPostType(type: 'Post' | 'Video' | 'Meal' | 'Challenge'): 'text' | 'progress' | 'meal' | 'challenge' {
  if (type === 'Meal') return 'meal'
  if (type === 'Challenge') return 'challenge'
  if (type === 'Video') return 'progress'
  return 'text'
}

function mapPostTypeToLabel(postType: string): 'Post' | 'Video' | 'Meal' | 'Challenge' {
  if (postType === 'meal') return 'Meal'
  if (postType === 'challenge') return 'Challenge'
  if (postType === 'progress' || postType === 'workout') return 'Video'
  return 'Post'
}

function buildContentPayload(
  type: 'Post' | 'Video' | 'Meal' | 'Challenge',
  title: string,
  description: string,
  mealDays: Array<{
    title: string
    detail?: string
    notes?: string
    foods?: Array<{
      name: string
      source?: 'manual' | 'api'
      serving?: string
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      category?: string
    }>
    drinks?: Array<{
      name: string
      amount?: string
      calories?: number
    }>
    macroTarget?: {
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
    }
  }>,
  subscribersOnly: boolean,
  targetClientId?: string,
): string {
  const visibilityPrefix = subscribersOnly ? '[Subscribers] ' : ''
  const base = `${visibilityPrefix}# ${title.trim()}\n${description.trim()}`

  if (type !== 'Meal') return base

  const clientSection = targetClientId ? `\nTarget Client: ${targetClientId}` : ''

  const daysSection = mealDays.length
    ? `\n\nMeal Days:\n${mealDays
      .map((day) => {
        const foods = Array.isArray(day.foods) ? day.foods : []
        const drinks = Array.isArray(day.drinks) ? day.drinks : []
        const detailSegments = [
          day.detail ? String(day.detail) : '',
          foods.length ? `${foods.length} foods` : '',
          drinks.length ? `${drinks.length} drinks` : '',
          day.macroTarget?.calories ? `target ${Number(day.macroTarget.calories)} kcal` : '',
        ].filter(Boolean)

        return `- ${day.title}: ${detailSegments.join(' • ') || 'Configured day'}`
      })
      .join('\n')}`
    : ''

  return `${base}${clientSection}${daysSection}`
}
