export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-[var(--bg-surface)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        <div className="h-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
      </div>
    </div>
  )
}
