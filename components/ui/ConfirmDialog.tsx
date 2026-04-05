'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'default' | 'danger'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close confirmation dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative z-10 w-full max-w-md rounded-[18px] border border-(--border-subtle) bg-(--bg-surface) shadow-xl"
          >
            <div className="p-5 border-b border-(--border-subtle)">
              <h3 className="font-display font-bold text-[18px] text-(--text-primary)">{title}</h3>
              <p className="mt-1 text-[13px] text-(--text-secondary)">{message}</p>
            </div>
            <div className="p-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="h-[36px] px-4 rounded-[10px] border border-(--border-default) text-[12px] font-bold text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-60"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={[
                  'h-[36px] px-4 rounded-[10px] text-[12px] font-bold text-white disabled:opacity-60',
                  tone === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600',
                ].join(' ')}
              >
                {isLoading ? 'Working...' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
