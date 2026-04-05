'use client'

import React from 'react'
import { Bell, Loader2, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestApi } from '@/lib/api/client'
import { useAuthStore } from '@/store/useAuthStore'
import { disableCoachUserAppMode } from '@/lib/navigation/portalMode'
import { cn } from '@/lib/utils'

type TicketStatus = 'pending' | 'in_progress' | 'done'

interface TicketItem {
  id: string
  subject: string
  category: string
  status: TicketStatus
  requester: {
    fullName: string | null
    email: string | null
  } | null
  requesterRole: 'coach' | 'user'
  updatedAt: string
}

interface TicketListResponse {
  tickets: TicketItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface AdminTopBarProps {
  onToggleMobileNav: () => void
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) {
    const mins = Math.max(1, Math.floor(diffMs / minute))
    return `${mins}m ago`
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours}h ago`
  }

  const days = Math.max(1, Math.floor(diffMs / day))
  return `${days}d ago`
}

export function AdminTopBar({ onToggleMobileNav }: AdminTopBarProps) {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { resolvedTheme, setTheme } = useTheme()

  const [isBannerOpen, setIsBannerOpen] = React.useState(false)
  const [isLoadingTickets, setIsLoadingTickets] = React.useState(false)
  const [pendingCount, setPendingCount] = React.useState(0)
  const [inProgressCount, setInProgressCount] = React.useState(0)
  const [tickets, setTickets] = React.useState<TicketItem[]>([])

  const totalAttentionCount = pendingCount + inProgressCount

  const fetchTicketSummary = React.useCallback(async () => {
    setIsLoadingTickets(true)
    try {
      const [pending, inProgress, latest] = await Promise.all([
        requestApi<TicketListResponse>('/api/v1/support/tickets?status=pending&page=1&pageSize=1'),
        requestApi<TicketListResponse>('/api/v1/support/tickets?status=in_progress&page=1&pageSize=1'),
        requestApi<TicketListResponse>('/api/v1/support/tickets?page=1&pageSize=8'),
      ])

      setPendingCount(Number(pending.data.total || 0))
      setInProgressCount(Number(inProgress.data.total || 0))
      setTickets(latest.data.tickets || [])
    } catch (error) {
      setPendingCount(0)
      setInProgressCount(0)
      setTickets([])
      toast.error(error instanceof Error ? error.message : 'Unable to load support ticket notifications.')
    } finally {
      setIsLoadingTickets(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchTicketSummary()

    const intervalId = window.setInterval(() => {
      void fetchTicketSummary()
    }, 15_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [fetchTicketSummary])

  const handleLogout = () => {
    disableCoachUserAppMode()
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 h-[64px] px-3 sm:px-4 md:px-5 lg:px-[28px] border-b border-(--border-subtle) bg-(--bg-base) flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Open admin navigation"
          className="lg:hidden w-[38px] h-[38px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Menu className="w-[20px] h-[20px]" />
        </button>

        <div className="min-w-0">
          <h2 className="font-display font-semibold text-[16px] sm:text-[18px] text-(--text-primary) truncate">Admin Panel</h2>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsBannerOpen((current) => !current)
              if (!isBannerOpen) {
                void fetchTicketSummary()
              }
            }}
            aria-label="Open ticket notifications"
            className="relative w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors"
          >
            {isLoadingTickets ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Bell className="w-[18px] h-[18px]" />}
            {totalAttentionCount > 0 && (
              <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-(--bg-base)">
                {totalAttentionCount > 99 ? '99+' : totalAttentionCount}
              </span>
            )}
          </button>

          {isBannerOpen && (
            <>
              <button
                type="button"
                aria-label="Close ticket banner"
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsBannerOpen(false)}
              />

              <div className="absolute right-0 top-[48px] z-50 w-[min(360px,calc(100vw-1rem))] rounded-[14px] border border-(--border-subtle) bg-(--bg-surface) shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-(--border-subtle) bg-[var(--bg-elevated)]">
                  <h3 className="font-display font-bold text-[15px] text-(--text-primary)">Ticket Notifications</h3>
                  <p className="text-[12px] text-(--text-secondary)">{pendingCount} pending • {inProgressCount} in progress</p>
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {tickets.length === 0 && (
                    <div className="px-4 py-6 text-[13px] text-(--text-secondary) text-center">No support tickets yet.</div>
                  )}

                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => {
                        setIsBannerOpen(false)
                        router.push('/admin/support')
                      }}
                      className="w-full px-4 py-3 text-left border-b border-(--border-subtle) last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-[13px] text-(--text-primary) line-clamp-1">{ticket.subject}</p>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                            ticket.status === 'pending'
                              ? 'bg-red-500/15 text-red-600'
                              : ticket.status === 'in_progress'
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-emerald-500/15 text-emerald-600',
                          )}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[12px] text-(--text-secondary) line-clamp-1">
                        {ticket.requesterRole === 'coach' ? 'Coach' : 'Client'} • {ticket.requester?.fullName || ticket.requester?.email || 'User'}
                      </p>
                      <p className="text-[11px] text-(--text-tertiary) mt-1">Updated {formatRelativeTime(ticket.updatedAt)}</p>
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 border-t border-(--border-subtle) bg-[var(--bg-elevated)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBannerOpen(false)
                      router.push('/admin/support')
                    }}
                    className="w-full h-[34px] rounded-[10px] bg-(--bg-surface) border border-(--border-default) text-[12px] font-bold text-(--text-primary) hover:bg-[var(--bg-elevated)]"
                  >
                    Open Support Inbox
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="h-[36px] sm:h-[40px] px-3 rounded-[10px] border border-(--border-default) text-(--text-secondary) hover:text-red-600 hover:border-red-500/40 hover:bg-red-500/10 transition-colors text-[12px] sm:text-[13px] font-bold flex items-center gap-1"
        >
          <LogOut className="w-[14px] h-[14px]" /> Logout
        </button>
      </div>
    </header>
  )
}
