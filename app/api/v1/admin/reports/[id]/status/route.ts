import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { createNotifications } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revokeAllUserSessions } from '@/lib/auth/adminSessions'
import { createAuditLog } from '@/lib/audit'
import { syncAuthUserMetadata } from '@/lib/auth/userMetadata'

const StatusSchema = z.object({
  status: z.enum(['Pending', 'Dismissed', 'Removed', 'Warned', 'Banned']),
  message: z.string().trim().max(1000).optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID()
  const { id } = await context.params
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

  const parsed = StatusSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid report status payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const { data: report, error: reportLookupError } = await (supabase as any)
    .from('admin_moderation_reports')
    .select('id,reporter_id,target_user_id,target_post_id')
    .eq('id', id)
    .single()

  if (reportLookupError || !report) {
    return problemResponse({
      status: 404,
      code: 'REPORT_NOT_FOUND',
      title: 'Report Not Found',
      detail: reportLookupError?.message || 'Report does not exist.',
      requestId,
      retriable: false,
    })
  }

  const normalizedStatus = parsed.data.status.toLowerCase()

  const { error: updateError } = await (supabase as any)
    .from('admin_moderation_reports')
    .update({ status: normalizedStatus, reviewed_by: user.id })
    .eq('id', id)

  if (updateError) {
    return problemResponse({
      status: 500,
      code: 'REPORT_STATUS_UPDATE_FAILED',
      title: 'Report Update Failed',
      detail: updateError.message,
      requestId,
    })
  }

  if (normalizedStatus === 'removed' && report.target_post_id) {
    await (supabase as any)
      .from('community_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', report.target_post_id)
  }

  let moderationTicketId: string | null = null
  let moderationActionUrl = '/support'

  if ((normalizedStatus === 'warned' || normalizedStatus === 'removed') && report.target_user_id) {
    try {
      const { data: targetProfile } = await (supabase as any)
        .from('profiles')
        .select('id,role')
        .eq('id', report.target_user_id)
        .maybeSingle()

      if (targetProfile?.id) {
        const requesterRole = String(targetProfile.role || '').toLowerCase() === 'coach' ? 'coach' : 'user'
        moderationActionUrl = requesterRole === 'coach' ? '/coach/support' : '/support'

        const defaultMessage =
          normalizedStatus === 'warned'
            ? 'Your content was blocked and needs changes. Please update the content and reply in this thread once fixed.'
            : 'Your content was removed by moderation. Please review the details and reply if you need clarification.'

        const adminMessage = parsed.data.message?.trim() || defaultMessage

        const { data: existingTicket } = await (supabaseAdmin as any)
          .from('support_tickets')
          .select('id,status')
          .eq('requester_id', report.target_user_id)
          .eq('category', 'content_moderation')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingTicket?.id) {
          moderationTicketId = String(existingTicket.id)
          if (String(existingTicket.status || '').toLowerCase() === 'done') {
            await (supabaseAdmin as any)
              .from('support_tickets')
              .update({
                status: 'in_progress',
                closed_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', moderationTicketId)
          }
        } else {
          const { data: insertedTicket } = await (supabaseAdmin as any)
            .from('support_tickets')
            .insert({
              requester_id: report.target_user_id,
              requester_role: requesterRole,
              subject: normalizedStatus === 'warned' ? 'Content update requested' : 'Content removed by moderation',
              category: 'content_moderation',
              status: 'in_progress',
            })
            .select('id')
            .single()

          moderationTicketId = insertedTicket?.id ? String(insertedTicket.id) : null
        }

        if (moderationTicketId) {
          await (supabaseAdmin as any).from('support_ticket_messages').insert({
            ticket_id: moderationTicketId,
            sender_id: user.id,
            sender_role: 'admin',
            message: adminMessage,
          })
        }
      }
    } catch {
      moderationTicketId = null
    }
  }

  if (normalizedStatus === 'banned' && report.target_user_id) {
    await (supabase as any)
      .from('profiles')
      .update({
        account_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: user.id,
        suspension_reason: 'Banned via moderation workflow',
      })
      .eq('id', report.target_user_id)
    await syncAuthUserMetadata(String(report.target_user_id), {
      account_status: 'suspended',
    })
    await revokeAllUserSessions(String(report.target_user_id))
  }

  const notifications = [] as Array<{
    recipientId: string
    actorId: string
    type: string
    title: string
    body: string
    actionUrl: string
    payload: Record<string, unknown>
  }>

  if (report.reporter_id) {
    notifications.push({
      recipientId: String(report.reporter_id),
      actorId: user.id,
      type: 'admin_report_status',
      title: 'Moderation report updated',
      body: `A report status was updated to ${parsed.data.status}.`,
      actionUrl: '/notifications',
      payload: {
        reportId: id,
        status: normalizedStatus,
      },
    })
  }

  if (report.target_user_id) {
    notifications.push({
      recipientId: String(report.target_user_id),
      actorId: user.id,
      type: 'admin_report_status',
      title: 'Action required on your reported content',
      body:
        normalizedStatus === 'warned'
          ? 'Your content was blocked and needs changes. Open support to review and reply.'
          : `A report status on your content was updated to ${parsed.data.status}.`,
      actionUrl: moderationTicketId ? moderationActionUrl : '/notifications',
      payload: {
        reportId: id,
        status: normalizedStatus,
        ticketId: moderationTicketId,
      },
    })
  }

  if (notifications.length) {
    await createNotifications(supabaseAdmin as any, notifications)
  }

  await createAuditLog(supabaseAdmin as any, {
    userId: user.id,
    action: 'admin.report.status.updated',
    resource: 'admin_moderation_reports',
    resourceId: id,
    metadata: {
      status: normalizedStatus,
      targetUserId: report.target_user_id,
      targetPostId: report.target_post_id,
    },
    userAgent: request.headers.get('user-agent'),
  })

  return dataResponse({
    requestId,
    data: {
      id,
      status: parsed.data.status,
    },
  })
}
