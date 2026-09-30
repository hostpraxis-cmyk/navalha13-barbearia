import type {
  AccountUser,
  AuthBootstrap,
  CurrentUserResponse,
  HistoryResponse,
  SimulationRecord,
} from '../shared/contracts'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

let bootstrapPromise: Promise<AuthBootstrap> | null = null
let bootstrapFetchedAt = 0
const BOOTSTRAP_REFRESH_MS = 7 * 60 * 1000

function apiPath(path: string): string {
  const base = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function readCsrfCookie(): string | undefined {
  const item = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('n13_auth_csrf='))
  if (!item) return undefined
  try {
    return decodeURIComponent(item.slice('n13_auth_csrf='.length))
  } catch {
    return undefined
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await getAuthBootstrap()
    const csrfToken = readCsrfCookie()
    if (!csrfToken) throw new ApiError('Não foi possível iniciar a proteção desta ação. Atualize a página e tente novamente.', 403, 'csrf_failed')
    headers.set('X-CSRF-Token', csrfToken)
  }

  let response: Response
  try {
    response = await fetch(apiPath(path), {
      ...init,
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    throw new ApiError('Não foi possível falar com o serviço da conta. Tente novamente.', 0, 'network_error')
  }

  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' ? payload as { error?: unknown; code?: unknown } : {}
    throw new ApiError(
      typeof detail.error === 'string' ? detail.error : 'Não foi possível concluir a ação. Tente novamente.',
      response.status,
      typeof detail.code === 'string' ? detail.code : undefined,
    )
  }
  return payload as T
}

export function getAuthBootstrap(): Promise<AuthBootstrap> {
  if (!bootstrapPromise || (bootstrapFetchedAt > 0 && Date.now() - bootstrapFetchedAt >= BOOTSTRAP_REFRESH_MS)) {
    bootstrapFetchedAt = 0
    bootstrapPromise = request<AuthBootstrap>('/api/auth/bootstrap').then((result) => {
      bootstrapFetchedAt = Date.now()
      return result
    }).catch((error: unknown) => {
      bootstrapPromise = null
      bootstrapFetchedAt = 0
      throw error
    })
  }
  return bootstrapPromise
}

export function resetAuthBootstrapCache(): void {
  bootstrapPromise = null
  bootstrapFetchedAt = 0
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>('/api/auth/me')
}

export async function exchangeGoogleCredential(credential: string): Promise<AccountUser> {
  const result = await request<{ user: AccountUser }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
  return result.user
}

export async function registerAccount(email: string, password: string): Promise<AccountUser> {
  const result = await request<{ user: AccountUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return result.user
}

export async function loginWithPassword(email: string, password: string): Promise<AccountUser> {
  const result = await request<{ user: AccountUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return result.user
}

export function getHistory(): Promise<HistoryResponse> {
  return request<HistoryResponse>('/api/history')
}

export async function createSimulation(input: {
  serviceId: string
  barberId: string
  dayId: string
  date: string
  time: string
}): Promise<SimulationRecord> {
  const result = await request<{ item: SimulationRecord }>('/api/history', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return result.item
}

export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' })
}

export function clearHistory(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/history', { method: 'DELETE' })
}

export function deleteAccount(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/account', { method: 'DELETE' })
}
