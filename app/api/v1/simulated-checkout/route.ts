import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const SimulatedCheckoutSchema = z.object({
  coachId: z.string().uuid().nullable().optional(),
  planName: z.string().min(1).max(120),
  amountCents: z.number().int().positive().max(500000),
  currency: z.string().length(3).optional().default('usd'),
})

async function ensureCoachClientLink(
  db: typeof supabaseAdmin,
  coachId: string,
  clientId: string,
): Promise<{ synced: boolean; linkId: string | null; status: string | null; error?: string }> {
  const dynamicDb = db as unknown as {
    from: (table: string) => {
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{
            data: { id?: string | null; status?: string | null } | null
            error: { message: string } | null
          }>
        }
      }
    }
  }

  const { data, error } = await dynamicDb
    .from('coach_client_links')
    .upsert(
      {
        coach_id: coachId,
        client_id: clientId,
        status: 'active',
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'coach_id,client_id' },
    )
    .select('id,status')
    .maybeSingle()

  if (error) {
    return {
      synced: false,
      linkId: null,
      status: null,
      error: error.message,
    }
  }

  return {
    synced: true,
    linkId: data?.id ? String(data.id) : null,
    status: data?.status ? String(data.status) : 'active',
  }
}

export async function POST(request: NextRequest) {
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

  if (payload.coachId) {
    const profileDb = db as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{
                data: { id?: string | null; account_status?: string | null } | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    }

    const { data: coachProfile, error: coachError } = await profileDb
      .from('profiles')
      .select('id,role,account_status')
      .eq('id', payload.coachId)
      .eq('role', 'coach')
      .maybeSingle()

    if (coachError) {
      return problemResponse({
        status: 500,
        code: 'CHECKOUT_FAILED',
        title: 'Checkout Failed',
        detail: coachError.message,
        requestId,
      })
    }

    if (!coachProfile?.id || String(coachProfile.account_status || 'active').toLowerCase() !== 'active') {
      return problemResponse({
        status: 422,
        code: 'COACH_NOT_FOUND',
        title: 'Coach Not Available',
        detail: 'The selected coach is not available for subscription.',
        requestId,
        retriable: false,
      })
    }
  }

  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim() || crypto.randomUUID()
  const externalRef = `sim_checkout:${user.id}:${idempotencyKey}`

  const paymentsReadDb = db as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            limit: (value: number) => {
              maybeSingle: () => Promise<{
                data: {
                  id: string
                  status: string
                  amount_cents: number
                  currency: string
                  created_at: string
                } | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    }
  }

  const { data: existingTransaction } = await paymentsReadDb
    .from('payment_transactions')
    .select('id,status,amount_cents,currency,created_at')
    .eq('user_id', user.id)
    .eq('external_ref', externalRef)
    .limit(1)
    .maybeSingle()

  if (existingTransaction) {
    let coachLinkSync: Awaited<ReturnType<typeof ensureCoachClientLink>> = {
      synced: false,
      linkId: null,
      status: null,
    }

    if (payload.coachId) {
      coachLinkSync = await ensureCoachClientLink(db, payload.coachId, user.id)
    }

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
        coachLinkSynced: coachLinkSync.synced,
        coachLinkId: coachLinkSync.linkId,
        coachLinkStatus: coachLinkSync.status,
        coachLinkSyncError: coachLinkSync.error,
      },
    })
  }

  const paymentsWriteDb = db as unknown as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: {
              id: string
              status: string
              amount_cents: number
              currency: string
              created_at: string
            }
            error: { message: string } | null
          }>
        }
      }
    }
  }

  const { data: transaction, error: transactionError } = await paymentsWriteDb
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

  const profileUpdateDb = db as unknown as {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }

  const { error: profileUpdateError } = await profileUpdateDb
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', user.id)

  let coachLinkSync: Awaited<ReturnType<typeof ensureCoachClientLink>> = {
    synced: false,
    linkId: null,
    status: null,
  }

  if (payload.coachId) {
    coachLinkSync = await ensureCoachClientLink(db, payload.coachId, user.id)
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
      profilePremiumSynced: !profileUpdateError,
      coachLinkSynced: coachLinkSync.synced,
      coachLinkId: coachLinkSync.linkId,
      coachLinkStatus: coachLinkSync.status,
      coachLinkSyncError: coachLinkSync.error,
    },
  })
}
