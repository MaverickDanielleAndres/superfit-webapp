import { NextResponse } from 'next/server'

export interface ApiProblem {
  type: string
  title: string
  status: number
  detail: string
  code: string
  requestId: string
  retriable: boolean
  errors?: unknown
}

function problemType(code: string) {
  return `https://superfit.app/errors/${code.toLowerCase().replace(/_/g, '-')}`
}

export function problemResponse(input: {
  status: number
  code: string
  title: string
  detail: string
  requestId: string
  retriable?: boolean
  errors?: unknown
}) {
  const body: ApiProblem = {
    type: problemType(input.code),
    title: input.title,
    status: input.status,
    detail: input.detail,
    code: input.code,
    requestId: input.requestId,
    retriable: input.retriable ?? input.status >= 500,
    ...(input.errors !== undefined ? { errors: input.errors } : {}),
  }

  return NextResponse.json(body, {
    status: input.status,
    headers: {
      'x-request-id': input.requestId,
    },
  })
}

export function dataResponse<T>(input: { data: T; requestId: string; status?: number }) {
  return NextResponse.json(
    {
      data: input.data,
      meta: {
        requestId: input.requestId,
      },
    },
    {
      status: input.status ?? 200,
      headers: {
        'x-request-id': input.requestId,
      },
    },
  )
}
