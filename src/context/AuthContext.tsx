import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile, UserRole } from '../types/api'
import { apiFetch } from '../lib/api'
import { API_ENDPOINTS, apiUrl } from '../config/endpoints'

const TOKEN_KEY = 'claims_auditor_token'

interface AuthContextValue {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchCurrentUser(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(API_ENDPOINTS.user.me, { token })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)

    const response = await fetch(apiUrl(API_ENDPOINTS.auth.login), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!response.ok) {
      throw new Error('Invalid username or password')
    }

    const data = (await response.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    const profile = await fetchCurrentUser(data.access_token)
    setUser(profile)
  }, [])

  const register = useCallback(async (username: string, password: string, role: UserRole) => {
    const response = await fetch(apiUrl(API_ENDPOINTS.user.enroll), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail || 'Registration failed')
    }

    await login(username, password)
  }, [login])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchCurrentUser(token)
      .then(setUser)
      .catch(() => logout())
      .finally(() => setIsLoading(false))
  }, [token, logout])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
    }),
    [token, user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
