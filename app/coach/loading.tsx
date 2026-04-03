export default function CoachLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[var(--bg-surface)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  )
}
