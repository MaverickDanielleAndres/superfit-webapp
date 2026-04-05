export interface ApiProblemResponse {
  title?: string
  detail?: string
  code?: string
  requestId?: string
  errors?: unknown
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly body: ApiProblemResponse | null

  constructor(message: string, status: number, body: ApiProblemResponse | null) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.body = body
  }
}

export interface ApiSuccessResponse<T> {
  data: T
  meta?: {
    requestId?: string
  }
}

export async function requestApi<T>(input: string, init?: RequestInit): Promise<ApiSuccessResponse<T>> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
  const headers = new Headers(init?.headers || {})
  const method = String(init?.method || 'GET').toUpperCase()
  const shouldAutoToast = method !== 'GET' && headers.get('x-auto-toast') !== 'off'

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const problem = (body && typeof body === 'object' ? (body as ApiProblemResponse) : null)
    const message = problem?.detail || problem?.title || `Request failed with status ${response.status}`
    if (shouldAutoToast) {
      void emitActionToast('error', message)
    }
    throw new ApiRequestError(message, response.status, problem)
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new ApiRequestError('Invalid API response format.', response.status, null)
  }

  if (shouldAutoToast) {
    void emitActionToast('success', successMessageForMethod(method))
  }

  return body as ApiSuccessResponse<T>
}

function successMessageForMethod(method: string): string {
  if (method === 'POST') return 'Created successfully.'
  if (method === 'DELETE') return 'Deleted successfully.'
  if (method === 'PUT' || method === 'PATCH') return 'Updated successfully.'
  return 'Action completed successfully.'
}

async function emitActionToast(tone: 'success' | 'error', message: string): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const { toast } = await import('sonner')
    if (tone === 'success') {
      toast.success(message)
      return
    }

    toast.error(message)
  } catch {
    // Ignore toast runtime failures and preserve API behavior.
  }
}
