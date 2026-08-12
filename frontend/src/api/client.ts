import type { ApiErrorBody } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors?: Record<string, string>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.fieldErrors = body.fieldErrors
  }
}

let csrfToken: string | null = null

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken
  const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: 'include' })
  if (!response.ok) throw new Error('보안 토큰을 준비하지 못했습니다.')
  csrfToken = ((await response.json()) as { token: string }).token
  return csrfToken
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const requestCsrfToken = method !== 'GET' && method !== 'HEAD' ? await ensureCsrfToken() : null

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(requestCsrfToken
        ? { 'X-XSRF-TOKEN': requestCsrfToken }
        : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let body: ApiErrorBody
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = {
        status: response.status,
        code: 'REQUEST_FAILED',
        message: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      }
    }
    throw new ApiError(body)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export { API_BASE_URL }
