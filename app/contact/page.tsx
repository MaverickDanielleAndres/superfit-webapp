import Link from 'next/link'
import { Headset } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-(--bg-base)">
      <section className="w-full max-w-[560px] rounded-[24px] border border-(--border-subtle) bg-(--bg-surface) p-8 shadow-sm">
        <div className="w-[56px] h-[56px] rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <Headset className="w-[26px] h-[26px]" />
        </div>

        <h1 className="mt-4 font-display font-bold text-[28px] text-(--text-primary)">Contact SuperFit Support</h1>
        <p className="mt-2 text-[14px] text-(--text-secondary)">
          For account access, moderation appeals, and billing concerns, contact us directly.
        </p>

        <div className="mt-5 rounded-[14px] border border-(--border-default) bg-[var(--bg-elevated)] p-4 text-[14px]">
          <p className="font-bold text-(--text-primary)">Email</p>
          <a className="text-emerald-600 hover:underline" href="mailto:support@superfit.app">support@superfit.app</a>
          <p className="mt-3 font-bold text-(--text-primary)">Expected response time</p>
          <p className="text-(--text-secondary)">24-48 hours on business days.</p>
        </div>

        <div className="mt-6">
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
