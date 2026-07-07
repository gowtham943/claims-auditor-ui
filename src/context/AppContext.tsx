import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { apiFetch } from '../lib/api'
import { API_ENDPOINTS } from '../config/endpoints'
import type { IngestedPolicy, PolicySummary } from '../types/api'

interface AppContextValue {
  activeSelectedPolicyId: string
  setActiveSelectedPolicyId: (id: string) => void
  ingestedPolicies: IngestedPolicy[]
  policiesLoading: boolean
  addIngestedPolicy: (policy: IngestedPolicy) => void
  refreshPolicies: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

function toIngestedPolicy(policy: PolicySummary): IngestedPolicy {
  return {
    id: policy.id,
    planName: policy.plan_name,
    geography: policy.geography,
    planType: policy.plan_type,
    ingestedAt: '',
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const [activeSelectedPolicyId, setActiveSelectedPolicyId] = useState('')
  const [ingestedPolicies, setIngestedPolicies] = useState<IngestedPolicy[]>([])
  const [policiesLoading, setPoliciesLoading] = useState(false)

  const refreshPolicies = useCallback(async () => {
    if (!token) {
      setIngestedPolicies([])
      setActiveSelectedPolicyId('')
      return
    }

    setPoliciesLoading(true)
    try {
      const policies = await apiFetch<PolicySummary[]>(API_ENDPOINTS.ingestion.policies, {
        token,
      })
      const mapped = policies.map(toIngestedPolicy)
      setIngestedPolicies(mapped)
      setActiveSelectedPolicyId((current) => {
        if (current && mapped.some((policy) => policy.id === current)) {
          return current
        }
        return mapped[0]?.id ?? ''
      })
    } finally {
      setPoliciesLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIngestedPolicies([])
      setActiveSelectedPolicyId('')
      return
    }

    void refreshPolicies()
  }, [isAuthenticated, token, refreshPolicies])

  const addIngestedPolicy = useCallback((policy: IngestedPolicy) => {
    setIngestedPolicies((prev) => {
      if (prev.some((item) => item.id === policy.id)) {
        return prev
      }
      return [policy, ...prev]
    })
    setActiveSelectedPolicyId(policy.id)
  }, [])

  const value = useMemo(
    () => ({
      activeSelectedPolicyId,
      setActiveSelectedPolicyId,
      ingestedPolicies,
      policiesLoading,
      addIngestedPolicy,
      refreshPolicies,
    }),
    [
      activeSelectedPolicyId,
      ingestedPolicies,
      policiesLoading,
      addIngestedPolicy,
      refreshPolicies,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
