import { z } from 'zod'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotifications } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  normalizeSearchTerm,
  normalizeSupportRole,
  parsePositiveInt,
  requireSupportAuth,
  supportActionUrlForRole,
} from '@/app/api/v1/support/_shared'

const ALLOWED_STATUSES = new Set(['pending', 'in_progress', 'done'])
const ALLOWED_REQUESTER_ROLES = new Set(['user', 'coach'])

const CreateTicketSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(80).optional(),
  message: z.string().trim().min(1).max(2000),
})

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {
    return authResult.response
  }

  const { ctx } = authResult
  const params = new URL(request.url).searchParams

  const page = parsePositiveInt(params.get('page'), 1, 1, 10_000)
  const pageSize = parsePositiveInt(params.get('pageSize'), 20, 1, 100)
  const status = String(params.get('status') || '').trim().toLowerCase()
  const requesterRole = String(params.get('requesterRole') || '').trim().toLowerCase()
  const search = normalizeSearchTerm(params.get('search'))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (ctx.supabase as any)
    .from('support_tickets')
    .select(
      'id,requester_id,requester_role,subject,category,status,admin_assignee_id,created_at,updated_at,closed_at',
      { count: 'exact' },
    )
    .is('deleted_at', null)

  if (!ctx.isAdmin) {
    query = query.eq('requester_id', ctx.userId)
  }

  if (status && ALLOWED_STATUSES.has(status)) {
    query = query.eq('status', status)
  }

  if (ctx.isAdmin && requesterRole && ALLOWED_REQUESTER_ROLES.has(requesterRole)) {
    query = query.eq('requester_role', requesterRole)
  }

  if (search.length) {
    const escapedSearch = search.replaceAll(',', ' ').replaceAll('.', ' ')
    query = query.or(`subject.ilike.%${escapedSearch}%,category.ilike.%${escapedSearch}%`)
  }

  const { data, error, count } = await query.order('updated_at', { ascending: false }).range(from, to)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKETS_FETCH_FAILED',
      title: 'Support Tickets Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const ticketRows = Array.isArray(data) ? data : []
  const profileIds = Array.from(
    new Set(
      ticketRows
        .flatMap((row: Record<string, unknown>) => [String(row.requester_id || ''), String(row.admin_assignee_id || '')])
        .filter(Boolean),
    ),
  )

  const profileMap = new Map<string, { full_name?: string | null; email?: string | null }>()
  if (profileIds.length) {
    const { data: profiles } = await (ctx.supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .in('id', profileIds)

    for (const profile of profiles || []) {
      const profileId = String(profile.id || '')
      if (!profileId) continue
      profileMap.set(profileId, {
        full_name: profile.full_name,
        email: profile.email,
      })
    }
  }

  const tickets = ticketRows.map((row: Record<string, unknown>) => {
    const requesterId = String(row.requester_id || '')
    const assigneeId = String(row.admin_assignee_id || '')

    return {
      id: String(row.id || ''),
      subject: String(row.subject || ''),
      category: String(row.category || 'general'),
      status: String(row.status || 'pending'),
      requesterId,
      requesterRole: normalizeSupportRole(row.requester_role) || 'user',
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),
      closedAt: row.closed_at ? String(row.closed_at) : null,
      requester: requesterId
        ? {
            fullName: profileMap.get(requesterId)?.full_name || null,
            email: profileMap.get(requesterId)?.email || null,
          }
        : null,
      assignee: assigneeId
        ? {
            fullName: profileMap.get(assigneeId)?.full_name || null,
            email: profileMap.get(assigneeId)?.email || null,
          }
        : null,
    }
  })

  const total = Number(count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return dataResponse({
    requestId,
    data: {
      tickets,
      total,
      page,
      pageSize,
      totalPages,
    },
  })
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const authResult = await requireSupportAuth(requestId)

  if (!authResult.ok) {
    return authResult.response
  }

  const { ctx } = authResult

  if (ctx.isAdmin) {
    return problemResponse({
      status: 403,
      code: 'FORBIDDEN',
      title: 'Forbidden',
      detail: 'Admins cannot create requester-side support tickets from this endpoint.',
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

  const parsed = CreateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid support ticket payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const requesterRole = ctx.role === 'coach' ? 'coach' : 'user'
  const category = parsed.data.category?.toLowerCase().replace(/\s+/g, '_') || 'general'

  const { data: insertedTicket, error: ticketInsertError } = await (ctx.supabase as any)
    .from('support_tickets')
    .insert({
      requester_id: ctx.userId,
      requester_role: requesterRole,
      subject: parsed.data.subject,
      category,
      status: 'pending',
    })
    .select('id,subject,category,status,created_at,updated_at')
    .single()

  if (ticketInsertError || !insertedTicket) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKET_CREATE_FAILED',
      title: 'Support Ticket Create Failed',
      detail: ticketInsertError?.message || 'Unable to create support ticket.',
      requestId,
    })
  }

  const { error: messageInsertError } = await (ctx.supabase as any).from('support_ticket_messages').insert({
    ticket_id: insertedTicket.id,
    sender_id: ctx.userId,
    sender_role: requesterRole,
    message: parsed.data.message,
  })

  if (messageInsertError) {
    return problemResponse({
      status: 500,
      code: 'SUPPORT_TICKET_MESSAGE_CREATE_FAILED',
      title: 'Support Ticket Message Create Failed',
      detail: messageInsertError.message,
      requestId,
    })
  }

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
        type: 'support_ticket_created',
        title: 'New support ticket',
        body: `${requesterRole === 'coach' ? 'Coach' : 'Client'} submitted: ${parsed.data.subject}`,
        actionUrl: '/admin/support',
        payload: {
          ticketId: insertedTicket.id,
          requesterRole,
          category,
        },
      })),
    )
  }

  return dataResponse({
    requestId,
    data: {
      ticket: {
        id: String(insertedTicket.id),
        subject: String(insertedTicket.subject),
        category: String(insertedTicket.category),
        status: String(insertedTicket.status),
        requesterRole,
        createdAt: String(insertedTicket.created_at || new Date().toISOString()),
        updatedAt: String(insertedTicket.updated_at || new Date().toISOString()),
      },
      actionUrl: supportActionUrlForRole(requesterRole),
    },
  })
}
