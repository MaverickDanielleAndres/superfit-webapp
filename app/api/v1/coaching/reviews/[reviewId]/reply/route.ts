import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface RouteContext {
  params: Promise<{ reviewId: string }>
}

const ReplySchema = z.object({
  body: z.string().min(1).max(1500),
})

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { reviewId } = await context.params
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

  const parsed = ReplySchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid review reply payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: review, error: reviewError } = await (db as any)
    .from('coach_reviews')
    .select('id,coach_id,reviewer_id')
    .eq('id', reviewId)
    .maybeSingle()

  if (reviewError || !review?.id) {
    return problemResponse({
      status: 404,
      code: 'COACH_REVIEW_NOT_FOUND',
      title: 'Coach Review Not Found',
      detail: reviewError?.message || 'Review does not exist.',
      requestId,
      retriable: false,
    })
  }

  if (String(review.coach_id || '') !== user.id) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Only this coach can reply to the review.',
      requestId,
      retriable: false,
    })
  }

  const now = new Date().toISOString()
  const { data: reply, error: replyError } = await (db as any)
    .from('coach_review_replies')
    .upsert(
      {
        review_id: reviewId,
        coach_id: user.id,
        body: parsed.data.body.trim(),
      },
      { onConflict: 'review_id' },
    )
    .select('id,review_id,coach_id,body,created_at')
    .single()

  if (replyError || !reply?.id) {
    return problemResponse({
      status: 500,
      code: 'COACH_REVIEW_REPLY_SAVE_FAILED',
      title: 'Coach Review Reply Save Failed',
      detail: replyError?.message || 'Unable to save review reply.',
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: String(review.reviewer_id),
    actorId: user.id,
    type: 'coach_review_reply',
    title: 'Coach replied to your review',
    body: parsed.data.body.trim().slice(0, 120),
    actionUrl: `/coaching/${String(review.coach_id)}`,
    payload: { reviewId: String(review.id), replyId: String(reply.id) },
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      reply: {
        id: String(reply.id),
        reviewId: String(reply.review_id),
        coachId: String(reply.coach_id),
        body: String(reply.body || ''),
        createdAt: String(reply.created_at || now),
      },
    },
  })
}
