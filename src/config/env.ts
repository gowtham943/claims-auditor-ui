const DEFAULT_API_BASE = 'http://localhost:8000'
const DEFAULT_WS_BASE = 'ws://localhost:8000'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || DEFAULT_API_BASE

export const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL?.replace(/\/$/, '') || DEFAULT_WS_BASE
