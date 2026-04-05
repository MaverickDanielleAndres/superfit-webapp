'use client'

import React, { useEffect, useState } from 'react'
import { Search, ShieldAlert, UserX, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function AdminUsersPage() {
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'coach' | 'admin'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive' | 'pending_review'>('all')
    const [pageSize, setPageSize] = useState(10)
    const [includeDeactivated, setIncludeDeactivated] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<null | {
        id: string
        fullName: string
        email: string
        role: 'User' | 'Coach' | 'Admin'
        status: 'Active' | 'Suspended' | 'Inactive' | 'Pending Review'
        isPremium: boolean
    }>(null)
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
        users,
        userPagination,
        fetchUsers,
        updateUserStatus,
        togglePremium,
        updateUser,
        softDeleteUser,
    } = useAdminPortalStore()

    useEffect(() => {
        let isMounted = true

        void (async () => {
            setIsPageLoading(true)
            await fetchUsers({
                page: 1,
                pageSize,
                search: '',
                role: 'all',
                status: 'all',
                includeDeleted: includeDeactivated,
            })
            if (isMounted) setIsPageLoading(false)
        })()

        return () => {
            isMounted = false
        }
    }, [fetchUsers, includeDeactivated, pageSize])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim())
        }, 300)

        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        if (isPageLoading) return

        void fetchUsers({
            page: 1,
            pageSize,
            search: debouncedSearch,
            role: roleFilter,
            status: statusFilter,
            includeDeleted: includeDeactivated,
        })
    }, [debouncedSearch, fetchUsers, includeDeactivated, isPageLoading, pageSize, roleFilter, statusFilter])

    useEffect(() => {
        const handleDocumentClick = () => {
            setActiveMenuUserId(null)
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
        await fetchUsers({
            page: nextPage,
            pageSize: userPagination.pageSize || pageSize,
            search: debouncedSearch,
            role: roleFilter,
            status: statusFilter,
            includeDeleted: includeDeactivated,
        })
    }

    const openEditModal = (user: {
        id: string
        name: string
        email: string
        role: 'User' | 'Coach' | 'Admin'
        status: 'Active' | 'Suspended' | 'Inactive' | 'Pending Review'
        isPremium: boolean
    }) => {
        setEditingUser({
            id: user.id,
            fullName: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            isPremium: user.isPremium,
        })
        setActiveMenuUserId(null)
    }

    const saveEditedUser = async () => {
        if (!editingUser) return

        try {
            await updateUser(editingUser.id, {
                fullName: editingUser.fullName,
                email: editingUser.email,
                role: editingUser.role,
                status: editingUser.status,
                isPremium: editingUser.isPremium,
            })

            toast.success('User details updated.')
            setEditingUser(null)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to update user details.')
        }
    }

    const currentPage = userPagination.page
    const totalPages = userPagination.totalPages
    const canGoBack = currentPage > 1
    const canGoNext = currentPage < totalPages

    if (isPageLoading && users.length === 0) {
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
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">User Management</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage all registered users, handle suspensions, and view activity.</p>
                </div>
                <button
                    onClick={() => setShowAdvancedFilters((current) => !current)}
                    className="h-[40px] w-full sm:w-auto px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) border border-(--border-default) font-bold text-[13px] shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center justify-center gap-2"
                >
                    <SlidersHorizontal className="w-[16px] h-[16px]" />
                    Advanced Filters
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 w-full sm:max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value as 'all' | 'user' | 'coach' | 'admin')}
                            className="h-[40px] w-full sm:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
                        >
                            <option value="all">Role: All</option>
                            <option value="user">User</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'suspended' | 'inactive' | 'pending_review')}
                            className="h-[40px] w-full sm:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer"
                        >
                            <option value="all">Status: All</option>
                            <option value="active">Active</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {showAdvancedFilters && (
                    <div className="px-4 pb-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)]/60">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                            <div className="flex flex-col gap-1 w-full sm:w-[180px]">
                                <label className="text-[12px] font-bold text-(--text-secondary)">Rows per page</label>
                                <select
                                    value={pageSize}
                                    onChange={(event) => setPageSize(Number(event.target.value))}
                                    className="h-[36px] px-3 rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[13px] font-bold"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <label className="h-[36px] px-3 rounded-[10px] border border-(--border-default) bg-(--bg-surface) inline-flex items-center gap-2 text-[13px] font-bold text-(--text-primary)">
                                <input
                                    type="checkbox"
                                    checked={includeDeactivated}
                                    onChange={(event) => setIncludeDeactivated(event.target.checked)}
                                />
                                Include Deactivated Users
                            </label>
                        </div>
                    </div>
                )}

                <div className="md:hidden p-4 flex flex-col gap-3">
                    {users.map((user) => (
                        <div key={user.id} className="rounded-[16px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={`${user.name} avatar`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" />
                                <div className="min-w-0">
                                    <p className="font-display font-bold text-[15px] text-(--text-primary) truncate">{user.name}</p>
                                    <p className="font-body text-[12px] text-(--text-secondary) truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
                                <span className="px-2 py-1 rounded-[8px] bg-(--bg-surface) border border-(--border-default) text-(--text-secondary) font-bold">{user.role}</span>
                                <span className={cn('px-2 py-1 rounded-[8px] font-bold uppercase text-center', user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : user.status === 'Suspended' ? 'bg-red-500/10 text-red-600' : user.status === 'Pending Review' ? 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]' : 'bg-(--border-subtle) text-(--text-secondary)')}>{user.status}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => {
                                        const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended'
                                        openConfirmation(
                                            {
                                                title: `${nextStatus === 'Suspended' ? 'Suspend' : 'Activate'} User?`,
                                                message: `${user.name} will be marked as ${nextStatus}.`,
                                                confirmText: nextStatus === 'Suspended' ? 'Suspend' : 'Activate',
                                                tone: nextStatus === 'Suspended' ? 'danger' : 'default',
                                            },
                                            async () => {
                                                await updateUserStatus(user.id, nextStatus)
                                                toast.success(`User ${user.name} marked as ${nextStatus}.`)
                                            },
                                        )
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                    title="Suspend"
                                >
                                    <UserX className="w-[16px] h-[16px]" />
                                </button>
                                <button
                                    onClick={() => {
                                        const enablePremium = !user.isPremium
                                        openConfirmation(
                                            {
                                                title: `${enablePremium ? 'Grant' : 'Remove'} Premium?`,
                                                message: `${user.name} will ${enablePremium ? 'gain' : 'lose'} premium access.`,
                                                confirmText: enablePremium ? 'Grant Premium' : 'Remove Premium',
                                                tone: enablePremium ? 'default' : 'danger',
                                            },
                                            async () => {
                                                await togglePremium(user.id, enablePremium)
                                                toast.success(user.isPremium ? `Premium removed from ${user.name}.` : `Premium granted to ${user.name}.`)
                                            },
                                        )
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                    title="Toggle Premium"
                                >
                                    <ShieldAlert className="w-[16px] h-[16px]" />
                                </button>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setActiveMenuUserId((current) => (current === user.id ? null : user.id))
                                    }}
                                    className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                    title="More Actions"
                                >
                                    <MoreVertical className="w-[16px] h-[16px]" />
                                </button>
                            </div>
                            {activeMenuUserId === user.id && (
                                <div className="mt-2 rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-1 flex flex-col">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated)"
                                    >
                                        Edit User
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveMenuUserId(null)
                                            openConfirmation(
                                                {
                                                    title: 'Delete User Permanently?',
                                                    message: `${user.name} will be permanently deleted and lose account access immediately.`,
                                                    confirmText: 'Delete Permanently',
                                                    tone: 'danger',
                                                },
                                                async () => {
                                                    await softDeleteUser(user.id, 'Permanently deleted by admin')
                                                    toast.success(`${user.name} was permanently deleted.`)
                                                },
                                            )
                                        }}
                                        className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-red-600 hover:bg-red-500/10"
                                    >
                                        Delete Permanently
                                    </button>
                                    <button
                                        onClick={() => {
                                            void (async () => {
                                                try {
                                                    await navigator.clipboard.writeText(user.id)
                                                    toast.success('User ID copied to clipboard.')
                                                } catch {
                                                    toast.info(`User ID: ${user.id}`)
                                                }
                                            })()
                                            setActiveMenuUserId(null)
                                        }}
                                        className="h-[34px] px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-secondary) hover:bg-(--bg-elevated)"
                                    >
                                        Copy User ID
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
                                <th className="p-4 font-medium pl-6">User</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Joined</th>
                                <th className="p-4 font-medium text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={`${user.name} avatar`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" />
                                            <div>
                                                <span className="font-display font-bold text-[15px] text-(--text-primary) block">{user.name}</span>
                                                <span className="font-body text-[12px] text-(--text-secondary) block">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-[var(--bg-elevated)] border border-(--border-default) px-2.5 py-1 rounded-[6px] font-bold text-[11px] text-(--text-secondary)">{user.role}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn('px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider', user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : user.status === 'Suspended' ? 'bg-red-500/10 text-red-600' : user.status === 'Pending Review' ? 'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]' : 'bg-(--border-subtle) text-(--text-secondary)')}>{user.status}</span>
                                    </td>
                                    <td className="p-4 text-(--text-secondary)">{user.joined}</td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="relative inline-flex items-center justify-end gap-2 text-(--text-secondary)">
                                            <button
                                                onClick={() => {
                                                    const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended'
                                                    openConfirmation(
                                                        {
                                                            title: `${nextStatus === 'Suspended' ? 'Suspend' : 'Activate'} User?`,
                                                            message: `${user.name} will be marked as ${nextStatus}.`,
                                                            confirmText: nextStatus === 'Suspended' ? 'Suspend' : 'Activate',
                                                            tone: nextStatus === 'Suspended' ? 'danger' : 'default',
                                                        },
                                                        async () => {
                                                            await updateUserStatus(user.id, nextStatus)
                                                            toast.success(`User ${user.name} marked as ${nextStatus}.`)
                                                        },
                                                    )
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                                title="Suspend"
                                            >
                                                <UserX className="w-[16px] h-[16px]" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const enablePremium = !user.isPremium
                                                    openConfirmation(
                                                        {
                                                            title: `${enablePremium ? 'Grant' : 'Remove'} Premium?`,
                                                            message: `${user.name} will ${enablePremium ? 'gain' : 'lose'} premium access.`,
                                                            confirmText: enablePremium ? 'Grant Premium' : 'Remove Premium',
                                                            tone: enablePremium ? 'default' : 'danger',
                                                        },
                                                        async () => {
                                                            await togglePremium(user.id, enablePremium)
                                                            toast.success(user.isPremium ? `Premium removed from ${user.name}.` : `Premium granted to ${user.name}.`)
                                                        },
                                                    )
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                                title="Toggle Premium"
                                            >
                                                <ShieldAlert className="w-[16px] h-[16px]" />
                                            </button>
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    setActiveMenuUserId((current) => (current === user.id ? null : user.id))
                                                }}
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors"
                                                title="More Actions"
                                            >
                                                <MoreVertical className="w-[16px] h-[16px]" />
                                            </button>

                                            {activeMenuUserId === user.id && (
                                                <div
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="absolute top-[42px] right-0 z-20 min-w-[170px] rounded-[12px] border border-(--border-default) bg-(--bg-surface) p-1 shadow-lg"
                                                >
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-primary) hover:bg-(--bg-elevated) flex items-center gap-2"
                                                    >
                                                        <Pencil className="w-[13px] h-[13px]" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenuUserId(null)
                                                            openConfirmation(
                                                                {
                                                                    title: 'Delete User Permanently?',
                                                                    message: `${user.name} will be permanently deleted and lose account access immediately.`,
                                                                    confirmText: 'Delete Permanently',
                                                                    tone: 'danger',
                                                                },
                                                                async () => {
                                                                    await softDeleteUser(user.id, 'Permanently deleted by admin')
                                                                    toast.success(`${user.name} was permanently deleted.`)
                                                                },
                                                            )
                                                        }}
                                                        className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-red-600 hover:bg-red-500/10 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-[13px] h-[13px]" /> Delete Permanently
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            void (async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(user.id)
                                                                    toast.success('User ID copied to clipboard.')
                                                                } catch {
                                                                    toast.info(`User ID: ${user.id}`)
                                                                }
                                                            })()
                                                            setActiveMenuUserId(null)
                                                        }}
                                                        className="h-[34px] w-full px-3 rounded-[8px] text-left text-[12px] font-bold text-(--text-secondary) hover:bg-(--bg-elevated)"
                                                    >
                                                        Copy User ID
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
                        Page {currentPage} of {totalPages} • {userPagination.total} users
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

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        aria-label="Close edit dialog"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setEditingUser(null)}
                    />
                    <div className="relative z-10 w-full max-w-[520px] rounded-[20px] border border-(--border-subtle) bg-(--bg-surface) p-5 shadow-xl">
                        <h3 className="font-display font-bold text-[18px] text-(--text-primary)">Edit User</h3>
                        <p className="text-[13px] text-(--text-secondary) mt-1">Update user profile, role, status, and premium access.</p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-[12px] font-bold text-(--text-secondary)">Full Name</label>
                                <input
                                    value={editingUser.fullName}
                                    onChange={(event) => setEditingUser((current) => (current ? { ...current, fullName: event.target.value } : current))}
                                    className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[12px] font-bold text-(--text-secondary)">Email</label>
                                <input
                                    value={editingUser.email}
                                    onChange={(event) => setEditingUser((current) => (current ? { ...current, email: event.target.value } : current))}
                                    className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-(--text-secondary)">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(event) => setEditingUser((current) => (current ? { ...current, role: event.target.value as 'User' | 'Coach' | 'Admin' } : current))}
                                    className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                                >
                                    <option value="User">User</option>
                                    <option value="Coach">Coach</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-(--text-secondary)">Status</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(event) => setEditingUser((current) => (current ? { ...current, status: event.target.value as 'Active' | 'Suspended' | 'Inactive' | 'Pending Review' } : current))}
                                    className="mt-1 h-[40px] w-full rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 text-[13px]"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[10px] border border-(--border-default) bg-(--bg-elevated) px-3 py-2">
                            <span className="text-[13px] font-bold text-(--text-primary)">Premium Access</span>
                            <button
                                onClick={() => setEditingUser((current) => (current ? { ...current, isPremium: !current.isPremium } : current))}
                                className={cn('w-[44px] h-[24px] rounded-full relative transition-colors', editingUser.isPremium ? 'bg-emerald-500' : 'bg-(--border-default)')}
                            >
                                <span className={cn('absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all', editingUser.isPremium ? 'left-[22px]' : 'left-[2px]')} />
                            </button>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="h-[36px] px-4 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary)"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    void saveEditedUser()
                                }}
                                className="h-[36px] px-4 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold"
                            >
                                Save Changes
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
