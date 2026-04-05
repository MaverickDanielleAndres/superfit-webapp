export function prefetchRoutesWhenIdle(
  routes: string[],
  prefetch: (href: string) => void,
  options?: { timeoutMs?: number; staggerMs?: number },
): () => void {
  if (!routes.length) return () => {}

  const timeoutMs = options?.timeoutMs ?? 1200
  const staggerMs = options?.staggerMs ?? 120

  let isCancelled = false
  const fallbackHandle = setTimeout(runQueue, 160)
  let idleHandle: number | null = null

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    idleHandle = window.requestIdleCallback(runQueue, { timeout: timeoutMs })
  }

  function runQueue() {
    if (isCancelled) return

    routes.forEach((href, index) => {
      window.setTimeout(() => {
        if (isCancelled) return
        prefetch(href)
      }, index * staggerMs)
    })
  }

  return () => {
    isCancelled = true
    clearTimeout(fallbackHandle)
    if (idleHandle !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleHandle)
    }
  }
}
