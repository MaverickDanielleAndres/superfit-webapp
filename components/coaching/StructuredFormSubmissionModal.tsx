'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export type StructuredQuestionType = 'short_text' | 'long_text' | 'number' | 'date' | 'single_select' | 'multi_select' | 'checkbox_group' | 'scale'

export interface StructuredFormQuestion {
    id: string
    label: string
    type: StructuredQuestionType
    required: boolean
    options: string[]
    scaleMin?: number
    scaleMax?: number
    scaleStep?: number
}

export interface StructuredFormAssignment {
    id: string
    deadline: string | null
    form: {
        id: string
        name: string
        questions: StructuredFormQuestion[]
    }
}

interface StructuredFormSubmissionModalProps {
    open: boolean
    assignment: StructuredFormAssignment | null
    isSubmitting: boolean
    onClose: () => void
    onSubmit: (response: Record<string, unknown>) => Promise<void>
}

type AnswerValue = string | string[]

function isEmptyValue(value: AnswerValue | undefined): boolean {
    if (Array.isArray(value)) return value.length === 0
    return !value || value.trim().length === 0
}

function asArray(value: AnswerValue | undefined): string[] {
    return Array.isArray(value) ? value : []
}

function previewValue(value: AnswerValue | undefined): string {
    if (!value) return '-'
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
    return value.trim().length ? value : '-'
}

export function StructuredFormSubmissionModal({
    open,
    assignment,
    isSubmitting,
    onClose,
    onSubmit,
}: StructuredFormSubmissionModalProps) {
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})

    const questions = assignment?.form.questions || []

    useEffect(() => {
        if (!open) return
        setAnswers({})
    }, [open, assignment?.id])

    const requiredMissing = useMemo(() => {
        return questions.some((question) => {
            if (!question.required) return false
            return isEmptyValue(answers[question.id])
        })
    }, [answers, questions])

    const canSubmit = useMemo(() => {
        if (isSubmitting) return false
        if (!assignment) return false
        if (questions.length === 0) {
            return !isEmptyValue(answers.__notes as AnswerValue | undefined)
        }

        return !requiredMissing
    }, [answers.__notes, assignment, isSubmitting, questions.length, requiredMissing])

    const answeredPreviewRows = useMemo(() => {
        if (!questions.length) {
            return isEmptyValue(answers.__notes as AnswerValue | undefined)
                ? []
                : [{ key: '__notes', label: 'Response Notes', value: previewValue(answers.__notes as AnswerValue | undefined) }]
        }

        return questions
            .map((question) => ({
                key: question.id,
                label: question.label,
                value: previewValue(answers[question.id]),
                hasValue: !isEmptyValue(answers[question.id]),
            }))
            .filter((row) => row.hasValue)
            .map((row) => ({ key: row.key, label: row.label, value: row.value }))
    }, [answers, questions])

    const handleConfirm = async () => {
        if (!assignment) return

        const responseAnswers: Record<string, unknown> = {}

        if (questions.length === 0) {
            responseAnswers.__notes = {
                label: 'Response Notes',
                type: 'long_text',
                value: String(answers.__notes || '').trim(),
            }
        } else {
            for (const question of questions) {
                const rawValue = answers[question.id]
                if (isEmptyValue(rawValue)) continue

                let normalizedValue: unknown = rawValue
                if (question.type === 'number' || question.type === 'scale') {
                    normalizedValue = Number(Array.isArray(rawValue) ? rawValue[0] : rawValue)
                } else if (question.type === 'multi_select' || question.type === 'checkbox_group') {
                    normalizedValue = Array.isArray(rawValue) ? rawValue : []
                }

                responseAnswers[question.id] = {
                    label: question.label,
                    type: question.type,
                    value: normalizedValue,
                }
            }
        }

        responseAnswers._meta = {
            assignmentId: assignment.id,
            formId: assignment.form.id,
            submittedAt: new Date().toISOString(),
            submitSource: 'structured_client_form',
        }

        await onSubmit(responseAnswers)
    }

    return (
        <AnimatePresence>
            {open && assignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="relative w-full max-w-[680px] bg-(--bg-surface) rounded-[24px] p-6 shadow-xl z-10 max-h-[85vh] overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 w-[34px] h-[34px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"
                        >
                            <X className="w-[16px] h-[16px]" />
                        </button>

                        <h2 className="font-display font-bold text-[24px] pr-10">{assignment.form.name}</h2>
                        <p className="mt-2 text-[13px] text-(--text-secondary)">
                            {assignment.deadline
                                ? `Due ${new Date(assignment.deadline).toLocaleString()}`
                                : 'No deadline set'}
                        </p>

                        <div className="mt-6 space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                            {questions.length > 0 ? questions.map((question) => (
                                <div key={question.id} className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-4">
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">
                                        {question.label}
                                        {question.required && <span className="text-red-500"> *</span>}
                                    </label>

                                    {question.type === 'short_text' && (
                                        <input
                                            type="text"
                                            value={answers[question.id] || ''}
                                            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                            className="w-full h-[42px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px] focus:outline-none focus:border-emerald-500"
                                        />
                                    )}

                                    {question.type === 'long_text' && (
                                        <textarea
                                            value={answers[question.id] || ''}
                                            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                            className="w-full h-[96px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-3 text-[13px] resize-none focus:outline-none focus:border-emerald-500"
                                        />
                                    )}

                                    {question.type === 'number' && (
                                        <input
                                            type="number"
                                            value={answers[question.id] || ''}
                                            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                            className="w-full h-[42px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px] focus:outline-none focus:border-emerald-500"
                                        />
                                    )}

                                    {question.type === 'date' && (
                                        <input
                                            type="date"
                                            value={answers[question.id] || ''}
                                            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                            className="w-full h-[42px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px] focus:outline-none focus:border-emerald-500"
                                        />
                                    )}

                                    {question.type === 'single_select' && (
                                        <select
                                            value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                                            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                            className="w-full h-[42px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 text-[13px] focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Select an option</option>
                                            {question.options.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    )}

                                    {question.type === 'multi_select' && (
                                        <select
                                            multiple
                                            value={asArray(answers[question.id])}
                                            onChange={(event) => {
                                                const nextValue = Array.from(event.target.selectedOptions).map((option) => option.value)
                                                setAnswers((current) => ({ ...current, [question.id]: nextValue }))
                                            }}
                                            className="w-full min-h-[104px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-500"
                                        >
                                            {question.options.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    )}

                                    {question.type === 'checkbox_group' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {question.options.map((option) => {
                                                const checkedValues = asArray(answers[question.id])
                                                const isChecked = checkedValues.includes(option)

                                                return (
                                                    <label key={option} className="flex items-center gap-2 rounded-[8px] border border-(--border-default) bg-(--bg-surface) px-3 py-2 text-[13px] text-(--text-primary)">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-emerald-500"
                                                            checked={isChecked}
                                                            onChange={(event) => {
                                                                setAnswers((current) => {
                                                                    const existing = asArray(current[question.id])
                                                                    const next = event.target.checked
                                                                        ? [...existing, option]
                                                                        : existing.filter((value) => value !== option)
                                                                    return { ...current, [question.id]: next }
                                                                })
                                                            }}
                                                        />
                                                        <span>{option}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {question.type === 'scale' && (
                                        <div>
                                            <input
                                                type="range"
                                                min={question.scaleMin ?? 1}
                                                max={question.scaleMax ?? 10}
                                                step={question.scaleStep ?? 1}
                                                value={typeof answers[question.id] === 'string' && answers[question.id] !== ''
                                                    ? answers[question.id]
                                                    : String(question.scaleMin ?? 1)}
                                                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                                                className="w-full accent-emerald-500"
                                            />
                                            <div className="mt-2 flex items-center justify-between text-[12px] text-(--text-secondary)">
                                                <span>{question.scaleMin ?? 1}</span>
                                                <span className="font-bold text-(--text-primary)">
                                                    {typeof answers[question.id] === 'string' && answers[question.id] !== ''
                                                        ? answers[question.id]
                                                        : String(question.scaleMin ?? 1)}
                                                </span>
                                                <span>{question.scaleMax ?? 10}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-4">
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">
                                        Response Notes <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={typeof answers.__notes === 'string' ? answers.__notes : ''}
                                        onChange={(event) => setAnswers((current) => ({ ...current, __notes: event.target.value }))}
                                        placeholder="Add your response details"
                                        className="w-full h-[120px] rounded-[10px] border border-(--border-default) bg-(--bg-surface) p-3 text-[13px] resize-none focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-4">
                            <p className="text-[12px] font-bold uppercase tracking-wide text-(--text-secondary) mb-2">Answer Preview</p>
                            {answeredPreviewRows.length > 0 ? (
                                <div className="space-y-2">
                                    {answeredPreviewRows.map((row) => (
                                        <div key={row.key} className="text-[13px]">
                                            <span className="font-bold text-(--text-primary)">{row.label}:</span>{' '}
                                            <span className="text-(--text-secondary)">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[13px] text-(--text-secondary)">Your answers will appear here before submit.</p>
                            )}
                        </div>

                        {requiredMissing && questions.length > 0 && (
                            <p className="mt-3 text-[12px] text-red-500">Please complete all required questions.</p>
                        )}

                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="h-[40px] px-4 rounded-[10px] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { void handleConfirm() }}
                                disabled={!canSubmit}
                                className="h-[40px] px-5 rounded-[10px] bg-emerald-500 text-white font-bold text-[13px] disabled:opacity-60"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Form'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
