'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Check, X, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function AdminApplicationsPage() {
  const searchParams = useSearchParams()
  const initialEmailFilter = String(searchParams.get('email') || '').trim().toLowerCase()

  const [searchInput, setSearchInput] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [emailFilter, setEmailFilter] = React.useState(initialEmailFilter)
  const [isPageLoading, setIsPageLoading] = React.useState(true)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    title: string
    message: string
    confirmText: string
    tone: 'default' | 'danger'
  } | null>(null)
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [pendingConfirmationAction, setPendingConfirmationAction] = React.useState<null | (() => Promise<void>)>(null)

  const {
    applications,
    applicationPagination,
    fetchApplications,
    updateApplicationStatus,
  } = useAdminPortalStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsPageLoading(true)
      await fetchApplications({
        page: 1,
        pageSize: 12,
        search: '',
        status: 'all',
        email: initialEmailFilter,
      })
      if (isMounted) setIsPageLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [fetchApplications, initialEmailFilter])

  useEffect(() => {
    if (isPageLoading) return

    void fetchApplications({
      page: 1,
      pageSize: applicationPagination.pageSize || 12,
      search: debouncedSearch,
      status: statusFilter,
      email: emailFilter,
    })
  }, [applicationPagination.pageSize, debouncedSearch, emailFilter, fetchApplications, isPageLoading, statusFilter])

  const openConfirmation = (
    dialog: { title: string; message: string; confirmText: string; tone?: 'default' | 'danger' },
    action: () => Promise<void>,
  ) => {
    setConfirmDialog({
      title: dialog.title,
      message: dialog.message,
      confirmText: dialog.confirmText,
      tone: dialog.tone || 'default',
    })
    setPendingConfirmationAction(() => action)
  }

  const closeConfirmation = () => {
    if (isConfirming) return
    setConfirmDialog(null)
    setPendingConfirmationAction(null)
  }

  const runConfirmedAction = async () => {
    if (!pendingConfirmationAction) return
    setIsConfirming(true)
    try {
      await pendingConfirmationAction()
      setConfirmDialog(null)
      setPendingConfirmationAction(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to complete action.')
    } finally {
      setIsConfirming(false)
    }
  }

  const currentPage = applicationPagination.page
  const totalPages = applicationPagination.totalPages
  const canGoBack = currentPage > 1
  const canGoNext = currentPage < totalPages

  const title = useMemo(() => {
    if (emailFilter) return 'Coach Applications (Filtered)'
    return 'Coach Applications'
  }, [emailFilter])

  if (isPageLoading && applications.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
        <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
        <div className="rounded-[24px] border border-(--border-subtle) bg-(--bg-surface) p-4 flex flex-col gap-3">
          <div className="h-10 w-full rounded-[12px] bg-[var(--bg-elevated)]" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 w-full rounded-[12px] bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div>
        <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">{title}</h1>
        <p className="font-body text-[14px] text-(--text-secondary)">Review pending applications and verify credentials before granting coach access.</p>
      </div>

      <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search application by name or email..."
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
            />
          </div>

          <input
            type="text"
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value.trim().toLowerCase())}
            placeholder="Exact email filter"
            className="h-[40px] w-full sm:w-[240px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] outline-none"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            className="h-[40px] w-full sm:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((application) => (
            <div key={application.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
                <div className="flex items-center gap-3">
                  <div className="w-[48px] h-[48px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center font-display font-bold text-[18px]">
                    {application.name[0] || 'A'}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-[18px] text-(--text-primary)">{application.name}</h3>
                    <p className="font-body text-[13px] text-(--text-secondary)">Applied {application.submittedAt}</p>
                  </div>
                </div>
                <span className={application.status === 'Approved' ? 'px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-[11px] uppercase tracking-wider rounded-full' : application.status === 'Rejected' ? 'px-3 py-1 bg-red-500/10 text-red-600 font-bold text-[11px] uppercase tracking-wider rounded-full' : 'px-3 py-1 bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)] font-bold text-[11px] uppercase tracking-wider rounded-full'}>{application.status}</span>
              </div>

              <div className="flex flex-col gap-2 font-body text-[14px]">
                <p><span className="font-bold text-(--text-secondary)">Email:</span> {application.email}</p>
                <p><span className="font-bold text-(--text-secondary)">Specialties:</span> {application.specialties.join(', ') || 'General Fitness'}</p>
                <p><span className="font-bold text-(--text-secondary)">Experience:</span> {application.experienceYears} Years</p>
                <div className="p-3 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-default) flex items-start gap-3 mt-2">
                  <FileText className="w-[20px] h-[20px] text-(--text-tertiary) shrink-0" />
                  <div>
                    <span className="block font-bold text-[14px] text-(--text-primary) mb-1">Coach Certificate</span>
                    {application.certificateUrl ? (
                      <a href={application.certificateUrl} target="_blank" rel="noreferrer" className="text-red-500 font-bold text-[12px] flex items-center gap-1 mt-2 hover:text-red-600 transition-colors"><ExternalLink className="w-[12px] h-[12px]" /> View Document</a>
                    ) : (
                      <span className="text-[12px] text-(--text-secondary)">No certificate uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 mt-auto">
                <button
                  onClick={() => {
                    openConfirmation(
                      {
                        title: 'Reject Application?',
                        message: `${application.name} will be marked as Rejected and remain under review.`,
                        confirmText: 'Reject',
                        tone: 'danger',
                      },
                      async () => {
                        await updateApplicationStatus(application.id, 'Rejected')
                        toast.success(`Rejected ${application.name}.`)
                        await fetchApplications({
                          page: applicationPagination.page,
                          pageSize: applicationPagination.pageSize,
                          search: debouncedSearch,
                          status: statusFilter,
                          email: emailFilter,
                        })
                      },
                    )
                  }}
                  className="flex-1 h-[44px] rounded-[12px] bg-red-500/10 text-red-600 border border-transparent hover:border-red-500/20 font-bold text-[14px] flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-[18px] h-[18px]" /> Reject
                </button>
                <button
                  onClick={() => {
                    openConfirmation(
                      {
                        title: 'Approve Application?',
                        message: `${application.name} will be approved as a coach account and access will be activated.`,
                        confirmText: 'Approve',
                      },
                      async () => {
                        await updateApplicationStatus(application.id, 'Approved')
                        toast.success(`Approved ${application.name} as coach.`)
                        await fetchApplications({
                          page: applicationPagination.page,
                          pageSize: applicationPagination.pageSize,
                          search: debouncedSearch,
                          status: statusFilter,
                          email: emailFilter,
                        })
                      },
                    )
                  }}
                  className="flex-1 h-[44px] rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-[18px] h-[18px]" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
          <p className="text-[12px] text-(--text-secondary)">
            Page {currentPage} of {totalPages} • {applicationPagination.total} applications
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void fetchApplications({
                  page: currentPage - 1,
                  pageSize: applicationPagination.pageSize,
                  search: debouncedSearch,
                  status: statusFilter,
                  email: emailFilter,
                })
              }}
              disabled={!canGoBack}
              className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-[14px] h-[14px]" /> Prev
            </button>
            <button
              onClick={() => {
                void fetchApplications({
                  page: currentPage + 1,
                  pageSize: applicationPagination.pageSize,
                  search: debouncedSearch,
                  status: statusFilter,
                  email: emailFilter,
                })
              }}
              disabled={!canGoNext}
              className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title || 'Confirm Action'}
        message={confirmDialog?.message || ''}
        confirmText={confirmDialog?.confirmText || 'Confirm'}
        tone={confirmDialog?.tone || 'default'}
        isLoading={isConfirming}
        onCancel={closeConfirmation}
        onConfirm={() => {
          void runConfirmedAction()
        }}
      />
    </motion.div>
  )
}
