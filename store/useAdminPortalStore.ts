import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

export interface AdminUserItem {
  id: string
  name: string
  email: string
  role: 'User' | 'Coach' | 'Admin'
  status: 'Active' | 'Suspended' | 'Inactive'
  joined: string
  isPremium: boolean
}

export interface AdminCoachItem {
  id: string
  name: string
  email: string
  clients: number
  status: 'Verified' | 'Pending Review' | 'Suspended'
  revenue: string
}

export interface AdminApplicationItem {
  id: string
  applicantId?: string
  name: string
  email: string
  specialties: string[]
  experienceYears: number
  certificateUrl?: string
  submittedAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export interface AdminPaymentItem {
  id: string
  user: string
  coach: string
  amount: string
  status: 'Succeeded' | 'Failed' | 'Refunded' | 'Pending'
  date: string
}

export interface AdminReportItem {
  id: string
  reporter: string
  reason: string
  contentType: string
  status: 'Pending' | 'Dismissed' | 'Removed' | 'Warned' | 'Banned'
  createdAt: string
  notes: string
  targetUserId?: string
  targetPostId?: string
}

interface AdminSettingsState {
  maintenanceMode: boolean
  platformFeePercent: number
  autoApproveCoaches: boolean
}

interface AdminPortalState {
  adminId: string | null
  users: AdminUserItem[]
  coaches: AdminCoachItem[]
  applications: AdminApplicationItem[]
  payments: AdminPaymentItem[]
  reports: AdminReportItem[]
  settings: AdminSettingsState
  isLoading: boolean
  error: string | null

  initialize: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchCoaches: () => Promise<void>
  fetchApplications: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchReports: () => Promise<void>
  fetchSettings: () => Promise<void>

  updateUserStatus: (userId: string, status: AdminUserItem['status']) => Promise<void>
  togglePremium: (userId: string, enabled: boolean) => Promise<void>
  updateApplicationStatus: (applicationId: string, status: AdminApplicationItem['status']) => Promise<void>
  updateReportStatus: (reportId: string, status: AdminReportItem['status']) => Promise<void>
  saveSettings: (next: Partial<AdminSettingsState>) => Promise<void>
}

export const useAdminPortalStore = create<AdminPortalState>((set, get) => ({
  adminId: null,
  users: [],
  coaches: [],
  applications: [],
  payments: [],
  reports: [],
  settings: {
    maintenanceMode: false,
    platformFeePercent: 10,
    autoApproveCoaches: true,
  },
  isLoading: false,
  error: null,

  initialize: async () => {
    if (!isSupabaseAuthEnabled()) return

    set({ isLoading: true, error: null })
    const adminId = await getAuthenticatedUserId()

    if (!adminId) {
      set({ isLoading: false, error: 'Admin is not authenticated.' })
      return
    }

    set({ adminId })

    try {
      await Promise.all([
        get().fetchUsers(),
        get().fetchCoaches(),
        get().fetchApplications(),
        get().fetchPayments(),
        get().fetchReports(),
        get().fetchSettings(),
      ])
      set({ isLoading: false, error: null })
    } catch (error) {
      set({ isLoading: false, error: toErrorMessage(error, 'Unable to load admin portal data.') })
    }
  },

  fetchUsers: async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email,role,account_status,is_premium,created_at')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message })
      return
    }

    const users: AdminUserItem[] = (data || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.full_name || row.email || 'User'),
      email: String(row.email || ''),
      role: normalizeRole(row.role),
      status: normalizeAccountStatus(row.account_status),
      joined: formatDateLabel(String(row.created_at || new Date().toISOString())),
      isPremium: Boolean(row.is_premium),
    }))

    set({ users })
  },

  fetchCoaches: async () => {
    const supabase = createClient()
    const { data: coachesData, error: coachesError } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email,account_status')
      .eq('role', 'coach')
      .order('created_at', { ascending: false })

    if (coachesError) {
      set({ error: coachesError.message })
      return
    }

    const coachIds = (coachesData || []).map((row: any) => row.id)

    const [clientLinksResult, paymentResult] = await Promise.all([
      (supabase as any)
        .from('coach_client_links')
        .select('coach_id')
        .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000']),
      (supabase as any)
        .from('payment_transactions')
        .select('coach_id,amount_cents,status')
        .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000'])
    ])

    const clientLinks = clientLinksResult.data || []
    const payments = paymentResult.data || []

    const clientCountMap = new Map<string, number>()
    for (const link of clientLinks) {
      const coachId = String(link.coach_id || '')
      clientCountMap.set(coachId, (clientCountMap.get(coachId) || 0) + 1)
    }

    const revenueMap = new Map<string, number>()
    for (const payment of payments) {
      const coachId = String(payment.coach_id || '')
      if (String(payment.status || '').toLowerCase() !== 'succeeded') continue
      revenueMap.set(coachId, (revenueMap.get(coachId) || 0) + Number(payment.amount_cents || 0))
    }

    const coaches: AdminCoachItem[] = (coachesData || []).map((row: any) => {
      const coachId = String(row.id)
      return {
        id: coachId,
        name: String(row.full_name || row.email || 'Coach'),
        email: String(row.email || ''),
        clients: clientCountMap.get(coachId) || 0,
        status: row.account_status === 'suspended' ? 'Suspended' : 'Verified',
        revenue: formatCurrencyCents(revenueMap.get(coachId) || 0),
      }
    })

    set({ coaches })
  },

  fetchApplications: async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('admin_coach_applications')
      .select('id,applicant_id,full_name,email,specialties,experience_years,certificate_url,status,submitted_at')
      .order('submitted_at', { ascending: false })

    if (error) {
      set({ error: error.message })
      return
    }

    const applications: AdminApplicationItem[] = (data || []).map((row: any) => ({
      id: String(row.id),
      applicantId: row.applicant_id ? String(row.applicant_id) : undefined,
      name: String(row.full_name || 'Applicant'),
      email: String(row.email || ''),
      specialties: Array.isArray(row.specialties) ? row.specialties.map((entry: unknown) => String(entry)) : [],
      experienceYears: Number(row.experience_years || 0),
      certificateUrl: row.certificate_url ? String(row.certificate_url) : undefined,
      submittedAt: formatDateLabel(String(row.submitted_at || new Date().toISOString())),
      status: normalizeApplicationStatus(row.status),
    }))

    set({ applications })
  },

  fetchPayments: async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('payment_transactions')
      .select('id,user_id,coach_id,amount_cents,status,currency,created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      set({ error: error.message })
      return
    }

    const rows = data || []
    const userIds = new Set<string>()
    for (const row of rows) {
      if (row.user_id) userIds.add(String(row.user_id))
      if (row.coach_id) userIds.add(String(row.coach_id))
    }

    const { data: profilesData } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .in('id', Array.from(userIds))

    const nameById = new Map<string, string>()
    for (const profile of profilesData || []) {
      const id = String(profile.id || '')
      const label = String(profile.full_name || profile.email || 'User')
      nameById.set(id, label)
    }

    const payments: AdminPaymentItem[] = rows.map((row: any) => ({
      id: String(row.id),
      user: nameById.get(String(row.user_id || '')) || 'User',
      coach: nameById.get(String(row.coach_id || '')) || 'Coach',
      amount: formatCurrencyCents(Number(row.amount_cents || 0), String(row.currency || 'usd')),
      status: normalizePaymentStatus(row.status),
      date: formatDateTimeLabel(String(row.created_at || new Date().toISOString())),
    }))

    set({ payments })
  },

  fetchReports: async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('admin_moderation_reports')
      .select('id,reason,content_type,status,created_at,notes,target_user_id,target_post_id,reporter:profiles(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      set({ error: error.message })
      return
    }

    const reports: AdminReportItem[] = (data || []).map((row: any) => {
      const reporter = row.reporter || {}
      return {
        id: String(row.id),
        reporter: String(reporter.full_name || reporter.email || 'User'),
        reason: String(row.reason || ''),
        contentType: String(row.content_type || 'post'),
        status: normalizeReportStatus(row.status),
        createdAt: formatDateTimeLabel(String(row.created_at || new Date().toISOString())),
        notes: String(row.notes || ''),
        targetUserId: row.target_user_id ? String(row.target_user_id) : undefined,
        targetPostId: row.target_post_id ? String(row.target_post_id) : undefined,
      }
    })

    set({ reports })
  },

  fetchSettings: async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('platform_settings')
      .select('setting_key,setting_value')

    if (error) {
      set({ error: error.message })
      return
    }

    const map = new Map<string, any>()
    for (const row of data || []) {
      map.set(String(row.setting_key), row.setting_value || {})
    }

    set({
      settings: {
        maintenanceMode: Boolean(map.get('maintenance_mode')?.enabled),
        platformFeePercent: Number(map.get('platform_fee_percent')?.value || 10),
        autoApproveCoaches: Boolean(map.get('auto_approve_coaches')?.enabled ?? true),
      },
    })
  },

  updateUserStatus: async (userId, status) => {
    const supabase = createClient()
    const payload = { account_status: status.toLowerCase() }

    const { error } = await (supabase as any)
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    if (error) {
      set({ error: error.message })
      return
    }

    await Promise.all([get().fetchUsers(), get().fetchCoaches()])
  },

  togglePremium: async (userId, enabled) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ is_premium: enabled })
      .eq('id', userId)

    if (error) {
      set({ error: error.message })
      return
    }

    await get().fetchUsers()
  },

  updateApplicationStatus: async (applicationId, status) => {
    const adminId = get().adminId ?? (await getAuthenticatedUserId())
    if (!adminId) return

    const supabase = createClient()
    const normalizedStatus = status.toLowerCase()

    const { data: application, error: selectError } = await (supabase as any)
      .from('admin_coach_applications')
      .select('id,applicant_id')
      .eq('id', applicationId)
      .single()

    if (selectError || !application) {
      set({ error: selectError?.message || 'Application not found.' })
      return
    }

    const { error } = await (supabase as any)
      .from('admin_coach_applications')
      .update({ status: normalizedStatus, reviewed_at: new Date().toISOString(), reviewed_by: adminId })
      .eq('id', applicationId)

    if (error) {
      set({ error: error.message })
      return
    }

    if (application.applicant_id && normalizedStatus === 'approved') {
      await (supabase as any)
        .from('profiles')
        .update({ role: 'coach', account_status: 'active' })
        .eq('id', application.applicant_id)
    }

    if (isSupabaseAuthEnabled()) {
      const { error: invokeError } = await supabase.functions.invoke('on-application-status-updated', {
        body: {
          applicationId,
        },
      })

      if (invokeError) {
        set({ error: `Application updated but notification failed: ${invokeError.message}` })
      }
    }

    await Promise.all([get().fetchApplications(), get().fetchUsers(), get().fetchCoaches()])
  },

  updateReportStatus: async (reportId, status) => {
    const adminId = get().adminId ?? (await getAuthenticatedUserId())
    if (!adminId) return

    const supabase = createClient()
    const { data: report, error: reportLookupError } = await (supabase as any)
      .from('admin_moderation_reports')
      .select('id,target_user_id,target_post_id')
      .eq('id', reportId)
      .single()

    if (reportLookupError || !report) {
      set({ error: reportLookupError?.message || 'Report not found.' })
      return
    }

    const { error } = await (supabase as any)
      .from('admin_moderation_reports')
      .update({ status: status.toLowerCase(), reviewed_by: adminId })
      .eq('id', reportId)

    if (error) {
      set({ error: error.message })
      return
    }

    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus === 'removed' && report.target_post_id) {
      const { error: removeError } = await (supabase as any)
        .from('community_posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', report.target_post_id)

      if (removeError) {
        set({ error: removeError.message })
      }
    }

    if (normalizedStatus === 'banned' && report.target_user_id) {
      const { error: banError } = await (supabase as any)
        .from('profiles')
        .update({ account_status: 'suspended' })
        .eq('id', report.target_user_id)

      if (banError) {
        set({ error: banError.message })
      }
    }

    await Promise.all([get().fetchReports(), get().fetchUsers(), get().fetchCoaches()])
  },

  saveSettings: async (next) => {
    const adminId = get().adminId ?? (await getAuthenticatedUserId())
    if (!adminId) return

    const merged = { ...get().settings, ...next }

    const rows = [
      { setting_key: 'maintenance_mode', setting_value: { enabled: merged.maintenanceMode }, updated_by: adminId },
      { setting_key: 'platform_fee_percent', setting_value: { value: merged.platformFeePercent }, updated_by: adminId },
      { setting_key: 'auto_approve_coaches', setting_value: { enabled: merged.autoApproveCoaches }, updated_by: adminId },
    ]

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('platform_settings')
      .upsert(rows, { onConflict: 'setting_key' })

    if (error) {
      set({ error: error.message })
      return
    }

    set({ settings: merged })
  },
}))

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseAuthEnabled()) return null
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

function normalizeRole(value: unknown): AdminUserItem['role'] {
  const role = String(value || '').toLowerCase()
  if (role === 'coach') return 'Coach'
  if (role === 'admin') return 'Admin'
  return 'User'
}

function normalizeAccountStatus(value: unknown): AdminUserItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'suspended') return 'Suspended'
  if (status === 'inactive') return 'Inactive'
  return 'Active'
}

function normalizeApplicationStatus(value: unknown): AdminApplicationItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

function normalizePaymentStatus(value: unknown): AdminPaymentItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'failed') return 'Failed'
  if (status === 'refunded') return 'Refunded'
  if (status === 'pending') return 'Pending'
  return 'Succeeded'
}

function normalizeReportStatus(value: unknown): AdminReportItem['status'] {
  const status = String(value || '').toLowerCase()
  if (status === 'dismissed') return 'Dismissed'
  if (status === 'removed') return 'Removed'
  if (status === 'warned') return 'Warned'
  if (status === 'banned') return 'Banned'
  return 'Pending'
}

function formatCurrencyCents(amountCents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTimeLabel(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
