'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Copy, Edit2, Trash2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCoachPortalData } from '@/lib/hooks/useCoachPortalData'
import { requestApi } from '@/lib/api/client'

interface CoachFormSubmission {
    id: string
    clientId: string
    clientName: string
    clientEmail: string
    clientAvatar: string
    response: Record<string, unknown>
    reviewStatus: 'pending' | 'reviewed'
    coachNotes: string
    submittedAt: string
    reviewedAt: string | null
}

type QuestionType = 'short_text' | 'long_text' | 'number' | 'date' | 'single_select' | 'multi_select' | 'checkbox_group' | 'scale'

interface FormQuestion {
    id: string
    label: string
    type: QuestionType
    required: boolean
    options?: string[]
    scaleMin?: number
    scaleMax?: number
    scaleStep?: number
}

interface EditableFormSchema {
    questions: FormQuestion[]
}

export default function FormsPage() {
    const {
        forms,
        clients,
        fetchForms,
        fetchClients,
        createForm,
        duplicateForm,
        deleteForm,
        assignFormToClients,
    } = useCoachPortalData()
    const [assignmentOpen, setAssignmentOpen] = useState(false)
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [assignmentDeadline, setAssignmentDeadline] = useState('')
    const [submissionsOpen, setSubmissionsOpen] = useState(false)
    const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false)
    const [submissionsFormId, setSubmissionsFormId] = useState<string | null>(null)
    const [submissionsFormName, setSubmissionsFormName] = useState('')
    const [submissionItems, setSubmissionItems] = useState<CoachFormSubmission[]>([])
    const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)
    const [notesBySubmissionId, setNotesBySubmissionId] = useState<Record<string, string>>({})
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [formBuilderOpen, setFormBuilderOpen] = useState(false)
    const [isFormBuilderLoading, setIsFormBuilderLoading] = useState(false)
    const [editingFormId, setEditingFormId] = useState<string | null>(null)
    const [builderFormName, setBuilderFormName] = useState('')
    const [builderQuestions, setBuilderQuestions] = useState<FormQuestion[]>([])

    useEffect(() => {
        let isMounted = true

        void (async () => {
            setIsPageLoading(true)
            await Promise.all([fetchForms(), fetchClients()])
            if (isMounted) setIsPageLoading(false)
        })()

        return () => {
            isMounted = false
        }
    }, [fetchClients, fetchForms])

    const selectedForm = useMemo(
        () => forms.find((form) => form.id === selectedFormId) || null,
        [forms, selectedFormId],
    )

    const activeSubmission = useMemo(
        () => submissionItems.find((item) => item.id === activeSubmissionId) || null,
        [activeSubmissionId, submissionItems],
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

    const closeSubmissionsModal = () => {
        setSubmissionsOpen(false)
        setIsSubmissionsLoading(false)
        setSubmissionsFormId(null)
        setSubmissionsFormName('')
        setSubmissionItems([])
        setActiveSubmissionId(null)
        setNotesBySubmissionId({})
    }

    const closeFormBuilder = () => {
        setFormBuilderOpen(false)
        setIsFormBuilderLoading(false)
        setEditingFormId(null)
        setBuilderFormName('')
        setBuilderQuestions([])
    }

    const openFormBuilder = async (formId: string) => {
        const target = forms.find((form) => form.id === formId)
        if (!target) return

        setFormBuilderOpen(true)
        setIsFormBuilderLoading(true)
        setEditingFormId(target.id)
        setBuilderFormName(target.name)
        setBuilderQuestions([])

        try {
            const response = await requestApi<{
                form: {
                    id: string
                    name: string
                    formSchema: EditableFormSchema
                }
            }>(`/api/v1/coach/forms/${target.id}`)

            const schema = response.data.form?.formSchema
            const questions = normalizeQuestions(schema)
            setBuilderFormName(response.data.form?.name || target.name)
            setBuilderQuestions(questions)
        } catch (error) {
            toast.error(getErrorMessage(error))
            closeFormBuilder()
            return
        }

        setIsFormBuilderLoading(false)
    }

    const saveFormBuilder = async () => {
        if (!editingFormId) return

        const normalizedQuestions = builderQuestions
            .map((question) => ({
                ...question,
                label: question.label.trim(),
                options: isOptionBasedQuestion(question.type)
                    ? (question.options || []).map((option) => option.trim()).filter(Boolean)
                    : undefined,
                scaleMin: question.type === 'scale' ? Number(question.scaleMin ?? 1) : undefined,
                scaleMax: question.type === 'scale' ? Number(question.scaleMax ?? 10) : undefined,
                scaleStep: question.type === 'scale' ? Number(question.scaleStep ?? 1) : undefined,
            }))
            .filter((question) => question.label.length > 0)

        try {
            await requestApi(`/api/v1/coach/forms/${editingFormId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: builderFormName.trim() || 'Untitled Form',
                    formSchema: {
                        questions: normalizedQuestions,
                    },
                }),
            })

            await fetchForms({ force: true })
            toast.success('Form configuration saved.')
            closeFormBuilder()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const openSubmissionsModal = async (formId: string) => {
        const target = forms.find((form) => form.id === formId)
        if (!target) return

        setSubmissionsOpen(true)
        setIsSubmissionsLoading(true)
        setSubmissionsFormId(target.id)
        setSubmissionsFormName(target.name)

        try {
            const response = await requestApi<{
                form: { id: string; name: string }
                submissions: CoachFormSubmission[]
            }>(`/api/v1/coach/forms/${target.id}/submissions`)

            const nextItems = Array.isArray(response.data.submissions) ? response.data.submissions : []
            const notesById = nextItems.reduce<Record<string, string>>((acc, item) => {
                acc[item.id] = item.coachNotes || ''
                return acc
            }, {})

            setSubmissionItems(nextItems)
            setNotesBySubmissionId(notesById)
            setActiveSubmissionId(nextItems[0]?.id || null)
            setSubmissionsFormName(response.data.form?.name || target.name)
        } catch (error) {
            toast.error(getErrorMessage(error))
            closeSubmissionsModal()
            return
        }

        setIsSubmissionsLoading(false)
    }

    const updateSubmissionReview = async (
        formId: string,
        submissionId: string,
        payload: { reviewStatus?: 'pending' | 'reviewed'; coachNotes?: string },
    ) => {
        try {
            const response = await requestApi<{
                submission: {
                    id: string
                    reviewStatus: 'pending' | 'reviewed'
                    coachNotes: string
                    reviewedAt: string | null
                }
            }>(`/api/v1/coach/forms/${formId}/submissions`, {
                method: 'PATCH',
                body: JSON.stringify({
                    submissionId,
                    reviewStatus: payload.reviewStatus,
                    coachNotes: payload.coachNotes,
                }),
            })

            const updated = response.data.submission
            setSubmissionItems((current) =>
                current.map((item) =>
                    item.id === updated.id
                        ? {
                            ...item,
                            reviewStatus: updated.reviewStatus,
                            coachNotes: updated.coachNotes,
                            reviewedAt: updated.reviewedAt,
                        }
                        : item,
                ),
            )
            setNotesBySubmissionId((current) => ({
                ...current,
                [updated.id]: updated.coachNotes || '',
            }))
            toast.success('Submission updated.')
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
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
                await openFormBuilder(target.id)
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

    if (isPageLoading && forms.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-pulse">
                <div className="h-7 w-56 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-80 rounded bg-[var(--bg-elevated)]" />
                <div className="h-[500px] rounded-[24px] bg-[var(--bg-elevated)]" />
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-5xl mx-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary)">Forms & Assessments</h1>
                    <p className="font-body text-[14px] text-(--text-secondary)">Create custom questionnaires for client onboarding and weekly check-ins.</p>
                </div>
                <button 
                    onClick={() => {
                        void (async () => {
                            await createForm('New Form')
                            toast.success('Created draft form.')
                        })()
                    }}
                    className="h-[44px] w-full sm:w-auto px-6 rounded-[12px] bg-emerald-500 text-white font-bold text-[14px] shadow-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-[18px] h-[18px]" /> Create Form
                </button>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm overflow-hidden">
                <div className="md:hidden p-4 flex flex-col gap-3">
                    {forms.map((form) => (
                        <div key={form.id} className="rounded-[16px] border border-(--border-subtle) bg-[var(--bg-elevated)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-subtle) flex items-center justify-center text-(--text-secondary)">
                                    <FileText className="w-[18px] h-[18px]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display font-bold text-[15px] text-(--text-primary) truncate">{form.name}</p>
                                    <p className="text-[12px] text-(--text-secondary)">{form.lastUpdated}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${form.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-(--border-subtle) text-(--text-secondary)'}`}>
                                    {form.status}
                                </span>
                                <button onClick={() => { void openSubmissionsModal(form.id) }} className="text-[12px] font-bold text-(--text-primary)">
                                    {form.submissions} submissions
                                </button>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleAction('Sending/Assigning', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)" title="Send/Assign"><Send className="w-[16px] h-[16px]" /></button>
                                <button onClick={() => handleAction('Duplicating', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)" title="Duplicate"><Copy className="w-[16px] h-[16px]" /></button>
                                <button onClick={() => handleAction('Editing', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)" title="Edit"><Edit2 className="w-[16px] h-[16px]" /></button>
                                <button onClick={() => handleAction('Deleting', form.id)} className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-surface)] border border-(--border-default) flex items-center justify-center text-(--text-secondary)" title="Delete"><Trash2 className="w-[16px] h-[16px]" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block overflow-x-auto min-h-[400px]">
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
                                        <button onClick={() => { void openSubmissionsModal(form.id) }} className="hover:text-emerald-500 underline decoration-dashed underline-offset-4 transition-colors">
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

            {formBuilderOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-[900px] max-h-[90vh] overflow-hidden bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-bold text-[20px] text-(--text-primary)">Form Builder</h3>
                                <p className="text-[13px] text-(--text-secondary)">Configure fields, validation, and question order.</p>
                            </div>
                            <button
                                onClick={closeFormBuilder}
                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        {isFormBuilderLoading ? (
                            <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-6 text-[14px] text-(--text-secondary)">
                                Loading form schema...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr,220px] gap-3">
                                    <input
                                        value={builderFormName}
                                        onChange={(event) => setBuilderFormName(event.target.value)}
                                        placeholder="Form Name"
                                        className="h-[42px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        onClick={() => {
                                            setBuilderQuestions((current) => [
                                                ...current,
                                                {
                                                    id: crypto.randomUUID(),
                                                    label: 'New Question',
                                                    type: 'short_text',
                                                    required: false,
                                                    options: [],
                                                    scaleMin: 1,
                                                    scaleMax: 10,
                                                    scaleStep: 1,
                                                },
                                            ])
                                        }}
                                        className="h-[42px] px-4 rounded-[10px] bg-(--bg-elevated) border border-(--border-default) text-(--text-primary) font-bold text-[13px]"
                                    >
                                        + Add Question
                                    </button>
                                </div>

                                <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-3 flex-1 overflow-y-auto min-h-[260px]">
                                    <div className="flex flex-col gap-3">
                                        {builderQuestions.map((question) => (
                                            <div key={question.id} className="rounded-[12px] border border-(--border-subtle) bg-(--bg-surface) p-3 flex flex-col gap-2">
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr,160px,120px,40px] gap-2 items-center">
                                                    <input
                                                        value={question.label}
                                                        onChange={(event) => {
                                                            const nextLabel = event.target.value
                                                            setBuilderQuestions((current) => current.map((entry) => entry.id === question.id ? { ...entry, label: nextLabel } : entry))
                                                        }}
                                                        placeholder="Question label"
                                                        className="h-[38px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                                                    />
                                                    <select
                                                        value={question.type}
                                                        onChange={(event) => {
                                                            const nextType = event.target.value as QuestionType
                                                            setBuilderQuestions((current) =>
                                                                current.map((entry) =>
                                                                    entry.id === question.id
                                                                        ? {
                                                                            ...entry,
                                                                            type: nextType,
                                                                            options: isOptionBasedQuestion(nextType) ? (entry.options || ['Option 1']) : [],
                                                                            scaleMin: nextType === 'scale' ? Number(entry.scaleMin ?? 1) : undefined,
                                                                            scaleMax: nextType === 'scale' ? Number(entry.scaleMax ?? 10) : undefined,
                                                                            scaleStep: nextType === 'scale' ? Number(entry.scaleStep ?? 1) : undefined,
                                                                        }
                                                                        : entry,
                                                                ),
                                                            )
                                                        }}
                                                        className="h-[38px] px-2 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[13px] outline-none"
                                                    >
                                                        <option value="short_text">Short text</option>
                                                        <option value="long_text">Long text</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="single_select">Single select</option>
                                                        <option value="multi_select">Multi-select</option>
                                                        <option value="checkbox_group">Checkbox group</option>
                                                        <option value="scale">Scale slider</option>
                                                    </select>
                                                    <label className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-emerald-500 w-[14px] h-[14px]"
                                                            checked={question.required}
                                                            onChange={(event) => {
                                                                const required = event.target.checked
                                                                setBuilderQuestions((current) => current.map((entry) => entry.id === question.id ? { ...entry, required } : entry))
                                                            }}
                                                        />
                                                        Required
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            setBuilderQuestions((current) => current.filter((entry) => entry.id !== question.id))
                                                        }}
                                                        className="w-[36px] h-[36px] rounded-[10px] border border-(--border-default) text-(--text-secondary) hover:text-red-500 flex items-center justify-center"
                                                    >
                                                        <Trash2 className="w-[14px] h-[14px]" />
                                                    </button>
                                                </div>

                                                {isOptionBasedQuestion(question.type) && (
                                                    <div className="flex flex-col gap-2">
                                                        {(question.options || []).map((option, optionIndex) => (
                                                            <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                                                                <input
                                                                    value={option}
                                                                    onChange={(event) => {
                                                                        const nextValue = event.target.value
                                                                        setBuilderQuestions((current) =>
                                                                            current.map((entry) => {
                                                                                if (entry.id !== question.id) return entry
                                                                                const nextOptions = [...(entry.options || [])]
                                                                                nextOptions[optionIndex] = nextValue
                                                                                return { ...entry, options: nextOptions }
                                                                            }),
                                                                        )
                                                                    }}
                                                                    placeholder={`Option ${optionIndex + 1}`}
                                                                    className="h-[34px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[12px] outline-none flex-1"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        setBuilderQuestions((current) =>
                                                                            current.map((entry) => {
                                                                                if (entry.id !== question.id) return entry
                                                                                return { ...entry, options: (entry.options || []).filter((_, idx) => idx !== optionIndex) }
                                                                            }),
                                                                        )
                                                                    }}
                                                                    className="w-[30px] h-[30px] rounded-[8px] border border-(--border-default) text-(--text-secondary) flex items-center justify-center"
                                                                >
                                                                    <X className="w-[12px] h-[12px]" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                setBuilderQuestions((current) =>
                                                                    current.map((entry) =>
                                                                        entry.id === question.id
                                                                            ? { ...entry, options: [...(entry.options || []), `Option ${(entry.options || []).length + 1}`] }
                                                                            : entry,
                                                                    ),
                                                                )
                                                            }}
                                                            className="h-[30px] px-3 rounded-[8px] border border-dashed border-(--border-default) text-[12px] font-bold text-(--text-secondary)"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    </div>
                                                )}

                                                {question.type === 'scale' && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input
                                                            type="number"
                                                            value={question.scaleMin ?? 1}
                                                            onChange={(event) => {
                                                                const nextValue = Number(event.target.value)
                                                                setBuilderQuestions((current) =>
                                                                    current.map((entry) =>
                                                                        entry.id === question.id ? { ...entry, scaleMin: Number.isFinite(nextValue) ? nextValue : 1 } : entry,
                                                                    ),
                                                                )
                                                            }}
                                                            className="h-[34px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[12px] outline-none"
                                                            placeholder="Min"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={question.scaleMax ?? 10}
                                                            onChange={(event) => {
                                                                const nextValue = Number(event.target.value)
                                                                setBuilderQuestions((current) =>
                                                                    current.map((entry) =>
                                                                        entry.id === question.id ? { ...entry, scaleMax: Number.isFinite(nextValue) ? nextValue : 10 } : entry,
                                                                    ),
                                                                )
                                                            }}
                                                            className="h-[34px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[12px] outline-none"
                                                            placeholder="Max"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={question.scaleStep ?? 1}
                                                            onChange={(event) => {
                                                                const nextValue = Number(event.target.value)
                                                                setBuilderQuestions((current) =>
                                                                    current.map((entry) =>
                                                                        entry.id === question.id ? { ...entry, scaleStep: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1 } : entry,
                                                                    ),
                                                                )
                                                            }}
                                                            className="h-[34px] px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-[12px] outline-none"
                                                            placeholder="Step"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {!builderQuestions.length && (
                                            <div className="rounded-[12px] border border-dashed border-(--border-default) p-4 text-[13px] text-(--text-secondary)">
                                                No questions yet. Add your first question to start the form.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={closeFormBuilder}
                                        className="h-[38px] px-4 rounded-[10px] border border-(--border-default) text-(--text-secondary) font-bold text-[12px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { void saveFormBuilder() }}
                                        className="h-[38px] px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[12px]"
                                    >
                                        Save Form
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {submissionsOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-[980px] max-h-[90vh] overflow-hidden bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-bold text-[20px] text-(--text-primary)">Submission Viewer</h3>
                                <p className="text-[13px] text-(--text-secondary)">{submissionsFormName || 'Form'}</p>
                            </div>
                            <button
                                onClick={closeSubmissionsModal}
                                className="w-[36px] h-[36px] rounded-[10px] bg-[var(--bg-elevated)] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) flex items-center justify-center"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>
                        </div>

                        {isSubmissionsLoading ? (
                            <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-6 text-[14px] text-(--text-secondary)">
                                Loading submissions...
                            </div>
                        ) : submissionItems.length === 0 ? (
                            <div className="rounded-[14px] border border-dashed border-(--border-default) bg-[var(--bg-elevated)] p-6 text-[14px] text-(--text-secondary)">
                                No submissions available for this form yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4 min-h-0 flex-1 overflow-hidden">
                                <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] overflow-y-auto">
                                    {submissionItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSubmissionId(item.id)}
                                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-(--border-subtle) transition-colors ${activeSubmissionId === item.id ? 'bg-emerald-500/10' : 'hover:bg-(--bg-surface)'}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-[13px] text-(--text-primary) truncate">{item.clientName}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.reviewStatus === 'reviewed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                    {item.reviewStatus}
                                                </span>
                                            </div>
                                            <span className="block text-[11px] text-(--text-secondary) truncate">{item.clientEmail}</span>
                                            <span className="block text-[11px] text-(--text-tertiary)">{new Date(item.submittedAt).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>

                                {activeSubmission ? (
                                    <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-4 overflow-y-auto">
                                        <div className="flex items-center gap-3 mb-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={activeSubmission.clientAvatar} alt={activeSubmission.clientName} className="w-[44px] h-[44px] rounded-full object-cover border border-(--border-subtle)" />
                                            <div>
                                                <p className="font-display font-bold text-[16px] text-(--text-primary)">{activeSubmission.clientName}</p>
                                                <p className="text-[12px] text-(--text-secondary)">{activeSubmission.clientEmail}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4 rounded-[12px] border border-(--border-subtle) bg-(--bg-surface) p-3">
                                            <p className="font-bold text-[12px] text-(--text-secondary) uppercase tracking-wide mb-2">Response</p>
                                            <div className="flex flex-col gap-2">
                                                {Object.entries(activeSubmission.response || {}).map(([key, value]) => (
                                                    <div key={key} className="text-[13px]">
                                                        <span className="font-bold text-(--text-primary)">{key}:</span>{' '}
                                                        <span className="text-(--text-secondary)">{formatResponseValue(value)}</span>
                                                    </div>
                                                ))}
                                                {Object.keys(activeSubmission.response || {}).length === 0 && (
                                                    <span className="text-[13px] text-(--text-secondary)">No answers submitted.</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-bold text-[12px] text-(--text-secondary) uppercase tracking-wide">Coach Notes</label>
                                            <textarea
                                                value={notesBySubmissionId[activeSubmission.id] || ''}
                                                onChange={(event) => {
                                                    const nextValue = event.target.value
                                                    setNotesBySubmissionId((current) => ({
                                                        ...current,
                                                        [activeSubmission.id]: nextValue,
                                                    }))
                                                }}
                                                className="h-[120px] rounded-[12px] border border-(--border-default) bg-(--bg-surface) p-3 text-[13px] outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 mt-4">
                                            <button
                                                onClick={() => {
                                                    void updateSubmissionReview(submissionsFormId || '', activeSubmission.id, { reviewStatus: 'pending' })
                                                }}
                                                className="h-[38px] px-4 rounded-[10px] border border-(--border-default) text-(--text-secondary) font-bold text-[12px]"
                                            >
                                                Mark Pending
                                            </button>
                                            <button
                                                onClick={() => {
                                                    void updateSubmissionReview(submissionsFormId || '', activeSubmission.id, { reviewStatus: 'reviewed' })
                                                }}
                                                className="h-[38px] px-4 rounded-[10px] border border-emerald-500/40 text-emerald-600 bg-emerald-500/10 font-bold text-[12px]"
                                            >
                                                Mark Reviewed
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const nextNotes = notesBySubmissionId[activeSubmission.id] || ''
                                                    void updateSubmissionReview(submissionsFormId || '', activeSubmission.id, { coachNotes: nextNotes })
                                                }}
                                                className="h-[38px] px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[12px]"
                                            >
                                                Save Notes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-6 text-[14px] text-(--text-secondary)">
                                        Select a submission to review.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return 'Request failed.'
}

function formatResponseValue(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ')
    if (value && typeof value === 'object') return JSON.stringify(value)
    return '-'
}

function normalizeQuestions(schema: EditableFormSchema | undefined): FormQuestion[] {
    const rawQuestions = Array.isArray(schema?.questions) ? schema?.questions : []

    return rawQuestions.map((question, index) => {
        const type = normalizeQuestionType(question?.type)
        return {
            id: typeof question?.id === 'string' && question.id ? question.id : `q-${index + 1}`,
            label: typeof question?.label === 'string' && question.label ? question.label : `Question ${index + 1}`,
            type,
            required: Boolean(question?.required),
            options: isOptionBasedQuestion(type)
                ? (Array.isArray(question?.options) ? question.options.map((value) => String(value)) : ['Option 1'])
                : [],
            scaleMin: type === 'scale' && Number.isFinite(Number(question?.scaleMin)) ? Number(question?.scaleMin) : 1,
            scaleMax: type === 'scale' && Number.isFinite(Number(question?.scaleMax)) ? Number(question?.scaleMax) : 10,
            scaleStep: type === 'scale' && Number.isFinite(Number(question?.scaleStep)) && Number(question?.scaleStep) > 0
                ? Number(question?.scaleStep)
                : 1,
        }
    })
}

function normalizeQuestionType(value: unknown): QuestionType {
    if (value === 'long_text' || value === 'number' || value === 'date' || value === 'single_select' || value === 'multi_select' || value === 'checkbox_group' || value === 'scale') return value
    return 'short_text'
}

function isOptionBasedQuestion(type: QuestionType): boolean {
    return type === 'single_select' || type === 'multi_select' || type === 'checkbox_group'
}
