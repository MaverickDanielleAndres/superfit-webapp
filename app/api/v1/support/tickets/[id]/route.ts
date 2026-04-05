import { z } from 'zod'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotifications } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSupportAuth, supportActionUrlForRole } from '@/app/api/v1/support/_shared'

const UpdateTicketSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done']),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {
    return authResult.response
  }

  const { ctx } = authResult

  if (!ctx.isAdmin) {
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

  const parsed = UpdateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid ticket status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: ticket, error: ticketLookupError } = await (ctx.supabase as any)
    .from('support_tickets')
    .select('id,requester_id,requester_role,status')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (ticketLookupError || !ticket) {
    return problemResponse({
      status: 404,
      code: 'SUPPORT_TICKET_NOT_FOUND',
      title: 'Support Ticket Not Found',
      detail: ticketLookupError?.message || 'Ticket does not exist.',
      requestId,
      retriable: false,
    })
  }

  const nextStatus = parsed.data.status
  const closedAt = nextStatus === 'done' ? new Date().toISOString() : null

  const { error: updateError } = await (ctx.supabase as any)
    .from('support_tickets')
    .update({
      status: nextStatus,
      admin_assignee_id: ctx.userId,
      closed_at: closedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKET_UPDATE_FAILED',
      title: 'Support Ticket Update Failed',
      detail: updateError.message,
      requestId,
    })
  }

  if (ticket.requester_id) {
    const requesterRole = String(ticket.requester_role || '').toLowerCase() === 'coach' ? 'coach' : 'user'
    await createNotifications(supabaseAdmin as any, [
      {
        recipientId: String(ticket.requester_id),
        actorId: ctx.userId,
        type: 'support_ticket_status',
        title: 'Support ticket updated',
        body: `Ticket status is now ${nextStatus.replace('_', ' ')}.`,
        actionUrl: supportActionUrlForRole(requesterRole),
        payload: {
          ticketId: id,
          status: nextStatus,
        },
      },
    ])
  }

  return dataResponse({
    requestId,
    data: {
      id,
      status: nextStatus,
      closedAt,
    },
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {
    return authResult.response
  }

  const { ctx } = authResult

  if (!ctx.isAdmin) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admin access required.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await (ctx.supabase as any)
    .from('support_tickets')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKET_DELETE_FAILED',
      title: 'Support Ticket Delete Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      deleted: true,
      id,
    },
  })
}
