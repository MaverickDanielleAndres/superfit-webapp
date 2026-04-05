import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { z } from 'zod'
import { createNotifications } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createAuditLog } from '@/lib/audit'

const ApprovePendingSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1).max(500),
})

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || String(profile.role || '').toLowerCase() !== 'admin') {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admin access required.',
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

  const parsed = ApprovePendingSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'paymentIds must be a non-empty array of UUIDs.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const paymentIds = Array.from(new Set(parsed.data.paymentIds))

  const { data: pendingRows, error: pendingRowsError } = await (supabase as any)
    .from('payment_transactions')
    .select('id,status,coach_id,amount_cents,currency')
    .in('id', paymentIds)
    .eq('status', 'pending')

  if (pendingRowsError) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_PAYMENTS_PRECHECK_FAILED',
      title: 'Payout Precheck Failed',
      detail: pendingRowsError.message,
      requestId,
    })
  }

  const eligibleIds = (pendingRows || []).map((row: { id: string }) => String(row.id))
  if (eligibleIds.length === 0) {
    return dataResponse({
      requestId,
      data: {
        requestedCount: paymentIds.length,
        approvedCount: 0,
        skippedCount: paymentIds.length,
      },
    })
  }

  const { data: data, error } = await (supabase as any)
    .from('payment_transactions')
    .update({ status: 'succeeded' })
    .in('id', eligibleIds)
    .eq('status', 'pending')
    .select('id')

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_PAYMENTS_APPROVE_FAILED',
      title: 'Payout Approval Failed',
      detail: error.message,
      requestId,
    })
  }

  const approvedIds = new Set((data || []).map((row: { id: string }) => String(row.id || '')))
  const notifications = (pendingRows || [])
    .filter((row: { id: string | null; coach_id: string | null }) => {
      const paymentId = String(row.id || '')
      const coachId = String(row.coach_id || '')
      return Boolean(paymentId) && Boolean(coachId) && approvedIds.has(paymentId)
    })
    .map((row: { id: string | null; coach_id: string | null; amount_cents: number | null; currency: string | null }) => ({
      recipientId: String(row.coach_id || ''),
      actorId: user.id,
      type: 'admin_payment_approved',
      title: 'Payout approved',
      body: `A pending payout of ${(Number(row.amount_cents || 0) / 100).toFixed(2)} ${String(row.currency || 'usd').toUpperCase()} has been approved.`,
      actionUrl: '/coach/marketplace',
      payload: {
        paymentId: String(row.id || ''),
        status: 'succeeded',
      },
    }))

  if (notifications.length) {
    await createNotifications(supabaseAdmin as any, notifications)
  }

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.payment.bulk_approved',
    resource: 'payment_transactions',
    metadata: {
      requestedCount: paymentIds.length,
      approvedCount: (data || []).length,
      skippedCount: Math.max(0, paymentIds.length - (data || []).length),
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      requestedCount: paymentIds.length,
      approvedCount: (data || []).length,
      skippedCount: Math.max(0, paymentIds.length - (data || []).length),
    },
  })
}
