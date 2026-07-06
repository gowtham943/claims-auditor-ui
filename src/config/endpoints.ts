import { API_BASE_URL, WS_BASE_URL } from './env'

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
  user: {
    me: '/user/me',
    enroll: '/user/enroll',
  },
  ingestion: {
    policy: '/api/v1/ingestion/policy/',
    policies: '/api/v1/ingestion/policy/',
    claim: '/api/v1/ingestion/claim/',
    claims: '/api/v1/ingestion/claim/',
    claimDetail: (id: string) => `/api/v1/ingestion/claim/${id}`,
  },
  chat: {
    query: '/api/v1/chat/query',
  },
  ws: {
    tracking: (id: string) => `/ws/${id}`,
  },
} as const

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export function wsUrl(trackingId: string, token: string): string {
  const path = API_ENDPOINTS.ws.tracking(trackingId)
  return `${WS_BASE_URL}${path}?token=${encodeURIComponent(token)}`
}

export { API_BASE_URL, WS_BASE_URL }
