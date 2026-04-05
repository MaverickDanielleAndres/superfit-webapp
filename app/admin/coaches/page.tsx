'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight, UserX, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function AdminCoachesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'>('all')
  const [activeMenuCoachId, setActiveMenuCoachId] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [editingCoach, setEditingCoach] = useState<null | {
    id: string
    fullName: string
    email: string
    status: 'Verified' | 'Suspended'
  }>(null)
  const [verificationCoach, setVerificationCoach] = useState<null | {
    id: string
    email: string
    name: string
  }>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    confirmText: string
    tone: 'default' | 'danger'
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [pendingConfirmationAction, setPendingConfirmationAction] = useState<null | (() => Promise<void>)>(null)

  const {
    coaches,
    coachPagination,
    applications,
    fetchCoaches,
    fetchApplications,
    updateUserStatus,
    updateUser,
    softDeleteUser,
    updateApplicationStatus,
  } = useAdminPortalStore()

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setIsPageLoading(true)
      await fetchCoaches({ page: 1, pageSize: 10, search: '', status: 'all' })
      if (isMounted) setIsPageLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [fetchCoaches])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (isPageLoading) return

    void fetchCoaches({
      page: 1,
      pageSize: coachPagination.pageSize || 10,
      search: debouncedSearch,
      status: statusFilter,
    })
  }, [coachPagination.pageSize, debouncedSearch, fetchCoaches, isPageLoading, statusFilter])

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuCoachId(null)
    }

    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

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

  const handlePageChange = async (nextPage: number) => {
    await fetchCoaches({
      page: nextPage,
      pageSize: coachPagination.pageSize || 10,
      search: debouncedSearch,
      status: statusFilter,
    })
  }

  const openVerificationModal = async (coach: { id: string; email: string; name: string }) => {
    await fetchApplications({
      page: 1,
      pageSize: 10,
      email: coach.email,
      status: 'all',
      search: '',
    })

    setVerificationCoach(coach)
  }

  const verificationApplications = useMemo(
    () => applications.filter((application) => verificationCoach && application.email.toLowerCase() === verificationCoach.email.toLowerCase()),
    [applications, verificationCoach],
  )

  const currentPage = coachPagination.page
  const totalPages = coachPagination.totalPages
  const canGoBack = currentPage > 1
  const canGoNext = currentPage < totalPages

  if (isPageLoading && coaches.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
        <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
        <div className="rounded-[24px] border border-(--border-subtle) bg-(--bg-surface) p-4 flex flex-col gap-3">
          <div className="h-10 w-full rounded-[12px] bg-[var(--bg-elevated)]" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 w-full rounded-[12px] bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Coach Directory</h1>
          <p className="font-body text-[14px] text-(--text-secondary)">Manage certified coaches, verification approvals, and account governance.</p>
        </div>
      </div>

      <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 w-full sm:max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search coaches by name or email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review')}
            className="h-[40px] w-full sm:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="active">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="md:hidden p-4 flex flex-col gap-3">
          {coaches.map((coach) => (
            <div key={coach.id} className="rounded-[16px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${coach.name}`} alt={`${coach.name} avatar`} className="w-[40px] h-[40px] rounded-[10px] border border-(--border-subtle)" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-[15px] text-(--text-primary) truncate">{coach.name}</p>
                  <p className="font-body text-[12px] text-(--text-secondary) truncate">{coach.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                <span className={cn('px-2 py-1 rounded-[8px] font-bold text-center', coach.status === 'Verified' ? 'bg-blue-500/10 text-blue-600' : coach.status === 'Pending Review' ? 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]' : 'bg-red-500/10 text-red-600')}>
                  {coach.status}
                </span>
                <span className="px-2 py-1 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) font-bold text-center">{coach.clients} clients</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-(--text-primary)">{coach.revenue}</span>
                <div className="flex items-center gap-2 text-(--text-secondary)">
                  <button
                    onClick={() => {
                      void openVerificationModal({ id: coach.id, email: coach.email, name: coach.name })
                    }}
                    className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                    title="View Verification Details"
                  >
                    <ShieldCheck className="w-[16px] h-[16px]" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveMenuCoachId((current) => (current === coach.id ? null : coach.id))
                    }}
                    className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                    title="More Actions"
                  >
                    <MoreVertical className="w-[16px] h-[16px]" />
                  </button>
                </div>
              </div>

              {activeMenuCoachId === coach.id && (
                <div className="mt-2 rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-1 flex flex-col">
                  <button
                    onClick={() => {
                      const editableStatus: 'Verified' | 'Suspended' = coach.status === 'Suspended' ? 'Suspended' : 'Verified'
                      setEditingCoach({
                        id: coach.id,
                        fullName: coach.name,
                        email: coach.email,
                        status: editableStatus,
                      })
                      setActiveMenuCoachId(null)
                    }}
                    className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated)"
                  >
                    Edit Coach
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuCoachId(null)
                      openConfirmation(
                        {
                          title: coach.status === 'Suspended' ? 'Activate Coach?' : 'Suspend Coach?',
                          message: `${coach.name} will be marked as ${coach.status === 'Suspended' ? 'Active' : 'Suspended'}.`,
                          confirmText: coach.status === 'Suspended' ? 'Activate' : 'Suspend',
                          tone: coach.status === 'Suspended' ? 'default' : 'danger',
                        },
                        async () => {
                          const nextStatus = coach.status === 'Suspended' ? 'Active' : 'Suspended'
                          await updateUserStatus(coach.id, nextStatus)
                          toast.success(`${coach.name} marked as ${nextStatus}.`)
                        },
                      )
                    }}
                    className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated)"
                  >
                    {coach.status === 'Suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuCoachId(null)
                      openConfirmation(
                        {
                          title: 'Delete Coach Permanently?',
                          message: `${coach.name} will be permanently deleted and signed out from all sessions.`,
                          confirmText: 'Delete Permanently',
                          tone: 'danger',
                        },
                        async () => {
                          await softDeleteUser(coach.id, 'Permanently deleted by admin')
                          toast.success(`${coach.name} has been permanently deleted.`)
                        },
                      )
                    }}
                    className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-red-600 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
              <tr>
                <th className="p-4 font-medium pl-6">Coach</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Active Clients</th>
                <th className="p-4 font-medium">MRR</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${coach.name}`} alt={`${coach.name} avatar`} className="w-[40px] h-[40px] rounded-[10px] border border-(--border-subtle)" />
                      <div>
                        <span className="font-display font-bold text-[15px] text-(--text-primary) block">{coach.name}</span>
                        <span className="font-body text-[12px] text-(--text-secondary) block">{coach.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn('px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider', coach.status === 'Verified' ? 'bg-blue-500/10 text-blue-600' : coach.status === 'Pending Review' ? 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]' : 'bg-red-500/10 text-red-600')}>
                      {coach.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-(--text-primary)">{coach.clients}</td>
                  <td className="p-4 font-medium text-(--text-primary)">{coach.revenue}</td>
                  <td className="p-4 pr-6 text-right">
                    <div className="relative inline-flex items-center justify-end gap-2 text-(--text-secondary)">
                      <button
                        onClick={() => {
                          void openVerificationModal({ id: coach.id, email: coach.email, name: coach.name })
                        }}
                        className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                        title="View Verification Details"
                      >
                        <ShieldCheck className="w-[16px] h-[16px]" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setActiveMenuCoachId((current) => (current === coach.id ? null : coach.id))
                        }}
                        className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                        title="More Actions"
                      >
                        <MoreVertical className="w-[16px] h-[16px]" />
                      </button>

                      {activeMenuCoachId === coach.id && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="absolute top-[42px] right-0 z-20 min-w-[190px] rounded-[12px] border border-(--border-default) bg-(--bg-surface) p-1 shadow-lg"
                        >
                          <button
                            onClick={() => {
                              const editableStatus: 'Verified' | 'Suspended' = coach.status === 'Suspended' ? 'Suspended' : 'Verified'
                              setEditingCoach({
                                id: coach.id,
                                fullName: coach.name,
                                email: coach.email,
                                status: editableStatus,
                              })
                              setActiveMenuCoachId(null)
                            }}
                            className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated) flex items-center gap-2"
                          >
                            <Pencil className="w-[13px] h-[13px]" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuCoachId(null)
                              openConfirmation(
                                {
                                  title: coach.status === 'Suspended' ? 'Activate Coach?' : 'Suspend Coach?',
                                  message: `${coach.name} will be marked as ${coach.status === 'Suspended' ? 'Active' : 'Suspended'}.`,
                                  confirmText: coach.status === 'Suspended' ? 'Activate' : 'Suspend',
                                  tone: coach.status === 'Suspended' ? 'default' : 'danger',
                                },
                                async () => {
                                  const nextStatus = coach.status === 'Suspended' ? 'Active' : 'Suspended'
                                  await updateUserStatus(coach.id, nextStatus)
                                  toast.success(`${coach.name} marked as ${nextStatus}.`)
                                },
                              )
                            }}
                            className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated) flex items-center gap-2"
                          >
                            <UserX className="w-[13px] h-[13px]" /> {coach.status === 'Suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuCoachId(null)
                              openConfirmation(
                                {
                                  title: 'Delete Coach Permanently?',
                                  message: `${coach.name} will be permanently deleted and signed out from all sessions.`,
                                  confirmText: 'Delete Permanently',
                                  tone: 'danger',
                                },
                                async () => {
                                  await softDeleteUser(coach.id, 'Permanently deleted by admin')
                                  toast.success(`${coach.name} has been permanently deleted.`)
                                },
                              )
                            }}
                            className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-red-600 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-[13px] h-[13px]" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-(--border-subtle) bg-[var(--bg-elevated)] flex items-center justify-between gap-3">
          <p className="text-[12px] text-(--text-secondary)">
            Page {currentPage} of {totalPages} • {coachPagination.total} coaches
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void handlePageChange(currentPage - 1)
              }}
              disabled={!canGoBack}
              className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-[14px] h-[14px]" /> Prev
            </button>
            <button
              onClick={() => {
                void handlePageChange(currentPage + 1)
              }}
              disabled={!canGoNext}
              className="h-[34px] px-3 rounded-[8px] border border-(--border-default) text-(--text-secondary) disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>

      {editingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close edit dialog" className="absolute inset-0 bg-black/50" onClick={() => setEditingCoach(null)} />
          <div className="relative z-10 w-full max-w-[520px] rounded-[20px] border border-(--border-subtle) bg-(--bg-surface) p-5 shadow-xl">
            <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Edit Coach</h3>
            <p className="text-[13px] text-(--text-secondary) mt-1">Update coach profile details and account state.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[12px] font-bold text-(--text-secondary)">Full Name</label>
                <input
                  value={editingCoach.fullName}
                  onChange={(event) => setEditingCoach((current) => (current ? { ...current, fullName: event.target.value } : current))}
                  className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-bold text-(--text-secondary)">Email</label>
                <input
                  value={editingCoach.email}
                  onChange={(event) => setEditingCoach((current) => (current ? { ...current, email: event.target.value } : current))}
                  className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-(--text-secondary)">Status</label>
                <select
                  value={editingCoach.status}
                  onChange={(event) => setEditingCoach((current) => (current ? { ...current, status: event.target.value as 'Verified' | 'Suspended' } : current))}
                  className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                >
                  <option value="Verified">Verified</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingCoach(null)}
                className="h-[36px] px-4 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary)"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void (async () => {
                    try {
                      const mappedStatus = editingCoach.status === 'Suspended' ? 'Suspended' : 'Active'
                      await updateUser(editingCoach.id, {
                        fullName: editingCoach.fullName,
                        email: editingCoach.email,
                        role: 'Coach',
                        status: mappedStatus,
                      })
                      toast.success('Coach profile updated.')
                      setEditingCoach(null)
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Unable to update coach profile.')
                    }
                  })()
                }}
                className="h-[36px] px-4 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close verification dialog" className="absolute inset-0 bg-black/50" onClick={() => setVerificationCoach(null)} />
          <div className="relative z-10 w-full max-w-[720px] rounded-[20px] border border-(--border-subtle) bg-(--bg-surface) p-5 shadow-xl">
            <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Verification Details</h3>
            <p className="text-[13px] text-(--text-secondary) mt-1">{verificationCoach.name} • {verificationCoach.email}</p>

            <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {verificationApplications.length === 0 && (
                <div className="rounded-[12px] border border-(--border-default) bg-(--bg-elevated) p-4 text-[13px] text-(--text-secondary)">
                  No application details found for this coach yet.
                </div>
              )}

              {verificationApplications.map((application) => (
                <div key={application.id} className="rounded-[12px] border border-(--border-default) bg-(--bg-elevated) p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[14px] text-(--text-primary)">{application.name}</p>
                      <p className="text-[12px] text-(--text-secondary)">Submitted {application.submittedAt}</p>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-[8px] font-bold text-[11px] uppercase', application.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' : application.status === 'Rejected' ? 'bg-red-500/10 text-red-600' : 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]')}>
                      {application.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] text-(--text-secondary)"><span className="font-bold">Specialties:</span> {application.specialties.join(', ') || 'N/A'}</p>
                  <p className="mt-1 text-[13px] text-(--text-secondary)"><span className="font-bold">Experience:</span> {application.experienceYears} years</p>

                  {application.certificateUrl && (
                    <a href={application.certificateUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 hover:text-emerald-700">
                      View Verification File
                    </a>
                  )}

                  {application.status !== 'Approved' && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          void (async () => {
                            try {
                              await updateApplicationStatus(application.id, 'Approved')
                              toast.success('Coach verified and approved.')
                              await fetchApplications({
                                page: 1,
                                pageSize: 10,
                                email: verificationCoach.email,
                                status: 'all',
                                search: '',
                              })
                              await fetchCoaches({
                                page: coachPagination.page,
                                pageSize: coachPagination.pageSize,
                                search: debouncedSearch,
                                status: statusFilter,
                              })
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Unable to approve coach verification.')
                            }
                          })()
                        }}
                        className="h-[34px] px-3 rounded-[8px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-[13px] h-[13px]" /> Approve Verification
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => setVerificationCoach(null)}
                className="h-[36px] px-4 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary)"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
