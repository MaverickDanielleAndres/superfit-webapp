import Link from 'next/link'
import { AlertTriangle, Mail } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-(--bg-base)">
      <section className="w-full max-w-[540px] rounded-[24px] border border-(--border-subtle) bg-(--bg-surface) p-8 shadow-sm">
        <div className="w-[56px] h-[56px] rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-[26px] h-[26px]" />
        </div>

        <h1 className="mt-4 font-display font-bold text-[28px] text-(--text-primary)">Account Suspended</h1>
        <p className="mt-2 text-[14px] text-(--text-secondary)">
          Access to this account is currently suspended. If you believe this is a mistake, contact support and include your account email for faster review.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/contact"
            className="h-[42px] px-4 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-[15px] h-[15px]" /> Contact Support
          </Link>
          <Link
            href="/auth"
            className="h-[42px] px-4 rounded-[12px] border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) text-[13px] font-bold inline-flex items-center justify-center"
          >
            Back to Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
