'use client'

import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Admin portal error</h2>
        <p className="mt-2 text-[14px] text-(--text-secondary)">Please retry this admin section.</p>
        <button
          onClick={reset}
          className="mt-5 h-[40px] px-5 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px]"
        >
          Reload Admin View
        </button>
      </div>
    </div>
  )
}
