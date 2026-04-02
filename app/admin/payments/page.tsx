'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Download, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminPaymentsPage() {
    const transactions = [
        { id: '1', user: 'Jake Mitchell', coach: 'Marcus Thorne', amount: '$49.00', status: 'Succeeded', date: 'Mar 5, 2024, 10:23 AM' },
        { id: '2', user: 'Samantha Lee', coach: 'Marcus Thorne', amount: '$99.00', status: 'Succeeded', date: 'Mar 4, 2024, 02:15 PM' },
        { id: '3', user: 'Chris Evans', coach: 'Sarah Connor', amount: '$199.00', status: 'Failed', date: 'Mar 4, 2024, 09:00 AM' },
        { id: '4', user: 'Emma Wilson', coach: 'Sarah Connor', amount: '$49.00', status: 'Refunded', date: 'Mar 3, 2024, 11:45 AM' },
        { id: '5', user: 'Arthur Shelby', coach: 'Tommy Shelby', amount: '$99.00', status: 'Succeeded', date: 'Mar 2, 2024, 04:30 PM' },
    ]

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Payments & Subscriptions</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Monitor platform revenue, handle refunds, and view transaction history.</p>
                </div>
                <button 
                    onClick={() => {
                        const id = toast.loading('Exporting transaction data...')
                        setTimeout(() => toast.success('CSV downloaded', { id }), 1000)
                    }}
                    className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-primary) font-bold text-[13px] shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center gap-2"
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
                        <h3 className="font-display font-bold text-[16px] text-(--text-primary)">3 Payouts Pending Approval</h3>
                        <p className="font-body text-[13px] text-(--text-secondary)">Total amount pending: <span className="font-bold text-(--text-primary)">$12,450.00</span></p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        const id = toast.loading('Approving payouts...')
                        setTimeout(() => toast.success('All pending payouts approved and processing via Stripe.', { id }), 1500)
                    }}
                    className="h-[40px] px-6 rounded-[12px] bg-(--text-primary) text-(--bg-base) font-bold text-[13px] shadow-sm hover:opacity-90 transition-colors whitespace-nowrap"
                >
                    Approve All Payouts
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Total Volume (30d)', value: '$124,500', trend: '+15.2%', isUp: true },
                    { title: 'Platform Fee Revenue', value: '$12,450', trend: '+15.2%', isUp: true },
                    { title: 'Active Subscriptions', value: '1,248', trend: '+5.4%', isUp: true },
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
                    <div className="relative flex-1 max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="h-[40px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer">
                            <option>Status: All</option>
                            <option>Succeeded</option>
                            <option>Failed</option>
                            <option>Refunded</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
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
                            {transactions.map(txn => (
                                <tr key={txn.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer">
                                    <td className="p-4 pl-6 flex items-center gap-3">
                                        <div className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)">
                                            <CreditCard className="w-[16px] h-[16px]" />
                                        </div>
                                        <span className="font-display font-medium text-[13px] text-(--text-tertiary)">ch_{Math.random().toString(36).substr(2, 9)}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="block font-bold text-[14px] text-(--text-primary)">{txn.user}</span>
                                        <span className="block text-[12px] text-(--text-secondary)">to {txn.coach}</span>
                                    </td>
                                    <td className="p-4 font-display font-bold text-[15px] text-(--text-primary)">{txn.amount}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider",
                                            txn.status === 'Succeeded' ? 'bg-emerald-500/10 text-emerald-600' :
                                            txn.status === 'Failed' ? 'bg-red-500/10 text-red-600' :
                                            'bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)]'
                                        )}>
                                            {txn.status}
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
