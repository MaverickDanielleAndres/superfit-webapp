'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Download, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { requestApi } from '@/lib/api/client'

export default function AdminPaymentsPage() {
    const { payments, fetchPayments } = useAdminPortalStore()
    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        void fetchPayments()
    }, [fetchPayments])

    const normalizedPayments = useMemo(
        () => payments.map((payment) => ({
            ...payment,
            statusLabel: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
            amountValue: Number.parseFloat(payment.amount.replace(/[^0-9.]/g, '')) || 0,
        })),
        [payments],
    )

    const filteredPayments = useMemo(
        () => normalizedPayments.filter((payment) => {
            const matchesQuery = [payment.user, payment.coach, payment.id]
                .some((value) => value.toLowerCase().includes(query.toLowerCase()))
            const matchesStatus = statusFilter === 'all' || payment.status.toLowerCase() === statusFilter
            return matchesQuery && matchesStatus
        }),
        [normalizedPayments, query, statusFilter],
    )

    const totalVolume = normalizedPayments.reduce((sum, payment) => sum + payment.amountValue, 0)
    const successfulCount = normalizedPayments.filter((payment) => payment.status.toLowerCase() === 'succeeded').length
    const refundedCount = normalizedPayments.filter((payment) => payment.status.toLowerCase() === 'refunded').length
    const pendingPayouts = normalizedPayments.filter((payment) => payment.status.toLowerCase() === 'pending')
    const pendingTotal = pendingPayouts.reduce((sum, payment) => sum + payment.amountValue, 0)

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Payments & Subscriptions</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Monitor platform revenue, handle refunds, and view transaction history.</p>
                </div>
                <button 
                    onClick={() => {
                        const rows = filteredPayments.map((payment) => ({
                            id: payment.id,
                            user: payment.user,
                            coach: payment.coach,
                            amount: payment.amount,
                            status: payment.status,
                            date: payment.date,
                        }))
                        if (!rows.length) {
                            toast.info('No rows to export for the current filter.')
                            return
                        }

                        const headers = ['id', 'user', 'coach', 'amount', 'status', 'date']
                        const csv = [
                            headers.join(','),
                            ...rows.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(',')),
                        ].join('\n')

                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = 'payments-export.csv'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                        toast.success('CSV downloaded.')
                    }}
                    className="h-[40px] w-full sm:w-auto px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center justify-center gap-2"
                >
                    <Download className="w-[16px] h-[16px]" /> Export CSV
                </button>
            </div>

            <div className="bg-[var(--status-warning-bg)]/10 border border-[var(--status-warning)] rounded-[24px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-[48px] h-[48px] rounded-full bg-[var(--status-warning-bg)]/20 text-[var(--status-warning)] flex items-center justify-center shrink-0">
                        <DollarSign className="w-[24px] h-[24px]" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-[16px] text-(--text-primary)">{pendingPayouts.length} Payouts Pending Approval</h3>
                        <p className="font-body text-[13px] text-(--text-secondary)">Total amount pending: <span className="font-bold text-(--text-primary)">${pendingTotal.toFixed(2)}</span></p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        void (async () => {
                            const id = toast.loading('Approving payouts...')
                            try {
                                const response = await requestApi<{ approvedCount: number }>('/api/v1/admin/payments/approve-pending', {
                                    method: 'POST',
                                })

                                await fetchPayments()
                                toast.success(`Approved ${response.data.approvedCount} pending payout(s).`, { id })
                            } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'Unable to approve payouts.', { id })
                                return
                            }
                        })()
                    }}
                    className="h-[40px] px-6 rounded-[12px] bg-(--text-primary) text-(--bg-base) font-bold text-[13px] shadow-sm hover:opacity-90 transition-colors whitespace-nowrap"
                >
                    Approve All Payouts
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Total Volume', value: `$${totalVolume.toFixed(2)}`, trend: `${normalizedPayments.length} transactions`, isUp: true },
                    { title: 'Succeeded Payments', value: `${successfulCount}`, trend: `${((successfulCount / Math.max(normalizedPayments.length, 1)) * 100).toFixed(1)}% success`, isUp: true },
                    { title: 'Refunded Payments', value: `${refundedCount}`, trend: `${((refundedCount / Math.max(normalizedPayments.length, 1)) * 100).toFixed(1)}% refunds`, isUp: false },
                ].map((kpi, i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-body text-[13px] font-bold text-(--text-secondary) uppercase tracking-wider">{kpi.title}</h3>
                            <div className="w-[32px] h-[32px] rounded-[10px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><DollarSign className="w-[16px] h-[16px]" /></div>
                        </div>
                        <p className="font-display font-black text-[32px] text-(--text-primary) leading-none">{kpi.value}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            {kpi.isUp ? <ArrowUpRight className="w-[14px] h-[14px] text-emerald-500" /> : <ArrowDownRight className="w-[14px] h-[14px] text-red-500" />}
                            <span className={cn("font-body text-[13px] font-bold", kpi.isUp ? 'text-emerald-500' : 'text-red-500')}>{kpi.trend} vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col mt-4">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 w-full sm:max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-[40px] w-full sm:w-auto px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer">
                            <option value="all">Status: All</option>
                            <option value="succeeded">Succeeded</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                <div className="md:hidden p-4 flex flex-col gap-3">
                    {filteredPayments.map((txn) => (
                        <div key={txn.id} className="rounded-[16px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <span className="font-display font-medium text-[12px] text-(--text-tertiary) truncate">{txn.id}</span>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-[8px] font-bold text-[11px] uppercase tracking-wider",
                                    txn.statusLabel === 'Succeeded' ? 'bg-emerald-500/10 text-emerald-600' :
                                    txn.statusLabel === 'Failed' ? 'bg-red-500/10 text-red-600' :
                                    'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]'
                                )}>
                                    {txn.statusLabel}
                                </span>
                            </div>
                            <p className="font-bold text-[14px] text-(--text-primary)">{txn.user}</p>
                            <p className="text-[12px] text-(--text-secondary) mb-2">to {txn.coach}</p>
                            <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-[15px] text-(--text-primary)">{txn.amount}</span>
                                <span className="text-[12px] text-(--text-secondary)">{txn.date}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left font-body text-[14px]">
                        <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
                            <tr>
                                <th className="p-4 font-medium pl-6">Transaction</th>
                                <th className="p-4 font-medium">User & Coach</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right pr-6">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((txn) => (
                                <tr key={txn.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                    <td className="p-4 pl-6 flex items-center gap-3">
                                        <div className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)">
                                            <CreditCard className="w-[16px] h-[16px]" />
                                        </div>
                                        <span className="font-display font-medium text-[13px] text-(--text-tertiary)">{txn.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="block font-bold text-[14px] text-(--text-primary)">{txn.user}</span>
                                        <span className="block text-[12px] text-(--text-secondary)">to {txn.coach}</span>
                                    </td>
                                    <td className="p-4 font-display font-bold text-[15px] text-(--text-primary)">{txn.amount}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider",
                                            txn.statusLabel === 'Succeeded' ? 'bg-emerald-500/10 text-emerald-600' :
                                            txn.statusLabel === 'Failed' ? 'bg-red-500/10 text-red-600' :
                                            'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]'
                                        )}>
                                            {txn.statusLabel}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6 text-right text-[13px] text-(--text-secondary)">{txn.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    )
}
