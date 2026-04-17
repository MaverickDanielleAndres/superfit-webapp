export default function RouteLoading() {
  return (
    <div className="max-w-7xl space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[120px] rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        <div className="h-[280px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        <div className="h-[280px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        <div className="h-[260px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        <div className="h-[260px] rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
      </div>

      <span className="sr-only">Loading dashboard...</span>
    </div>
  )
}
