'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Check, X, ExternalLink } from 'lucide-react'

export default function AdminApplicationsPage() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div>
                <h1 className="font-display font-bold text-[28px] text-(--text-primary)">Coach Applications</h1>
                <p className="font-body text-[14px] text-(--text-secondary)">Review pending applications and verify credentials before granting coach access.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] shadow-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
                            <div className="flex items-center gap-3">
                                <div className="w-[48px] h-[48px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center font-display font-bold text-[18px]">J</div>
                                <div>
                                    <h3 className="font-display font-black text-[18px] text-(--text-primary)">James Logan</h3>
                                    <p className="font-body text-[13px] text-(--text-secondary)">Applied 2 days ago</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-[var(--status-warning-bg)]/30 text-[var(--status-warning)] font-bold text-[11px] uppercase tracking-wider rounded-full">Pending</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 font-body text-[14px]">
                            <p><span className="font-bold text-(--text-secondary)">Specialties:</span> Hypertrophy, Mobility</p>
                            <p><span className="font-bold text-(--text-secondary)">Experience:</span> 5 Years</p>
                            <div className="p-3 bg-[var(--bg-elevated)] rounded-[12px] border border-(--border-default) flex items-start gap-3 mt-2">
                                <FileText className="w-[20px] h-[20px] text-(--text-tertiary) shrink-0" />
                                <div>
                                    <span className="block font-bold text-[14px] text-(--text-primary) mb-1">NASM CPT Certificate.pdf</span>
                                    <span className="block text-[12px] text-(--text-secondary)">Uploaded document • 2.4 MB</span>
                                    <button className="text-red-500 font-bold text-[12px] flex items-center gap-1 mt-2 hover:text-red-600 transition-colors"><ExternalLink className="w-[12px] h-[12px]" /> View Document</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 mt-auto">
                            <button className="flex-1 h-[44px] rounded-[12px] bg-red-500/10 text-red-600 border border-transparent hover:border-red-500/20 font-bold text-[14px] flex items-center justify-center gap-2 transition-colors">
                                <X className="w-[18px] h-[18px]" /> Reject
                            </button>
                            <button className="flex-1 h-[44px] rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 transition-colors">
                                <Check className="w-[18px] h-[18px]" /> Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
