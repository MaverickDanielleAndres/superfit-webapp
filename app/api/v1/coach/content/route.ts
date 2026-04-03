import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database } from '@/types/supabase'

const LIMIT_DEFAULT = 20
const LIMIT_MIN = 1
const LIMIT_MAX = 50

const MealDaySchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(240),
})

const CoachContentCreateSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(6000),
  type: z.enum(['Post', 'Video', 'Meal', 'Challenge']),
  mediaUrl: z.string().url().optional().nullable(),
  subscribersOnly: z.boolean().default(true),
  mealDays: z.array(MealDaySchema).optional().default([]),
  tags: z.array(z.string().min(1).max(40)).optional().default([]),
})

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

  const { data: postsData, error: postsError } = await (supabase as any)
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

  const posts = Array.isArray(postsData) ? postsData : []
  const postIds = posts.map((row) => String(row.id || '')).filter(Boolean)
  const likeMap = new Map<string, number>()
  const tagsByPost = new Map<string, string[]>()

  if (postIds.length) {
    const { data: likesData, error: likesError } = await (supabase as any)
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

    for (const likeRow of likesData || []) {
      const key = String(likeRow.post_id || '')
      if (!key) continue
      likeMap.set(key, (likeMap.get(key) || 0) + 1)
    }
  }

  if (postIds.length) {
    const { data: linkRows, error: linkError } = await (supabase as any)
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

    const links = Array.isArray(linkRows) ? linkRows : []
    const tagIds = Array.from(new Set(links.map((row) => String(row.tag_id || '')).filter(Boolean)))
    const tagById = new Map<string, string>()

    if (tagIds.length) {
      const { data: tagRows, error: tagError } = await (supabase as any)
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

      for (const tag of tagRows || []) {
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

  const content = buildContentPayload(
    parsed.data.type,
    parsed.data.title,
    parsed.data.description,
    parsed.data.mealDays,
    parsed.data.subscribersOnly,
  )

  const payload: Database['public']['Tables']['community_posts']['Insert'] = {
    user_id: user.id,
    content,
    post_type: mapComposerTypeToPostType(parsed.data.type),
    media_urls: parsed.data.mediaUrl ? [parsed.data.mediaUrl] : [],
  }

  const { data, error } = await (supabase as any)
    .from('community_posts')
    .insert(payload)
    .select('id,content,post_type,created_at')
    .single()

  if (error || !data) {
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

    const { data: tags, error: tagError } = await (supabase as any)
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

    const links = (tags || []).map((tag: any) => ({
      tag_id: String(tag.id || ''),
      post_id: String(data.id),
    })).filter((row: { tag_id: string; post_id: string }) => row.tag_id.length > 0)

    if (links.length) {
      const { error: linkError } = await (supabase as any)
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

  const headline = String(data.content || 'Untitled').split('\n')[0]

  return dataResponse({
    requestId,
    status: 201,
    data: {
      publication: {
        id: String(data.id),
        title: headline.replace(/^#\s*/, '').replace(/^\[Subscribers\]\s*/, '').trim() || 'Untitled',
        type: mapPostTypeToLabel(String(data.post_type || 'text')),
        createdAt: String(data.created_at || new Date().toISOString()),
        likes: 0,
        tags: normalizedTags,
      },
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
  mealDays: Array<{ title: string; detail: string }>,
  subscribersOnly: boolean,
): string {
  const visibilityPrefix = subscribersOnly ? '[Subscribers] ' : ''
  const base = `${visibilityPrefix}# ${title.trim()}\n${description.trim()}`

  if (type !== 'Meal') return base

  const daysSection = mealDays.length
    ? `\n\nMeal Days:\n${mealDays.map((day) => `- ${day.title}: ${day.detail}`).join('\n')}`
    : ''

  return `${base}${daysSection}`
}
