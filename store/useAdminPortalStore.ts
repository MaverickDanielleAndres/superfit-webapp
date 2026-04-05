import { create } from 'zustand'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { requestApi } from '@/lib/api/client'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

let adminRealtimeChannel: RealtimeChannel | null = null
let adminRealtimeUserId: string | null = null
let adminRealtimeSubscribers = 0
let adminRealtimeTimers: Partial<Record<'profiles' | 'applications' | 'payments' | 'reports' | 'settings', ReturnType<typeof setTimeout>>> = {}
const ADMIN_CACHE_TTL_MS = 30_000
const adminCacheTimestamps: Record<'users' | 'coaches' | 'applications' | 'payments' | 'reports' | 'settings', number> = {
  users: 0,
  coaches: 0,
  applications: 0,
  payments: 0,
  reports: 0,
  settings: 0,
}

function isCacheFresh(key: keyof typeof adminCacheTimestamps) {
  return Date.now() - adminCacheTimestamps[key] < ADMIN_CACHE_TTL_MS
}

function clearAdminRealtimeTimers() {
  const timers = Object.values(adminRealtimeTimers).filter(Boolean) as ReturnType<typeof setTimeout>[]
  for (const timer of timers) {
    clearTimeout(timer)
  }
  adminRealtimeTimers = {}
}

export interface AdminUserItem {
  id: string
  name: string
  email: string
  role: 'User' | 'Coach' | 'Admin'
  status: 'Active' | 'Suspended' | 'Inactive' | 'Pending Review'
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
  targetUserName?: string
  targetUserEmail?: string
  targetUserRole?: string
}

export interface AdminUsersQueryState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  role: 'all' | 'user' | 'coach' | 'admin'
  status: 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'
  includeDeleted: boolean
}

export interface AdminUsersQueryInput {
  page?: number
  pageSize?: number
  search?: string
  role?: 'all' | 'user' | 'coach' | 'admin'
  status?: 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'
  includeDeleted?: boolean
  force?: boolean
}

export interface AdminCoachesQueryState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  status: 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'
}

export interface AdminCoachesQueryInput {
  page?: number
  pageSize?: number
  search?: string
  status?: 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'
  force?: boolean
}

export interface AdminApplicationsQueryState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  status: 'all' | 'pending' | 'approved' | 'rejected'
  email: string
}

export interface AdminApplicationsQueryInput {
  page?: number
  pageSize?: number
  search?: string
  status?: 'all' | 'pending' | 'approved' | 'rejected'
  email?: string
  force?: boolean
}

export interface AdminPaymentsQueryState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  status: 'all' | 'succeeded' | 'failed' | 'refunded' | 'pending'
}

export interface AdminPaymentsQueryInput {
  page?: number
  pageSize?: number
  search?: string
  status?: 'all' | 'succeeded' | 'failed' | 'refunded' | 'pending'
  force?: boolean
}

export interface AdminReportsQueryState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  status: 'all' | 'pending' | 'dismissed' | 'removed' | 'warned' | 'banned'
  contentType: 'all' | 'image' | 'video' | 'text' | 'post'
  uploaderRole: 'all' | 'coach' | 'user'
  dateFrom: string
  dateTo: string
}

export interface AdminReportsQueryInput {
  page?: number
  pageSize?: number
  search?: string
  status?: 'all' | 'pending' | 'dismissed' | 'removed' | 'warned' | 'banned'
  contentType?: 'all' | 'image' | 'video' | 'text' | 'post'
  uploaderRole?: 'all' | 'coach' | 'user'
  dateFrom?: string
  dateTo?: string
  force?: boolean
}

export interface AdminSettingsState {
  maintenanceMode: boolean
  platformFeePercent: number
  autoApproveCoaches: boolean
  platformName: string
  supportEmail: string

  enforceAdmin2fa: boolean
  maxLoginAttempts: number
  sessionTimeoutMinutes: number
  lockoutMinutes: number

  payoutSchedule: 'weekly' | 'biweekly' | 'monthly'
  autoApprovePayouts: boolean
  allowRefunds: boolean
  refundWindowDays: number
  minimumPayoutCents: number

  enableReadReplicas: boolean
  analyticsRetentionDays: number
  softDeleteRetentionDays: number
  maintenanceWindowUtc: string

  emailOnApplication: boolean
  emailOnReport: boolean
  emailOnPayout: boolean
  inAppBroadcasts: boolean
}

interface AdminPortalState {
  adminId: string | null
  users: AdminUserItem[]
  userPagination: AdminUsersQueryState
  coachPagination: AdminCoachesQueryState
  coaches: AdminCoachItem[]
  applicationPagination: AdminApplicationsQueryState
  applications: AdminApplicationItem[]
  paymentPagination: AdminPaymentsQueryState
  payments: AdminPaymentItem[]
  reportPagination: AdminReportsQueryState
  reports: AdminReportItem[]
  settings: AdminSettingsState
  isLoading: boolean
  error: string | null

  initialize: (options?: { includePayments?: boolean }) => Promise<void>
  fetchUsers: (query?: AdminUsersQueryInput) => Promise<void>
  fetchCoaches: (query?: AdminCoachesQueryInput) => Promise<void>
  fetchApplications: (query?: AdminApplicationsQueryInput) => Promise<void>
  fetchPayments: (query?: AdminPaymentsQueryInput) => Promise<void>
  fetchReports: (query?: AdminReportsQueryInput) => Promise<void>
  fetchSettings: (options?: { force?: boolean }) => Promise<void>
  startRealtime: (adminId: string) => void
  stopRealtime: () => void

  updateUserStatus: (userId: string, status: AdminUserItem['status']) => Promise<void>
  togglePremium: (userId: string, enabled: boolean) => Promise<void>
  updateUser: (
    userId: string,
    payload: {
      fullName?: string
      email?: string
      role?: AdminUserItem['role']
      status?: AdminUserItem['status']
      isPremium?: boolean
    },
  ) => Promise<void>
  softDeleteUser: (userId: string, reason?: string) => Promise<void>
  updateApplicationStatus: (applicationId: string, status: AdminApplicationItem['status']) => Promise<void>
  updateReportStatus: (reportId: string, status: AdminReportItem['status'], message?: string) => Promise<void>
  saveSettings: (next: Partial<AdminSettingsState>) => Promise<void>
}

export const useAdminPortalStore = create<AdminPortalState>((set, get) => ({
  adminId: null,
  users: [],
  userPagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    search: '',
    role: 'all',
    status: 'all',
    includeDeleted: false,
  },
  coachPagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    search: '',
    status: 'all',
  },
  coaches: [],
  applicationPagination: {
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
    search: '',
    status: 'all',
    email: '',
  },
  applications: [],
  paymentPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    search: '',
    status: 'all',
  },
  payments: [],
  reportPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    search: '',
    status: 'all',
    contentType: 'all',
    uploaderRole: 'all',
    dateFrom: '',
    dateTo: '',
  },
  reports: [],
  settings: {
    maintenanceMode: false,
    platformFeePercent: 10,
    autoApproveCoaches: true,
    platformName: 'SuperFit',
    supportEmail: 'support@superfit.app',

    enforceAdmin2fa: true,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    lockoutMinutes: 15,

    payoutSchedule: 'weekly',
    autoApprovePayouts: false,
    allowRefunds: true,
    refundWindowDays: 14,
    minimumPayoutCents: 5000,

    enableReadReplicas: false,
    analyticsRetentionDays: 365,
    softDeleteRetentionDays: 30,
    maintenanceWindowUtc: 'Sun 02:00-03:00 UTC',

    emailOnApplication: true,
    emailOnReport: true,
    emailOnPayout: true,
    inAppBroadcasts: true,
  },
  isLoading: false,
  error: null,

  initialize: async (options) => {
    if (!isSupabaseAuthEnabled()) return

    set({ isLoading: true, error: null })
    const adminId = await getAuthenticatedUserId()

    if (!adminId) {
      set({ isLoading: false, error: 'Admin is not authenticated.' })
      return
    }

    set({ adminId })

    try {
      const includePayments = options?.includePayments ?? false
      const requests: Array<Promise<void>> = [
        get().fetchUsers(),
        get().fetchCoaches(),
        get().fetchApplications(),
        get().fetchReports(),
        get().fetchSettings(),
      ]

      if (includePayments) {
        requests.push(get().fetchPayments())
      }

      await Promise.all([
        ...requests,
      ])
      set({ isLoading: false, error: null })
    } catch (error) {
      set({ isLoading: false, error: toErrorMessage(error, 'Unable to load admin portal data.') })
    }
  },

  fetchUsers: async (query = {}) => {
    const force = Boolean(query.force)
    const currentQuery = get().userPagination
    const nextQuery: AdminUsersQueryState = {
      page: query.page ?? currentQuery.page,
      pageSize: query.pageSize ?? currentQuery.pageSize,
      total: currentQuery.total,
      totalPages: currentQuery.totalPages,
      search: query.search ?? currentQuery.search,
      role: query.role ?? currentQuery.role,
      status: query.status ?? currentQuery.status,
      includeDeleted: query.includeDeleted ?? currentQuery.includeDeleted,
    }

    const hasSameQuery =
      currentQuery.page === nextQuery.page &&
      currentQuery.pageSize === nextQuery.pageSize &&
      currentQuery.search === nextQuery.search &&
      currentQuery.role === nextQuery.role &&
      currentQuery.status === nextQuery.status &&
      currentQuery.includeDeleted === nextQuery.includeDeleted

    if (!force && hasSameQuery && get().users.length > 0 && isCacheFresh('users')) {
      return
    }

    const params = new URLSearchParams({
      page: String(nextQuery.page),
      pageSize: String(nextQuery.pageSize),
    })

    if (nextQuery.search.trim().length) {
      params.set('search', nextQuery.search.trim())
    }

    if (nextQuery.role !== 'all') {
      params.set('role', nextQuery.role)
    }

    if (nextQuery.status !== 'all') {
      params.set('status', nextQuery.status)
    }

    if (nextQuery.includeDeleted) {
      params.set('includeDeleted', 'true')
    }

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
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/v1/admin/users?${params.toString()}`)

      const users: AdminUserItem[] = (response.data.users || []).map((row) => ({
        id: String(row.id),
        name: String(row.full_name || row.email || 'User'),
        email: String(row.email || ''),
        role: normalizeRole(row.role),
        status: normalizeAccountStatus(row.account_status),
        joined: formatDateLabel(String(row.created_at || new Date().toISOString())),
        isPremium: Boolean(row.is_premium),
      }))

      set({
        users,
        userPagination: {
          ...nextQuery,
          total: Number(response.data.total || 0),
          page: Number(response.data.page || nextQuery.page),
          pageSize: Number(response.data.pageSize || nextQuery.pageSize),
          totalPages: Number(response.data.totalPages || 1),
        },
      })
      adminCacheTimestamps.users = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch users.') })
      return
    }
  },

  fetchCoaches: async (query = {}) => {
    const force = Boolean(query.force)
    const currentQuery = get().coachPagination
    const nextQuery: AdminCoachesQueryState = {
      page: query.page ?? currentQuery.page,
      pageSize: query.pageSize ?? currentQuery.pageSize,
      total: currentQuery.total,
      totalPages: currentQuery.totalPages,
      search: query.search ?? currentQuery.search,
      status: query.status ?? currentQuery.status,
    }

    const hasSameQuery =
      currentQuery.page === nextQuery.page &&
      currentQuery.pageSize === nextQuery.pageSize &&
      currentQuery.search === nextQuery.search &&
      currentQuery.status === nextQuery.status

    if (!force && hasSameQuery && get().coaches.length > 0 && isCacheFresh('coaches')) {
      return
    }

    const params = new URLSearchParams({
      page: String(nextQuery.page),
      pageSize: String(nextQuery.pageSize),
    })

    if (nextQuery.search.trim().length) {
      params.set('search', nextQuery.search.trim())
    }

    if (nextQuery.status !== 'all') {
      params.set('status', nextQuery.status)
    }

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
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/v1/admin/coaches?${params.toString()}`)

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
        const accountStatus = String(row.account_status || '').toLowerCase()
        const mappedStatus: AdminCoachItem['status'] =
          accountStatus === 'suspended'
            ? 'Suspended'
            : accountStatus === 'pending_review'
              ? 'Pending Review'
              : 'Verified'

        return {
          id: coachId,
          name: String(row.full_name || row.email || 'Coach'),
          email: String(row.email || ''),
          clients: clientCountMap.get(coachId) || 0,
          status: mappedStatus,
          revenue: formatCurrencyCents(revenueMap.get(coachId) || 0),
        }
      })

      set({
        coaches,
        coachPagination: {
          ...nextQuery,
          total: Number(response.data.total || 0),
          page: Number(response.data.page || nextQuery.page),
          pageSize: Number(response.data.pageSize || nextQuery.pageSize),
          totalPages: Number(response.data.totalPages || 1),
        },
      })
      adminCacheTimestamps.coaches = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch coaches.') })
      return
    }
  },

  fetchApplications: async (query = {}) => {
    const force = Boolean(query.force)
    const currentQuery = get().applicationPagination
    const nextQuery: AdminApplicationsQueryState = {
      page: query.page ?? currentQuery.page,
      pageSize: query.pageSize ?? currentQuery.pageSize,
      total: currentQuery.total,
      totalPages: currentQuery.totalPages,
      search: query.search ?? currentQuery.search,
      status: query.status ?? currentQuery.status,
      email: query.email ?? currentQuery.email,
    }

    const hasSameQuery =
      currentQuery.page === nextQuery.page &&
      currentQuery.pageSize === nextQuery.pageSize &&
      currentQuery.search === nextQuery.search &&
      currentQuery.status === nextQuery.status &&
      currentQuery.email === nextQuery.email

    if (!force && hasSameQuery && get().applications.length > 0 && isCacheFresh('applications')) {
      return
    }

    const params = new URLSearchParams({
      page: String(nextQuery.page),
      pageSize: String(nextQuery.pageSize),
    })

    if (nextQuery.search.trim().length) {
      params.set('search', nextQuery.search.trim())
    }

    if (nextQuery.status !== 'all') {
      params.set('status', nextQuery.status)
    }

    if (nextQuery.email.trim().length) {
      params.set('email', nextQuery.email.trim().toLowerCase())
    }

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
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/v1/admin/applications?${params.toString()}`)

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

      set({
        applications,
        applicationPagination: {
          ...nextQuery,
          total: Number(response.data.total || 0),
          page: Number(response.data.page || nextQuery.page),
          pageSize: Number(response.data.pageSize || nextQuery.pageSize),
          totalPages: Number(response.data.totalPages || 1),
        },
      })
      adminCacheTimestamps.applications = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch applications.') })
      return
    }
  },

  fetchPayments: async (query = {}) => {
    const force = Boolean(query.force)
    const currentQuery = get().paymentPagination
    const nextQuery: AdminPaymentsQueryState = {
      page: query.page ?? currentQuery.page,
      pageSize: query.pageSize ?? currentQuery.pageSize,
      total: currentQuery.total,
      totalPages: currentQuery.totalPages,
      search: query.search ?? currentQuery.search,
      status: query.status ?? currentQuery.status,
    }

    const hasSameQuery =
      currentQuery.page === nextQuery.page &&
      currentQuery.pageSize === nextQuery.pageSize &&
      currentQuery.search === nextQuery.search &&
      currentQuery.status === nextQuery.status

    if (!force && hasSameQuery && get().payments.length > 0 && isCacheFresh('payments')) {
      return
    }

    const params = new URLSearchParams({
      page: String(nextQuery.page),
      pageSize: String(nextQuery.pageSize),
    })

    if (nextQuery.search.trim().length) {
      params.set('search', nextQuery.search.trim())
    }

    if (nextQuery.status !== 'all') {
      params.set('status', nextQuery.status)
    }

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
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/v1/admin/payments?${params.toString()}`)

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

      set({
        payments,
        paymentPagination: {
          ...nextQuery,
          total: Number(response.data.total || 0),
          page: Number(response.data.page || nextQuery.page),
          pageSize: Number(response.data.pageSize || nextQuery.pageSize),
          totalPages: Number(response.data.totalPages || 1),
        },
      })
      adminCacheTimestamps.payments = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch payments.') })
      return
    }
  },

  fetchReports: async (query = {}) => {
    const force = Boolean(query.force)
    const currentQuery = get().reportPagination
    const nextQuery: AdminReportsQueryState = {
      page: query.page ?? currentQuery.page,
      pageSize: query.pageSize ?? currentQuery.pageSize,
      total: currentQuery.total,
      totalPages: currentQuery.totalPages,
      search: query.search ?? currentQuery.search,
      status: query.status ?? currentQuery.status,
      contentType: query.contentType ?? currentQuery.contentType,
      uploaderRole: query.uploaderRole ?? currentQuery.uploaderRole,
      dateFrom: query.dateFrom ?? currentQuery.dateFrom,
      dateTo: query.dateTo ?? currentQuery.dateTo,
    }

    const hasSameQuery =
      currentQuery.page === nextQuery.page &&
      currentQuery.pageSize === nextQuery.pageSize &&
      currentQuery.search === nextQuery.search &&
      currentQuery.status === nextQuery.status &&
      currentQuery.contentType === nextQuery.contentType &&
      currentQuery.uploaderRole === nextQuery.uploaderRole &&
      currentQuery.dateFrom === nextQuery.dateFrom &&
      currentQuery.dateTo === nextQuery.dateTo

    if (!force && hasSameQuery && get().reports.length > 0 && isCacheFresh('reports')) {
      return
    }

    const params = new URLSearchParams({
      page: String(nextQuery.page),
      pageSize: String(nextQuery.pageSize),
    })

    if (nextQuery.search.trim().length) {
      params.set('search', nextQuery.search.trim())
    }

    if (nextQuery.status !== 'all') {
      params.set('status', nextQuery.status)
    }

    if (nextQuery.contentType !== 'all') {
      params.set('contentType', nextQuery.contentType)
    }

    if (nextQuery.uploaderRole !== 'all') {
      params.set('uploaderRole', nextQuery.uploaderRole)
    }

    if (nextQuery.dateFrom.trim().length) {
      params.set('dateFrom', nextQuery.dateFrom.trim())
    }

    if (nextQuery.dateTo.trim().length) {
      params.set('dateTo', nextQuery.dateTo.trim())
    }

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
          target_user?: { full_name?: string | null; email?: string | null; role?: string | null }
        }>
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/v1/admin/reports?${params.toString()}`)

      const reports: AdminReportItem[] = (response.data.reports || []).map((row) => {
        const reporter = row.reporter || {}
        const targetUser = row.target_user || {}
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
          targetUserName: targetUser.full_name ? String(targetUser.full_name) : undefined,
          targetUserEmail: targetUser.email ? String(targetUser.email) : undefined,
          targetUserRole: targetUser.role ? String(targetUser.role) : undefined,
        }
      })

      set({
        reports,
        reportPagination: {
          ...nextQuery,
          total: Number(response.data.total || 0),
          page: Number(response.data.page || nextQuery.page),
          pageSize: Number(response.data.pageSize || nextQuery.pageSize),
          totalPages: Number(response.data.totalPages || 1),
        },
      })
      adminCacheTimestamps.reports = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch reports.') })
      return
    }
  },

  fetchSettings: async (options) => {
    if (!options?.force && isCacheFresh('settings')) {
      return
    }

    try {
      const response = await requestApi<{
        maintenanceMode: boolean
        platformFeePercent: number
        autoApproveCoaches: boolean
        platformName: string
        supportEmail: string
        enforceAdmin2fa: boolean
        maxLoginAttempts: number
        sessionTimeoutMinutes: number
        lockoutMinutes: number
        payoutSchedule: 'weekly' | 'biweekly' | 'monthly'
        autoApprovePayouts: boolean
        allowRefunds: boolean
        refundWindowDays: number
        minimumPayoutCents: number
        enableReadReplicas: boolean
        analyticsRetentionDays: number
        softDeleteRetentionDays: number
        maintenanceWindowUtc: string
        emailOnApplication: boolean
        emailOnReport: boolean
        emailOnPayout: boolean
        inAppBroadcasts: boolean
      }>('/api/v1/admin/settings')

      set({
        settings: {
          maintenanceMode: Boolean(response.data.maintenanceMode),
          platformFeePercent: Number(response.data.platformFeePercent || 10),
          autoApproveCoaches: Boolean(response.data.autoApproveCoaches),
          platformName: String(response.data.platformName || 'SuperFit'),
          supportEmail: String(response.data.supportEmail || 'support@superfit.app'),

          enforceAdmin2fa: Boolean(response.data.enforceAdmin2fa ?? true),
          maxLoginAttempts: Number(response.data.maxLoginAttempts || 5),
          sessionTimeoutMinutes: Number(response.data.sessionTimeoutMinutes || 60),
          lockoutMinutes: Number(response.data.lockoutMinutes || 15),

          payoutSchedule: response.data.payoutSchedule || 'weekly',
          autoApprovePayouts: Boolean(response.data.autoApprovePayouts),
          allowRefunds: Boolean(response.data.allowRefunds ?? true),
          refundWindowDays: Number(response.data.refundWindowDays || 14),
          minimumPayoutCents: Number(response.data.minimumPayoutCents || 5000),

          enableReadReplicas: Boolean(response.data.enableReadReplicas),
          analyticsRetentionDays: Number(response.data.analyticsRetentionDays || 365),
          softDeleteRetentionDays: Number(response.data.softDeleteRetentionDays || 30),
          maintenanceWindowUtc: String(response.data.maintenanceWindowUtc || 'Sun 02:00-03:00 UTC'),

          emailOnApplication: Boolean(response.data.emailOnApplication ?? true),
          emailOnReport: Boolean(response.data.emailOnReport ?? true),
          emailOnPayout: Boolean(response.data.emailOnPayout ?? true),
          inAppBroadcasts: Boolean(response.data.inAppBroadcasts ?? true),
        },
      })
      adminCacheTimestamps.settings = Date.now()
    } catch (error) {
      set({ error: toErrorMessage(error, 'Unable to fetch admin settings.') })
      return
    }
  },

  startRealtime: (adminId) => {
    if (!isSupabaseAuthEnabled()) return
    if (!adminId) return

    adminRealtimeSubscribers += 1

    if (adminRealtimeChannel && adminRealtimeUserId === adminId) {
      return
    }

    if (adminRealtimeChannel) {
      adminRealtimeChannel.unsubscribe()
      adminRealtimeChannel = null
      adminRealtimeUserId = null
    }

    clearAdminRealtimeTimers()

    const schedule = (
      key: 'profiles' | 'applications' | 'payments' | 'reports' | 'settings',
      callback: () => void,
    ) => {
      if (adminRealtimeTimers[key]) {
        clearTimeout(adminRealtimeTimers[key])
      }

      adminRealtimeTimers[key] = setTimeout(callback, 180)
    }

    const supabase = createClient()
    adminRealtimeChannel = supabase
      .channel(`admin-portal-live-${adminId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          schedule('profiles', () => {
            void Promise.all([get().fetchUsers({ force: true }), get().fetchCoaches({ force: true })])
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_coach_applications',
        },
        () => {
          schedule('applications', () => {
            void Promise.all([get().fetchApplications({ force: true }), get().fetchCoaches({ force: true })])
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
        },
        () => {
          schedule('payments', () => {
            void get().fetchPayments({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_moderation_reports',
        },
        () => {
          schedule('reports', () => {
            void get().fetchReports({ force: true })
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_settings',
        },
        () => {
          schedule('settings', () => {
            void get().fetchSettings({ force: true })
          })
        },
      )
      .subscribe()

    adminRealtimeUserId = adminId
  },

  stopRealtime: () => {
    adminRealtimeSubscribers = Math.max(0, adminRealtimeSubscribers - 1)
    if (adminRealtimeSubscribers > 0) return

    clearAdminRealtimeTimers()

    if (adminRealtimeChannel) {
      adminRealtimeChannel.unsubscribe()
      adminRealtimeChannel = null
      adminRealtimeUserId = null
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to update user status.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.users = 0
    adminCacheTimestamps.coaches = 0

    const pagination = get().userPagination
    await Promise.all([
      get().fetchUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: pagination.search,
        role: pagination.role,
        status: pagination.status,
        includeDeleted: pagination.includeDeleted,
      }),
      get().fetchCoaches(),
    ])
  },

  togglePremium: async (userId, enabled) => {
    try {
      await requestApi<{ id: string; enabled: boolean }>(`/api/v1/admin/users/${userId}/premium`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to update premium status.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.users = 0

    const pagination = get().userPagination
    await get().fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: pagination.search,
      role: pagination.role,
      status: pagination.status,
      includeDeleted: pagination.includeDeleted,
    })
  },

  updateUser: async (userId, payload) => {
    try {
      await requestApi<{ updated: boolean }>(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to update user.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.users = 0
    adminCacheTimestamps.coaches = 0

    const pagination = get().userPagination
    await Promise.all([
      get().fetchUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: pagination.search,
        role: pagination.role,
        status: pagination.status,
        includeDeleted: pagination.includeDeleted,
      }),
      get().fetchCoaches(),
    ])
  },

  softDeleteUser: async (userId, reason) => {
    try {
      await requestApi<{ deleted: boolean }>(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason: reason || null }),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to delete user.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.users = 0
    adminCacheTimestamps.coaches = 0

    const pagination = get().userPagination
    await Promise.all([
      get().fetchUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: pagination.search,
        role: pagination.role,
        status: pagination.status,
        includeDeleted: pagination.includeDeleted,
      }),
      get().fetchCoaches(),
    ])
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
      const message = toErrorMessage(error, 'Unable to update application status.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.applications = 0
    adminCacheTimestamps.users = 0
    adminCacheTimestamps.coaches = 0

    await Promise.all([get().fetchApplications(), get().fetchUsers(), get().fetchCoaches()])
  },

  updateReportStatus: async (reportId, status, message) => {
    try {
      await requestApi<{ id: string; status: string }>(`/api/v1/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, message }),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to update report status.')
      set({ error: message })
      throw new Error(message)
    }

    adminCacheTimestamps.reports = 0
    adminCacheTimestamps.users = 0
    adminCacheTimestamps.coaches = 0

    await Promise.all([get().fetchReports(), get().fetchUsers(), get().fetchCoaches()])
  },

  saveSettings: async (next) => {
    const merged = { ...get().settings, ...next }

    try {
      await requestApi<{ updated: boolean }>('/api/v1/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(merged),
      })
    } catch (error) {
      const message = toErrorMessage(error, 'Unable to save admin settings.')
      set({ error: message })
      throw new Error(message)
    }

    set({ settings: merged })
    adminCacheTimestamps.settings = Date.now()
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
  if (status === 'pending_review') return 'Pending Review'
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
