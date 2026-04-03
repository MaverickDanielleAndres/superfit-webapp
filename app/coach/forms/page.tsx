'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Copy, Edit2, Trash2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCoachPortalStore } from '@/store/useCoachPortalStore'

export default function FormsPage() {
    const {
        forms,
        clients,
        fetchForms,
        fetchClients,
        createForm,
        duplicateForm,
        deleteForm,
        updateFormStatus,
        assignFormToClients,
    } = useCoachPortalStore()
    const [assignmentOpen, setAssignmentOpen] = useState(false)
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [assignmentDeadline, setAssignmentDeadline] = useState('')

    useEffect(() => {
        void fetchForms()
        void fetchClients()
    }, [fetchClients, fetchForms])

    const selectedForm = useMemo(
        () => forms.find((form) => form.id === selectedFormId) || null,
        [forms, selectedFormId],
    )

    const assignableClients = useMemo(
        () => clients.filter((client) => client.status === 'Active' || client.status === 'Onboarding'),
        [clients],
    )

    const closeAssignmentModal = () => {
        setAssignmentOpen(false)
        setSelectedFormId(null)
        setSelectedClientIds([])
        setAssignmentDeadline('')
    }

    const handleAction = (action: string, formId: string) => {
        const target = forms.find((form) => form.id === formId)
        if (!target) return

        void (async () => {
            if (action === 'Sending/Assigning') {
                setSelectedFormId(target.id)
                setAssignmentOpen(true)
                return
            }
            if (action === 'Duplicating') {
                await duplicateForm(target.id)
                toast.success(`Duplicated ${target.name}.`)
                return
            }
            if (action === 'Editing') {
                await updateFormStatus(target.id, target.status === 'Draft' ? 'Active' : 'Draft')
                toast.success(`Updated ${target.name} status.`)
                return
            }
            if (action === 'Deleting') {
                await deleteForm(target.id)
                toast.success(`Deleted ${target.name}.`)
                return
            }
            toast(`${action} for ${target.name}`)
        })()
    }

    const handleAssign = async () => {
        if (!selectedForm) return
        if (!selectedClientIds.length) {
            toast.error('Select at least one client before assigning.')
            return
        }

        await assignFormToClients(
            selectedForm.id,
            selectedClientIds,
            assignmentDeadline ? new Date(`${assignmentDeadline}T00:00:00`).toISOString() : undefined,
        )
        toast.success(`Assigned ${selectedForm.name} to ${selectedClientIds.length} clients.`)
        closeAssignmentModal()
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Forms & Assessments</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Create custom questionnaires for client onboarding and weekly check-ins.</p>
                </div>
                <button 
                    onClick={() => {
                        void (async () => {
                            await createForm('New Form')
                            toast.success('Created draft form.')
                        })()
                    }}
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
                                        <button onClick={() => toast.info('Response viewer will open in the next slice.')} className="hover:text-emerald-500 underline decoration-dashed underline-offset-4 transition-colors">
                                            {form.submissions}
                                        </button>
                                    </td>
                                    <td className="p-5 text-(--text-secondary)">{form.lastUpdated}</td>
                                    <td className="p-5 pr-6 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => handleAction('Sending/Assigning', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Send/Assign">
                                            <Send className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Duplicating', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Duplicate">
                                            <Copy className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Editing', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-(--border-subtle) border border-transparent hover:border-(--border-default) flex items-center justify-center text-(--text-secondary) transition-colors" title="Edit">
                                            <Edit2 className="w-[16px] h-[16px]" />
                                        </button>
                                        <button onClick={() => handleAction('Deleting', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center text-(--text-secondary) hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 className="w-[16px] h-[16px]" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {assignmentOpen && selectedForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-[560px] bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-[20px] text-(--text-primary)">Assign Form</h3>
                            <button
                                onClick={closeAssignmentModal}
                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        <div className="text-[14px] text-(--text-secondary)">
                            <span className="font-bold text-(--text-primary)">{selectedForm.name}</span>
                            {' '}will be assigned to selected clients.
                        </div>

                        <div className="max-h-[260px] overflow-y-auto rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] divide-y divide-(--border-subtle)">
                            {assignableClients.map((client) => (
                                <label key={client.id} className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[14px] text-(--text-primary)">{client.name}</span>
                                        <span className="text-[12px] text-(--text-secondary)">{client.email}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedClientIds.includes(client.id)}
                                        onChange={(event) => {
                                            if (event.target.checked) {
                                                setSelectedClientIds((current) => [...current, client.id])
                                            } else {
                                                setSelectedClientIds((current) => current.filter((id) => id !== client.id))
                                            }
                                        }}
                                        className="accent-emerald-500 w-[16px] h-[16px]"
                                    />
                                </label>
                            ))}
                            {!assignableClients.length && (
                                <div className="px-4 py-3 text-[13px] text-(--text-secondary)">No assignable clients available.</div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-body text-[13px] font-bold text-(--text-secondary)">Deadline (Optional)</label>
                            <input
                                type="date"
                                value={assignmentDeadline}
                                onChange={(event) => setAssignmentDeadline(event.target.value)}
                                className="h-[42px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={closeAssignmentModal}
                                className="h-[40px] px-4 rounded-[10px] border border-(--border-default) text-(--text-secondary) font-bold text-[13px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { void handleAssign() }}
                                className="h-[40px] px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[13px]"
                            >
                                Assign to Clients
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
