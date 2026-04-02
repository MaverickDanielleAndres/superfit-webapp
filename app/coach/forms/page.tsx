'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Copy, Edit2, Trash2, Send, Eye } from 'lucide-react'
import { toast } from 'sonner'

export default function FormsPage() {
    const forms = [
        { id: '1', name: 'Initial Intake Assessment', submissions: 145, lastUpdated: 'Mar 1, 2024', status: 'Active' },
        { id: '2', name: 'Weekly Check-in Form', submissions: 890, lastUpdated: 'Feb 15, 2024', status: 'Active' },
        { id: '3', name: 'Post-Meet Reflection', submissions: 12, lastUpdated: 'Dec 10, 2023', status: 'Draft' },
        { id: '4', name: 'Dietary Preferences Questionnaire', submissions: 56, lastUpdated: 'Jan 5, 2024', status: 'Active' },
    ]

    const handleAction = (action: string, formName: string) => {
        toast(`${action} for ${formName}`, {
            description: 'Action simulated successfully.'
        })
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Forms & Assessments</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Create custom questionnaires for client onboarding and weekly check-ins.</p>
                </div>
                <button 
                    onClick={() => toast('Opening Form Builder...')}
                    className="h-[44px] px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-[18px] h-[18px]" /> Create Form
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left font-body text-[14px]">
                        <thead className="border-b border-(--border-subtle) text-(--text-secondary) font-bold text-[12px] uppercase tracking-wider bg-[var(--bg-elevated)]/50">
                            <tr>
                                <th className="p-5 font-medium pl-6">Form Name</th>
                                <th className="p-5 font-medium">Status</th>
                                <th className="p-5 font-medium">Submissions</th>
                                <th className="p-5 font-medium">Last Updated</th>
                                <th className="p-5 font-medium text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map(form => (
                                <tr key={form.id} className="border-b border-(--border-subtle) hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="p-5 pl-6 flex items-center gap-3">
                                        <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) group-hover:text-emerald-500 transition-colors">
                                            <FileText className="w-[20px] h-[20px]" />
                                        </div>
                                        <span className="font-display font-bold text-[15px] text-(--text-primary)">{form.name}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${form.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-(--border-subtle) text-(--text-secondary)'}`}>
                                            {form.status}
                                        </span>
                                    </td>
                                    <td className="p-5 font-medium text-(--text-primary)">
                                        <button onClick={() => handleAction('Opening Responses Viewer', form.name)} className="hover:text-emerald-500 underline decoration-dashed underline-offset-4 transition-colors">
                                            {form.submissions}
                                        </button>
                                    </td>
                                    <td className="p-5 text-(--text-secondary)">{form.lastUpdated}</td>
                                    <td className="p-5 pr-6 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => handleAction('Sending/Assigning', form.name)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Send/Assign">
                                            <Send className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Duplicating', form.name)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Duplicate">
                                            <Copy className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Editing', form.name)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Edit">
                                            <Edit2 className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Deleting', form.name)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center text-(--text-secondary) hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 className="w-[16px] h-[16px]" />
                                        </button>
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
