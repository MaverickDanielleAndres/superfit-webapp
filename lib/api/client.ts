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
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
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
    throw new ApiRequestError(message, response.status, problem)
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new ApiRequestError('Invalid API response format.', response.status, null)
  }

  return body as ApiSuccessResponse<T>
}
