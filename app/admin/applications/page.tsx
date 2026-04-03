'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Check, X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'

export default function AdminApplicationsPage() {
    const { applications, fetchApplications, updateApplicationStatus } = useAdminPortalStore()

    useEffect(() => {
        void fetchApplications()
    }, [fetchApplications])

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Coach Applications</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Review pending applications and verify credentials before granting coach access.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map((application) => (
                    <div key={application.id} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
                            <div className="flex items-center gap-3">
                                <div className="w-[48px] h-[48px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center font-display font-bold text-[18px]">{application.name[0] || 'A'}</div>
                                <div>
                                    <h3 className="font-display font-black text-[18px] text-(--text-primary)">{application.name}</h3>
                                    <p className="font-body text-[13px] text-(--text-secondary)">Applied {application.submittedAt}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)] font-bold text-[11px] uppercase tracking-wider rounded-full">{application.status}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 font-body text-[14px]">
                            <p><span className="font-bold text-(--text-secondary)">Specialties:</span> {application.specialties.join(', ') || 'General Fitness'}</p>
                            <p><span className="font-bold text-(--text-secondary)">Experience:</span> {application.experienceYears} Years</p>
                            <div className="p-3 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-default) flex items-start gap-3 mt-2">
                                <FileText className="w-[20px] h-[20px] text-(--text-tertiary) shrink-0" />
                                <div>
                                    <span className="block font-bold text-[14px] text-(--text-primary) mb-1">Coach Certificate</span>
                                    <span className="block text-[12px] text-(--text-secondary)">{application.email}</span>
                                    {application.certificateUrl && (
                                        <a href={application.certificateUrl} target="_blank" rel="noreferrer" className="text-red-500 font-bold text-[12px] flex items-center gap-1 mt-2 hover:text-red-600 transition-colors"><ExternalLink className="w-[12px] h-[12px]" /> View Document</a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 mt-auto">
                            <button onClick={() => {
                                void (async () => {
                                    await updateApplicationStatus(application.id, 'Rejected')
                                    toast.success(`Rejected ${application.name}.`)
                                })()
                            }} className="flex-1 h-[44px] rounded-[12px] bg-red-500/10 text-red-600 border border-transparent hover:border-red-500/20 font-bold text-[14px] flex items-center justify-center gap-2 transition-colors">
                                <X className="w-[18px] h-[18px]" /> Reject
                            </button>
                            <button onClick={() => {
                                void (async () => {
                                    await updateApplicationStatus(application.id, 'Approved')
                                    toast.success(`Approved ${application.name} as coach.`)
                                })()
                            }} className="flex-1 h-[44px] rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors">
                                <Check className="w-[18px] h-[18px]" /> Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
