import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAppContext } from '../context/AppContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { API_ENDPOINTS, apiUrl } from '../config/endpoints'
import { formatPolicyLabel } from '../config/planTypes'
import { CLAIM_WIZARD_STEPS } from '../config/userLabels'
import type { AuditReport, ClaimIngestionResponse } from '../types/api'
import { SystemTerminal } from './SystemTerminal'
import { cn } from '../lib/cn'

interface ClaimsAuditDeskProps {
  onAuditComplete: (claimId: string, report: AuditReport) => void
}

export function ClaimsAuditDesk({ onAuditComplete }: ClaimsAuditDeskProps) {
  const { token } = useAuth()
  const { ingestedPolicies, activeSelectedPolicyId } = useAppContext()
  const [policyId, setPolicyId] = useState(activeSelectedPolicyId)
  const [patientName, setPatientName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { connectionStatus, currentStep, streamLogs, auditPayload } = useWebSocket({
    trackingId,
    enabled: Boolean(trackingId),
  })

  const deliveredRef = useRef(false)

  useEffect(() => {
    if (activeSelectedPolicyId) {
      setPolicyId(activeSelectedPolicyId)
    }
  }, [activeSelectedPolicyId])

  useEffect(() => {
    if (auditPayload && currentStep === 'COMPLETE' && !deliveredRef.current && trackingId) {
      deliveredRef.current = true
      onAuditComplete(trackingId, auditPayload)
    }
  }, [auditPayload, currentStep, onAuditComplete, trackingId])

  const activeWizardIndex = CLAIM_WIZARD_STEPS.findIndex((item) => item.step === currentStep)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !token || !policyId) return

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('policy_id', policyId)
      formData.append('patient_name', patientName)
      formData.append('file', file)

      const response = await fetch(apiUrl(API_ENDPOINTS.ingestion.claim), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = (await response.json()) as ClaimIngestionResponse
      setTrackingId(data.claim_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your claim')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Check a Claim</h2>
          <p className="text-sm text-slate-400">
            Upload a claim form and we will check it against your uploaded policy rules.
          </p>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Your policy</span>
            <select
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
            >
              <option value="">Choose a policy...</option>
              {ingestedPolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {formatPolicyLabel(policy.planName, policy.geography, policy.planType)} —{' '}
                  {policy.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Patient name</span>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Claim document</span>
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
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            Check my claim
          </button>
        </form>

        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <h3 className="mb-4 text-sm font-medium text-slate-300">What happens next</h3>
            <div className="space-y-3">
              {CLAIM_WIZARD_STEPS.map((item, index) => {
                const isActive = index === activeWizardIndex
                const isComplete = activeWizardIndex > index || currentStep === 'COMPLETE'
                return (
                  <div key={item.step} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-xs',
                        isComplete && 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
                        isActive && !isComplete && 'border-amber-400/60 bg-amber-500/10 text-amber-300 pulse-amber',
                        !isActive && !isComplete && 'border-slate-600 text-slate-500',
                      )}
                    >
                      {index + 1}
                    </div>
                    <span className={cn('text-sm', isActive ? 'text-slate-100' : 'text-slate-400')}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <SystemTerminal
            title="Progress updates"
            connectionStatus={connectionStatus}
            currentStep={currentStep}
            logs={streamLogs}
          />
        </div>
      </div>
    </div>
  )
}
