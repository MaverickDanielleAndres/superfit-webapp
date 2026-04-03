import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const SimulatedCheckoutSchema = z.object({
  coachId: z.string().uuid().nullable().optional(),
  planName: z.string().min(1).max(120),
  amountCents: z.number().int().positive().max(500000),
  currency: z.string().length(3).optional().default('usd'),
})

export async function POST(request: NextRequest) {
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

  let requestBody: unknown
  try {
    requestBody = await request.json()
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

  const parsedBody = SimulatedCheckoutSchema.safeParse(requestBody)
  if (!parsedBody.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid checkout payload.',
      requestId,
      retriable: false,
      errors: parsedBody.error.flatten(),
    })
  }

  const payload = parsedBody.data
  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim() || crypto.randomUUID()
  const externalRef = `sim_checkout:${user.id}:${idempotencyKey}`

  const { data: existingTransaction } = await supabase
    .from('payment_transactions')
    .select('id,status,amount_cents,currency,created_at')
    .eq('user_id', user.id)
    .eq('external_ref', externalRef)
    .limit(1)
    .maybeSingle()

  if (existingTransaction) {
    return dataResponse({
      requestId,
      data: {
        transactionId: existingTransaction.id,
        amountCents: existingTransaction.amount_cents,
        currency: existingTransaction.currency,
        status: existingTransaction.status,
        createdAt: existingTransaction.created_at,
        mode: 'simulation',
        planName: payload.planName,
        idempotentReplay: true,
      },
    })
  }

  const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: user.id,
      coach_id: payload.coachId || null,
      amount_cents: payload.amountCents,
      currency: payload.currency.toLowerCase(),
      status: 'succeeded',
      external_ref: externalRef,
    })
    .select('id,status,amount_cents,currency,created_at')
    .single()

  if (transactionError) {
    return problemResponse({
      status: 500,
      code: 'CHECKOUT_FAILED',
      title: 'Checkout Failed',
      detail: transactionError.message,
      requestId,
    })
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', user.id)

  if (profileUpdateError) {
    return problemResponse({
      status: 500,
      code: 'PROFILE_UPDATE_FAILED',
      title: 'Profile Update Failed',
      detail: profileUpdateError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      transactionId: transaction.id,
      amountCents: transaction.amount_cents,
      currency: transaction.currency,
      status: transaction.status,
      createdAt: transaction.created_at,
      mode: 'simulation',
      planName: payload.planName,
      idempotentReplay: false,
    },
  })
}
