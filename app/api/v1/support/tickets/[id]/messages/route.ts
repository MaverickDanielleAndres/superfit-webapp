import { z } from 'zod'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotifications } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSupportAuth, supportActionUrlForRole } from '@/app/api/v1/support/_shared'

const CreateMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

async function getTicketForUser(supabase: any, ticketId: string, userId: string, isAdmin: boolean) {
  let query = (supabase as any)
    .from('support_tickets')
    .select('id,requester_id,requester_role,status,subject,category')
    .eq('id', ticketId)
    .is('deleted_at', null)

  if (!isAdmin) {
    query = query.eq('requester_id', userId)
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) {
    return null
  }

  return data as {
    id: string
    requester_id: string
    requester_role: 'user' | 'coach'
    status: 'pending' | 'in_progress' | 'done'
    subject: string
    category: string
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {    return authResult.response
  }

  const { ctx } = authResult

  const ticket = await getTicketForUser(ctx.supabase, id, ctx.userId, ctx.isAdmin)
  if (!ticket) {
    return problemResponse({
      status: 404,
      code: 'SUPPORT_TICKET_NOT_FOUND',
      title: 'Support Ticket Not Found',
      detail: 'Ticket does not exist or you do not have access.',
      requestId,
      retriable: false,
    })
  }

  const { data, error } = await (ctx.supabase as any)
    .from('support_ticket_messages')
    .select('id,ticket_id,sender_id,sender_role,message,created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_MESSAGES_FETCH_FAILED',
      title: 'Support Messages Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const rows = Array.isArray(data) ? data : []
  const senderIds = Array.from(
    new Set(
      rows
        .map((row: { sender_id?: string | null }) => String(row.sender_id || '').trim())
        .filter(Boolean),
    ),
  )

  const senderMap = new Map<string, { full_name?: string | null; email?: string | null }>()

  if (senderIds.length) {
    const { data: senders } = await (ctx.supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .in('id', senderIds)

    for (const sender of senders || []) {
      const senderId = String(sender.id || '').trim()
      if (!senderId) continue
      senderMap.set(senderId, {
        full_name: sender.full_name,
        email: sender.email,
      })
    }
  }

  return dataResponse({
    requestId,
    data: {
      ticket,
      messages: rows.map((row: Record<string, unknown>) => {
        const senderId = String(row.sender_id || '')
        return {
          id: String(row.id || ''),
          ticketId: String(row.ticket_id || id),
          senderId,
          senderRole: String(row.sender_role || ''),
          message: String(row.message || ''),
          createdAt: String(row.created_at || new Date().toISOString()),
          sender: senderId
            ? {
                fullName: senderMap.get(senderId)?.full_name || null,
                email: senderMap.get(senderId)?.email || null,
              }
            : null,
        }
      }),
    },
  })
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {
    return authResult.response
  }

  const { ctx } = authResult

  const ticket = await getTicketForUser(ctx.supabase, id, ctx.userId, ctx.isAdmin)
  if (!ticket) {
    return problemResponse({
      status: 404,
      code: 'SUPPORT_TICKET_NOT_FOUND',
      title: 'Support Ticket Not Found',
      detail: 'Ticket does not exist or you do not have access.',
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

  const parsed = CreateMessageSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid support message payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const senderRole = ctx.isAdmin ? 'admin' : ticket.requester_role

  const { data: insertedMessage, error: messageError } = await (ctx.supabase as any)
    .from('support_ticket_messages')
    .insert({
      ticket_id: id,
      sender_id: ctx.userId,
      sender_role: senderRole,
      message: parsed.data.message,
    })
    .select('id,ticket_id,sender_id,sender_role,message,created_at')
    .single()

  if (messageError || !insertedMessage) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_MESSAGE_CREATE_FAILED',
      title: 'Support Message Create Failed',
      detail: messageError?.message || 'Unable to send support message.',
      requestId,
    })
  }

  const nextStatus = !ctx.isAdmin && ticket.status === 'done' ? 'in_progress' : ticket.status

  const { error: ticketTouchError } = await (ctx.supabase as any)
    .from('support_tickets')
    .update({
      status: nextStatus,
      closed_at: nextStatus === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      admin_assignee_id: ctx.isAdmin ? ctx.userId : null,
    })
    .eq('id', id)

  if (ticketTouchError) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKET_TOUCH_FAILED',
      title: 'Support Ticket Update Failed',
      detail: ticketTouchError.message,
      requestId,
    })
  }

  if (ctx.isAdmin) {
    await createNotifications(supabaseAdmin as any, [
      {
        recipientId: ticket.requester_id,
        actorId: ctx.userId,
        type: 'support_ticket_message',
        title: 'New reply from support',
        body: `Support replied to: ${ticket.subject}`,
        actionUrl: supportActionUrlForRole(ticket.requester_role),
        payload: {
          ticketId: id,
          category: ticket.category,
        },
      },
    ])
  } else {
    const { data: admins } = await (ctx.supabase as any)
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('account_status', 'active')

    const adminIds: string[] = Array.from(
      new Set<string>(
        (admins || [])
          .map((row: { id?: string | null }) => String(row.id || '').trim())
          .filter(Boolean),
      ),
    )

    if (adminIds.length) {
      await createNotifications(
        supabaseAdmin as any,
        adminIds.map((adminId) => ({
          recipientId: adminId,
          actorId: ctx.userId,
          type: 'support_ticket_message',
          title: 'New support ticket reply',
          body: `${ticket.requester_role === 'coach' ? 'Coach' : 'Client'} replied: ${ticket.subject}`,
          actionUrl: '/admin/support',
          payload: {
            ticketId: id,
            category: ticket.category,
          },
        })),
      )
    }
  }

  return dataResponse({
    requestId,
    data: {
      message: {
        id: String(insertedMessage.id),
        ticketId: String(insertedMessage.ticket_id),
        senderId: String(insertedMessage.sender_id),
        senderRole: String(insertedMessage.sender_role),
        message: String(insertedMessage.message),
        createdAt: String(insertedMessage.created_at || new Date().toISOString()),
      },
      status: nextStatus,
    },
  })
}
