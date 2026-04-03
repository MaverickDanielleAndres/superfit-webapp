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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = await request.json()
  const applicationId = String(payload?.applicationId || '')

  if (!applicationId) {
    return new Response(JSON.stringify({ error: 'applicationId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: application, error: applicationError } = await serviceClient
    .from('admin_coach_applications')
    .select('id,applicant_id,full_name,email,status')
    .eq('id', applicationId)
    .single()

  if (applicationError || !application) {
    return new Response(JSON.stringify({ error: applicationError?.message || 'Application not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const status = String(application.status || '').toLowerCase()

  if (status === 'approved' && application.applicant_id) {
    await serviceClient
      .from('profiles')
      .update({ role: 'coach', account_status: 'active' })
      .eq('id', application.applicant_id)
  }

  const emailSubject = status === 'approved'
    ? 'Your SuperFit coach application was approved'
    : status === 'rejected'
      ? 'Your SuperFit coach application update'
      : 'SuperFit coach application status updated'

  const emailBody = status === 'approved'
    ? `<p>Hi ${application.full_name || 'Coach'},</p><p>Your application has been approved. You can now access the coach portal.</p>`
    : status === 'rejected'
      ? `<p>Hi ${application.full_name || 'Applicant'},</p><p>Your application was reviewed and is currently not approved. You may reapply after improving your profile and credentials.</p>`
      : `<p>Hi ${application.full_name || 'Applicant'},</p><p>Your application status was updated to <strong>${application.status}</strong>.</p>`

  const emailResult = await sendEmailWithResend({
    to: application.email,
    subject: emailSubject,
    html: emailBody,
  })

  return new Response(JSON.stringify({
    ok: true,
    applicationId,
    status: application.status,
    email: emailResult,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
