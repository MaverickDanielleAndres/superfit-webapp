export default function RouteLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-7 w-52 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
      <div className="h-4 w-72 rounded bg-[var(--bg-surface)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        ))}
      </div>
      <span className="sr-only">Loading auth...</span>
    </div>
  )
}
