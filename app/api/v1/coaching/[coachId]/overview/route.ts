import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface RouteContext {
  params: Promise<{ coachId: string }>
}

function normalizeTitle(content: string): string {
  const firstLine = String(content || '').split('\n')[0] || 'Untitled'
  return firstLine.replace(/^#\s*/, '').replace(/^\[Subscribers\]\s*/, '').trim() || 'Untitled'
}

function normalizeExcerpt(content: string): string {
  const lines = String(content || '').split('\n')
  const withoutHeading = lines.slice(1).join('\n').trim()
  const excerpt = withoutHeading || lines[0] || ''
  return excerpt.slice(0, 220)
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { coachId } = await context.params
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const viewerId = user?.id ?? null

  const { data: coachProfile, error: coachError } = await (db as any)
    .from('profiles')
    .select('id,full_name,avatar_url,email,goal,exercise_preferences,role')
    .eq('id', coachId)
    .eq('role', 'coach')
    .maybeSingle()

  if (coachError || !coachProfile?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_NOT_FOUND',
      title: 'Coach Not Found',
      detail: coachError?.message || 'Coach profile does not exist.',
      requestId,
      retriable: false,
    })
  }

  const { data: postRows, error: postError } = await (db as any)
    .from('community_posts')
    .select('id,content,post_type,created_at')
    .eq('user_id', coachId)
    .is('deleted_at', null)
    .is('parent_id', null)
    .is('repost_of_id', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (postError) {
    return problemResponse({
      status: 500,
      code: 'COACH_OVERVIEW_FETCH_FAILED',
      title: 'Coach Overview Fetch Failed',
      detail: postError.message,
      requestId,
    })
  }

  const posts = Array.isArray(postRows) ? postRows : []
  const postIds = posts.map((row) => String(row.id || '')).filter(Boolean)

  const likesByPost = new Map<string, number>()
  if (postIds.length) {
    const { data: likeRows, error: likeError } = await (db as any)
      .from('community_post_likes')
      .select('post_id')
      .in('post_id', postIds)

    if (likeError) {
      return problemResponse({
        status: 500,
        code: 'COACH_OVERVIEW_FETCH_FAILED',
        title: 'Coach Overview Fetch Failed',
        detail: likeError.message,
        requestId,
      })
    }

    for (const row of likeRows || []) {
      const postId = String(row.post_id || '')
      if (!postId) continue
      likesByPost.set(postId, (likesByPost.get(postId) || 0) + 1)
    }
  }

  const tagsByPost = new Map<string, Array<{ id: string; label: string; slug: string }>>()
  if (postIds.length) {
    const { data: linkRows, error: linkError } = await (db as any)
      .from('coach_content_tag_links')
      .select('post_id,tag_id')
      .in('post_id', postIds)

    if (linkError) {
      return problemResponse({
        status: 500,
        code: 'COACH_OVERVIEW_FETCH_FAILED',
        title: 'Coach Overview Fetch Failed',
        detail: linkError.message,
        requestId,
      })
    }

    const links = Array.isArray(linkRows) ? linkRows : []
    const tagIds = Array.from(new Set(links.map((row) => String(row.tag_id || '')).filter(Boolean)))
    const tagById = new Map<string, { id: string; label: string; slug: string }>()

    if (tagIds.length) {
      const { data: tagRows, error: tagError } = await (db as any)
        .from('coach_content_tags')
        .select('id,label,slug')
        .in('id', tagIds)

      if (tagError) {
        return problemResponse({
          status: 500,
          code: 'COACH_OVERVIEW_FETCH_FAILED',
          title: 'Coach Overview Fetch Failed',
          detail: tagError.message,
          requestId,
        })
      }

      for (const tag of tagRows || []) {
        const id = String(tag.id || '')
        if (!id) continue
        tagById.set(id, {
          id,
          label: String(tag.label || ''),
          slug: String(tag.slug || ''),
        })
      }
    }

    for (const link of links) {
      const postId = String(link.post_id || '')
      const tagId = String(link.tag_id || '')
      if (!postId || !tagId) continue
      const tag = tagById.get(tagId)
      if (!tag) continue
      const existing = tagsByPost.get(postId) || []
      if (!existing.some((item) => item.id === tag.id)) {
        tagsByPost.set(postId, [...existing, tag])
      }
    }
  }

  const { data: reviewRows, error: reviewError } = await (db as any)
    .from('coach_reviews')
    .select('id,coach_id,reviewer_id,rating,title,comment,is_public,created_at,updated_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  if (reviewError) {
    return problemResponse({
      status: 500,
      code: 'COACH_OVERVIEW_FETCH_FAILED',
      title: 'Coach Overview Fetch Failed',
      detail: reviewError.message,
      requestId,
    })
  }

  const allReviews = Array.isArray(reviewRows) ? reviewRows : []
  const reviews = allReviews.filter((review) => {
    if (Boolean(review.is_public)) return true
    if (!viewerId) return false
    return String(review.reviewer_id || '') === viewerId || coachId === viewerId
  })

  const reviewerIds = Array.from(new Set(reviews.map((row) => String(row.reviewer_id || '')).filter(Boolean)))
  const reviewIds = reviews.map((row) => String(row.id || '')).filter(Boolean)

  const reviewerById = new Map<string, { id: string; name: string; avatar: string }>()
  if (reviewerIds.length) {
    const { data: reviewerRows, error: reviewerError } = await (db as any)
      .from('profiles')
      .select('id,full_name,avatar_url,email')
      .in('id', reviewerIds)

    if (reviewerError) {
      return problemResponse({
        status: 500,
        code: 'COACH_OVERVIEW_FETCH_FAILED',
        title: 'Coach Overview Fetch Failed',
        detail: reviewerError.message,
        requestId,
      })
    }

    for (const reviewer of reviewerRows || []) {
      const id = String(reviewer.id || '')
      if (!id) continue
      reviewerById.set(id, {
        id,
        name: String(reviewer.full_name || reviewer.email?.split('@')[0] || 'Member'),
        avatar: String(reviewer.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`),
      })
    }
  }

  const replyByReviewId = new Map<string, { id: string; body: string; createdAt: string }>()
  if (reviewIds.length) {
    const { data: replyRows, error: replyError } = await (db as any)
      .from('coach_review_replies')
      .select('id,review_id,body,created_at')
      .in('review_id', reviewIds)

    if (replyError) {
      return problemResponse({
        status: 500,
        code: 'COACH_OVERVIEW_FETCH_FAILED',
        title: 'Coach Overview Fetch Failed',
        detail: replyError.message,
        requestId,
      })
    }

    for (const reply of replyRows || []) {
      const reviewId = String(reply.review_id || '')
      if (!reviewId) continue
      replyByReviewId.set(reviewId, {
        id: String(reply.id || ''),
        body: String(reply.body || ''),
        createdAt: String(reply.created_at || new Date().toISOString()),
      })
    }
  }

  const mappedReviews = reviews.map((review) => {
    const reviewerId = String(review.reviewer_id || '')
    const reviewer = reviewerById.get(reviewerId)

    return {
      id: String(review.id || ''),
      rating: Number(review.rating || 0),
      title: String(review.title || ''),
      comment: String(review.comment || ''),
      createdAt: String(review.created_at || new Date().toISOString()),
      reviewer: {
        id: reviewerId,
        name: reviewer?.name || 'Member',
        avatar: reviewer?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${reviewerId || 'member'}`,
      },
      reply: replyByReviewId.get(String(review.id || '')) || null,
      canReply: Boolean(viewerId) && viewerId === coachId,
      canEdit: Boolean(viewerId) && viewerId === reviewerId,
    }
  })

  const averageRating = mappedReviews.length
    ? Number((mappedReviews.reduce((sum, review) => sum + review.rating, 0) / mappedReviews.length).toFixed(2))
    : 0

  const publications = posts.map((post) => {
    const id = String(post.id || '')
    const content = String(post.content || '')
    const tags = (tagsByPost.get(id) || []).map((tag) => tag.label)

    return {
      id,
      type: String(post.post_type || 'text'),
      title: normalizeTitle(content),
      excerpt: normalizeExcerpt(content),
      createdAt: String(post.created_at || new Date().toISOString()),
      likes: likesByPost.get(id) || 0,
      tags,
      subscribersOnly: content.startsWith('[Subscribers]'),
    }
  })

  return dataResponse({
    requestId,
    data: {
      coach: {
        id: String(coachProfile.id),
        name: String(coachProfile.full_name || coachProfile.email?.split('@')[0] || 'Coach'),
        avatar: String(coachProfile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${coachId}`),
        bio: String(coachProfile.goal || 'Performance coaching and accountability.'),
        specialties: Array.isArray(coachProfile.exercise_preferences)
          ? coachProfile.exercise_preferences.map((entry: unknown) => String(entry))
          : [],
      },
      rating: {
        average: averageRating,
        count: mappedReviews.length,
      },
      publications,
      reviews: mappedReviews,
      viewerCanReview: Boolean(viewerId) && viewerId !== coachId,
    },
  })
}
