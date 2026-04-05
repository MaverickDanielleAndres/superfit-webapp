'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Flag, Trash2, Check, Video, Image as ImageIcon, MessageCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ContentTab = 'all' | 'image' | 'video' | 'text' | 'post'

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'dismissed' | 'removed' | 'warned' | 'banned'>('all')
  const [uploaderRole, setUploaderRole] = useState<'all' | 'coach' | 'user'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    confirmText: string
    tone: 'default' | 'danger'
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)

  const {
    reports,
    reportPagination,
    fetchReports,
    updateReportStatus,
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
      await fetchReports({
        page: 1,
        pageSize: 20,
        search: '',
        status: 'all',
        contentType: 'all',
        uploaderRole: 'all',
        dateFrom: '',
        dateTo: '',
      })
      if (isMounted) setIsPageLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [fetchReports])

  useEffect(() => {
    if (isPageLoading) return

    void fetchReports({
      page: 1,
      pageSize: reportPagination.pageSize || 20,
      search: debouncedSearch,
      status: statusFilter,
      contentType: activeTab,
      uploaderRole,
      dateFrom,
      dateTo,
    })
  }, [activeTab, dateFrom, dateTo, debouncedSearch, fetchReports, isPageLoading, reportPagination.pageSize, statusFilter, uploaderRole])

  const openReports = reports.filter((report) => report.status === 'Pending').length

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

  const currentPage = reportPagination.page
  const totalPages = reportPagination.totalPages
  const canGoBack = currentPage > 1
  const canGoNext = currentPage < totalPages

  if (isPageLoading && reports.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
        <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
        <div className="h-24 w-full rounded-[24px] bg-[var(--bg-elevated)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-[24px] bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div>
        <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Content Moderation</h1>
        <p className="font-body text-[14px] text-(--text-secondary)">Review flagged content from clients and coaches, apply warnings, blocks, and removals.</p>
      </div>

      <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 mb-2 flex items-center gap-4 bg-[var(--status-warning-bg)]/10 border-[var(--status-warning-bg)]">
        <div className="w-[48px] h-[48px] rounded-full bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)] flex items-center justify-center shrink-0">
          <ShieldAlert className="w-[24px] h-[24px]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-[16px] text-(--text-primary)">{openReports} Items Require Review</h3>
          <p className="font-body text-[13px] text-(--text-secondary)">Blocked content sends warning feedback. Persistent violations can be removed or banned.</p>
        </div>
      </div>

      <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by reason or reporter..."
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'dismissed' | 'removed' | 'warned' | 'banned')}
            className="h-[40px] w-full md:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="pending">Pending</option>
            <option value="warned">Warned / Blocked</option>
            <option value="removed">Removed</option>
            <option value="dismissed">Dismissed</option>
            <option value="banned">Banned</option>
          </select>

          <select
            value={uploaderRole}
            onChange={(event) => setUploaderRole(event.target.value as 'all' | 'coach' | 'user')}
            className="h-[40px] w-full md:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
          >
            <option value="all">Uploader: All</option>
            <option value="coach">Coach</option>
            <option value="user">Client</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <label className="text-[12px] font-bold text-(--text-secondary)">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-[36px] flex-1 rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px]"
            />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <label className="text-[12px] font-bold text-(--text-secondary)">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-[36px] flex-1 rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'image', label: 'Images' },
          { key: 'video', label: 'Videos' },
          { key: 'text', label: 'Text Posts' },
          { key: 'post', label: 'Post Threads' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ContentTab)}
            className={cn('whitespace-nowrap px-4 py-2 rounded-full font-bold text-[13px] transition-colors border', activeTab === tab.key ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-[var(--bg-elevated)] border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm flex flex-col overflow-hidden">
            <div className="h-[200px] bg-[var(--bg-elevated)] relative flex items-center justify-center">
              {report.contentType === 'image' && <ImageIcon className="w-[48px] h-[48px] text-(--text-tertiary)" />}
              {report.contentType === 'video' && <Video className="w-[48px] h-[48px] text-(--text-tertiary)" />}
              {report.contentType !== 'image' && report.contentType !== 'video' && <MessageCircle className="w-[48px] h-[48px] text-(--text-tertiary)" />}

              <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[11px] px-2 py-1 rounded-[6px] shadow-sm flex items-center gap-1 uppercase tracking-wider">
                <Flag className="w-[12px] h-[12px]" /> Flagged
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4 flex-1">
              <div>
                <h4 className="font-display font-bold text-[15px] text-(--text-primary)">{report.contentType.toUpperCase()} Moderation Report</h4>
                <span className="text-[12px] text-(--text-secondary)">
                  Reported by <span className="font-bold">{report.reporter}</span> • {report.createdAt}
                </span>
                <p className="text-[12px] text-(--text-secondary) mt-1">
                  Uploader: <span className="font-bold">{report.targetUserRole === 'coach' ? 'Coach' : report.targetUserRole === 'user' ? 'Client' : 'Unknown'}</span>
                </p>
              </div>

              <p className="font-body text-[13px] text-(--text-secondary) bg-[var(--bg-elevated)] p-3 rounded-[12px] border border-(--border-default) mt-auto">
                <span className="font-bold block mb-1">Reason:</span>
                {report.reason}
              </p>

              <div className="flex flex-col gap-2 pt-2 mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      openConfirmation(
                        {
                          title: 'Delete Content?',
                          message: 'This report will be marked as Removed and content will be deleted.',
                          confirmText: 'Delete Content',
                          tone: 'danger',
                        },
                        async () => {
                          await updateReportStatus(report.id, 'Removed')
                          toast.error('Content removed.')
                          await fetchReports({
                            page: reportPagination.page,
                            pageSize: reportPagination.pageSize,
                            search: debouncedSearch,
                            status: statusFilter,
                            contentType: activeTab,
                            uploaderRole,
                            dateFrom,
                            dateTo,
                          })
                        },
                      )
                    }}
                    className="flex-1 h-[36px] rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-red-500/30"
                  >
                    <Trash2 className="w-[14px] h-[14px]" /> Delete
                  </button>
                  <button
                    onClick={() => {
                      openConfirmation(
                        {
                          title: 'Dismiss Report?',
                          message: 'This report will be marked as Dismissed.',
                          confirmText: 'Dismiss',
                        },
                        async () => {
                          await updateReportStatus(report.id, 'Dismissed')
                          toast.success('Report dismissed.')
                          await fetchReports({
                            page: reportPagination.page,
                            pageSize: reportPagination.pageSize,
                            search: debouncedSearch,
                            status: statusFilter,
                            contentType: activeTab,
                            uploaderRole,
                            dateFrom,
                            dateTo,
                          })
                        },
                      )
                    }}
                    className="flex-1 h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-(--border-default) text-(--text-primary) font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-[14px] h-[14px]" /> Dismiss
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const requestChangeMessage = window.prompt(
                        'Enter the message the uploader will see (required):',
                        'Your content was blocked and needs changes. Please update it and reply in support.',
                      )

                      if (requestChangeMessage === null) {
                        return
                      }

                      const normalizedMessage = requestChangeMessage.trim()
                      if (!normalizedMessage.length) {
                        toast.error('A message is required when requesting content changes.')
                        return
                      }

                      openConfirmation(
                        {
                          title: 'Block and Warn Uploader?',
                          message: 'The uploader will be notified to modify content. If unchanged, you can delete it permanently.',
                          confirmText: 'Block Content',
                        },
                        async () => {
                          await updateReportStatus(report.id, 'Warned', normalizedMessage)
                          toast.warning('Uploader has been warned to update content.')
                          await fetchReports({
                            page: reportPagination.page,
                            pageSize: reportPagination.pageSize,
                            search: debouncedSearch,
                            status: statusFilter,
                            contentType: activeTab,
                            uploaderRole,
                            dateFrom,
                            dateTo,
                          })
                        },
                      )
                    }}
                    className="flex-1 h-[32px] rounded-[8px] bg-[var(--status-warning-bg)]/10 hover:bg-[var(--status-warning-bg)]/30 border border-transparent hover:border-[var(--status-warning)]/30 text-[var(--status-warning)] font-bold text-[12px] transition-colors"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => {
                      openConfirmation(
                        {
                          title: 'Ban Uploader?',
                          message: 'The uploader account will be suspended and notified.',
                          confirmText: 'Ban User',
                          tone: 'danger',
                        },
                        async () => {
                          await updateReportStatus(report.id, 'Banned')
                          toast.error('Uploader has been banned and suspended.')
                          await fetchReports({
                            page: reportPagination.page,
                            pageSize: reportPagination.pageSize,
                            search: debouncedSearch,
                            status: statusFilter,
                            contentType: activeTab,
                            uploaderRole,
                            dateFrom,
                            dateTo,
                          })
                        },
                      )
                    }}
                    className="flex-1 h-[32px] rounded-[8px] bg-(--bg-surface) hover:bg-red-500/10 border border-(--border-default) hover:border-red-500/30 text-(--text-secondary) hover:text-red-600 font-bold text-[12px] transition-colors"
                  >
                    Ban
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border border-(--border-subtle) rounded-[16px] bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
        <p className="text-[12px] text-(--text-secondary)">
          Page {currentPage} of {totalPages} • {reportPagination.total} moderation reports
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void fetchReports({
                page: currentPage - 1,
                pageSize: reportPagination.pageSize,
                search: debouncedSearch,
                status: statusFilter,
                contentType: activeTab,
                uploaderRole,
                dateFrom,
                dateTo,
              })
            }}
            disabled={!canGoBack}
            className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-[14px] h-[14px]" /> Prev
          </button>
          <button
            onClick={() => {
              void fetchReports({
                page: currentPage + 1,
                pageSize: reportPagination.pageSize,
                search: debouncedSearch,
                status: statusFilter,
                contentType: activeTab,
                uploaderRole,
                dateFrom,
                dateTo,
              })
            }}
            disabled={!canGoNext}
            className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight className="w-[14px] h-[14px]" />
          </button>
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
