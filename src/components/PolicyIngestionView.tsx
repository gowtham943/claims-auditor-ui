import { useEffect, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAppContext } from '../context/AppContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { API_ENDPOINTS, apiUrl } from '../config/endpoints'
import {
  GEOGRAPHY_OPTIONS,
  PLAN_TYPES_BY_GEOGRAPHY,
  getDefaultPlanType,
  type Geography,
  type PlanType,
} from '../config/planTypes'
import type { PolicyIngestionResponse } from '../types/api'
import { SystemTerminal } from './SystemTerminal'
import { cn } from '../lib/cn'

export function PolicyIngestionView() {
  const { token } = useAuth()
  const { refreshPolicies } = useAppContext()
  const [planName, setPlanName] = useState('')
  const [geography, setGeography] = useState<Geography>('INDIA')
  const [planType, setPlanType] = useState<PlanType>(getDefaultPlanType('INDIA'))
  const [file, setFile] = useState<File | null>(null)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { connectionStatus, currentStep, streamLogs } = useWebSocket({
    trackingId,
    enabled: Boolean(trackingId),
  })

  useEffect(() => {
    setPlanType(getDefaultPlanType(geography))
  }, [geography])

  useEffect(() => {
    if (currentStep === 'COMPLETE') {
      void refreshPolicies()
    }
  }, [currentStep, refreshPolicies])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !token) return

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('plan_name', planName)
      formData.append('geography', geography)
      formData.append('plan_type', planType)
      formData.append('source_url', '')
      formData.append('file', file)

      const response = await fetch(apiUrl(API_ENDPOINTS.ingestion.policy), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = (await response.json()) as PolicyIngestionResponse
      setTrackingId(data.policy_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload your policy')
    } finally {
      setSubmitting(false)
    }
  }

  const planOptions = PLAN_TYPES_BY_GEOGRAPHY[geography]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">Upload Policy</h2>
        <p className="text-sm text-slate-400">
          Upload your health insurance policy so claims can be checked against it later.
        </p>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Plan Name</span>
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Geography</span>
          <select
            value={geography}
            onChange={(e) => setGeography(e.target.value as Geography)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
          >
            {GEOGRAPHY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Plan Scheme</span>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value as PlanType)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
          >
            {planOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.description}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Policy Document</span>
          <input
            type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.tif,.tiff"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="w-full rounded-lg border border-dashed border-slate-600 bg-slate-900/50 px-3 py-3 text-slate-300"
          />
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60',
          )}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          Submit Policy
        </button>
      </form>

      <SystemTerminal
        title="Upload progress"
        connectionStatus={connectionStatus}
        currentStep={currentStep}
        logs={streamLogs}
      />
    </div>
  )
}
