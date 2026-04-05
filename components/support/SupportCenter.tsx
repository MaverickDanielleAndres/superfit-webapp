'use client'

import React from 'react'
import { MessageSquare, Send, Trash2, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { requestApi } from '@/lib/api/client'
import { cn } from '@/lib/utils'

type SupportScope = 'user' | 'coach' | 'admin'
type TicketStatus = 'pending' | 'in_progress' | 'done'
type RequesterRole = 'user' | 'coach'

interface SupportTicket {
  id: string
  subject: string
  category: string
  status: TicketStatus
  requesterId: string
  requesterRole: RequesterRole
  createdAt: string
  updatedAt: string
  closedAt: string | null
  requester: { fullName: string | null; email: string | null } | null
  assignee: { fullName: string | null; email: string | null } | null
}

interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderRole: 'user' | 'coach' | 'admin'
  message: string
  createdAt: string
  sender: { fullName: string | null; email: string | null } | null
}

interface TicketsResponse {
  tickets: SupportTicket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface MessagesResponse {
  ticket: SupportTicket
  messages: SupportMessage[]
}

const STATUS_OPTIONS: Array<{ label: string; value: TicketStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

function formatDateLabel(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function SupportCenter({ scope }: { scope: SupportScope }) {
  const [tickets, setTickets] = React.useState<SupportTicket[]>([])
  const [messages, setMessages] = React.useState<SupportMessage[]>([])
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const [isTicketsLoading, setIsTicketsLoading] = React.useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | 'all'>('all')
  const [requesterRoleFilter, setRequesterRoleFilter] = React.useState<'all' | RequesterRole>('all')
  const [searchInput, setSearchInput] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  const [newTicketSubject, setNewTicketSubject] = React.useState('')
  const [newTicketCategory, setNewTicketCategory] = React.useState('general')
  const [newTicketMessage, setNewTicketMessage] = React.useState('')
  const [showCreateForm, setShowCreateForm] = React.useState(false)

  const [replyMessage, setReplyMessage] = React.useState('')

  const selectedTicket = React.useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [selectedTicketId, tickets],
  )

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchTickets = React.useCallback(
    async (options?: { keepSelection?: boolean }) => {
      setIsTicketsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '20',
        })

        if (statusFilter !== 'all') {
          params.set('status', statusFilter)
        }

        if (scope === 'admin' && requesterRoleFilter !== 'all') {
          params.set('requesterRole', requesterRoleFilter)
        }

        if (debouncedSearch.length) {
          params.set('search', debouncedSearch)
        }

        const response = await requestApi<TicketsResponse>(`/api/v1/support/tickets?${params.toString()}`)
        const nextTickets = response.data.tickets || []

        setTickets(nextTickets)
        setTotalPages(response.data.totalPages || 1)

        if (!options?.keepSelection) {
          const firstTicketId = nextTickets[0]?.id || null
          setSelectedTicketId(firstTicketId)
        } else if (selectedTicketId && !nextTickets.some((ticket) => ticket.id === selectedTicketId)) {
          setSelectedTicketId(nextTickets[0]?.id || null)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load support tickets.')
      } finally {
        setIsTicketsLoading(false)
      }
    },
    [debouncedSearch, page, requesterRoleFilter, scope, selectedTicketId, statusFilter],
  )

  const fetchMessages = React.useCallback(async (ticketId: string | null) => {
    if (!ticketId) {
      setMessages([])
      return
    }

    setIsMessagesLoading(true)
    try {
      const response = await requestApi<MessagesResponse>(`/api/v1/support/tickets/${ticketId}/messages`)
      setMessages(response.data.messages || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load support messages.')
      setMessages([])
    } finally {
      setIsMessagesLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  React.useEffect(() => {
    void fetchMessages(selectedTicketId)
  }, [fetchMessages, selectedTicketId])

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim().length || !newTicketMessage.trim().length) {
      toast.error('Subject and message are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestApi<{ ticket: SupportTicket }>('/api/v1/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: newTicketSubject.trim(),
          category: newTicketCategory.trim() || 'general',
          message: newTicketMessage.trim(),
        }),
      })

      const newTicket = response.data.ticket
      setShowCreateForm(false)
      setNewTicketSubject('')
      setNewTicketCategory('general')
      setNewTicketMessage('')
      setPage(1)
      await fetchTickets({ keepSelection: true })
      setSelectedTicketId(newTicket.id)
      await fetchMessages(newTicket.id)
      toast.success('Support ticket created.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create support ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (status: TicketStatus) => {
    if (!selectedTicketId || scope !== 'admin') return

    setIsSubmitting(true)
    try {
      await requestApi<{ id: string; status: TicketStatus }>(`/api/v1/support/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await fetchTickets({ keepSelection: true })
      await fetchMessages(selectedTicketId)
      toast.success(`Ticket marked ${status.replace('_', ' ')}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update ticket status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTicket = async () => {
    if (!selectedTicketId || scope !== 'admin') return

    const confirmed = window.confirm('Delete this support ticket? This hides it from all users.')
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      await requestApi<{ deleted: boolean }>(`/api/v1/support/tickets/${selectedTicketId}`, {
        method: 'DELETE',
      })
      setSelectedTicketId(null)
      setMessages([])
      await fetchTickets()
      toast.success('Ticket deleted.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyMessage.trim().length) {
      toast.error('Reply message is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await requestApi<{ message: SupportMessage }>(`/api/v1/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage.trim() }),
      })
      setReplyMessage('')
      await fetchMessages(selectedTicketId)
      await fetchTickets({ keepSelection: true })
      toast.success('Reply sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send reply.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="font-display font-bold text-[24px] text-(--text-primary)">
          {scope === 'admin' ? 'Support Tickets' : 'Support'}
        </h1>
        <p className="text-[14px] text-(--text-secondary)">
          {scope === 'admin'
            ? 'Review client and coach concerns, reply, and close tickets.'
            : 'Submit concerns to admin and track replies in one thread.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-4">
        <section className="rounded-[18px] border border-(--border-subtle) bg-(--bg-surface) p-4 flex flex-col gap-3 min-h-[620px]">
          <div className="flex items-center gap-2">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search subject/category"
              className="h-[36px] flex-1 rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px]"
            />
            <button
              type="button"
              onClick={() => void fetchTickets({ keepSelection: true })}
              className="h-[36px] w-[36px] rounded-[10px] border border-(--border-default) flex items-center justify-center"
              aria-label="Refresh tickets"
            >
              <RefreshCcw className="w-[14px] h-[14px]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as TicketStatus | 'all')
                setPage(1)
              }}
              className="h-[36px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-2 text-[12px]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {scope === 'admin' && (
              <select
                value={requesterRoleFilter}
                onChange={(event) => {
                  setRequesterRoleFilter(event.target.value as 'all' | RequesterRole)
                  setPage(1)
                }}
                className="h-[36px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-2 text-[12px]"
              >
                <option value="all">All Roles</option>
                <option value="user">Clients</option>
                <option value="coach">Coaches</option>
              </select>
            )}

            {scope !== 'admin' && (
              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="ml-auto h-[36px] px-3 rounded-[10px] bg-emerald-500 text-white text-[12px] font-bold flex items-center gap-1"
              >
                <Plus className="w-[14px] h-[14px]" /> New
              </button>
            )}
          </div>

          {scope !== 'admin' && showCreateForm && (
            <div className="rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] p-3 flex flex-col gap-2">
              <input
                value={newTicketSubject}
                onChange={(event) => setNewTicketSubject(event.target.value)}
                placeholder="Subject"
                className="h-[34px] rounded-[8px] border border-(--border-default) bg-(--bg-surface) px-2 text-[12px]"
              />
              <input
                value={newTicketCategory}
                onChange={(event) => setNewTicketCategory(event.target.value)}
                placeholder="Category (billing, account, content...)"
                className="h-[34px] rounded-[8px] border border-(--border-default) bg-(--bg-surface) px-2 text-[12px]"
              />
              <textarea
                value={newTicketMessage}
                onChange={(event) => setNewTicketMessage(event.target.value)}
                placeholder="Describe your concern"
                rows={3}
                className="rounded-[8px] border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-[12px] resize-none"
              />
              <button
                type="button"
                onClick={() => void handleCreateTicket()}
                disabled={isSubmitting}
                className="h-[34px] rounded-[8px] bg-emerald-500 text-white text-[12px] font-bold disabled:opacity-60"
              >
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto pr-1 flex flex-col gap-2">
            {isTicketsLoading && (
              <p className="text-[12px] text-(--text-tertiary)">Loading tickets...</p>
            )}

            {!isTicketsLoading && tickets.length === 0 && (
              <p className="text-[12px] text-(--text-tertiary)">No tickets found.</p>
            )}

            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className={cn(
                  'w-full text-left rounded-[12px] border p-3 transition-colors',
                  selectedTicketId === ticket.id
                    ? 'border-emerald-500 bg-emerald-500/8'
                    : 'border-(--border-default) bg-(--bg-surface) hover:bg-[var(--bg-elevated)]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[13px] text-(--text-primary) line-clamp-2">{ticket.subject}</p>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                      ticket.status === 'done'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : ticket.status === 'in_progress'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-slate-500/15 text-slate-600',
                    )}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-(--text-secondary) mt-1">{ticket.category}</p>
                <p className="text-[11px] text-(--text-tertiary) mt-1">
                  {scope === 'admin'
                    ? `${ticket.requesterRole === 'coach' ? 'Coach' : 'Client'} • ${ticket.requester?.fullName || ticket.requester?.email || 'User'}`
                    : `Updated ${formatDateLabel(ticket.updatedAt)}`}
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="h-[32px] px-2 rounded-[8px] border border-(--border-default) text-[11px] disabled:opacity-50"
            >
              Prev
            </button>
            <p className="text-[11px] text-(--text-secondary)">
              Page {page} / {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="h-[32px] px-2 rounded-[8px] border border-(--border-default) text-[11px] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        <section className="rounded-[18px] border border-(--border-subtle) bg-(--bg-surface) p-4 flex flex-col min-h-[620px]">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-(--text-tertiary)">
              <MessageSquare className="w-8 h-8" />
              <p>Select a support ticket to view messages.</p>
            </div>
          ) : (
            <>
              <div className="pb-3 border-b border-(--border-subtle)">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display font-bold text-[18px] text-(--text-primary)">{selectedTicket.subject}</h2>
                    <p className="text-[12px] text-(--text-secondary)">
                      {selectedTicket.category} • {selectedTicket.requesterRole === 'coach' ? 'Coach' : 'Client'}
                    </p>
                  </div>
                  <span className="text-[11px] text-(--text-tertiary)">{formatDateLabel(selectedTicket.updatedAt)}</span>
                </div>

                {scope === 'admin' && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate('pending')}
                      disabled={isSubmitting}
                      className="h-[32px] px-3 rounded-[8px] border border-(--border-default) text-[12px]"
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate('in_progress')}
                      disabled={isSubmitting}
                      className="h-[32px] px-3 rounded-[8px] border border-amber-500/40 text-amber-700 text-[12px]"
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate('done')}
                      disabled={isSubmitting}
                      className="h-[32px] px-3 rounded-[8px] border border-emerald-500/40 text-emerald-700 text-[12px]"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTicket()}
                      disabled={isSubmitting}
                      className="h-[32px] px-3 rounded-[8px] border border-red-500/40 text-red-700 text-[12px] flex items-center gap-1"
                    >
                      <Trash2 className="w-[12px] h-[12px]" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto py-3 space-y-2">
                {isMessagesLoading && <p className="text-[12px] text-(--text-tertiary)">Loading messages...</p>}

                {!isMessagesLoading && messages.length === 0 && (
                  <p className="text-[12px] text-(--text-tertiary)">No messages yet.</p>
                )}

                {messages.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'rounded-[12px] border p-3',
                      entry.senderRole === 'admin'
                        ? 'bg-emerald-500/8 border-emerald-500/20'
                        : 'bg-(--bg-surface) border-(--border-default)',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-(--text-primary)">
                        {entry.senderRole === 'admin'
                          ? 'Admin Support'
                          : entry.sender?.fullName || entry.sender?.email || 'User'}
                      </p>
                      <p className="text-[10px] text-(--text-tertiary)">{formatDateLabel(entry.createdAt)}</p>
                    </div>
                    <p className="text-[13px] text-(--text-secondary) mt-1 whitespace-pre-wrap">{entry.message}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-(--border-subtle) flex items-end gap-2">
                <textarea
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  placeholder="Write your reply"
                  rows={3}
                  className="flex-1 rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 py-2 text-[13px] resize-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSendReply()}
                  disabled={isSubmitting}
                  className="h-[38px] px-3 rounded-[10px] bg-emerald-500 text-white flex items-center gap-1 text-[12px] font-bold disabled:opacity-60"
                >
                  <Send className="w-[13px] h-[13px]" /> Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
