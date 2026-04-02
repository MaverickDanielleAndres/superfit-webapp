'use client'

import React, { useState } from 'react'
import { Search, Filter, ShieldAlert, UserX, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')

    const users = [
        { id: '1', name: 'Alfie Solomon', email: 'alfie@example.com', role: 'User', status: 'Active', joined: 'Mar 1, 2024' },
        { id: '2', name: 'Grace Shelby', email: 'grace@example.com', role: 'User', status: 'Active', joined: 'Feb 28, 2024' },
        { id: '3', name: 'Arthur Shelby', email: 'arthur@example.com', role: 'User', status: 'Suspended', joined: 'Jan 15, 2024' },
        { id: '4', name: 'Tommy Shelby', email: 'tommy@example.com', role: 'Coach', status: 'Active', joined: 'Dec 10, 2023' },
        { id: '5', name: 'John Shelby', email: 'john@example.com', role: 'User', status: 'Inactive', joined: 'Nov 5, 2023' },
    ]

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        user.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">User Management</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Manage all registered users, handle suspensions, and view activity.</p>
                </div>
                <button className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) border border-(--border-default) font-bold text-[13px] shadow-sm hover:bg-[var(--bg-surface-alt)] transition-colors flex items-center gap-2">
                    <Filter className="w-[16px] h-[16px]" /> Advanced Filters
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-(--border-subtle) bg-[var(--bg-elevated)] flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] bg-(--bg-surface) border border-(--border-default) focus:border-red-500 font-body text-[14px] outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="h-[40px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer">
                            <option>Role: All</option>
                            <option>User</option>
                            <option>Coach</option>
                        </select>
                        <select className="h-[40px] px-3 rounded-[12px] bg-(--bg-surface) border border-(--border-default) font-body text-[13px] font-bold outline-none cursor-pointer">
                            <option>Status: All</option>
                            <option>Active</option>
                            <option>Suspended</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
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
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="p-4 pl-6 flex items-center gap-3">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} className="w-[40px] h-[40px] rounded-full border border-(--border-subtle)" />
                                        <div>
                                            <span className="font-display font-bold text-[15px] text-(--text-primary) block">{user.name}</span>
                                            <span className="font-body text-[12px] text-(--text-secondary) block">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-[var(--bg-elevated)] border border-(--border-default) px-2.5 py-1 rounded-[6px] font-bold text-[11px] text-(--text-secondary)">{user.role}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn("px-2.5 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider", user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : user.status === 'Suspended' ? 'bg-red-500/10 text-red-600' : 'bg-(--border-subtle) text-(--text-secondary)')}>{user.status}</span>
                                    </td>
                                    <td className="p-4 text-(--text-secondary)">{user.joined}</td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-(--text-secondary)">
                                            <button onClick={() => toast.success(`User ${user.name} suspended`)} className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors" title="Suspend"><UserX className="w-[16px] h-[16px]" /></button>
                                            <button onClick={() => toast.success(`Viewing audit log for ${user.name}`)} className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors" title="Audit Log"><ShieldAlert className="w-[16px] h-[16px]" /></button>
                                            <button 
                                                onClick={() => toast.info(`Options for ${user.name}`, {
                                                    action: { label: 'Give Premium', onClick: () => toast.success(`Premium granted to ${user.name}`) },
                                                    cancel: { label: 'Delete', onClick: () => toast.error(`User ${user.name} deleted`) }
                                                })} 
                                                className="w-[36px] h-[36px] rounded-[10px] hover:bg-(--border-subtle) flex items-center justify-center transition-colors" title="More Actions">
                                                <MoreVertical className="w-[16px] h-[16px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    )
}
