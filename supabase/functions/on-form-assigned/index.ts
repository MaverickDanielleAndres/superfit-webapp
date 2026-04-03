// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmailWithResend } from '../_shared/resend.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for edge function.')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization header required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: userError?.message || 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role,full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['coach', 'admin'].includes(String(profile.role))) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = await request.json()
  const assignmentIds = Array.isArray(payload?.assignmentIds)
    ? payload.assignmentIds.map((id: unknown) => String(id)).filter(Boolean)
    : []

  if (!assignmentIds.length) {
    return new Response(JSON.stringify({ error: 'assignmentIds are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: assignments, error: assignmentError } = await serviceClient
    .from('coach_form_assignments')
    .select('id,deadline,client:profiles(full_name,email),form:coach_forms(name)')
    .in('id', assignmentIds)

  if (assignmentError) {
    return new Response(JSON.stringify({ error: assignmentError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const coachName = String(profile.full_name || 'Your Coach')
  const sentTo: string[] = []

  for (const assignment of assignments || []) {
    const client = assignment.client as { full_name?: string | null; email?: string | null } | null
    const form = assignment.form as { name?: string | null } | null
    const email = client?.email ? String(client.email) : ''

    if (!email) continue

    const clientName = client?.full_name ? String(client.full_name) : 'Client'
    const formName = form?.name ? String(form.name) : 'New Form'
    const deadline = assignment.deadline
      ? new Date(String(assignment.deadline)).toLocaleDateString()
      : 'No deadline set'

    await sendEmailWithResend({
      to: email,
      subject: `New form assigned: ${formName}`,
      html: `<p>Hi ${clientName},</p><p>${coachName} assigned you a form: <strong>${formName}</strong>.</p><p>Deadline: ${deadline}</p>`,
    })

    sentTo.push(email)
  }

  return new Response(JSON.stringify({ ok: true, sentToCount: sentTo.length, sentTo }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
