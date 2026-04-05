const DICEBEAR_BASE = 'https://api.dicebear.com/7.x/notionists/svg?seed='

export function getAvatarFallbackUrl(seed: string): string {
  return `${DICEBEAR_BASE}${encodeURIComponent(seed || 'user')}`
}

export function getSafeImageSrc(src: string | null | undefined, fallback: string): string {
  const normalized = String(src || '').trim()
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return fallback
  }
  return normalized
}
