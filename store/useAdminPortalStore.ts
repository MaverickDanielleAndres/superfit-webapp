import { create } from 'zustand'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { requestApi } from '@/lib/api/client'

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
    try {
      const response = await requestApi<{
        users: Array<{
          id: string
          full_name: string | null
          email: string | null
          role: string | null
          account_status: string | null
          is_premium: boolean | null
          created_at: string | null
        }>
      }>('/api/v1/admin/users')

      const users: AdminUserItem[] = (response.data.users || []).map((row) => ({
        id: String(row.id),
        name: String(row.full_name || row.email || 'User'),
        email: String(row.email || ''),
        role: normalizeRole(row.role),
        status: normalizeAccountStatus(row.account_status),
        joined: formatDateLabel(String(row.created_at || new Date().toISOString())),
        isPremium: Boolean(row.is_premium),
      }))

      set({ users })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch users.') })
      return
    }
  },

  fetchCoaches: async () => {
    try {
      const response = await requestApi<{
        coaches: Array<{
          id: string
          full_name: string | null
          email: string | null
          account_status: string | null
        }>
        clientLinks: Array<{ coach_id: string | null }>
        payments: Array<{ coach_id: string | null; amount_cents: number | null; status: string | null }>
      }>('/api/v1/admin/coaches')

      const clientCountMap = new Map<string, number>()
      for (const link of response.data.clientLinks || []) {
        const coachId = String(link.coach_id || '')
        clientCountMap.set(coachId, (clientCountMap.get(coachId) || 0) + 1)
      }

      const revenueMap = new Map<string, number>()
      for (const payment of response.data.payments || []) {
        const coachId = String(payment.coach_id || '')
        if (String(payment.status || '').toLowerCase() !== 'succeeded') continue
        revenueMap.set(coachId, (revenueMap.get(coachId) || 0) + Number(payment.amount_cents || 0))
      }

      const coaches: AdminCoachItem[] = (response.data.coaches || []).map((row) => {
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
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch coaches.') })
      return
    }
  },

  fetchApplications: async () => {
    try {
      const response = await requestApi<{
        applications: Array<{
          id: string
          applicant_id: string | null
          full_name: string | null
          email: string | null
          specialties: unknown
          experience_years: number | null
          certificate_url: string | null
          status: string | null
          submitted_at: string | null
        }>
      }>('/api/v1/admin/applications')

      const applications: AdminApplicationItem[] = (response.data.applications || []).map((row) => ({
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
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch applications.') })
      return
    }
  },

  fetchPayments: async () => {
    try {
      const response = await requestApi<{
        payments: Array<{
          id: string
          user_id: string | null
          coach_id: string | null
          amount_cents: number | null
          status: string | null
          currency: string | null
          created_at: string | null
        }>
        profiles: Array<{ id: string; name: string }>
      }>('/api/v1/admin/payments')

      const rows = response.data.payments || []
      const nameById = new Map<string, string>()
      for (const profile of response.data.profiles || []) {
        nameById.set(String(profile.id || ''), String(profile.name || 'User'))
      }

      const payments: AdminPaymentItem[] = rows.map((row) => ({
        id: String(row.id),
        user: nameById.get(String(row.user_id || '')) || 'User',
        coach: nameById.get(String(row.coach_id || '')) || 'Coach',
        amount: formatCurrencyCents(Number(row.amount_cents || 0), String(row.currency || 'usd')),
        status: normalizePaymentStatus(row.status),
        date: formatDateTimeLabel(String(row.created_at || new Date().toISOString())),
      }))

      set({ payments })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch payments.') })
      return
    }
  },

  fetchReports: async () => {
    try {
      const response = await requestApi<{
        reports: Array<{
          id: string
          reason: string | null
          content_type: string | null
          status: string | null
          created_at: string | null
          notes: string | null
          target_user_id: string | null
          target_post_id: string | null
          reporter?: { full_name?: string | null; email?: string | null }
        }>
      }>('/api/v1/admin/reports')

      const reports: AdminReportItem[] = (response.data.reports || []).map((row) => {
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
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch reports.') })
      return
    }
  },

  fetchSettings: async () => {
    try {
      const response = await requestApi<{
        maintenanceMode: boolean
        platformFeePercent: number
        autoApproveCoaches: boolean
      }>('/api/v1/admin/settings')

      set({
        settings: {
          maintenanceMode: Boolean(response.data.maintenanceMode),
          platformFeePercent: Number(response.data.platformFeePercent || 10),
          autoApproveCoaches: Boolean(response.data.autoApproveCoaches),
        },
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch admin settings.') })
      return
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update user status.') })
      return
    }

    await Promise.all([get().fetchUsers(), get().fetchCoaches()])
  },

  togglePremium: async (userId, enabled) => {
    try {
      await requestApi<{ id: string; enabled: boolean }>(`/api/v1/admin/users/${userId}/premium`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update premium status.') })
      return
    }

    await get().fetchUsers()
  },

  updateApplicationStatus: async (applicationId, status) => {
    try {
      const response = await requestApi<{ notificationFailed?: boolean; notificationError?: string }>(`/api/v1/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      if (response.data.notificationFailed && response.data.notificationError) {
        set({ error: `Application updated but notification failed: ${response.data.notificationError}` })
      }
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update application status.') })
      return
    }

    await Promise.all([get().fetchApplications(), get().fetchUsers(), get().fetchCoaches()])
  },

  updateReportStatus: async (reportId, status) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to update report status.') })
      return
    }

    await Promise.all([get().fetchReports(), get().fetchUsers(), get().fetchCoaches()])
  },

  saveSettings: async (next) => {
    const merged = { ...get().settings, ...next }

    try {
      await requestApi<{ updated: boolean }>('/api/v1/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          maintenanceMode: merged.maintenanceMode,
          platformFeePercent: merged.platformFeePercent,
          autoApproveCoaches: merged.autoApproveCoaches,
        }),
      })
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to save admin settings.') })
      return
    }

    set({ settings: merged })
  },
}))

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseAuthEnabled()) return null

  try {
    const response = await requestApi<{ id: string }>('/api/v1/auth/me')
    return String(response.data.id || '') || null
  } catch {
    return null
  }
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
