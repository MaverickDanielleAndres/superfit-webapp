import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { hasActiveCoachClientLink } from '@/lib/social'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface RouteContext {
  params: Promise<{ coachId: string }>
}

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(''),
  comment: z.string().min(1).max(2000),
  isPublic: z.boolean().optional().default(true),
})

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { coachId } = await context.params
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

  if (coachId === user.id) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'You cannot review your own coaching profile.',
      requestId,
      retriable: false,
    })
  }

  const { data: coachProfile } = await (db as any)
    .from('profiles')
    .select('id,role')
    .eq('id', coachId)
    .eq('role', 'coach')
    .maybeSingle()

  if (!coachProfile?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_NOT_FOUND',
      title: 'Coach Not Found',
      detail: 'Coach profile does not exist.',
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

  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid review payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const hasLink = await hasActiveCoachClientLink(db as any, user.id, coachId)
  if (!hasLink) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Only active coaching clients can leave a review.',
      requestId,
      retriable: false,
    })
  }

  const now = new Date().toISOString()
  const payload = {
    coach_id: coachId,
    reviewer_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title.trim() || null,
    comment: parsed.data.comment.trim(),
    is_public: parsed.data.isPublic,
    updated_at: now,
  }

  const { data: review, error: upsertError } = await (db as any)
    .from('coach_reviews')
    .upsert(payload, { onConflict: 'coach_id,reviewer_id' })
    .select('id,coach_id,reviewer_id,rating,title,comment,is_public,created_at,updated_at')
    .single()

  if (upsertError || !review) {
    return problemResponse({
      status: 500,
      code: 'COACH_REVIEW_SAVE_FAILED',
      title: 'Coach Review Save Failed',
      detail: upsertError?.message || 'Unable to save review.',
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: coachId,
    actorId: user.id,
    type: 'coach_review',
    title: 'New coaching review',
    body: `${user.email?.split('@')[0] || 'A client'} left a ${parsed.data.rating}-star review.`,
    actionUrl: `/coaching/${coachId}`,
    payload: { reviewId: String(review.id) },
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      review: {
        id: String(review.id),
        coachId: String(review.coach_id),
        reviewerId: String(review.reviewer_id),
        rating: Number(review.rating || 0),
        title: String(review.title || ''),
        comment: String(review.comment || ''),
        isPublic: Boolean(review.is_public),
        createdAt: String(review.created_at || now),
        updatedAt: String(review.updated_at || now),
      },
    },
  })
}
